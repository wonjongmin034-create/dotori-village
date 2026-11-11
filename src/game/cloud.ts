import { supabase } from './supabase'
import { TOWER_TESTERS } from './towerData'
import {
  useVillage,
  registerCloudHook,
  type PlacedItem,
  type Session,
  type Mission,
  type DailyResult,
} from './store'
import { DAILY_PER_SUBJECT } from './economy'
import { dailySet, sanitizeQuestions, type Question } from './questions'
import { refreshSheets, resetSheets } from './sheets'
import { sanitizeLunch, type ClassLunch } from './lunch'
import { pollControl, resetControl, clearRejoinFlag } from './classControl'
import { syncServerClock } from './serverClock'

const SESSION_KEY = 'dotori.session.v1'
const TEACHER_KEY = 'dotori.teacher.v1'

/* ---------- 세션 (반 코드 + 이름) ---------- */

export function loadLocalSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as Partial<Session>
    if (s && typeof s.classCode === 'string' && typeof s.name === 'string') {
      return { classCode: s.classCode, name: s.name }
    }
  } catch {
    /* noop */
  }
  return null
}

function saveLocalSession(s: Session | null) {
  try {
    if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s))
    else localStorage.removeItem(SESSION_KEY)
  } catch {
    /* noop */
  }
}

export function loadLocalTeacher(): string | null {
  try {
    return localStorage.getItem(TEACHER_KEY)
  } catch {
    return null
  }
}
function saveLocalTeacher(code: string | null) {
  try {
    if (code) localStorage.setItem(TEACHER_KEY, code)
    else localStorage.removeItem(TEACHER_KEY)
  } catch {
    /* noop */
  }
}

/* ---------- 로그인 / 불러오기 ---------- */

async function ensureClass(code: string) {
  await supabase.from('classes').upsert({ code }, { onConflict: 'code', ignoreDuplicates: true })
}

export type LoginResult = { ok: true } | { ok: false; error: 'pin' | 'network' }

let last = { coins: -1, items: null as PlacedItem[] | null, homework: ' ' }
function snapshotNow() {
  const s = useVillage.getState()
  last = { coins: s.coins, items: s.items, homework: s.homework }
}

let quizCorrect = 0
let quizWrong = 0

export async function login(
  classCode: string,
  name: string,
  pin: string,
): Promise<LoginResult> {
  const code = classCode.trim()
  const who = name.trim()
  if (!code || !who) return { ok: false, error: 'network' }

  try {
    await ensureClass(code)

    void syncServerClock()
    const { data: existing, error } = await selectMine(code, who, 'coins, items, pin, quiz_correct, quiz_wrong')

    if (error) return { ok: false, error: 'network' }

    if (existing) {
      if ((existing.pin || '') === '' && pin !== '') {
        // 선생님이 비밀번호를 초기화한 계정(비어 있음): 처음 입력한 번호가 새 비밀번호가 된다
        // (.eq('pin', '') 로 "아직 비어 있을 때만" 바꾼다 — 동시에 두 명이 눌러도 먼저 한 쪽만 정해진다)
        const { data: set, error: upErr } = await supabase
          .from('villages')
          .update({ pin })
          .eq('class_code', code)
          .eq('name', who)
          .eq('pin', '')
          .select('pin')
        if (upErr) return { ok: false, error: 'network' }
        if (!set || set.length === 0) return { ok: false, error: 'pin' } // 그 사이 다른 번호로 정해졌다
      } else if ((existing.pin || '') !== pin) return { ok: false, error: 'pin' }
      quizCorrect = Number(existing.quiz_correct) || 0
      quizWrong = Number(existing.quiz_wrong) || 0
      useVillage.getState().hydrateFromCloud(
        typeof existing.coins === 'number' ? existing.coins : 30,
        Array.isArray(existing.items) ? (existing.items as PlacedItem[]) : [],
      )
      rememberRev(existing)
    } else {
      const st = useVillage.getState()
      const { error: insErr } = await supabase.from('villages').insert({
        class_code: code,
        name: who,
        pin,
        coins: st.coins,
        items: st.items,
      })
      if (insErr) return { ok: false, error: 'network' }
      rev = revOn ? 0 : null // 새로 만든 마을은 0번부터
      quizCorrect = 0
      quizWrong = 0
    }

    const session: Session = { classCode: code, name: who }
    await refreshClass(code)
    saveLocalSession(session)
    snapshotNow()
    void markSeen()
    useVillage.setState({ session, cloud: 'synced' })
    startPolling()
    void pollGrants()
    void refreshSheets()
    void pollControl()
    return { ok: true }
  } catch {
    return { ok: false, error: 'network' }
  }
}

export async function resume(session: Session): Promise<'in' | 'login'> {
  try {
    void syncServerClock()
    const { data, error } = await selectMine(session.classCode, session.name, 'coins, items, quiz_correct, quiz_wrong')

    if (error) {
      useVillage.setState({ session, cloud: 'offline' })
      startPolling()
      return 'in'
    }
    if (!data) return 'login'

    quizCorrect = Number(data.quiz_correct) || 0
    quizWrong = Number(data.quiz_wrong) || 0
    useVillage.getState().hydrateFromCloud(
      typeof data.coins === 'number' ? data.coins : 30,
      Array.isArray(data.items) ? (data.items as PlacedItem[]) : [],
    )
    rememberRev(data)
    await refreshClass(session.classCode)
    snapshotNow()
    void markSeen()
    useVillage.setState({ session, cloud: 'synced' })
    startPolling()
    void pollGrants()
    void refreshSheets()
    void pollControl()
    return 'in'
  } catch {
    useVillage.setState({ session, cloud: 'offline' })
    startPolling()
    return 'in'
  }
}

export function logout() {
  saveLocalSession(null)
  rev = null
  stopPolling()
  resetControl()
  clearRejoinFlag()
  resetSheets()
  useVillage.getState().setVisiting(null)
  useVillage.setState({ session: null, cloud: 'local', plaza: null, bossRoom: null, raidRoom: false })
}

/* ---------- 마을 상태 밀어올리기 ---------- */

// 같은 학생이 여러 기기(학교 크롬북·집 태블릿)나 여러 창에서 들어와도 서로 덮어쓰지 않게 "판 번호(rev)"를 쓴다.
//  · 서버의 rev 는 도토리나 마을이 바뀔 때마다 서버가 1씩 올린다 (supabase/schema-13 의 트리거 — 선생님의 복원도 포함).
//  · 내가 마지막으로 맞춘 rev 와 서버 rev 가 같을 때만 저장한다. 다르면 다른 곳에서 먼저 바뀐 것 → 덮어쓰지 않고 서버 값을 다시 받는다.
//  · 저장은 한 번에 하나씩만 보낸다 (내 저장끼리 부딪히지 않게).
//  · schema-13 을 실행하기 전(rev 칸이 없음)에는 예전처럼 그냥 저장한다.
let pushTimer: ReturnType<typeof setTimeout> | null = null
let rev: number | null = null // 마지막으로 서버와 맞춘 판 번호 (null = 모름)
let revOn = true // 서버에 rev 칸이 있는지
let pushing: Promise<boolean> | null = null
let pushAgain = false

type Row = Record<string, unknown>
type Err = { code?: string; message?: string } | null
// rev 칸이 아직 없을 때 서버가 돌려주는 오류 (schema-13 실행 전)
const missingRev = (e: Err) => !!e && (e.code === '42703' || (/column/i.test(e.message ?? '') && /\brev\b/.test(e.message ?? '')))

function rememberRev(row: Row | null | undefined) {
  if (row && typeof row.rev === 'number') rev = row.rev
}

// 내 마을 한 줄을 읽는다 (rev 칸이 있으면 함께)
async function selectMine(classCode: string, name: string, cols: string): Promise<{ data: Row | null; error: Err }> {
  if (revOn) {
    const r = await supabase.from('villages').select(`${cols}, rev`).eq('class_code', classCode).eq('name', name).maybeSingle()
    if (!r.error || !missingRev(r.error)) return { data: (r.data as Row | null) ?? null, error: r.error }
    revOn = false
    rev = null
  }
  const r = await supabase.from('villages').select(cols).eq('class_code', classCode).eq('name', name).maybeSingle()
  return { data: (r.data as Row | null) ?? null, error: r.error }
}

async function pushVillage(): Promise<boolean> {
  if (pushing) {
    pushAgain = true
    return pushing
  }
  pushing = pushOnce()
  try {
    return await pushing
  } finally {
    pushing = null
    if (pushAgain) {
      pushAgain = false
      void pushVillage()
    }
  }
}

async function pushOnce(): Promise<boolean> {
  const { session, coins, items } = useVillage.getState()
  if (!session) return false
  try {
    const q = supabase
      .from('villages')
      .update({ coins, items, updated_at: new Date().toISOString() })
      .eq('class_code', session.classCode)
      .eq('name', session.name)
    if (revOn && rev !== null) {
      const { data, error } = await q.eq('rev', rev).select('rev')
      if (error) {
        if (missingRev(error)) {
          revOn = false
          rev = null
          return pushOnce()
        }
        useVillage.setState({ cloud: 'offline' })
        return false
      }
      if (!data || data.length === 0) {
        // 다른 기기·창에서 먼저 바뀌었다 → 덮어쓰지 않는다
        await reloadFromCloud('conflict')
        return false
      }
      rememberRev(data[0] as Row)
      useVillage.setState({ cloud: 'synced' })
      return true
    }
    const { error } = await q
    useVillage.setState({ cloud: error ? 'offline' : 'synced' })
    return !error
  } catch {
    useVillage.setState({ cloud: 'offline' })
    return false
  }
}

// 서버에 저장된 내 마을로 화면을 맞춘다
async function reloadFromCloud(why: 'conflict' | 'remote'): Promise<boolean> {
  const s = useVillage.getState()
  if (!s.session) return false
  const { data, error } = await selectMine(s.session.classCode, s.session.name, 'coins, items')
  if (error || !data) {
    useVillage.setState({ cloud: 'offline' })
    return false
  }
  if (pushTimer) {
    clearTimeout(pushTimer)
    pushTimer = null
  }
  applyMine(data)
  rememberRev(data)
  snapshotNow()
  useVillage.setState({ cloud: 'synced' })
  useVillage
    .getState()
    .flash(
      why === 'conflict'
        ? '다른 기기(또는 다른 창)에서 바뀐 내용이 있어서 새로 불러왔어요. 방금 한 일이 안 보이면 한 번 더 해 주세요'
        : '다른 기기에서 바뀐 내용을 불러왔어요',
    )
  return true
}

// 다른 기기에서 바뀌었는지 가볍게 확인한다 (판 번호만 읽는다). 내가 보낼 게 남아 있으면 건너뛴다 — 저장할 때 알아서 확인된다.
async function checkRemote() {
  const s = useVillage.getState()
  if (!s.session || !revOn || rev === null || pushTimer || pushing) return
  try {
    const { data, error } = await supabase.from('villages').select('rev').eq('class_code', s.session.classCode).eq('name', s.session.name).maybeSingle()
    if (error || !data || typeof data.rev !== 'number' || data.rev === rev) return
    if (pushTimer || pushing) return
    await reloadFromCloud('remote')
  } catch {
    /* noop */
  }
}
function queueVillagePush() {
  if (pushTimer) clearTimeout(pushTimer)
  pushTimer = setTimeout(() => {
    pushTimer = null
    void pushVillage()
  }, 1500)
}

// 학생이 "새로 불러오기"를 눌렀을 때: 아직 못 보낸 내 변경이 있으면 먼저 보내고, 서버에 저장된 도토리·기록을 다시 받아 화면을 맞춘다.
// 보내기에 실패하면(인터넷 문제) 서버의 옛 값으로 덮어쓰지 않도록 불러오지 않는다.
export type RefreshResult = 'ok' | 'offline' | 'nosession'
export async function refreshMine(): Promise<RefreshResult> {
  const s = useVillage.getState()
  if (!s.session) return 'nosession'
  try {
    if (pushTimer) {
      clearTimeout(pushTimer)
      pushTimer = null
      if (!(await pushVillage())) return 'offline'
    }
    if (pushing) await pushing
    const { data, error } = await selectMine(s.session.classCode, s.session.name, 'coins, items')
    if (error || !data) return 'offline'
    applyMine(data)
    rememberRev(data)
    snapshotNow()
    useVillage.setState({ cloud: 'synced' })
    void pollGrants()
    void pollControl()
    return 'ok'
  } catch {
    useVillage.setState({ cloud: 'offline' })
    return 'offline'
  } finally {
    void refreshClass(s.session.classCode)
  }
}
function applyMine(data: { coins?: unknown; items?: unknown }) {
  useVillage.getState().hydrateFromCloud(typeof data.coins === 'number' ? data.coins : 30, Array.isArray(data.items) ? (data.items as PlacedItem[]) : [])
}

async function markSeen() {
  const { session } = useVillage.getState()
  if (!session) return
  try {
    await supabase
      .from('villages')
      .update({ last_seen: new Date().toISOString() })
      .eq('class_code', session.classCode)
      .eq('name', session.name)
  } catch {
    /* noop */
  }
}

/* ---------- 반 설정 (숙제 · 강화 잠금 · 미션) ---------- */

// questions 컬럼은 schema-3 실행 전에는 없을 수 있다 → 따로 조회하고 실패해도 무시.
export async function fetchClassQuestions(classCode: string): Promise<Question[]> {
  try {
    const { data, error } = await supabase
      .from('classes')
      .select('questions')
      .eq('code', classCode)
      .maybeSingle()
    if (error || !data) return []
    return sanitizeQuestions(data.questions)
  } catch {
    return []
  }
}

// lunch 컬럼도 schema-5 실행 전에는 없을 수 있어 따로 조회하고 실패하면 빈 값.
export async function fetchClassLunch(classCode: string): Promise<ClassLunch> {
  try {
    const { data, error } = await supabase
      .from('classes')
      .select('lunch')
      .eq('code', classCode)
      .maybeSingle()
    if (error || !data) return {}
    return sanitizeLunch(data.lunch)
  } catch {
    return {}
  }
}

export async function refreshClass(classCode: string) {
  try {
    const { data, error } = await supabase
      .from('classes')
      .select('homework, arcade_enabled, mission')
      .eq('code', classCode)
      .maybeSingle()
    if (error || !data) return
    if (typeof data.homework === 'string') {
      useVillage.getState().hydrateHomework(data.homework)
      last.homework = data.homework
    }
    const m = data.mission && typeof data.mission === 'object' ? (data.mission as Partial<Mission>) : null
    useVillage.getState().setClassConfig({
      arcadeEnabled: data.arcade_enabled !== false,
      mission:
        m && typeof m.text === 'string' && m.text
          ? { text: m.text, reward: typeof m.reward === 'number' ? m.reward : 0, done: Array.isArray(m.done) ? m.done : [] }
          : null,
      questions: await fetchClassQuestions(classCode),
      lunch: await fetchClassLunch(classCode),
    })
  } catch {
    /* noop */
  }
}

async function pushHomework() {
  const { session, homework } = useVillage.getState()
  if (!session) return
  try {
    await supabase
      .from('classes')
      .update({ homework, updated_at: new Date().toISOString() })
      .eq('code', session.classCode)
  } catch {
    /* noop */
  }
}

/* ---------- 선생님이 준 도토리 받기 ---------- */

async function pollGrants() {
  const { session } = useVillage.getState()
  if (!session) return
  try {
    // 최근 7일치 지급을 확인. 중복 적용은 consumed_by로 막는다.
    const since = new Date(Date.now() - 7 * 86400_000).toISOString()
    const { data, error } = await supabase
      .from('grants')
      .select('id, student, amount, reason, consumed_by, created_at')
      .eq('class_code', session.classCode)
      .gt('created_at', since)
      .order('created_at', { ascending: true })
    if (error || !data) return
    for (const g of data) {
      const forMe = g.student === '*' || g.student === session.name
      const already = Array.isArray(g.consumed_by) && g.consumed_by.includes(session.name)
      if (!forMe || already) continue
      useVillage.getState().grantCoins(g.amount, g.reason || '')
      await supabase
        .from('grants')
        .update({ consumed_by: [...(g.consumed_by || []), session.name] })
        .eq('id', g.id)
    }
  } catch {
    /* noop */
  }
}

/* ---------- 학습 기록 ---------- */

export async function pushQuizStat(correct: boolean) {
  const { session } = useVillage.getState()
  if (!session) return
  if (correct) quizCorrect++
  else quizWrong++
  try {
    await supabase
      .from('villages')
      .update({ quiz_correct: quizCorrect, quiz_wrong: quizWrong })
      .eq('class_code', session.classCode)
      .eq('name', session.name)
  } catch {
    /* noop */
  }
}

/* ---------- 폴링 ---------- */

let poll: ReturnType<typeof setInterval> | null = null
let ctlPoll: ReturnType<typeof setInterval> | null = null
function startPolling() {
  stopPolling()
  clearRejoinFlag() // 들어왔으니 "다시 접속" 표시는 끝
  // 선생님의 "광장 닫기 / 전원 다시 접속" 신호는 빨리 받아야 해서 따로 10초마다 (가벼운 요청 1개)
  ctlPoll = setInterval(() => void pollControl(), 10_000)
  poll = setInterval(() => {
    const s = useVillage.getState()
    if (!s.session) return
    void refreshClass(s.session.classCode)
    void pollGrants()
    void refreshSheets()
    void markSeen()
    void checkRemote()
    void syncServerClock()
  }, 45_000)
}
function stopPolling() {
  if (poll) clearInterval(poll)
  poll = null
  if (ctlPoll) clearInterval(ctlPoll)
  ctlPoll = null
}

/* ---------- 저장 훅 ---------- */

registerCloudHook((coins, items, homework) => {
  if (!useVillage.getState().session) return
  if (coins !== last.coins || items !== last.items) queueVillagePush()
  if (homework !== last.homework) pushHomework()
  last = { coins, items, homework }
})

if (typeof document !== 'undefined') {
  // 다른 창·앱을 보다가 돌아오면 다른 기기에서 바뀐 게 있는지 바로 확인한다
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      void checkRemote()
      void syncServerClock()
    }
  })
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (pushTimer) {
      clearTimeout(pushTimer)
      void pushVillage()
    }
  })
}

/* ================= 선생님 대시보드 ================= */

export type TeacherLogin = 'ok' | 'pin' | 'network'

export async function teacherLogin(classCode: string, pin: string): Promise<TeacherLogin> {
  const code = classCode.trim()
  if (!code) return 'network'
  try {
    await ensureClass(code)
    const { data, error } = await supabase
      .from('classes')
      .select('teacher_pin')
      .eq('code', code)
      .maybeSingle()
    if (error) return 'network'
    if ((data?.teacher_pin ?? '1234') !== pin) return 'pin'
    saveLocalTeacher(code)
    return 'ok'
  } catch {
    return 'network'
  }
}

export function teacherLogout() {
  saveLocalTeacher(null)
}

export type DailyStatus = {
  day: string
  idx: number
  total: number
  score: number
  claimed: boolean
}
export type StudentRow = {
  name: string
  coins: number
  houseLevel: number
  quizCorrect: number
  quizWrong: number
  lastSeen: string | null
  daily: DailyStatus | null
  dailyPicks: Record<string, number> // 오늘 문제 id → 고른 보기
  learnLog: DailyResult[] // 지난 날 학습 결과
}
export type ClassData = {
  homework: string
  arcadeEnabled: boolean
  mission: Mission | null
  teacherPin: string
  customQuestions: Question[]
  students: StudentRow[]
}

export async function teacherFetch(classCode: string): Promise<ClassData | null> {
  try {
    const [{ data: cls }, { data: vs }] = await Promise.all([
      supabase
        .from('classes')
        .select('homework, arcade_enabled, mission, teacher_pin')
        .eq('code', classCode)
        .maybeSingle(),
      supabase
        .from('villages')
        .select('name, coins, items, quiz_correct, quiz_wrong, last_seen')
        .eq('class_code', classCode)
        .order('name', { ascending: true }),
    ])
    if (!cls) return null
    const m = cls.mission && typeof cls.mission === 'object' ? (cls.mission as Partial<Mission>) : null
    const customQuestions = await fetchClassQuestions(classCode)
    const students: StudentRow[] = (vs ?? []).map((v) => {
      const items = Array.isArray(v.items) ? (v.items as PlacedItem[]) : []
      const house = items.find((i) => i.type === 'house')
      const d = house?.daily
      const log = house?.learnLog
      const picks =
        d && d.picks && typeof d.picks === 'object' ? (d.picks as Record<string, number>) : {}
      const daily: DailyStatus | null =
        d && typeof d.day === 'string'
          ? {
              day: d.day,
              idx: d.idx ?? 0,
              total: dailySet(d.day, DAILY_PER_SUBJECT, customQuestions).length,
              score: d.score ?? 0,
              claimed: !!d.claimed,
            }
          : null
      return {
        name: v.name,
        coins: v.coins ?? 0,
        houseLevel: house?.level ?? 1,
        quizCorrect: v.quiz_correct ?? 0,
        quizWrong: v.quiz_wrong ?? 0,
        lastSeen: v.last_seen ?? null,
        daily,
        dailyPicks: picks,
        learnLog: Array.isArray(log) ? (log as DailyResult[]) : [],
      }
    })
    return {
      homework: cls.homework ?? '',
      arcadeEnabled: cls.arcade_enabled !== false,
      teacherPin: cls.teacher_pin ?? '1234',
      mission:
        m && typeof m.text === 'string' && m.text
          ? { text: m.text, reward: typeof m.reward === 'number' ? m.reward : 0, done: Array.isArray(m.done) ? m.done : [] }
          : null,
      customQuestions,
      students,
    }
  } catch {
    return null
  }
}

export async function teacherGrant(
  classCode: string,
  students: string[], // 빈 배열 = 반 전체
  amount: number,
  reason: string,
) {
  const rows =
    students.length === 0
      ? [{ class_code: classCode, student: '*', amount, reason }]
      : students.map((s) => ({ class_code: classCode, student: s, amount, reason }))
  await supabase.from('grants').insert(rows)
}

export async function teacherSetHomework(classCode: string, text: string) {
  await supabase
    .from('classes')
    .update({ homework: text, updated_at: new Date().toISOString() })
    .eq('code', classCode)
}

// 선생님 화면용: 컬럼이 없으면 'missing' (schema-5 실행 안내를 띄우기 위해)
export async function teacherFetchLunch(classCode: string): Promise<ClassLunch | 'missing'> {
  try {
    const { data, error } = await supabase
      .from('classes')
      .select('lunch')
      .eq('code', classCode)
      .maybeSingle()
    if (error || !data) return 'missing'
    return sanitizeLunch(data.lunch)
  } catch {
    return 'missing'
  }
}

export async function teacherSetLunch(classCode: string, lunch: ClassLunch): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('classes')
      .update({ lunch, updated_at: new Date().toISOString() })
      .eq('code', classCode)
    return !error
  } catch {
    return false
  }
}

export async function teacherSetQuestions(
  classCode: string,
  questions: Question[],
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('classes')
      .update({ questions, updated_at: new Date().toISOString() })
      .eq('code', classCode)
    return !error
  } catch {
    return false
  }
}

export async function teacherSetMission(classCode: string, mission: Mission | null) {
  await supabase
    .from('classes')
    .update({ mission: mission ?? {}, updated_at: new Date().toISOString() })
    .eq('code', classCode)
}

export async function teacherToggleArcade(classCode: string, enabled: boolean) {
  await supabase.from('classes').update({ arcade_enabled: enabled }).eq('code', classCode)
}

/* ---------- 선생님 비밀번호 · 학생 계정 관리 ---------- */

export type PinChange = 'ok' | 'wrong' | 'weak' | 'network'

// 선생님 비밀번호 바꾸기 (지금 비밀번호를 다시 확인한다)
export async function teacherChangePin(classCode: string, current: string, next: string): Promise<PinChange> {
  const n = next.trim()
  if (n.length < 4 || n === '1234' || n === current.trim()) return 'weak'
  try {
    const { data, error } = await supabase.from('classes').select('teacher_pin').eq('code', classCode).maybeSingle()
    if (error || !data) return 'network'
    if ((data.teacher_pin ?? '1234') !== current.trim()) return 'wrong'
    const { error: e2 } = await supabase
      .from('classes')
      .update({ teacher_pin: n, updated_at: new Date().toISOString() })
      .eq('code', classCode)
    return e2 ? 'network' : 'ok'
  } catch {
    return 'network'
  }
}

// 이름이 적혀 있는 목록(최근 도토리 지급의 "받은 사람", 공동 미션의 "완료한 사람")에서 이름을 바꾸거나(to) 지운다(null)
async function replaceNameInLists(classCode: string, from: string, to: string | null) {
  const since = new Date(Date.now() - 8 * 86400_000).toISOString()
  const { data: gs } = await supabase.from('grants').select('id, consumed_by').eq('class_code', classCode).gt('created_at', since)
  for (const g of gs ?? []) {
    const list = Array.isArray(g.consumed_by) ? (g.consumed_by as string[]) : []
    if (!list.includes(from)) continue
    const next = to ? list.map((n) => (n === from ? to : n)) : list.filter((n) => n !== from)
    await supabase.from('grants').update({ consumed_by: next }).eq('id', g.id)
  }
  const { data: c } = await supabase.from('classes').select('mission').eq('code', classCode).maybeSingle()
  const m = c?.mission as { done?: string[] } | null | undefined
  if (m && Array.isArray(m.done) && m.done.includes(from)) {
    const done = to ? m.done.map((n) => (n === from ? to : n)) : m.done.filter((n) => n !== from)
    await supabase.from('classes').update({ mission: { ...m, done } }).eq('code', classCode)
  }
}

export type RenameResult = 'ok' | 'invalid' | 'exists' | 'missing' | 'network'

// 학생 닉네임 바꾸기: 마을·오목 기록·탑 순위·학습지 제출·도토리 지급 기록의 이름을 모두 새 이름으로
export async function teacherRenameStudent(classCode: string, oldName: string, newName: string): Promise<RenameResult> {
  return renameAccount(classCode, oldName, newName)
}

async function renameAccount(classCode: string, oldName: string, newName: string): Promise<RenameResult> {
  const to = newName.trim()
  if (!to || to.length > 12 || to === '*' || to === oldName || /[\r\n]/.test(to)) return 'invalid'
  try {
    const { data: dup } = await supabase.from('villages').select('name').eq('class_code', classCode).eq('name', to).maybeSingle()
    if (dup) return 'exists'
    const { data, error } = await supabase
      .from('villages')
      .update({ name: to })
      .eq('class_code', classCode)
      .eq('name', oldName)
      .select('name')
    if (error) return 'network'
    if (!data || data.length === 0) return 'missing'
    // 계정 이름은 이미 바뀌었으니, 나머지 기록은 일부 실패해도 계속 진행
    await Promise.allSettled([
      supabase.from('omok_stats').update({ student: to }).eq('class_code', classCode).eq('student', oldName),
      supabase.from('tower_stats').update({ student: to }).eq('class_code', classCode).eq('student', oldName),
      supabase.from('submissions').update({ student: to }).eq('class_code', classCode).eq('student', oldName),
      supabase.from('grants').update({ student: to }).eq('class_code', classCode).eq('student', oldName),
      replaceNameInLists(classCode, oldName, to),
    ])
    return 'ok'
  } catch {
    return 'network'
  }
}

/* ---------- 학생이 스스로 닉네임 바꾸기 ---------- */
export const RESERVED_NAMES = ['선생님', '관리자', ...TOWER_TESTERS]
export type SelfRenameResult = RenameResult | 'cooldown' | 'reserved'

// 닉네임은 한 달(달력 기준)에 한 번만 바꿀 수 있다. 이번 달에 이미 바꿨으면 다음 달 1일 0시를 돌려주고, 바꿀 수 있으면 0.
export function nextNameChangeAt(now = new Date()): number {
  const at = useVillage.getState().items.find((i) => i.type === 'house')?.nameAt ?? 0
  if (!at) return 0
  const d = new Date(at)
  const sameMonth = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  return sameMonth ? new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime() : 0
}

export async function renameSelf(newName: string): Promise<SelfRenameResult> {
  const v = useVillage.getState()
  const s = v.session
  if (!s) return 'missing'
  const to = newName.trim()
  if (RESERVED_NAMES.includes(to)) return 'reserved'
  if (nextNameChangeAt()) return 'cooldown'
  const r = await renameAccount(s.classCode, s.name, to)
  if (r !== 'ok') return r
  // 서버의 이름이 바뀌었으니 이 기기의 로그인 정보도 새 이름으로 (실시간 방에는 새 이름으로 다시 들어간다)
  const session: Session = { classCode: s.classCode, name: to }
  saveLocalSession(session)
  useVillage.getState().setSession(session)
  useVillage.getState().markNameChanged()
  return 'ok'
}

// 학생 계정 삭제: 마을과 그 학생의 오목 기록·학습지 제출·개인 지급 기록까지 모두 지운다 (되돌릴 수 없음)
export async function teacherDeleteStudent(classCode: string, name: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('villages').delete().eq('class_code', classCode).eq('name', name)
    if (error) return false
    await Promise.allSettled([
      supabase.from('omok_stats').delete().eq('class_code', classCode).eq('student', name),
      supabase.from('tower_stats').delete().eq('class_code', classCode).eq('student', name),
      supabase.from('submissions').delete().eq('class_code', classCode).eq('student', name),
      supabase.from('grants').delete().eq('class_code', classCode).eq('student', name),
      replaceNameInLists(classCode, name, null),
    ])
    return true
  } catch {
    return false
  }
}

// 학생 비밀번호를 비운다 → 그 학생이 다음에 로그인할 때 입력한 번호가 새 비밀번호가 된다
export async function teacherResetPin(classCode: string, student: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('villages')
      .update({ pin: '' })
      .eq('class_code', classCode)
      .eq('name', student)
      .select('name')
    return !error && !!data && data.length > 0
  } catch {
    return false
  }
}

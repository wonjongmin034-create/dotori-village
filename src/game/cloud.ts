import { supabase } from './supabase'
import {
  useVillage,
  registerCloudHook,
  type PlacedItem,
  type Session,
  type Mission,
  type DailyResult,
} from './store'
import { DAILY_PER_SUBJECT } from './economy'
import { dailySet } from './questions'

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

    const { data: existing, error } = await supabase
      .from('villages')
      .select('coins, items, pin, quiz_correct, quiz_wrong')
      .eq('class_code', code)
      .eq('name', who)
      .maybeSingle()

    if (error) return { ok: false, error: 'network' }

    if (existing) {
      if ((existing.pin || '') !== pin) return { ok: false, error: 'pin' }
      quizCorrect = existing.quiz_correct ?? 0
      quizWrong = existing.quiz_wrong ?? 0
      useVillage.getState().hydrateFromCloud(
        typeof existing.coins === 'number' ? existing.coins : 30,
        Array.isArray(existing.items) ? (existing.items as PlacedItem[]) : [],
      )
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
    return { ok: true }
  } catch {
    return { ok: false, error: 'network' }
  }
}

export async function resume(session: Session): Promise<'in' | 'login'> {
  try {
    const { data, error } = await supabase
      .from('villages')
      .select('coins, items, quiz_correct, quiz_wrong')
      .eq('class_code', session.classCode)
      .eq('name', session.name)
      .maybeSingle()

    if (error) {
      useVillage.setState({ session, cloud: 'offline' })
      startPolling()
      return 'in'
    }
    if (!data) return 'login'

    quizCorrect = data.quiz_correct ?? 0
    quizWrong = data.quiz_wrong ?? 0
    useVillage.getState().hydrateFromCloud(
      typeof data.coins === 'number' ? data.coins : 30,
      Array.isArray(data.items) ? (data.items as PlacedItem[]) : [],
    )
    await refreshClass(session.classCode)
    snapshotNow()
    void markSeen()
    useVillage.setState({ session, cloud: 'synced' })
    startPolling()
    void pollGrants()
    return 'in'
  } catch {
    useVillage.setState({ session, cloud: 'offline' })
    startPolling()
    return 'in'
  }
}

export function logout() {
  saveLocalSession(null)
  stopPolling()
  useVillage.setState({ session: null, cloud: 'local' })
}

/* ---------- 마을 상태 밀어올리기 ---------- */

let pushTimer: ReturnType<typeof setTimeout> | null = null
async function pushVillage() {
  const { session, coins, items } = useVillage.getState()
  if (!session) return
  try {
    const { error } = await supabase
      .from('villages')
      .update({ coins, items, updated_at: new Date().toISOString() })
      .eq('class_code', session.classCode)
      .eq('name', session.name)
    useVillage.setState({ cloud: error ? 'offline' : 'synced' })
  } catch {
    useVillage.setState({ cloud: 'offline' })
  }
}
function queueVillagePush() {
  if (pushTimer) clearTimeout(pushTimer)
  pushTimer = setTimeout(pushVillage, 1500)
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
function startPolling() {
  stopPolling()
  poll = setInterval(() => {
    const s = useVillage.getState()
    if (!s.session) return
    void refreshClass(s.session.classCode)
    void pollGrants()
    void markSeen()
  }, 45_000)
}
function stopPolling() {
  if (poll) clearInterval(poll)
  poll = null
}

/* ---------- 저장 훅 ---------- */

registerCloudHook((coins, items, homework) => {
  if (!useVillage.getState().session) return
  if (coins !== last.coins || items !== last.items) queueVillagePush()
  if (homework !== last.homework) pushHomework()
  last = { coins, items, homework }
})

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
              total: dailySet(d.day, DAILY_PER_SUBJECT).length,
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

export async function teacherSetMission(classCode: string, mission: Mission | null) {
  await supabase
    .from('classes')
    .update({ mission: mission ?? {}, updated_at: new Date().toISOString() })
    .eq('code', classCode)
}

export async function teacherToggleArcade(classCode: string, enabled: boolean) {
  await supabase.from('classes').update({ arcade_enabled: enabled }).eq('code', classCode)
}

export async function teacherResetPin(classCode: string, student: string) {
  await supabase
    .from('villages')
    .update({ pin: '' })
    .eq('class_code', classCode)
    .eq('name', student)
}

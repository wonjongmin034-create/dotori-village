import { create } from 'zustand'
import { Deck } from './bossQuestions'
import { ANSWER_GRACE_MS, MAX_PARTY, MIN_PARTY, RESULT_MS, dmgOf, soloTest, stageOf, STAGES, type StageId } from './bossData'

// 보스전 — 광장 오목과 같은 방식: "방장"(방에 제일 먼저 들어온 사람)이 판을 혼자 관리한다.
//   · 다른 사람이 고른 답은 방장에게 보내고, 방장이 맞는지 따져서 결과를 방 전체에 알린다.
//   · 정답은 방장만 알고 있다 (문제를 내보낼 때는 정답 번호를 빼고 보낸다).
//   · 서버 메시지를 아끼려고 "문제가 나갈 때 / 답이 올 때 / 결과가 나올 때"만 보낸다. 시간은 매초 알리지 않고 제한 시간만 알린다.
//   · 이 방은 최대 4명이라 메시지가 아주 적다.

export type Member = { n: string; cl: number; wf: string | null; wt: number } // 이름, 클리어한 단계, 무기 종류, 무기 단계
export type Phase = 'intro' | 'ask' | 'result' | 'won' | 'lost' | 'aborted'
export type LastHit = { who: string; ok: boolean; dmg: number; pick: number; a: number; fam: string | null; tier: number; timeout: boolean }

export type BossGame = {
  gid: number
  host: string
  stage: StageId
  members: Member[] // 전투 시작 때의 팀 (차례 순서)
  hp: number
  maxHp: number
  life: number
  maxLife: number
  n: number // 지금까지 낸 문제 수
  who: string // 이번 문제를 푸는 사람
  q: { t: string; o: string[]; sub?: string } | null
  ms: number // 이번 문제 제한 시간
  qa: number // 이 단계가 시작된 시각 (방장 시계)
  phase: Phase
  end: 'won' | 'lost' | null // 결과 연출이 끝나면 이렇게 끝난다
  last: LastHit | null
  seq: number // 연출이 바뀔 때마다 1씩 늘어난다 (화면이 한 번만 반응하게)
}

export type BossPayload =
  | { k: 'st'; g: BossGame }
  | { k: 'ans'; gid: number; i: number; n: string; p: number }
  | { k: 'lb'; stage: number }
  | { k: 'rs' } // 끝난 판을 치우고 대기실로 돌아간다 (방장이 보낸다)

export type BossResult = { gid: number; won: boolean; stage: number; coins: number; note: string }

type IO = { send: (p: BossPayload) => void; track: () => void }

type BossState = {
  roster: Member[] // 지금 이 방에 있는 사람들 (들어온 순서)
  host: string | null
  game: BossGame | null
  lobbyStage: number // 방장이 고른 단계
  rcv: number // 문제를 받은(방장은 낸) 시각 — 남은 시간 표시용 (내 시계)
  pending: boolean // 내가 보낸 답을 방장이 아직 확인 못 했을 때
  picked: number // 내가 방금 고른 보기 (-1 = 없음)
  banner: string | null
  result: BossResult | null
}

export const useBoss = create<BossState>(() => ({
  roster: [],
  host: null,
  game: null,
  lobbyStage: 1,
  rcv: 0,
  pending: false,
  picked: -1,
  banner: null,
  result: null,
}))

let io: IO | null = null
let myName = ''
let tickTimer: ReturnType<typeof setInterval> | null = null
let pendingTimer: ReturnType<typeof setTimeout> | null = null
let deck: Deck | null = null
let curA = -1 // (방장만) 지금 문제의 정답 번호
let lastSent = 0
let hostMissingSince = 0
const processed = new Set<number>()

const INTRO_MS = 3200
const HOST_GRACE_MS = 6000

export const bossMe = () => myName
export const isBossHost = () => useBoss.getState().host === myName

export function bindBossIO(next: IO, name: string) {
  io = next
  myName = name
  if (tickTimer) clearInterval(tickTimer)
  tickTimer = setInterval(hostTick, 250)
}

export function bossReset() {
  if (tickTimer) clearInterval(tickTimer)
  tickTimer = null
  io = null
  if (pendingTimer) clearTimeout(pendingTimer)
  deck = null
  curA = -1
  hostMissingSince = 0
  useBoss.setState({ roster: [], host: null, game: null, lobbyStage: 1, rcv: 0, pending: false, picked: -1, banner: null, result: null })
}

const flashBanner = (text: string) => {
  useBoss.setState({ banner: text })
  setTimeout(() => {
    if (useBoss.getState().banner === text) useBoss.setState({ banner: null })
  }, 3500)
}

/* ---------- 내가 presence 에 실어 보낼 것 ---------- */
let myCleared = 0
export const setMyCleared = (n: number) => {
  myCleared = n
}
export const bossPresence = () => ({ bm: { cl: myCleared } })

/* ---------- 방(presence)이 바뀔 때 ---------- */

type PresenceMeta = { avatar?: { weapon?: string | null; wt?: number }; bm?: { cl?: number } }

export function bossOnPresence(state: Record<string, PresenceMeta[]>, allowed: string[]) {
  const roster: Member[] = allowed.map((n) => {
    const m = state[n]?.[0]
    const cl = typeof m?.bm?.cl === 'number' ? Math.max(0, Math.min(STAGES.length, Math.round(m.bm.cl))) : 0
    const wt = typeof m?.avatar?.wt === 'number' ? m.avatar.wt : 1
    return { n, cl, wf: m?.avatar?.weapon ?? null, wt: m?.avatar?.weapon ? wt : 1 }
  })
  const host = allowed[0] ?? null
  useBoss.setState({ roster, host })
  const g = useBoss.getState().game
  // 전투 중인 방에 나중에 들어온 사람은 구경할 수 없다 (live.ts 가 안내하고 돌려보낸다)
  if (g && isActive(g) && myName && !g.members.some((m) => m.n === myName)) {
    useBoss.setState({ banner: '이미 전투가 시작된 방이에요' })
  }
  // 방장이 사라졌으면(몇 초 지나도 안 돌아오면) 전투를 멈춘다
  if (g && isActive(g) && !roster.some((r) => r.n === g.host)) hostMissingSince ||= Date.now()
  else hostMissingSince = 0
}

export const isActive = (g: BossGame) => g.phase === 'intro' || g.phase === 'ask' || g.phase === 'result'

/* ---------- 입장 조건 ---------- */

// 이 팀이 도전할 수 있는 가장 높은 단계 = 팀원 모두가 바로 앞 단계를 깬 단계
export function maxStageFor(roster: Member[]): number {
  if (soloTest()) return STAGES.length // 연습 모드는 모든 단계를 고를 수 있다
  if (roster.length === 0) return 1
  const minCl = Math.min(...roster.map((r) => r.cl))
  return Math.min(STAGES.length, minCl + 1)
}

export function startBlockReason(roster: Member[]): string | null {
  if (roster.length < (soloTest() ? 1 : MIN_PARTY)) return `${MIN_PARTY}명 이상 모여야 해요 (지금 ${roster.length}명)`
  if (roster.length > MAX_PARTY) return `최대 ${MAX_PARTY}명까지예요`
  return null
}

/* ---------- 방장: 전투 시작·진행 ---------- */

function publish(g: BossGame) {
  const rcv = Date.now()
  useBoss.setState({ game: g, rcv, pending: false, ...(g.phase === 'ask' ? { picked: -1 } : {}) })
  io?.send({ k: 'st', g })
  lastSent = Date.now()
  maybeFinish(g)
}

export function bossResend() {
  const st = useBoss.getState()
  if (!io || st.host !== myName) return
  if (st.game) io.send({ k: 'st', g: st.game })
  io.send({ k: 'lb', stage: st.lobbyStage })
  lastSent = Date.now()
}

export function chooseStage(stage: number) {
  const st = useBoss.getState()
  if (st.host !== myName || (st.game && isActive(st.game))) return
  const s = Math.max(1, Math.min(maxStageFor(st.roster), stage))
  useBoss.setState({ lobbyStage: s })
  io?.send({ k: 'lb', stage: s })
}

export function startFight(): string | null {
  const st = useBoss.getState()
  if (st.host !== myName || !io) return '방장만 시작할 수 있어요'
  if (st.game && isActive(st.game)) return null
  const why = startBlockReason(st.roster)
  if (why) return why
  const stage = Math.min(st.lobbyStage, maxStageFor(st.roster)) as StageId
  const cfg = stageOf(stage)
  deck = new Deck(stage)
  curA = -1
  const members = st.roster.map((m) => ({ ...m }))
  const prev = st.game?.gid ?? 0
  publish({
    gid: Math.max(Date.now(), prev + 1),
    host: myName,
    stage,
    members,
    hp: cfg.hp,
    maxHp: cfg.hp,
    life: cfg.life,
    maxLife: cfg.life,
    n: 0,
    who: members[0].n,
    q: null,
    ms: cfg.ms,
    qa: Date.now() + INTRO_MS, // 이 시각이 되면 첫 문제가 나간다
    phase: 'intro',
    end: null,
    last: null,
    seq: 1,
  })
  return null
}

function presentNames(): Set<string> {
  return new Set(useBoss.getState().roster.map((r) => r.n))
}

function askNext(g: BossGame) {
  const here = presentNames()
  const alive = g.members.filter((m) => here.has(m.n))
  if (alive.length < (soloTest() ? 1 : 2)) {
    publish({ ...g, phase: 'aborted', seq: g.seq + 1 })
    return
  }
  // 이전에 푼 사람 다음 차례 (자리를 비운 사람은 건너뛴다)
  const order = g.members.map((m) => m.n)
  let idx = g.n === 0 ? -1 : order.indexOf(g.who)
  let who = g.who
  for (let k = 0; k < order.length; k++) {
    idx = (idx + 1) % order.length
    if (here.has(order[idx])) {
      who = order[idx]
      break
    }
  }
  const q = deck!.next()
  curA = q.a
  publish({
    ...g,
    n: g.n + 1,
    who,
    q: { t: q.t, o: q.o, sub: q.sub },
    qa: Date.now(),
    phase: 'ask',
    seq: g.seq + 1,
  })
}

function resolve(g: BossGame, pick: number, timeout: boolean) {
  const me = g.members.find((m) => m.n === g.who)
  const ok = !timeout && pick === curA
  const dmg = ok ? dmgOf(me?.wt ?? 1) : 0
  const hp = Math.max(0, g.hp - dmg)
  const life = ok ? g.life : Math.max(0, g.life - 1)
  const end: BossGame['end'] = hp <= 0 ? 'won' : life <= 0 ? 'lost' : null
  publish({
    ...g,
    hp,
    life,
    phase: 'result',
    qa: Date.now(),
    end,
    last: { who: g.who, ok, dmg, pick, a: curA, fam: me?.wf ?? null, tier: me?.wt ?? 1, timeout },
    seq: g.seq + 1,
  })
}

function hostTick() {
  const st = useBoss.getState()
  const g = st.game
  if (!io) return
  // (모두) 방장이 사라진 채로 오래 가면 전투 중단
  if (g && isActive(g) && st.host !== myName && hostMissingSince && Date.now() - hostMissingSince > HOST_GRACE_MS) {
    useBoss.setState({ game: { ...g, phase: 'aborted', seq: g.seq + 1 } })
    return
  }
  if (st.host !== myName || !g) return
  // 다른 사람이 시작한 전투를 내가 이어받을 수는 없다 (방장이 나가서 내가 새 방장이 된 경우) → 중단
  if (g.host !== myName && isActive(g)) {
    publish({ ...g, phase: 'aborted', seq: g.seq + 1 })
    return
  }
  if (g.phase === 'ask' || g.phase === 'intro' || g.phase === 'result') {
    if (Date.now() - lastSent > 5000) bossResend()
  }
  const now = Date.now()
  if (g.phase === 'intro' && now >= g.qa) askNext(g)
  else if (g.phase === 'ask' && now > g.qa + g.ms + ANSWER_GRACE_MS) resolve(g, -1, true)
  else if (g.phase === 'result' && now - g.qa >= RESULT_MS) {
    if (g.end) publish({ ...g, phase: g.end, seq: g.seq + 1 })
    else askNext(g)
  } else if (isActive(g)) {
    // 팀원이 너무 많이 나가서 둘 미만이 되면 중단
    const here = presentNames()
    if (g.members.filter((m) => here.has(m.n)).length < (soloTest() ? 1 : 2)) publish({ ...g, phase: 'aborted', seq: g.seq + 1 })
  }
}

/* ---------- 방에서 온 소식 ---------- */

export function bossOnEvent(p: BossPayload) {
  if (!p || typeof p !== 'object') return
  const st = useBoss.getState()
  if (p.k === 'lb') {
    if (st.host !== myName && typeof p.stage === 'number') useBoss.setState({ lobbyStage: p.stage })
    return
  }
  if (p.k === 'rs') {
    if (st.host !== myName && st.game && !isActive(st.game)) useBoss.setState({ game: null, result: null, picked: -1 })
    return
  }
  if (p.k === 'st') {
    if (st.host === myName) return // 방장은 자기가 쓴 판이 정답
    const cur = st.game
    if (cur && (p.g.gid < cur.gid || (p.g.gid === cur.gid && p.g.seq <= cur.seq))) return
    useBoss.setState({ game: p.g, rcv: Date.now(), pending: false, picked: p.g.phase === 'ask' ? -1 : st.picked })
    maybeFinish(p.g)
    return
  }
  if (p.k === 'ans') {
    const g = st.game
    if (st.host !== myName || !g || g.gid !== p.gid || g.phase !== 'ask' || g.n !== p.i || g.who !== p.n) return
    if (Date.now() > g.qa + g.ms + ANSWER_GRACE_MS) return
    if (!Number.isInteger(p.p) || p.p < 0 || p.p > 3) return
    resolve(g, p.p, false)
  }
}

/* ---------- 결과 처리 (한 판에 한 번) ---------- */

let finishHandler: ((g: BossGame) => void) | null = null
export const onBossFinish = (fn: ((g: BossGame) => void) | null) => {
  finishHandler = fn
}

function maybeFinish(g: BossGame) {
  if (g.phase !== 'won' && g.phase !== 'lost') return
  if (!g.members.some((m) => m.n === myName)) return
  if (processed.has(g.gid)) return
  processed.add(g.gid)
  finishHandler?.(g)
}

export const setBossResult = (r: BossResult | null) => useBoss.setState({ result: r })

/* ---------- 화면에서 부르는 동작 ---------- */

export function answer(pick: number) {
  const st = useBoss.getState()
  const g = st.game
  if (!g || g.phase !== 'ask' || g.who !== myName || st.pending || st.picked >= 0) return
  if (st.host === myName) {
    useBoss.setState({ picked: pick })
    resolve(g, pick, false)
    return
  }
  io?.send({ k: 'ans', gid: g.gid, i: g.n, n: myName, p: pick })
  useBoss.setState({ pending: true, picked: pick })
  if (pendingTimer) clearTimeout(pendingTimer)
  pendingTimer = setTimeout(() => useBoss.setState({ pending: false }), 3000)
}

// 한 판이 끝난 뒤 같은 팀이 다시 도전 (방장만)
export function rematch(): string | null {
  const st = useBoss.getState()
  if (st.host !== myName) return '방장이 시작해요'
  if (st.game && isActive(st.game)) return null
  useBoss.setState({ result: null, game: null, picked: -1 })
  io?.send({ k: 'rs' })
  io?.send({ k: 'lb', stage: st.lobbyStage })
  return null
}

export const notifyBoss = flashBanner

// 내 클리어 단계가 바뀌었을 때 방 친구들에게 알린다
export const refreshMyPresence = () => io?.track()

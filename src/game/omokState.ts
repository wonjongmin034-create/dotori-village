import { create } from 'zustand'
import { canPlay, evaluate, MIN_MOVES_FOR_REWARD } from './omok'
import { OMOK_TABLES } from './plazaLayout'

// 광장 오목 — 자리 앉기·대국 진행·결과. 네트워크는 live.ts 의 광장 방(채널)을 빌려 쓴다.
//
// 누가 어느 자리에 앉았는지 = presence(방 전체가 같은 내용을 보는 "현재 상태")에 담는다 → 늦게 들어온 친구도 바로 알 수 있다.
// 대국은 "방장"(그 테이블에 먼저 앉은 사람)이 혼자 관리한다: 상대가 두고 싶은 수를 보내면 방장이 확인해서 판을 갱신하고,
// 갱신된 판을 방 전체에 broadcast 로 알린다. 한 명만 판을 쓰니 서로 판이 달라질 일이 없다.
// (presence 는 자리가 바뀔 때만 건드린다. 수를 둘 때마다 바꾸면 서버의 "presence 횟수 제한"에 걸려 연결이 끊긴다.)
// 판 상태는 몇 초마다, 그리고 새 친구가 들어올 때 방장이 다시 알려 줘서 늦게 온 친구·구경꾼도 판을 볼 수 있다.

export const TURN_MS = 30_000 // 한 수를 두는 제한 시간

export type SeatMeta = { tb: number; s: 0 | 1; at: number; rd?: number } // rd = "한 판 더" 하겠다고 한 판 번호
export type GameOver = { kind: 'win' | 'draw' | 'resign' | 'timeout' | 'leave'; winner: string | null; line: number[] }
export type GameState = {
  gid: number
  black: string
  white: string
  moves: number[]
  la: number // 마지막으로 둔(또는 시작한) 시각
  over: GameOver | null
}
export type OmokPayload =
  | { k: 'mv'; tb: number; gid: number; c: number; n: string }
  | { k: 'rs'; tb: number; gid: number; n: string }
  | { k: 'st'; tb: number; g: GameState }

type Seats = [string | null, string | null]
type Meta = { seat?: SeatMeta }

type OmokIO = { send: (p: OmokPayload) => void; track: () => void }

export type FinishInfo = {
  gid: number
  opponent: string
  result: 'win' | 'loss' | 'draw'
  kind: GameOver['kind']
  moves: number
}

type OmokState = {
  seats: Record<number, Seats>
  games: Record<number, GameState | null>
  ready: Record<string, number> // 이름 → 한 판 더 하겠다고 한 판 번호
  me: SeatMeta | null
  rcv: Record<number, number> // 판이 마지막으로 바뀐 걸 내가 받은 시각 (남은 시간 표시용)
  pending: boolean // 내가 보낸 수를 방장이 아직 확인 못 했을 때
  banner: string | null // 잠깐 보이는 안내 (자리를 뺏겼어요 등)
}

export const useOmok = create<OmokState>(() => ({
  seats: {},
  games: {},
  ready: {},
  me: null,
  rcv: {},
  pending: false,
  banner: null,
}))

let io: OmokIO | null = null
let myName = ''
let tickTimer: ReturnType<typeof setInterval> | null = null
let pendingTimer: ReturnType<typeof setTimeout> | null = null
let finishHandler: ((f: FinishInfo) => void) | null = null
const processed = new Set<number>() // 이미 결과를 처리한 판 번호

export const onOmokFinish = (fn: ((f: FinishInfo) => void) | null) => {
  finishHandler = fn
}

export function bindOmokIO(next: OmokIO, name: string) {
  io = next
  myName = name
  if (tickTimer) clearInterval(tickTimer)
  tickTimer = setInterval(hostTick, 1000)
}

export function omokReset() {
  if (tickTimer) clearInterval(tickTimer)
  tickTimer = null
  io = null
  if (pendingTimer) clearTimeout(pendingTimer)
  missingSince = {}
  useOmok.setState({ seats: {}, games: {}, ready: {}, me: null, rcv: {}, pending: false, banner: null })
}

const flashBanner = (text: string) => {
  useOmok.setState({ banner: text })
  setTimeout(() => {
    if (useOmok.getState().banner === text) useOmok.setState({ banner: null })
  }, 3500)
}

/* ---------- 자리 정보 ---------- */

export const seatPos = (tb: number, s: 0 | 1): [number, number] => {
  const t = OMOK_TABLES[tb]
  return [t.x + (s === 0 ? -1.65 : 1.65), t.z]
}
// 앉은 사람이 바라보는 방향 (테이블 쪽)
export const seatFacing = (s: 0 | 1) => (s === 0 ? Math.PI / 2 : -Math.PI / 2)

// 그 테이블의 방장: 먼저 앉은 사람. at 은 앉은 시각이라 모두가 같은 결과를 계산한다.
function hostOf(tb: number): string | null {
  const st = useOmok.getState()
  const [a, b] = st.seats[tb] ?? [null, null]
  if (a && b) {
    const aa = st.me && st.me.tb === tb && myName === a ? st.me.at : atOf[a] ?? 0
    const bb = st.me && st.me.tb === tb && myName === b ? st.me.at : atOf[b] ?? 0
    return aa < bb || (aa === bb && a < b) ? a : b
  }
  return a ?? b
}
let atOf: Record<string, number> = {}
// 상대가 안 보이기 시작한 시각 — 잠깐 끊겼다 돌아오는 경우가 있어서 몇 초 지나야 "나갔다"고 본다
let missingSince: Record<number, number> = {}
const LEAVE_GRACE_MS = 6000

export const isHost = (tb: number) => hostOf(tb) === myName

export const seatedTable = (name: string): number | null => {
  const st = useOmok.getState()
  for (const k of Object.keys(st.seats)) {
    const [a, b] = st.seats[+k]
    if (a === name || b === name) return +k
  }
  return null
}

function newer(a: GameState, b: GameState | null | undefined): boolean {
  if (!b) return true
  if (a.gid !== b.gid) return a.gid > b.gid
  if (!!a.over !== !!b.over) return !!a.over
  return a.moves.length > b.moves.length
}

function setGame(tb: number, g: GameState | null) {
  useOmok.setState((s) => ({
    games: { ...s.games, [tb]: g },
    rcv: { ...s.rcv, [tb]: Date.now() },
    pending: false,
  }))
  maybeFinish(tb)
}

/* ---------- 내가 presence 에 실어 보낼 것 ---------- */

export function omokPresence(): Meta {
  const st = useOmok.getState()
  const out: Meta = {}
  if (st.me) out.seat = st.me
  return out
}

/* ---------- 방(presence)이 바뀔 때 ---------- */

export function omokOnPresence(state: Record<string, { seat?: SeatMeta }[]>, allowed: string[]) {
  const prev = useOmok.getState()
  const claims: { name: string; seat: SeatMeta }[] = []
  const ready: Record<string, number> = {}
  const nextAt: Record<string, number> = {}
  for (const n of allowed) {
    const m = state[n]?.[0]
    if (m?.seat) {
      claims.push({ name: n, seat: m.seat })
      nextAt[n] = m.seat.at
      if (m.seat.rd) ready[n] = m.seat.rd
    }
  }
  atOf = nextAt
  claims.sort((a, b) => a.seat.at - b.seat.at || (a.name < b.name ? -1 : 1))
  const seats: Record<number, Seats> = {}
  for (const c of claims) {
    const row = (seats[c.seat.tb] ??= [null, null])
    if (!row[c.seat.s]) row[c.seat.s] = c.name
  }

  // 내가 앉으려던 자리를 다른 사람이 먼저 차지했으면 일어난다
  let me = prev.me
  if (me && seats[me.tb]?.[me.s] !== myName) {
    // 내 presence 가 아직 안 올라왔을 수도 있다 (앉은 지 1초 이내) → 그 경우엔 기다린다
    if (!nextAt[myName] && Date.now() - me.at < 2500) {
      /* 기다림 */
    } else {
      me = null
      flashBanner('다른 친구가 먼저 앉았어요')
    }
  }
  // 내 자리는 내 쪽 값이 맞다 (presence 반영이 늦을 수 있어서)
  if (me) {
    const row = (seats[me.tb] ??= [null, null])
    if (!row[me.s]) row[me.s] = myName
    if (me.rd) ready[myName] = me.rd
  }

  useOmok.setState({ seats, ready, me })

  // 테이블마다: 방장이 올린 판을 받아 온다 / 사라진 상대 처리
  for (const tbs of Object.keys(seats)) {
    const tb = +tbs
    const [a, b] = seats[tb]
    if (a && b) delete missingSince[tb]
    else missingSince[tb] ??= Date.now()
  }
  for (const k of Object.keys(missingSince)) if (!seats[+k]) delete missingSince[+k]
  // 아무도 안 앉은 테이블의 옛 판은 지운다
  const games = useOmok.getState().games
  for (const k of Object.keys(games)) {
    const tb = +k
    if (!seats[tb] || (!seats[tb][0] && !seats[tb][1])) {
      if (games[tb]) setGame(tb, null)
    }
  }
}

/* ---------- 방장: 판 시작·진행 ---------- */

let lastSent = 0
function publish(tb: number, g: GameState) {
  setGame(tb, g)
  io?.send({ k: 'st', tb, g })
  lastSent = Date.now()
}

// 방장이 내 테이블 판을 다시 알린다 (새 친구가 들어왔을 때·몇 초마다)
export function omokResend() {
  const me = useOmok.getState().me
  if (!me || !io || !isHost(me.tb)) return
  const g = useOmok.getState().games[me.tb]
  if (g) {
    io.send({ k: 'st', tb: me.tb, g })
    lastSent = Date.now()
  }
}

function startGame(tb: number, a: string, b: string) {
  const blackFirst = Math.random() < 0.5 // 선(흑)은 무작위
  publish(tb, {
    gid: Date.now(),
    black: blackFirst ? a : b,
    white: blackFirst ? b : a,
    moves: [],
    la: Date.now(),
    over: null,
  })
}

function hostTick() {
  const st = useOmok.getState()
  const me = st.me
  if (!me || !io) return
  const tb = me.tb
  const [a, b] = st.seats[tb] ?? [null, null]
  // 대국 중에 상대가 한참 안 보이면 상대가 나간 것으로 본다 → 내가 이김
  const cur = st.games[tb]
  if (cur && !cur.over && !(a && b)) {
    const since = missingSince[tb]
    if (since && Date.now() - since > LEAVE_GRACE_MS) {
      publish(tb, { ...cur, over: { kind: 'leave', winner: myName, line: [] } })
    }
    return
  }
  if (!a || !b || hostOf(tb) !== myName) return
  if (cur && Date.now() - lastSent > 5000) omokResend()
  const g = st.games[tb]
  const settled = Date.now() - me.at > 1200 && Date.now() - (atOf[a === myName ? b : a] ?? 0) > 1200
  if (!g) {
    if (settled) startGame(tb, a, b)
    return
  }
  if (g.over) {
    if (st.ready[a] === g.gid && st.ready[b] === g.gid) startGame(tb, a, b)
    return
  }
  if (Date.now() - g.la > TURN_MS) {
    const mover = g.moves.length % 2 === 0 ? g.black : g.white
    const winner = mover === g.black ? g.white : g.black
    publish(tb, { ...g, over: { kind: 'timeout', winner, line: [] } })
  }
}

function applyMove(tb: number, name: string, cell: number) {
  const g = useOmok.getState().games[tb]
  if (!g || g.over) return
  const mover = g.moves.length % 2 === 0 ? g.black : g.white
  if (mover !== name || !canPlay(g.moves, cell)) return
  const moves = [...g.moves, cell]
  const out = evaluate(moves)
  const over: GameOver | null = out.over
    ? { kind: out.winner ? 'win' : 'draw', winner: out.winner === 'black' ? g.black : out.winner === 'white' ? g.white : null, line: out.line }
    : null
  publish(tb, { ...g, moves, la: Date.now(), over })
}

function applyResign(tb: number, name: string) {
  const g = useOmok.getState().games[tb]
  if (!g || g.over) return
  const winner = name === g.black ? g.white : g.black
  publish(tb, { ...g, over: { kind: 'resign', winner, line: [] } })
}

/* ---------- 방에서 온 소식 ---------- */

export function omokOnEvent(p: OmokPayload) {
  if (!p || typeof p !== 'object') return
  const me = useOmok.getState().me
  if (p.k === 'st') {
    const cur = useOmok.getState().games[p.tb]
    // 내가 방장인 테이블은 내가 쓴 게 정답이라 받지 않는다
    if (isHost(p.tb) && me?.tb === p.tb) return
    if (newer(p.g, cur)) setGame(p.tb, p.g)
    return
  }
  if (!me || me.tb !== p.tb || !isHost(p.tb)) return
  const g = useOmok.getState().games[p.tb]
  if (!g || g.gid !== p.gid) return
  if (p.k === 'mv') applyMove(p.tb, p.n, p.c)
  else if (p.k === 'rs') applyResign(p.tb, p.n)
}

/* ---------- 결과 처리 (내가 대국자일 때 한 번만) ---------- */

function maybeFinish(tb: number) {
  const st = useOmok.getState()
  const g = st.games[tb]
  const me = st.me
  if (!g || !g.over || !me || me.tb !== tb) return
  if (g.black !== myName && g.white !== myName) return
  if (processed.has(g.gid)) return
  processed.add(g.gid)
  const opponent = g.black === myName ? g.white : g.black
  const result: FinishInfo['result'] = g.over.winner === null ? 'draw' : g.over.winner === myName ? 'win' : 'loss'
  finishHandler?.({ gid: g.gid, opponent, result, kind: g.over.kind, moves: g.moves.length })
}

/* ---------- 화면에서 부르는 동작 ---------- */

export function sitDown(tb: number, s: 0 | 1) {
  const st = useOmok.getState()
  if (st.me) return
  if (st.seats[tb]?.[s]) {
    flashBanner('이미 누가 앉아 있어요')
    return
  }
  useOmok.setState({ me: { tb, s, at: Date.now() }, banner: null })
  io?.track()
}

export function standUp() {
  const st = useOmok.getState()
  const me = st.me
  if (!me) return
  const g = st.games[me.tb]
  if (g && !g.over && (g.black === myName || g.white === myName)) resign() // 대국 중에 나가면 기권
  useOmok.setState({ me: null, pending: false })
  io?.track()
  // 내 자리 비우기 반영 (presence 가 오기 전에도 화면에서 바로 빠지게)
  useOmok.setState((s) => {
    const seats = { ...s.seats }
    const row = seats[me.tb] ? ([...seats[me.tb]] as Seats) : ([null, null] as Seats)
    if (row[me.s] === myName) row[me.s] = null
    seats[me.tb] = row
    return { seats }
  })
}

export function playCell(cell: number) {
  const st = useOmok.getState()
  const me = st.me
  if (!me || st.pending) return
  const g = st.games[me.tb]
  if (!g || g.over) return
  const mover = g.moves.length % 2 === 0 ? g.black : g.white
  if (mover !== myName || !canPlay(g.moves, cell)) return
  if (isHost(me.tb)) {
    applyMove(me.tb, myName, cell)
    return
  }
  io?.send({ k: 'mv', tb: me.tb, gid: g.gid, c: cell, n: myName })
  useOmok.setState({ pending: true })
  if (pendingTimer) clearTimeout(pendingTimer)
  pendingTimer = setTimeout(() => useOmok.setState({ pending: false }), 3000)
}

export function resign() {
  const st = useOmok.getState()
  const me = st.me
  if (!me) return
  const g = st.games[me.tb]
  if (!g || g.over) return
  if (isHost(me.tb)) applyResign(me.tb, myName)
  else io?.send({ k: 'rs', tb: me.tb, gid: g.gid, n: myName })
}

export function again() {
  const st = useOmok.getState()
  const me = st.me
  if (!me) return
  const g = st.games[me.tb]
  if (!g || !g.over) return
  useOmok.setState({ me: { ...me, rd: g.gid } })
  io?.track()
}

/* ---------- 보여 주기용 ---------- */

export const myGame = (): GameState | null => {
  const st = useOmok.getState()
  return st.me ? (st.games[st.me.tb] ?? null) : null
}

export const REWARD_MIN_MOVES = MIN_MOVES_FOR_REWARD

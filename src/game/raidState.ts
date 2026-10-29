import { create } from 'zustand'
import { RAID_COUNTDOWN_S, RAID_MIN, raidHpFor } from './raidData'
import { raidBegin, raidHpMult, raidStatus, type RaidStatus } from './raidApi'
import { bindFightIO, fightAdoptLeader, fightOnEvent, fightReset, fightStart, fightTick, useFight, type FightPayload } from './raidFight'

// 학급 레이드 — 대기실과 출발. 보스방과 같은 방식: "대장"(방에 제일 먼저 들어온 사람)이 출발을 관리한다.
//  · 서버 메시지를 아끼려고 사람들은 제자리에 서 있고(위치를 보내지 않는다), 필요한 신호만 주고받는다.
//  · 대장이 시작을 누르면 10초 세기가 시작되고, 끝났을 때 서버에서 도전 횟수를 하나 쓰고 모두 함께 전투를 시작한다.
//  · 전투 규칙은 raidFight.ts.

export type RaidPhase = 'lobby' | 'count' | 'fight'

export type RaidPayload =
  | { k: 'go'; gid: number; ms: number } // 대장이 시작을 눌렀다 — ms 뒤에 출발
  | { k: 'cancel'; gid: number; why: string }
  | { k: 'start'; gid: number; members: string[]; tries: number; hm?: number } // hm = 보스 체력 배율
  | FightPayload // 전투 중: 'd' 피해 보고, 'f' 대장이 알리는 현재 상황

type IO = { send: (p: RaidPayload) => void }

type RaidState = {
  roster: string[] // 지금 방에 있는 사람들 (들어온 순서)
  leader: string | null
  phase: RaidPhase
  gid: number
  countEnd: number // (count) 출발 시각 — 내 시계
  countLeader: string | null // (count) 이 세기를 시작한 대장
  members: string[] // (fight) 함께 출발한 사람들
  tries: number // (fight) 이번이 오늘 몇 번째 도전인지
  status: RaidStatus | null
  noServer: boolean // 서버 함수가 아직 없다 (개발·시험 중에만 그냥 진행)
  banner: string | null
  starting: boolean // 서버에 도전 횟수를 쓰러 가는 중
}

const initial: RaidState = {
  roster: [],
  leader: null,
  phase: 'lobby',
  gid: 0,
  countEnd: 0,
  countLeader: null,
  members: [],
  tries: 0,
  status: null,
  noServer: false,
  banner: null,
  starting: false,
}

export const useRaid = create<RaidState>(() => ({ ...initial }))

let io: IO | null = null
let myName = ''
let classCode = ''
let onLate: (() => void) | null = null
let tickTimer: ReturnType<typeof setInterval> | null = null
let myWasLeader = false

export function setRaidLateHandler(fn: (() => void) | null) {
  onLate = fn
}

export function bindRaidIO(next: IO, name: string, code: string, weaponOf: (n: string) => string | null) {
  io = next
  myName = name
  classCode = code
  bindFightIO({
    send: (p) => next.send(p),
    me: name,
    isLeader: () => useRaid.getState().leader === name,
    present: () => useRaid.getState().roster,
    weaponOf,
    classCode: code,
    practice: () => !!useRaid.getState().status?.practice,
  })
  if (tickTimer) clearInterval(tickTimer)
  tickTimer = setInterval(hostTick, 250)
  useRaid.setState({ banner: null })
  fightReset()
}

export function raidReset() {
  if (tickTimer) clearInterval(tickTimer)
  tickTimer = null
  io = null
  bindFightIO(null)
  fightReset()
  const { status, noServer } = useRaid.getState()
  useRaid.setState({ ...initial, status, noServer }) // 들어올 때 받아 온 서버 상태는 남긴다
  myWasLeader = false
}

export function raidSetStatus(status: RaidStatus | null, noServer: boolean) {
  useRaid.setState({ status, noServer })
}

const flashBanner = (text: string) => {
  useRaid.setState({ banner: text })
  setTimeout(() => {
    if (useRaid.getState().banner === text) useRaid.setState({ banner: null })
  }, 4000)
}

/* ---------- 방(presence)이 바뀔 때 ---------- */

export function raidOnPresence(allowed: string[]) {
  const st = useRaid.getState()
  const leader = allowed[0] ?? null
  useRaid.setState({ roster: allowed, leader })
  // 세는 도중에 대장이 바뀌었거나 나갔으면 취소 (새 대장이 다시 시작한다)
  if (st.phase === 'count' && st.countLeader && st.countLeader !== leader) {
    useRaid.setState({ phase: 'lobby', countEnd: 0, countLeader: null })
    flashBanner('대장이 바뀌어서 출발이 취소됐어요. 다시 시작해 주세요')
  }
  // 이미 출발한 뒤에 들어온 사람은 함께 갈 수 없다
  if (st.phase === 'fight' && myName && !st.members.includes(myName)) onLate?.()
  // 싸우는 도중 대장이 나가서 내가 새 대장이 되었다 → 마지막으로 받은 상태로 이어서 진행한다
  const nowLeader = leader === myName
  if (nowLeader && !myWasLeader && st.phase === 'fight') {
    fightAdoptLeader()
    flashBanner('대장이 나가서 이제 내가 대장이에요!')
  }
  myWasLeader = nowLeader
}

/* ---------- 대장: 시작 · 취소 · 출발 ---------- */

export function raidBlockReason(roster: string[], status: RaidStatus | null, noServer: boolean): string | null {
  if (roster.length < RAID_MIN) return `${RAID_MIN}명 이상 모여야 해요 (지금 ${roster.length}명)`
  if (!noServer && status) {
    if (!status.open) return '지금은 레이드가 열려 있지 않아요'
    if (status.cleared) return '이번 주 레이드는 이미 깼어요! 🎉'
    if (status.left <= 0) return '오늘 도전 기회 3번을 모두 썼어요'
  }
  return null
}

export function raidStart(): string | null {
  const st = useRaid.getState()
  if (!io || st.leader !== myName) return '대장만 시작할 수 있어요'
  if (st.phase !== 'lobby' || st.starting) return null
  const why = raidBlockReason(st.roster, st.status, st.noServer)
  if (why) return why
  const gid = Date.now()
  const ms = RAID_COUNTDOWN_S * 1000
  useRaid.setState({ phase: 'count', gid, countEnd: Date.now() + ms, countLeader: myName })
  io.send({ k: 'go', gid, ms })
  return null
}

export function raidCancel() {
  const st = useRaid.getState()
  if (!io || st.leader !== myName || st.phase !== 'count') return
  io.send({ k: 'cancel', gid: st.gid, why: '대장이 출발을 취소했어요' })
  useRaid.setState({ phase: 'lobby', countEnd: 0, countLeader: null })
}

function cancelFor(why: string) {
  const st = useRaid.getState()
  io?.send({ k: 'cancel', gid: st.gid, why })
  useRaid.setState({ phase: 'lobby', countEnd: 0, countLeader: null, starting: false })
  flashBanner(why)
}

function hostTick() {
  const st = useRaid.getState()
  if (st.phase === 'fight') {
    fightTick() // 전투: 모든 사람이 자기 문제를 내고, 대장은 체력과 페이즈를 관리한다
    return
  }
  if (st.phase !== 'count' || st.leader !== myName || st.starting) return
  if (st.roster.length < RAID_MIN) {
    cancelFor(`${RAID_MIN}명보다 적어져서 출발을 취소했어요`)
    return
  }
  if (Date.now() < st.countEnd) return
  void finalizeStart(st.gid, st.roster.slice(), st.noServer)
}

async function finalizeStart(gid: number, members: string[], noServer: boolean) {
  useRaid.setState({ starting: true })
  let tries = 0
  if (!noServer) {
    const r = await raidBegin(classCode)
    if (useRaid.getState().gid !== gid || useRaid.getState().phase !== 'count') return // 그 사이 취소됐다
    if (!r.ok) {
      cancelFor(
        r.why === 'limit'
          ? '오늘 도전 기회 3번을 모두 썼어요'
          : r.why === 'cleared'
            ? '이번 주 레이드는 이미 깼어요! 🎉'
            : r.why === 'closed'
              ? '지금은 레이드가 열려 있지 않아요'
              : '서버와 연결이 불안해서 출발하지 못했어요. 잠깐 뒤에 다시 눌러 주세요',
      )
      return
    }
    tries = r.tries
  }
  const hm = noServer ? 1 : await raidHpMult(classCode)
  if (useRaid.getState().gid !== gid || useRaid.getState().phase !== 'count') return
  io?.send({ k: 'start', gid, members, tries, hm })
  begin(gid, members, tries, hm)
}

function begin(gid: number, members: string[], tries: number, hm = 1) {
  useRaid.setState({ phase: 'fight', gid, members, tries, countEnd: 0, countLeader: null, starting: false })
  const st = useRaid.getState()
  if (st.status) {
    const used = Math.max(st.status.tries, tries)
    useRaid.setState({ status: { ...st.status, tries: used, left: Math.max(0, 3 - used) } })
  }
  if (myName && !members.includes(myName)) {
    onLate?.()
    return
  }
  fightStart(gid, members, hm)
}

// 싸움이 끝난 뒤 대기실로 돌아온다 (남은 도전 횟수를 서버에서 다시 받는다)
export function raidToLobby() {
  fightReset()
  useRaid.setState({ phase: 'lobby', members: [], countEnd: 0, countLeader: null, starting: false, banner: null })
  if (classCode && !useRaid.getState().noServer) {
    void raidStatus(classCode).then((s) => {
      if (s !== 'missing') useRaid.setState({ status: s })
    })
  }
}

/* ---------- 받은 신호 ---------- */

export function raidOnEvent(p: RaidPayload) {
  const st = useRaid.getState()
  if (p.k === 'd' || p.k === 'f') {
    if (st.phase === 'fight') fightOnEvent(p)
    return
  }
  if (p.k === 'go') {
    const fs = useFight.getState().st
    // 싸움이 끝난 화면에 있어도 새 도전의 출발 신호를 받으면 대기실로 돌아온다
    if (st.phase === 'fight' && fs !== 'won' && fs !== 'lost') return
    if (st.phase === 'fight') fightReset()
    useRaid.setState({ phase: 'count', gid: p.gid, countEnd: Date.now() + Math.max(0, Math.min(15_000, p.ms)), countLeader: st.leader, members: [] })
  } else if (p.k === 'cancel') {
    if (st.phase !== 'count' || p.gid !== st.gid) return
    useRaid.setState({ phase: 'lobby', countEnd: 0, countLeader: null })
    flashBanner(typeof p.why === 'string' ? p.why.slice(0, 60) : '출발이 취소됐어요')
  } else if (p.k === 'start') {
    if (st.phase === 'fight' && st.gid === p.gid) return
    if (!Array.isArray(p.members)) return
    begin(p.gid, p.members.filter((n) => typeof n === 'string').slice(0, 40), typeof p.tries === 'number' ? p.tries : 0, typeof p.hm === 'number' ? p.hm : 1)
  }
}

// 새로 들어온 사람이 지금 상황을 알 수 있게 대장이 다시 알려 준다
export function raidResend() {
  const st = useRaid.getState()
  if (!io || st.leader !== myName) return
  if (st.phase === 'count') io.send({ k: 'go', gid: st.gid, ms: Math.max(0, st.countEnd - Date.now()) })
  else if (st.phase === 'fight') io.send({ k: 'start', gid: st.gid, members: st.members, tries: st.tries, hm: useFight.getState().hpList[0] / raidHpFor(1)[0] })
}

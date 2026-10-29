import { create } from 'zustand'
import { Deck, oeQ, rpsQ, timeFor, type Answer, type BossQ } from './bossQuestions'
import {
  RAID_BETWEEN_MS,
  RAID_DMG,
  RAID_HEAL,
  raidHpFor,
  RAID_INTRO_MS,
  RAID_LIVES,
  RAID_LUCK_DMG,
  RAID_LUCK_EVERY,
  RAID_PHASES,
  RAID_Q_GAP_MS,
  RAID_RETURN_LIVES,
  RAID_TIER_MIX,
  RAID_TIME_LIMIT_S,
  RAID_TIME_MULT,
  raidCapOf,
} from './raidData'
import { raidFinish } from './raidApi'
import { startSwing } from './swing'
import { useVillage } from './store'

// 학급 레이드 전투.
//  · 모두가 동시에 각자 문제를 푼다. 맞히면 보스(하나의 공동 체력)가 깎이고, 틀리면 내 목숨이 줄어든다. 목숨이 0이면 이번 페이즈 끝까지 쓰러져 있다.
//  · 한 사람은 한 페이즈에서 그 페이즈 체력의 12.5%까지만 줄 수 있다 → 혼자서는 깰 수 없고, 8명이 모두 최대로 해야 겨우 한 페이즈가 깨진다.
//  · 서버 메시지를 아끼려고: 각자 피해를 몇 초씩 모아서 대장에게 알리고, 대장이 체력을 합쳐 2초마다 모두에게 알린다.
//    (대장이 나가면 마지막으로 받은 상태로 다음 사람이 이어받는다.)

export type FightStatus = 'idle' | 'intro' | 'play' | 'between' | 'won' | 'lost'
// 대장이 모두에게 알리는 한 장면: 단계, 체력, 남은 시간, 다음 전환까지(ms), 사람별 [이름, 목숨, 이번 페이즈에 준 피해]
export type Snap = { gid: number; ph: number; st: FightStatus; hp: number; max: number; left: number; w: number; why?: string; m: [string, number, number][] }
export type FightPayload = { k: 'd'; gid: number; n: string; dmg: number; l: number } | { k: 'f'; s: Snap }

type FIO = { send: (p: FightPayload) => void; me: string; isLeader: () => boolean; present: () => string[]; weaponOf: (n: string) => string | null; classCode: string }

export type Res = { ok: boolean; draw: boolean; timeout: boolean; dmg: number; text: string; pick?: string; capped: boolean; dead: boolean }

type Fight = {
  gid: number
  ph: number
  st: FightStatus
  hp: number
  max: number
  endsAt: number // 이 시각(내 시계)이 되면 시간 종료
  nextAt: number // intro/between 이 끝나는 시각 (내 시계)
  members: Record<string, { l: number; d: number }>
  order: string[]
  hpList: number[] // 페이즈별 체력 (선생님의 체력 배율 반영)
  why: string | null
  myL: number // 내 목숨
  myD: number // 이번 페이즈에 내가 준 피해
  q: BossQ | null
  qAt: number
  qMs: number
  qn: number
  qLv: number
  luck: boolean
  res: Res | null
  askAt: number // 다음 문제가 나올 시각
}

const blank = (): Fight => ({
  gid: 0, ph: 1, st: 'idle', hp: 0, max: 0, endsAt: 0, nextAt: 0, members: {}, order: [], hpList: raidHpFor(1), why: null,
  myL: RAID_LIVES, myD: 0, q: null, qAt: 0, qMs: 0, qn: 0, qLv: 1, luck: false, res: null, askAt: 0,
})

export const useFight = create<Fight>(() => blank())

// 화면 효과가 읽는 값 (3D 장면)
export const raidFx = { hitAt: 0, clearAt: 0, deadAt: 0 }

let io: FIO | null = null
let deck: Deck | null = null
let pending = 0 // 아직 대장에게 알리지 않은 내 피해
let lifeDirty = false
let lastFlush = 0
let lastSnap = 0
let finished = false // (대장) 서버에 결과를 이미 보냈다

export function bindFightIO(next: FIO | null) {
  io = next
}

export function fightReset() {
  useFight.setState(blank())
  deck = null
  pending = 0
  lifeDirty = false
  finished = false
}

const set = (p: Partial<Fight>) => useFight.setState(p)
const get = () => useFight.getState()
const capNow = () => raidCapOf(get().max)

/* ---------- 시작 ---------- */

export function fightStart(gid: number, names: string[], hpMult = 1) {
  const hpList = raidHpFor(hpMult)
  deck = new Deck(4)
  pending = 0
  lifeDirty = false
  finished = false
  lastSnap = 0
  const members: Fight['members'] = {}
  for (const n of names) members[n] = { l: RAID_LIVES, d: 0 }
  const now = Date.now()
  useFight.setState({
    ...blank(),
    gid,
    ph: 1,
    st: 'intro',
    hp: hpList[0],
    max: hpList[0],
    hpList,
    members,
    order: names.slice(),
    endsAt: now + RAID_TIME_LIMIT_S * 1000,
    nextAt: now + RAID_INTRO_MS,
  })
}

/* ---------- 대장: 체력·페이즈·승패를 관리한다 ---------- */

function snap(): Snap {
  const f = get()
  const now = Date.now()
  return {
    gid: f.gid,
    ph: f.ph,
    st: f.st,
    hp: Math.round(f.hp),
    max: f.max,
    left: Math.max(0, Math.round((f.endsAt - now) / 1000)),
    w: f.st === 'intro' || f.st === 'between' ? Math.max(0, f.nextAt - now) : 0,
    why: f.why ?? undefined,
    m: f.order.map((n) => [n, f.members[n]?.l ?? 0, f.members[n]?.d ?? 0] as [string, number, number]),
  }
}

function broadcast() {
  io?.send({ k: 'f', s: snap() })
  lastSnap = Date.now()
}

function leaderEnd(won: boolean, why: string | null) {
  const f = get()
  if (f.st === 'won' || f.st === 'lost') return
  set({ st: won ? 'won' : 'lost', why, nextAt: 0 })
  raidFx.clearAt = Date.now()
  broadcast()
  if (!finished && io) {
    finished = true
    void raidFinish(io.classCode, won, won ? RAID_PHASES : f.ph)
  }
}

function leaderPhaseClear() {
  const f = get()
  raidFx.clearAt = Date.now()
  if (f.ph >= RAID_PHASES) {
    set({ hp: 0 })
    leaderEnd(true, null)
    return
  }
  set({ st: 'between', hp: 0, nextAt: Date.now() + RAID_BETWEEN_MS })
  broadcast()
}

function leaderNextPhase() {
  const f = get()
  const ph = f.ph + 1
  const members: Fight['members'] = {}
  for (const n of f.order) {
    const m = f.members[n]
    members[n] = { l: m && m.l > 0 ? Math.min(RAID_LIVES, m.l + RAID_HEAL) : RAID_RETURN_LIVES, d: 0 }
  }
  const me = io?.me ?? ''
  set({ ph, hp: f.hpList[ph - 1], max: f.hpList[ph - 1], members, st: 'play', nextAt: 0, myL: members[me]?.l ?? get().myL, myD: 0, q: null, res: null, askAt: Date.now() + 600 })
  pending = 0
  lifeDirty = false
  broadcast()
}

// 모두 쓰러졌거나, 남은 사람이 모두 이번 페이즈의 한계에 닿았다면 더 깎을 방법이 없다
function leaderStuck() {
  const f = get()
  if (f.st !== 'play' || f.hp <= 0 || !io) return
  const here = new Set(io.present())
  const alive = f.order.filter((n) => here.has(n))
  if (alive.length === 0) {
    leaderEnd(false, '모두 자리를 떠났어요')
    return
  }
  const cap = capNow()
  const canHit = alive.filter((n) => (f.members[n]?.l ?? 0) > 0 && (f.members[n]?.d ?? 0) < cap)
  if (canHit.length > 0) return
  const allDead = alive.every((n) => (f.members[n]?.l ?? 0) <= 0)
  leaderEnd(false, allDead ? '모두 쓰러졌어요' : '모두 이번 페이즈의 한계까지 공격했어요 — 사람이 더 필요해요')
}

function leaderTick() {
  const f = get()
  const now = Date.now()
  if (f.st === 'intro' && now >= f.nextAt) {
    set({ st: 'play', nextAt: 0, askAt: now + 400 })
    broadcast()
    return
  }
  if (f.st === 'between' && now >= f.nextAt) {
    leaderNextPhase()
    return
  }
  if (f.st !== 'play') return
  if (now >= f.endsAt) {
    leaderEnd(false, '시간이 다 됐어요')
    return
  }
  leaderStuck()
  if (get().st === 'play' && now - lastSnap >= 2000) broadcast()
}

// 대장이 받은 피해 보고를 체력에 합친다
function leaderApply(p: Extract<FightPayload, { k: 'd' }>) {
  const f = get()
  const m = f.members[p.n]
  if (!m || p.gid !== f.gid) return
  const l = Math.max(0, Math.min(m.l, Math.round(p.l)))
  let applied = 0
  if (f.st === 'play' && p.dmg > 0) {
    applied = Math.max(0, Math.min(Math.round(p.dmg), capNow() - m.d, f.hp))
  }
  const members = { ...f.members, [p.n]: { l, d: m.d + applied } }
  set({ members, hp: f.hp - applied })
  if (get().hp <= 0 && f.st === 'play') leaderPhaseClear()
  else leaderStuck()
}

/* ---------- 받은 신호 ---------- */

export function fightOnEvent(p: FightPayload) {
  const f = get()
  if (p.k === 'd') {
    if (p.gid !== f.gid) return
    // 친구가 공격하면 그 친구 캐릭터가 무기를 휘두른다
    if (p.dmg > 0 && p.n !== io?.me && f.st === 'play') {
      startSwing(p.n, 0, io?.weaponOf(p.n) ?? null)
      raidFx.hitAt = Date.now()
    }
    if (io?.isLeader()) leaderApply(p)
    return
  }
  const s = p.s
  if (!s || typeof s.gid !== 'number' || (f.gid !== 0 && s.gid !== f.gid)) return
  if (io?.isLeader() && f.st !== 'idle') return // 대장은 자기 상태를 따른다
  const now = Date.now()
  const members: Fight['members'] = {}
  const order: string[] = []
  for (const row of s.m) {
    if (!Array.isArray(row) || typeof row[0] !== 'string') continue
    members[row[0]] = { l: Math.max(0, Number(row[1]) || 0), d: Math.max(0, Number(row[2]) || 0) }
    order.push(row[0])
  }
  const me = io?.me ?? ''
  const phaseChanged = s.ph !== f.ph || (f.st === 'between' && s.st === 'play') || f.st === 'idle'
  const next: Partial<Fight> = {
    gid: s.gid,
    ph: s.ph,
    st: s.st,
    hp: s.hp,
    max: s.max,
    members,
    order,
    endsAt: now + s.left * 1000,
    nextAt: s.w > 0 ? now + s.w : 0,
    why: s.why ?? null,
  }
  if (phaseChanged && members[me]) {
    next.myL = members[me].l
    next.myD = members[me].d
    next.q = null
    next.res = null
    next.askAt = now + 600
    pending = 0
    lifeDirty = false
  }
  if ((s.st === 'won' || s.st === 'lost') && f.st !== s.st) {
    raidFx.clearAt = now
    next.q = null
  }
  set(next)
}

/* ---------- 내 문제 풀이 ---------- */

const HANDS = ['가위', '바위', '보']

function judge(q: BossQ, p: Answer | undefined, timeout: boolean): { ok: boolean; draw: boolean; text: string; pick?: string } {
  const k = q.k ?? 'mc'
  if (k === 'mc') {
    const a = q.a as number
    return { ok: !timeout && p === a, draw: false, text: q.o[a], pick: typeof p === 'number' ? q.o[p] : undefined }
  }
  if (k === 'tiles') {
    const w = String(q.a)
    return { ok: !timeout && typeof p === 'string' && p.toLowerCase() === w, draw: false, text: w, pick: typeof p === 'string' ? p : undefined }
  }
  if (k === 'num') {
    const a = String(q.a)
    return { ok: !timeout && typeof p === 'string' && Math.abs(Number(p) - Number(q.a)) < 1e-9, draw: false, text: a, pick: typeof p === 'string' ? p : undefined }
  }
  if (k === 'order') {
    const a = q.a as number[]
    return {
      ok: !timeout && Array.isArray(p) && p.length === a.length && p.every((x, i) => x === a[i]),
      draw: false,
      text: a.map((i) => q.o[i]).join(' → '),
      pick: Array.isArray(p) ? p.map((i) => q.o[i as number]).join(' → ') : undefined,
    }
  }
  if (k === 'rps') {
    const b = Math.floor(Math.random() * 3)
    const me = typeof p === 'number' ? p : -1
    if (timeout || me < 0) return { ok: false, draw: false, text: `보스: ${HANDS[b]}` }
    const draw = me === b
    return { ok: !draw && (me + 2) % 3 === b, draw, text: `보스: ${HANDS[b]}`, pick: HANDS[me] }
  }
  const count = 1 + Math.floor(Math.random() * 9) // 홀짝: 보스가 도토리 1~9개를 쥐고 있다
  const odd = count % 2 === 1
  const me = typeof p === 'number' ? p : -1
  return { ok: !timeout && me >= 0 && odd === (me === 0), draw: false, text: `도토리 ${count}개 → ${odd ? '홀수' : '짝수'}`, pick: me === 0 ? '홀수' : me === 1 ? '짝수' : undefined }
}

function pickTier(ph: number): 1 | 2 | 3 {
  const mix = RAID_TIER_MIX[Math.max(0, Math.min(RAID_PHASES - 1, ph - 1))]
  let r = Math.random()
  for (let i = 0; i < 3; i++) {
    if (r < mix[i]) return (i + 1) as 1 | 2 | 3
    r -= mix[i]
  }
  return 3
}

function makeQuestion() {
  const f = get()
  if (!deck) deck = new Deck(4)
  const qn = f.qn + 1
  const luck = qn % RAID_LUCK_EVERY === 0
  let q: BossQ
  let lv: 1 | 2 | 3
  if (luck) {
    q = Math.random() < 0.5 ? rpsQ() : oeQ()
    lv = 2
    q.ms = timeFor(q, 2)
  } else {
    lv = pickTier(f.ph)
    q = deck.next(lv)
    for (let i = 0; i < 6 && (q.k === 'rps' || q.k === 'oe'); i++) q = deck.next(lv) // 운 문제는 정해진 차례에만 낸다
    q.ms = q.ms ?? timeFor(q, lv)
  }
  const ms = Math.round((q.ms ?? 8000) * RAID_TIME_MULT)
  set({ q, qAt: Date.now(), qMs: ms, qn, qLv: lv, luck, res: null })
}

export function fightAnswer(p: Answer | null) {
  const f = get()
  if (!io || f.st !== 'play' || !f.q || f.res) return
  const timeout = p === null
  const j = judge(f.q, p, timeout)
  let dmg = 0
  let capped = false
  let myL = f.myL
  let myD = f.myD
  if (j.ok) {
    const base = f.luck ? RAID_LUCK_DMG : RAID_DMG[f.qLv]
    const room = Math.max(0, capNow() - myD)
    dmg = Math.min(base, room)
    myD += dmg
    capped = myD >= capNow()
    pending += dmg
    if (dmg > 0) {
      raidFx.hitAt = Date.now()
      const w = useVillage.getState().avatar.weapon
      startSwing(io.me, 0, w)
    }
  } else if (!j.draw) {
    // 가위바위보·홀짝에서 지는 것은 목숨이 줄지 않는다 (운으로 목숨을 잃으면 억울하다)
    if (!f.luck) {
      myL = Math.max(0, myL - 1)
      lifeDirty = true
    }
  }
  const dead = myL <= 0
  if (dead) raidFx.deadAt = Date.now()
  const res: Res = { ok: j.ok, draw: j.draw, timeout, dmg, text: j.text, pick: j.pick, capped, dead }
  set({ myL, myD, res, askAt: Date.now() + RAID_Q_GAP_MS })
  // 쓰러지거나 한계에 닿으면 바로 알린다 (대장이 상황을 빨리 알아야 한다)
  flush(dead || capped)
}

function flush(force: boolean) {
  if (!io) return
  const f = get()
  if (pending <= 0 && !lifeDirty) return
  const gap = Math.min(8000, Math.max(3000, io.present().length * 350)) // 사람이 많을수록 덜 자주 보낸다 (서버 메시지 한도)
  if (!force && Date.now() - lastFlush < gap) return
  const p: Extract<FightPayload, { k: 'd' }> = { k: 'd', gid: f.gid, n: io.me, dmg: pending, l: f.myL }
  pending = 0
  lifeDirty = false
  lastFlush = Date.now()
  if (io.isLeader()) leaderApply(p)
  io.send(p)
}

/* ---------- 0.25초마다 (모든 사람) ---------- */

export function fightTick() {
  const f = get()
  if (!io || f.st === 'idle') return
  if (io.isLeader()) leaderTick()
  const g = get()
  if (g.st !== 'play') return
  const now = Date.now()
  const alive = g.myL > 0
  const canAct = alive && g.myD < capNow()
  if (g.res && now >= g.askAt) set({ q: null, res: null })
  else if (!g.res && canAct) {
    if (!g.q && now >= g.askAt) makeQuestion()
    else if (g.q && now > g.qAt + g.qMs) fightAnswer(null) // 시간 초과
  }
  flush(false)
}

// 대장이 나갔을 때 새 대장이 이어받는다 — 지금까지 받은 상태 그대로 계속하면 되므로 마지막 장면 시각만 맞춘다
export function fightAdoptLeader() {
  lastSnap = 0
}

export const fightMyCap = () => capNow()

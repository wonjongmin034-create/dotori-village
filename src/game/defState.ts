import { create } from 'zustand'
import {
  BOX_CHANCE,
  BOX_GOLD,
  BREAK_MS,
  DEF_MAX,
  DEF_MIN,
  DEF_STAGES,
  DEF_WAVES,
  EMERGENCY_STUN_S,
  HEAL_PER_S,
  HEAL_R,
  HOLD_S,
  MAX_TOWER_TIER,
  MONSTERS,
  OWNER_SHARE,
  PREP_MS,
  SPEC_BOOST,
  START_GOLD,
  STAGE_GOLD,
  SYNERGY,
  SYNERGY_R,
  TAUNT_R,
  TEAM_HP,
  TEAM_GOLD,
  TIER_DMG,
  TIER_HP,
  rangeOf,
  TOWERS,
  TOWER_KINDS,
  TREE_HP,
  buildCost,
  evolveCost,
  lanePos,
  mapOf,
  type DefMap,
  waveHpMult,
  waveOf,
  type MonKind,
  type TowerKind,
} from './defData'
import { defQuestion, publicDefQ, type DefQ } from './defQuestions'
import { isFamily } from './weapons'

// 도토리 나무 수비대 — 보스방과 같은 방식: "방장"(방에 제일 먼저 들어온 사람)이 몬스터·탑을 혼자 계산하고,
// 0.25초마다 지금 모습(장면)을 모두에게 알린다. 다른 사람은 "탑 짓기·진화·답"만 방장에게 보낸다.
// 문제의 정답은 방장만 안다 (문제를 보낼 때 정답을 빼고 보낸다).

export type DefMember = { n: string; jb: string | null; cl: number; tl: number } // 이름, 직업, 깬 단계, 오늘 남은 입장
export type DefSt = 'prep' | 'wave' | 'break' | 'won' | 'lost' | 'aborted'
// 탑: [id, 빈 터 번호, 종류, 단계, 갈림길(0·1·2), 주인, 체력 %, 전문가(1/0), 완벽 시공(1/0)]
export type TowerRow = [number, number, TowerKind, number, number, string, number, number, number]
// 몬스터: [id, 종류, 길 위 거리, 체력 %, 상태(1 느림 · 2 붙잡힘 · 4 불탐 · 8 중독 · 16 기절 · 32 공격 중), 길 번호]
export type MonRow = [number, MonKind, number, number, number, number]
export type Snap = {
  gid: number
  host: string
  st: DefSt
  stage: number
  wave: number
  tree: number
  left: number // prep/break 남은 시간(ms)
  gold: Record<string, number>
  kills: Record<string, number>
  towers: TowerRow[]
  mons: MonRow[]
  shots: [number, number][] // [탑 id, 몬스터 id] — 방금 쏜 것 (화면 연출용)
  booms: [number, number, number][] // [x, z, 반경] — 방금 터진 것
  next: MonKind[] // 다음 웨이브에 오는 몬스터 종류
  box: number // 보급 상자가 놓인 길 위 거리 (-1 = 없음)
  busy: [number, string][] // 공사 중인 빈 터 [번호, 누가]
  members: string[]
  seq: number
}
export type DefPayload =
  | { k: 'snap'; s: Snap }
  | { k: 'lb'; stage: number }
  | { k: 'req'; n: string; spot: number; kind: TowerKind }
  | { k: 'evo'; n: string; tid: number; br?: number }
  | { k: 'gift'; n: string; to: string; amt: number }
  | { k: 'box'; n: string }
  | { k: 'q'; to: string; qid: number; q: Omit<DefQ, 'a'>; why: 'build' | 'box' | 'emq' }
  | { k: 'ans'; n: string; qid: number; p: number }
  | { k: 'qr'; to: string; qid: number; ok: boolean; a: string; note: string }
  | { k: 'note'; text: string }

type IO = { send: (p: DefPayload) => void; track: () => void }
export type MyQuiz = { qid: number; q: Omit<DefQ, 'a'>; why: 'build' | 'box' | 'emq'; at: number; picked: number }
export type Sel = { t: 'spot'; i: number } | { t: 'tower'; id: number } | null

type DefState = {
  roster: DefMember[]
  host: string | null
  lobbyStage: number
  snap: Snap | null
  rcvAt: number // 마지막 장면을 받은 시각 (내 시계)
  prev: Snap | null // 그 전 장면 (몬스터 움직임을 부드럽게)
  myQ: MyQuiz | null
  qres: { qid: number; ok: boolean; a: string; note: string } | null
  sel: Sel
  banner: string | null
  result: { gid: number; won: boolean; stage: number; stars: number; coins: number; note: string } | null
}
const initial: DefState = { roster: [], host: null, lobbyStage: 1, snap: null, rcvAt: 0, prev: null, myQ: null, qres: null, sel: null, banner: null, result: null }
export const useDef = create<DefState>(() => ({ ...initial }))

let io: IO | null = null
let me = ''
let tickTimer: ReturnType<typeof setInterval> | null = null
let myCleared = 0
let myLeft = 3
let myJob: string | null = null
export const setDefMe = (cleared: number, left: number, job: string | null) => {
  myCleared = cleared
  myLeft = left
  myJob = job
}
export const defPresence = () => ({ dm: { cl: myCleared, tl: myLeft } })
export const defMe = () => me
export const isDefHost = () => useDef.getState().host === me

export function bindDefIO(next: IO, name: string) {
  io = next
  me = name
  if (tickTimer) clearInterval(tickTimer)
  tickTimer = setInterval(hostTick, 100)
}
export function defReset() {
  if (tickTimer) clearInterval(tickTimer)
  tickTimer = null
  io = null
  sim = null
  useDef.setState({ ...initial })
}

const flash = (text: string, ms = 3000) => {
  useDef.setState({ banner: text })
  setTimeout(() => {
    if (useDef.getState().banner === text) useDef.setState({ banner: null })
  }, ms)
}
export const defBanner = flash

/* ---------- 방 (presence) ---------- */
type Meta = { avatar?: { jb?: string | null }; dm?: { cl?: number; tl?: number } }
export function defOnPresence(state: Record<string, Meta[]>, allowed: string[]) {
  const roster: DefMember[] = allowed.map((n) => {
    const m = state[n]?.[0]
    const jb = m?.avatar?.jb
    return {
      n,
      jb: isFamily(jb) ? jb : null,
      cl: typeof m?.dm?.cl === 'number' ? Math.max(0, Math.min(DEF_STAGES, Math.round(m.dm.cl))) : 0,
      tl: typeof m?.dm?.tl === 'number' ? Math.max(0, Math.round(m.dm.tl)) : 3,
    }
  })
  useDef.setState({ roster, host: allowed[0] ?? null })
  const s = useDef.getState().snap
  // 방장이 나가면 싸움을 멈춘다 (새 방장이 이어받을 수는 없다)
  if (s && active(s) && !allowed.includes(s.host)) {
    useDef.setState({ snap: { ...s, st: 'aborted' }, myQ: null })
    flash('방장이 나가서 수비가 멈췄어요', 5000)
  }
  if (sim && active(sim.snapBase()) && sim.host === me) {
    // 방장: 나간 친구는 문제를 못 받는다 (계산은 계속)
  }
}
export const active = (s: { st: DefSt }) => s.st === 'prep' || s.st === 'wave' || s.st === 'break'

export const maxStageFor = (r: DefMember[]) => (r.length ? Math.min(DEF_STAGES, Math.min(...r.map((m) => m.cl)) + 1) : 1)
export function startBlock(r: DefMember[]): string | null {
  if (r.length < DEF_MIN && !soloDev()) return `${DEF_MIN}명 이상 모여야 해요 (지금 ${r.length}명)`
  if (r.length > DEF_MAX) return `${DEF_MAX}명까지만 함께할 수 있어요`
  const no = r.filter((m) => m.tl <= 0)
  if (no.length) return `${no.map((m) => m.n).join(', ')}님은 오늘 입장 기회를 다 썼어요`
  return null
}
// 개발 중에만 혼자 시험 (?solo)
const soloDev = () => {
  try {
    return /[?&]solo(\b|=)/.test(location.search)
  } catch {
    return false
  }
}

export function chooseDefStage(stage: number) {
  const st = useDef.getState()
  if (st.host !== me) return
  const s = Math.max(1, Math.min(maxStageFor(st.roster), stage))
  useDef.setState({ lobbyStage: s })
  io?.send({ k: 'lb', stage: s })
}

/* ====================== 방장: 계산 ====================== */
type Tower = { id: number; spot: number; kind: TowerKind; tier: number; br: number; owner: string; hp: number; max: number; cd: number; spec: boolean; perfect: boolean }
type Mon = {
  id: number
  kind: MonKind
  hs: number // 체력 배율 (치료량도 같이 커진다)
  l: number // 몇 번째 길
  d: number
  hp: number
  max: number
  slowUntil: number
  slowF: number
  holdUntil: number
  burnUntil: number
  burnDps: number
  poisonUntil: number
  poisonDps: number
  stunUntil: number
  target: number // 공격 중인 탑 id (-1 없음)
  lastBy: number // 마지막으로 때린 탑 id
}
type Pending = { n: string; why: 'build' | 'box' | 'emq'; spot: number; kind: TowerKind; cost: number; q: DefQ; at: number }

class Sim {
  gid: number
  host: string
  stage: number
  map: DefMap
  laneTurn = 0
  members: string[]
  jobs: Record<string, string | null>
  st: DefSt = 'prep'
  wave = 0
  tree = TREE_HP
  t = 0 // 계산 시각 (초)
  phaseEnd: number // prep/break 이 끝나는 계산 시각
  gold: Record<string, number> = {}
  kills: Record<string, number> = {}
  towers: Tower[] = []
  mons: Mon[] = []
  queue: { kind: MonKind; at: number }[] = []
  shots: [number, number][] = []
  booms: [number, number, number][] = []
  box = -1
  pend = new Map<number, Pending>()
  emq: { ids: number[]; ok: Set<string>; bad: boolean; done: Set<string>; until: number } | null = null
  kingWave = 0
  nextId = 1
  qid = 1
  seq = 1

  constructor(gid: number, host: string, stage: number, members: string[], jobs: Record<string, string | null>) {
    this.gid = gid
    this.host = host
    this.stage = stage
    this.map = mapOf(stage)
    this.members = members
    this.jobs = jobs
    for (const n of members) {
      this.gold[n] = START_GOLD + (stage - 1) * STAGE_GOLD
      this.kills[n] = 0
    }
    this.phaseEnd = PREP_MS / 1000
  }

  snapBase() {
    return { st: this.st }
  }

  snap(): Snap {
    const s: Snap = {
      gid: this.gid,
      host: this.host,
      st: this.st,
      stage: this.stage,
      wave: this.wave,
      tree: Math.max(0, Math.round(this.tree)),
      left: this.st === 'prep' || this.st === 'break' ? Math.max(0, Math.round((this.phaseEnd - this.t) * 1000)) : 0,
      gold: Object.fromEntries(Object.entries(this.gold).map(([k, v]) => [k, Math.floor(v)])),
      kills: { ...this.kills },
      towers: this.towers.map((x) => [x.id, x.spot, x.kind, x.tier, x.br, x.owner, Math.max(0, Math.round((x.hp / x.max) * 100)), x.spec ? 1 : 0, x.perfect ? 1 : 0]),
      mons: this.mons.map((m) => [
        m.id,
        m.kind,
        Math.round(m.d * 10) / 10,
        Math.max(0, Math.round((m.hp / m.max) * 100)),
        (m.slowUntil > this.t ? 1 : 0) | (m.holdUntil > this.t ? 2 : 0) | (m.burnUntil > this.t ? 4 : 0) | (m.poisonUntil > this.t ? 8 : 0) | (m.stunUntil > this.t ? 16 : 0) | (m.target >= 0 ? 32 : 0),
        m.l,
      ]),
      shots: this.shots.slice(-30),
      booms: this.booms.slice(-12),
      next: this.st === 'won' || this.wave >= DEF_WAVES ? [] : [...new Set(waveOf(this.stage, this.wave + 1).map((x) => x[0]))],
      box: this.box,
      busy: [...this.pend.values()].filter((p) => p.why === 'build').map((p) => [p.spot, p.n] as [number, string]),
      members: this.members,
      seq: this.seq++,
    }
    this.shots = []
    this.booms = []
    return s
  }

  startWave() {
    this.wave += 1
    this.st = 'wave'
    this.box = -1
    const list = waveOf(this.stage, this.wave)
    let at = this.t + 0.5
    const q: { kind: MonKind; at: number }[] = []
    // 종류별로 섞어서 차례로 나온다
    const lanes = list.map(([kind, n, gap]) => Array.from({ length: n }, (_, i) => ({ kind, at: at + i * gap })))
    for (const l of lanes) q.push(...l)
    q.sort((a, b) => a.at - b.at)
    // 너무 몰리지 않게 최소 간격
    for (let i = 1; i < q.length; i++) if (q[i].at - q[i - 1].at < 0.25) q[i].at = q[i - 1].at + 0.25
    at = 0
    this.queue = q
  }

  // 몬스터 위치 · 남은 거리
  pos(m: Mon) {
    return lanePos(this.map.lanes[m.l] ?? this.map.lanes[0], m.d)
  }
  leftOf(m: Mon) {
    return (this.map.lanes[m.l] ?? this.map.lanes[0]).len - m.d
  }

  spawn(kind: MonKind, d = 0, hpScale = 1, lane = -1) {
    const def = MONSTERS[kind]
    // 길이 여러 갈래면 번갈아 나온다
    const l = lane >= 0 ? lane : this.laneTurn++ % this.map.lanes.length
    const hp = Math.round(def.hp * waveHpMult(this.stage, Math.max(1, this.wave)) * hpScale * TEAM_HP[Math.min(4, this.members.length)])
    this.mons.push({ id: this.nextId++, kind, hs: hp / def.hp, l, d, hp, max: hp, slowUntil: 0, slowF: 1, holdUntil: 0, burnUntil: 0, burnDps: 0, poisonUntil: 0, poisonDps: 0, stunUntil: 0, target: -1, lastBy: -1 })
    if (kind === 'king' && this.kingWave !== this.wave) {
      this.kingWave = this.wave
      this.startEmergency()
    }
  }

  // 탑 능력치
  towerStats(x: Tower) {
    const def = TOWERS[x.kind]
    const spec = x.spec && x.tier >= 3 ? SPEC_BOOST : 1
    let dmg = def.dmg * TIER_DMG[x.tier]
    let rate = def.rate
    const range = rangeOf(x.kind, x.tier, x.br)
    let splash = def.splash ?? 0
    let air = def.air
    let taunt = TAUNT_R
    let heal = HEAL_PER_S * TIER_DMG[x.tier]
    let hold = HOLD_S
    if (x.kind === 'sword') {
      if (x.br === 1) taunt += 1
      if (x.br === 2) dmg *= 1.7
      taunt *= spec
    }
    if (x.kind === 'hammer') {
      if (x.br === 1) heal *= 1.8
      heal *= spec
    }
    if (x.kind === 'bow') {
      if (x.br === 1) rate /= 1.8
      if (x.br === 2) dmg *= 1.8
      air *= spec
    }
    if (x.kind === 'staff') splash *= spec
    if (x.kind === 'axe') {
      if (x.br === 1) splash *= 2.4
      if (x.br === 2) dmg *= 1.8
    }
    if (x.kind === 'spear') {
      if (x.br === 2) rate /= 2
      hold *= spec
    }
    if (x.perfect) dmg *= 1.1
    return { dmg, rate, range, splash, air, taunt, heal, hold, spec }
  }

  maxHpOf(kind: TowerKind, tier: number, br: number, spec: boolean) {
    let hp = TOWERS[kind].hp * TIER_HP[tier]
    if (kind === 'sword' && br === 1) hp *= 1.6
    if (kind === 'sword' && spec && tier >= 3) hp *= SPEC_BOOST
    return Math.round(hp)
  }

  // 주변 대장간(전투)·연계 보너스
  dmgBonus(x: Tower): number {
    const [sx, sz] = this.map.spots[x.spot]
    let b = 1
    const kinds = new Set<TowerKind>()
    let forge = false
    for (const o of this.towers) {
      const [ox, oz] = this.map.spots[o.spot]
      const d = Math.hypot(ox - sx, oz - sz)
      if (d <= SYNERGY_R) kinds.add(o.kind)
      if (o !== x && o.kind === 'hammer' && o.br === 2 && d <= this.towerStats(o).range) forge = true
    }
    if (kinds.size >= 3) b *= SYNERGY
    if (forge) b *= 1.2
    return b
  }

  hurt(m: Mon, dmg: number, by: Tower | null) {
    if (m.hp <= 0) return
    m.hp -= dmg
    if (by) m.lastBy = by.id
    if (m.hp <= 0) this.kill(m)
  }

  kill(m: Mon) {
    const def = MONSTERS[m.kind]
    const by = this.towers.find((t) => t.id === m.lastBy)
    const g = def.gold * TEAM_GOLD[Math.min(4, this.members.length)]
    if (by) {
      this.gold[by.owner] = (this.gold[by.owner] ?? 0) + g * OWNER_SHARE
      this.kills[by.owner] = (this.kills[by.owner] ?? 0) + 1
    }
    const share = (by ? g * (1 - OWNER_SHARE) : g) / Math.max(1, this.members.length)
    for (const n of this.members) this.gold[n] = (this.gold[n] ?? 0) + share
    if (def.split) for (let i = 0; i < def.split; i++) this.spawn('slime', Math.max(0, m.d - 0.4 * i), 0.55, m.l)
  }

  tick(dt: number) {
    if (!active(this)) return
    this.t += dt
    const t = this.t
    // 단계 넘기기
    if ((this.st === 'prep' || this.st === 'break') && t >= this.phaseEnd) this.startWave()
    // 몬스터 나오기
    while (this.queue.length && this.queue[0].at <= t) this.spawn(this.queue.shift()!.kind)

    // 몬스터 움직임 · 공격
    for (const m of this.mons) {
      if (m.hp <= 0) continue
      const def = MONSTERS[m.kind]
      if (m.burnUntil > t) this.hurt(m, m.burnDps * dt, null)
      if (m.poisonUntil > t) this.hurt(m, m.poisonDps * dt, null)
      if (m.hp <= 0) continue
      const [mx, mz] = this.pos(m)
      const stunned = m.stunUntil > t
      // 탑을 노리는 몬스터 (도끼 고블린 · 대왕 · 폭탄벌레)
      if ((def.attack || def.bomb) && !def.air && !stunned) {
        let tgt = this.towers.find((x) => x.id === m.target && x.hp > 0)
        if (!tgt) {
          m.target = -1
          // 검사 초소가 끌어온다
          const near = this.towers
            .map((x) => ({ x, d: Math.hypot(this.map.spots[x.spot][0] - mx, this.map.spots[x.spot][1] - mz) }))
            .filter((o) => o.d <= (o.x.kind === 'sword' ? this.towerStats(o.x).taunt : 2.8))
            .sort((a, b) => (a.x.kind === 'sword' ? 0 : 1) - (b.x.kind === 'sword' ? 0 : 1) || a.d - b.d)
          tgt = near[0]?.x
          if (tgt) m.target = tgt.id
        }
        if (tgt) {
          if (def.bomb) {
            tgt.hp -= def.bomb
            this.booms.push([this.map.spots[tgt.spot][0], this.map.spots[tgt.spot][1], 1.2])
            m.hp = 0
            m.target = -1
          } else {
            tgt.hp -= (def.attack ?? 0) * dt
            // 반격 초소: 맞으면 되받아친다
            if (tgt.kind === 'sword' && tgt.br === 2) this.hurt(m, (def.attack ?? 0) * 0.5 * dt, tgt)
          }
          if (tgt.hp <= 0) m.target = -1
          continue // 공격하는 동안은 멈춰 있다
        }
      }
      if (stunned || m.holdUntil > t) continue
      const slow = m.slowUntil > t ? m.slowF : 1
      m.d += def.spd * slow * dt
      if (this.leftOf(m) <= 0) {
        this.tree -= def.leak
        m.hp = 0
        m.lastBy = -1
        this.booms.push([...this.pos(m), 0.8])
      }
    }
    // 치유 주술사: 주변 몬스터를 치료한다
    for (const h of this.mons) {
      const heal = MONSTERS[h.kind].heal
      if (!heal || h.hp <= 0 || h.stunUntil > t) continue
      const [hx, hz] = this.pos(h)
      for (const m of this.mons) {
        if (m === h || m.hp <= 0 || m.hp >= m.max) continue
        const [mx, mz] = this.pos(m)
        if (Math.hypot(mx - hx, mz - hz) <= HEAL_R) m.hp = Math.min(m.max, m.hp + heal * h.hs * dt)
      }
    }
    // 부서진 탑 치우기
    const broken = this.towers.filter((x) => x.hp <= 0)
    if (broken.length) {
      for (const b of broken) this.booms.push([this.map.spots[b.spot][0], this.map.spots[b.spot][1], 1.4])
      this.towers = this.towers.filter((x) => x.hp > 0)
    }

    // 탑 공격 · 수리
    for (const x of this.towers) {
      const s = this.towerStats(x)
      const [sx, sz] = this.map.spots[x.spot]
      if (x.kind === 'hammer') {
        for (const o of this.towers) {
          if (o.hp >= o.max) continue
          if (Math.hypot(this.map.spots[o.spot][0] - sx, this.map.spots[o.spot][1] - sz) <= s.range) o.hp = Math.min(o.max, o.hp + s.heal * dt)
        }
      }
      x.cd -= dt
      if (x.cd > 0) continue
      // 사거리 안에서 가장 앞서 가는 몬스터
      let best: Mon | null = null
      for (const m of this.mons) {
        if (m.hp <= 0) continue
        const air = MONSTERS[m.kind].air
        if (air && s.air <= 0) continue
        const [mx, mz] = this.pos(m)
        if (Math.hypot(mx - sx, mz - sz) > s.range) continue
        // 약점인 몬스터(예: 궁수탑 → 치유 주술사)를 먼저, 그다음 가장 앞서 가는 몬스터
        const wk = MONSTERS[m.kind].weak?.[0] === x.kind
        const bwk = best ? MONSTERS[best.kind].weak?.[0] === x.kind : false
        if (!best || (wk && !bwk) || (wk === bwk && this.leftOf(m) < this.leftOf(best))) best = m
      }
      if (!best) continue
      x.cd = s.rate
      this.shots.push([x.id, best.id])
      const def = TOWERS[x.kind]
      const bonus = this.dmgBonus(x)
      const hitOne = (m: Mon, mult = 1) => {
        const md = MONSTERS[m.kind]
        if (md.evasive && !def.melee && Math.random() < md.evasive) return
        let d = s.dmg * bonus * mult
        if (md.air) d *= s.air
        const pierce = (md.pierce ?? ['axe']).includes(x.kind)
        if (md.armor && !pierce) d *= md.armor
        if (md.armor && pierce) d *= s.spec
        if (md.weak?.[0] === x.kind) d *= md.weak[1]
        this.hurt(m, d, x)
        if (m.hp <= 0) return
        if (x.kind === 'staff' && x.br === 1) {
          m.burnUntil = this.t + 3
          m.burnDps = Math.max(m.burnDps, s.dmg * 0.35)
        }
        if (x.kind === 'staff' && x.br === 2) {
          m.slowUntil = this.t + 2
          m.slowF = 0.55
        }
        if (x.kind === 'spear') {
          m.holdUntil = this.t + s.hold * (m.kind === 'king' ? 0.4 : 1)
          if (x.br === 1) {
            m.poisonUntil = this.t + 4
            m.poisonDps = Math.max(m.poisonDps, s.dmg * 0.3)
          }
        }
      }
      if (s.splash > 0) {
        const [bx, bz] = this.pos(best)
        this.booms.push([bx, bz, s.splash])
        for (const m of this.mons) {
          if (m.hp <= 0) continue
          if (MONSTERS[m.kind].air && s.air <= 0) continue
          const [mx, mz] = this.pos(m)
          if (Math.hypot(mx - bx, mz - bz) <= s.splash) hitOne(m, m === best ? 1 : 0.7)
        }
      } else hitOne(best)
    }
    this.mons = this.mons.filter((m) => m.hp > 0)

    // 긴급 퀴즈 시간 끝
    if (this.emq && t >= this.emq.until) this.finishEmergency()

    // 승패 · 웨이브 끝
    if (this.tree <= 0) {
      this.st = 'lost'
      return
    }
    if (this.st === 'wave' && !this.queue.length && !this.mons.length) {
      if (this.wave >= DEF_WAVES) {
        this.st = 'won'
        return
      }
      this.st = 'break'
      this.phaseEnd = t + BREAK_MS / 1000
      this.box = Math.random() < BOX_CHANCE ? 6 + Math.random() * (this.map.lanes[0].len - 14) : -1
    }
  }

  /* ----- 문제 ----- */
  ask(n: string, why: Pending['why'], spot = -1, kind: TowerKind = 'sword', cost = 0): number {
    const q = defQuestion()
    const qid = this.qid++
    this.pend.set(qid, { n, why, spot, kind, cost, q, at: Date.now() })
    send({ k: 'q', to: n, qid, q: publicDefQ(q), why })
    return qid
  }

  answer(n: string, qid: number, p: number) {
    const pd = this.pend.get(qid)
    if (!pd || pd.n !== n) return
    this.pend.delete(qid)
    const ok = p === pd.q.a
    const fast = Date.now() - pd.at <= 5000
    const a = pd.q.o[pd.q.a as number]
    let note = ''
    if (pd.why === 'build') {
      if (ok && active(this) && !this.towers.some((x) => x.spot === pd.spot)) {
        const spec = this.jobs[n] === pd.kind
        const tier = spec ? 2 : 1
        const max = this.maxHpOf(pd.kind, tier, 0, spec)
        this.towers.push({ id: this.nextId++, spot: pd.spot, kind: pd.kind, tier, br: 0, owner: n, hp: max, max, cd: 0.3, spec, perfect: fast })
        note = `${TOWERS[pd.kind].emoji} ${TOWERS[pd.kind].name} 완성!${fast ? ' ⭐ 완벽 시공 (공격력 +10%)' : ''}${spec ? ' 🎖️ 전문가 2단계' : ''}`
      } else if (ok) {
        this.gold[n] = (this.gold[n] ?? 0) + pd.cost // 그 사이 자리가 찼다 → 돌려준다
        note = '그 자리는 이미 찼어요 (돈은 돌려받았어요)'
      } else note = `틀렸어요… 공사 실패 💸 −${pd.cost}`
    } else if (pd.why === 'box') {
      if (ok) {
        this.gold[n] = (this.gold[n] ?? 0) + BOX_GOLD
        note = `🎁 보급 상자! +${BOX_GOLD}`
      } else note = '틀렸어요… 상자가 사라졌어요'
    } else if (pd.why === 'emq' && this.emq) {
      this.emq.done.add(n)
      if (ok) this.emq.ok.add(n)
      else this.emq.bad = true
      note = ok ? '정답! 친구들을 기다려요' : '틀렸어요…'
      if (this.members.every((m) => this.emq!.done.has(m) || !present().has(m))) this.finishEmergency()
    }
    send({ k: 'qr', to: n, qid, ok, a, note })
  }

  // 시간이 지난 문제는 틀린 것으로
  expire() {
    const now = Date.now()
    for (const [qid, pd] of this.pend) if (now - pd.at > (pd.q.ms ?? 7000) + 1500) this.answer(pd.n, qid, -1)
  }

  startEmergency() {
    const ids: number[] = []
    const here = present()
    for (const n of this.members) if (here.has(n)) ids.push(this.ask(n, 'emq'))
    this.emq = { ids, ok: new Set(), bad: false, done: new Set(), until: this.t + 10.5 }
    note('🚨 몬스터 대왕 등장! 긴급 퀴즈 — 모두 맞히면 대왕이 기절해요')
  }
  finishEmergency() {
    if (!this.emq) return
    const e = this.emq
    this.emq = null
    for (const id of e.ids) this.pend.delete(id)
    const here = present()
    const need = this.members.filter((m) => here.has(m))
    if (!e.bad && need.every((m) => e.ok.has(m))) {
      for (const m of this.mons) if (m.kind === 'king') m.stunUntil = this.t + EMERGENCY_STUN_S
      note(`⚡ 모두 정답! 몬스터 대왕이 ${EMERGENCY_STUN_S}초 동안 기절했어요`)
    } else note('😵 긴급 퀴즈 실패… 대왕이 계속 다가와요')
  }

  /* ----- 요청 ----- */
  request(n: string, spot: number, kind: TowerKind) {
    if (!active(this) || !TOWER_KINDS.includes(kind) || spot < 0 || spot >= this.map.spots.length) return
    if (this.towers.some((x) => x.spot === spot)) return
    if ([...this.pend.values()].some((p) => p.why === 'build' && (p.spot === spot || p.n === n))) return
    const cost = buildCost(kind, this.jobs[n] ?? null)
    if ((this.gold[n] ?? 0) < cost) return
    this.gold[n] -= cost // 맞히지 못하면 이 돈을 잃는다
    this.ask(n, 'build', spot, kind, cost)
  }
  evolve(n: string, tid: number, br?: number) {
    const x = this.towers.find((o) => o.id === tid)
    if (!x || x.owner !== n || x.tier >= MAX_TOWER_TIER) return
    const cost = evolveCost(x.kind, x.tier, this.jobs[n] ?? null)
    if (cost == null || (this.gold[n] ?? 0) < cost) return
    if (x.tier === 2 && br !== 1 && br !== 2) return // 3단계는 갈림길을 골라야 한다
    this.gold[n] -= cost
    x.tier += 1
    if (x.tier === 3) x.br = br!
    const max = this.maxHpOf(x.kind, x.tier, x.br, x.spec)
    x.hp = Math.min(max, x.hp + (max - x.max))
    x.max = max
  }
  gift(n: string, to: string, amt: number) {
    const a = Math.floor(amt)
    if (a <= 0 || !this.members.includes(to) || to === n || (this.gold[n] ?? 0) < a) return
    this.gold[n] -= a
    this.gold[to] = (this.gold[to] ?? 0) + a
    note(`💝 ${n}님이 ${to}님에게 ${a}원을 보냈어요`)
  }
  claimBox(n: string) {
    if (this.box < 0 || this.st !== 'break') return
    this.box = -1
    this.ask(n, 'box')
  }
}

let sim: Sim | null = null
let lastSnap = 0
let lastTick = 0

const present = () => new Set(useDef.getState().roster.map((r) => r.n))
function send(p: DefPayload) {
  // 방장 자신에게 가는 것은 바로 처리한다
  if ((p.k === 'q' || p.k === 'qr') && p.to === me) onEvent(p)
  else io?.send(p)
  if (p.k === 'note') onEvent(p)
}
const note = (text: string) => send({ k: 'note', text })

function publish() {
  if (!sim) return
  const s = sim.snap()
  io?.send({ k: 'snap', s })
  applySnap(s)
  lastSnap = Date.now()
}

function hostTick() {
  const st = useDef.getState()
  if (!sim || st.host !== me || sim.host !== me) return
  const now = performance.now()
  const dt = Math.min(0.25, lastTick ? (now - lastTick) / 1000 : 0.1)
  lastTick = now
  sim.tick(dt)
  sim.expire()
  if (Date.now() - lastSnap >= 250 || !active(sim)) {
    publish()
    if (!active(sim)) sim = null
  }
}

export function startDefense(): string | null {
  const st = useDef.getState()
  if (st.host !== me || !io) return '방장만 시작할 수 있어요'
  if (st.snap && active(st.snap)) return null
  const why = startBlock(st.roster)
  if (why) return why
  const stage = Math.min(st.lobbyStage, maxStageFor(st.roster))
  const members = st.roster.map((r) => r.n)
  const jobs = Object.fromEntries(st.roster.map((r) => [r.n, r.jb]))
  sim = new Sim(Math.max(Date.now(), (st.snap?.gid ?? 0) + 1), me, stage, members, jobs)
  lastTick = performance.now()
  publish()
  return null
}

/* ====================== 모두: 받은 신호 ====================== */
let startCb: ((s: Snap) => void) | null = null
let endCb: ((s: Snap) => void) | null = null
export const onDefStart = (fn: ((s: Snap) => void) | null) => {
  startCb = fn
}
export const onDefEnd = (fn: ((s: Snap) => void) | null) => {
  endCb = fn
}

function applySnap(s: Snap) {
  const st = useDef.getState()
  const cur = st.snap
  if (cur && (s.gid < cur.gid || (s.gid === cur.gid && s.seq <= cur.seq))) return
  const fresh = !cur || cur.gid !== s.gid
  useDef.setState({ snap: s, prev: fresh ? s : cur, rcvAt: performance.now(), ...(fresh ? { result: null, myQ: null, qres: null, sel: null } : {}) })
  if (fresh && s.members.includes(me) && active(s)) startCb?.(s)
  if (!active(s) && cur && active(cur) && cur.gid === s.gid && s.members.includes(me)) {
    useDef.setState({ myQ: null, sel: null })
    endCb?.(s)
  }
}

function onEvent(p: DefPayload) {
  const st = useDef.getState()
  switch (p.k) {
    case 'snap':
      if (st.host === me && sim) return // 방장은 자기 계산이 정답
      applySnap(p.s)
      if (st.snap && st.snap.gid !== p.s.gid && active(p.s) && !p.s.members.includes(me)) flash('이미 수비가 시작된 방이에요 — 구경만 할 수 있어요')
      return
    case 'lb':
      if (st.host !== me) useDef.setState({ lobbyStage: p.stage })
      return
    case 'q':
      if (p.to !== me) return
      useDef.setState({ myQ: { qid: p.qid, q: p.q, why: p.why, at: performance.now(), picked: -1 }, qres: null, sel: null })
      if (p.q.say) speak(p.q.say)
      return
    case 'qr':
      if (p.to !== me) return
      useDef.setState({ qres: { qid: p.qid, ok: p.ok, a: p.a, note: p.note } })
      setTimeout(() => {
        const cur = useDef.getState()
        if (cur.qres?.qid === p.qid) useDef.setState({ myQ: cur.myQ?.qid === p.qid ? null : cur.myQ, qres: null })
      }, p.ok ? 1100 : 1800)
      return
    case 'note':
      flash(p.text, 3500)
      return
    default:
      // 방장만: 다른 사람의 요청
      if (st.host !== me || !sim) return
      if (p.k === 'req') sim.request(p.n, p.spot, p.kind)
      else if (p.k === 'evo') sim.evolve(p.n, p.tid, p.br)
      else if (p.k === 'gift') sim.gift(p.n, p.to, p.amt)
      else if (p.k === 'box') sim.claimBox(p.n)
      else if (p.k === 'ans') sim.answer(p.n, p.qid, p.p)
  }
}
export const defOnEvent = onEvent

// 새로 들어온 사람에게 지금 상황을 알려 준다
export function defResend() {
  const st = useDef.getState()
  if (st.host !== me || !io) return
  io.send({ k: 'lb', stage: st.lobbyStage })
  if (sim) publish()
}

/* ====================== 내 행동 ====================== */
function act(p: DefPayload) {
  if (useDef.getState().host === me) onEventAsHost(p)
  else io?.send(p)
}
function onEventAsHost(p: DefPayload) {
  if (!sim) return
  if (p.k === 'req') sim.request(p.n, p.spot, p.kind)
  else if (p.k === 'evo') sim.evolve(p.n, p.tid, p.br)
  else if (p.k === 'gift') sim.gift(p.n, p.to, p.amt)
  else if (p.k === 'box') sim.claimBox(p.n)
  else if (p.k === 'ans') sim.answer(p.n, p.qid, p.p)
}
export const myDefJob = () => myJob

export function requestBuild(spot: number, kind: TowerKind) {
  const s = useDef.getState().snap
  if (!s || !active(s)) return
  const cost = buildCost(kind, myJob)
  if ((s.gold[me] ?? 0) < cost) {
    flash(`돈이 모자라요 (💰${cost} 필요)`)
    return
  }
  if (useDef.getState().myQ) return
  useDef.setState({ sel: null })
  act({ k: 'req', n: me, spot, kind })
}
export function requestEvolve(tid: number, br?: number) {
  act({ k: 'evo', n: me, tid, br })
  useDef.setState({ sel: null })
}
export function sendGift(to: string, amt: number) {
  act({ k: 'gift', n: me, to, amt })
}
export function claimBox() {
  if (useDef.getState().myQ) return
  act({ k: 'box', n: me })
}
export function answerDef(p: number) {
  const q = useDef.getState().myQ
  if (!q || q.picked >= 0) return
  useDef.setState({ myQ: { ...q, picked: p } })
  act({ k: 'ans', n: me, qid: q.qid, p })
}
// 문제 창을 닫으면 틀린 것으로 (돈을 잃는다)
export function giveUpDef() {
  const q = useDef.getState().myQ
  if (!q || q.picked >= 0) return
  answerDef(-1)
}

/* ---------- 받아쓰기 소리 ---------- */
export function canSpeak() {
  try {
    return typeof window !== 'undefined' && 'speechSynthesis' in window
  } catch {
    return false
  }
}
export function speak(text: string) {
  if (!canSpeak()) return
  try {
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'ko-KR'
    u.rate = 0.9
    const ko = window.speechSynthesis.getVoices().find((v) => v.lang.startsWith('ko'))
    if (ko) u.voice = ko
    window.speechSynthesis.speak(u)
  } catch {
    /* noop */
  }
}

/* ---------- 계산 시험용 (개발 화면) ---------- */
export const __defSim = () => sim
export { Sim as __Sim }

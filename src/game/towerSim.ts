import { ARENA_R, INVULN_S, KINDS, MAX_ALIVE, RANGED_SLOW_S, STYLE, hitDamage, towerStage, type MonsterKind } from './towerData'
import type { WeaponFamily } from './weapons'

// 탑의 전투 계산 — React 와 따로, 매 프레임 한 번씩 sim 을 갱신한다 (몬스터가 많아도 화면 상태를 건드리지 않는다).
// 몬스터·날아가는 공격·위험 표시(예고)는 모두 sim 안의 배열에 있고, 3D 화면(TowerArena)이 그것을 읽어 그린다.

export type MonState = 'idle' | 'wind' | 'dash' | 'rest'
export type Mon = {
  id: number
  kind: MonsterKind
  x: number
  z: number
  hp: number
  max: number
  r: number
  sc: number
  kx: number // 맞아서 밀리는 속도
  kz: number
  facing: number
  st: MonState
  t: number // 지금 상태가 시작된 시각 (sim.time)
  cd: number // 다음 행동까지 남은 시간
  dx: number // 돌진 방향
  dz: number
  pat: 'slam' | 'radial' | 'charge' | null // 우두머리의 지금 행동
  bornAt: number
  hitAt: number
  deadAt: number // 0 이면 살아 있음
  nextHit: number // 이 시각이 지나야 다시 닿아서 아프게 할 수 있다
  seed: number
}
export type Bolt = { id: number; x: number; z: number; vx: number; vz: number; life: number; mine: boolean; dmg: number; splash: number; big: boolean }
export type Mark = { id: number; x: number; z: number; r: number; t0: number; dur: number; line: boolean; ang: number; len: number; owner: number }

export const sim = {
  running: false,
  time: 0,
  stage: 1,
  monsters: [] as Mon[],
  bolts: [] as Bolt[],
  marks: [] as Mark[],
  queue: [] as { kind: MonsterKind; hp: number }[],
  total: 0, // 처음 몬스터 체력 합계
  version: 0, // 몬스터 목록이 바뀔 때마다 1씩 늘어난다
  invulnUntil: 0,
  slowUntil: 0, // 이 시각까지 내 이동 속도가 느려진다 (활·지팡이를 쏜 직후)
  nextSpawn: 0,
  attackCd: 0,
  lastAttack: -9,
  fxAt: -9, // 내 공격이 나간 시각 (이펙트용)
  fxFamily: 'sword' as WeaponFamily,
  fxAngle: 0,
  fxTier: 1,
  pendingHit: null as null | { at: number; fam: WeaponFamily; dmg: number; x: number; z: number; ang: number },
  killed: 0,
  hurtBy: { contact: 0, bolt: 0, slam: 0, dash: 0 }, // 시험·균형 점검용: 무엇에 맞았는지
  uid: 1,
}

export const hooks = {
  onHurt: () => {},
  onProgress: (_frac: number, _left: number) => {},
  onCleared: () => {},
}

const rnd = (a: number, b: number) => a + Math.random() * (b - a)
const dist = (ax: number, az: number, bx: number, bz: number) => Math.hypot(ax - bx, az - bz)

export function simStart(stage: number) {
  const st = towerStage(stage)
  sim.running = true
  sim.time = 0
  sim.stage = stage
  sim.monsters = []
  sim.bolts = []
  sim.marks = []
  sim.slowUntil = 0
  sim.invulnUntil = 2 // 시작 직후 잠깐은 안전
  sim.nextSpawn = 0.9
  sim.attackCd = 0
  sim.lastAttack = -9
  sim.pendingHit = null
  sim.killed = 0
  sim.hurtBy = { contact: 0, bolt: 0, slam: 0, dash: 0 }
  const list: { kind: MonsterKind; hp: number }[] = []
  for (const [kind, n, hp] of st.spawns) for (let i = 0; i < n; i++) list.push({ kind, hp })
  // 우두머리는 맨 먼저, 나머지는 섞어서 나온다
  const boss = list.filter((l) => l.kind === 'boss')
  const rest = list.filter((l) => l.kind !== 'boss').sort(() => Math.random() - 0.5)
  sim.queue = [...boss, ...rest]
  sim.total = list.reduce((a, l) => a + l.hp, 0)
  sim.version++
}

export function simStop() {
  sim.running = false
  sim.monsters = []
  sim.bolts = []
  sim.marks = []
  sim.queue = []
  sim.version++
}

export const aliveCount = () => sim.monsters.filter((m) => m.deadAt === 0).length
export const remainingHp = () => sim.monsters.reduce((a, m) => a + (m.deadAt === 0 ? m.hp : 0), 0) + sim.queue.reduce((a, q) => a + q.hp, 0)

function spawnOne(px: number, pz: number) {
  const q = sim.queue.shift()
  if (!q) return
  const def = KINDS[q.kind]
  // 내 주변이 아닌 가장자리에서 나타난다
  let x = 0
  let z = 0
  for (let i = 0; i < 12; i++) {
    const a = Math.random() * Math.PI * 2
    const rr = ARENA_R - 1.8
    x = Math.sin(a) * rr
    z = Math.cos(a) * rr
    if (dist(x, z, px, pz) > 6) break
  }
  const boss = q.kind === 'boss'
  if (boss) {
    x = 0
    z = -5
  }
  sim.monsters.push({
    id: sim.uid++, kind: q.kind, x, z, hp: q.hp, max: q.hp, r: def.r * (boss && q.hp < 300 ? 0.7 : 1), sc: def.scale * (boss && q.hp < 300 ? 0.7 : 1),
    kx: 0, kz: 0, facing: 0, st: 'idle', t: sim.time, cd: boss ? 2.2 : rnd(1.2, 2.8), dx: 0, dz: 1, pat: null,
    bornAt: sim.time, hitAt: -9, deadAt: 0, nextHit: 0, seed: Math.random() * 100,
  })
  sim.version++
}

/* ---------- 내 공격 ---------- */

// 가장 가까운 몬스터 쪽 각도 (없으면 null)
export function nearestAngle(px: number, pz: number, within = 15): number | null {
  let best: Mon | null = null
  let bd = within
  for (const m of sim.monsters) {
    if (m.deadAt !== 0) continue
    const d = dist(m.x, m.z, px, pz)
    if (d < bd) {
      bd = d
      best = m
    }
  }
  return best ? Math.atan2(best.x - px, best.z - pz) : null
}

// 공격 버튼 — 쿨타임이면 false. 가장 가까운 몬스터를 자동으로 겨냥한다.
export function simAttack(fam: WeaponFamily, tier: number, pet: number, px: number, pz: number, facing: number): { ok: boolean; angle: number } {
  if (!sim.running || sim.time < sim.attackCd) return { ok: false, angle: facing }
  const style = STYLE[fam]
  const aim = nearestAngle(px, pz, style.melee ? style.range + 3.5 : style.range + 3)
  const angle = aim ?? facing
  sim.attackCd = sim.time + style.cd
  if (!style.melee) sim.slowUntil = sim.time + RANGED_SLOW_S
  sim.lastAttack = sim.time
  sim.fxAt = sim.time
  sim.fxFamily = fam
  sim.fxAngle = angle
  sim.fxTier = tier
  // 팔을 휘두르는 순간(0.18초 뒤)에 맞는다
  sim.pendingHit = { at: sim.time + 0.18, fam, dmg: hitDamage(fam, tier, pet), x: px, z: pz, ang: angle }
  return { ok: true, angle }
}

function damageMon(m: Mon, dmg: number, fromX: number, fromZ: number, kb: number) {
  if (m.deadAt !== 0) return
  if (sim.time - m.bornAt < 0.5) return // 나타나는 중에는 안 맞는다
  m.hp = Math.max(0, m.hp - dmg)
  m.hitAt = sim.time
  const d = dist(m.x, m.z, fromX, fromZ) || 1
  const k = m.kind === 'boss' ? kb * 0.15 : m.kind === 'charger' ? kb * 0.5 : kb
  m.kx += ((m.x - fromX) / d) * k
  m.kz += ((m.z - fromZ) / d) * k
  if (m.hp <= 0) {
    m.deadAt = sim.time
    sim.killed++
  }
}

function resolveHit(h: NonNullable<typeof sim.pendingHit>) {
  const style = STYLE[h.fam]
  if (style.melee) {
    for (const m of sim.monsters) {
      if (m.deadAt !== 0) continue
      const d = dist(m.x, m.z, h.x, h.z)
      if (d > style.range + m.r) continue
      if (style.arc < Math.PI * 2 - 0.01) {
        let da = Math.atan2(m.x - h.x, m.z - h.z) - h.ang
        while (da > Math.PI) da -= Math.PI * 2
        while (da < -Math.PI) da += Math.PI * 2
        if (Math.abs(da) > style.arc / 2 + Math.atan2(m.r, Math.max(d, 0.5))) continue
      }
      damageMon(m, h.dmg, h.x, h.z, 5.5)
    }
  } else {
    const sp = style.speed ?? 12
    sim.bolts.push({
      id: sim.uid++, x: h.x + Math.sin(h.ang) * 0.8, z: h.z + Math.cos(h.ang) * 0.8,
      vx: Math.sin(h.ang) * sp, vz: Math.cos(h.ang) * sp, life: style.range / sp, mine: true, dmg: h.dmg, splash: style.splash ?? 0, big: !!style.splash,
    })
  }
}

/* ---------- 매 프레임 ---------- */

function hurtPlayer(cause: 'contact' | 'bolt' | 'slam' | 'dash' = 'contact'): boolean {
  if (sim.time < sim.invulnUntil) return false
  sim.hurtBy[cause]++
  sim.invulnUntil = sim.time + INVULN_S
  hooks.onHurt()
  return true
}

function addBolt(m: Mon, ang: number, speed: number, life = 3.2, big = false) {
  sim.bolts.push({ id: sim.uid++, x: m.x + Math.sin(ang) * (m.r + 0.2), z: m.z + Math.cos(ang) * (m.r + 0.2), vx: Math.sin(ang) * speed, vz: Math.cos(ang) * speed, life, mine: false, dmg: 1, splash: 0, big })
}
function addMark(m: Mon, mk: Partial<Mark> & { dur: number }) {
  sim.marks.push({ id: sim.uid++, x: m.x, z: m.z, r: 0, t0: sim.time, line: false, ang: 0, len: 0, owner: m.id, ...mk })
}
const clearMarks = (id: number) => {
  sim.marks = sim.marks.filter((k) => k.owner !== id)
}

let progressAt = 0

export function simStep(dtRaw: number, px: number, pz: number, py: number) {
  if (!sim.running) return
  const dt = Math.min(dtRaw, 0.05)
  sim.time += dt
  const T = sim.time
  const grounded = py < 0.7 // 점프 중에는 바닥 공격에 안 맞는다

  // 내 공격이 맞는 순간
  if (sim.pendingHit && T >= sim.pendingHit.at) {
    resolveHit(sim.pendingHit)
    sim.pendingHit = null
  }

  // 몬스터 보충 (한 번에 최대 MAX_ALIVE 마리)
  if (sim.queue.length > 0 && aliveCount() < MAX_ALIVE && T >= sim.nextSpawn) {
    spawnOne(px, pz)
    sim.nextSpawn = T + 0.7
  }

  for (const m of sim.monsters) {
    if (m.deadAt !== 0) continue
    const def = KINDS[m.kind]
    const born = T - m.bornAt
    const d = dist(m.x, m.z, px, pz)
    const toX = d > 1e-4 ? (px - m.x) / d : 0
    const toZ = d > 1e-4 ? (pz - m.z) / d : 1
    let vx = 0
    let vz = 0
    m.cd -= dt

    if (born < 0.6) {
      // 나타나는 중
    } else if (m.kind === 'slime' || m.kind === 'mushroom') {
      const sp = def.speed * (m.kind === 'slime' ? 0.55 + 0.45 * Math.abs(Math.sin(T * 3 + m.seed)) * 1.8 : 1)
      vx = toX * sp
      vz = toZ * sp
      m.facing = Math.atan2(toX, toZ)
    } else if (m.kind === 'bat') {
      // 옆으로 출렁이며 빠르게 다가온다
      const px2 = -toZ
      const pz2 = toX
      const w = Math.sin(T * 3.2 + m.seed) * 0.9
      vx = (toX + px2 * w) * def.speed
      vz = (toZ + pz2 * w) * def.speed
      m.facing = Math.atan2(vx, vz)
    } else if (m.kind === 'shooter') {
      m.facing = Math.atan2(toX, toZ)
      if (m.st === 'wind') {
        if (T - m.t > 0.75) {
          addBolt(m, m.facing, 5)
          m.st = 'idle'
          m.cd = rnd(2.8, 3.8)
        }
      } else {
        const want = 6
        const k = d > want + 1.5 ? 1 : d < want - 1.5 ? -1 : 0
        const side = Math.sin(T * 0.9 + m.seed) > 0 ? 1 : -1
        vx = toX * def.speed * k + -toZ * def.speed * 0.6 * side * (k === 0 ? 1 : 0.3)
        vz = toZ * def.speed * k + toX * def.speed * 0.6 * side * (k === 0 ? 1 : 0.3)
        if (m.cd <= 0) {
          m.st = 'wind'
          m.t = T
        }
      }
    } else if (m.kind === 'charger') {
      if (m.st === 'idle') {
        vx = toX * def.speed
        vz = toZ * def.speed
        m.facing = Math.atan2(toX, toZ)
        if (m.cd <= 0 && d < 10) {
          m.st = 'wind'
          m.t = T
          m.dx = toX
          m.dz = toZ
          addMark(m, { dur: 0.9, line: true, ang: Math.atan2(toX, toZ), len: 9 })
        }
      } else if (m.st === 'wind') {
        m.facing = Math.atan2(m.dx, m.dz)
        if (T - m.t > 0.9) {
          m.st = 'dash'
          m.t = T
        }
      } else if (m.st === 'dash') {
        vx = m.dx * 11
        vz = m.dz * 11
        if (T - m.t > 0.6) {
          m.st = 'rest'
          m.t = T
        }
      } else {
        if (T - m.t > 0.8) {
          m.st = 'idle'
          m.cd = rnd(2.2, 3.2)
        }
      }
    } else {
      // 우두머리: 따라가다가 땅 내리치기·사방으로 쏘기·돌진 중에 하나를 한다
      const angry = m.hp < m.max * 0.5
      if (m.st === 'idle') {
        vx = toX * def.speed * (angry ? 1.25 : 1)
        vz = toZ * def.speed * (angry ? 1.25 : 1)
        m.facing = Math.atan2(toX, toZ)
        if (m.cd <= 0) {
          const r = Math.random()
          m.pat = r < 0.34 ? 'slam' : r < 0.67 ? 'radial' : 'charge'
          m.st = 'wind'
          m.t = T
          m.dx = toX
          m.dz = toZ
          if (m.pat === 'slam') addMark(m, { dur: 1.0, r: 3.6 })
          else if (m.pat === 'charge') addMark(m, { dur: 0.9, line: true, ang: Math.atan2(toX, toZ), len: 11 })
        }
      } else if (m.st === 'wind') {
        const need = m.pat === 'slam' ? 1.0 : m.pat === 'charge' ? 0.9 : 0.6
        if (T - m.t > need) {
          if (m.pat === 'slam') {
            if (dist(m.x, m.z, px, pz) < 3.6 + 0.4 && grounded) hurtPlayer('slam')
            clearMarks(m.id)
            m.st = 'rest'
            m.t = T
          } else if (m.pat === 'radial') {
            const n = angry ? 14 : 10
            const off = Math.random() * Math.PI
            for (let i = 0; i < n; i++) addBolt(m, off + (i / n) * Math.PI * 2, 4.2, 3.4, true)
            m.st = 'rest'
            m.t = T
          } else {
            m.st = 'dash'
            m.t = T
          }
        }
      } else if (m.st === 'dash') {
        vx = m.dx * 10
        vz = m.dz * 10
        if (T - m.t > 0.7) {
          clearMarks(m.id)
          m.st = 'rest'
          m.t = T
        }
      } else if (T - m.t > 0.9) {
        m.st = 'idle'
        m.cd = angry ? 1.4 : 2.2
      }
    }

    // 밀려나기 + 이동
    m.x += (vx + m.kx) * dt
    m.z += (vz + m.kz) * dt
    const kd = Math.exp(-9 * dt)
    m.kx *= kd
    m.kz *= kd
    // 싸움터 안에만
    const rr = Math.hypot(m.x, m.z)
    const lim = ARENA_R - 0.7
    if (rr > lim) {
      m.x *= lim / rr
      m.z *= lim / rr
    }
    // 닿으면 아프다 (나타나는 중·돌진 준비 중에는 안 아프다)
    if (born > 0.7 && grounded && T >= m.nextHit && (m.st !== 'wind' || m.kind === 'shooter')) {
      if (dist(m.x, m.z, px, pz) < m.r * (m.kind === 'boss' ? 0.8 : 1) + 0.42 && hurtPlayer(m.st === 'dash' ? 'dash' : 'contact')) {
        // 한 번 부딪히면 그 몬스터는 뒤로 튕겨 나가고, 잠깐 다시 아프게 하지 못한다 (숨 돌릴 틈)
        m.nextHit = T + 1.4
        const kk = m.kind === 'boss' ? 4 : 9
        m.kx -= toX * kk
        m.kz -= toZ * kk
        if (m.st === 'dash') {
          m.st = 'rest'
          m.t = T
        }
      }
    }
  }

  // 몬스터끼리 겹치지 않게 살짝 밀어낸다
  const ms = sim.monsters
  for (let i = 0; i < ms.length; i++) {
    const a = ms[i]
    if (a.deadAt !== 0) continue
    for (let j = i + 1; j < ms.length; j++) {
      const b = ms[j]
      if (b.deadAt !== 0) continue
      const dx = b.x - a.x
      const dz = b.z - a.z
      const dd = Math.hypot(dx, dz)
      const min = (a.r + b.r) * 0.8
      if (dd < min && dd > 1e-4) {
        const push = (min - dd) * 0.5
        const wa = b.kind === 'boss' ? 0.1 : 1
        const wb = a.kind === 'boss' ? 0.1 : 1
        a.x -= (dx / dd) * push * wa
        a.z -= (dz / dd) * push * wa
        b.x += (dx / dd) * push * wb
        b.z += (dz / dd) * push * wb
      }
    }
  }

  // 날아가는 공격
  for (const b of sim.bolts) {
    b.x += b.vx * dt
    b.z += b.vz * dt
    b.life -= dt
    if (Math.hypot(b.x, b.z) > ARENA_R + 1) b.life = 0
    if (b.mine) {
      for (const m of sim.monsters) {
        if (m.deadAt !== 0 || b.life <= 0) continue
        if (dist(b.x, b.z, m.x, m.z) < m.r + 0.3) {
          if (b.splash > 0) {
            for (const o of sim.monsters) if (o.deadAt === 0 && dist(o.x, o.z, b.x, b.z) < b.splash + o.r) damageMon(o, b.dmg, b.x, b.z, 4)
          } else damageMon(m, b.dmg, b.x - b.vx * 0.05, b.z - b.vz * 0.05, 4.5)
          b.life = 0
        }
      }
    } else if (grounded && b.life > 0 && dist(b.x, b.z, px, pz) < (b.big ? 0.55 : 0.45) + 0.3) {
      hurtPlayer('bolt')
      b.life = 0
    }
  }
  sim.bolts = sim.bolts.filter((b) => b.life > 0)

  // 위험 표시: 우두머리·멧돼지가 사라지면 같이 지운다
  sim.marks = sim.marks.filter((k) => T - k.t0 < k.dur + 0.1 && sim.monsters.some((m) => m.id === k.owner && m.deadAt === 0))

  // 쓰러진 몬스터는 잠깐 보여 준 뒤 치운다
  const before = sim.monsters.length
  sim.monsters = sim.monsters.filter((m) => m.deadAt === 0 || T - m.deadAt < 0.5)
  if (sim.monsters.length !== before) sim.version++

  // 화면에 알리기 (초당 4번)
  if (T - progressAt > 0.25) {
    progressAt = T
    hooks.onProgress(sim.total > 0 ? remainingHp() / sim.total : 0, aliveCount() + sim.queue.length)
  }

  // 모두 잡았으면 끝
  if (sim.queue.length === 0 && aliveCount() === 0 && sim.monsters.every((m) => T - m.deadAt >= 0.45)) {
    sim.running = false
    hooks.onProgress(0, 0)
    hooks.onCleared()
  }
}

// 우두머리가 땅을 내리치는 예고 같은 것들이 그릴 때 쓰는 진행률 (0~1)
export const markProgress = (k: Mark) => Math.min(1, (sim.time - k.t0) / k.dur)

export const clampArena = (p: { x: number; z: number }) => {
  const d = Math.hypot(p.x, p.z)
  const lim = ARENA_R - 0.6
  if (d > lim) {
    p.x *= lim / d
    p.z *= lim / d
  }
}

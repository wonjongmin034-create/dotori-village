import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Toon } from './wearKit'
import { Baked } from './Baked'
import { MonsterModel, Chest } from './towerModels'
import { useTower } from './towerState'
import { useVillage } from './store'
import { ARENA_R, STYLE, towerStage, type MonsterKind } from './towerData'
import { markProgress, sim, simAttack, simStep } from './towerSim'
import { playerMotion, playerPos, towerAim, towerInput } from './player-state'
import { startSwing } from './swing'
import { isFamily, GRADES, type WeaponFamily } from './weapons'

// 탑의 싸움터 — 둥근 바닥 위에서 몬스터와 싸운다. 몬스터·날아가는 공격은 sim(towerSim.ts)이 계산하고, 여기서는 그리기만 한다.

type V3 = [number, number, number]

function Arena({ stage }: { stage: number }) {
  const th = towerStage(stage).theme
  const pillars = useMemo(
    () => Array.from({ length: 8 }, (_, i) => [Math.sin((i / 8) * Math.PI * 2 + 0.2) * (ARENA_R + 0.4), 0, Math.cos((i / 8) * Math.PI * 2 + 0.2) * (ARENA_R + 0.4)] as V3),
    [],
  )
  return (
    <Baked>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[ARENA_R + 8, 40]} />
        <Toon color={th.ground} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[ARENA_R, 40]} />
        <Toon color={th.ring} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[ARENA_R - 0.5, ARENA_R, 40]} />
        <Toon color={th.accent} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[3.2, 3.5, 32]} />
        <Toon color={th.ground} />
      </mesh>
      {pillars.map((p, i) => (
        <group key={i} position={p}>
          <mesh position={[0, 1.2, 0]}>
            <cylinderGeometry args={[0.45, 0.55, 2.4, 8]} />
            <Toon color={th.ring} />
          </mesh>
          <mesh position={[0, 2.55, 0]}>
            <sphereGeometry args={[0.38, 8, 6]} />
            <Toon color={th.accent} emissive={th.accent} ei={0.5} />
          </mesh>
        </group>
      ))}
    </Baked>
  )
}

const TOP: Record<MonsterKind, number> = { slime: 1.05, mushroom: 1.35, bat: 1.55, shooter: 1.6, charger: 1.5, boss: 1.9 }

function MonsterView({ id, kind, color }: { id: number; kind: MonsterKind; color: string }) {
  const g = useRef<THREE.Group>(null)
  const yaw = useRef<THREE.Group>(null)
  const inner = useRef<THREE.Group>(null)
  const flash = useRef<THREE.Mesh>(null)
  const bar = useRef<THREE.Group>(null)
  const fg = useRef<THREE.Mesh>(null)
  const warn = useRef<THREE.Mesh>(null)
  const camera = useThree((s) => s.camera)

  useFrame(() => {
    const root = g.current
    if (!root) return
    const m = sim.monsters.find((x) => x.id === id)
    if (!m) {
      root.visible = false
      return
    }
    root.visible = true
    root.position.set(m.x, 0, m.z)
    if (yaw.current) yaw.current.rotation.y = m.facing
    const born = sim.time - m.bornAt
    const dead = m.deadAt !== 0
    let k = Math.min(1, born / 0.5)
    k = 1 - Math.pow(1 - k, 3)
    if (dead) k = Math.max(0, 1 - (sim.time - m.deadAt) / 0.45)
    const hitAge = sim.time - m.hitAt
    const squash = hitAge < 0.25 ? 1 + (0.25 - hitAge) * 0.9 : 1
    let hop = 0
    if (kind === 'slime' && !dead) hop = Math.abs(Math.sin(sim.time * 3 + m.seed)) * 0.18
    const windPulse = m.st === 'wind' ? 1 + Math.sin(sim.time * 34) * 0.07 : 1
    if (inner.current) {
      const s = m.sc * k * windPulse
      inner.current.scale.set(s * (2 - squash), s * squash, s * (2 - squash))
      inner.current.position.y = hop + (dead ? (1 - k) * 0.4 : 0)
      inner.current.rotation.y = dead ? (1 - k) * 6 : 0
    }
    if (flash.current) {
      const f = dead ? 0 : Math.max(0, 1 - hitAge / 0.16)
      flash.current.visible = f > 0.02
      ;(flash.current.material as THREE.MeshBasicMaterial).opacity = f * 0.75
    }
    if (warn.current) {
      warn.current.visible = m.st === 'wind' && (kind === 'shooter' || kind === 'charger' || kind === 'boss')
      warn.current.scale.setScalar(1 + (sim.time % 0.3) * 2)
    }
    if (bar.current) {
      const show = !dead && (kind === 'boss' || m.hp < m.max)
      bar.current.visible = show
      if (show) {
        bar.current.quaternion.copy(camera.quaternion)
        bar.current.position.y = TOP[kind] * (kind === 'boss' ? m.sc * 0.62 : 1) + 0.25
        const frac = Math.max(0, m.hp / m.max)
        if (fg.current) {
          fg.current.scale.x = Math.max(0.001, frac)
          fg.current.position.x = -(1 - frac) * 0.5
        }
      }
    }
  })

  const w = kind === 'boss' ? 2.2 : 0.95
  return (
    <group ref={g} visible={false}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}>
        <circleGeometry args={[kind === 'boss' ? 1.7 : 0.7, 16]} />
        <meshBasicMaterial color="#000" transparent opacity={0.16} depthWrite={false} />
      </mesh>
      <mesh ref={warn} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} visible={false}>
        <ringGeometry args={[kind === 'boss' ? 1.5 : 0.6, kind === 'boss' ? 1.7 : 0.72, 20]} />
        <meshBasicMaterial color="#ff4d3a" transparent opacity={0.8} depthWrite={false} />
      </mesh>
      <group ref={yaw}>
        <group ref={inner}>
          <MonsterModel kind={kind} color={color} />
          <mesh ref={flash} position={[0, 0.7, 0]} visible={false}>
            <sphereGeometry args={[kind === 'boss' ? 1.15 : 0.7, 10, 8]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0} depthWrite={false} />
          </mesh>
        </group>
      </group>
      <group ref={bar} visible={false}>
        <mesh>
          <planeGeometry args={[w + 0.08, 0.2]} />
          <meshBasicMaterial color="#1e2a22" transparent opacity={0.8} depthTest={false} />
        </mesh>
        <mesh ref={fg} position={[0, 0, 0.01]} scale={[w, 1, 1]}>
          <planeGeometry args={[1, 0.13]} />
          <meshBasicMaterial color={kind === 'boss' ? '#ff5a4a' : '#6fe07a'} depthTest={false} />
        </mesh>
      </group>
    </group>
  )
}

const BOLTS = 28
const RINGS = 4
const LINES = 4

// 날아가는 공격(내 것·몬스터 것)과 위험 예고
function Projectiles() {
  const bolts = useRef<(THREE.Mesh | null)[]>([])
  const rings = useRef<(THREE.Group | null)[]>([])
  const lines = useRef<(THREE.Mesh | null)[]>([])
  const mineMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#7fe9ff' }), [])
  const foeMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ff7a3d' }), [])
  const bigMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ffd24a' }), [])

  useFrame(() => {
    for (let i = 0; i < BOLTS; i++) {
      const m = bolts.current[i]
      if (!m) continue
      const b = sim.bolts[i]
      if (!b) {
        m.visible = false
        continue
      }
      m.visible = true
      m.position.set(b.x, 0.7, b.z)
      m.material = b.mine ? (b.big ? bigMat : mineMat) : foeMat
      m.scale.setScalar(b.big ? 1.5 : 1)
    }
    let ri = 0
    let li = 0
    for (const k of sim.marks) {
      const p = markProgress(k)
      if (k.line) {
        const m = lines.current[li++]
        if (m) {
          m.visible = true
          m.position.set(k.x + Math.sin(k.ang) * (k.len / 2), 0.06, k.z + Math.cos(k.ang) * (k.len / 2))
          m.rotation.set(-Math.PI / 2, 0, -k.ang)
          m.scale.set(1.5, k.len, 1)
          ;(m.material as THREE.MeshBasicMaterial).opacity = 0.18 + p * 0.5
        }
      } else {
        const g = rings.current[ri++]
        if (g) {
          g.visible = true
          g.position.set(k.x, 0.06, k.z)
          g.scale.setScalar(k.r)
          const inner = g.children[1] as THREE.Mesh
          inner.scale.setScalar(Math.max(0.01, p))
        }
      }
    }
    for (let i = ri; i < RINGS; i++) if (rings.current[i]) rings.current[i]!.visible = false
    for (let i = li; i < LINES; i++) if (lines.current[i]) lines.current[i]!.visible = false
  })

  return (
    <>
      {Array.from({ length: BOLTS }, (_, i) => (
        <mesh key={i} ref={(el) => void (bolts.current[i] = el)} visible={false} material={foeMat}>
          <sphereGeometry args={[0.24, 8, 6]} />
        </mesh>
      ))}
      {Array.from({ length: RINGS }, (_, i) => (
        <group key={i} ref={(el) => void (rings.current[i] = el)} visible={false}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[1, 28]} />
            <meshBasicMaterial color="#ff4d3a" transparent opacity={0.22} depthWrite={false} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
            <circleGeometry args={[1, 28]} />
            <meshBasicMaterial color="#ff4d3a" transparent opacity={0.45} depthWrite={false} />
          </mesh>
        </group>
      ))}
      {Array.from({ length: LINES }, (_, i) => (
        <mesh key={i} ref={(el) => void (lines.current[i] = el)} visible={false}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial color="#ff4d3a" transparent opacity={0.3} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </>
  )
}

// 내가 무기를 휘두를 때 번쩍이는 이펙트
function AttackFx() {
  const g = useRef<THREE.Group>(null)
  const arcs = useMemo(() => {
    const o: Partial<Record<WeaponFamily, THREE.RingGeometry>> = {}
    for (const f of ['sword', 'axe', 'spear', 'hammer'] as WeaponFamily[]) {
      const s = STYLE[f]
      const arc = Math.min(s.arc, Math.PI * 2 - 0.001)
      o[f] = new THREE.RingGeometry(0.45, 1, f === 'spear' ? 4 : 24, 1, -Math.PI / 2 - arc / 2, arc)
    }
    return o
  }, [])
  const mesh = useRef<THREE.Mesh>(null)
  const mat = useRef<THREE.MeshBasicMaterial>(null)

  useFrame(() => {
    const age = sim.time - sim.fxAt
    const grp = g.current
    if (!grp) return
    const f = sim.fxFamily
    const geom = arcs[f]
    if (!geom || age < 0.1 || age > 0.34) {
      grp.visible = false
      return
    }
    grp.visible = true
    grp.position.set(playerPos.x, 0.5, playerPos.z)
    grp.rotation.y = sim.fxAngle
    const r = STYLE[f].range
    const k = (age - 0.1) / 0.24
    if (mesh.current) {
      mesh.current.geometry = geom
      mesh.current.scale.setScalar(r * (0.75 + k * 0.3))
    }
    if (mat.current) {
      mat.current.opacity = (1 - k) * 0.75
      mat.current.color.set(GRADES[Math.min(5, sim.fxTier - 1)].color)
    }
  })
  return (
    <group ref={g} visible={false}>
      <mesh ref={mesh} rotation={[-Math.PI / 2, 0, 0]}>
        <meshBasicMaterial ref={mat} color="#ffffff" transparent opacity={0.6} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

function ChestView() {
  const g = useRef<THREE.Group>(null)
  const anchor = useRef<THREE.Group>(null)
  const t0 = useRef(0)
  const pos = useRef<V3>([0, 0, 0])
  const phase = useTower((s) => s.phase)
  useEffect(() => {
    t0.current = performance.now()
    if (phase === 'chest') {
      // 내 앞(싸움터 가운데 쪽)에 떨어진다
      const d = Math.hypot(playerPos.x, playerPos.z) || 1
      const k = d > 3 ? -2.6 / d : 0
      pos.current = [playerPos.x + playerPos.x * k, 0, d > 3 ? playerPos.z + playerPos.z * k : playerPos.z - 2.6]
    }
  }, [phase])
  useFrame(() => {
    const grp = g.current
    if (!grp) return
    anchor.current?.position.set(pos.current[0], 0, pos.current[2])
    const age = (performance.now() - t0.current) / 1000
    // 하늘에서 떨어져 통통 튄다
    const y = age < 0.7 ? Math.max(0, 7 * (1 - age / 0.7) ** 2) : Math.abs(Math.sin((age - 0.7) * 6)) * 0.35 * Math.exp(-(age - 0.7) * 2.2)
    grp.position.y = y
    grp.rotation.y = Math.sin(age * 1.5) * 0.2
  })
  if (phase !== 'chest' && phase !== 'quiz') return null
  return (
    <group ref={anchor}>
      <group ref={g}>
        <Chest />
      </group>
      <mesh position={[0, 3, 0]}>
        <cylinderGeometry args={[0.7, 0.9, 6, 12, 1, true]} />
        <meshBasicMaterial color="#ffe58a" transparent opacity={0.22} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

export function TowerArena() {
  const stage = useTower((s) => s.stage)
  const color = towerStage(stage).theme.accent
  const [mons, setMons] = useState<{ id: number; kind: MonsterKind }[]>([])
  const ver = useRef(-1)

  useFrame((_, rawDt) => {
    const ts = useTower.getState()
    if (ts.phase === 'fight') {
      const v = useVillage.getState()
      if (towerInput.tap || towerInput.hold) {
        towerInput.tap = false
        const fam: WeaponFamily = v.avatar.weapon && isFamily(v.avatar.weapon) ? v.avatar.weapon : 'sword'
        const tier = v.avatar.weapon && isFamily(v.avatar.weapon) ? v.avatar.wt : 1
        const res = simAttack(fam, tier, v.pet?.st ?? 0, playerPos.x, playerPos.z, playerMotion.facing)
        if (res.ok) {
          if (v.session) startSwing(v.session.name)
          towerAim.angle = res.angle
          towerAim.until = performance.now() + 420
        }
      }
      simStep(rawDt, playerPos.x, playerPos.z, playerPos.y)
    }
    if (ver.current !== sim.version) {
      ver.current = sim.version
      setMons(sim.monsters.map((m) => ({ id: m.id, kind: m.kind })))
    }
  })

  return (
    <>
      <Arena stage={stage} />
      {mons.map((m) => (
        <MonsterView key={m.id} id={m.id} kind={m.kind} color={color} />
      ))}
      <Projectiles />
      <AttackFx />
      <ChestView />
    </>
  )
}

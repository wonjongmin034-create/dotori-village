import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { PetModel } from './PetModel'
import { playerPos, playerMotion } from './player-state'
import { peers, useLive } from './live'
import { useGfx } from './gfx'
import { useVillage } from './store'
import { SPECIES_MAP } from './pets'

// 주인을 졸졸 따라다니는 펫. 내 펫은 내 위치를, 친구 펫은 받은 위치(보간)를 따라간다.
// 서버로 따로 보내는 건 없다 — 친구의 펫 종류·단계는 접속 정보(avatar.pet)에 실려 오고, 위치는 주인 것에서 계산한다.

type Owner = { x: number; z: number; facing: number; moving: boolean } | null

const FOLLOW_DIST = 0.95 // 주인 뒤로 이만큼
const SIDE = 0.45 // 오른쪽으로 조금 비켜서
const MAX_REMOTE = 4
const MAX_REMOTE_LITE = 2
const REMOTE_NEAR = 22

function PetActor({ sp, st, owner, slot = 0 }: { sp: string; st: number; owner: () => Owner; slot?: number }) {
  const root = useRef<THREE.Group>(null)
  const inner = useRef<THREE.Group>(null)
  const s = useRef({ x: 0, z: 0, facing: 0, phase: 0, init: false })

  useFrame((state, rawDt) => {
    const g = root.current
    const o = owner()
    if (!g) return
    if (!o) {
      g.visible = false
      return
    }
    g.visible = true
    const dt = Math.min(rawDt, 0.05)
    const m = s.current
    const t = state.clock.elapsedTime
    // 목표: 주인의 뒤쪽 (여럿이면 조금씩 다르게)
    const side = SIDE * (slot % 2 === 0 ? 1 : -1)
    const back = FOLLOW_DIST + Math.floor(slot / 2) * 0.35
    const fx = Math.sin(o.facing)
    const fz = Math.cos(o.facing)
    const tx = o.x - fx * back + fz * side
    const tz = o.z - fz * back - fx * side
    if (!m.init || Math.hypot(tx - m.x, tz - m.z) > 9) {
      m.x = tx
      m.z = tz
      m.init = true
    }
    const dx = tx - m.x
    const dz = tz - m.z
    const dist = Math.hypot(dx, dz)
    // 멀수록 빨리, 가까우면 멈춘다
    const moving = dist > 0.28
    if (moving) {
      const sp2 = Math.min(dist * 3.2, 8.5)
      const step = Math.min(dist, sp2 * dt)
      m.x += (dx / dist) * step
      m.z += (dz / dist) * step
      const want = Math.atan2(dx, dz)
      let diff = want - m.facing
      while (diff > Math.PI) diff -= Math.PI * 2
      while (diff < -Math.PI) diff += Math.PI * 2
      m.facing += diff * (1 - Math.exp(-10 * dt))
      m.phase += dt * 11
    } else {
      // 가만히 있을 땐 주인 쪽을 본다
      const want = Math.atan2(o.x - m.x, o.z - m.z)
      let diff = want - m.facing
      while (diff > Math.PI) diff -= Math.PI * 2
      while (diff < -Math.PI) diff += Math.PI * 2
      m.facing += diff * (1 - Math.exp(-3 * dt))
    }
    g.position.set(m.x, 0, m.z)
    g.rotation.y = m.facing
    const body = inner.current
    if (body) {
      if (moving) {
        // 통통 뛰며 따라간다
        const h = Math.abs(Math.sin(m.phase))
        body.position.y = h * 0.14
        body.scale.set(1 + (1 - h) * 0.05, 1 - (1 - h) * 0.07, 1 + (1 - h) * 0.05)
        body.rotation.z = 0
      } else {
        const br = Math.sin(t * 2 + slot)
        body.position.y = 0
        body.scale.set(1, 1 + br * 0.025, 1)
        // 알은 가끔 데굴데굴 흔들린다
        body.rotation.z = st === 0 ? Math.sin(t * 3.2 + slot) * 0.1 * (0.5 + 0.5 * Math.sin(t * 0.9)) : 0
      }
    }
  })

  if (!SPECIES_MAP[sp]) return null
  return (
    <group ref={root} visible={false}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.3, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.16} depthWrite={false} />
      </mesh>
      <group ref={inner}>
        <PetModel sp={sp} st={st} />
      </group>
    </group>
  )
}

const mine = (): Owner => ({ x: playerPos.x, z: playerPos.z, facing: playerMotion.facing, moving: true })

// 내 펫
export function MyPet() {
  const pet = useVillage((s) => s.pet)
  if (!pet) return null
  return <PetActor key={pet.sp} sp={pet.sp} st={pet.st} owner={mine} />
}

// 같은 방 친구들의 펫 (가까운 몇 마리만)
export function RemotePets() {
  const names = useLive((s) => s.names)
  const [shown, setShown] = useState<{ n: string; sp: string; st: number }[]>([])

  useEffect(() => {
    const pick = () => {
      const lim = useGfx.getState().lite ? MAX_REMOTE_LITE : MAX_REMOTE
      const list = names
        .map((n) => {
          const p = peers.get(n)
          const pv = p?.avatar.pet
          if (!p || !p.at || !pv || !SPECIES_MAP[pv.sp]) return null
          return { n, sp: pv.sp, st: Math.max(0, Math.min(4, Math.round(Number(pv.st)) || 0)), d: Math.hypot(p.x - playerPos.x, p.z - playerPos.z) }
        })
        .filter((x): x is { n: string; sp: string; st: number; d: number } => !!x && x.d < REMOTE_NEAR)
        .sort((a, b) => a.d - b.d)
        .slice(0, lim)
        .map(({ n, sp, st }) => ({ n, sp, st }))
      setShown((prev) => (prev.length === list.length && prev.every((p, i) => p.n === list[i].n && p.sp === list[i].sp && p.st === list[i].st) ? prev : list))
    }
    pick()
    const t = setInterval(pick, 700)
    return () => clearInterval(t)
  }, [names])

  return (
    <>
      {shown.map((p) => (
        <RemotePet key={`${p.n}:${p.sp}`} name={p.n} sp={p.sp} st={p.st} />
      ))}
    </>
  )
}

function RemotePet({ name, sp, st }: { name: string; sp: string; st: number }) {
  // 친구 모습과 같은 방식으로: 받은 위치에서 속도만큼 더 간 곳
  const cur = useRef({ x: 0, z: 0, facing: 0, init: false })
  const owner = (): Owner => {
    const p = peers.get(name)
    if (!p || !p.at) return null
    const age = Math.min(3, (performance.now() - p.at) / 1000)
    const c = cur.current
    const tx = p.x + p.vx * age
    const tz = p.z + p.vz * age
    if (!c.init || Math.hypot(tx - c.x, tz - c.z) > 6) {
      c.x = tx
      c.z = tz
      c.init = true
    } else {
      c.x += (tx - c.x) * 0.22
      c.z += (tz - c.z) * 0.22
    }
    const sp2 = Math.hypot(p.vx, p.vz)
    if (sp2 > 0.3) c.facing = Math.atan2(p.vx, p.vz)
    else c.facing = p.facing
    return { x: c.x, z: c.z, facing: c.facing, moving: sp2 > 0.3 }
  }
  return <PetActor sp={sp} st={st} owner={owner} slot={1} />
}

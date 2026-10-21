import { memo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Toon, Glow } from './wearKit'
import type { MonsterKind } from './towerData'

// 탑 몬스터 모델 — 태블릿에서도 부드럽게 돌아가도록 도형 몇 개로만 만든다 (몬스터 한 마리당 5~9개).
// +z 방향이 앞이고, 발이 y=0 에 닿는다.

type V3 = [number, number, number]

function Ell({ p, r, c, e, rot }: { p: V3; r: V3; c: string; e?: string; rot?: V3 }) {
  return (
    <mesh position={p} scale={r} rotation={rot}>
      <sphereGeometry args={[1, 12, 9]} />
      <Toon color={c} emissive={e} ei={0.5} />
    </mesh>
  )
}
function Cone({ p, r, h, c, rot, glow }: { p: V3; r: number; h: number; c: string; rot?: V3; glow?: boolean }) {
  return (
    <mesh position={p} rotation={rot}>
      <coneGeometry args={[r, h, 5]} />
      {glow ? <Glow color={c} /> : <Toon color={c} />}
    </mesh>
  )
}
function Eyes({ y, z, gap, r = 0.07, angry = false }: { y: number; z: number; gap: number; r?: number; angry?: boolean }) {
  return (
    <>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * gap, y, z]}>
          <Ell p={[0, 0, 0]} r={[r, r * 1.2, r * 0.7]} c="#26211f" />
          <Ell p={[s * r * 0.3, r * 0.4, r * 0.5]} r={[r * 0.35, r * 0.35, r * 0.3]} c="#ffffff" />
          {angry && <Cone p={[0, r * 1.7, 0]} r={r * 0.9} h={r * 1.4} c="#26211f" rot={[0, 0, Math.PI / 2 + s * -0.5]} />}
        </group>
      ))}
    </>
  )
}

function Slime() {
  return (
    <group>
      <Ell p={[0, 0.36, 0]} r={[0.55, 0.42, 0.55]} c="#7bd65a" />
      <Ell p={[-0.18, 0.55, 0.3]} r={[0.12, 0.08, 0.06]} c="#d4f7b8" />
      <Eyes y={0.42} z={0.46} gap={0.2} />
    </group>
  )
}

function Mushroom() {
  return (
    <group>
      <Ell p={[0, 0.3, 0]} r={[0.3, 0.32, 0.3]} c="#f4e6c8" />
      <Ell p={[0, 0.66, 0]} r={[0.55, 0.36, 0.55]} c="#e0453d" />
      {([[0.25, 0.9, 0.2], [-0.28, 0.82, 0.15], [0.05, 0.95, -0.3]] as V3[]).map((p, i) => (
        <Ell key={i} p={p} r={[0.1, 0.07, 0.1]} c="#ffffff" />
      ))}
      <Eyes y={0.34} z={0.27} gap={0.12} r={0.06} angry />
      <Ell p={[-0.12, 0.05, 0.1]} r={[0.1, 0.07, 0.15]} c="#d8c8a6" />
      <Ell p={[0.12, 0.05, 0.1]} r={[0.1, 0.07, 0.15]} c="#d8c8a6" />
    </group>
  )
}

function Bat() {
  const wl = useRef<THREE.Group>(null)
  const wr = useRef<THREE.Group>(null)
  useFrame((s) => {
    const a = Math.sin(s.clock.elapsedTime * 16) * 0.7
    if (wl.current) wl.current.rotation.z = a
    if (wr.current) wr.current.rotation.z = -a
  })
  return (
    <group position={[0, 0.9, 0]}>
      <Ell p={[0, 0, 0]} r={[0.28, 0.26, 0.3]} c="#5a4a86" />
      <Cone p={[-0.14, 0.3, 0]} r={0.07} h={0.2} c="#5a4a86" />
      <Cone p={[0.14, 0.3, 0]} r={0.07} h={0.2} c="#5a4a86" />
      <Eyes y={0.04} z={0.25} gap={0.1} r={0.055} angry />
      <group ref={wl} position={[-0.25, 0.05, 0]}>
        <Ell p={[-0.3, 0, 0]} r={[0.36, 0.05, 0.22]} c="#8a76c4" />
      </group>
      <group ref={wr} position={[0.25, 0.05, 0]}>
        <Ell p={[0.3, 0, 0]} r={[0.36, 0.05, 0.22]} c="#8a76c4" />
      </group>
    </group>
  )
}

// 가시 도깨비불: 멀리서 불덩이를 쏜다
function Shooter() {
  return (
    <group>
      <Ell p={[0, 0.6, 0]} r={[0.42, 0.46, 0.42]} c="#3a2f55" e="#ff7a3d" />
      <Ell p={[0, 0.6, 0.08]} r={[0.27, 0.3, 0.27]} c="#ffb347" e="#ffb347" />
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2
        return <Cone key={i} p={[Math.sin(a) * 0.42, 0.62, Math.cos(a) * 0.42]} r={0.07} h={0.28} c="#ff7a3d" rot={[Math.cos(a) * 1.2, 0, -Math.sin(a) * 1.2]} glow />
      })}
      <Eyes y={0.64} z={0.32} gap={0.11} r={0.06} angry />
      <Cone p={[0, 1.2, 0]} r={0.16} h={0.42} c="#ff8a3d" glow />
    </group>
  )
}

function Charger() {
  return (
    <group>
      <Ell p={[0, 0.62, -0.05]} r={[0.6, 0.5, 0.78]} c="#8a5a3a" />
      <Ell p={[0, 0.7, 0.62]} r={[0.46, 0.42, 0.42]} c="#a06a44" />
      <Ell p={[0, 0.55, 0.95]} r={[0.26, 0.2, 0.18]} c="#e8a8a0" />
      {[-1, 1].map((s) => (
        <group key={s}>
          <Cone p={[s * 0.28, 0.5, 0.88]} r={0.07} h={0.34} c="#fff4d8" rot={[1.0, 0, s * -0.5]} />
          <Cone p={[s * 0.28, 1.02, 0.5]} r={0.1} h={0.2} c="#6a4228" />
          <Ell p={[s * 0.34, 0.14, 0.45]} r={[0.12, 0.2, 0.14]} c="#6a4228" />
          <Ell p={[s * 0.34, 0.14, -0.5]} r={[0.12, 0.2, 0.14]} c="#6a4228" />
        </group>
      ))}
      <Eyes y={0.8} z={0.95} gap={0.17} r={0.06} angry />
    </group>
  )
}

function Boss({ color }: { color: string }) {
  return (
    <group>
      <Ell p={[0, 0.65, 0]} r={[0.78, 0.68, 0.78]} c={color} />
      <Ell p={[0, 0.5, 0.35]} r={[0.5, 0.42, 0.45]} c="#f4efd8" />
      <Eyes y={0.88} z={0.62} gap={0.27} r={0.1} angry />
      <Ell p={[0, 0.7, 0.75]} r={[0.2, 0.09, 0.07]} c="#3a2020" />
      {[-1, 1].map((s) => (
        <group key={s}>
          <Cone p={[s * 0.42, 1.38, 0]} r={0.14} h={0.5} c="#fff4d8" rot={[0, 0, s * -0.35]} />
          <Ell p={[s * 0.8, 0.55, 0.1]} r={[0.2, 0.3, 0.2]} c={color} />
        </group>
      ))}
      <Cone p={[0, 1.42, 0]} r={0.36} h={0.3} c="#ffd34d" />
      <mesh position={[0, 1.18, 0]}>
        <torusGeometry args={[0.38, 0.06, 6, 12]} />
        <Toon color="#ffd34d" />
      </mesh>
    </group>
  )
}

export const MonsterModel = memo(function MonsterModel({ kind, color }: { kind: MonsterKind; color?: string }) {
  switch (kind) {
    case 'slime':
      return <Slime />
    case 'mushroom':
      return <Mushroom />
    case 'bat':
      return <Bat />
    case 'shooter':
      return <Shooter />
    case 'charger':
      return <Charger />
    default:
      return <Boss color={color ?? '#8e4fd8'} />
  }
})

// 보물상자
export function Chest() {
  return (
    <group>
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[0.95, 0.6, 0.62]} />
        <Toon color="#a8672f" />
      </mesh>
      <mesh position={[0, 0.66, 0]} scale={[1, 0.55, 1]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.31, 0.31, 0.95, 12, 1, false, 0, Math.PI]} />
        <Toon color="#c07a38" />
      </mesh>
      {[-0.36, 0.36].map((x) => (
        <mesh key={x} position={[x, 0.4, 0]}>
          <boxGeometry args={[0.1, 0.84, 0.66]} />
          <Toon color="#f2c231" emissive="#f2c231" ei={0.25} />
        </mesh>
      ))}
      <mesh position={[0, 0.5, 0.33]}>
        <boxGeometry args={[0.18, 0.2, 0.04]} />
        <Toon color="#ffd34d" emissive="#ffd34d" ei={0.5} />
      </mesh>
    </group>
  )
}

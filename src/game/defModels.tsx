import { useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Toon } from './wearKit'
import type { MonKind, TowerKind } from './defData'

// 수비대 모델 — 툰 재질 도형으로 만든다. +z 가 앞(카메라 쪽), 바닥이 y=0.
// 탑: 단계마다 재료가 바뀐다 (1 나무 · 2 돌 · 3 갈림길 색 · 4 금 장식 · 5 각성 — 떠다니는 고리와 보석).
// 움직이는 부분(조준·발사·연기)은 ref 로 직접 움직인다 (Baked 로 합치지 않는다).

type V3 = [number, number, number]
const PI = Math.PI

/* ---------- 작은 부품 ---------- */
export function Ball({ p, r, s, c, e, ei = 0.5, seg = 14 }: { p: V3; r: number; s?: V3; c: string; e?: string; ei?: number; seg?: number }) {
  return (
    <mesh position={p} scale={s}>
      <sphereGeometry args={[r, seg, Math.max(6, Math.round(seg * 0.75))]} />
      <Toon color={c} emissive={e} ei={e ? ei : 0} />
    </mesh>
  )
}
export function Cyl({ p, r, r2, h, c, seg = 14, rot, e, ei = 0.5 }: { p: V3; r: number; r2?: number; h: number; c: string; seg?: number; rot?: V3; e?: string; ei?: number }) {
  return (
    <mesh position={p} rotation={rot}>
      <cylinderGeometry args={[r2 ?? r, r, h, seg]} />
      <Toon color={c} emissive={e} ei={e ? ei : 0} />
    </mesh>
  )
}
export function Bx({ p, s, c, rot, e, ei = 0.5 }: { p: V3; s: V3; c: string; rot?: V3; e?: string; ei?: number }) {
  return (
    <mesh position={p} rotation={rot}>
      <boxGeometry args={s} />
      <Toon color={c} emissive={e} ei={e ? ei : 0} />
    </mesh>
  )
}
export function Cone({ p, r, h, c, seg = 10, rot, e, ei = 0.5 }: { p: V3; r: number; h: number; c: string; seg?: number; rot?: V3; e?: string; ei?: number }) {
  return (
    <mesh position={p} rotation={rot}>
      <coneGeometry args={[r, h, seg]} />
      <Toon color={c} emissive={e} ei={e ? ei : 0} />
    </mesh>
  )
}
function Ring({ p, r, t, c, rot, e }: { p: V3; r: number; t: number; c: string; rot?: V3; e?: string }) {
  return (
    <mesh position={p} rotation={rot}>
      <torusGeometry args={[r, t, 8, 28]} />
      <Toon color={c} emissive={e} ei={e ? 0.6 : 0} />
    </mesh>
  )
}
function Eyes({ y, z, gap, r = 0.07, angry = false }: { y: number; z: number; gap: number; r?: number; angry?: boolean }) {
  return (
    <>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * gap, y, z]}>
          <Ball p={[0, 0, 0]} r={r} s={[1, 1.2, 0.7]} c="#26211f" seg={10} />
          <Ball p={[s * r * 0.3, r * 0.45, r * 0.5]} r={r * 0.36} c="#ffffff" seg={8} />
          {angry && <Bx p={[0, r * 1.6, 0]} s={[r * 2.2, r * 0.5, r * 0.4]} rot={[0, 0, s * -0.45]} c="#26211f" />}
        </group>
      ))}
    </>
  )
}

/* ====================== 탑 ====================== */
export const KIND_COLOR: Record<TowerKind, string> = {
  sword: '#4f86d6',
  hammer: '#e07b39',
  bow: '#45a84c',
  staff: '#9466d8',
  axe: '#c8503c',
  spear: '#d9b13a',
}
const BRANCH_COLOR: Record<TowerKind, [string, string]> = {
  sword: ['#7aa7e8', '#e0574f'],
  hammer: ['#f0c050', '#e0574f'],
  bow: ['#6fd36f', '#3a7f8a'],
  staff: ['#ff7a3a', '#7fd4ff'],
  axe: ['#8a6a4a', '#5a5f6a'],
  spear: ['#7bd65a', '#e8eef5'],
}
const WOOD = '#9c6b3f'
const WOOD_D = '#7a5030'
const STONE = '#bdb6aa'
const STONE_D = '#9a9286'
const GOLD = '#f2c14e'

// 탑 공통 받침 — 단계마다 재료와 장식이 달라진다
function Base({ tier, color, r = 0.85 }: { tier: number; color: string; r?: number }) {
  const stone = tier >= 2
  return (
    <group>
      <Cyl p={[0, 0.12, 0]} r={r} r2={r * 0.94} h={0.24} c={stone ? STONE_D : WOOD_D} seg={stone ? 8 : 12} />
      <Cyl p={[0, 0.28, 0]} r={r * 0.9} r2={r * 0.86} h={0.1} c={stone ? STONE : WOOD} seg={stone ? 8 : 12} />
      {tier >= 3 && <Ring p={[0, 0.25, 0]} r={r * 0.93} t={0.05} c={color} rot={[PI / 2, 0, 0]} />}
      {tier >= 4 && <Ring p={[0, 0.34, 0]} r={r * 0.86} t={0.04} c={GOLD} rot={[PI / 2, 0, 0]} e={GOLD} />}
    </group>
  )
}

// 각성(5단계): 떠다니는 고리와 보석 세 개
function Awaken({ color, y }: { color: string; y: number }) {
  const g = useRef<THREE.Group>(null)
  useFrame((s) => {
    if (!g.current) return
    const t = s.clock.elapsedTime
    g.current.rotation.y = t * 1.2
    g.current.position.y = y + Math.sin(t * 2) * 0.08
  })
  return (
    <group ref={g} position={[0, y, 0]}>
      <Ring p={[0, 0, 0]} r={0.62} t={0.035} c={color} rot={[PI / 2, 0, 0]} e={color} />
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * 0.62, 0, Math.sin(a) * 0.62]}>
            <octahedronGeometry args={[0.1]} />
            <meshBasicMaterial color={color} />
          </mesh>
        )
      })}
    </group>
  )
}

/* ---------- 전문가 탑 표시: 내 직업의 탑은 한눈에 달라 보이게 ----------
   금빛 받침 · 직업 색 빛기둥 · 올라가는 반짝이 · 머리 위에서 도는 금 별 훈장 */
const STAR_GEO = (() => {
  const s = new THREE.Shape()
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * PI * 2 + PI / 2
    const r = i % 2 ? 0.13 : 0.3
    if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r)
    else s.lineTo(Math.cos(a) * r, Math.sin(a) * r)
  }
  s.closePath()
  return new THREE.ExtrudeGeometry(s, { depth: 0.08, bevelEnabled: true, bevelSize: 0.025, bevelThickness: 0.025, bevelSegments: 1 })
})()
STAR_GEO.center()

export function SpecMark({ color, top }: { color: string; top: number }) {
  const pillar = useRef<THREE.Mesh>(null)
  const crest = useRef<THREE.Group>(null)
  const star = useRef<THREE.Mesh>(null)
  const sparks = useRef<THREE.Group>(null)
  useFrame((s) => {
    const t = s.clock.elapsedTime
    if (pillar.current) (pillar.current.material as THREE.MeshBasicMaterial).opacity = 0.24 + Math.sin(t * 2.4) * 0.08
    if (crest.current) crest.current.position.y = top + 0.8 + Math.sin(t * 2.2) * 0.1
    // 카메라 쪽을 본 채로 빙글빙글 (옆으로 돌면 위에서 얇게 보인다)
    if (star.current) star.current.rotation.y = Math.sin(t * 1.8) * 0.5
    if (sparks.current)
      sparks.current.children.forEach((c, i) => {
        const k = (t * 0.45 + i / 6) % 1
        const a = i * 1.05 + t * 0.6
        c.position.set(Math.cos(a) * 0.82, 0.2 + k * 2.8, Math.sin(a) * 0.82)
        c.scale.setScalar(1 - k * 0.7)
      })
  })
  return (
    <group>
      {/* 금빛 받침 */}
      <mesh position={[0, 0.03, 0]} rotation={[-PI / 2, 0, 0]}>
        <ringGeometry args={[0.92, 1.32, 6]} />
        <meshBasicMaterial color={GOLD} />
      </mesh>
      <mesh position={[0, 0.035, 0]} rotation={[-PI / 2, 0, 0]}>
        <ringGeometry args={[1.0, 1.22, 6]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * 1.27, 0.12, Math.sin(a) * 1.27]}>
            <octahedronGeometry args={[0.11]} />
            <meshBasicMaterial color={GOLD} />
          </mesh>
        )
      })}
      {/* 빛기둥 */}
      <mesh ref={pillar} position={[0, 1.6, 0]}>
        <cylinderGeometry args={[0.95, 1.05, 3.2, 20, 1, true]} />
        <meshBasicMaterial color={color} transparent opacity={0.18} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* 올라가는 반짝이 */}
      <group ref={sparks}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <mesh key={i}>
            <octahedronGeometry args={[0.08]} />
            <meshBasicMaterial color={i % 2 ? GOLD : color} />
          </mesh>
        ))}
      </group>
      {/* 머리 위 금 별 훈장 */}
      <group ref={crest} position={[0, top + 0.8, 0]}>
        <group rotation={[-0.75, 0, 0]} scale={1.5}>
          <mesh>
            <circleGeometry args={[0.42, 24]} />
            <meshBasicMaterial color={color} transparent opacity={0.85} depthWrite={false} />
          </mesh>
          <mesh>
            <ringGeometry args={[0.42, 0.5, 24]} />
            <meshBasicMaterial color={GOLD} side={THREE.DoubleSide} />
          </mesh>
          <mesh ref={star} geometry={STAR_GEO} position={[0, 0, 0.06]}>
            <meshToonMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.5} />
          </mesh>
        </group>
      </group>
    </group>
  )
}

export type TowerAnim = { aim: number; fireAt: number } // 조준 방향(라디안, 월드 기준) · 마지막 발사 시각
const kick = (anim: TowerAnim, ms: number) => Math.max(0, 1 - (performance.now() - anim.fireAt) / ms)

/* 검사 초소: 둥근 돌 성채 + 방패 + 꽂힌 검 */
function SwordTower({ tier, br, anim }: { tier: number; br: number; anim: TowerAnim }) {
  const col = br ? BRANCH_COLOR.sword[br - 1] : KIND_COLOR.sword
  const sw = useRef<THREE.Group>(null)
  useFrame(() => {
    if (sw.current) sw.current.rotation.y = -anim.aim * 0 + Math.sin(performance.now() / 900) * 0.1 + kick(anim, 220) * 0.6
  })
  const wall = tier >= 2 ? STONE : '#c9a77a'
  const h = 0.95 + tier * 0.1
  return (
    <group>
      <Base tier={tier} color={col} />
      <Cyl p={[0, 0.33 + h / 2, 0]} r={0.62} r2={0.56} h={h} c={wall} seg={10} />
      {/* 돌 줄무늬 */}
      {tier >= 2 && [0.25, 0.5, 0.75].map((f) => <Ring key={f} p={[0, 0.33 + h * f, 0]} r={0.6 - f * 0.05} t={0.02} c={STONE_D} rot={[PI / 2, 0, 0]} />)}
      {/* 톱니 성벽 */}
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * PI * 2
        return <Bx key={i} p={[Math.cos(a) * 0.55, 0.38 + h, Math.sin(a) * 0.55]} s={[0.2, 0.22, 0.2]} rot={[0, -a, 0]} c={wall} />
      })}
      {/* 문 */}
      <Bx p={[0, 0.55, 0.57]} s={[0.3, 0.42, 0.06]} c={WOOD_D} />
      {/* 방패 문장 */}
      <group position={[0, 0.33 + h * 0.62, 0.6]}>
        <Cyl p={[0, 0, 0]} r={0.2} h={0.05} c={col} seg={tier >= 3 ? 6 : 16} rot={[PI / 2, 0, 0]} />
        <Cyl p={[0, 0, 0.03]} r={0.12} h={0.03} c={tier >= 4 ? GOLD : '#e8eef5'} seg={16} rot={[PI / 2, 0, 0]} />
      </group>
      {/* 반격 초소: 가시 */}
      {br === 2 &&
        Array.from({ length: 6 }, (_, i) => {
          const a = (i / 6) * PI * 2 + 0.3
          return <Cone key={i} p={[Math.cos(a) * 0.66, 0.6, Math.sin(a) * 0.66]} r={0.06} h={0.3} c="#d8dde4" rot={[Math.sin(a) * 1.4, 0, -Math.cos(a) * 1.4]} />
        })}
      {/* 철벽 초소: 푸른 방패 막 */}
      {br === 1 && (
        <mesh position={[0, 0.9, 0]}>
          <sphereGeometry args={[0.95, 16, 10, 0, PI * 2, 0, PI / 2]} />
          <meshBasicMaterial color="#9fd0ff" transparent opacity={0.18} depthWrite={false} />
        </mesh>
      )}
      {/* 꽂힌 큰 검 */}
      <group ref={sw} position={[0, 0.45 + h, 0]}>
        <Bx p={[0, 0.48, 0]} s={[0.12, 0.85, 0.04]} c="#e8eef5" e={tier >= 4 ? '#bfe0ff' : undefined} ei={0.3} />
        <Cone p={[0, 0.96, 0]} r={0.085} h={0.16} c="#e8eef5" seg={4} />
        <Bx p={[0, 0.05, 0]} s={[0.42, 0.07, 0.08]} c={tier >= 4 ? GOLD : '#8a6a3a'} />
        <Cyl p={[0, -0.1, 0]} r={0.035} h={0.22} c="#5a3a2a" seg={6} />
      </group>
      {tier >= 5 && <Awaken color={col} y={2.6} />}
    </group>
  )
}

/* 대장간: 나무 오두막 + 굴뚝 연기 + 모루와 망치 */
function HammerTower({ tier, br, anim }: { tier: number; br: number; anim: TowerAnim }) {
  const col = br ? BRANCH_COLOR.hammer[br - 1] : KIND_COLOR.hammer
  const hm = useRef<THREE.Group>(null)
  const smoke = useRef<(THREE.Mesh | null)[]>([])
  useFrame((s) => {
    const t = s.clock.elapsedTime
    if (hm.current) hm.current.rotation.x = -0.9 + Math.abs(Math.sin(t * 3.2)) * 1.1 + kick(anim, 200) * 0.4
    smoke.current.forEach((m, i) => {
      if (!m) return
      const u = (t * 0.45 + i / 3) % 1
      m.position.set(0.42 + Math.sin(u * 4 + i) * 0.08, 1.75 + u * 0.9, -0.25)
      m.scale.setScalar(0.12 + u * 0.18)
      ;(m.material as THREE.MeshBasicMaterial).opacity = 0.55 * (1 - u)
    })
  })
  const wall = tier >= 2 ? '#d8c3a0' : '#c49a6c'
  return (
    <group>
      <Base tier={tier} color={col} />
      <Bx p={[0, 0.75, -0.1]} s={[1.15, 0.85, 0.9]} c={wall} />
      {/* 나무 기둥 */}
      {[-0.56, 0.56].map((x) => (
        <Bx key={x} p={[x, 0.75, 0.35]} s={[0.1, 0.85, 0.1]} c={WOOD_D} />
      ))}
      {/* 지붕 */}
      <mesh position={[0, 1.42, -0.1]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.01, 0.95, 0.6, 4, 1]} />
        <Toon color={br === 2 ? '#b8433a' : tier >= 4 ? '#c0503c' : '#8a4a32'} />
      </mesh>
      {/* 굴뚝 */}
      <Bx p={[0.42, 1.5, -0.25]} s={[0.22, 0.6, 0.22]} c={STONE_D} />
      {[0, 1, 2].map((i) => (
        <mesh key={i} ref={(el) => void (smoke.current[i] = el)}>
          <sphereGeometry args={[1, 8, 6]} />
          <meshBasicMaterial color="#e8e4dc" transparent opacity={0.4} depthWrite={false} />
        </mesh>
      ))}
      {/* 화덕 불빛 */}
      <Bx p={[0, 0.6, 0.36]} s={[0.4, 0.3, 0.04]} c="#ff8a3a" e="#ff6a1a" ei={0.9} />
      {/* 모루 */}
      <group position={[0.15, 0.36, 0.72]}>
        <Bx p={[0, 0.1, 0]} s={[0.18, 0.2, 0.14]} c="#4a4f57" />
        <Bx p={[0, 0.24, 0]} s={[0.36, 0.1, 0.18]} c={br === 1 ? GOLD : '#5a606a'} e={br === 1 ? GOLD : undefined} ei={0.3} />
      </group>
      {/* 두드리는 망치 */}
      <group ref={hm} position={[-0.2, 0.75, 0.72]}>
        <Bx p={[0, 0.25, 0]} s={[0.05, 0.5, 0.05]} c={WOOD} />
        <Bx p={[0, 0.5, 0]} s={[0.22, 0.12, 0.12]} c="#6a707a" />
      </group>
      {/* 전투 대장간: 깃발 */}
      {br === 2 && (
        <group position={[-0.5, 1.4, 0.3]}>
          <Bx p={[0, 0.3, 0]} s={[0.04, 0.9, 0.04]} c={WOOD_D} />
          <Bx p={[0.17, 0.55, 0]} s={[0.32, 0.24, 0.02]} c="#e0574f" />
        </group>
      )}
      {tier >= 5 && <Awaken color={col} y={2.4} />}
    </group>
  )
}

/* 궁수탑: 나무 망루 + 위에서 조준하는 쇠뇌 */
function BowTower({ tier, br, anim }: { tier: number; br: number; anim: TowerAnim }) {
  const col = br ? BRANCH_COLOR.bow[br - 1] : KIND_COLOR.bow
  const head = useRef<THREE.Group>(null)
  const bolt = useRef<THREE.Group>(null)
  useFrame(() => {
    if (head.current) head.current.rotation.y = THREE.MathUtils.lerp(head.current.rotation.y, anim.aim, 0.25)
    if (bolt.current) bolt.current.position.z = 0.1 - kick(anim, 160) * 0.25
  })
  const post = tier >= 2 ? '#8a6a4a' : WOOD
  const h = 1.3 + tier * 0.12
  return (
    <group>
      <Base tier={tier} color={col} r={0.78} />
      {[
        [-0.38, -0.38],
        [0.38, -0.38],
        [-0.38, 0.38],
        [0.38, 0.38],
      ].map(([x, z], i) => (
        <Bx key={i} p={[x * 0.9, 0.3 + h / 2, z * 0.9]} s={[0.11, h, 0.11]} rot={[z * 0.12, 0, -x * 0.12]} c={post} />
      ))}
      {/* 엇갈린 버팀목 */}
      <Bx p={[0, 0.3 + h * 0.4, 0.34]} s={[0.75, 0.06, 0.05]} rot={[0, 0, 0.5]} c={WOOD_D} />
      <Bx p={[0, 0.3 + h * 0.4, -0.34]} s={[0.75, 0.06, 0.05]} rot={[0, 0, -0.5]} c={WOOD_D} />
      {/* 발판 */}
      <Bx p={[0, 0.35 + h, 0]} s={[1.0, 0.12, 1.0]} c={tier >= 2 ? '#b08a5a' : WOOD} />
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * PI * 2
        return <Bx key={i} p={[Math.sin(a) * 0.47, 0.52 + h, Math.cos(a) * 0.47]} s={[0.9, 0.2, 0.06]} rot={[0, a, 0]} c={tier >= 3 ? col : WOOD} />
      })}
      {/* 지붕 */}
      {[-0.42, 0.42].map((x) => (
        <Bx key={x} p={[x, 0.85 + h, -0.42]} s={[0.06, 0.6, 0.06]} c={WOOD_D} />
      ))}
      <Cone p={[0, 1.4 + h, 0]} r={0.78} h={0.55} seg={4} rot={[0, PI / 4, 0]} c={tier >= 4 ? '#2f7a3a' : '#4a8f4a'} />
      {tier >= 4 && <Ball p={[0, 1.72 + h, 0]} r={0.08} c={GOLD} e={GOLD} />}
      {/* 쇠뇌 (조준) */}
      <group ref={head} position={[0, 0.62 + h, 0]}>
        <Bx p={[0, 0, 0]} s={[0.1, 0.1, 0.5]} c={WOOD_D} />
        <mesh position={[0, 0, 0.22]} rotation={[0, 0, PI / 2]}>
          <torusGeometry args={[0.28, 0.03, 6, 14, PI]} />
          <Toon color={br === 2 ? '#3a4a5a' : '#6a4a2a'} />
        </mesh>
        <group ref={bolt}>
          <Bx p={[0, 0.06, 0.12]} s={[0.03, 0.03, 0.45]} c="#e8eef5" />
        </group>
      </group>
      {tier >= 5 && <Awaken color={col} y={2.6 + tier * 0.1} />}
    </group>
  )
}

/* 마법탑: 돌 첨탑 + 떠다니는 수정 + 도는 룬 */
function StaffTower({ tier, br, anim }: { tier: number; br: number; anim: TowerAnim }) {
  const col = br ? BRANCH_COLOR.staff[br - 1] : '#c49bff'
  const crystal = useRef<THREE.Group>(null)
  const runes = useRef<THREE.Group>(null)
  useFrame((s) => {
    const t = s.clock.elapsedTime
    const k = kick(anim, 260)
    if (crystal.current) {
      crystal.current.rotation.y = t * 1.5
      crystal.current.position.y = 2.35 + tier * 0.08 + Math.sin(t * 2.2) * 0.08
      crystal.current.scale.setScalar(1 + k * 0.45)
    }
    if (runes.current) runes.current.rotation.y = -t * 0.8
  })
  const stone = tier >= 2 ? '#8f86b8' : '#a49cc8'
  return (
    <group>
      <Base tier={tier} color={KIND_COLOR.staff} r={0.8} />
      <Cyl p={[0, 0.75, 0]} r={0.62} r2={0.5} h={0.9} c={stone} seg={8} />
      <Cyl p={[0, 1.4, 0]} r={0.48} r2={0.36} h={0.5} c={stone} seg={8} />
      <Cyl p={[0, 1.72, 0]} r={0.44} r2={0.44} h={0.12} c={tier >= 4 ? GOLD : '#6c4fb8'} seg={8} />
      {/* 빛나는 창문 */}
      {[0, PI * 0.66, PI * 1.33].map((a) => (
        <Bx key={a} p={[Math.sin(a) * 0.55, 0.85, Math.cos(a) * 0.55]} s={[0.14, 0.22, 0.05]} rot={[0, a, 0]} c={col} e={col} ei={0.9} />
      ))}
      <Cone p={[0, 1.98, 0]} r={0.34} h={0.45} seg={8} c="#4a3590" />
      {/* 수정 */}
      <group ref={crystal} position={[0, 2.4, 0]}>
        <mesh>
          <octahedronGeometry args={[0.22 + tier * 0.02]} />
          <meshBasicMaterial color={col} />
        </mesh>
        <mesh scale={1.6}>
          <octahedronGeometry args={[0.22]} />
          <meshBasicMaterial color={col} transparent opacity={0.25} depthWrite={false} />
        </mesh>
      </group>
      {/* 룬 고리 */}
      {tier >= 3 && (
        <group ref={runes} position={[0, 1.2, 0]}>
          {Array.from({ length: 5 }, (_, i) => {
            const a = (i / 5) * PI * 2
            return (
              <mesh key={i} position={[Math.cos(a) * 0.82, Math.sin(a * 2) * 0.1, Math.sin(a) * 0.82]}>
                <boxGeometry args={[0.1, 0.1, 0.1]} />
                <meshBasicMaterial color={col} />
              </mesh>
            )
          })}
        </group>
      )}
      {tier >= 5 && <Awaken color={col} y={3.0} />}
    </group>
  )
}

/* 투석기: 바퀴 달린 틀 + 휘두르는 팔 (조준) */
function AxeTower({ tier, br, anim }: { tier: number; br: number; anim: TowerAnim }) {
  const col = br ? BRANCH_COLOR.axe[br - 1] : KIND_COLOR.axe
  const head = useRef<THREE.Group>(null)
  const arm = useRef<THREE.Group>(null)
  useFrame(() => {
    if (head.current) head.current.rotation.y = THREE.MathUtils.lerp(head.current.rotation.y, anim.aim, 0.2)
    const k = kick(anim, 520)
    if (arm.current) arm.current.rotation.x = -0.9 + (k > 0.75 ? (1 - k) * 4 * 1.6 : k * 1.6 / 0.75) * 0.9
  })
  const wood = tier >= 2 ? '#8a6040' : WOOD
  return (
    <group>
      <Base tier={tier} color={col} r={0.88} />
      <group ref={head} position={[0, 0.34, 0]}>
        {/* 틀 */}
        <Bx p={[0, 0.18, 0]} s={[0.9, 0.16, 1.1]} c={wood} />
        {[-1, 1].map((s) => (
          <group key={s}>
            <Cyl p={[s * 0.5, 0.12, 0.38]} r={0.2} h={0.1} c={WOOD_D} rot={[0, 0, PI / 2]} seg={12} />
            <Cyl p={[s * 0.5, 0.12, -0.38]} r={0.2} h={0.1} c={WOOD_D} rot={[0, 0, PI / 2]} seg={12} />
            <Bx p={[s * 0.32, 0.55, 0]} s={[0.1, 0.7, 0.1]} rot={[0, 0, s * 0.2]} c={wood} />
          </group>
        ))}
        <Cyl p={[0, 0.82, 0]} r={0.06} h={0.7} c="#5a5f6a" rot={[0, 0, PI / 2]} seg={8} />
        {tier >= 4 && <Bx p={[0, 0.3, -0.5]} s={[0.92, 0.08, 0.06]} c={GOLD} />}
        {/* 팔 */}
        <group ref={arm} position={[0, 0.82, 0]} rotation={[-0.9, 0, 0]}>
          <Bx p={[0, 0.5, 0]} s={[0.1, 1.05, 0.1]} c={WOOD_D} />
          {br === 2 ? (
            <Ball p={[0, 1.05, 0]} r={0.22} c="#5a5f6a" />
          ) : (
            <group position={[0, 1.02, 0]}>
              <Cyl p={[0, 0, 0]} r={0.2} r2={0.24} h={0.12} c={WOOD} seg={10} />
              <Ball p={[0, 0.12, 0]} r={0.16} c={br === 1 ? '#3a3a42' : '#9a9286'} seg={8} />
            </group>
          )}
        </group>
        {/* 평형추 */}
        <Bx p={[0, 0.45, 0.42]} s={[0.36, 0.3, 0.3]} c={STONE_D} />
      </group>
      {tier >= 5 && <Awaken color={col} y={2.4} />}
    </group>
  )
}

/* 창 함정: 돌 테두리 + 찌르는 창들 */
function SpearTower({ tier, br, anim }: { tier: number; br: number; anim: TowerAnim }) {
  const col = br ? BRANCH_COLOR.spear[br - 1] : '#e8eef5'
  const spikes = useRef<THREE.Group>(null)
  useFrame((s) => {
    const k = kick(anim, 300)
    if (spikes.current) spikes.current.position.y = 0.1 + k * 0.45 + Math.sin(s.clock.elapsedTime * 2) * 0.02
  })
  const n = 5 + tier
  return (
    <group>
      <Base tier={tier} color={KIND_COLOR.spear} r={0.86} />
      <Cyl p={[0, 0.42, 0]} r={0.72} r2={0.72} h={0.18} c={tier >= 2 ? STONE_D : WOOD_D} seg={12} />
      <Cyl p={[0, 0.44, 0]} r={0.56} r2={0.56} h={0.2} c="#3a332c" seg={12} />
      <group ref={spikes} position={[0, 0.1, 0]}>
        {Array.from({ length: n }, (_, i) => {
          const a = (i / n) * PI * 2
          const r = i % 2 ? 0.38 : 0.22
          return (
            <group key={i} position={[Math.cos(a) * r, 0.45, Math.sin(a) * r]}>
              <Cyl p={[0, 0.15, 0]} r={0.035} h={0.5} c={WOOD_D} seg={6} />
              <Cone p={[0, 0.5, 0]} r={0.07} h={0.28} seg={4} c={col} e={br === 1 ? '#5adb4a' : undefined} ei={0.4} />
            </group>
          )
        })}
        <group position={[0, 0.45, 0]}>
          <Cyl p={[0, 0.3, 0]} r={0.05} h={0.8} c={WOOD_D} seg={6} />
          <Cone p={[0, 0.82, 0]} r={0.11} h={0.4} seg={4} c={tier >= 4 ? GOLD : col} />
        </group>
      </group>
      {tier >= 5 && <Awaken color={KIND_COLOR.spear} y={1.9} />}
    </group>
  )
}

export function TowerModel({ kind, tier, br, anim }: { kind: TowerKind; tier: number; br: number; anim: TowerAnim }) {
  switch (kind) {
    case 'sword':
      return <SwordTower tier={tier} br={br} anim={anim} />
    case 'hammer':
      return <HammerTower tier={tier} br={br} anim={anim} />
    case 'bow':
      return <BowTower tier={tier} br={br} anim={anim} />
    case 'staff':
      return <StaffTower tier={tier} br={br} anim={anim} />
    case 'axe':
      return <AxeTower tier={tier} br={br} anim={anim} />
    default:
      return <SpearTower tier={tier} br={br} anim={anim} />
  }
}

/* ====================== 몬스터 ====================== */
// 걷기 동작은 부모가 phase 로 넘긴다 (리렌더 없이 ref 로)
export type MonAnim = { phase: number; hitAt: number }

function Legs({ anim, x, z, c, len = 0.22, r = 0.07 }: { anim: MonAnim; x: number; z: number; c: string; len?: number; r?: number }) {
  const a = useRef<THREE.Group>(null)
  const b = useRef<THREE.Group>(null)
  useFrame(() => {
    const s = Math.sin(anim.phase) * 0.6
    if (a.current) a.current.rotation.x = s
    if (b.current) b.current.rotation.x = -s
  })
  return (
    <>
      <group ref={a} position={[-x, len, z]}>
        <Cyl p={[0, -len / 2, 0]} r={r} h={len} c={c} seg={8} />
      </group>
      <group ref={b} position={[x, len, z]}>
        <Cyl p={[0, -len / 2, 0]} r={r} h={len} c={c} seg={8} />
      </group>
    </>
  )
}

function Slime({ big = false }: { big?: boolean }) {
  const c = big ? '#7fc8f0' : '#7bd65a'
  const hi = big ? '#d4f0ff' : '#d4f7b8'
  return (
    <group scale={big ? 1.35 : 1}>
      <Ball p={[0, 0.3, 0]} r={0.42} s={[1, 0.78, 1]} c={c} />
      <Ball p={[-0.15, 0.48, 0.24]} r={0.1} s={[1, 0.6, 0.5]} c={hi} />
      {big && <Ball p={[0.1, 0.32, -0.05]} r={0.16} c="#5aa8d8" />}
      <Eyes y={0.34} z={0.36} gap={0.15} r={0.06} />
    </group>
  )
}

function Bat({ anim }: { anim: MonAnim }) {
  const wl = useRef<THREE.Group>(null)
  const wr = useRef<THREE.Group>(null)
  useFrame((s) => {
    const a = Math.sin(s.clock.elapsedTime * 18 + anim.phase) * 0.7
    if (wl.current) wl.current.rotation.z = a
    if (wr.current) wr.current.rotation.z = -a
  })
  return (
    <group position={[0, 1.5, 0]}>
      <Ball p={[0, 0, 0]} r={0.26} s={[1, 0.95, 1.05]} c="#5a4a86" />
      <Cone p={[-0.13, 0.28, 0]} r={0.07} h={0.2} c="#5a4a86" seg={5} />
      <Cone p={[0.13, 0.28, 0]} r={0.07} h={0.2} c="#5a4a86" seg={5} />
      <Eyes y={0.04} z={0.23} gap={0.09} r={0.05} angry />
      <group ref={wl} position={[-0.22, 0.04, 0]}>
        <Ball p={[-0.3, 0, 0]} r={0.34} s={[1, 0.15, 0.62]} c="#8a76c4" />
      </group>
      <group ref={wr} position={[0.22, 0.04, 0]}>
        <Ball p={[0.3, 0, 0]} r={0.34} s={[1, 0.15, 0.62]} c="#8a76c4" />
      </group>
    </group>
  )
}

function Turtle({ anim }: { anim: MonAnim }) {
  return (
    <group>
      <Ball p={[0, 0.34, 0]} r={0.52} s={[1, 0.62, 1.15]} c="#6e7f6a" />
      {/* 등딱지 무늬 */}
      {[
        [0, 0.62, 0],
        [0.26, 0.52, 0.22],
        [-0.26, 0.52, 0.22],
        [0.26, 0.52, -0.22],
        [-0.26, 0.52, -0.22],
      ].map((p, i) => (
        <Cyl key={i} p={p as V3} r={0.13} h={0.06} seg={6} c="#4f5f4c" />
      ))}
      <Ring p={[0, 0.22, 0]} r={0.5} t={0.06} c="#c9a96a" rot={[PI / 2, 0, 0]} />
      <Ball p={[0, 0.32, 0.62]} r={0.18} c="#9bc28a" />
      <Eyes y={0.38} z={0.75} gap={0.08} r={0.045} />
      <Legs anim={anim} x={0.3} z={0.3} c="#8bb27a" len={0.2} r={0.08} />
      <Legs anim={anim} x={0.3} z={-0.32} c="#8bb27a" len={0.2} r={0.08} />
    </group>
  )
}

function Fox({ anim }: { anim: MonAnim }) {
  const tail = useRef<THREE.Group>(null)
  useFrame(() => {
    if (tail.current) tail.current.rotation.y = Math.sin(anim.phase * 0.5) * 0.4
  })
  return (
    <group>
      <Ball p={[0, 0.45, 0]} r={0.26} s={[1, 0.95, 1.5]} c="#f08a2e" />
      <Ball p={[0, 0.62, 0.38]} r={0.22} c="#f39a3e" />
      <Ball p={[0, 0.56, 0.56]} r={0.09} s={[1, 0.8, 1.2]} c="#fff4e6" />
      <Ball p={[0, 0.58, 0.64]} r={0.035} c="#26211f" seg={8} />
      <Cone p={[-0.12, 0.85, 0.36]} r={0.07} h={0.18} c="#e07a1e" seg={5} />
      <Cone p={[0.12, 0.85, 0.36]} r={0.07} h={0.18} c="#e07a1e" seg={5} />
      <Eyes y={0.68} z={0.54} gap={0.09} r={0.04} angry />
      <group ref={tail} position={[0, 0.55, -0.35]}>
        <Ball p={[0, 0.1, -0.2]} r={0.17} s={[0.8, 0.8, 1.6]} c="#f08a2e" />
        <Ball p={[0, 0.14, -0.45]} r={0.1} c="#fff4e6" />
      </group>
      <Legs anim={anim} x={0.12} z={0.22} c="#c86a1e" len={0.3} r={0.05} />
      <Legs anim={anim} x={0.12} z={-0.22} c="#c86a1e" len={0.3} r={0.05} />
    </group>
  )
}

function Goblin({ anim }: { anim: MonAnim }) {
  const axe = useRef<THREE.Group>(null)
  useFrame(() => {
    if (axe.current) axe.current.rotation.x = -0.4 + Math.sin(anim.phase * 2) * 0.5
  })
  return (
    <group>
      <Legs anim={anim} x={0.12} z={0} c="#4f7a3a" len={0.28} r={0.07} />
      <Ball p={[0, 0.5, 0]} r={0.26} s={[1, 1.05, 0.9]} c="#6aa84f" />
      <Bx p={[0, 0.42, 0]} s={[0.5, 0.12, 0.44]} c="#8a5a3a" />
      <Ball p={[0, 0.92, 0.02]} r={0.25} c="#7cbf5a" />
      <Cone p={[-0.3, 0.98, 0]} r={0.07} h={0.3} c="#7cbf5a" seg={5} rot={[0, 0, PI / 2.4]} />
      <Cone p={[0.3, 0.98, 0]} r={0.07} h={0.3} c="#7cbf5a" seg={5} rot={[0, 0, -PI / 2.4]} />
      <Eyes y={0.96} z={0.22} gap={0.09} r={0.05} angry />
      <Ball p={[0, 0.86, 0.24]} r={0.05} c="#5a9a3f" />
      <group ref={axe} position={[0.3, 0.6, 0.08]}>
        <Cyl p={[0, 0.2, 0]} r={0.03} h={0.55} c={WOOD} seg={6} />
        <Bx p={[0.09, 0.44, 0]} s={[0.2, 0.18, 0.04]} c="#c7ccd2" />
      </group>
    </group>
  )
}

function Bomb({ anim }: { anim: MonAnim }) {
  const spark = useRef<THREE.Mesh>(null)
  useFrame((s) => {
    if (spark.current) spark.current.scale.setScalar(0.8 + Math.abs(Math.sin(s.clock.elapsedTime * 14)) * 0.8)
  })
  return (
    <group>
      <Ball p={[0, 0.38, 0]} r={0.3} c="#33333d" />
      <Ball p={[-0.1, 0.52, 0.18]} r={0.07} c="#6a6a78" />
      <Cyl p={[0, 0.72, 0]} r={0.05} h={0.12} c="#8a7a5a" seg={6} />
      <mesh ref={spark} position={[0, 0.82, 0]}>
        <octahedronGeometry args={[0.07]} />
        <meshBasicMaterial color="#ffb03a" />
      </mesh>
      <Eyes y={0.42} z={0.26} gap={0.1} r={0.05} angry />
      <Legs anim={anim} x={0.12} z={0} c="#ff8a3a" len={0.12} r={0.06} />
    </group>
  )
}

function King({ anim }: { anim: MonAnim }) {
  const cape = useRef<THREE.Mesh>(null)
  useFrame(() => {
    if (cape.current) cape.current.rotation.x = 0.2 + Math.sin(anim.phase) * 0.08
  })
  return (
    <group scale={1.45}>
      <Legs anim={anim} x={0.18} z={0} c="#5a2f8a" len={0.25} r={0.09} />
      <Ball p={[0, 0.62, 0]} r={0.48} s={[1, 0.95, 0.95]} c="#7a3fb0" />
      <Ball p={[0, 0.5, 0.3]} r={0.3} s={[1, 0.8, 0.6]} c="#e8d8f0" />
      <Eyes y={0.78} z={0.42} gap={0.16} r={0.07} angry />
      <mesh ref={cape} position={[0, 0.7, -0.38]}>
        <boxGeometry args={[0.8, 0.8, 0.05]} />
        <Toon color="#c0303c" />
      </mesh>
      {/* 왕관 */}
      <Cyl p={[0, 1.12, 0]} r={0.26} r2={0.28} h={0.14} c={GOLD} seg={10} e={GOLD} ei={0.3} />
      {Array.from({ length: 5 }, (_, i) => {
        const a = (i / 5) * PI * 2
        return <Cone key={i} p={[Math.cos(a) * 0.24, 1.27, Math.sin(a) * 0.24]} r={0.06} h={0.18} seg={4} c={GOLD} e={GOLD} ei={0.3} />
      })}
      <Ball p={[0, 1.15, 0.27]} r={0.05} c="#e8524a" e="#ff4a3a" />
    </group>
  )
}

export function MonModel({ kind, anim }: { kind: MonKind; anim: MonAnim }) {
  switch (kind) {
    case 'slime':
      return <Slime />
    case 'blob':
      return <Slime big />
    case 'bat':
      return <Bat anim={anim} />
    case 'turtle':
      return <Turtle anim={anim} />
    case 'fox':
      return <Fox anim={anim} />
    case 'goblin':
      return <Goblin anim={anim} />
    case 'bomb':
      return <Bomb anim={anim} />
    default:
      return <King anim={anim} />
  }
}

/* ====================== 도토리 나무 ====================== */
export function AcornTree({ hp, hitAt }: { hp: number; hitAt: { v: number } }) {
  const g = useRef<THREE.Group>(null)
  const leaves = useRef<(THREE.Mesh | null)[]>([])
  const sparks = useRef<(THREE.Mesh | null)[]>([])
  const hurt = 1 - Math.max(0, Math.min(1, hp))
  // 황금빛 가을 도토리 나무 — 다칠수록 잎이 바래고 떨어진다
  const leaf = new THREE.Color('#f2b63c').lerp(new THREE.Color('#8a7a62'), hurt * 0.8).getStyle()
  const leaf2 = new THREE.Color('#e5892e').lerp(new THREE.Color('#7a6a52'), hurt * 0.8).getStyle()
  const leaf3 = new THREE.Color('#9cc23e').lerp(new THREE.Color('#7a7a5a'), hurt * 0.8).getStyle()
  const emblem = useRef<THREE.Group>(null)
  useFrame((s) => {
    const t = s.clock.elapsedTime
    const k = Math.max(0, 1 - (performance.now() - hitAt.v) / 600)
    if (g.current) g.current.rotation.z = Math.sin(performance.now() / 35) * 0.04 * k + Math.sin(t * 0.8) * 0.01
    // 맞으면 잎이 떨어진다
    leaves.current.forEach((m, i) => {
      if (!m) return
      const u = (t * 0.25 + i / 6) % 1
      const a = i * 1.7 + t * 0.3
      m.position.set(Math.cos(a) * (0.8 + u), 3.2 - u * 3.1, Math.sin(a) * (0.8 + u))
      m.rotation.set(t * 3 + i, t * 2, i)
      m.visible = hurt > 0.05 || k > 0
    })
    if (emblem.current) {
      emblem.current.rotation.y = t * 0.9
      emblem.current.position.y = 5.0 + Math.sin(t * 1.6) * 0.15
    }
    sparks.current.forEach((m, i) => {
      if (!m) return
      const a = (i / 5) * PI * 2 + t * 0.5
      m.position.set(Math.cos(a) * 1.9, 2.6 + Math.sin(t * 2 + i) * 0.4, Math.sin(a) * 1.9)
      m.scale.setScalar(0.5 + Math.max(0, Math.sin(t * 3 + i * 1.3)) * 0.8)
    })
  })
  return (
    <group>
      {/* 언덕 */}
      <Ball p={[0, -0.6, 0]} r={2.1} s={[1, 0.38, 1]} c="#6dbb5a" seg={20} />
      <group ref={g}>
        {/* 뿌리 */}
        {Array.from({ length: 5 }, (_, i) => {
          const a = (i / 5) * PI * 2 + 0.3
          return <Cone key={i} p={[Math.cos(a) * 0.5, 0.15, Math.sin(a) * 0.5]} r={0.22} h={0.9} c="#6a4628" seg={6} rot={[Math.sin(a) * 1.25, 0, -Math.cos(a) * 1.25]} />
        })}
        <Cyl p={[0, 1.2, 0]} r={0.62} r2={0.42} h={2.4} c="#7a5232" seg={10} />
        <Cyl p={[0.35, 2.2, 0]} r={0.16} r2={0.1} h={0.9} c="#7a5232" seg={8} rot={[0, 0, -0.8]} />
        <Cyl p={[-0.35, 2.3, 0.1]} r={0.15} r2={0.1} h={0.9} c="#7a5232" seg={8} rot={[0.2, 0, 0.8]} />
        {/* 문과 창 (도토리 마을의 상징) */}
        <Cyl p={[0, 0.5, 0.5]} r={0.24} h={0.06} c="#4a2e1a" seg={14} rot={[PI / 2 - 0.15, 0, 0]} />
        <Ball p={[0.12, 0.45, 0.56]} r={0.03} c={GOLD} seg={6} />
        {/* 잎 */}
        {(
          [
            [0, 3.2, 0, 1.55],
            [-1.15, 2.75, 0.25, 1.05],
            [1.15, 2.85, -0.15, 1.1],
            [0.4, 3.9, -0.3, 1.0],
            [-0.5, 3.7, 0.5, 0.9],
            [0.3, 2.7, 1.0, 0.85],
          ] as [number, number, number, number][]
        ).map(([x, y, z, r], i) => (
          <Ball key={i} p={[x, y, z]} r={r} c={i % 3 === 0 ? leaf : i % 3 === 1 ? leaf2 : leaf3} seg={16} />
        ))}
        {/* 도토리 */}
        {(
          [
            [0.8, 2.35, 1.05],
            [-0.9, 2.25, 0.8],
            [0.1, 2.75, 1.45],
            [1.5, 2.7, 0.45],
            [-1.4, 2.9, -0.2],
            [0.6, 3.5, 0.95],
          ] as V3[]
        ).map((p, i) => (
          <group key={i} position={p}>
            <Ball p={[0, -0.05, 0]} r={0.2} s={[1, 1.15, 1]} c="#c47a3a" seg={10} />
            <Ball p={[0, 0.12, 0]} r={0.17} s={[1, 0.6, 1]} c="#6b4423" seg={10} />
            <Cyl p={[0, 0.24, 0]} r={0.025} h={0.1} c="#5a3a1a" seg={5} />
          </group>
        ))}
      </group>
      {/* 위에 떠 있는 큰 황금 도토리 — 지켜야 할 나무 표시 */}
      <group ref={emblem} position={[0, 5, 0]}>
        <Ball p={[0, -0.08, 0]} r={0.36} s={[1, 1.2, 1]} c="#f2c14e" e="#ffb020" ei={0.45} />
        <Ball p={[0, 0.24, 0]} r={0.32} s={[1, 0.55, 1]} c="#8a5a2a" />
        <Cyl p={[0, 0.42, 0]} r={0.04} h={0.16} c="#6b4423" seg={6} />
        <mesh rotation={[PI / 2, 0, 0]}>
          <torusGeometry args={[0.62, 0.035, 6, 28]} />
          <meshBasicMaterial color="#fff3a8" />
        </mesh>
      </group>
      {/* 발밑을 지키는 빛 고리 */}
      <mesh position={[0, 0.2, 0]} rotation={[-PI / 2, 0, 0]}>
        <ringGeometry args={[2.0, 2.15, 40]} />
        <meshBasicMaterial color="#ffe08a" transparent opacity={0.55 - hurt * 0.35} depthWrite={false} />
      </mesh>
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} ref={(el) => void (leaves.current[i] = el)}>
          <planeGeometry args={[0.18, 0.12]} />
          <meshBasicMaterial color={i % 2 ? leaf : '#d9a03a'} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {Array.from({ length: 5 }, (_, i) => (
        <mesh key={i} ref={(el) => void (sparks.current[i] = el)}>
          <octahedronGeometry args={[0.07]} />
          <meshBasicMaterial color="#fff3a8" />
        </mesh>
      ))}
    </group>
  )
}

/* ====================== 몬스터 굴 ====================== */
export function MonsterDen() {
  const swirl = useRef<THREE.Mesh>(null)
  const eyes = useRef<THREE.Group>(null)
  useFrame((s) => {
    const t = s.clock.elapsedTime
    if (swirl.current) swirl.current.rotation.z = t * 1.2
    if (eyes.current) eyes.current.visible = Math.sin(t * 0.9) > -0.85
  })
  return (
    <group>
      {(
        [
          [0, 1.2, -0.2, 1.7, '#7d7469'],
          [-1.1, 0.8, 1.0, 1.1, '#8a8176'],
          [1.0, 0.7, 1.1, 1.0, '#8a8176'],
          [0.2, 2.2, -0.5, 1.1, '#968d82'],
          [-1.4, 0.6, -0.9, 1.0, '#7d7469'],
          [1.4, 0.6, -0.8, 1.0, '#7d7469'],
        ] as [number, number, number, number, string][]
      ).map(([x, y, z, r, c], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[i, i * 0.7, 0]}>
          <dodecahedronGeometry args={[r, 0]} />
          <Toon color={c} />
        </mesh>
      ))}
      {/* 이끼 */}
      <Ball p={[0.3, 2.9, -0.4]} r={0.6} s={[1, 0.35, 1]} c="#6aa84f" />
      {/* 입구 */}
      <mesh position={[0.95, 0.9, 0]} rotation={[0, PI / 2, 0]}>
        <circleGeometry args={[0.85, 24, 0, PI]} />
        <meshBasicMaterial color="#1a1220" />
      </mesh>
      <mesh position={[0.95, 0.45, 0]} rotation={[0, PI / 2, 0]}>
        <planeGeometry args={[1.7, 0.9]} />
        <meshBasicMaterial color="#1a1220" />
      </mesh>
      <mesh ref={swirl} position={[0.97, 0.75, 0]} rotation={[0, PI / 2, 0]}>
        <torusGeometry args={[0.45, 0.07, 6, 24, PI * 1.5]} />
        <meshBasicMaterial color="#b066ff" />
      </mesh>
      <group ref={eyes} position={[0.98, 0.9, 0]}>
        {[-0.18, 0.18].map((z) => (
          <mesh key={z} position={[0, 0, z]} rotation={[0, PI / 2, 0]}>
            <circleGeometry args={[0.06, 10]} />
            <meshBasicMaterial color="#ff4a3a" />
          </mesh>
        ))}
      </group>
    </group>
  )
}

/* ====================== 빈 터 ====================== */
export function BuildPad({ on, busy, color, children }: { on: boolean; busy: boolean; color: string; children?: ReactNode }) {
  const plus = useRef<THREE.Group>(null)
  useFrame((s) => {
    if (!plus.current) return
    const t = s.clock.elapsedTime
    plus.current.position.y = 0.55 + Math.sin(t * 2.5) * 0.08
    plus.current.rotation.y = t * 0.8
  })
  return (
    <group>
      <Cyl p={[0, 0.06, 0]} r={0.92} r2={0.88} h={0.12} c={on ? '#f6dc8a' : '#cfc3a6'} seg={6} e={on ? '#ffcf4a' : undefined} ei={0.45} />
      <Cyl p={[0, 0.14, 0]} r={0.72} r2={0.72} h={0.04} c={on ? '#ffe9a8' : '#b9ab8c'} seg={6} />
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * PI * 2 + PI / 6
        return <Ball key={i} p={[Math.cos(a) * 0.86, 0.12, Math.sin(a) * 0.86]} r={0.1} s={[1, 0.6, 1]} c="#9a9286" seg={8} />
      })}
      {!busy && (
        <group ref={plus}>
          <Bx p={[0, 0, 0]} s={[0.36, 0.1, 0.1]} c={on ? '#ff9f1a' : '#fff6d8'} e={on ? '#ff9f1a' : '#fff6d8'} ei={0.4} />
          <Bx p={[0, 0, 0]} s={[0.1, 0.36, 0.1]} c={on ? '#ff9f1a' : '#fff6d8'} e={on ? '#ff9f1a' : '#fff6d8'} ei={0.4} />
        </group>
      )}
      {busy && (
        <group>
          {[-0.4, 0.4].map((dx) => (
            <Bx key={dx} p={[dx, 0.7, 0]} s={[0.08, 1.2, 0.08]} c="#a07a4a" />
          ))}
          <Bx p={[0, 1.15, 0]} s={[0.95, 0.08, 0.08]} c="#a07a4a" />
          <Bx p={[0, 0.7, 0]} s={[0.95, 0.06, 0.06]} rot={[0, 0, 0.9]} c="#a07a4a" />
          <Bx p={[0.18, 1.45, 0]} s={[0.42, 0.28, 0.02]} c={color} />
          <Bx p={[0, 1.32, 0]} s={[0.03, 0.4, 0.03]} c="#6b5a46" />
        </group>
      )}
      {children}
    </group>
  )
}

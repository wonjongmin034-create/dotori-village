import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Ball, Bx, Cone, Cyl, type TowerAnim } from './defModels'
import { Toon } from './wearKit'

// 수호 신수 — 직업 탑이 높은 단계가 되면 나타난다: 검 백호 · 활 주작 · 마법 청룡 · 투석기 현무 · 창 해치 · 대장간 불가사리
//  · 4단계: 탑 옆에 새끼 신수  · 5단계(각성): 자란 신수가 탑과 함께  · 6단계(전설): 탑 대신 커다란 신수가 제단 위에
const PI = Math.PI

// 둘레에 피어오르는 신령한 불꽃 (색은 신수마다)
function SpiritFlames({ color, r = 0.9, n = 7, h = 1.2 }: { color: string; r?: number; n?: number; h?: number }) {
  const g = useRef<THREE.Group>(null)
  useFrame((s) => {
    const t = s.clock.elapsedTime
    g.current?.children.forEach((c, i) => {
      const k = (t * 0.55 + i / n) % 1
      c.position.y = 0.1 + k * h
      c.scale.setScalar(0.12 * (1 - k) + 0.02)
      ;((c as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.85 * (1 - k)
    })
    if (g.current) g.current.rotation.y = t * 0.4
  })
  return (
    <group ref={g}>
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * r, 0.2, Math.sin(a) * r]}>
            <octahedronGeometry args={[1, 0]} />
            <meshBasicMaterial color={color} transparent depthWrite={false} />
          </mesh>
        )
      })}
    </group>
  )
}

/* ---------- 백호 (검사) : 흰 호랑이 — 큰 머리 · 볼 털 · 파란 눈 · 몸을 감싸는 가는 검은 줄무늬 · 굵은 다리와 큰 발 ----------
   age 0 = 새끼(머리 크고 다리 짧음) · 1 = 자란 백호 · 2 = 전설(어깨가 더 넓고 푸른 기운) */
const WHITE = '#f7f6f2'
const SHADE = '#dfe3ea'
const STRIPE = '#24242c'
type V = [number, number, number]

// 타원 몸통을 감싸는 줄무늬 한 줄 (몸통 중심 c, 반지름 r, 몸통 중심에서 앞뒤로 dz, 각도 a0~a1)
function Stripe({ c, r, dz, a0, a1, w = 0.019, tilt = 0 }: { c: V; r: V; dz: number; a0: number; a1: number; w?: number; tilt?: number }) {
  const k = Math.sqrt(Math.max(0, 1 - (dz / r[2]) ** 2))
  const rx = r[0] * k + 0.01
  const ry = r[1] * k + 0.01
  const avg = (rx + ry) / 2
  return (
    <group position={[c[0], c[1], c[2] + dz]} rotation={[tilt, 0, 0]} scale={[rx, ry, avg]}>
      <mesh rotation={[0, 0, a0]}>
        <torusGeometry args={[1, w / avg, 4, 14, a1 - a0]} />
        <Toon color={STRIPE} />
      </mesh>
    </group>
  )
}
// 머리(반지름 0.3 공)에 가로로 두르는 줄무늬 — 높이 dy, 앞쪽(90°) 기준 각도 a0~a1
function HeadStripe({ dy, a0, a1, w = 0.016 }: { dy: number; a0: number; a1: number; w?: number }) {
  const r = Math.sqrt(Math.max(0, 0.3 * 0.3 - dy * dy)) + 0.006
  return (
    <mesh position={[0, dy, 0]} rotation={[PI / 2, 0, a0]}>
      <torusGeometry args={[r, w, 4, 10, a1 - a0]} />
      <Toon color={STRIPE} />
    </mesh>
  )
}
// 다리 · 꼬리를 감는 고리
function Band({ p, r, w = 0.024, rot = [PI / 2, 0, 0] }: { p: V; r: number; w?: number; rot?: V }) {
  return (
    <mesh position={p} rotation={rot}>
      <torusGeometry args={[r, w, 4, 16]} />
      <Toon color={STRIPE} />
    </mesh>
  )
}

const D = PI / 180
export function Baekho({ glow = 0, age = 1 }: { glow?: number; age?: number }) {
  const head = useRef<THREE.Group>(null)
  const tail = useRef<THREE.Group>(null)
  const chest = useRef<THREE.Group>(null)
  useFrame((s) => {
    const t = s.clock.elapsedTime
    if (head.current) head.current.rotation.y = Math.sin(t * 0.7) * 0.22
    if (tail.current) tail.current.rotation.y = Math.sin(t * 1.8) * 0.4
    if (chest.current) chest.current.scale.y = 1 + Math.sin(t * 2) * 0.015
  })
  const cub = age === 0
  const legend = age >= 2
  const hs = cub ? 1.3 : legend ? 0.92 : 1 // 머리 크기 (새끼는 크게, 전설은 몸에 비해 작게 — 늠름하게)
  const leg = cub ? 0.75 : legend ? 1.12 : 1 // 다리 길이
  const sh = legend ? 1.15 : 1 // 어깨 넓이
  const y0 = 0.5 * leg // 다리 위 몸통 높이
  const TC: V = [0, y0 + 0.14, -0.08] // 몸통 타원 중심
  const TR: V = [0.38 * sh, 0.34, 0.62] // 몸통 타원 반지름
  const HC: V = [0, y0 + 0.17, -0.52] // 엉덩이
  const bodyStripes = cub ? [-0.28, -0.1] : [-0.4, -0.27, -0.14, -0.01]
  const legs: [number, number, boolean][] = [
    [-0.21 * sh, 0.36, true],
    [0.21 * sh, 0.36, true],
    [-0.2, -0.5, false],
    [0.2, -0.5, false],
  ]
  const tailN = cub ? 5 : 8
  return (
    <group>
      <group ref={chest}>
        {/* 몸통 · 어깨 · 엉덩이 · 배 */}
        <Ball p={TC} r={1} s={TR} c={WHITE} e="#ffffff" ei={0.32} />
        <Ball p={[0, y0 + 0.2, 0.32]} r={0.37 * sh} s={[1, 0.98, 0.85]} c={WHITE} e="#ffffff" ei={0.32} />
        <Ball p={HC} r={0.32} c={WHITE} e="#ffffff" ei={0.32} />
        <Ball p={[0, y0 - 0.02, -0.06]} r={1} s={[0.3 * sh, 0.2, 0.55]} c={SHADE} />
        {/* 몸을 감싸는 줄무늬: 등에서 옆구리로 */}
        {bodyStripes.map((dz, i) => {
          const j = (i * 37) % 11
          return (
            <group key={i}>
              <Stripe c={TC} r={TR} dz={dz} a0={(95 + j) * D} a1={(190 - j) * D} tilt={0.1} />
              <Stripe c={TC} r={TR} dz={dz} a0={(-10 + j) * D} a1={(85 - j) * D} tilt={0.1} />
            </group>
          )
        })}
        {/* 어깨 줄무늬 */}
        {(cub ? [0.02] : [-0.08, 0.06]).map((dz, i) => (
          <group key={i}>
            <Stripe c={[0, y0 + 0.2, 0.32]} r={[0.37 * sh, 0.36, 0.32]} dz={dz} a0={(110 + i * 8) * D} a1={(170 - i * 6) * D} tilt={0.15} />
            <Stripe c={[0, y0 + 0.2, 0.32]} r={[0.37 * sh, 0.36, 0.32]} dz={dz} a0={(10 + i * 6) * D} a1={(70 - i * 8) * D} tilt={0.15} />
          </group>
        ))}
        {/* 엉덩이 줄무늬 */}
        {!cub &&
          [-0.22, -0.06].map((dz, i) => (
            <group key={i}>
              <Stripe c={HC} r={[0.33, 0.33, 0.32]} dz={dz} a0={100 * D} a1={175 * D} tilt={-0.25} />
              <Stripe c={HC} r={[0.33, 0.33, 0.32]} dz={dz} a0={5 * D} a1={80 * D} tilt={-0.25} />
            </group>
          ))}
      </group>
      {/* 다리: 굵고 짧게, 큰 발 */}
      {legs.map(([x, z, front], i) => {
        const h = y0 + 0.08
        return (
          <group key={i}>
            {!front && <Ball p={[x, y0 + 0.08, z]} r={0.2} s={[0.75, 1.1, 1.05]} c={WHITE} e="#ffffff" ei={0.32} />}
            <Cyl p={[x, h / 2, z]} r={0.11} r2={0.14} h={h} c={WHITE} seg={10} e="#ffffff" ei={0.32} />
            <Ball p={[x, 0.06, z + 0.07]} r={0.15} s={[1.1, 0.62, 1.3]} c={WHITE} e="#ffffff" ei={0.32} />
            {[-0.06, 0, 0.06].map((dx) => (
              <Bx key={dx} p={[x + dx, 0.06, z + 0.25]} s={[0.012, 0.05, 0.02]} c="#c9cdd6" />
            ))}
            <Band p={[x, h * 0.55, z]} r={0.124} w={0.016} />
          </group>
        )
      })}
      {/* 머리 */}
      <group ref={head} position={[0, y0 + 0.5, 0.62]} scale={hs} rotation={[legend ? 0.12 : 0, 0, 0]}>
        <Ball p={[0, 0, 0]} r={0.3} s={[1.12, 1, 1]} c={WHITE} e="#ffffff" ei={0.32} />
        {/* 볼 털 (옆으로 풍성하게) */}
        {[-1, 1].map((sx) => (
          <group key={sx}>
            <Ball p={[sx * 0.25, -0.09, 0.02]} r={0.16} s={[1.05, 0.85, 0.85]} c={WHITE} e="#ffffff" ei={0.32} />
            <Cone p={[sx * 0.38, -0.12, 0]} r={0.06} h={0.14} c={WHITE} e="#ffffff" ei={0.32} rot={[0, 0, sx * -1.9]} seg={5} />
            <Cone p={[sx * 0.36, -0.2, 0.02]} r={0.05} h={0.12} c={WHITE} e="#ffffff" ei={0.32} rot={[0, 0, sx * -2.3]} seg={5} />
          </group>
        ))}
        {/* 주둥이 · 코 · 입 */}
        <Ball p={[0, -0.11, 0.23]} r={0.15} s={[1.3, 0.78, 0.95]} c="#ffffff" e="#ffffff" ei={0.35} />
        <Ball p={[0, -0.2, 0.2]} r={0.09} s={[1.2, 0.7, 0.9]} c={SHADE} />
        <Ball p={[0, -0.04, 0.355]} r={0.042} s={[1.35, 0.75, 0.75]} c="#e9909c" />
        <Bx p={[0, -0.11, 0.36]} s={[0.012, 0.07, 0.012]} c={STRIPE} />
        {/* 눈: 검은 테두리 + 파란 눈동자 */}
        {[-1, 1].map((sx) => (
          <group key={sx} position={[sx * 0.12, 0.05, 0.24]} rotation={[0, sx * 0.25, sx * -0.18]}>
            <Ball p={[0, 0, 0]} r={0.06} s={[1.35, 0.85, 0.6]} c={STRIPE} />
            <Ball p={[0, 0, 0.02]} r={0.048} s={[1.15, 0.85, 0.6]} c="#6ab8f0" e="#59b4ff" ei={0.35 + glow * 0.8} />
            <Ball p={[0, 0, 0.042]} r={0.02} s={[0.7, 1.2, 0.5]} c="#0f1a24" />
            <Ball p={[0.015, 0.018, 0.05]} r={0.008} c="#ffffff" e="#ffffff" ei={0.35} />
          </group>
        ))}
        {/* 둥근 귀: 안쪽 분홍빛, 뒤쪽 검게 */}
        {[-1, 1].map((sx) => (
          <group key={sx} position={[sx * 0.21, 0.24, -0.04]} rotation={[0, 0, sx * -0.35]}>
            <Ball p={[0, 0, 0]} r={0.09} s={[1, 1, 0.55]} c={WHITE} e="#ffffff" ei={0.32} />
            <Ball p={[0, -0.01, 0.025]} r={0.06} s={[1, 1, 0.4]} c="#d9c4c8" />
            <Ball p={[0, 0.01, -0.03]} r={0.085} s={[1, 1, 0.35]} c={STRIPE} />
          </group>
        ))}
        {/* 이마 줄무늬 (가로로 겹겹이) · 눈 위 · 볼 줄무늬 */}
        <group scale={[1.12, 1, 1]}>
          {[0.25, 0.2, 0.15].map((dy, i) => (
            <HeadStripe key={i} dy={dy} a0={(72 + i * 3) * D} a1={(108 - i * 3) * D} />
          ))}
          <HeadStripe dy={0.205} a0={93 * D} a1={97 * D} w={0.05} />
          {[-1, 1].map((sx) => (
            <group key={sx}>
              <HeadStripe dy={0.12} a0={(sx > 0 ? 55 : 105) * D} a1={(sx > 0 ? 75 : 125) * D} />
              <HeadStripe dy={-0.02} a0={(sx > 0 ? 18 : 132) * D} a1={(sx > 0 ? 45 : 162) * D} />
              <HeadStripe dy={-0.08} a0={(sx > 0 ? 12 : 140) * D} a1={(sx > 0 ? 40 : 168) * D} />
            </group>
          ))}
        </group>
      </group>
      {/* 꼬리: 길고 굵게, 검은 고리와 검은 끝 */}
      <group ref={tail} position={[0, y0 + 0.24, -0.8]}>
        {Array.from({ length: tailN }, (_, i) => {
          const a = i * 0.32
          const p: V = [0, -Math.sin(a) * 0.32 + i * 0.04, -i * 0.09 - Math.sin(a * 0.5) * 0.05]
          const last = i === tailN - 1
          const r = 0.075 - i * 0.003
          return (
            <group key={i}>
              <Ball p={p} r={r} c={last ? STRIPE : WHITE} />
              {!last && i % 2 === 1 && <Band p={p} r={r} w={0.02} rot={[0.6 + i * 0.1, 0, 0]} />}
            </group>
          )
        })}
      </group>
      {glow > 0 && <SpiritFlames color="#5cb8ff" r={legend ? 0.95 : 0.75} n={legend ? 10 : 7} h={legend ? 1.6 : 1.1} />}
      {legend && (
        <mesh position={[0, 0.03, 0]} rotation={[-PI / 2, 0, 0]}>
          <circleGeometry args={[1.0, 32]} />
          <meshBasicMaterial color="#8fd0ff" transparent opacity={0.28} depthWrite={false} />
        </mesh>
      )}
    </group>
  )
}

/* ---------- 주작 (궁수) : 붉은 불새, 금빛 볏, 길게 늘어진 불꽃 꼬리 ---------- */
export function Jujak({ glow = 0 }: { glow?: number; age?: number }) {
  const wl = useRef<THREE.Group>(null)
  const wr = useRef<THREE.Group>(null)
  const body = useRef<THREE.Group>(null)
  useFrame((s) => {
    const t = s.clock.elapsedTime
    const a = Math.sin(t * 3.2) * 0.35
    if (wl.current) wl.current.rotation.z = 0.35 + a
    if (wr.current) wr.current.rotation.z = -0.35 - a
    if (body.current) body.current.position.y = Math.sin(t * 1.6) * 0.06
  })
  const feather = (c: string, tip: string) => (
    <>
      <Ball p={[0.45, 0, 0]} r={0.3} s={[1.7, 0.18, 0.75]} c={c} />
      <Ball p={[0.78, -0.02, -0.08]} r={0.22} s={[1.6, 0.16, 0.7]} c="#ff9a3c" />
      <Ball p={[1.05, -0.04, -0.14]} r={0.15} s={[1.5, 0.14, 0.65]} c={tip} e={tip} ei={0.4 + glow * 0.4} />
    </>
  )
  return (
    <group ref={body}>
      {/* 몸 */}
      <Ball p={[0, 0.9, 0]} r={0.3} s={[0.95, 1.1, 1.05]} c="#d8352a" />
      <Ball p={[0, 0.84, 0.12]} r={0.22} s={[0.9, 1.05, 0.8]} c="#ffb347" />
      {/* 머리 */}
      <Ball p={[0, 1.32, 0.16]} r={0.19} c="#e0402f" />
      <Cone p={[0, 1.29, 0.38]} r={0.06} h={0.18} c="#f2c14e" rot={[PI / 2, 0, 0]} seg={6} />
      {[-1, 1].map((sx) => (
        <group key={sx}>
          <Ball p={[sx * 0.09, 1.36, 0.31]} r={0.04} c="#fff3c4" e="#ffcf4a" ei={0.6 + glow} />
          <Ball p={[sx * 0.095, 1.36, 0.345]} r={0.018} c="#2a1408" />
        </group>
      ))}
      {/* 금빛 볏 */}
      {[-0.25, 0, 0.25].map((a, i) => (
        <Cone key={i} p={[Math.sin(a) * 0.08, 1.55 - Math.abs(a) * 0.12, 0.08 - i * 0.04]} r={0.04} h={0.26} c="#f2c14e" rot={[-0.35, 0, a]} e="#f2c14e" ei={0.3} seg={5} />
      ))}
      {/* 날개 */}
      <group ref={wl} position={[0.2, 1.0, -0.02]}>
        {feather('#c92a22', '#ffe066')}
      </group>
      <group ref={wr} position={[-0.2, 1.0, -0.02]} scale={[-1, 1, 1]}>
        {feather('#c92a22', '#ffe066')}
      </group>
      {/* 불꽃 꼬리 깃 */}
      {[-0.35, 0, 0.35].map((a, i) => (
        <group key={i} position={[0, 0.72, -0.25]} rotation={[0.9, a, 0]}>
          <Cone p={[0, -0.45, 0]} r={0.07} h={0.9} c="#e8452f" rot={[PI, 0, 0]} seg={6} />
          <Ball p={[0, -0.92, 0]} r={0.1} s={[1, 1.4, 1]} c="#ffd34a" e="#ff8a2a" ei={0.6 + glow * 0.4} />
        </group>
      ))}
      {/* 발 */}
      {[-1, 1].map((sx) => (
        <Cyl key={sx} p={[sx * 0.1, 0.55, 0.05]} r={0.03} h={0.22} c="#f2a03c" seg={6} />
      ))}
      {glow > 0 && <SpiritFlames color="#ff7a2a" r={0.7} h={1.5} />}
    </group>
  )
}

/* ---------- 청룡 (마법) : 구름 위를 굽이치는 푸른 용, 금빛 뿔 · 수염 · 여의주 ---------- */
const DRAGON = '#2f8fd0'
export function Cheongryong({ glow = 0 }: { glow?: number; age?: number }) {
  const body = useRef<THREE.Group>(null)
  const orb = useRef<THREE.Mesh>(null)
  const N = 11
  useFrame((s) => {
    const t = s.clock.elapsedTime
    body.current?.children.forEach((c, i) => {
      const k = (i + 1) / N
      c.position.set(Math.sin(t * 2 - i * 0.6) * 0.22 * k, 0.95 + Math.sin(t * 2.4 - i * 0.7) * 0.16 * k, -0.12 - i * 0.12)
    })
    if (orb.current) orb.current.scale.setScalar(1 + Math.sin(t * 4) * 0.12)
  })
  return (
    <group>
      {/* 굽이치는 몸: 마디마다 등지느러미 */}
      <group ref={body}>
        {Array.from({ length: N }, (_, i) => {
          const r = 0.17 - i * 0.01
          return (
            <group key={i}>
              <Ball p={[0, 0, 0]} r={r} c={i % 2 ? '#3aa3dc' : DRAGON} />
              <Ball p={[0, -r * 0.45, 0.02]} r={r * 0.7} s={[1, 0.6, 1]} c="#f2e6b8" />
              <Cone p={[0, r + 0.04, 0]} r={0.035} h={0.1} c="#7fe3ff" rot={[-0.4, 0, 0]} seg={4} />
              {i === N - 1 && <Cone p={[0, 0, -0.14]} r={0.08} h={0.22} c="#7fe3ff" rot={[-PI / 2, 0, 0]} seg={5} e="#7fe3ff" ei={0.5} />}
            </group>
          )
        })}
      </group>
      {/* 앞발 */}
      {[-1, 1].map((sx) => (
        <group key={sx} position={[sx * 0.13, 0.78, 0.0]} rotation={[0.5, 0, sx * 0.3]}>
          <Cyl p={[0, -0.08, 0]} r={0.035} h={0.18} c={DRAGON} seg={6} />
          {[-1, 0, 1].map((k) => (
            <Cone key={k} p={[k * 0.025, -0.19, 0.02]} r={0.015} h={0.06} c="#f2c14e" rot={[PI, 0, 0]} seg={4} />
          ))}
        </group>
      ))}
      {/* 머리 */}
      <group position={[0, 1.08, 0.16]}>
        <Ball p={[0, 0, 0]} r={0.2} s={[1, 0.9, 1.2]} c={DRAGON} />
        <Ball p={[0, -0.04, 0.2]} r={0.13} s={[1.05, 0.75, 1.25]} c="#3aa3dc" />
        <Ball p={[0, -0.1, 0.2]} r={0.1} s={[1, 0.5, 1.2]} c="#f2e6b8" />
        {[-1, 1].map((sx) => (
          <group key={sx}>
            <Ball p={[sx * 0.05, 0.0, 0.36]} r={0.02} c="#14324a" />
            <Ball p={[sx * 0.1, 0.07, 0.13]} r={0.045} c="#ffe066" e="#ffd23c" ei={0.6 + glow} />
            <Ball p={[sx * 0.11, 0.07, 0.165]} r={0.018} c="#1a1a1a" />
            {/* 금빛 사슴뿔 */}
            <group position={[sx * 0.09, 0.15, -0.06]} rotation={[-0.7, 0, sx * -0.4]}>
              <Cyl p={[0, 0.12, 0]} r={0.022} h={0.24} c="#f2c14e" seg={5} />
              <Cone p={[sx * 0.04, 0.18, 0.03]} r={0.015} h={0.1} c="#f2c14e" rot={[0.6, 0, sx * -0.6]} seg={4} />
            </group>
            {/* 수염 */}
            <Cyl p={[sx * 0.18, -0.06, 0.3]} r={0.008} h={0.32} c="#e8f6ff" seg={4} rot={[0.4, 0, sx * 1.1]} />
            {/* 갈기 */}
            <Cone p={[sx * 0.15, 0.02, -0.12]} r={0.05} h={0.16} c="#7fe3ff" rot={[-1.2, 0, sx * -0.6]} seg={4} />
          </group>
        ))}
      </group>
      {/* 여의주 */}
      <mesh ref={orb} position={[0, 0.82, 0.42]}>
        <sphereGeometry args={[0.09, 14, 10]} />
        <meshBasicMaterial color="#e0fbff" />
      </mesh>
      {glow > 0 && <SpiritFlames color="#7fe3ff" r={0.7} h={1.5} />}
    </group>
  )
}

/* ---------- 현무 (투석기) : 검은 거북 등딱지 + 몸을 감은 뱀 ---------- */
export function Hyeonmu({ glow = 0 }: { glow?: number; age?: number }) {
  const snake = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)
  useFrame((s) => {
    const t = s.clock.elapsedTime
    if (snake.current) snake.current.rotation.z = Math.sin(t * 1.6) * 0.18
    if (head.current) head.current.rotation.y = Math.sin(t * 0.8) * 0.3
  })
  const plates: [number, number, number, number][] = [[0, 0.9, 0, 0]]
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * PI * 2
    plates.push([Math.cos(a) * 0.32, 0.8, Math.sin(a) * 0.36, a])
  }
  return (
    <group>
      {/* 다리 */}
      {(
        [
          [-0.38, 0.38],
          [0.38, 0.38],
          [-0.38, -0.38],
          [0.38, -0.38],
        ] as [number, number][]
      ).map(([x, z], i) => (
        <group key={i}>
          <Cyl p={[x, 0.17, z]} r={0.12} r2={0.13} h={0.34} c="#4a6058" seg={8} />
          <Ball p={[x, 0.04, z + 0.04]} r={0.13} s={[1.1, 0.5, 1.2]} c="#56706a" />
        </group>
      ))}
      {/* 등딱지 */}
      <Ball p={[0, 0.5, 0]} r={0.58} s={[1.05, 0.62, 1.2]} c="#3f5a50" />
      <Cyl p={[0, 0.42, 0]} r={0.62} h={0.1} c="#6b8a60" seg={20} />
      {plates.map(([x, y, z, a], i) => (
        <group key={i} position={[x, y, z]} rotation={i ? [Math.sin(a) * 0.55, 0, -Math.cos(a) * 0.55] : [0, 0, 0]}>
          <Cyl p={[0, 0, 0]} r={i ? 0.15 : 0.18} h={0.06} c="#6fa284" seg={6} />
          <Cyl p={[0, 0.02, 0]} r={i ? 0.1 : 0.12} h={0.04} c="#c9a54a" seg={6} e="#c9a54a" ei={0.2 + glow * 0.3} />
        </group>
      ))}
      {/* 거북 머리 */}
      <group ref={head} position={[0, 0.42, 0.72]}>
        <Ball p={[0, 0, 0]} r={0.17} s={[1, 0.9, 1.15]} c="#6f8f6a" />
        {[-1, 1].map((sx) => (
          <group key={sx}>
            <Ball p={[sx * 0.08, 0.05, 0.14]} r={0.035} c="#fff7d6" e="#9cffd4" ei={0.3 + glow} />
            <Ball p={[sx * 0.085, 0.05, 0.17]} r={0.015} c="#102018" />
          </group>
        ))}
        <Bx p={[0, -0.05, 0.19]} s={[0.12, 0.012, 0.01]} c="#2c3b37" />
      </group>
      {/* 몸을 감은 뱀 */}
      <group ref={snake}>
        <mesh position={[0, 0.62, 0]} rotation={[PI / 2, 0, 0.6]} scale={[1.08, 1.22, 1]}>
          <torusGeometry args={[0.56, 0.06, 6, 28, PI * 1.55]} />
          <Toon color="#2a6a58" />
        </mesh>
        {/* 고개를 든 뱀 */}
        {Array.from({ length: 9 }, (_, i) => (
          <Ball key={i} p={[-0.46 + i * 0.03, 0.68 + i * 0.075, 0.46 - i * 0.018]} r={0.062 - i * 0.002} c={i % 2 ? '#2a5e50' : '#1f4a3f'} />
        ))}
        <group position={[-0.2, 1.36, 0.33]}>
          <Ball p={[0, 0, 0]} r={0.09} s={[1, 0.8, 1.3]} c="#2a5e50" />
          {[-1, 1].map((sx) => (
            <Ball key={sx} p={[sx * 0.05, 0.03, 0.08]} r={0.022} c="#ffd84a" e="#ffd84a" ei={0.5 + glow} />
          ))}
          <Bx p={[0, -0.02, 0.15]} s={[0.012, 0.008, 0.08]} c="#e04a4a" />
        </group>
      </group>
      {glow > 0 && <SpiritFlames color="#6fe0b0" r={0.85} />}
    </group>
  )
}

/* ---------- 해치 (창) : 금빛 사자 몸, 푸른 곱슬 갈기, 이마의 외뿔 ---------- */
const HAE = '#f0c75e'
const MANE = '#2f9e8f'
export function Haechi({ glow = 0 }: { glow?: number; age?: number }) {
  const head = useRef<THREE.Group>(null)
  const tail = useRef<THREE.Group>(null)
  useFrame((s) => {
    const t = s.clock.elapsedTime
    if (head.current) head.current.rotation.z = Math.sin(t * 1.2) * 0.08
    if (tail.current) tail.current.rotation.z = Math.sin(t * 2) * 0.3
  })
  return (
    <group>
      <Ball p={[0, 0.6, -0.05]} r={0.38} s={[0.9, 0.85, 1.3]} c={HAE} />
      {/* 몸의 둥근 비늘 무늬 */}
      {[-1, 1].map((sx) =>
        [-0.25, 0, 0.22].map((z, i) => <Ball key={`${sx}${i}`} p={[sx * 0.31, 0.62 + (i % 2) * 0.08, z]} r={0.07} s={[0.4, 1, 1]} c="#e0a840" />),
      )}
      {(
        [
          [-0.2, 0.32],
          [0.2, 0.32],
          [-0.2, -0.4],
          [0.2, -0.4],
        ] as [number, number][]
      ).map(([x, z], i) => (
        <group key={i}>
          <Cyl p={[x, 0.22, z]} r={0.1} r2={0.12} h={0.44} c={HAE} seg={8} />
          <Ball p={[x, 0.05, z + 0.05]} r={0.12} s={[1.1, 0.6, 1.2]} c="#f6d88a" />
          <Ball p={[x, 0.3, z - 0.06]} r={0.06} c={MANE} />
        </group>
      ))}
      {/* 꼬리 (위로 말린 갈기 끝) */}
      <group ref={tail} position={[0, 0.8, -0.55]}>
        <Cyl p={[0, 0.12, -0.05]} r={0.04} h={0.28} c={HAE} seg={6} rot={[-0.5, 0, 0]} />
        {[0, 1, 2].map((i) => (
          <Ball key={i} p={[(i - 1) * 0.07, 0.3 + (i % 2) * 0.05, -0.12]} r={0.08} c={MANE} />
        ))}
      </group>
      {/* 머리 + 곱슬 갈기 */}
      <group ref={head} position={[0, 1.0, 0.5]}>
        {Array.from({ length: 10 }, (_, i) => {
          const a = (i / 10) * PI * 2
          return <Ball key={i} p={[Math.cos(a) * 0.27, Math.sin(a) * 0.25, -0.06]} r={0.11} c={i % 2 ? MANE : '#38b3a2'} />
        })}
        <Ball p={[0, 0, 0]} r={0.25} s={[1.05, 0.95, 0.95]} c={HAE} />
        <Ball p={[0, -0.08, 0.2]} r={0.12} s={[1.4, 0.8, 0.8]} c="#f6d88a" />
        <Ball p={[0, -0.02, 0.29]} r={0.05} s={[1.4, 0.9, 0.8]} c="#8a4a2a" />
        <Bx p={[0, -0.14, 0.27]} s={[0.16, 0.02, 0.02]} c="#8a4a2a" />
        {[-1, 1].map((sx) => (
          <group key={sx}>
            <Ball p={[sx * 0.1, 0.06, 0.2]} r={0.055} c="#ffffff" />
            <Ball p={[sx * 0.1, 0.06, 0.245]} r={0.03} c="#3a2410" e="#ffd84a" ei={glow * 0.6} />
            <Bx p={[sx * 0.1, 0.13, 0.22]} s={[0.1, 0.025, 0.02]} c={MANE} rot={[0, 0, sx * 0.3]} />
            <Bx p={[sx * 0.045, -0.17, 0.265]} s={[0.025, 0.03, 0.01]} c="#ffffff" />
          </group>
        ))}
        {/* 외뿔 */}
        <Cone p={[0, 0.3, 0.08]} r={0.05} h={0.24} c="#ffd84a" rot={[0.35, 0, 0]} e="#ffd84a" ei={0.4 + glow * 0.5} seg={6} />
      </group>
      {glow > 0 && <SpiritFlames color="#ffd84a" r={0.75} />}
    </group>
  )
}

/* ---------- 불가사리 (대장간) : 쇠를 먹는 전설 동물 — 쇠 갑옷 몸, 코끼리 코, 등의 쇠가시, 빛나는 쇳물 ---------- */
const IRON = '#828fa0'
export function Bulgasari({ glow = 0 }: { glow?: number; age?: number }) {
  const trunk = useRef<THREE.Group>(null)
  useFrame((s) => {
    if (trunk.current) trunk.current.rotation.x = Math.sin(s.clock.elapsedTime * 1.5) * 0.25
  })
  return (
    <group>
      {(
        [
          [-0.25, 0.3],
          [0.25, 0.3],
          [-0.25, -0.35],
          [0.25, -0.35],
        ] as [number, number][]
      ).map(([x, z], i) => (
        <group key={i}>
          <Cyl p={[x, 0.2, z]} r={0.13} r2={0.15} h={0.4} c="#5d6876" seg={8} />
          <Ball p={[x, 0.05, z + 0.05]} r={0.15} s={[1.1, 0.55, 1.2]} c="#4d5764" />
          {[-0.06, 0, 0.06].map((dx) => (
            <Cone key={dx} p={[x + dx, 0.05, z + 0.2]} r={0.02} h={0.06} c="#e8ecf2" rot={[PI / 2, 0, 0]} seg={4} />
          ))}
        </group>
      ))}
      {/* 몸 + 쇠 띠 + 빛나는 쇳물 금 */}
      <Ball p={[0, 0.66, -0.02]} r={0.45} s={[1, 0.92, 1.15]} c={IRON} />
      {[-0.22, 0.02, 0.26].map((z, i) => (
        <Cyl key={i} p={[0, 0.68, z]} r={0.44 - Math.abs(z) * 0.3} h={0.05} c="#8d99a8" seg={16} rot={[PI / 2, 0, 0]} />
      ))}
      {[-1, 1].map((sx) => (
        <group key={sx}>
          <Bx p={[sx * 0.42, 0.68, -0.1]} s={[0.03, 0.22, 0.03]} c="#ff8a2a" e="#ff8a2a" ei={0.7 + glow * 0.5} rot={[0.3, 0, 0]} />
          <Bx p={[sx * 0.4, 0.6, 0.15]} s={[0.03, 0.16, 0.03]} c="#ff8a2a" e="#ff8a2a" ei={0.7 + glow * 0.5} rot={[-0.4, 0, 0]} />
        </group>
      ))}
      {/* 등의 쇠가시 */}
      {[-0.3, -0.12, 0.06, 0.24].map((z, i) => (
        <Cone key={i} p={[0, 1.08 - Math.abs(z) * 0.25, z]} r={0.07} h={0.2} c="#b9c3cf" seg={4} />
      ))}
      {/* 소 꼬리 */}
      <Cyl p={[0, 0.7, -0.58]} r={0.03} h={0.3} c={IRON} seg={6} rot={[0.9, 0, 0]} />
      <Ball p={[0, 0.58, -0.72]} r={0.07} c="#3e4652" />
      {/* 머리: 코뿔소 눈 · 작은 엄니 · 코끼리 코 */}
      <group position={[0, 0.88, 0.5]}>
        <Ball p={[0, 0, 0]} r={0.26} s={[1.05, 0.95, 1]} c={IRON} />
        {[-1, 1].map((sx) => (
          <group key={sx}>
            <Ball p={[sx * 0.22, 0.16, -0.04]} r={0.08} s={[1, 1, 0.5]} c="#5d6876" />
            <Ball p={[sx * 0.1, 0.07, 0.21]} r={0.04} c="#ffd08a" e="#ff8a2a" ei={0.6 + glow} />
            <Ball p={[sx * 0.1, 0.07, 0.245]} r={0.016} c="#20140a" />
            <Cone p={[sx * 0.09, -0.12, 0.2]} r={0.025} h={0.1} c="#f4efe2" rot={[0.5, 0, 0]} seg={5} />
          </group>
        ))}
        <group ref={trunk} position={[0, -0.04, 0.22]}>
          {[0, 1, 2, 3].map((i) => (
            <Ball key={i} p={[0, -i * 0.07, i * 0.06]} r={0.075 - i * 0.008} c={i % 2 ? '#7d8997' : IRON} />
          ))}
        </group>
      </group>
      {glow > 0 && <SpiritFlames color="#ff9a3c" r={0.8} />}
    </group>
  )
}

/* ---------- 탑 종류 → 신수, 그리고 게임 속 배치 (과녁 쪽으로 고개 · 쏠 때 움찔) ---------- */
export function GuardianBeast({ kind, age, glow }: { kind: string; age: number; glow: number }) {
  switch (kind) {
    case 'sword':
      return <Baekho age={age} glow={glow} />
    case 'bow':
      return <Jujak age={age} glow={glow} />
    case 'staff':
      return (
        <group scale={1.25}>
          <Cheongryong age={age} glow={glow} />
        </group>
      )
    case 'axe':
      return <Hyeonmu age={age} glow={glow} />
    case 'spear':
      return <Haechi age={age} glow={glow} />
    default:
      return <Bulgasari age={age} glow={glow} />
  }
}

export function BeastMount({ kind, age, anim, position, scale }: { kind: string; age: number; anim: TowerAnim; position: [number, number, number]; scale: number }) {
  const g = useRef<THREE.Group>(null)
  useFrame(() => {
    if (!g.current) return
    let d = anim.aim - g.current.rotation.y
    d = Math.atan2(Math.sin(d), Math.cos(d))
    g.current.rotation.y += d * 0.08
    const k = Math.max(0, 1 - (performance.now() - anim.fireAt) / 260)
    g.current.scale.setScalar(scale * (1 + k * 0.12))
  })
  return (
    <group position={position}>
      <group ref={g} scale={scale}>
        <GuardianBeast kind={kind} age={age} glow={age >= 2 ? 1 : age >= 1 ? 0.3 : 0} />
      </group>
    </group>
  )
}

/* ---------- 전설 제단: 탑 대신 신수가 올라서는 금빛 받침 ---------- */
export function BeastAltar({ color }: { color: string }) {
  const ring = useRef<THREE.Mesh>(null)
  useFrame((s) => {
    if (ring.current) ring.current.rotation.z = s.clock.elapsedTime * 0.5
  })
  return (
    <group>
      <Cyl p={[0, 0.12, 0]} r={1.05} r2={0.95} h={0.24} c="#d9d2c2" seg={6} />
      <Cyl p={[0, 0.3, 0]} r={0.85} r2={0.8} h={0.14} c="#f2c14e" seg={6} e="#f2c14e" ei={0.25} />
      <mesh ref={ring} position={[0, 0.39, 0]} rotation={[-PI / 2, 0, 0]}>
        <ringGeometry args={[0.6, 0.78, 6]} />
        <meshBasicMaterial color={color} transparent opacity={0.8} />
      </mesh>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * PI * 2 + PI / 6
        return <Cone key={i} p={[Math.cos(a) * 0.98, 0.42, Math.sin(a) * 0.98]} r={0.07} h={0.2} c="#f2c14e" seg={4} e="#f2c14e" ei={0.4} />
      })}
    </group>
  )
}

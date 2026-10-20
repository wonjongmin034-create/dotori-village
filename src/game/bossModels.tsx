import { useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Toon, Shaped } from './wearKit'
import { bossFx, clamp01, nowSec } from './bossFx'
import { toonGradient } from './toon'

// 보스 3마리의 모양 — 툰 재질로 직접 만든 모델 (불러오는 파일 없음).
// 모두 앞(+z)을 바라보고, 발이 땅(y=0)에 닿는다. 맞으면 번쩍이며 움찔하고, 오답이 나오면 공격하고, 지면 무너진다.

type V3 = [number, number, number]

/* ---------- 작은 부품 ---------- */
function Ball({ p, r, s = [1, 1, 1], c, e, ei, rot }: { p: V3; r: number; s?: V3; c: string; e?: string; ei?: number; rot?: V3 }) {
  return (
    <mesh position={p} scale={s} rotation={rot}>
      <sphereGeometry args={[r, 18, 13]} />
      <Toon color={c} emissive={e} ei={ei} />
    </mesh>
  )
}
function Cyl({ p, r, h, r2, c, rot, e, ei }: { p: V3; r: number; h: number; r2?: number; c: string; rot?: V3; e?: string; ei?: number }) {
  return (
    <mesh position={p} rotation={rot}>
      <cylinderGeometry args={[r2 ?? r, r, h, 16]} />
      <Toon color={c} emissive={e} ei={ei} />
    </mesh>
  )
}
function Bx({ p, s, c, rot, e, ei }: { p: V3; s: V3; c: string; rot?: V3; e?: string; ei?: number }) {
  return (
    <mesh position={p} rotation={rot}>
      <boxGeometry args={s} />
      <Toon color={c} emissive={e} ei={ei} />
    </mesh>
  )
}
function Cone({ p, r, h, c, rot, e, ei }: { p: V3; r: number; h: number; c: string; rot?: V3; e?: string; ei?: number }) {
  return (
    <mesh position={p} rotation={rot}>
      <coneGeometry args={[r, h, 12]} />
      <Toon color={c} emissive={e} ei={ei} />
    </mesh>
  )
}
function Ring({ p, r, t, c, rot, e, ei }: { p: V3; r: number; t: number; c: string; rot?: V3; e?: string; ei?: number }) {
  return (
    <mesh position={p} rotation={rot}>
      <torusGeometry args={[r, t, 10, 28]} />
      <Toon color={c} emissive={e} ei={ei} />
    </mesh>
  )
}

/* ---------- 글자 판 (캔버스에 그려서 붙인다) ---------- */
const labelCache = new Map<string, THREE.CanvasTexture>()
export function labelTex(text: string, fg: string, bg = 'rgba(0,0,0,0)') {
  const key = `${text}|${fg}|${bg}`
  let t = labelCache.get(key)
  if (!t) {
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const g = c.getContext('2d')!
    g.fillStyle = bg
    g.fillRect(0, 0, 128, 128)
    g.fillStyle = fg
    g.font = '900 86px system-ui, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif'
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillText(text, 64, 70)
    t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    labelCache.set(key, t)
  }
  return t
}

// 보스 둘레를 도는 글자 판들
function Orbiters({ items, r, y, size, speed, tile, fg, glow }: { items: string[]; r: number; y: number; size: number; speed: number; tile: string; fg: string; glow: string }) {
  const g = useRef<THREE.Group>(null)
  const tiles = useRef<(THREE.Group | null)[]>([])
  useFrame(() => {
    const t = nowSec()
    if (g.current) g.current.rotation.y = t * speed
    tiles.current.forEach((m, i) => {
      if (m) m.position.y = Math.sin(t * 1.6 + i * 1.7) * 0.22
    })
  })
  return (
    <group ref={g} position={[0, y, 0]}>
      {items.map((it, i) => {
        const a = (i / items.length) * Math.PI * 2
        return (
          <group key={i} position={[Math.sin(a) * r, 0, Math.cos(a) * r]} rotation={[0, a, 0]}>
            <group ref={(el) => void (tiles.current[i] = el)}>
              <mesh>
                <boxGeometry args={[size, size, size * 0.14]} />
                <Toon color={tile} emissive={glow} ei={0.35} />
              </mesh>
              <mesh position={[0, 0, size * 0.075]}>
                <planeGeometry args={[size * 0.86, size * 0.86]} />
                <meshBasicMaterial map={labelTex(it, fg)} transparent toneMapped={false} />
              </mesh>
              <mesh position={[0, 0, -size * 0.075]} rotation={[0, Math.PI, 0]}>
                <planeGeometry args={[size * 0.86, size * 0.86]} />
                <meshBasicMaterial map={labelTex(it, fg)} transparent toneMapped={false} />
              </mesh>
            </group>
          </group>
        )
      })}
    </group>
  )
}

/* ---------- 공통: 등장·맞았을 때 번쩍임·쓰러짐 ---------- */
const WHITE = new THREE.Color('#ffffff')
const easeOutBack = (x: number) => {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2)
}

function Shell({ children }: { children: ReactNode }) {
  const root = useRef<THREE.Group>(null)
  const inner = useRef<THREE.Group>(null)
  const mats = useRef<{ m: THREE.MeshToonMaterial; e: THREE.Color; i: number }[]>([])

  useLayoutEffect(() => {
    const list: { m: THREE.MeshToonMaterial; e: THREE.Color; i: number }[] = []
    inner.current?.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.Material | undefined
      if (m && m.type === 'MeshToonMaterial') {
        const t = m as THREE.MeshToonMaterial
        list.push({ m: t, e: t.emissive.clone(), i: t.emissiveIntensity })
      }
    })
    mats.current = list
  }, [])

  useFrame(() => {
    const g = root.current
    const s = inner.current
    if (!g || !s) return
    const now = nowSec()
    const intro = easeOutBack(clamp01((now - bossFx.introAt) / 0.9))
    const hit = clamp01((now - bossFx.hitAt) / 0.5)
    const dead = bossFx.deadAt > 0 ? clamp01((now - bossFx.deadAt) / 1.7) : 0
    const atk = clamp01((now - bossFx.atkAt) / 0.95)
    const sc = Math.max(0.0001, intro) * (1 - dead * dead)

    // 맞으면 뒤로 움찔 + 찌그러짐, 공격할 때는 앞으로 덮친다
    const recoil = Math.sin(hit * Math.PI) * (1 - hit) * 1.6
    const lunge = Math.sin(atk * Math.PI) * 1.5
    g.position.z = -recoil * 0.45 + lunge
    g.position.y = (1 - clamp01((now - bossFx.introAt) / 0.5)) * -1.2 - dead * 1.4 + (dead > 0 ? 0 : 0)
    g.rotation.x = -dead * 0.7
    g.rotation.y = dead * 2.4
    s.scale.set(sc * (1 + recoil * 0.05), sc * (1 - recoil * 0.1), sc * (1 + recoil * 0.05))

    // 맞은 순간 하얗게 번쩍
    const f = bossFx.hitAt > 0 ? Math.pow(1 - hit, 2) : 0
    for (const m of mats.current) {
      m.m.emissive.copy(m.e).lerp(WHITE, f)
      m.m.emissiveIntensity = m.i + f * 0.9
    }
  })

  return (
    <group ref={root}>
      <group ref={inner}>{children}</group>
    </group>
  )
}

const ss = (x: number) => Math.sin(x)

/* ---------- 박쥐 날개 (막 + 뼈대). side = +1 오른쪽, -1 왼쪽 ---------- */
const WING_PTS: [number, number][] = [
  [0, 0],
  [0.5, 0.75],
  [0.7, 0.5],
  [0.9, 0.62],
  [1.0, 0.28],
  [1.25, 0.3],
  [1.1, -0.1],
  [1.3, -0.35],
  [0.8, -0.2],
  [0.6, -0.6],
  [0.4, -0.25],
]
let wingGeo: THREE.ExtrudeGeometry | null = null
function wingGeometry() {
  if (!wingGeo) {
    const sh = new THREE.Shape()
    WING_PTS.forEach(([x, y], i) => (i === 0 ? sh.moveTo(x, y) : sh.lineTo(x, y)))
    sh.closePath()
    wingGeo = new THREE.ExtrudeGeometry(sh, { depth: 0.03, bevelEnabled: false })
  }
  return wingGeo
}
function Bone({ a, b, r, c }: { a: [number, number]; b: [number, number]; r: number; c: string }) {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const len = Math.hypot(dx, dy)
  return (
    <mesh position={[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0.02]} rotation={[0, 0, Math.atan2(dy, dx) - Math.PI / 2]}>
      <cylinderGeometry args={[r * 0.7, r, len, 8]} />
      <Toon color={c} />
    </mesh>
  )
}
function Wing({ side, size, membrane, bone }: { side: 1 | -1; size: number; membrane: string; bone: string }) {
  const S = size
  const P = (i: number): [number, number] => [WING_PTS[i][0] * S * side, WING_PTS[i][1] * S]
  return (
    <group>
      <mesh geometry={wingGeometry()} scale={[S * side, S, 1]}>
        <meshToonMaterial gradientMap={toonGradient} color={membrane} side={THREE.DoubleSide} />
      </mesh>
      <Bone a={P(0)} b={P(1)} r={0.1} c={bone} />
      <Bone a={P(1)} b={P(5)} r={0.07} c={bone} />
      <Bone a={P(1)} b={P(7)} r={0.06} c={bone} />
      <Bone a={P(1)} b={P(9)} r={0.06} c={bone} />
    </group>
  )
}

/* ============================================================
   1단계: 셈돌 골렘 — 돌로 된 거인. 둘레에 + − × ÷ 판이 돈다.
   ============================================================ */
function Golem() {
  const armR = useRef<THREE.Group>(null)
  const armL = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)
  const torso = useRef<THREE.Group>(null)
  const runes = useRef<THREE.Group>(null)

  useFrame(() => {
    const t = nowSec()
    const atk = clamp01((t - bossFx.atkAt) / 0.95)
    const hit = clamp01((t - bossFx.hitAt) / 0.5)
    const sway = ss(t * 1.3)
    if (torso.current) {
      torso.current.position.y = 2.7 + ss(t * 1.7) * 0.05
      torso.current.rotation.z = sway * 0.025 + Math.sin(hit * Math.PI) * 0.06
    }
    if (head.current) {
      head.current.rotation.y = ss(t * 0.7) * 0.12
      head.current.rotation.x = Math.sin(hit * Math.PI) * 0.3 - (atk > 0 && atk < 1 ? Math.sin(atk * Math.PI) * 0.25 : 0)
    }
    // 오른팔: 번쩍 들었다가 내리친다
    let ar = ss(t * 1.3 + 1) * 0.07
    if (atk > 0 && atk < 1) {
      if (atk < 0.35) ar = -2.5 * (atk / 0.35)
      else if (atk < 0.5) ar = -2.5 + 3.1 * ((atk - 0.35) / 0.15)
      else ar = 0.6 * (1 - (atk - 0.5) / 0.5)
    }
    if (armR.current) armR.current.rotation.x = ar
    if (armL.current) armL.current.rotation.x = ss(t * 1.3) * 0.07 + (atk > 0 && atk < 0.5 ? -0.5 * Math.sin(atk * Math.PI * 2) : 0)
    if (runes.current) runes.current.scale.setScalar(1 + ss(t * 3) * 0.06)
  })

  const stone = '#a39a8a'
  const dark = '#7a7266'
  const light = '#c2b9a6'
  const moss = '#6fa04a'
  const glow = '#ffb347'

  const Arm = ({ side }: { side: 1 | -1 }) => (
    <>
      <Ball p={[0, 0, 0]} r={0.62} c={stone} />
      <Cyl p={[0, -0.85, 0]} r={0.5} h={1.3} c={stone} />
      <Ball p={[0, -1.55, 0]} r={0.5} c={dark} />
      <Cyl p={[0, -2.2, 0.05]} r={0.62} r2={0.52} h={1.2} c={stone} />
      <Ball p={[0, -3.0, 0.1]} r={0.78} s={[1.05, 0.9, 1]} c={light} />
      {[-0.38, -0.13, 0.13, 0.38].map((x, i) => (
        <Ball key={i} p={[x * side, -3.3, 0.5]} r={0.24} c={dark} />
      ))}
      <Ring p={[0, -2.55, 0.05]} r={0.62} t={0.07} c={glow} e={glow} ei={0.5} rot={[Math.PI / 2, 0, 0]} />
    </>
  )

  return (
    <group>
      {/* 다리 */}
      {[-0.82, 0.82].map((x) => (
        <group key={x}>
          <Cyl p={[x, 0.95, 0]} r={0.62} r2={0.7} h={1.5} c={stone} />
          <Ball p={[x, 1.7, 0.25]} r={0.5} c={dark} />
          <Bx p={[x, 0.2, 0.28]} s={[1.3, 0.42, 1.7]} c={dark} />
          <Bx p={[x, 0.44, 0.9]} s={[1.1, 0.3, 0.5]} c={light} />
          <Cone p={[x - 0.35, 0.28, 1.2]} r={0.16} h={0.4} c={light} rot={[Math.PI / 2, 0, 0]} />
          <Cone p={[x + 0.35, 0.28, 1.2]} r={0.16} h={0.4} c={light} rot={[Math.PI / 2, 0, 0]} />
        </group>
      ))}
      {/* 허리 */}
      <Bx p={[0, 1.95, 0]} s={[2.3, 0.7, 1.55]} c={dark} />
      <Ring p={[0, 1.98, 0.8]} r={0.3} t={0.06} c={glow} e={glow} ei={0.8} />

      <group ref={torso} position={[0, 2.7, 0]}>
        {/* 몸통 */}
        <Ball p={[0, 0, 0]} r={1} s={[1.6, 1.3, 1.15]} c={stone} />
        <Ball p={[0, 0.15, 0.85]} r={0.9} s={[1.15, 0.95, 0.38]} c={light} />
        <group ref={runes} position={[0, 0.1, 1.2]}>
          <Ring p={[0, 0, 0]} r={0.42} t={0.07} c={glow} e={glow} ei={0.9} />
          <Bx p={[0, 0.1, 0]} s={[0.4, 0.07, 0.05]} c={glow} e={glow} ei={1} />
          <Bx p={[0, -0.1, 0]} s={[0.4, 0.07, 0.05]} c={glow} e={glow} ei={1} />
        </group>
        <Ball p={[-0.95, 0.5, 0.75]} r={0.18} c={moss} />
        <Ball p={[0.9, -0.2, 0.9]} r={0.14} c={moss} />
        {/* 어깨 */}
        {[-1, 1].map((sd) => (
          <group key={sd}>
            <Ball p={[sd * 1.85, 0.75, 0]} r={0.92} s={[1, 0.85, 1]} c={stone} />
            <Ball p={[sd * 1.85, 1.25, 0]} r={0.62} s={[1.1, 0.45, 1.1]} c={moss} />
            <Cone p={[sd * 2.15, 1.5, 0.1]} r={0.2} h={0.7} c={light} rot={[0, 0, -sd * 0.5]} />
            <Cone p={[sd * 1.7, 1.55, -0.2]} r={0.16} h={0.55} c={light} rot={[-0.3, 0, sd * 0.2]} />
          </group>
        ))}
        {/* 팔 */}
        <group ref={armR} position={[1.85, 0.75, 0]}>
          <Arm side={1} />
        </group>
        <group ref={armL} position={[-1.85, 0.75, 0]}>
          <Arm side={-1} />
        </group>
        {/* 머리 */}
        <group ref={head} position={[0, 1.55, 0.15]}>
          <Ball p={[0, 0, 0]} r={0.82} s={[1.1, 0.9, 1]} c={light} />
          <Bx p={[0, 0.2, 0.62]} s={[1.5, 0.22, 0.45]} c={dark} rot={[0.15, 0, 0]} />
          {[-0.36, 0.36].map((x) => (
            <Ball key={x} p={[x, 0.02, 0.7]} r={0.17} c="#fff3c4" e={glow} ei={1.4} />
          ))}
          <Bx p={[0, -0.4, 0.62]} s={[0.85, 0.22, 0.3]} c="#3a342d" />
          {[-0.3, -0.1, 0.1, 0.3].map((x) => (
            <Bx key={x} p={[x, -0.3, 0.74]} s={[0.1, 0.14, 0.08]} c="#f4eddc" />
          ))}
          <Ball p={[0, 0.45, 0.78]} r={0.16} s={[1, 1.5, 0.5]} c={glow} e={glow} ei={1.2} rot={[0, 0, Math.PI / 4]} />
          {[-1, 1].map((sd) => (
            <group key={sd}>
              <Cone p={[sd * 0.62, 0.78, -0.05]} r={0.24} h={1.0} c="#e8dcc0" rot={[0, 0, -sd * 0.42]} />
              <Ball p={[sd * 0.88, 0.02, 0.05]} r={0.2} c={dark} />
            </group>
          ))}
        </group>
      </group>

      <Orbiters items={['+', '−', '×', '÷']} r={3.9} y={3.1} size={1.0} speed={0.55} tile="#3d3a52" fg="#ffd27a" glow={glow} />
    </group>
  )
}

/* ============================================================
   2단계: 알파벳 용 렉시 — 보라색 용. 날개를 퍼덕이고 둘레에 알파벳 판이 돈다.
   ============================================================ */
function Dragon() {
  const neck = useRef<THREE.Group>(null)
  const headG = useRef<THREE.Group>(null)
  const wingL = useRef<THREE.Group>(null)
  const wingR = useRef<THREE.Group>(null)
  const tail = useRef<THREE.Group>(null)
  const jaw = useRef<THREE.Group>(null)

  useFrame(() => {
    const t = nowSec()
    const atk = clamp01((t - bossFx.atkAt) / 0.95)
    const hit = clamp01((t - bossFx.hitAt) / 0.5)
    const roar = atk > 0 && atk < 1 ? Math.sin(atk * Math.PI) : 0
    const flap = ss(t * 2.6) * (0.35 + roar * 0.5)
    if (wingR.current) wingR.current.rotation.z = 0.4 + flap
    if (wingL.current) wingL.current.rotation.z = -0.4 - flap
    if (neck.current) neck.current.rotation.x = ss(t * 1.2) * 0.04 - roar * 0.28 + Math.sin(hit * Math.PI) * 0.25
    if (headG.current) headG.current.rotation.x = -roar * 0.5 + Math.sin(hit * Math.PI) * 0.3 + ss(t * 1.6) * 0.03
    if (jaw.current) jaw.current.rotation.x = 0.1 + roar * 0.55
    if (tail.current) tail.current.rotation.y = ss(t * 1.4) * 0.25
  })

  const body = '#7a63d8'
  const belly = '#f1e2ff'
  const dark = '#4d3a9c'
  const spike = '#ffd86b'
  const horn = '#fff0c2'
  const memb = '#b79bff'

  return (
    <group position={[0, 0, 0]}>
      {/* 몸통 */}
      <Ball p={[0, 1.95, -0.3]} r={1} s={[1.55, 1.3, 2.2]} c={body} />
      <Ball p={[0, 1.55, 0.35]} r={1} s={[1.15, 0.95, 1.75]} c={belly} />
      {[-1.4, -0.8, -0.2, 0.4, 1.0].map((z, i) => (
        <Cone key={i} p={[0, 3.05 - Math.abs(z + 0.1) * 0.12, z - 0.4]} r={0.26} h={0.8 - i * 0.04} c={spike} rot={[-0.15, 0, 0]} />
      ))}
      {/* 다리 */}
      {[
        [-0.95, 1.4],
        [0.95, 1.4],
        [-1.0, -1.3],
        [1.0, -1.3],
      ].map(([x, z], i) => (
        <group key={i}>
          <Ball p={[x, 1.1, z]} r={i < 2 ? 0.55 : 0.7} c={body} />
          <Cyl p={[x, 0.55, z]} r={0.32} r2={0.4} h={1.0} c={dark} />
          <Bx p={[x, 0.1, z + 0.25]} s={[0.7, 0.22, 0.95]} c={dark} />
          {[-0.22, 0, 0.22].map((dx) => (
            <Cone key={dx} p={[x + dx, 0.12, z + 0.82]} r={0.09} h={0.3} c={horn} rot={[Math.PI / 2, 0, 0]} />
          ))}
        </group>
      ))}
      {/* 꼬리 */}
      <group ref={tail} position={[0, 1.55, -2.3]}>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <Ball key={i} p={[Math.sin(i * 0.5) * 0.35 * i * 0.3, -i * 0.04, -i * 0.62]} r={0.72 - i * 0.08} c={i % 2 ? body : '#8a72e6'} />
        ))}
        <Cone p={[Math.sin(6 * 0.5) * 0.35 * 6 * 0.3, -0.24, -4.3]} r={0.3} h={0.9} c={spike} rot={[-Math.PI / 2, 0, 0]} />
      </group>
      {/* 날개 */}
      <group ref={wingR} position={[0.85, 2.85, -0.3]}>
        <group rotation={[-0.62, 0.38, 0]}>
          <Wing side={1} size={3.4} membrane={memb} bone={dark} />
        </group>
      </group>
      <group ref={wingL} position={[-0.85, 2.85, -0.3]}>
        <group rotation={[-0.62, -0.38, 0]}>
          <Wing side={-1} size={3.4} membrane={memb} bone={dark} />
        </group>
      </group>
      {/* 목 + 머리 */}
      <group ref={neck} position={[0, 2.35, 1.2]}>
        <Ball p={[0, 0.25, 0.3]} r={0.78} s={[1, 1.1, 1]} c={body} />
        <Ball p={[0, 0.95, 0.62]} r={0.7} s={[1, 1.1, 1]} c={body} />
        <Ball p={[0, 1.65, 0.85]} r={0.64} s={[1, 1.1, 1]} c={body} />
        <Ball p={[0, 0.4, 0.62]} r={0.5} s={[0.8, 1.2, 0.7]} c={belly} />
        <Ball p={[0, 1.1, 0.95]} r={0.45} s={[0.75, 1.2, 0.7]} c={belly} />
        <group ref={headG} position={[0, 2.25, 1.05]}>
          <Ball p={[0, 0, 0]} r={0.82} s={[1.0, 0.85, 1.15]} c={body} />
          <Ball p={[0, -0.12, 0.85]} r={0.55} s={[0.85, 0.62, 1.2]} c={body} />
          <Ball p={[-0.2, -0.05, 1.45]} r={0.07} c="#2a2150" />
          <Ball p={[0.2, -0.05, 1.45]} r={0.07} c="#2a2150" />
          {/* 위턱 이빨 */}
          {[-0.38, -0.19, 0, 0.19, 0.38].map((x) => (
            <Cone key={x} p={[x, -0.42, 1.2]} r={0.06} h={0.2} c="#ffffff" rot={[Math.PI, 0, 0]} />
          ))}
          <group ref={jaw} position={[0, -0.42, 0.55]}>
            <Ball p={[0, -0.1, 0.45]} r={0.45} s={[0.85, 0.35, 1.2]} c={dark} />
            {[-0.3, 0.3].map((x) => (
              <Cone key={x} p={[x, 0.08, 0.85]} r={0.05} h={0.16} c="#ffffff" />
            ))}
          </group>
          {[-1, 1].map((sd) => (
            <group key={sd}>
              <Ball p={[sd * 0.46, 0.28, 0.58]} r={0.19} c="#ffe14d" e="#ffe14d" ei={0.9} />
              <Ball p={[sd * 0.5, 0.28, 0.74]} r={0.09} s={[0.5, 1.4, 0.5]} c="#1d1633" />
              <Bx p={[sd * 0.48, 0.52, 0.6]} s={[0.4, 0.09, 0.14]} c={dark} rot={[0, 0, sd * 0.45]} />
              <Cone p={[sd * 0.42, 0.85, -0.2]} r={0.2} h={1.1} c={horn} rot={[-0.7, 0, -sd * 0.28]} />
              {[0, 1, 2].map((k) => (
                <Cone key={k} p={[sd * (0.82 + k * 0.03), 0.1 - k * 0.2, -0.28 - k * 0.1]} r={0.1} h={0.55} c={memb} rot={[-0.2, 0, -sd * (1.1 + k * 0.1)]} />
              ))}
            </group>
          ))}
        </group>
      </group>

      <Orbiters items={['A', 'B', 'C', 'D', 'E']} r={4.3} y={3.4} size={0.95} speed={-0.5} tile="#3a2d7a" fg="#ffe9a8" glow="#a98bff" />
    </group>
  )
}

/* ============================================================
   3단계: 호랑이 장군 — 갑옷을 입고 큰 칼을 든 호랑이. 이마에 임금 왕(王) 무늬.
   ============================================================ */
function Tiger() {
  const armR = useRef<THREE.Group>(null)
  const armL = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)
  const body = useRef<THREE.Group>(null)
  const tail = useRef<THREE.Group>(null)
  const flag = useRef<THREE.Group>(null)

  useFrame(() => {
    const t = nowSec()
    const atk = clamp01((t - bossFx.atkAt) / 0.95)
    const hit = clamp01((t - bossFx.hitAt) / 0.5)
    if (body.current) {
      body.current.position.y = 2.6 + ss(t * 1.8) * 0.05
      body.current.rotation.y = atk > 0 && atk < 1 ? -0.35 * Math.sin(atk * Math.PI) : 0
    }
    if (head.current) {
      head.current.rotation.x = Math.sin(hit * Math.PI) * 0.3 - (atk > 0 && atk < 1 ? Math.sin(atk * Math.PI) * 0.3 : 0)
      head.current.rotation.y = ss(t * 0.8) * 0.1
    }
    let ar = -0.15 + ss(t * 1.4) * 0.06
    if (atk > 0 && atk < 1) {
      if (atk < 0.35) ar = -0.15 - 2.6 * (atk / 0.35)
      else if (atk < 0.5) ar = -2.75 + 3.4 * ((atk - 0.35) / 0.15)
      else ar = 0.65 * (1 - (atk - 0.5) / 0.5) - 0.15 * ((atk - 0.5) / 0.5)
    }
    if (armR.current) armR.current.rotation.x = ar
    if (armL.current) armL.current.rotation.x = ss(t * 1.4 + 1) * 0.06
    if (tail.current) tail.current.rotation.y = ss(t * 1.6) * 0.3
    if (flag.current) flag.current.rotation.y = ss(t * 2.2) * 0.12
  })

  const fur = '#f08a2a'
  const stripe = '#2b211c'
  const cream = '#fff0d6'
  const navy = '#2a3a63'
  const red = '#c4453a'
  const gold = '#e8c24a'

  const Stripes = ({ at, n, len = 0.5 }: { at: V3; n: number; len?: number }) => (
    <group position={at}>
      {Array.from({ length: n }, (_, i) => (
        <Bx key={i} p={[0, i * 0.34, 0]} s={[len, 0.09, 0.05]} c={stripe} rot={[0, 0, (i % 2 ? 1 : -1) * 0.18]} />
      ))}
    </group>
  )

  return (
    <group>
      {/* 다리 */}
      {[-0.7, 0.7].map((x) => (
        <group key={x}>
          <Cyl p={[x, 0.95, 0]} r={0.5} r2={0.58} h={1.5} c={fur} />
          <Stripes at={[x, 0.55, 0.5]} n={3} />
          <Bx p={[x, 0.22, 0.2]} s={[0.95, 0.5, 1.4]} c="#3b2a2a" />
          <Bx p={[x, 0.46, 0.78]} s={[0.85, 0.16, 0.34]} c={gold} />
          <Bx p={[x, 1.55, 0.5]} s={[0.8, 0.5, 0.18]} c={gold} />
        </group>
      ))}
      {/* 꼬리 */}
      <group ref={tail} position={[0, 1.5, -0.9]}>
        {[0, 1, 2, 3, 4].map((i) => (
          <group key={i}>
            <Ball p={[Math.sin(i * 0.7) * 0.5, i * 0.28, -i * 0.5]} r={0.34 - i * 0.02} c={fur} />
            {i % 2 === 0 && <Bx p={[Math.sin(i * 0.7) * 0.5, i * 0.28, -i * 0.5]} s={[0.7, 0.1, 0.1]} c={stripe} rot={[0, 0, 0]} />}
          </group>
        ))}
      </group>

      <group ref={body} position={[0, 2.6, 0]}>
        {/* 몸통 + 갑옷 */}
        <Ball p={[0, 0, 0]} r={1} s={[1.35, 1.45, 1.0]} c={fur} />
        <Ball p={[0, -0.05, 0.6]} r={0.95} s={[1.0, 1.1, 0.5]} c={cream} />
        <Bx p={[0, 0.1, 0.9]} s={[1.9, 1.5, 0.34]} c={navy} />
        <Bx p={[0, 0.1, 1.08]} s={[1.5, 1.15, 0.06]} c={red} />
        <Ring p={[0, 0.15, 1.15]} r={0.34} t={0.07} c={gold} rot={[0, 0, 0]} />
        <Ball p={[0, 0.15, 1.16]} r={0.17} c={gold} />
        {[-0.85, 0.85].map((x) => (
          <Bx key={x} p={[x, 0.1, 0.96]} s={[0.12, 1.6, 0.36]} c={gold} />
        ))}
        <Bx p={[0, 0.88, 0.96]} s={[1.95, 0.12, 0.36]} c={gold} />
        <Bx p={[0, -0.72, 0.9]} s={[2.0, 0.28, 0.4]} c={red} />
        <Bx p={[0, -0.72, 1.12]} s={[0.4, 0.3, 0.06]} c={gold} />
        {/* 갑옷 치마 */}
        {[-0.75, -0.25, 0.25, 0.75].map((x, i) => (
          <Bx key={x} p={[x, -1.15, 0.78]} s={[0.46, 0.85, 0.1]} c={i % 2 ? red : navy} rot={[0.12, 0, 0]} />
        ))}
        <Stripes at={[-1.1, -0.5, 0.2]} n={4} len={0.45} />
        {/* 어깨 갑옷 */}
        {[-1, 1].map((sd) => (
          <group key={sd}>
            <Ball p={[sd * 1.55, 0.78, 0]} r={0.8} s={[1, 0.62, 1]} c={navy} />
            <Ring p={[sd * 1.55, 0.6, 0]} r={0.76} t={0.07} c={gold} rot={[Math.PI / 2, 0, 0]} />
          </group>
        ))}
        {/* 왼팔: 허리에 손 */}
        <group ref={armL} position={[-1.6, 0.6, 0]}>
          <Cyl p={[0, -0.6, 0]} r={0.42} r2={0.5} h={1.3} c={fur} />
          <Cyl p={[0, -1.5, 0]} r={0.44} r2={0.38} h={1.0} c={navy} />
          <Bx p={[0, -1.5, 0]} s={[0.84, 0.14, 0.84]} c={gold} />
          <Ball p={[0, -2.2, 0.05]} r={0.42} c={fur} />
          <Stripes at={[0.05, -0.9, 0.42]} n={2} len={0.36} />
        </group>
        {/* 오른팔: 큰 칼 */}
        <group ref={armR} position={[1.6, 0.6, 0]}>
          <Cyl p={[0, -0.6, 0]} r={0.42} r2={0.5} h={1.3} c={fur} />
          <Cyl p={[0, -1.5, 0]} r={0.44} r2={0.38} h={1.0} c={navy} />
          <Bx p={[0, -1.5, 0]} s={[0.84, 0.14, 0.84]} c={gold} />
          <Ball p={[0, -2.2, 0.05]} r={0.45} c={fur} />
          {/* 칼: 손에서 위로 길게 */}
          <group position={[0, -2.2, 0.1]} rotation={[0.2, 0, 0]}>
            <Cyl p={[0, 0, 0]} r={0.08} h={1.6} c="#3b2a2a" rot={[0, 0, 0]} />
            <Bx p={[0, 0.8, 0]} s={[0.55, 0.12, 0.16]} c={gold} />
            <Shaped kind="blade" size={1} depth={0.1} color="#dfe9f2" position={[0, 0.9, 0]} scale={[0.75, 3.2, 1]} />
          </group>
        </group>
        {/* 머리 */}
        <group ref={head} position={[0, 1.8, 0.15]}>
          <Ball p={[0, 0, 0]} r={0.98} s={[1.1, 0.95, 1.0]} c={fur} />
          {/* 귀 */}
          {[-1, 1].map((sd) => (
            <group key={sd}>
              <Ball p={[sd * 0.75, 0.82, -0.05]} r={0.3} s={[1, 1, 0.6]} c={fur} />
              <Ball p={[sd * 0.75, 0.82, 0.05]} r={0.17} s={[1, 1, 0.5]} c={cream} />
            </group>
          ))}
          {/* 주둥이 */}
          <Ball p={[0, -0.28, 0.78]} r={0.5} s={[1.05, 0.72, 0.8]} c={cream} />
          <Ball p={[0, -0.02, 1.12]} r={0.16} s={[1.2, 0.8, 0.8]} c="#e07a8a" />
          <Bx p={[0, -0.36, 1.12]} s={[0.55, 0.08, 0.06]} c="#3a2a28" />
          {[-0.2, 0.2].map((x) => (
            <Cone key={x} p={[x, -0.5, 1.1]} r={0.06} h={0.28} c="#ffffff" rot={[Math.PI, 0, 0]} />
          ))}
          {/* 눈 + 눈썹 */}
          {[-1, 1].map((sd) => (
            <group key={sd}>
              <Ball p={[sd * 0.42, 0.18, 0.78]} r={0.19} s={[1, 0.8, 0.7]} c="#ffe36a" e="#ffd23a" ei={0.5} />
              <Bx p={[sd * 0.42, 0.18, 0.93]} s={[0.05, 0.26, 0.04]} c="#1a1210" />
              <Bx p={[sd * 0.44, 0.42, 0.8]} s={[0.5, 0.12, 0.12]} c={stripe} rot={[0, 0, -sd * 0.42]} />
              {[0, 1, 2].map((k) => (
                <Cyl key={k} p={[sd * 0.62, -0.28 - k * 0.07, 1.0]} r={0.012} h={0.7} c="#fff8ea" rot={[0, 0, Math.PI / 2 + sd * (0.12 * k - 0.1)]} />
              ))}
              <Bx p={[sd * 0.88, 0.0, 0.3]} s={[0.05, 0.14, 0.42]} c={stripe} />
              <Bx p={[sd * 0.9, -0.2, 0.25]} s={[0.05, 0.12, 0.34]} c={stripe} />
            </group>
          ))}
          {/* 이마의 왕(王) 무늬 */}
          <Bx p={[0, 0.58, 0.93]} s={[0.34, 0.07, 0.05]} c={stripe} />
          <Bx p={[0, 0.46, 0.95]} s={[0.24, 0.07, 0.05]} c={stripe} />
          <Bx p={[0, 0.34, 0.96]} s={[0.34, 0.07, 0.05]} c={stripe} />
          <Bx p={[0, 0.46, 0.94]} s={[0.07, 0.34, 0.05]} c={stripe} />
          {/* 투구 */}
          <Ball p={[0, 0.58, -0.02]} r={0.86} s={[1.05, 0.62, 1.0]} c="#26252b" />
          <Ring p={[0, 0.38, 0.02]} r={0.9} t={0.06} c={gold} rot={[Math.PI / 2, 0, 0]} />
          <Cone p={[0, 1.25, 0]} r={0.12} h={0.55} c={gold} />
          <Ball p={[0, 1.55, 0]} r={0.26} s={[1, 1.4, 1]} c={red} />
        </group>
      </group>

      {/* 깃발 */}
      <group ref={flag} position={[2.9, 0, -1.3]}>
        <Cyl p={[0, 2.4, 0]} r={0.07} h={4.8} c="#3b2a2a" />
        <Cone p={[0, 4.95, 0]} r={0.12} h={0.4} c={gold} />
        <Bx p={[0.55, 3.9, 0]} s={[1.1, 1.3, 0.05]} c={red} />
        <mesh position={[0.55, 3.9, 0.04]}>
          <planeGeometry args={[0.95, 0.95]} />
          <meshBasicMaterial map={labelTex('虎', '#ffe9a8')} transparent toneMapped={false} />
        </mesh>
      </group>
    </group>
  )
}

/* ============================================================
   4단계: 올빼미 대마법사 아르카 — 별무늬 로브와 마법사 모자, 빛나는 지팡이. 둘레에 과목 책들이 돈다.
   페이즈가 오르면 발밑에 불길한 고리가 생긴다.
   ============================================================ */
function Owl() {
  const wingL = useRef<THREE.Group>(null)
  const wingR = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)
  const staff = useRef<THREE.Group>(null)
  const orb = useRef<THREE.Mesh>(null)
  const body = useRef<THREE.Group>(null)
  const ring2 = useRef<THREE.Mesh>(null)
  const ring3 = useRef<THREE.Mesh>(null)

  useFrame(() => {
    const t = nowSec()
    const atk = clamp01((t - bossFx.atkAt) / 0.95)
    const hit = clamp01((t - bossFx.hitAt) / 0.5)
    const roar = atk > 0 && atk < 1 ? Math.sin(atk * Math.PI) : 0
    const flap = ss(t * (2.2 + bossFx.lv * 0.5)) * (0.18 + roar * 0.45)
    if (wingR.current) wingR.current.rotation.z = 0.35 + flap
    if (wingL.current) wingL.current.rotation.z = -0.35 - flap
    if (body.current) body.current.position.y = ss(t * 1.6) * 0.06
    if (head.current) {
      head.current.rotation.y = ss(t * 0.7) * 0.25
      head.current.rotation.x = -roar * 0.25 + Math.sin(hit * Math.PI) * 0.3
      head.current.rotation.z = ss(t * 0.9) * 0.05
    }
    if (staff.current) staff.current.rotation.x = -roar * 0.7 + ss(t * 1.3) * 0.03
    if (orb.current) {
      const k = 1 + ss(t * 4) * 0.12 + roar * 0.5
      orb.current.scale.setScalar(k)
    }
    if (ring2.current) ring2.current.visible = bossFx.lv >= 2
    if (ring3.current) ring3.current.visible = bossFx.lv >= 3
    if (ring2.current) ring2.current.rotation.z = t * 0.6
    if (ring3.current) ring3.current.rotation.z = -t * 0.9
  })

  const feather = '#6b52a8'
  const featherDark = '#4a3a82'
  const chest = '#efe3ff'
  const robe = '#27327a'
  const gold = '#ffd86b'
  const hat = '#1f2760'
  const beak = '#ffb21f'

  return (
    <group>
      <group ref={body}>
        {/* 발 */}
        {[-0.7, 0.7].map((x) => (
          <group key={x}>
            <Cyl p={[x, 0.45, 0.2]} r={0.14} r2={0.18} h={0.9} c={beak} />
            {[-0.25, 0, 0.25].map((dx) => (
              <Cone key={dx} p={[x + dx, 0.1, 0.62]} r={0.1} h={0.5} c="#ffe9a8" rot={[Math.PI / 2, 0, 0]} />
            ))}
          </group>
        ))}
        {/* 로브 */}
        <Cyl p={[0, 1.55, 0]} r={2.0} r2={1.15} h={2.5} c={robe} />
        <Ring p={[0, 0.34, 0]} r={1.97} t={0.1} c={gold} e={gold} ei={0.35} rot={[Math.PI / 2, 0, 0]} />
        <Ring p={[0, 2.7, 0]} r={1.13} t={0.08} c={gold} e={gold} ei={0.35} rot={[Math.PI / 2, 0, 0]} />
        {[
          [-0.7, 1.0], [0.6, 1.4], [-0.2, 1.9], [0.9, 0.8], [-1.1, 1.6], [0.1, 0.9],
        ].map(([x, y], i) => (
          <Ball key={i} p={[x, y, 1.5 - Math.abs(y - 1.6) * 0.18]} r={0.1} c={gold} e={gold} ei={0.9} />
        ))}
        {/* 몸통·가슴 깃털 */}
        <Ball p={[0, 3.45, 0]} r={1.3} s={[1.05, 1.2, 0.95]} c={feather} />
        <Ball p={[0, 3.35, 0.85]} r={1} s={[0.85, 1.05, 0.42]} c={chest} />
        {[0, 1, 2].map((r) =>
          [-0.4, 0, 0.4].map((x) => (
            <Ball key={`${r}${x}`} p={[x + (r % 2) * 0.2 - 0.1, 3.75 - r * 0.38, 1.1]} r={0.2} s={[1, 0.7, 0.4]} c="#c9b6ee" />
          )),
        )}
        {/* 날개 */}
        <group ref={wingR} position={[1.2, 3.9, -0.15]}>
          <group rotation={[-0.45, 0.45, 0]}>
            <Wing side={1} size={2.6} membrane={featherDark} bone={gold} />
          </group>
        </group>
        <group ref={wingL} position={[-1.2, 3.9, -0.15]}>
          <group rotation={[-0.45, -0.45, 0]}>
            <Wing side={-1} size={2.6} membrane={featherDark} bone={gold} />
          </group>
        </group>
        {/* 지팡이 */}
        <group ref={staff} position={[2.25, 0, 0.9]}>
          <Cyl p={[0, 2.35, 0]} r={0.075} r2={0.09} h={4.7} c="#7b4f2a" />
          <Ring p={[0, 4.75, 0]} r={0.36} t={0.06} c={gold} e={gold} ei={0.5} rot={[Math.PI / 2, 0, 0.3]} />
          <mesh ref={orb} position={[0, 4.85, 0]}>
            <sphereGeometry args={[0.3, 16, 12]} />
            <Toon color="#9fefff" emissive="#7fe3ff" ei={1.4} />
          </mesh>
          <Ball p={[0, 1.7, 0.02]} r={0.2} c={featherDark} />
        </group>
        {/* 머리 */}
        <group ref={head} position={[0, 4.95, 0.15]}>
          <Ball p={[0, 0, 0]} r={1.15} s={[1.12, 1.0, 1.0]} c={feather} />
          {[-1, 1].map((sd) => (
            <group key={sd}>
              <Ball p={[sd * 0.52, -0.02, 0.86]} r={0.64} s={[1, 1, 0.36]} c="#f4ecff" />
              <Ball p={[sd * 0.52, 0.02, 1.05]} r={0.34} c="#ffe36a" e="#ffd23a" ei={1.1} />
              <Ball p={[sd * 0.52, 0.02, 1.34]} r={0.15} s={[0.8, 1.2, 0.5]} c="#14102a" />
              <Bx p={[sd * 0.52, 0.5, 1.05]} s={[0.72, 0.13, 0.16]} c={featherDark} rot={[0, 0, -sd * 0.32]} />
              <Cone p={[sd * 0.78, 0.98, -0.02]} r={0.2} h={0.75} c={featherDark} rot={[0, 0, -sd * 0.45]} />
            </group>
          ))}
          <Cone p={[0, -0.18, 1.45]} r={0.24} h={0.6} c={beak} rot={[Math.PI / 2, 0, 0]} />
          {/* 마법사 모자 */}
          <Cyl p={[0, 0.98, 0]} r={1.55} h={0.12} c={hat} />
          <Cyl p={[0, 1.08, 0]} r={1.02} r2={1.0} h={0.2} c={gold} />
          <group rotation={[0, 0, 0.12]} position={[0, 0, 0]}>
            <Cone p={[0.1, 2.25, 0]} r={1.0} h={2.4} c={hat} />
            <Shaped kind="star" size={0.36} depth={0.05} color={gold} glow position={[0.05, 1.5, 0.92]} />
            <Ball p={[0.52, 3.55, 0]} r={0.14} c={gold} e={gold} ei={0.9} />
          </group>
        </group>
      </group>
      {/* 페이즈 고리 */}
      <mesh ref={ring2} position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[3.1, 3.3, 48]} />
        <meshBasicMaterial color="#ffa24d" transparent opacity={0.85} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={ring3} position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[3.6, 3.85, 6]} />
        <meshBasicMaterial color="#ff4d4d" transparent opacity={0.9} side={THREE.DoubleSide} />
      </mesh>

      <Orbiters items={['수', '국', '영', '과', '사', '史']} r={4.7} y={1.9} size={0.95} speed={0.5} tile="#2b2f78" fg="#ffe9a8" glow="#7fe3ff" />
    </group>
  )
}

export function BossModel({ stage }: { stage: number }) {
  const body = useMemo(() => (stage === 4 ? <Owl /> : stage === 2 ? <Dragon /> : stage === 3 ? <Tiger /> : <Golem />), [stage])
  return <Shell key={stage}>{body}</Shell>
}

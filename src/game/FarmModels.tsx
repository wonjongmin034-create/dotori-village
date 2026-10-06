import { useRef } from 'react'
import { toonGradient } from './toon'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CROP_MAP, ANIMAL_MAP } from './economy'
import type { CropState, AnimalState } from './store'

function M({ c }: { c: string }) {
  return <meshToonMaterial gradientMap={toonGradient} color={c} />
}

/* ───────────────────────── 작물 ───────────────────────── */
// s = 자란 정도(0.3 ~ 1), ripe = 수확할 수 있음

const spin = (n: number, i: number) => (i / n) * Math.PI * 2

// 벼: 가는 잎 다발 → 익으면 황금색 + 고개 숙인 이삭
function Rice({ s, ripe }: { s: number; ripe: boolean }) {
  const h = 0.78 * s
  const leaf = ripe ? '#e4c457' : '#7ec65c'
  return (
    <group>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <group key={i} rotation={[0, spin(6, i) + 0.4, 0]}>
          <mesh position={[0.04 + (i % 2) * 0.02, (h * (0.85 + (i % 3) * 0.1)) / 2, 0]} rotation={[0, 0, -0.16 - (i % 3) * 0.05]}>
            <coneGeometry args={[0.024, h * (0.85 + (i % 3) * 0.1), 4]} />
            <M c={leaf} />
          </mesh>
        </group>
      ))}
      {ripe &&
        [0, 2, 4].map((i) => (
          <group key={`g${i}`} rotation={[0, spin(6, i) + 0.4, 0]}>
            <mesh position={[0.17, h * 0.92, 0]} rotation={[0, 0, -1.15]}>
              <capsuleGeometry args={[0.032, 0.17, 3, 6]} />
              <M c="#f3d66a" />
            </mesh>
          </group>
        ))}
    </group>
  )
}

// 감자: 잎이 무성한 덤불 → 꽃이 피고, 흙 위로 감자가 보인다
function Potato({ s, ripe }: { s: number; ripe: boolean }) {
  const r = 0.17 * s
  return (
    <group>
      {(
        [
          [0, 0, 0, 1],
          [0.11, 0.02, 0.05, 0.75],
          [-0.1, 0.01, 0.06, 0.8],
          [0.02, 0.03, -0.1, 0.78],
        ] as [number, number, number, number][]
      ).map(([x, y, z, k], i) => (
        <mesh key={i} position={[x * s * 1.4, 0.1 + r * 0.5 + y, z * s * 1.4]} scale={[1, 0.62, 1]}>
          <sphereGeometry args={[r * k + 0.04, 9, 7]} />
          <M c={i % 2 ? '#5fb157' : '#4d9d4b'} />
        </mesh>
      ))}
      {ripe && (
        <>
          {[
            [0.1, 0.19, 0.06],
            [-0.08, 0.2, -0.04],
            [0.0, 0.24, 0.1],
          ].map(([x, y, z], i) => (
            <mesh key={`f${i}`} position={[x, y + 0.14, z]}>
              <sphereGeometry args={[0.035, 6, 6]} />
              <M c={i === 1 ? '#f4eaff' : '#fffaf0'} />
            </mesh>
          ))}
          {[
            [0.2, 0.04, 0.08, 0.3],
            [-0.19, 0.04, -0.02, -0.4],
            [0.04, 0.04, 0.22, 0.1],
          ].map(([x, y, z, ry], i) => (
            <mesh key={`p${i}`} position={[x, y, z]} rotation={[0, ry, 0]} scale={[1.35, 0.85, 1]}>
              <sphereGeometry args={[0.085, 8, 7]} />
              <M c="#cfa561" />
            </mesh>
          ))}
        </>
      )}
    </group>
  )
}

// 옥수수: 키 큰 줄기와 긴 잎 → 익으면 노란 옥수수와 수염
function Corn({ s, ripe }: { s: number; ripe: boolean }) {
  const h = 1.05 * s
  return (
    <group>
      <mesh position={[0, h / 2, 0]}>
        <cylinderGeometry args={[0.028, 0.045, h, 6]} />
        <M c="#7cbc58" />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <group key={i} position={[0, h * (0.35 + i * 0.16), 0]} rotation={[0, spin(4, i) * 1 + i * 0.5, 0]}>
          <mesh position={[0.15 * s + 0.05, 0, 0]} rotation={[0, 0, -0.5 + i * 0.07]}>
            <boxGeometry args={[0.36 * s + 0.08, 0.012, 0.075]} />
            <M c={i % 2 ? '#5fae4f' : '#6dbb55'} />
          </mesh>
        </group>
      ))}
      {ripe && (
        <>
          <group position={[0.05, h * 0.58, 0.03]} rotation={[0, 0.5, -0.32]}>
            <mesh position={[0.07, 0.07, 0]}>
              <capsuleGeometry args={[0.052, 0.17, 4, 8]} />
              <M c="#f4c93f" />
            </mesh>
            <mesh position={[0.02, 0.0, 0]} rotation={[0, 0, 0.2]}>
              <coneGeometry args={[0.075, 0.16, 5]} />
              <M c="#7fb85c" />
            </mesh>
          </group>
          {[-0.04, 0, 0.04].map((x, i) => (
            <mesh key={i} position={[x, h + 0.03, i === 1 ? 0 : 0.02]} rotation={[0, 0, x * 8]}>
              <coneGeometry args={[0.012, 0.13, 3]} />
              <M c="#e2cf88" />
            </mesh>
          ))}
        </>
      )}
    </group>
  )
}

const TREES: Record<string, { leaf: string; leaf2: string; fruit: string; blossom: string; pear?: boolean }> = {
  apple: { leaf: '#5eaf50', leaf2: '#74c262', fruit: '#dc4a45', blossom: '#fff1f0' },
  pear: { leaf: '#7dbb4e', leaf2: '#97cd62', fruit: '#c8d65b', blossom: '#ffffff', pear: true },
  peach: { leaf: '#82c36c', leaf2: '#9bd47e', fruit: '#f6a29b', blossom: '#ffc4d8' },
}

// 과일나무(사과·배·복숭아): 묘목 → 잎이 무성 → 꽃 → 열매
function FruitTree({ id, s, grown, ripe }: { id: string; s: number; grown: number; ripe: boolean }) {
  const t = TREES[id] ?? TREES.apple
  const trunkH = 0.3 + 0.5 * s
  const cy = trunkH + 0.12 * s
  const R = 0.26 + 0.3 * s
  const lumps: [number, number, number, number][] = [
    [0, 0, 0, 1],
    [0.55, -0.12, 0.1, 0.72],
    [-0.55, -0.1, -0.15, 0.74],
    [0.05, 0.42, 0.0, 0.7],
    [-0.1, -0.1, 0.55, 0.68],
    [0.12, -0.05, -0.55, 0.66],
  ]
  const spots: [number, number, number][] = [
    [0.75, 0.05, 0.4],
    [-0.7, 0.1, 0.5],
    [0.2, 0.3, 0.95],
    [-0.4, -0.15, -0.9],
    [0.85, -0.2, -0.3],
    [-0.95, 0.0, -0.1],
    [0.3, -0.35, 0.9],
  ]
  const place = ([x, y, z]: [number, number, number]) => {
    const v = new THREE.Vector3(x, y, z).normalize().multiplyScalar(R * 1.05)
    return [v.x, cy + v.y, v.z] as [number, number, number]
  }
  return (
    <group>
      <mesh position={[0, trunkH / 2, 0]}>
        <cylinderGeometry args={[0.05 + 0.03 * s, 0.09 + 0.03 * s, trunkH, 7]} />
        <M c="#8a5b35" />
      </mesh>
      <mesh position={[0.08 * s, trunkH * 0.82, 0]} rotation={[0, 0, -0.7]}>
        <cylinderGeometry args={[0.025, 0.04, 0.26 * s, 5]} />
        <M c="#8a5b35" />
      </mesh>
      {lumps.map(([x, y, z, k], i) => (
        <mesh key={i} position={[x * R * 0.62, cy + y * R * 0.62, z * R * 0.62]}>
          <sphereGeometry args={[R * 0.62 * k + 0.05, 12, 10]} />
          <M c={i % 2 ? t.leaf2 : t.leaf} />
        </mesh>
      ))}
      {!ripe && grown >= 0.7 &&
        spots.slice(0, 6).map((p, i) => (
          <mesh key={`b${i}`} position={place(p)}>
            <sphereGeometry args={[0.04, 6, 6]} />
            <M c={t.blossom} />
          </mesh>
        ))}
      {ripe &&
        spots.map((p, i) => (
          <group key={`f${i}`} position={place(p)}>
            <mesh scale={t.pear ? [0.9, 1.2, 0.9] : [1, 1, 1]}>
              <sphereGeometry args={[t.pear ? 0.06 : 0.072, 9, 8]} />
              <M c={t.fruit} />
            </mesh>
            {t.pear && (
              <mesh position={[0, 0.08, 0]}>
                <sphereGeometry args={[0.04, 7, 6]} />
                <M c={t.fruit} />
              </mesh>
            )}
            <mesh position={[0.012, (t.pear ? 0.13 : 0.075), 0]} rotation={[0, 0, 0.5]} scale={[1.6, 0.4, 0.9]}>
              <sphereGeometry args={[0.025, 5, 4]} />
              <M c="#4f9c3f" />
            </mesh>
          </group>
        ))}
    </group>
  )
}

const SPOTS: Record<string, [number, number][]> = {
  rice: [
    [-0.4, -0.4],
    [0.4, -0.4],
    [-0.4, 0],
    [0.4, 0],
    [-0.4, 0.4],
    [0.4, 0.4],
  ],
  potato: [
    [-0.38, -0.34],
    [0.38, -0.34],
    [0, 0],
    [-0.38, 0.34],
    [0.38, 0.34],
  ],
  corn: [
    [-0.36, -0.28],
    [0.36, -0.28],
    [0, 0.34],
  ],
}

// 밭 위에서 자라는 작물
export function CropView({ crop, now }: { crop: CropState; now: number }) {
  const def = CROP_MAP[crop.seed]
  const root = useRef<THREE.Group>(null)

  useFrame((st) => {
    const g = root.current
    if (!g) return
    const t = st.clock.elapsedTime
    g.children.forEach((c, i) => {
      c.rotation.z = Math.sin(t * 1.4 + i * 1.7) * 0.035
      c.rotation.x = Math.cos(t * 1.1 + i * 2.3) * 0.025
    })
  })
  if (!def) return null

  const grown = Math.min(1, crop.waterCount / def.waterGoal)
  const ripe = crop.waterCount >= def.waterGoal && now - crop.plantedAt >= def.minGrowMs
  const s = 0.3 + 0.7 * (ripe ? 1 : Math.min(grown, 0.95))
  const tree = crop.seed in TREES

  return (
    <group position={[0, 0.12, 0]} ref={root}>
      {tree ? (
        <group>
          <FruitTree id={crop.seed} s={s} grown={grown} ripe={ripe} />
        </group>
      ) : (
        (SPOTS[crop.seed] ?? SPOTS.rice).map(([x, z], i) => (
          <group key={i} position={[x, 0, z]} rotation={[0, i * 1.3, 0]}>
            {crop.seed === 'potato' ? (
              <Potato s={s} ripe={ripe} />
            ) : crop.seed === 'corn' ? (
              <Corn s={s} ripe={ripe} />
            ) : (
              <Rice s={s} ripe={ripe} />
            )}
          </group>
        ))
      )}
    </group>
  )
}

/* ───────────────────────── 가축 ───────────────────────── */
// 모두 +z 방향을 보고 서 있다. 길이 단위는 월드 기준(우리 안 약 1.6칸).

function Eyes({ y, z, x, r = 0.02 }: { y: number; z: number; x: number; r?: number }) {
  return (
    <>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * x, y, z]}>
          <mesh>
            <sphereGeometry args={[r, 8, 7]} />
            <M c="#26211f" />
          </mesh>
          <mesh position={[r * 0.35, r * 0.4, r * 0.7]}>
            <sphereGeometry args={[r * 0.4, 5, 5]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
      ))}
    </>
  )
}

function Chick({ s = 1, phase = 0 }: { s?: number; phase?: number }) {
  const bob = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)
  useFrame((st) => {
    const t = st.clock.elapsedTime
    if (bob.current) bob.current.position.y = Math.abs(Math.sin(t * 3 + phase)) * 0.018
    if (head.current) head.current.rotation.x = Math.max(0, Math.sin(t * 1.6 + phase)) ** 8 * 0.95
  })
  const Y = '#f8da4e'
  return (
    <group scale={s}>
      <group ref={bob}>
        <mesh position={[0, 0.18, 0]} scale={[1, 0.96, 1.05]}>
          <sphereGeometry args={[0.18, 14, 12]} />
          <M c={Y} />
        </mesh>
        {[-1, 1].map((k) => (
          <mesh key={k} position={[k * 0.165, 0.19, -0.01]} rotation={[0, 0, k * 0.35]} scale={[0.3, 0.85, 1.05]}>
            <sphereGeometry args={[0.09, 8, 7]} />
            <M c="#efc23a" />
          </mesh>
        ))}
        <mesh position={[0, 0.2, -0.17]} rotation={[-1.1, 0, 0]}>
          <coneGeometry args={[0.04, 0.09, 5]} />
          <M c={Y} />
        </mesh>
        <group ref={head} position={[0, 0.36, 0.08]}>
          <mesh>
            <sphereGeometry args={[0.13, 14, 12]} />
            <M c={Y} />
          </mesh>
          <mesh position={[0, 0.0, 0.125]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.03, 0.075, 6]} />
            <M c="#f29a45" />
          </mesh>
          <Eyes x={0.062} y={0.025} z={0.105} r={0.02} />
          {[-1, 1].map((k) => (
            <mesh key={k} position={[k * 0.095, -0.035, 0.085]} scale={[1, 0.65, 0.4]}>
              <sphereGeometry args={[0.027, 7, 6]} />
              <meshToonMaterial gradientMap={toonGradient} color="#ff9e9e" />
            </mesh>
          ))}
          <mesh position={[0, 0.13, 0.0]} rotation={[-0.2, 0, 0]}>
            <coneGeometry args={[0.022, 0.07, 5]} />
            <M c={Y} />
          </mesh>
        </group>
      </group>
      {[-1, 1].map((k) => (
        <group key={k} position={[k * 0.06, 0.0, 0.03]}>
          <mesh position={[0, 0.03, 0]}>
            <cylinderGeometry args={[0.011, 0.011, 0.06, 5]} />
            <M c="#f29a45" />
          </mesh>
          <mesh position={[0, 0.006, 0.025]} scale={[1.6, 0.5, 2]}>
            <boxGeometry args={[0.025, 0.02, 0.025]} />
            <M c="#f29a45" />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function Hen() {
  const bob = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)
  const tail = useRef<THREE.Group>(null)
  useFrame((st) => {
    const t = st.clock.elapsedTime
    if (bob.current) bob.current.position.y = Math.sin(t * 2.2) * 0.012
    if (head.current) head.current.rotation.x = Math.max(0, Math.sin(t * 1.3)) ** 10 * 0.9
    if (tail.current) tail.current.rotation.z = Math.sin(t * 5) * 0.06
  })
  const W = '#f8f4ea'
  return (
    <group>
      <group ref={bob}>
        <mesh position={[0, 0.4, 0]} scale={[1, 0.93, 1.2]}>
          <sphereGeometry args={[0.27, 16, 14]} />
          <M c={W} />
        </mesh>
        {[-1, 1].map((k) => (
          <mesh key={k} position={[k * 0.25, 0.4, -0.03]} rotation={[0, 0, k * 0.15]} scale={[0.26, 0.8, 1.15]}>
            <sphereGeometry args={[0.16, 10, 8]} />
            <M c="#efe5d0" />
          </mesh>
        ))}
        <group ref={tail} position={[0, 0.5, -0.31]}>
          {[-0.5, 0, 0.5].map((a, i) => (
            <mesh key={i} position={[a * 0.16, 0.06, -0.02]} rotation={[-0.55, 0, a * 0.6]} scale={[0.5, 1.5, 0.6]}>
              <sphereGeometry args={[0.1, 8, 7]} />
              <M c={i === 1 ? '#e9d9b8' : W} />
            </mesh>
          ))}
        </group>
        <group ref={head} position={[0, 0.66, 0.25]}>
          <mesh>
            <sphereGeometry args={[0.135, 14, 12]} />
            <M c={W} />
          </mesh>
          <mesh position={[0, -0.005, 0.13]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.035, 0.085, 6]} />
            <M c="#f2a043" />
          </mesh>
          {[0.0, 0.05, -0.05].map((z, i) => (
            <mesh key={i} position={[0, 0.135 - Math.abs(z) * 0.5, z]}>
              <sphereGeometry args={[0.04 - i * 0.004, 7, 6]} />
              <M c="#e04642" />
            </mesh>
          ))}
          <mesh position={[0, -0.095, 0.1]} scale={[0.8, 1.3, 0.8]}>
            <sphereGeometry args={[0.032, 7, 6]} />
            <M c="#e04642" />
          </mesh>
          <Eyes x={0.07} y={0.03} z={0.11} r={0.02} />
        </group>
      </group>
      {[-1, 1].map((k) => (
        <group key={k} position={[k * 0.1, 0, 0.03]}>
          <mesh position={[0, 0.1, 0]}>
            <cylinderGeometry args={[0.016, 0.018, 0.2, 5]} />
            <M c="#f2a043" />
          </mesh>
          <mesh position={[0, 0.012, 0.03]} scale={[1.4, 0.4, 2.2]}>
            <boxGeometry args={[0.04, 0.025, 0.04]} />
            <M c="#f2a043" />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function Sheep() {
  const bob = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)
  useFrame((st) => {
    const t = st.clock.elapsedTime
    if (bob.current) bob.current.position.y = Math.sin(t * 1.8) * 0.01
    if (head.current) head.current.rotation.x = Math.max(0, Math.sin(t * 0.7)) ** 3 * 0.45
  })
  const WOOL = '#f8f4e9'
  const lumps: [number, number, number, number][] = [
    [0.2, 0.7, 0.12, 0.2],
    [-0.2, 0.7, 0.1, 0.2],
    [0, 0.76, -0.12, 0.21],
    [0.27, 0.46, -0.22, 0.2],
    [-0.27, 0.46, -0.22, 0.2],
    [0.3, 0.42, 0.2, 0.19],
    [-0.3, 0.42, 0.2, 0.19],
    [0, 0.4, -0.38, 0.2],
    [0, 0.52, 0.34, 0.18],
  ]
  const dark = '#4a4440'
  return (
    <group>
      <group ref={bob}>
        <mesh position={[0, 0.5, 0]} scale={[1, 0.9, 1.22]}>
          <sphereGeometry args={[0.34, 14, 12]} />
          <M c={WOOL} />
        </mesh>
        {lumps.map(([x, y, z, r], i) => (
          <mesh key={i} position={[x, y, z]}>
            <sphereGeometry args={[r, 10, 9]} />
            <M c={WOOL} />
          </mesh>
        ))}
        <group ref={head} position={[0, 0.56, 0.44]}>
          <mesh scale={[0.92, 1, 1.12]}>
            <sphereGeometry args={[0.165, 14, 12]} />
            <M c={dark} />
          </mesh>
          <mesh position={[0, 0.14, -0.02]}>
            <sphereGeometry args={[0.1, 9, 8]} />
            <M c={WOOL} />
          </mesh>
          {[-1, 1].map((k) => (
            <mesh key={k} position={[k * 0.19, 0.03, -0.02]} rotation={[0, 0, k * 0.55]} scale={[1.5, 0.38, 0.8]}>
              <sphereGeometry args={[0.07, 8, 7]} />
              <M c={dark} />
            </mesh>
          ))}
          <Eyes x={0.075} y={0.04} z={0.135} r={0.022} />
          <mesh position={[0, -0.04, 0.17]} scale={[1.1, 0.8, 0.8]}>
            <sphereGeometry args={[0.04, 7, 6]} />
            <M c="#e9a5a0" />
          </mesh>
        </group>
        <mesh position={[0, 0.5, -0.45]}>
          <sphereGeometry args={[0.085, 8, 7]} />
          <M c={WOOL} />
        </mesh>
      </group>
      {[
        [-0.17, 0.21],
        [0.17, 0.21],
        [-0.17, -0.22],
        [0.17, -0.22],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.13, z]}>
          <cylinderGeometry args={[0.04, 0.045, 0.27, 6]} />
          <M c={dark} />
        </mesh>
      ))}
    </group>
  )
}

function Cow() {
  const bob = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)
  const tail = useRef<THREE.Group>(null)
  const ears = useRef<THREE.Group>(null)
  useFrame((st) => {
    const t = st.clock.elapsedTime
    if (bob.current) bob.current.position.y = Math.sin(t * 1.6) * 0.012
    if (head.current) head.current.rotation.x = Math.max(0, Math.sin(t * 0.55)) ** 3 * 0.5
    if (tail.current) tail.current.rotation.z = Math.sin(t * 2.4) * 0.28
    if (ears.current) ears.current.rotation.z = Math.max(0, Math.sin(t * 3.1)) ** 12 * 0.35
  })
  const W = '#f8f5ee'
  const K = '#2f2a28'
  const patches: { p: [number, number, number]; s: [number, number, number] }[] = [
    { p: [0.1, 0.9, 0.1], s: [1.1, 0.45, 1.2] },
    { p: [-0.18, 0.84, -0.2], s: [1, 0.45, 1.1] },
    { p: [0.27, 0.62, -0.1], s: [0.45, 1.05, 1.15] },
    { p: [-0.27, 0.58, 0.15], s: [0.45, 1, 1] },
  ]
  return (
    <group>
      <group ref={bob}>
        <mesh position={[0, 0.66, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <capsuleGeometry args={[0.27, 0.44, 6, 14]} />
          <M c={W} />
        </mesh>
        {patches.map((p, i) => (
          <mesh key={i} position={p.p} scale={p.s}>
            <sphereGeometry args={[0.12, 9, 8]} />
            <M c={K} />
          </mesh>
        ))}
        <mesh position={[0, 0.42, -0.2]} scale={[1, 0.7, 1.2]}>
          <sphereGeometry args={[0.1, 9, 8]} />
          <M c="#f4b7b0" />
        </mesh>
        <group ref={head} position={[0, 0.76, 0.52]}>
          <mesh scale={[0.95, 0.92, 1.05]}>
            <sphereGeometry args={[0.2, 14, 12]} />
            <M c={W} />
          </mesh>
          <mesh position={[0.1, 0.1, 0.07]} scale={[1, 1, 0.45]}>
            <sphereGeometry args={[0.07, 8, 7]} />
            <M c={K} />
          </mesh>
          <mesh position={[0, -0.08, 0.15]} scale={[1.05, 0.78, 0.85]}>
            <sphereGeometry args={[0.125, 12, 10]} />
            <M c="#f4b7b0" />
          </mesh>
          {[-1, 1].map((k) => (
            <mesh key={k} position={[k * 0.04, -0.07, 0.255]}>
              <sphereGeometry args={[0.014, 5, 5]} />
              <M c="#9a5a58" />
            </mesh>
          ))}
          <Eyes x={0.095} y={0.05} z={0.15} r={0.024} />
          <group ref={ears}>
            {[-1, 1].map((k) => (
              <mesh key={k} position={[k * 0.22, 0.06, -0.03]} rotation={[0, 0, k * 0.5]} scale={[1.6, 0.42, 0.85]}>
                <sphereGeometry args={[0.07, 8, 7]} />
                <M c={k === 1 ? K : W} />
              </mesh>
            ))}
          </group>
          {[-1, 1].map((k) => (
            <mesh key={k} position={[k * 0.11, 0.2, -0.01]} rotation={[0, 0, -k * 0.35]}>
              <coneGeometry args={[0.028, 0.1, 6]} />
              <M c="#f1e2b8" />
            </mesh>
          ))}
        </group>
        <group ref={tail} position={[0, 0.78, -0.5]}>
          <mesh position={[0, -0.15, -0.03]} rotation={[0.2, 0, 0]}>
            <cylinderGeometry args={[0.014, 0.018, 0.34, 5]} />
            <M c={W} />
          </mesh>
          <mesh position={[0, -0.34, -0.06]}>
            <sphereGeometry args={[0.05, 7, 6]} />
            <M c={K} />
          </mesh>
        </group>
      </group>
      {[
        [-0.17, 0.27],
        [0.17, 0.27],
        [-0.17, -0.27],
        [0.17, -0.27],
      ].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.062, 0.068, 0.4, 7]} />
            <M c={W} />
          </mesh>
          <mesh position={[0, 0.025, 0]}>
            <cylinderGeometry args={[0.07, 0.072, 0.05, 7]} />
            <M c="#4a3f3a" />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// 우리 안의 가축
export function AnimalView({ animal }: { animal: AnimalState }) {
  const def = ANIMAL_MAP[animal.species]
  if (!def) return null
  return (
    <group position={[0, 0.06, 0.22]} rotation={[0, 0.35, 0]}>
      {animal.species === 'chick' && (
        <>
          <group position={[0.22, 0, 0.1]}>
            <Chick s={1.4} />
          </group>
          <group position={[-0.34, 0, -0.08]} rotation={[0, -0.8, 0]}>
            <Chick s={1.05} phase={1.7} />
          </group>
        </>
      )}
      {animal.species === 'hen' && (
        <group scale={1.2}>
          <Hen />
        </group>
      )}
      {animal.species === 'sheep' && <Sheep />}
      {animal.species === 'cow' && (
        <group scale={0.88} position={[0, 0, -0.04]}>
          <Cow />
        </group>
      )}
    </group>
  )
}

// 밭/우리 위에 뜨는 알림 구슬 (파랑 = 돌볼 시간, 금색 = 거둘 시간)
export function Beacon({ color }: { color: string }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((s) => {
    if (ref.current) ref.current.position.y = 2.2 + Math.sin(s.clock.elapsedTime * 3) * 0.14
  })
  return (
    <mesh ref={ref} position={[0, 2.2, 0]}>
      <sphereGeometry args={[0.17, 12, 10]} />
      <meshBasicMaterial color={color} />
    </mesh>
  )
}

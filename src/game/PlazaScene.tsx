import { useMemo, useRef } from 'react'
import { Html, Instance, Instances } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { toonGradient } from './toon'
import { Toon } from './wearKit'
import { BEDS, BENCHES, FEATURES, FOUNTAIN, GATE_Z, GAZEBO_POSTS, HIDEOUTS, LAMPS, PAVING_R, PLAZA_RADIUS, STAGE, TREES } from './plaza'

// 도토리 광장의 모습 — 가운데 분수, 둘레의 돌바닥·벤치·가로등·꽃밭, 가장자리의 나무, 북쪽 무대,
// 숨을 수 있는 수풀·텐트·통(숨바꼭질용). 그림자·조명은 Scene이 맡는다.

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* ---------- 땅·물 ---------- */
function Ground() {
  const water = useRef<THREE.MeshBasicMaterial>(null)
  useFrame((s) => {
    if (water.current) water.current.color.setHSL(0.52, 0.44, 0.52 + Math.sin(s.clock.elapsedTime * 0.5) * 0.03)
  })
  const R = PLAZA_RADIUS + 1.4
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
        <planeGeometry args={[600, 600]} />
        <meshBasicMaterial ref={water} color="#4fb4c6" />
      </mesh>
      {/* 섬 옆면 (모래) */}
      <mesh position={[0, -0.34, 0]}>
        <cylinderGeometry args={[R + 0.15, R - 0.35, 0.6, 56]} />
        <Toon color="#e7d3a0" />
      </mesh>
      {/* 잔디 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0, 0]}>
        <circleGeometry args={[R, 56]} />
        <Toon color="#79c968" />
      </mesh>
      {/* 바깥 둘레 돌 테두리 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[R - 0.45, R, 56]} />
        <Toon color="#cfc7b2" />
      </mesh>
    </group>
  )
}

/* ---------- 돌바닥 ---------- */
function Paving() {
  const tiles = useMemo(() => {
    const rng = mulberry32(11)
    const list: { x: number; z: number; r: number; c: string }[] = []
    const cols = ['#ded7c5', '#d3ccb7', '#e8e2d2', '#c9c2ad']
    for (let r = 3.9; r <= PAVING_R - 0.4; r += 0.58) {
      const n = Math.round((Math.PI * 2 * r) / 0.58)
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + r * 0.7
        list.push({ x: Math.sin(a) * r, z: Math.cos(a) * r, r: a, c: cols[(rng() * cols.length) | 0] })
      }
    }
    return list
  }, [])
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <circleGeometry args={[PAVING_R - 0.1, 64]} />
        <Toon color="#d6cfbb" />
      </mesh>
      <Instances limit={1400} range={tiles.length}>
        <cylinderGeometry args={[0.27, 0.27, 0.05, 6]} />
        <meshToonMaterial gradientMap={toonGradient} />
        {tiles.map((t, i) => (
          <Instance key={i} position={[t.x, 0.03, t.z]} rotation={[0, t.r, 0]} color={t.c} />
        ))}
      </Instances>
      {/* 네 방향으로 뻗는 길 */}
      {[0, 1, 2, 3].map((i) => {
        const a = (i * Math.PI) / 2
        const len = PLAZA_RADIUS + 1.1 - PAVING_R
        const mid = PAVING_R - 0.2 + len / 2
        return (
          <group key={i} position={[Math.sin(a) * mid, 0.02, Math.cos(a) * mid]} rotation={[0, a, 0]}>
            <mesh>
              <boxGeometry args={[2.6, 0.04, len]} />
              <Toon color="#e6dfcc" />
            </mesh>
            {[-1, 1].map((s) => (
              <mesh key={s} position={[s * 1.3, 0.03, 0]}>
                <boxGeometry args={[0.14, 0.05, len]} />
                <Toon color="#b9b19a" />
              </mesh>
            ))}
          </group>
        )
      })}
    </group>
  )
}

/* ---------- 분수 ---------- */
function Fountain() {
  const drops = useRef<(THREE.Mesh | null)[]>([])
  const water = useRef<THREE.MeshBasicMaterial>(null)
  const N = 14
  useFrame((s) => {
    const t = s.clock.elapsedTime
    for (let i = 0; i < N; i++) {
      const m = drops.current[i]
      if (!m) continue
      const ph = (t * 0.9 + i / N) % 1 // 0~1: 솟았다가 떨어진다
      const a = (i / N) * Math.PI * 2 + (i % 2) * 0.3
      const reach = 0.25 + ph * (i % 3 === 0 ? 1.25 : 0.95)
      m.position.set(Math.sin(a) * reach, 2.05 + 1.6 * ph * (1 - ph) * 2.4 - ph * 0.6, Math.cos(a) * reach)
      m.scale.setScalar(1 - ph * 0.35)
    }
    if (water.current) water.current.color.setHSL(0.54, 0.62, 0.62 + Math.sin(t * 1.6) * 0.04)
  })
  return (
    <group position={[FOUNTAIN.x, 0, FOUNTAIN.z]} scale={FOUNTAIN.scale}>
      {/* 아랫물받이 */}
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[2.45, 2.55, 0.6, 28]} />
        <Toon color="#d8d1be" />
      </mesh>
      <mesh position={[0, 0.62, 0]}>
        <cylinderGeometry args={[2.55, 2.55, 0.1, 28]} />
        <Toon color="#efe8d6" />
      </mesh>
      <mesh position={[0, 0.58, 0]}>
        <cylinderGeometry args={[2.2, 2.2, 0.06, 28]} />
        <meshBasicMaterial ref={water} color="#6fcfe2" />
      </mesh>
      {/* 기둥 + 윗물받이 */}
      <mesh position={[0, 1.1, 0]}>
        <cylinderGeometry args={[0.32, 0.45, 1.0, 14]} />
        <Toon color="#e3dcc8" />
      </mesh>
      <mesh position={[0, 1.65, 0]}>
        <cylinderGeometry args={[1.25, 0.5, 0.4, 20]} />
        <Toon color="#efe8d6" />
      </mesh>
      <mesh position={[0, 1.85, 0]}>
        <cylinderGeometry args={[1.12, 1.12, 0.04, 20]} />
        <meshBasicMaterial color="#8fdcec" />
      </mesh>
      <mesh position={[0, 2.1, 0]}>
        <sphereGeometry args={[0.2, 12, 10]} />
        <Toon color="#e3dcc8" />
      </mesh>
      {Array.from({ length: N }, (_, i) => (
        <mesh key={i} ref={(m) => void (drops.current[i] = m)} position={[0, 2.1, 0]}>
          <sphereGeometry args={[0.07, 6, 6]} />
          <meshBasicMaterial color="#bdeefa" />
        </mesh>
      ))}
      {/* 가장자리 장식 돌 */}
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.sin(a) * 2.55, 0.72, Math.cos(a) * 2.55]}>
            <sphereGeometry args={[0.16, 8, 6]} />
            <Toon color="#e9e2cf" />
          </mesh>
        )
      })}
    </group>
  )
}

/* ---------- 벤치·가로등·꽃밭 ---------- */
function Benches() {
  return (
    <group>
      {BENCHES.map((b, i) => (
        <group key={i} position={[b.x, 0, b.z]} rotation={[0, b.a + Math.PI, 0]}>
          <mesh position={[0, 0.42, 0]}>
            <boxGeometry args={[1.25, 0.08, 0.42]} />
            <Toon color="#b98552" />
          </mesh>
          <mesh position={[0, 0.72, -0.2]} rotation={[-0.15, 0, 0]}>
            <boxGeometry args={[1.25, 0.34, 0.06]} />
            <Toon color="#a8743f" />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.55, 0.2, 0]}>
              <boxGeometry args={[0.1, 0.4, 0.38]} />
              <Toon color="#6b6f78" />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

function Lamps() {
  return (
    <group>
      {LAMPS.map((l, i) => (
        <group key={i} position={[l.x, 0, l.z]}>
          <mesh position={[0, 0.12, 0]}>
            <cylinderGeometry args={[0.2, 0.26, 0.24, 10]} />
            <Toon color="#4b4f58" />
          </mesh>
          <mesh position={[0, 1.25, 0]}>
            <cylinderGeometry args={[0.05, 0.07, 2.2, 8]} />
            <Toon color="#4b4f58" />
          </mesh>
          <mesh position={[0, 2.45, 0]}>
            <sphereGeometry args={[0.2, 12, 10]} />
            <Toon color="#fff0b8" emissive="#ffd98a" ei={0.9} />
          </mesh>
          <mesh position={[0, 2.68, 0]}>
            <coneGeometry args={[0.26, 0.2, 10]} />
            <Toon color="#4b4f58" />
          </mesh>
        </group>
      ))}
    </group>
  )
}

const FLOWER_COLS = ['#ff8fb1', '#ffd36e', '#fdf1fa', '#b39df0', '#ff9f6b', '#8ec5ff']
function Beds() {
  const flowers = useMemo(() => {
    const rng = mulberry32(5)
    return BEDS.map((b, bi) =>
      Array.from({ length: 22 }, () => {
        const a = rng() * Math.PI * 2
        const d = Math.sqrt(rng()) * (b.r - 0.25)
        return { x: Math.sin(a) * d, z: Math.cos(a) * d, c: FLOWER_COLS[(bi + ((rng() * 3) | 0)) % FLOWER_COLS.length], s: 0.8 + rng() * 0.6 }
      }),
    )
  }, [])
  return (
    <group>
      {BEDS.map((b, bi) => (
        <group key={bi} position={[b.x, 0, b.z]}>
          <mesh position={[0, 0.17, 0]}>
            <cylinderGeometry args={[b.r, b.r + 0.05, 0.34, 20]} />
            <Toon color="#d8d1be" />
          </mesh>
          <mesh position={[0, 0.35, 0]}>
            <cylinderGeometry args={[b.r - 0.12, b.r - 0.12, 0.06, 20]} />
            <Toon color="#7a5a3a" />
          </mesh>
          {flowers[bi].map((f, i) => (
            <group key={i} position={[f.x, 0.38, f.z]}>
              <mesh position={[0, 0.12 * f.s, 0]}>
                <cylinderGeometry args={[0.012, 0.012, 0.24 * f.s, 4]} />
                <Toon color="#4f9a3f" />
              </mesh>
              <mesh position={[0, 0.26 * f.s, 0]}>
                <sphereGeometry args={[0.085 * f.s, 8, 6]} />
                <Toon color={f.c} />
              </mesh>
            </group>
          ))}
          <mesh position={[0, 0.6, 0]}>
            <sphereGeometry args={[0.18, 8, 8]} />
            <Toon color="#5fb44a" />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/* ---------- 나무 ---------- */
function Trees() {
  return (
    <group>
      {TREES.map((t, i) => {
        const pine = i % 3 === 1
        const sc = 0.9 + ((i * 37) % 10) / 25
        return (
          <group key={i} position={[t.x, 0, t.z]} scale={sc} rotation={[0, i * 1.7, 0]}>
            <mesh position={[0, 0.7, 0]}>
              <cylinderGeometry args={[0.16, 0.24, 1.4, 8]} />
              <Toon color="#8a5a34" />
            </mesh>
            {pine ? (
              <>
                {[1.5, 2.15, 2.75].map((y, k) => (
                  <mesh key={k} position={[0, y, 0]}>
                    <coneGeometry args={[1.05 - k * 0.28, 1.1, 9]} />
                    <Toon color={['#3f9a55', '#4aa85e', '#58b86a'][k]} />
                  </mesh>
                ))}
              </>
            ) : (
              <>
                <mesh position={[0, 2.1, 0]}>
                  <sphereGeometry args={[1.1, 12, 10]} />
                  <Toon color="#59b86a" />
                </mesh>
                <mesh position={[0.6, 1.7, 0.25]}>
                  <sphereGeometry args={[0.7, 10, 8]} />
                  <Toon color="#6ac77a" />
                </mesh>
                <mesh position={[-0.55, 1.85, -0.3]}>
                  <sphereGeometry args={[0.75, 10, 8]} />
                  <Toon color="#4fae60" />
                </mesh>
              </>
            )}
          </group>
        )
      })}
    </group>
  )
}

/* ---------- 숨을 수 있는 곳 ---------- */
function Hideouts() {
  return (
    <group>
      {HIDEOUTS.map((h, i) => {
        if (h.kind === 'bush')
          return (
            <group key={h.id} position={[h.x, 0, h.z]} rotation={[0, i * 1.3, 0]}>
              {(
                [
                  [0, 0.55, 0, 0.8],
                  [0.5, 0.42, 0.2, 0.55],
                  [-0.5, 0.45, -0.1, 0.6],
                  [0.1, 0.5, -0.5, 0.55],
                  [-0.1, 0.4, 0.5, 0.5],
                ] as [number, number, number, number][]
              ).map(([x, y, z, r], k) => (
                <mesh key={k} position={[x, y, z]}>
                  <sphereGeometry args={[r, 12, 10]} />
                  <Toon color={['#4fa75a', '#5db868', '#46995a'][(i + k) % 3]} />
                </mesh>
              ))}
              {[0, 1, 2, 3].map((k) => (
                <mesh key={`f${k}`} position={[Math.sin(k * 1.7 + i) * 0.7, 0.75 + (k % 2) * 0.1, Math.cos(k * 1.7 + i) * 0.7]}>
                  <sphereGeometry args={[0.07, 6, 6]} />
                  <Toon color={FLOWER_COLS[(i + k) % FLOWER_COLS.length]} />
                </mesh>
              ))}
            </group>
          )
        if (h.kind === 'tent')
          return (
            <group key={h.id} position={[h.x, 0, h.z]} rotation={[0, h.x > 0 ? -0.9 : 0.9, 0]}>
              <mesh position={[0, 0.85, 0]}>
                <coneGeometry args={[1.45, 1.7, 4]} />
                <Toon color={h.x > 0 ? '#e8624f' : '#4a90e2'} />
              </mesh>
              <mesh position={[0, 0.7, 1.0]} rotation={[0.45, 0, 0]}>
                <boxGeometry args={[0.7, 1.05, 0.04]} />
                <Toon color="#2d2f36" />
              </mesh>
              <mesh position={[0, 1.78, 0]}>
                <cylinderGeometry args={[0.02, 0.02, 0.4, 6]} />
                <Toon color="#8a5a34" />
              </mesh>
              <mesh position={[0.14, 1.9, 0]} scale={[1, 0.7, 0.15]}>
                <boxGeometry args={[0.3, 0.2, 0.1]} />
                <Toon color="#f2c94e" />
              </mesh>
            </group>
          )
        return (
          <group key={h.id} position={[h.x, 0, h.z]}>
            <mesh position={[0, 0.4, 0]}>
              <cylinderGeometry args={[0.42, 0.38, 0.8, 12]} />
              <Toon color="#b98552" />
            </mesh>
            {[0.18, 0.62].map((y) => (
              <mesh key={y} position={[0, y, 0]}>
                <cylinderGeometry args={[0.435, 0.435, 0.06, 12]} />
                <Toon color="#5a5e68" />
              </mesh>
            ))}
          </group>
        )
      })}
    </group>
  )
}

/* ---------- 무대 ---------- */
function Stage() {
  const flags = useMemo(() => Array.from({ length: 12 }, (_, i) => i), [])
  const cols = ['#ff7aa8', '#ffd36e', '#7fd6ff', '#9be07a', '#b39df0']
  return (
    <group position={[STAGE.x, 0, STAGE.z]}>
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[STAGE.w, 0.6, STAGE.d]} />
        <Toon color="#b98552" />
      </mesh>
      <mesh position={[0, 0.62, 0]}>
        <boxGeometry args={[STAGE.w - 0.2, 0.05, STAGE.d - 0.2]} />
        <Toon color="#d9a86a" />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (STAGE.w / 2 - 0.3), 1.8, -STAGE.d / 2 + 0.3]}>
          <cylinderGeometry args={[0.1, 0.12, 2.4, 8]} />
          <Toon color="#8a5a34" />
        </mesh>
      ))}
      <mesh position={[0, 2.95, -STAGE.d / 2 + 0.3]}>
        <boxGeometry args={[STAGE.w, 0.12, 0.2]} />
        <Toon color="#8a5a34" />
      </mesh>
      {/* 뒷막 */}
      <mesh position={[0, 1.75, -STAGE.d / 2 + 0.25]}>
        <boxGeometry args={[STAGE.w - 0.8, 2.2, 0.06]} />
        <Toon color="#6a5fd0" />
      </mesh>
      {/* 깃발 줄 */}
      {flags.map((i) => {
        const x = -STAGE.w / 2 + 0.35 + (i * (STAGE.w - 0.7)) / 11
        return (
          <mesh key={i} position={[x, 2.78 - Math.sin((i / 11) * Math.PI) * -0.0, -STAGE.d / 2 + 0.5]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.16, 0.3, 3]} />
            <Toon color={cols[i % cols.length]} />
          </mesh>
        )
      })}
      <Html position={[0, 1.9, -STAGE.d / 2 + 0.35]} center zIndexRange={[4, 0]} style={{ pointerEvents: 'none' }}>
        <div className="plaza-sign small">🎤 무대</div>
      </Html>
    </group>
  )
}

/* ---------- 입구 ---------- */
function Gate() {
  return (
    <group position={[0, 0, GATE_Z + 0.9]}>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 2.4, 0, 0]}>
          <mesh position={[0, 1.4, 0]}>
            <cylinderGeometry args={[0.34, 0.4, 2.8, 12]} />
            <Toon color="#e3dcc8" />
          </mesh>
          <mesh position={[0, 2.9, 0]}>
            <sphereGeometry args={[0.42, 12, 10]} />
            <Toon color="#efe8d6" />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 2.5, 0]}>
        <boxGeometry args={[4.8, 0.3, 0.4]} />
        <Toon color="#d8d1be" />
      </mesh>
      <Html position={[0, 3.45, 0]} center zIndexRange={[4, 0]} style={{ pointerEvents: 'none' }}>
        <div className="plaza-sign">🏛️ 도토리 광장</div>
      </Html>
    </group>
  )
}


/* ---------- 네 모퉁이: 연못·정자·놀이터·소풍 ---------- */
function Pond({ r }: { r: number }) {
  const w = useRef<THREE.MeshBasicMaterial>(null)
  const ducks = useRef<(THREE.Group | null)[]>([])
  useFrame((st) => {
    const t = st.clock.elapsedTime
    if (w.current) w.current.color.setHSL(0.53, 0.55, 0.55 + Math.sin(t * 0.9) * 0.04)
    ducks.current.forEach((d, i) => {
      if (!d) return
      const a = t * (0.25 + i * 0.07) + i * 2.4
      d.position.set(Math.sin(a) * r * 0.5, 0.06 + Math.sin(t * 3 + i) * 0.015, Math.cos(a * 1.2) * r * 0.45)
      d.rotation.y = a + Math.PI / 2
    })
  })
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}>
        <circleGeometry args={[r, 32]} />
        <meshBasicMaterial ref={w} color="#5fc4d8" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <ringGeometry args={[r, r + 0.4, 32]} />
        <Toon color="#cfc7b2" />
      </mesh>
      {Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.sin(a) * (r + 0.25), 0.12, Math.cos(a) * (r + 0.25)]} scale={[1, 0.7, 1]}>
            <sphereGeometry args={[0.22 + (i % 3) * 0.05, 8, 6]} />
            <Toon color={['#b9b19a', '#d6cfbb', '#a69f8a'][i % 3]} />
          </mesh>
        )
      })}
      {[
        [-1.0, 0.6, 0.45],
        [0.8, -0.8, 0.5],
        [1.4, 1.0, 0.38],
        [-0.4, -1.4, 0.4],
      ].map(([x, z, s], i) => (
        <group key={i} position={[x, 0.05, z]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[s, 12]} />
            <Toon color="#58b24a" />
          </mesh>
          {i % 2 === 0 && (
            <mesh position={[0.05, 0.06, 0]}>
              <sphereGeometry args={[0.1, 8, 6]} />
              <Toon color="#ff8fb1" />
            </mesh>
          )}
        </group>
      ))}
      {[0, 1].map((i) => (
        <group key={i} ref={(g) => void (ducks.current[i] = g)}>
          <mesh position={[0, 0.12, 0]} scale={[1.2, 0.8, 1]}>
            <sphereGeometry args={[0.2, 10, 8]} />
            <Toon color="#ffe055" />
          </mesh>
          <mesh position={[0.15, 0.28, 0]}>
            <sphereGeometry args={[0.12, 10, 8]} />
            <Toon color="#ffe055" />
          </mesh>
          <mesh position={[0.28, 0.27, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <coneGeometry args={[0.04, 0.1, 6]} />
            <Toon color="#f08a2c" />
          </mesh>
        </group>
      ))}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * (r + 0.7), 0, s * 0.5]}>
          {[0, 1, 2].map((k) => (
            <mesh key={k} position={[k * 0.12 - 0.1, 0.5 + k * 0.08, k * 0.1]} rotation={[0, 0, (k - 1) * 0.12]}>
              <cylinderGeometry args={[0.02, 0.03, 1.0 + k * 0.15, 5]} />
              <Toon color="#7fae4a" />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

function Gazebo({ r }: { r: number }) {
  return (
    <group>
      <mesh position={[0, 0.14, 0]} rotation={[0, Math.PI / 6, 0]}>
        <cylinderGeometry args={[r, r + 0.08, 0.28, 6]} />
        <Toon color="#c99a62" />
      </mesh>
      {GAZEBO_POSTS.map((p, i) => {
        const g = FEATURES.find((f) => f.kind === 'gazebo')!
        return (
          <mesh key={i} position={[p.x - g.x, 1.55, p.z - g.z]}>
            <cylinderGeometry args={[0.1, 0.12, 2.6, 8]} />
            <Toon color="#f1e8d4" />
          </mesh>
        )
      })}
      <mesh position={[0, 3.0, 0]} rotation={[0, Math.PI / 6, 0]}>
        <cylinderGeometry args={[r + 0.35, r + 0.35, 0.16, 6]} />
        <Toon color="#8a5a34" />
      </mesh>
      <mesh position={[0, 3.75, 0]} rotation={[0, Math.PI / 6, 0]}>
        <coneGeometry args={[r + 0.55, 1.5, 6]} />
        <Toon color="#d9534a" />
      </mesh>
      <mesh position={[0, 4.65, 0]}>
        <sphereGeometry args={[0.16, 8, 8]} />
        <Toon color="#f2c94e" />
      </mesh>
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2 + 0.5
        return (
          <mesh key={i} position={[Math.sin(a) * 1.0, 0.5, Math.cos(a) * 1.0]} rotation={[0, a, 0]}>
            <boxGeometry args={[0.9, 0.08, 0.34]} />
            <Toon color="#a8743f" />
          </mesh>
        )
      })}
    </group>
  )
}

function Playground() {
  const s1 = useRef<THREE.Group>(null)
  const s2 = useRef<THREE.Group>(null)
  const see = useRef<THREE.Group>(null)
  useFrame((st) => {
    const t = st.clock.elapsedTime
    if (s1.current) s1.current.rotation.x = Math.sin(t * 1.8) * 0.45
    if (s2.current) s2.current.rotation.x = Math.sin(t * 1.8 + 1.4) * 0.4
    if (see.current) see.current.rotation.z = Math.sin(t * 1.2) * 0.2
  })
  return (
    <group>
      {/* 모래밭 */}
      <mesh position={[0, 0.06, 0]}>
        <boxGeometry args={[5.2, 0.12, 4.8]} />
        <Toon color="#ead9a6" />
      </mesh>
      {/* 그네 */}
      <group position={[0, 0, -1.2]}>
        {[-1, 1].map((sx) => (
          <group key={sx}>
            {[-1, 1].map((sz) => (
              <mesh key={sz} position={[sx * 1.55, 1.1, sz * 0.5]} rotation={[sz * -0.22, 0, 0]}>
                <cylinderGeometry args={[0.07, 0.08, 2.4, 6]} />
                <Toon color="#e8624f" />
              </mesh>
            ))}
          </group>
        ))}
        <mesh position={[0, 2.18, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.08, 0.08, 3.3, 8]} />
          <Toon color="#c7473a" />
        </mesh>
        {[
          [-0.7, s1],
          [0.7, s2],
        ].map(([x, ref], i) => (
          <group key={i} position={[x as number, 2.15, 0]} ref={ref as React.RefObject<THREE.Group>}>
            {[-1, 1].map((c) => (
              <mesh key={c} position={[c * 0.22, -0.8, 0]}>
                <cylinderGeometry args={[0.012, 0.012, 1.6, 4]} />
                <Toon color="#6b6f78" />
              </mesh>
            ))}
            <mesh position={[0, -1.62, 0]}>
              <boxGeometry args={[0.6, 0.07, 0.3]} />
              <Toon color="#4a90e2" />
            </mesh>
          </group>
        ))}
      </group>
      {/* 시소 */}
      <group position={[0.2, 0.0, 1.5]}>
        <mesh position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.3, 3]} />
          <Toon color="#6b6f78" />
        </mesh>
        <group ref={see} position={[0, 0.42, 0]}>
          <mesh>
            <boxGeometry args={[2.8, 0.1, 0.34]} />
            <Toon color="#f2c94e" />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 1.2, 0.15, 0]}>
              <boxGeometry args={[0.1, 0.2, 0.3]} />
              <Toon color="#e8624f" />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  )
}

function Picnic() {
  const cols = ['#e8624f', '#fff6e8']
  return (
    <group>
      {Array.from({ length: 4 }, (_, i) =>
        Array.from({ length: 4 }, (_, j) => (
          <mesh key={`${i}${j}`} position={[(i - 1.5) * 0.62, 0.025, (j - 1.5) * 0.62]}>
            <boxGeometry args={[0.62, 0.03, 0.62]} />
            <Toon color={cols[(i + j) % 2]} />
          </mesh>
        )),
      )}
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[0.7, 0.3, 0.5]} />
        <Toon color="#c99a62" />
      </mesh>
      <mesh position={[0, 0.4, 0]} rotation={[0, 0, 0]} scale={[1, 0.8, 1]}>
        <torusGeometry args={[0.22, 0.03, 6, 14, Math.PI]} />
        <Toon color="#8a5a34" />
      </mesh>
      {[[0.6, 0.55], [-0.5, 0.7], [0.75, -0.4]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.12, z]}>
          <sphereGeometry args={[0.11, 8, 8]} />
          <Toon color={['#e0405a', '#ffb347', '#9be07a'][i]} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 1.55, 0.14, s * 0.2]} scale={[1, 0.55, 1]}>
          <sphereGeometry args={[0.3, 10, 8]} />
          <Toon color={s > 0 ? '#b39df0' : '#ff8fb1'} />
        </mesh>
      ))}
      <mesh position={[-1.9, 1.0, -1.3]}>
        <cylinderGeometry args={[0.04, 0.04, 2.0, 6]} />
        <Toon color="#8a5a34" />
      </mesh>
      <mesh position={[-1.9, 2.05, -1.3]}>
        <coneGeometry args={[1.5, 0.55, 10]} />
        <Toon color="#4a90e2" />
      </mesh>
    </group>
  )
}

function Features() {
  return (
    <group>
      {FEATURES.map((f) => (
        <group key={f.id} position={[f.x, 0, f.z]}>
          {f.kind === 'pond' && <Pond r={f.r} />}
          {f.kind === 'gazebo' && <Gazebo r={f.r} />}
          {f.kind === 'playground' && <Playground />}
          {f.kind === 'picnic' && <Picnic />}
        </group>
      ))}
    </group>
  )
}

/* ---------- 풀·꽃 장식 ---------- */
function Detail() {
  const { tufts, flowers } = useMemo(() => {
    const rng = mulberry32(21)
    const ok = (x: number, z: number) => {
      const d = Math.hypot(x, z)
      if (d < PAVING_R + 0.5 || d > PLAZA_RADIUS + 0.6) return false
      // 네 길 위는 비운다
      if ((Math.abs(x) < 1.8 && Math.abs(z) > PAVING_R - 2) || (Math.abs(z) < 1.8 && Math.abs(x) > PAVING_R - 2)) return false
      return true
    }
    const pick = () => {
      for (let k = 0; k < 20; k++) {
        const a = rng() * Math.PI * 2
        const d = PAVING_R + 0.5 + rng() * (PLAZA_RADIUS - PAVING_R)
        const x = Math.sin(a) * d
        const z = Math.cos(a) * d
        if (ok(x, z)) return [x, z] as [number, number]
      }
      return [12, 12] as [number, number]
    }
    const cols = ['#69bd58', '#7bcb67', '#5aa84f', '#86d179']
    return {
      tufts: Array.from({ length: 420 }, () => {
        const [x, z] = pick()
        return { x, z, r: rng() * 3, s: 0.6 + rng() * 0.7, c: cols[(rng() * cols.length) | 0] }
      }),
      flowers: Array.from({ length: 120 }, () => {
        const [x, z] = pick()
        return { x, z, c: FLOWER_COLS[(rng() * FLOWER_COLS.length) | 0] }
      }),
    }
  }, [])
  return (
    <group>
      <Instances limit={500} range={tufts.length}>
        <coneGeometry args={[0.085, 0.32, 4]} />
        <meshToonMaterial gradientMap={toonGradient} />
        {tufts.map((t, i) => (
          <Instance key={i} position={[t.x, 0.13, t.z]} rotation={[0, t.r, 0]} scale={[t.s, t.s, t.s]} color={t.c} />
        ))}
      </Instances>
      <Instances limit={160} range={flowers.length}>
        <sphereGeometry args={[0.09, 6, 5]} />
        <meshToonMaterial gradientMap={toonGradient} />
        {flowers.map((f, i) => (
          <Instance key={i} position={[f.x, 0.16, f.z]} color={f.c} />
        ))}
      </Instances>
    </group>
  )
}

export function Plaza() {
  return (
    <>
      <Ground />
      <Paving />
      <Fountain />
      <Benches />
      <Lamps />
      <Beds />
      <Trees />
      <Hideouts />
      <Features />
      <Stage />
      <Gate />
      <Detail />
    </>
  )
}

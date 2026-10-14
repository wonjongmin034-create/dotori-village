import { useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Toon, Glow, Shaped } from './wearKit'
import { isFamily, type WeaponFamily } from './weapons'

// 무기 3D 모델. 손잡이 한가운데가 원점이고, 무기는 +y 방향(위)으로 뻗는다.
// 단계(tier 1~6)가 올라갈수록 재료(나무→철→은→금·불꽃→룬→전설)와 장식, 빛이 화려해진다.

type Pal = { main: string; dark: string; trim: string; gem: string; glow: string | null }
const PAL: Pal[] = [
  { main: '#c99a62', dark: '#8a5a34', trim: '#a8743f', gem: '#7a5a30', glow: null }, // 0 (안 씀)
  { main: '#c99a62', dark: '#8a5a34', trim: '#a8743f', gem: '#7a5a30', glow: null }, // 1 나무
  { main: '#aab2bd', dark: '#6b4a2f', trim: '#7d8794', gem: '#4a90e2', glow: null }, // 2 철
  { main: '#e3eaf3', dark: '#3b6fd0', trim: '#c9d3e0', gem: '#4a90e2', glow: '#9fd0ff' }, // 3 은빛
  { main: '#f4c24a', dark: '#7a2d1a', trim: '#d9a62e', gem: '#e8402a', glow: '#ff7a3d' }, // 4 금·불꽃
  { main: '#6a5bd0', dark: '#241a55', trim: '#8e7bff', gem: '#b78bff', glow: '#b78bff' }, // 5 룬
  { main: '#fff3c2', dark: '#caa23a', trim: '#ffd966', gem: '#ff7ad9', glow: '#ffe9a0' }, // 6 전설
]

const Bar = ({ p, s, c, r = 0, emissive, ei }: { p: [number, number, number]; s: [number, number, number]; c: string; r?: number; emissive?: string; ei?: number }) => (
  <mesh position={p} rotation={[0, 0, r]}>
    <boxGeometry args={s} />
    <Toon color={c} emissive={emissive} ei={ei} />
  </mesh>
)
const Ball = ({ p, r, c, emissive, ei }: { p: [number, number, number]; r: number; c: string; emissive?: string; ei?: number }) => (
  <mesh position={p}>
    <sphereGeometry args={[r, 12, 10]} />
    <Toon color={c} emissive={emissive} ei={ei} />
  </mesh>
)

// 위쪽에서 빙글빙글 도는 반짝이 (5·6단계)
function Orbit({ y, r, n, c, speed = 1.6, size = 0.07 }: { y: number; r: number; n: number; c: string; speed?: number; size?: number }) {
  const g = useRef<THREE.Group>(null)
  useFrame((s) => {
    if (g.current) g.current.rotation.y = s.clock.elapsedTime * speed
  })
  return (
    <group ref={g} position={[0, y, 0]}>
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2
        return <Shaped key={i} kind="star" size={size} color={c} glow depth={0.02} position={[Math.sin(a) * r, Math.sin(a * 2) * 0.05, Math.cos(a) * r]} rotation={[0, a, 0]} />
      })}
    </group>
  )
}

// 깜빡이는 불꽃 (4단계 이상)
function Flame({ p, s = 1, c = '#ff7a3d', rot = 0 }: { p: [number, number, number]; s?: number; c?: string; rot?: number }) {
  const m = useRef<THREE.Mesh>(null)
  useFrame((st) => {
    if (m.current) m.current.scale.y = s * (0.85 + Math.sin(st.clock.elapsedTime * 14 + p[1] * 9) * 0.25)
  })
  return (
    <mesh ref={m} position={p} rotation={[0, 0, rot]}>
      <coneGeometry args={[0.04 * s, 0.16 * s, 6]} />
      <Glow color={c} />
    </mesh>
  )
}

function Halo({ y, len, w, c }: { y: number; len: number; w: number; c: string }) {
  return (
    <mesh position={[0, y, 0]}>
      <boxGeometry args={[w, len, w * 0.6]} />
      <meshBasicMaterial color={c} transparent opacity={0.22} depthWrite={false} />
    </mesh>
  )
}

/* ───────────── 검 ───────────── */
function Sword({ t }: { t: number }) {
  const p = PAL[t]
  const L = [0, 0.7, 0.9, 1.05, 1.2, 1.32, 1.48][t] // 날 길이
  const W = [0, 0.15, 0.17, 0.2, 0.24, 0.26, 0.34][t] // 날 너비
  const kind = t === 4 ? 'bladeflame' : t === 5 ? 'bladerune' : t === 6 ? 'bladeholy' : 'blade'
  const y0 = 0.18 // 날이 시작하는 높이
  const glow = p.glow ?? undefined
  return (
    <group>
      {/* 손잡이: 감은 끈 + 꼭지 */}
      <mesh>
        <cylinderGeometry args={[0.04, 0.04, 0.3, 12]} />
        <Toon color={t === 1 ? '#7a5a30' : p.dark} />
      </mesh>
      {[-0.1, -0.05, 0, 0.05, 0.1].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <cylinderGeometry args={[0.046, 0.046, 0.02, 12]} />
          <Toon color={p.trim} />
        </mesh>
      ))}
      <Ball p={[0, -0.18, 0]} r={0.07} c={p.gem} emissive={glow} ei={0.7} />
      {/* 날 */}
      <Shaped kind={kind} size={L} scale={[W / L, 1, 1]} depth={0.05} color={p.main} position={[0, y0, 0]} glow={t === 6} />
      {/* 날 가운데 홈 + 날 끝의 반짝임 */}
      <Bar p={[0, y0 + L * 0.5, 0.028]} s={[W * 0.16, L * 0.8, 0.012]} c={t === 6 ? '#ffd966' : t === 1 ? p.dark : p.trim} emissive={glow} ei={0.6} />
      {t === 1 && [0.2, 0.4, 0.6].map((y) => <Bar key={y} p={[0, y0 + L * y, 0.03]} s={[W * 0.7, 0.012, 0.008]} c={p.dark} />)}
      {/* 날받이 (칼날 아래의 십자 보호대) */}
      {t <= 2 ? (
        <>
          <Bar p={[0, 0.16, 0]} s={[W * 2.3, 0.07, 0.09]} c={p.trim} />
          <Ball p={[W * 1.15, 0.16, 0]} r={0.045} c={p.trim} />
          <Ball p={[-W * 1.15, 0.16, 0]} r={0.045} c={p.trim} />
        </>
      ) : (
        <>
          <Bar p={[0, 0.16, 0]} s={[W * 2.2, 0.08, 0.1]} c={p.trim} />
          {[-1, 1].map((s) => (
            <group key={s}>
              <Bar p={[s * W * 1.25, 0.22, 0]} s={[0.2, 0.06, 0.08]} c={p.trim} r={s * 0.6} />
              <Bar p={[s * W * 1.55, 0.3, 0]} s={[0.14, 0.05, 0.07]} c={p.trim} r={s * 1.0} />
            </group>
          ))}
          <Ball p={[0, 0.2, 0.05]} r={0.065} c={p.gem} emissive={glow} ei={0.9} />
        </>
      )}
      {t >= 5 &&
        [-1, 1].map((s) => (
          <Shaped key={s} kind="wing" size={t === 6 ? 0.36 : 0.26} color={p.trim} glow={t === 6} depth={0.03} position={[s * W * 1.2, 0.3, 0]} rotation={[0, s > 0 ? 0 : Math.PI, 0.55 * s]} />
        ))}
      {/* 불꽃(4) / 룬 글자(5) / 성스러운 빛(6) */}
      {t === 4 &&
        [0.18, 0.34, 0.5, 0.66, 0.82].map((y, i) => (
          <group key={i}>
            <Flame p={[W * 0.4, y0 + L * y, 0]} s={1.05} rot={-0.55} />
            <Flame p={[-W * 0.4, y0 + L * y, 0]} s={1.05} rot={0.55} />
          </group>
        ))}
      {t >= 5 &&
        [0.25, 0.42, 0.58, 0.75].map((y, i) => (
          <Bar key={i} p={[0, y0 + L * y, 0.03]} s={[W * 0.34, W * 0.2, 0.01]} c="#fff" emissive={glow} ei={1.5} r={i * 0.5} />
        ))}
      {t >= 5 && <Halo y={y0 + L * 0.5} len={L + 0.2} w={W + 0.1} c={glow ?? '#fff'} />}
      {t === 6 && <Orbit y={y0 + L * 0.55} r={0.34} n={5} c="#fff7c8" size={0.09} />}
      {t === 6 && <Halo y={y0 + L * 0.5} len={L + 0.4} w={W + 0.26} c="#fff7c8" />}
    </group>
  )
}

/* ───────────── 도끼 ───────────── */
function Axe({ t }: { t: number }) {
  const p = PAL[t]
  const big = [0, 0.26, 0.3, 0.34, 0.38, 0.42, 0.5][t]
  const H = 0.96
  const edge = t === 1 ? '#a8743f' : t === 6 ? '#fff3c2' : p.main
  const sc = big / 0.34
  const blade = (s: 1 | -1) => (
    <group key={s}>
      <Shaped kind="axehead" size={sc} color={edge} depth={0.07} glow={t === 6} position={[s * 0.02, 0.78, 0]} rotation={[0, s > 0 ? 0 : Math.PI, 0]} />
      <Shaped kind="axehead" size={sc * 0.9} color={t === 1 ? '#8a5a34' : p.trim} depth={0.045} position={[s * 0.02, 0.78, 0]} rotation={[0, s > 0 ? 0 : Math.PI, 0]} scale={[0.35, 0.7, 1.6]} />
    </group>
  )
  return (
    <group>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.038, 0.045, H + 0.2, 10]} />
        <Toon color={t === 1 ? '#8a5a34' : p.dark} />
      </mesh>
      {[0.0, 0.1, 0.2].map((y) => (
        <mesh key={y} position={[0, y - 0.1, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.025, 10]} />
          <Toon color={p.trim} />
        </mesh>
      ))}
      <Ball p={[0, -0.33, 0]} r={0.06} c={p.gem} emissive={p.glow ?? undefined} ei={0.5} />
      {/* 날 */}
      <Bar p={[0, 0.78, 0]} s={[0.1, 0.34, 0.1]} c={p.trim} />
      {blade(1)}
      {t >= 3 && blade(-1)}
      <mesh position={[0, 1.05 + big * 0.05, 0]}>
        <coneGeometry args={[0.06, 0.2, 6]} />
        <Toon color={p.trim} emissive={p.glow ?? undefined} ei={0.4} />
      </mesh>
      {t >= 4 && <Ball p={[0, 0.78, 0.06]} r={0.06} c={p.gem} emissive={p.glow ?? undefined} ei={0.8} />}
      {t === 4 && [0.95, 1.0, 1.05].map((y, i) => <Flame key={i} p={[big * 0.95 + i * 0.01, y - 0.18, 0]} s={0.9} rot={-0.6} />)}
      {t >= 5 &&
        [-1, 1].map((s) => (
          <group key={s}>
            <Bar p={[s * big * 0.9, 0.9, 0.03]} s={[0.05, 0.12, 0.012]} c="#bfe6ff" emissive="#7fd6ff" ei={1.4} r={0.4} />
            <Bar p={[s * big * 0.8, 0.72, 0.03]} s={[0.05, 0.12, 0.012]} c="#bfe6ff" emissive="#7fd6ff" ei={1.4} r={-0.4} />
          </group>
        ))}
      {t >= 5 && <Halo y={0.8} len={big * 2.1} w={big * 2.3} c={p.glow ?? '#fff'} />}
      {t === 6 && <Orbit y={0.82} r={0.52} n={4} c="#fff7c8" />}
    </group>
  )
}

/* ───────────── 창 ───────────── */
function Spear({ t }: { t: number }) {
  const p = PAL[t]
  const H = 1.5
  const headC = t === 1 ? '#c99a62' : p.main
  return (
    <group>
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.032, 0.036, H, 10]} />
        <Toon color={t <= 2 ? '#8a5a34' : p.dark} />
      </mesh>
      {[-0.05, 0.05].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <cylinderGeometry args={[0.042, 0.042, 0.03, 10]} />
          <Toon color={p.trim} />
        </mesh>
      ))}
      <mesh position={[0, -0.42, 0]}>
        <coneGeometry args={[0.05, 0.14, 8]} />
        <Toon color={p.trim} />
      </mesh>
      {/* 창끝·장식은 한눈에 보이도록 키운다 */}
      <group position={[0, 1.15, 0]} scale={1.5}>
        <group position={[0, -1.15, 0]}>
      {/* 창끝 */}
      {t <= 2 && (
        <mesh position={[0, 1.2, 0]}>
          <coneGeometry args={[t === 1 ? 0.06 : 0.07, 0.3, 6]} />
          <Toon color={headC} />
        </mesh>
      )}
      {t >= 3 && t !== 5 && (
        <group position={[0, 1.2, 0]}>
          <mesh scale={[1, 1, 0.35]}>
            <octahedronGeometry args={[0.11, 0]} />
            <Toon color={headC} emissive={p.glow ?? undefined} ei={t >= 4 ? 0.5 : 0.2} />
          </mesh>
          <mesh position={[0, 0.17, 0]} scale={[1, 1.1, 0.4]}>
            <coneGeometry args={[0.07, 0.22, 4]} />
            <Toon color={headC} emissive={p.glow ?? undefined} ei={t >= 4 ? 0.5 : 0.2} />
          </mesh>
          <Bar p={[0, -0.12, 0]} s={[0.3, 0.035, 0.05]} c={p.trim} />
        </group>
      )}
      {t === 5 && (
        <group position={[0, 1.14, 0]}>
          {[-1, 0, 1].map((s) => (
            <group key={s} position={[s * 0.13, s === 0 ? 0.08 : 0.0, 0]}>
              <mesh position={[0, 0.14, 0]} scale={[1, 1, 0.4]}>
                <coneGeometry args={[0.05, s === 0 ? 0.36 : 0.28, 4]} />
                <Toon color={p.main} emissive={p.glow ?? undefined} ei={0.7} />
              </mesh>
              <Bar p={[0, -0.04, 0]} s={[0.04, 0.2, 0.04]} c={p.trim} />
            </group>
          ))}
          <Bar p={[0, -0.04, 0]} s={[0.3, 0.04, 0.05]} c={p.trim} />
        </group>
      )}
      {t === 6 && (
        <group position={[0, 1.22, 0]}>
          <Shaped kind="star" size={0.2} color="#fff3c2" glow depth={0.04} />
          <Bar p={[0, -0.2, 0]} s={[0.36, 0.04, 0.06]} c={p.trim} />
        </group>
      )}
      {/* 장식: 술(3) 불꽃(4) 번개(5) */}
      {t === 3 && [-1, 0, 1].map((s) => <Bar key={s} p={[s * 0.035, 1.0, 0.03]} s={[0.03, 0.18, 0.012]} c="#d94040" r={s * 0.15} />)}
      {t === 4 && [0, 1, 2].map((i) => <Flame key={i} p={[(i - 1) * 0.07, 1.46, 0]} s={1.1} />)}
      {t >= 5 && <Halo y={1.2} len={0.6} w={0.4} c={p.glow ?? '#fff'} />}
      {t >= 5 && <Orbit y={1.12} r={0.28} n={t === 6 ? 5 : 3} c={t === 6 ? '#fff7c8' : '#cfe6ff'} />}
        </group>
      </group>
    </group>
  )
}

/* ───────────── 활 ───────────── */
function Bow({ t }: { t: number }) {
  const p = PAL[t]
  const k = 1 + t * 0.07 // 단계가 오를수록 커진다
  const wood = t === 1 ? '#a8743f' : t === 2 ? '#8a5a34' : p.main
  // 활대: 가운데(손잡이)는 앞으로 볼록하고 양 끝은 뒤로 휘는 곡선
  const pts = [
    [0.66, -0.26],
    [0.5, -0.12],
    [0.3, -0.02],
    [0.12, 0.04],
    [0, 0.05],
    [-0.12, 0.04],
    [-0.3, -0.02],
    [-0.5, -0.12],
    [-0.66, -0.26],
  ].map(([y, z]) => new THREE.Vector3(0, y * k, z * k))
  const curve = new THREE.CatmullRomCurve3(pts)
  const tipY = 0.66 * k
  const tipZ = -0.26 * k
  return (
    <group>
      <mesh>
        <tubeGeometry args={[curve, 28, 0.032, 8, false]} />
        <Toon color={wood} emissive={t >= 4 ? p.glow ?? undefined : undefined} ei={0.3} />
      </mesh>
      {/* 손잡이 */}
      <mesh position={[0, 0, 0.05]}>
        <cylinderGeometry args={[0.05, 0.05, 0.2, 10]} />
        <Toon color={t === 1 ? '#6a4a28' : p.dark} />
      </mesh>
      {t >= 2 && <Bar p={[0, 0, 0.1]} s={[0.07, 0.07, 0.03]} c={p.trim} />}
      {/* 활시위 */}
      <mesh position={[0, 0, tipZ]}>
        <cylinderGeometry args={[0.007, 0.007, tipY * 2, 4]} />
        {t >= 5 ? <Glow color={p.glow ?? '#fff'} /> : <Toon color="#f1e6c8" />}
      </mesh>
      {[1, -1].map((s) => (
        <Ball key={s} p={[0, s * tipY, tipZ]} r={0.045} c={t >= 3 ? p.trim : '#6a4a28'} emissive={t >= 3 ? p.glow ?? undefined : undefined} ei={0.6} />
      ))}
      {/* 화살 (시위에 걸려 앞을 향한다) */}
      <group position={[0, 0.0, tipZ]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh position={[0, 0.42, 0]}>
          <cylinderGeometry args={[0.014, 0.014, 0.84, 6]} />
          <Toon color="#b98552" />
        </mesh>
        <mesh position={[0, 0.88, 0]}>
          <coneGeometry args={[0.038, 0.12, 6]} />
          <Toon color={t >= 3 ? p.main : '#8f969f'} emissive={p.glow ?? undefined} ei={0.5} />
        </mesh>
        {[-1, 1].map((s) => (
          <Bar key={s} p={[s * 0.025, 0.06, 0]} s={[0.03, 0.14, 0.01]} c="#e8624f" r={s * 0.25} />
        ))}
      </group>
      {/* 장식 */}
      {t >= 3 && <Ball p={[0, 0.0, 0.11]} r={0.055} c={p.gem} emissive={p.glow ?? undefined} ei={0.8} />}
      {t === 4 && [1, -1].map((s) => <Flame key={s} p={[0.0, s * (tipY * 0.92), tipZ - 0.04]} s={1} rot={s > 0 ? 0 : Math.PI} />)}
      {t >= 5 &&
        [1, -1].map((s) => (
          <Shaped key={s} kind="wing" size={0.2} color={p.trim} depth={0.02} position={[0.0, s * 0.16, 0.06]} rotation={[0, Math.PI / 2, s * 1.2]} />
        ))}
      {t >= 5 && <Orbit y={0} r={0.5 * k} n={t === 6 ? 5 : 3} c={t === 6 ? '#fff7c8' : '#cfe6ff'} />}
    </group>
  )
}

/* ───────────── 마법 지팡이 ───────────── */
function Staff({ t }: { t: number }) {
  const p = PAL[t]
  const H = 1.45
  const orbY = 1.18
  return (
    <group>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.04, 0.05, H, 10]} />
        <Toon color={t <= 2 ? '#8a5a34' : p.dark} />
      </mesh>
      {[-0.04, 0.04, 0.5].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <cylinderGeometry args={[0.058, 0.058, 0.03, 10]} />
          <Toon color={p.trim} />
        </mesh>
      ))}
      <mesh position={[0, -0.44, 0]}>
        <coneGeometry args={[0.05, 0.12, 8]} />
        <Toon color={p.trim} />
      </mesh>
      <group scale={1.55} position={[0, -orbY * 0.55, 0]}>
      {t === 1 && (
        <group position={[0, orbY - 0.05, 0]}>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.07, 0.1, 0]} rotation={[0, 0, s * -0.4]}>
              <cylinderGeometry args={[0.02, 0.03, 0.28, 6]} />
              <Toon color="#8a5a34" />
            </mesh>
          ))}
          <mesh position={[0.1, 0.22, 0]} rotation={[0, 0, -0.6]} scale={[1.6, 0.5, 0.4]}>
            <sphereGeometry args={[0.07, 8, 6]} />
            <Toon color="#7fb54a" />
          </mesh>
          <Ball p={[0, 0.12, 0.0]} r={0.05} c="#a8e07a" />
        </group>
      )}
      {t === 2 && (
        <group position={[0, orbY + 0.05, 0]}>
          <mesh scale={[1, 1.5, 1]}>
            <octahedronGeometry args={[0.12, 0]} />
            <Toon color="#9fe8f5" emissive="#7fd6ff" ei={0.6} opacity={0.92} />
          </mesh>
          {[-1, 1].map((s) => <Bar key={s} p={[s * 0.1, -0.14, 0]} s={[0.04, 0.16, 0.04]} c={p.trim} r={s * 0.5} />)}
        </group>
      )}
      {t === 3 && (
        <group position={[0, orbY + 0.12, 0]}>
          <Shaped kind="star" size={0.2} color="#ffe27a" glow depth={0.05} />
          <mesh rotation={[0, 0, 0]}>
            <torusGeometry args={[0.2, 0.018, 6, 20]} />
            <Toon color={p.trim} />
          </mesh>
        </group>
      )}
      {t === 4 && (
        <group position={[0, orbY + 0.1, 0]}>
          <mesh rotation={[0, 0, 0.3]}>
            <torusGeometry args={[0.2, 0.04, 8, 22, Math.PI * 1.5]} />
            <Toon color="#f2e9b0" emissive="#fff0a0" ei={0.7} />
          </mesh>
          <Ball p={[0.02, 0, 0]} r={0.09} c="#e8402a" emissive="#ff7a3d" ei={0.9} />
          {[0, 1, 2].map((i) => <Flame key={i} p={[(i - 1) * 0.05, 0.2, 0]} s={0.9} />)}
        </group>
      )}
      {t === 5 && (
        <group position={[0, orbY + 0.1, 0]}>
          <Ball p={[0, 0, 0]} r={0.12} c="#ff9f4a" emissive="#ff6a3d" ei={1} />
          {[-1, 1].map((s) => (
            <Shaped key={s} kind="wing" size={0.3} color="#ff8a3d" glow depth={0.03} position={[s * 0.08, 0.02, 0]} rotation={[0, s > 0 ? 0 : Math.PI, 0.3 * s]} />
          ))}
          {[0, 1, 2].map((i) => <Flame key={i} p={[(i - 1) * 0.06, 0.18, 0]} s={1.2} c="#ffc04a" />)}
        </group>
      )}
      {t === 6 && (
        <group position={[0, orbY + 0.14, 0]}>
          <mesh>
            <sphereGeometry args={[0.17, 16, 14]} />
            <Toon color="#2a1f6a" emissive="#7a5bff" ei={0.9} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.24, 16, 14]} />
            <meshBasicMaterial color="#b78bff" transparent opacity={0.22} depthWrite={false} />
          </mesh>
          {[0.4, 1.2].map((r, i) => (
            <mesh key={i} rotation={[Math.PI / 2 + r, r * 0.6, 0]}>
              <torusGeometry args={[0.3, 0.012, 6, 28]} />
              <Glow color={i ? '#ffd9ff' : '#9fd0ff'} />
            </mesh>
          ))}
          <Orbit y={0} r={0.34} n={6} c="#fff7c8" speed={2.2} size={0.06} />
        </group>
      )}
      {t >= 3 && t <= 4 && <Orbit y={orbY + 0.1} r={0.28} n={3} c={p.glow ?? '#fff'} />}
      </group>
    </group>
  )
}

/* ───────────── 망치 ───────────── */
function Hammer({ t }: { t: number }) {
  const p = PAL[t]
  const H = 0.95
  const r = [0, 0.15, 0.16, 0.17, 0.18, 0.19, 0.22][t] // 머리 굵기
  const len = [0, 0.5, 0.52, 0.56, 0.6, 0.62, 0.7][t] // 머리 길이
  const hc = t === 1 ? '#a8743f' : t === 4 ? '#6a2a1a' : p.main
  const glow = p.glow ?? undefined
  return (
    <group>
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.042, 0.048, H + 0.25, 10]} />
        <Toon color={t <= 2 ? '#8a5a34' : p.dark} />
      </mesh>
      {[-0.08, 0.02, 0.12].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <cylinderGeometry args={[0.056, 0.056, 0.028, 10]} />
          <Toon color={p.trim} />
        </mesh>
      ))}
      <Ball p={[0, -0.36, 0]} r={0.065} c={p.gem} emissive={glow} ei={0.6} />
      {/* 머리: 가로로 눕힌 통 + 양쪽 마개 + 쇠띠 */}
      <group position={[0, 0.8, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[r, r, len, 20]} />
          <Toon color={hc} emissive={t === 4 ? '#ff5a2a' : glow} ei={t === 4 ? 0.35 : t >= 5 ? 0.3 : 0.1} />
        </mesh>
        {[-1, 1].map((s) => (
          <group key={s}>
            <mesh position={[s * (len / 2 + 0.02), 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[r * 1.2, r * 1.2, 0.07, 20]} />
              <Toon color={t === 1 ? p.dark : p.trim} />
            </mesh>
            <mesh position={[s * len * 0.28, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[r * 1.06, r * 1.06, 0.045, 20]} />
              <Toon color={p.trim} />
            </mesh>
          </group>
        ))}
        {/* 손잡이가 꽂히는 둥근 고정쇠 */}
        <mesh>
          <sphereGeometry args={[r * 0.75, 12, 10]} />
          <Toon color={p.trim} />
        </mesh>
        {/* 가시(3단계 이상): 양끝과 윗면 */}
        {t >= 3 &&
          [-1, 1].map((s) => (
            <mesh key={s} position={[s * (len / 2 + 0.1), 0, 0]} rotation={[0, 0, -s * Math.PI / 2]}>
              <coneGeometry args={[r * 0.55, 0.2, 8]} />
              <Toon color={p.trim} emissive={glow} ei={0.4} />
            </mesh>
          ))}
        {t >= 3 &&
          [-0.18, 0, 0.18].map((x) => (
            <mesh key={x} position={[x * len * 1.6, r + 0.03, 0]}>
              <coneGeometry args={[0.04, 0.12, 6]} />
              <Toon color={p.trim} emissive={glow} ei={0.4} />
            </mesh>
          ))}
        {/* 용암 줄무늬(4) · 번개 고리(5·6) */}
        {t === 4 &&
          [-0.18, 0, 0.18].map((x) => (
            <mesh key={x} position={[x * len * 1.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <torusGeometry args={[r * 1.02, 0.014, 6, 24]} />
              <Glow color="#ffb04a" />
            </mesh>
          ))}
        {t === 4 && [-0.18, 0.18].map((x) => <Flame key={x} p={[x * len * 1.5, r + 0.1, 0]} s={1.3} />)}
        {t >= 5 &&
          [-0.2, 0.2].map((x) => (
            <mesh key={x} position={[x * len * 1.4, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <torusGeometry args={[r * 1.04, 0.016, 6, 24]} />
              <Glow color={t === 6 ? '#fff3c2' : '#7fd6ff'} />
            </mesh>
          ))}
        {t >= 5 &&
          [-1, 1].map((s) => (
            <group key={s} position={[s * (len / 2 + 0.18), 0.1, 0.0]}>
              <Bar p={[0, 0.0, 0]} s={[0.04, 0.2, 0.012]} c="#cfe6ff" emissive="#7fd6ff" ei={1.6} r={0.5} />
              <Bar p={[0.04, -0.16, 0]} s={[0.04, 0.18, 0.012]} c="#cfe6ff" emissive="#7fd6ff" ei={1.6} r={-0.5} />
            </group>
          ))}
        {t >= 5 && <Halo y={0} len={r * 2.8} w={len * 1.5} c={t === 6 ? '#ffe9a0' : '#9fd0ff'} />}
        {t >= 5 && <Orbit y={0.04} r={len * 0.72} n={t === 6 ? 5 : 3} c={t === 6 ? '#fff7c8' : '#cfe6ff'} />}
      </group>
    </group>
  )
}

export function Weapon({ family, tier }: { family: string | null; tier: number }): ReactNode {
  if (!family || !isFamily(family)) return null
  const t = Math.max(1, Math.min(6, Math.round(tier || 1)))
  const f: WeaponFamily = family
  return (
    <group scale={1.28}>
      <WeaponByFamily f={f} t={t} />
    </group>
  )
}

function WeaponByFamily({ f, t }: { f: WeaponFamily; t: number }): ReactNode {
  switch (f) {
    case 'sword':
      return <Sword t={t} />
    case 'axe':
      return <Axe t={t} />
    case 'spear':
      return <Spear t={t} />
    case 'bow':
      return <Bow t={t} />
    case 'staff':
      return <Staff t={t} />
    case 'hammer':
      return <Hammer t={t} />
  }
}

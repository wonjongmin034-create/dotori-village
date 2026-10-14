import { useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Toon, Glow, WHITE, Dome, Shaped } from './wearKit'
import { toonGradient as toonGradientRef } from './toon'

// 새 액세서리·코스튬. 머리(head) 그룹 / 몸통(body) 그룹의 자식으로 그린다.

export type Pal = { body: string; belly: string; paw: string; limb?: string; hand?: string }

export const COSTUME_MORE: Record<string, Pal> = {
  panda: { body: '#f6f6f6', belly: '#ffffff', paw: '#2b2b2f', limb: '#2b2b2f', hand: '#2b2b2f' },
  penguin: { body: '#2e3a52', belly: '#fbfbfb', paw: '#f2a03d', limb: '#2e3a52', hand: '#2e3a52' },
  bunny: { body: '#f7eef0', belly: '#ffffff', paw: '#f2c9d6' },
  fox: { body: '#e9803a', belly: '#fbe9cf', paw: '#4a2c1c', limb: '#e9803a', hand: '#4a2c1c' },
  duck: { body: '#f7d948', belly: '#fff0a6', paw: '#f08a2c', hand: '#f7d948' },
  unicorn: { body: '#f4ecff', belly: '#ffffff', paw: '#f7b6d8' },
  ghost: { body: '#f2f6fb', belly: '#ffffff', paw: '#dfe8f3' },
  snowman: { body: '#f7fbff', belly: '#ffffff', paw: '#e3edf6', hand: '#2b2b2f' },
  ninja: { body: '#2a2d38', belly: '#353949', paw: '#1d1f27' },
  knight: { body: '#b4bcc6', belly: '#d3d9e0', paw: '#8a929c' },
  dragon: { body: '#d9543c', belly: '#f4c36b', paw: '#a83a28' },
  lion: { body: '#d9a24a', belly: '#f2d9a0', paw: '#a8742c' },
}

export const NEW_COSTUMES = new Set(Object.keys(COSTUME_MORE))
export const NEW_FACE_ACC = new Set(['heromask', 'heartglasses', 'starglasses', 'eyepatch', 'headchick'])
export const NEW_BACK_ACC = new Set(['bowtie', 'necklace', 'guitar', 'batwings', 'jetpack', 'wings'])

const surf = (y: number) => {
  const dy = Math.max(0, Math.abs(y) - 0.08)
  return Math.sqrt(Math.max(0.01, 0.0841 - dy * dy))
}

/* ───────────── 얼굴 액세서리 (head 그룹) ───────────── */

export function FaceMore({ id }: { id: string }) {
  switch (id) {
    case 'heromask':
      return (
        <group position={[0, 0.03, 0.43]}>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.17, 0, 0.02]} scale={[1.25, 1, 0.5]}>
              <torusGeometry args={[0.09, 0.04, 8, 18]} />
              <Toon color="#d93a4a" />
            </mesh>
          ))}
          <mesh position={[0, 0.0, 0.0]}>
            <boxGeometry args={[0.12, 0.05, 0.03]} />
            <Toon color="#d93a4a" />
          </mesh>
          <mesh position={[0, 0.0, -0.4]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.5, 0.025, 6, 28]} />
            <Toon color="#b82f3d" />
          </mesh>
        </group>
      )
    case 'heartglasses':
      return (
        <group position={[0, 0.03, 0.44]}>
          {[-1, 1].map((s) => (
            <group key={s} position={[s * 0.17, 0.0, 0.03]}>
              <Shaped kind="heartring" size={0.13} depth={0.03} color="#ff4f86" />
              <Shaped kind="heart" size={0.095} depth={0.01} color="#ffd3e2" opacity={0.35} position={[0, 0, 0.01]} />
            </group>
          ))}
          <mesh position={[0, 0.02, 0.03]}>
            <boxGeometry args={[0.1, 0.02, 0.02]} />
            <Toon color="#ff4f86" />
          </mesh>
        </group>
      )
    case 'starglasses':
      return (
        <group position={[0, 0.03, 0.44]}>
          {[-1, 1].map((s) => (
            <group key={s} position={[s * 0.18, 0.0, 0.03]}>
              <Shaped kind="starring" size={0.13} depth={0.03} color="#ffd23f" />
              <Shaped kind="star" size={0.1} depth={0.01} color="#bfe6ff" opacity={0.3} position={[0, 0, 0.01]} />
            </group>
          ))}
          <mesh position={[0, 0.02, 0.03]}>
            <boxGeometry args={[0.1, 0.02, 0.02]} />
            <Toon color="#ffd23f" />
          </mesh>
        </group>
      )
    case 'headchick':
      return (
        <group position={[0, 0.6, 0.02]} scale={1.7}>
          <mesh scale={[1, 0.95, 1.05]}>
            <sphereGeometry args={[0.13, 14, 12]} />
            <Toon color="#ffe055" />
          </mesh>
          <mesh position={[0, 0.0, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.032, 0.07, 8]} />
            <Toon color="#f08a2c" />
          </mesh>
          {[-1, 1].map((s) => (
            <group key={s}>
              <mesh position={[s * 0.05, 0.03, 0.1]}>
                <sphereGeometry args={[0.018, 6, 6]} />
                <Glow color="#222222" />
              </mesh>
              <mesh position={[s * 0.13, -0.01, 0.0]} scale={[0.4, 1, 1]}>
                <sphereGeometry args={[0.07, 8, 8]} />
                <Toon color="#ffd23a" />
              </mesh>
            </group>
          ))}
          <mesh position={[0, 0.13, 0.0]} rotation={[0, 0, 0.3]}>
            <coneGeometry args={[0.025, 0.08, 6]} />
            <Toon color="#ffe055" />
          </mesh>
        </group>
      )
    case 'eyepatch':
      return (
        <group position={[0, 0.03, 0.44]}>
          <mesh position={[0.17, 0, 0.03]} scale={[1, 1, 0.35]}>
            <sphereGeometry args={[0.115, 14, 12]} />
            <Toon color="#1c1c20" />
          </mesh>
          <mesh position={[0, 0.06, -0.38]} rotation={[Math.PI / 2, 0, 0.35]}>
            <torusGeometry args={[0.505, 0.014, 6, 30]} />
            <Toon color="#1c1c20" />
          </mesh>
        </group>
      )
  }
  return null
}

/* ───────────── 목·등 액세서리 (body 그룹) ───────────── */

function Flame({ x }: { x: number }) {
  const m = useRef<THREE.Mesh>(null)
  useFrame((s) => {
    if (m.current) m.current.scale.y = 0.8 + Math.sin(s.clock.elapsedTime * 28 + x * 9) * 0.3
  })
  return (
    <mesh ref={m} position={[x, -0.34, -0.3]} rotation={[Math.PI, 0, 0]}>
      <coneGeometry args={[0.055, 0.22, 8]} />
      <Glow color="#ffb347" />
    </mesh>
  )
}

export function BackMore({ acc }: { acc: string | null }) {
  switch (acc) {
    case 'wings':
      return (
        <group position={[0, 0.06, -0.25]}>
          {[1, -1].map((s) => (
            <group key={s} position={[s * 0.1, 0.04, 0]} rotation={[0.1, s * 0.7, s * 0.25]}>
              <mesh position={[s * 0.2, 0.22, 0]} rotation={[0, 0, s * -0.5]} scale={[0.75, 1.3, 0.1]}>
                <sphereGeometry args={[0.28, 16, 12]} />
                <Toon color="#e6f4ff" emissive="#bfe4ff" ei={0.55} opacity={0.9} />
              </mesh>
              <mesh position={[s * 0.17, -0.1, 0]} rotation={[0, 0, s * -0.2]} scale={[0.7, 1.1, 0.1]}>
                <sphereGeometry args={[0.2, 14, 10]} />
                <Toon color="#f6e6ff" emissive="#e3c7ff" ei={0.5} opacity={0.9} />
              </mesh>
              <mesh position={[s * 0.16, 0.2, 0.012]} rotation={[0, 0, s * -0.55]}>
                <boxGeometry args={[0.012, 0.46, 0.006]} />
                <Toon color="#b9d8f2" />
              </mesh>
            </group>
          ))}
        </group>
      )
    case 'bowtie':
      return (
        <group position={[0, 0.1, surf(0.1) + 0.02]} scale={1.5}>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.07, 0, 0]} rotation={[0, 0, s * -Math.PI / 2]} scale={[1, 1, 0.6]}>
              <coneGeometry args={[0.07, 0.13, 3]} />
              <Toon color="#8a4bd6" />
            </mesh>
          ))}
          <mesh>
            <sphereGeometry args={[0.035, 8, 8]} />
            <Toon color="#6a32b0" />
          </mesh>
        </group>
      )
    case 'necklace':
      return (
        <group>
          <mesh position={[0, 0.17, 0.02]} rotation={[Math.PI / 2 - 0.25, 0, 0]}>
            <torusGeometry args={[0.2, 0.012, 6, 28]} />
            <Toon color="#f2c94e" />
          </mesh>
          <Shaped kind="star" size={0.055} color="#ffe27a" glow position={[0, 0.06, surf(0.06) + 0.012]} depth={0.015} />
        </group>
      )
    case 'guitar':
      return (
        <group position={[0, -0.02, -0.3]} rotation={[0.1, 0, 0.5]}>
          <mesh scale={[1, 1.1, 0.35]} position={[0, -0.1, 0]}>
            <sphereGeometry args={[0.2, 14, 12]} />
            <Toon color="#e8873a" />
          </mesh>
          <mesh scale={[1, 0.8, 0.35]} position={[0, 0.08, 0]}>
            <sphereGeometry args={[0.15, 14, 12]} />
            <Toon color="#e8873a" />
          </mesh>
          <mesh position={[0, -0.06, 0.07]}>
            <cylinderGeometry args={[0.055, 0.055, 0.02, 12]} />
            <Toon color="#2b2b2f" />
          </mesh>
          <mesh position={[0, 0.42, 0]}>
            <boxGeometry args={[0.05, 0.5, 0.03]} />
            <Toon color="#7a4a24" />
          </mesh>
          <mesh position={[0, 0.7, 0]}>
            <boxGeometry args={[0.08, 0.1, 0.04]} />
            <Toon color="#3a2412" />
          </mesh>
          <mesh position={[0.0, 0.0, 0.18]} rotation={[0, 0, -0.75]}>
            <boxGeometry args={[0.03, 0.9, 0.012]} />
            <Toon color="#2b2b2f" />
          </mesh>
        </group>
      )
    case 'batwings':
      return (
        <group position={[0, 0.06, -0.25]}>
          {[1, -1].map((s) => (
            <Shaped
              key={s}
              kind="wing"
              size={0.42}
              depth={0.02}
              color="#5b3a8c"
              position={[s * 0.1, 0.02, 0]}
              rotation={[0, s > 0 ? 0.55 : Math.PI - 0.55, 0.15 * s]}
            />
          ))}
        </group>
      )
    case 'jetpack':
      return (
        <group>
          {[-1, 1].map((s) => (
            <group key={s}>
              <mesh position={[s * 0.1, 0.0, -0.3]}>
                <cylinderGeometry args={[0.085, 0.085, 0.4, 14]} />
                <Toon color="#d94a3a" />
              </mesh>
              <mesh position={[s * 0.1, 0.2, -0.3]}>
                <sphereGeometry args={[0.085, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <Toon color="#c23c2e" />
              </mesh>
              <mesh position={[s * 0.1, -0.22, -0.3]}>
                <cylinderGeometry args={[0.05, 0.08, 0.07, 12]} />
                <Toon color="#6a6f7a" />
              </mesh>
              <Flame x={s * 0.1} />
            </group>
          ))}
          <mesh position={[0, 0.02, -0.28]}>
            <boxGeometry args={[0.24, 0.12, 0.04]} />
            <Toon color="#8f96a3" />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={`s${s}`} position={[s * 0.15, 0.02, 0.0]} rotation={[0.1, 0, 0]}>
              <boxGeometry args={[0.045, 0.4, 0.03]} />
              <Toon color="#3a3f4b" />
            </mesh>
          ))}
        </group>
      )
  }
  return null
}

/* ───────────── 코스튬: 머리 ───────────── */

function Hood({ color }: { color: string }) {
  return <Dome color={color} r={0.5} y={0.08} z={-0.04} cover={0.62} scale={[1.08, 1.02, 1.06]} />
}
const Ear = ({ x, y = 0.46, rot = 0, c, inner, r = 0.15 }: { x: number; y?: number; rot?: number; c: string; inner?: string; r?: number }) => (
  <group position={[x, y, -0.02]} rotation={[0, 0, rot]}>
    <mesh>
      <sphereGeometry args={[r, 12, 10]} />
      <Toon color={c} />
    </mesh>
    {inner && (
      <mesh position={[0, 0, r * 0.55]} scale={[0.6, 0.6, 0.4]}>
        <sphereGeometry args={[r, 10, 8]} />
        <Toon color={inner} />
      </mesh>
    )}
  </group>
)

export function CostumeHeadMore({ id }: { id: string }) {
  const p = COSTUME_MORE[id]
  switch (id) {
    case 'panda':
      return (
        <>
          <Hood color={p.body} />
          <Ear x={-0.34} y={0.42} c="#2b2b2f" />
          <Ear x={0.34} y={0.42} c="#2b2b2f" />
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.18, 0.0, 0.405]} rotation={[0, 0, s * 0.45]} scale={[1.0, 1.7, 0.45]}>
              <sphereGeometry args={[0.085, 12, 10]} />
              <Toon color="#2b2b2f" />
            </mesh>
          ))}
          <mesh position={[0, -0.075, 0.475]} scale={[1.3, 0.9, 0.7]}>
            <sphereGeometry args={[0.04, 10, 8]} />
            <Toon color="#2b2b2f" />
          </mesh>
        </>
      )
    case 'penguin':
      return (
        <>
          <Hood color={p.body} />
          <mesh position={[0, -0.09, 0.5]} rotation={[Math.PI / 2, 0, 0]} scale={[1.3, 1, 0.7]}>
            <coneGeometry args={[0.07, 0.15, 8]} />
            <Toon color="#f2a03d" />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.34, -0.12, 0.28]} scale={[0.7, 0.9, 0.45]}>
              <sphereGeometry args={[0.13, 10, 8]} />
              <Toon color="#fbfbfb" />
            </mesh>
          ))}
        </>
      )
    case 'bunny':
      return (
        <>
          <Hood color={p.body} />
          {[-1, 1].map((s) => (
            <group key={s} position={[s * 0.17, 0.72, -0.04]} rotation={[0, 0, s * 0.18]}>
              <mesh scale={[0.55, 1.6, 0.4]}>
                <sphereGeometry args={[0.16, 12, 12]} />
                <Toon color={p.body} />
              </mesh>
              <mesh position={[0, 0, 0.04]} scale={[0.32, 1.3, 0.3]}>
                <sphereGeometry args={[0.15, 10, 10]} />
                <Toon color="#f7b6c6" />
              </mesh>
            </group>
          ))}
          <mesh position={[0, -0.07, 0.47]} scale={[1.2, 0.8, 0.6]}>
            <sphereGeometry args={[0.035, 8, 8]} />
            <Toon color="#f48fa8" />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={`t${s}`} position={[s * 0.02, -0.2, 0.45]}>
              <boxGeometry args={[0.035, 0.05, 0.02]} />
              <Toon color={WHITE} />
            </mesh>
          ))}
        </>
      )
    case 'fox':
      return (
        <>
          <Hood color={p.body} />
          {[-1, 1].map((s) => (
            <group key={s} position={[s * 0.28, 0.5, -0.02]} rotation={[0, 0, s * -0.22]}>
              <mesh>
                <coneGeometry args={[0.15, 0.3, 4]} />
                <Toon color={p.body} />
              </mesh>
              <mesh position={[0, 0.1, 0.02]} scale={[0.7, 0.45, 0.8]}>
                <coneGeometry args={[0.15, 0.3, 4]} />
                <Toon color="#2b2b2f" />
              </mesh>
            </group>
          ))}
          {[-1, 1].map((s) => (
            <mesh key={`c${s}`} position={[s * 0.45, -0.1, 0.14]} rotation={[0, 0, s * -Math.PI / 2 - s * 0.25]}>
              <coneGeometry args={[0.1, 0.2, 5]} />
              <Toon color={WHITE} />
            </mesh>
          ))}
          <mesh position={[0, -0.07, 0.47]} scale={[1.3, 0.9, 0.8]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <Toon color="#2b2b2f" />
          </mesh>
        </>
      )
    case 'duck':
      return (
        <>
          <Hood color={p.body} />
          <mesh position={[0, -0.09, 0.5]} scale={[1.5, 0.45, 1.1]}>
            <sphereGeometry args={[0.1, 12, 10]} />
            <Toon color="#f08a2c" />
          </mesh>
          <mesh position={[0, -0.14, 0.49]} scale={[1.35, 0.35, 1.0]}>
            <sphereGeometry args={[0.1, 12, 10]} />
            <Toon color="#e07a1c" />
          </mesh>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[0, 0.5, 0.02 - i * 0.05]} rotation={[-0.4 - i * 0.2, 0, 0]}>
              <coneGeometry args={[0.04, 0.14, 5]} />
              <Toon color={p.body} />
            </mesh>
          ))}
        </>
      )
    case 'unicorn':
      return (
        <>
          <Hood color={p.body} />
          <group position={[0, 0.5, 0.14]} rotation={[0.35, 0, 0]}>
            <mesh position={[0, 0.17, 0]}>
              <coneGeometry args={[0.07, 0.38, 12]} />
              <Toon color="#ffe27a" emissive="#ffe27a" ei={0.3} />
            </mesh>
            {[0.05, 0.13, 0.21].map((y, i) => (
              <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.06 - i * 0.014, 0.011, 6, 14]} />
                <Toon color="#e0b53a" />
              </mesh>
            ))}
          </group>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.22, 0.44, -0.04]} rotation={[0, 0, s * -0.3]}>
              <coneGeometry args={[0.07, 0.2, 8]} />
              <Toon color="#fdf1fa" />
            </mesh>
          ))}
          {(['#ff8fb1', '#ffd36e', '#8fe3a1', '#8ec5ff', '#c7a6ff'] as string[]).map((c, i) => (
            <mesh key={c} position={[0, 0.34 - i * 0.12, -0.44 - i * 0.02]}>
              <sphereGeometry args={[0.1 - i * 0.005, 10, 8]} />
              <Toon color={c} />
            </mesh>
          ))}
        </>
      )
    case 'ghost':
      return (
        <>
          <Hood color={p.body} />
          <mesh position={[0, 0.5, 0]} rotation={[0, 0, 0.4]}>
            <coneGeometry args={[0.05, 0.14, 6]} />
            <Toon color={p.body} />
          </mesh>
        </>
      )
    case 'snowman':
      return (
        <>
          <Hood color={p.body} />
          <mesh position={[0, -0.05, 0.54]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.055, 0.24, 10]} />
            <Toon color="#f08a2c" />
          </mesh>
          <group position={[0, 0.5, 0]} rotation={[0, 0, 0.12]}>
            <mesh>
              <cylinderGeometry args={[0.3, 0.3, 0.04, 20]} />
              <Toon color="#25262b" />
            </mesh>
            <mesh position={[0, 0.14, 0]}>
              <cylinderGeometry args={[0.2, 0.22, 0.28, 18]} />
              <Toon color="#2f3036" />
            </mesh>
            <mesh position={[0, 0.04, 0]}>
              <cylinderGeometry args={[0.225, 0.225, 0.06, 18]} />
              <Toon color="#d93a3a" />
            </mesh>
          </group>
        </>
      )
    case 'ninja':
      return (
        <>
          <Hood color={p.body} />
          {/* 얼굴 아랫부분 가리개 */}
          <mesh position={[0, -0.2, 0]}>
            <cylinderGeometry args={[0.495, 0.455, 0.3, 28, 1, true, -Math.PI * 0.62, Math.PI * 1.24]} />
            <meshToonMaterial gradientMap={toonGradientRef} color={p.body} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.495, 0.06, 8, 28]} />
            <Toon color="#d93a3a" />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.1, 0.12, -0.6]} rotation={[0.55, 0, s * 0.35]}>
              <boxGeometry args={[0.1, 0.4, 0.03]} />
              <Toon color="#d93a3a" />
            </mesh>
          ))}
        </>
      )
    case 'knight':
      return (
        <>
          <Dome color={p.body} r={0.54} y={0.1} z={-0.04} cover={0.62} scale={[1.02, 0.96, 1.04]} />
          <mesh position={[0, 0.2, 0.5]}>
            <boxGeometry args={[0.07, 0.34, 0.05]} />
            <Toon color="#a3adb8" />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.5, -0.1, 0.02]}>
              <boxGeometry args={[0.07, 0.4, 0.34]} />
              <Toon color="#a3adb8" />
            </mesh>
          ))}
          <mesh position={[0, 0.58, -0.02]} scale={[0.4, 0.75, 1.3]}>
            <sphereGeometry args={[0.16, 12, 10]} />
            <Toon color="#d93a3a" />
          </mesh>
        </>
      )
    case 'dragon':
      return (
        <>
          <Hood color={p.body} />
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.22, 0.5, -0.06]} rotation={[-0.5, 0, s * -0.35]}>
              <coneGeometry args={[0.07, 0.3, 8]} />
              <Toon color="#f1e7cf" />
            </mesh>
          ))}
          {[0.46, 0.34, 0.2].map((y, i) => (
            <mesh key={i} position={[0, y, -0.2 - i * 0.14]} rotation={[-0.5, 0, 0]}>
              <coneGeometry args={[0.07, 0.18, 5]} />
              <Toon color="#a83a28" />
            </mesh>
          ))}
          {[-1, 1].map((s) => (
            <mesh key={`n${s}`} position={[s * 0.04, -0.08, 0.49]}>
              <sphereGeometry args={[0.014, 6, 6]} />
              <Toon color="#6a1f12" />
            </mesh>
          ))}
        </>
      )
    case 'lion':
      return (
        <>
          <mesh position={[0, 0.0, -0.14]} scale={[1.14, 1.1, 0.7]}>
            <sphereGeometry args={[0.62, 22, 16]} />
            <Toon color="#9a5a22" />
          </mesh>
          {Array.from({ length: 14 }, (_, i) => {
            const a = (i / 14) * Math.PI * 2
            return (
              <mesh key={i} position={[Math.cos(a) * 0.55, Math.sin(a) * 0.5, -0.06]}>
                <sphereGeometry args={[0.15, 10, 8]} />
                <Toon color={i % 2 ? '#a8652a' : '#8a4e1c'} />
              </mesh>
            )
          })}
          <Dome color={p.body} r={0.5} y={0.1} z={-0.02} cover={0.5} scale={[1.0, 0.9, 1.0]} />
          <Ear x={-0.3} y={0.46} c={p.body} inner="#f2c9a0" r={0.13} />
          <Ear x={0.3} y={0.46} c={p.body} inner="#f2c9a0" r={0.13} />
          <mesh position={[0, -0.06, 0.475]} scale={[1.4, 0.9, 0.7]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <Toon color="#6a3a1a" />
          </mesh>
        </>
      )
  }
  return null
}

/* ───────────── 코스튬: 몸통 앞/뒤 장식 (body 그룹) ───────────── */

function Tail({ children, y = -0.18, z = -0.28 }: { children: ReactNode; y?: number; z?: number }) {
  return <group position={[0, y, z]}>{children}</group>
}

export function CostumeBodyMore({ id }: { id: string }) {
  const p = COSTUME_MORE[id]
  switch (id) {
    case 'penguin':
      return (
        <Tail y={-0.3} z={-0.26}>
          <mesh rotation={[-0.9, 0, 0]}>
            <coneGeometry args={[0.1, 0.22, 4]} />
            <Toon color={p.body} />
          </mesh>
        </Tail>
      )
    case 'bunny':
      return (
        <Tail>
          <mesh>
            <sphereGeometry args={[0.14, 12, 10]} />
            <Toon color={WHITE} />
          </mesh>
        </Tail>
      )
    case 'fox':
      return (
        <Tail y={-0.1} z={-0.34}>
          <mesh rotation={[0.9, 0, 0]} scale={[1, 1, 1]}>
            <capsuleGeometry args={[0.12, 0.3, 6, 12]} />
            <Toon color={p.body} />
          </mesh>
          <mesh position={[0, 0.17, -0.2]}>
            <sphereGeometry args={[0.13, 10, 8]} />
            <Toon color={WHITE} />
          </mesh>
        </Tail>
      )
    case 'duck':
      return (
        <Tail y={-0.12} z={-0.3}>
          <mesh rotation={[-1.0, 0, 0]}>
            <coneGeometry args={[0.1, 0.2, 6]} />
            <Toon color={p.body} />
          </mesh>
        </Tail>
      )
    case 'unicorn':
      return (
        <Tail y={-0.16} z={-0.3}>
          {(['#ff8fb1', '#ffd36e', '#8fe3a1', '#8ec5ff'] as string[]).map((c, i) => (
            <mesh key={c} position={[(i - 1.5) * 0.04, -0.08 * i, -0.04 * i]} rotation={[0.5, 0, (i - 1.5) * 0.18]}>
              <capsuleGeometry args={[0.04, 0.3, 4, 8]} />
              <Toon color={c} />
            </mesh>
          ))}
        </Tail>
      )
    case 'ghost':
      return (
        <>
          <mesh position={[0, -0.34, 0]}>
            <cylinderGeometry args={[0.3, 0.44, 0.34, 20]} />
            <Toon color={p.body} />
          </mesh>
          {Array.from({ length: 9 }, (_, i) => {
            const a = (i / 9) * Math.PI * 2
            return (
              <mesh key={i} position={[Math.sin(a) * 0.4, -0.52, Math.cos(a) * 0.4]}>
                <sphereGeometry args={[0.1, 10, 8]} />
                <Toon color={p.body} />
              </mesh>
            )
          })}
        </>
      )
    case 'snowman':
      return (
        <>
          {[0.09, -0.04, -0.17].map((y, i) => (
            <mesh key={i} position={[0, y, surf(y) + 0.015]}>
              <sphereGeometry args={[0.028, 8, 8]} />
              <Toon color="#25262b" />
            </mesh>
          ))}
          <mesh position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.21, 0.065, 8, 22]} />
            <Toon color="#d93a3a" />
          </mesh>
          <mesh position={[0.1, 0.06, 0.22]} rotation={[0, 0, 0.15]}>
            <boxGeometry args={[0.09, 0.28, 0.04]} />
            <Toon color="#d93a3a" />
          </mesh>
        </>
      )
    case 'ninja':
      return (
        <>
          <mesh position={[0, -0.12, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.295, 0.04, 8, 24]} />
            <Toon color="#d93a3a" />
          </mesh>
          <mesh position={[0.1, -0.12, -0.3]} rotation={[0.3, 0, -0.3]}>
            <boxGeometry args={[0.06, 0.26, 0.02]} />
            <Toon color="#d93a3a" />
          </mesh>
          <Shaped kind="star" size={0.12} color="#9aa3ad" position={[0, 0.0, -0.3]} rotation={[0, Math.PI, 0.3]} depth={0.02} />
        </>
      )
    case 'knight':
      return (
        <>
          <mesh position={[0, 0.06, surf(0.06) + 0.012]}>
            <boxGeometry args={[0.07, 0.26, 0.018]} />
            <Toon color="#d93a3a" />
          </mesh>
          <mesh position={[0, 0.1, surf(0.1) + 0.012]}>
            <boxGeometry args={[0.2, 0.065, 0.018]} />
            <Toon color="#d93a3a" />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.32, 0.2, 0]} scale={[1, 0.7, 1]}>
              <sphereGeometry args={[0.13, 12, 10]} />
              <Toon color="#9aa3ad" />
            </mesh>
          ))}
          <mesh position={[0, -0.1, -0.24]} rotation={[0.16, 0, 0]}>
            <boxGeometry args={[0.46, 0.6, 0.03]} />
            <Toon color="#c0433f" />
          </mesh>
        </>
      )
    case 'dragon':
      return (
        <>
          {[1, -1].map((s) => (
            <Shaped
              key={s}
              kind="wing"
              size={0.5}
              depth={0.02}
              color="#ef7a5a"
              position={[s * 0.1, 0.12, -0.26]}
              rotation={[0, s > 0 ? 0.55 : Math.PI - 0.55, 0.2 * s]}
            />
          ))}
          {[0.12, -0.02, -0.16].map((y, i) => (
            <mesh key={i} position={[0, y, -0.32]} rotation={[-0.4, 0, 0]}>
              <coneGeometry args={[0.07, 0.16, 5]} />
              <Toon color="#a83a28" />
            </mesh>
          ))}
          {[
            [0, -0.24, -0.3, 0.12],
            [0, -0.2, -0.44, 0.1],
            [0, -0.14, -0.56, 0.08],
          ].map(([x, y, z, r], i) => (
            <mesh key={`t${i}`} position={[x, y, z]}>
              <sphereGeometry args={[r, 10, 8]} />
              <Toon color={p.body} />
            </mesh>
          ))}
          <mesh position={[0, -0.1, -0.66]} rotation={[-Math.PI / 2 + 0.2, 0, 0]}>
            <coneGeometry args={[0.1, 0.18, 4]} />
            <Toon color="#a83a28" />
          </mesh>
        </>
      )
    case 'lion':
      return (
        <Tail y={-0.2} z={-0.3}>
          <mesh rotation={[0.8, 0, 0]}>
            <capsuleGeometry args={[0.04, 0.34, 4, 8]} />
            <Toon color={p.body} />
          </mesh>
          <mesh position={[0, 0.2, -0.24]}>
            <sphereGeometry args={[0.1, 10, 8]} />
            <Toon color="#9a5a22" />
          </mesh>
        </Tail>
      )
  }
  return null
}

/* ───────────── 예전 코스튬 8종에 더하는 디테일 ───────────── */

export function OldCostumeHeadExtra({ id }: { id: string }) {
  switch (id) {
    case 'cat':
      return (
        <>
          {[-1, 1].map((s) => (
            <group key={s}>
              {[0.0, -0.05, 0.05].map((dy, i) => (
                <mesh key={i} position={[s * 0.45, -0.1 + dy * 1.1, 0.16]} rotation={[0, s * -0.4, s * (-0.15 + i * 0.15)]}>
                  <boxGeometry args={[0.2, 0.012, 0.012]} />
                  <Toon color="#3a3d44" />
                </mesh>
              ))}
            </group>
          ))}
          <mesh position={[0, -0.07, 0.48]} scale={[1.3, 0.9, 0.7]}>
            <sphereGeometry args={[0.035, 8, 8]} />
            <Toon color="#f48fa8" />
          </mesh>
          {[-0.08, 0, 0.08].map((x, i) => (
            <mesh key={i} position={[x, 0.36, 0.38]} rotation={[0.3, 0, 0]}>
              <boxGeometry args={[0.025, 0.12 - Math.abs(x) * 0.5, 0.02]} />
              <Toon color="#3a3d44" />
            </mesh>
          ))}
        </>
      )
    case 'bear':
      return (
        <>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.32, 0.44, 0.1]} scale={[0.6, 0.6, 0.4]}>
              <sphereGeometry args={[0.16, 10, 8]} />
              <Toon color="#5a3a24" />
            </mesh>
          ))}
          <mesh position={[0, -0.04, 0.55]} scale={[1.2, 0.9, 0.7]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <Toon color="#3a2418" />
          </mesh>
        </>
      )
    case 'robot':
      return (
        <>
          <Dome color="#b6bcc4" r={0.51} y={0.06} z={-0.03} cover={0.58} scale={[1.07, 1.0, 1.05]} />
          <mesh position={[0, 0.22, 0.44]}>
            <boxGeometry args={[0.42, 0.04, 0.03]} />
            <Toon color="#7c828b" />
          </mesh>
          {[-0.08, -0.025, 0.03, 0.085].map((x, i) => (
            <mesh key={i} position={[x * 1.3, -0.19, 0.455]}>
              <boxGeometry args={[0.022, 0.07, 0.02]} />
              <Toon color="#7c828b" />
            </mesh>
          ))}
          <mesh position={[0, 0.3, 0.42]}>
            <boxGeometry args={[0.5, 0.012, 0.02]} />
            <Toon color="#7c828b" />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.4, 0.28, 0.2]}>
              <sphereGeometry args={[0.025, 6, 6]} />
              <Toon color="#7c828b" />
            </mesh>
          ))}
        </>
      )
    case 'pumpkin':
      return (
        <>
          <mesh position={[-0.13, 0.55, 0.0]} rotation={[0, 0, 0.5]} scale={[1.8, 0.35, 1]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <Toon color="#5ca047" />
          </mesh>
          <mesh position={[0.1, 0.62, 0]} rotation={[0, 0, 0]}>
            <torusGeometry args={[0.06, 0.012, 6, 14, Math.PI * 1.5]} />
            <Toon color="#5ca047" />
          </mesh>
        </>
      )
    case 'space':
      return (
        <>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.5, 0.18, 0.12]}>
              <sphereGeometry args={[0.04, 8, 8]} />
              <Glow color="#ffe27a" />
            </mesh>
          ))}
          <mesh position={[0, 0.1, 0.0]} scale={[1.02, 1.02, 1.02]}>
            <sphereGeometry args={[0.62, 20, 14, 0, Math.PI * 2, Math.PI * 0.18, Math.PI * 0.18]} />
            <meshToonMaterial gradientMap={toonGradientRef} color="#ffe9a8" transparent opacity={0.25} />
          </mesh>
        </>
      )
    case 'frog':
      return (
        <>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.3, -0.08, 0.35]} scale={[1, 0.7, 0.4]}>
              <sphereGeometry args={[0.08, 8, 8]} />
              <Toon color="#ff9fb0" />
            </mesh>
          ))}
        </>
      )
    case 'shark':
      return (
        <>
          {[-1, 1].map((s) => (
            <group key={s}>
              {[0, 1, 2].map((i) => (
                <mesh key={i} position={[s * 0.47, -0.02 - i * 0.07, 0.04]} rotation={[0, s * 0.3, 0.3 * s]}>
                  <boxGeometry args={[0.012, 0.05, 0.1]} />
                  <Toon color="#5a6f7d" />
                </mesh>
              ))}
            </group>
          ))}
        </>
      )
  }
  return null
}

export function OldCostumeBodyExtra({ id }: { id: string }) {
  switch (id) {
    case 'dino':
      return (
        <>
          {([[0.12, 0.05, -0.25], [-0.16, -0.1, -0.22], [0.2, -0.12, -0.18], [-0.06, 0.12, -0.26]] as [number, number, number][]).map(
            ([x, y, z], i) => (
              <mesh key={i} position={[x, y, z]} scale={[1, 1, 0.4]}>
                <sphereGeometry args={[0.07, 8, 8]} />
                <Toon color="#4f9c43" />
              </mesh>
            ),
          )}
          {[0.0, -0.1, -0.2].map((y, i) => (
            <mesh key={`s${i}`} position={[0, y, surf(y) - 0.01]} scale={[0.75, 0.3, 0.2]}>
              <sphereGeometry args={[0.2, 12, 8]} />
              <Toon color="#b9dd94" />
            </mesh>
          ))}
        </>
      )
    case 'cat':
      return (
        <>
          {[0.06, -0.04, -0.14].map((y, i) => (
            <mesh key={i} position={[0, y, -0.285]} rotation={[0, 0, 0]} scale={[1, 0.18, 0.4]}>
              <sphereGeometry args={[0.2, 12, 8]} />
              <Toon color="#5f646c" />
            </mesh>
          ))}
        </>
      )
    case 'robot':
      return (
        <>
          <mesh position={[0, 0.0, 0.23]}>
            <boxGeometry args={[0.2, 0.12, 0.012]} />
            <Glow color="#7fe9ff" />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.3, 0.15, 0.04]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.04, 0.04, 0.06, 8]} />
              <Toon color="#7c828b" />
            </mesh>
          ))}
          <mesh position={[0, -0.16, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.27, 0.02, 6, 20]} />
            <Toon color="#8f97a1" />
          </mesh>
        </>
      )
    case 'pumpkin':
      return (
        <>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.1, 0.06, 0.345]} rotation={[0.1, 0, 0]}>
              <coneGeometry args={[0.055, 0.08, 3]} />
              <Glow color="#ffe27a" />
            </mesh>
          ))}
          {[-0.1, -0.05, 0, 0.05, 0.1].map((x, i) => (
            <mesh key={i} position={[x, -0.07 + (i % 2) * 0.025, 0.365]}>
              <boxGeometry args={[0.04, 0.03, 0.012]} />
              <Glow color="#ffe27a" />
            </mesh>
          ))}
        </>
      )
    case 'space':
      return (
        <>
          <mesh position={[0, 0.0, -0.3]}>
            <boxGeometry args={[0.38, 0.44, 0.16]} />
            <Toon color="#e5eaef" />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.1, -0.28, -0.3]}>
              <cylinderGeometry args={[0.05, 0.07, 0.1, 10]} />
              <Toon color="#8f97a1" />
            </mesh>
          ))}
          <mesh position={[0, 0.0, surf(0) + 0.006]}>
            <boxGeometry args={[0.2, 0.14, 0.012]} />
            <Toon color="#7c828b" />
          </mesh>
          {[-0.06, 0, 0.06].map((x, i) => (
            <mesh key={i} position={[x, 0.0, surf(0) + 0.015]}>
              <sphereGeometry args={[0.018, 6, 6]} />
              <Glow color={['#ff6b6b', '#ffd23f', '#6bd66b'][i]} />
            </mesh>
          ))}
          <mesh position={[0.32, 0.2, 0.0]}>
            <boxGeometry args={[0.012, 0.09, 0.14]} />
            <Toon color="#d93a3a" />
          </mesh>
        </>
      )
    case 'frog':
      return (
        <>
          {([[0.14, 0.06, -0.26], [-0.12, -0.08, -0.26], [0.1, -0.16, -0.24]] as [number, number, number][]).map(([x, y, z], i) => (
            <mesh key={i} position={[x, y, z]} scale={[1, 1, 0.4]}>
              <sphereGeometry args={[0.065, 8, 8]} />
              <Toon color="#3f8f33" />
            </mesh>
          ))}
        </>
      )
    case 'shark':
      return (
        <>
          {[-1, 1].map((s) => (
            <group key={s}>
              {[0, 1, 2].map((i) => (
                <mesh key={i} position={[s * 0.285, 0.1 - i * 0.07, 0.04]} rotation={[0, 0, s * 0.2]}>
                  <boxGeometry args={[0.012, 0.05, 0.1]} />
                  <Toon color="#5a6f7d" />
                </mesh>
              ))}
            </group>
          ))}
        </>
      )
  }
  return null
}

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { toonGradient } from './toon'

// 탈 것 3D 모델 — 캐릭터가 +z 방향(앞)을 보고, 발이 y=0 근처에 오도록 만든다.

type V3 = [number, number, number]

function Toon({ color, emissive, ei = 0.35 }: { color: string; emissive?: string; ei?: number }) {
  return (
    <meshToonMaterial
      gradientMap={toonGradient}
      color={color}
      emissive={emissive ?? '#000000'}
      emissiveIntensity={emissive ? ei : 0}
    />
  )
}

// 두 점을 잇는 막대 (프레임·손잡이 대·고삐 등)
function Bar({ from, to, r = 0.03, color }: { from: V3; to: V3; r?: number; color: string }) {
  const a = new THREE.Vector3(...from)
  const b = new THREE.Vector3(...to)
  const mid = a.clone().add(b).multiplyScalar(0.5)
  const len = a.distanceTo(b)
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize())
  return (
    <mesh position={mid} quaternion={q}>
      <cylinderGeometry args={[r, r, len, 8]} />
      <Toon color={color} />
    </mesh>
  )
}

// 바퀴: 도넛 모양 타이어 + 림 + 살 + 허브 (축은 x 방향)
function Wheel({ r, tire = 0.035, color = '#2b2d33', rim = '#d8dde6' }: { r: number; tire?: number; color?: string; rim?: string }) {
  return (
    <group>
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[r, tire, 8, 28]} />
        <Toon color={color} />
      </mesh>
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[r - tire * 0.9, 0.012, 6, 28]} />
        <Toon color={rim} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} rotation={[(i * Math.PI) / 3, 0, 0]}>
          <boxGeometry args={[0.012, (r - tire) * 2, 0.012]} />
          <Toon color={rim} />
        </mesh>
      ))}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.04, 0.04, 0.07, 10]} />
        <Toon color={rim} />
      </mesh>
    </group>
  )
}

// 납작한 알약 모양 판 (킥보드·호버보드 발판): 가운데 직사각형 + 양 끝 반원
function Pill({ w, l, h, color, y = 0, emissive }: { w: number; l: number; h: number; color: string; y?: number; emissive?: string }) {
  const rr = w / 2
  const mid = Math.max(0.001, l - w)
  return (
    <group position={[0, y, 0]}>
      <mesh>
        <boxGeometry args={[w, h, mid]} />
        <Toon color={color} emissive={emissive} />
      </mesh>
      {[1, -1].map((s) => (
        <mesh key={s} position={[0, 0, (s * mid) / 2]}>
          <cylinderGeometry args={[rr, rr, h, 18]} />
          <Toon color={color} emissive={emissive} />
        </mesh>
      ))}
    </group>
  )
}

function Kick() {
  const front = useRef<THREE.Group>(null)
  const back = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (front.current) front.current.rotation.x += dt * 3
    if (back.current) back.current.rotation.x += dt * 3
  })
  return (
    <group>
      {/* 발판 + 미끄럼 방지 */}
      <Pill w={0.36} l={0.95} h={0.05} color="#35c6b0" y={0.17} />
      <Pill w={0.3} l={0.82} h={0.012} color="#2a2d34" y={0.2} />
      {/* 뒷바퀴 + 덮개 */}
      <group position={[0, 0.12, -0.5]}>
        <group ref={back}>
          <Wheel r={0.11} tire={0.03} />
        </group>
      </group>
      <mesh position={[0, 0.25, -0.5]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.1, 0.02, 0.2]} />
        <Toon color="#e8624f" />
      </mesh>
      {/* 앞바퀴 + 포크 */}
      <group position={[0, 0.12, 0.52]}>
        <group ref={front}>
          <Wheel r={0.11} tire={0.03} />
        </group>
      </group>
      <Bar from={[0.06, 0.12, 0.52]} to={[0.04, 0.5, 0.45]} r={0.018} color="#c9ced6" />
      <Bar from={[-0.06, 0.12, 0.52]} to={[-0.04, 0.5, 0.45]} r={0.018} color="#c9ced6" />
      {/* 손잡이 대 + 손잡이 */}
      <Bar from={[0, 0.17, 0.5]} to={[0, 1.02, 0.4]} r={0.03} color="#e8e8ee" />
      <mesh position={[0, 1.02, 0.4]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.025, 0.025, 0.46, 8]} />
        <Toon color="#c9ced6" />
      </mesh>
      {[1, -1].map((s) => (
        <mesh key={s} position={[s * 0.2, 1.02, 0.4]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.036, 0.036, 0.1, 10]} />
          <Toon color="#e8624f" />
        </mesh>
      ))}
      <mesh position={[0, 1.08, 0.4]}>
        <sphereGeometry args={[0.045, 10, 8]} />
        <Toon color="#ffd84a" emissive="#ffd84a" ei={0.5} />
      </mesh>
    </group>
  )
}

function Bike() {
  const a = useRef<THREE.Group>(null)
  const b = useRef<THREE.Group>(null)
  const crank = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (a.current) a.current.rotation.x += dt * 3
    if (b.current) b.current.rotation.x += dt * 3
    if (crank.current) crank.current.rotation.x += dt * 3
  })
  const frame = '#ff5a5f'
  return (
    <group>
      {/* 바퀴 */}
      <group position={[0, 0.32, 0.55]}>
        <group ref={a}>
          <Wheel r={0.3} tire={0.04} />
        </group>
      </group>
      <group position={[0, 0.32, -0.55]}>
        <group ref={b}>
          <Wheel r={0.3} tire={0.04} />
        </group>
      </group>
      {/* 흙받이 */}
      {[0.55, -0.55].map((z) => (
        <group key={z} position={[0, 0.32, z]} rotation={[0, Math.PI / 2, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2 - (Math.PI * 0.7) / 2]}>
            <torusGeometry args={[0.35, 0.015, 6, 16, Math.PI * 0.7]} />
            <Toon color="#e9eef5" />
          </mesh>
        </group>
      ))}
      {/* 프레임 */}
      <Bar from={[0, 0.32, -0.55]} to={[0, 0.34, -0.05]} r={0.034} color={frame} />
      <Bar from={[0, 0.34, -0.05]} to={[0, 0.7, -0.14]} r={0.034} color={frame} />
      <Bar from={[0, 0.7, -0.14]} to={[0, 0.32, -0.55]} r={0.034} color={frame} />
      <Bar from={[0, 0.7, -0.14]} to={[0, 0.74, 0.4]} r={0.034} color={frame} />
      <Bar from={[0, 0.34, -0.05]} to={[0, 0.74, 0.4]} r={0.034} color={frame} />
      <Bar from={[0, 0.74, 0.4]} to={[0, 0.32, 0.55]} r={0.03} color="#e9eef5" />
      {/* 안장 */}
      <Bar from={[0, 0.7, -0.14]} to={[0, 0.78, -0.17]} r={0.022} color="#c9ced6" />
      <mesh position={[0, 0.8, -0.18]}>
        <boxGeometry args={[0.18, 0.06, 0.32]} />
        <Toon color="#2a2d34" />
      </mesh>
      {/* 손잡이 */}
      <Bar from={[0, 0.74, 0.4]} to={[0, 0.9, 0.4]} r={0.025} color="#c9ced6" />
      <mesh position={[0, 0.9, 0.4]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.024, 0.024, 0.5, 8]} />
        <Toon color="#c9ced6" />
      </mesh>
      {[1, -1].map((s) => (
        <mesh key={s} position={[s * 0.22, 0.9, 0.4]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.035, 0.035, 0.1, 10]} />
          <Toon color="#2a2d34" />
        </mesh>
      ))}
      {/* 앞 바구니 + 전조등 */}
      <mesh position={[0, 0.88, 0.62]}>
        <cylinderGeometry args={[0.14, 0.11, 0.16, 12, 1, true]} />
        <meshToonMaterial gradientMap={toonGradient} color="#d99b52" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.8, 0.62]}>
        <cylinderGeometry args={[0.11, 0.11, 0.015, 12]} />
        <Toon color="#b9803a" />
      </mesh>
      <mesh position={[0, 0.98, 0.36]}>
        <sphereGeometry args={[0.05, 10, 8]} />
        <Toon color="#ffe27a" emissive="#ffe27a" ei={0.7} />
      </mesh>
      {/* 페달 */}
      <group position={[0, 0.34, -0.05]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.1, 0.1, 0.03, 14]} />
          <Toon color="#9aa2ad" />
        </mesh>
        <group ref={crank}>
          <mesh position={[0.1, -0.1, 0]}>
            <boxGeometry args={[0.1, 0.03, 0.08]} />
            <Toon color="#2a2d34" />
          </mesh>
          <mesh position={[-0.1, 0.1, 0]}>
            <boxGeometry args={[0.1, 0.03, 0.08]} />
            <Toon color="#2a2d34" />
          </mesh>
        </group>
      </group>
    </group>
  )
}

function Eye({ p }: { p: V3 }) {
  return (
    <group position={p}>
      <mesh>
        <sphereGeometry args={[0.04, 10, 8]} />
        <meshToonMaterial gradientMap={toonGradient} color="#ffffff" />
      </mesh>
      <mesh position={[p[0] > 0 ? 0.012 : -0.012, 0, 0.022]}>
        <sphereGeometry args={[0.026, 8, 8]} />
        <meshBasicMaterial color="#1c1c1c" />
      </mesh>
    </group>
  )
}

function Horse() {
  const coat = '#b9733c'
  const light = '#d9a064'
  const dark = '#4a2c18'
  const tail = useRef<THREE.Group>(null)
  useFrame((s) => {
    if (tail.current) tail.current.rotation.x = -0.6 + Math.sin(s.clock.elapsedTime * 3) * 0.12
  })
  return (
    <group>
      {/* 몸통: 가슴·엉덩이를 둥글게 */}
      <mesh position={[0, 0.66, 0]} scale={[0.46, 0.4, 1.0]}>
        <sphereGeometry args={[0.5, 18, 14]} />
        <Toon color={coat} />
      </mesh>
      <mesh position={[0, 0.68, 0.34]}>
        <sphereGeometry args={[0.25, 14, 12]} />
        <Toon color={coat} />
      </mesh>
      <mesh position={[0, 0.66, -0.34]}>
        <sphereGeometry args={[0.26, 14, 12]} />
        <Toon color={coat} />
      </mesh>
      <mesh position={[0, 0.5, 0]} scale={[0.4, 0.2, 0.9]}>
        <sphereGeometry args={[0.5, 12, 10]} />
        <Toon color={light} />
      </mesh>

      {/* 다리: 위는 굵고 아래는 가늘게 + 발굽 */}
      {([
        [0.15, 0.36, 0.12],
        [-0.15, 0.36, 0.12],
        [0.15, -0.36, -0.05],
        [-0.15, -0.36, -0.05],
      ] as [number, number, number][]).map(([x, z, lean], i) => (
        <group key={i} position={[x, 0.5, z]} rotation={[lean * 0.3, 0, 0]}>
          <mesh position={[0, -0.12, 0]}>
            <cylinderGeometry args={[0.075, 0.06, 0.26, 8]} />
            <Toon color={coat} />
          </mesh>
          <mesh position={[0, -0.32, 0]}>
            <cylinderGeometry args={[0.045, 0.04, 0.2, 8]} />
            <Toon color={coat} />
          </mesh>
          <mesh position={[0, -0.45, 0.01]}>
            <cylinderGeometry args={[0.058, 0.062, 0.07, 8]} />
            <Toon color={dark} />
          </mesh>
        </group>
      ))}

      {/* 목 */}
      <mesh position={[0, 0.98, 0.5]} rotation={[0.62, 0, 0]}>
        <cylinderGeometry args={[0.12, 0.2, 0.56, 12]} />
        <Toon color={coat} />
      </mesh>
      {/* 머리 */}
      <group position={[0, 1.22, 0.74]} rotation={[0.95, 0, 0]}>
        <mesh scale={[0.9, 1.5, 0.9]}>
          <sphereGeometry args={[0.15, 14, 12]} />
          <Toon color={coat} />
        </mesh>
        <mesh position={[0, 0.17, 0.0]} scale={[0.9, 1.05, 0.9]}>
          <sphereGeometry args={[0.12, 12, 10]} />
          <Toon color={light} />
        </mesh>
        {/* 이마의 흰 줄 */}
        <mesh position={[0, 0.0, 0.135]} scale={[0.5, 1.5, 0.3]}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <Toon color="#fff7ea" />
        </mesh>
      </group>
      {/* 코 끝 */}
      <mesh position={[0, 1.1, 0.96]}>
        <sphereGeometry args={[0.1, 12, 10]} />
        <Toon color={light} />
      </mesh>
      <mesh position={[0.035, 1.12, 1.05]}>
        <sphereGeometry args={[0.014, 6, 6]} />
        <meshBasicMaterial color="#3a2414" />
      </mesh>
      <mesh position={[-0.035, 1.12, 1.05]}>
        <sphereGeometry args={[0.014, 6, 6]} />
        <meshBasicMaterial color="#3a2414" />
      </mesh>
      {/* 눈 + 귀 */}
      <Eye p={[0.115, 1.27, 0.85]} />
      <Eye p={[-0.115, 1.27, 0.85]} />
      <mesh position={[0.08, 1.45, 0.7]} rotation={[0.1, 0, 0.25]}>
        <coneGeometry args={[0.05, 0.16, 6]} />
        <Toon color={coat} />
      </mesh>
      <mesh position={[-0.08, 1.45, 0.7]} rotation={[0.1, 0, -0.25]}>
        <coneGeometry args={[0.05, 0.16, 6]} />
        <Toon color={coat} />
      </mesh>
      {/* 갈기 */}
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[0, 1.38 - i * 0.1, 0.62 - i * 0.07]} rotation={[0.5, 0, 0]}>
          <sphereGeometry args={[0.075 - i * 0.004, 8, 8]} />
          <Toon color={dark} />
        </mesh>
      ))}
      {/* 꼬리 */}
      <group ref={tail} position={[0, 0.78, -0.55]} rotation={[-0.6, 0, 0]}>
        <mesh position={[0, -0.18, 0]}>
          <cylinderGeometry args={[0.05, 0.09, 0.4, 8]} />
          <Toon color={dark} />
        </mesh>
        <mesh position={[0, -0.42, 0]} scale={[1, 1.4, 1]}>
          <sphereGeometry args={[0.09, 10, 8]} />
          <Toon color={dark} />
        </mesh>
      </group>

      {/* 안장 담요 + 안장 + 고삐 */}
      <mesh position={[0, 0.9, -0.04]}>
        <boxGeometry args={[0.5, 0.05, 0.5]} />
        <Toon color="#3a78d8" />
      </mesh>
      <mesh position={[0, 0.94, -0.06]}>
        <boxGeometry args={[0.34, 0.06, 0.34]} />
        <Toon color="#c9433f" />
      </mesh>
      <Bar from={[0.07, 1.12, 0.68]} to={[0.12, 1.02, 0.28]} r={0.01} color="#2a2d34" />
      <Bar from={[-0.07, 1.12, 0.68]} to={[-0.12, 1.02, 0.28]} r={0.01} color="#2a2d34" />
    </group>
  )
}

function Cloud() {
  const g = useRef<THREE.Group>(null)
  useFrame((s) => {
    // 구름은 둥실둥실
    if (g.current) g.current.position.y = Math.sin(s.clock.elapsedTime * 2.2) * 0.04
  })
  const puffs: [number, number, number, number][] = [
    [0, 0.14, 0, 0.44],
    [0.4, 0.1, 0.08, 0.32],
    [-0.4, 0.1, -0.04, 0.32],
    [0.18, 0.1, 0.38, 0.3],
    [-0.18, 0.1, 0.36, 0.3],
    [0.16, 0.12, -0.36, 0.3],
    [-0.2, 0.12, -0.34, 0.28],
    [0.05, 0.3, -0.08, 0.28],
  ]
  return (
    <group ref={g}>
      {puffs.map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]} scale={[1, 0.72, 1]}>
          <sphereGeometry args={[r, 16, 12]} />
          <Toon color="#ffffff" emissive="#dbe8ff" ei={0.85} />
        </mesh>
      ))}
      {/* 귀여운 얼굴 */}
      {[1, -1].map((s) => (
        <group key={s}>
          <mesh position={[s * 0.13, 0.16, 0.66]} scale={[0.8, 1.1, 0.5]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshBasicMaterial color="#35424f" />
          </mesh>
          <mesh position={[s * 0.24, 0.09, 0.64]} scale={[1.2, 0.7, 0.4]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshBasicMaterial color="#ffb6c4" />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.08, 0.68]} scale={[1, 0.5, 0.4]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshBasicMaterial color="#35424f" />
      </mesh>
      {/* 반짝이 */}
      {([[0.55, 0.45, 0.1], [-0.5, 0.5, 0.2], [0.35, 0.6, -0.3]] as V3[]).map((p, i) => (
        <mesh key={i} position={p} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.07, 0.07, 0.02]} />
          <meshBasicMaterial color="#fff2a8" />
        </mesh>
      ))}
    </group>
  )
}

function Board() {
  const g = useRef<THREE.Group>(null)
  const glow = useRef<THREE.Mesh>(null)
  useFrame((s) => {
    const t = s.clock.elapsedTime
    if (g.current) g.current.position.y = Math.sin(t * 3) * 0.03
    if (glow.current) glow.current.scale.setScalar(1 + Math.sin(t * 6) * 0.1)
  })
  return (
    <group ref={g}>
      {/* 발판 */}
      <Pill w={0.46} l={1.15} h={0.07} color="#7a6af0" y={0.24} />
      <Pill w={0.4} l={1.05} h={0.02} color="#23252c" y={0.285} />
      {/* 네온 줄무늬 + 앞코 */}
      {[1, -1].map((s) => (
        <mesh key={s} position={[s * 0.235, 0.24, 0]}>
          <boxGeometry args={[0.02, 0.03, 0.7]} />
          <meshBasicMaterial color="#7ff3ff" />
        </mesh>
      ))}
      <mesh position={[0, 0.245, 0.62]}>
        <boxGeometry args={[0.22, 0.04, 0.06]} />
        <meshBasicMaterial color="#ff7ad9" />
      </mesh>
      {/* 아래 분사구 + 빛 */}
      {[0.32, -0.32].map((z) => (
        <group key={z} position={[0, 0.17, z]}>
          <mesh>
            <cylinderGeometry args={[0.13, 0.1, 0.07, 14]} />
            <Toon color="#3b3f4a" />
          </mesh>
          <mesh position={[0, -0.04, 0]}>
            <cylinderGeometry args={[0.09, 0.09, 0.02, 14]} />
            <meshBasicMaterial color="#7ff3ff" />
          </mesh>
        </group>
      ))}
      <mesh ref={glow} position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.15, 0.42, 28]} />
        <meshBasicMaterial color="#7ff3ff" transparent opacity={0.5} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  )
}

export function RideModel({ id }: { id: string }) {
  switch (id) {
    case 'kick':
      return <Kick />
    case 'bike':
      return <Bike />
    case 'horse':
      return <Horse />
    case 'cloud':
      return <Cloud />
    case 'board':
      return <Board />
    default:
      return null
  }
}

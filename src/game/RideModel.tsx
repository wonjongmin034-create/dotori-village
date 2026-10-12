import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { toonGradient } from './toon'

function Toon({ color }: { color: string }) {
  return <meshToonMaterial gradientMap={toonGradient} color={color} />
}

// 바퀴: x축을 가로로 눕힌 원통(타이어) + 가운데 허브
function Wheel({ r, w = 0.07, color = '#33363b', hub = '#c9ced6' }: { r: number; w?: number; color?: string; hub?: string }) {
  return (
    <group rotation={[0, 0, Math.PI / 2]}>
      <mesh>
        <cylinderGeometry args={[r, r, w, 18]} />
        <Toon color={color} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[r * 0.45, r * 0.45, w + 0.02, 12]} />
        <Toon color={hub} />
      </mesh>
    </group>
  )
}

function Bar({ from, to, r = 0.025, color }: { from: [number, number, number]; to: [number, number, number]; r?: number; color: string }) {
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

function Kick() {
  return (
    <group>
      <mesh position={[0, 0.13, -0.02]}>
        <boxGeometry args={[0.34, 0.05, 0.95]} />
        <Toon color="#e8624f" />
      </mesh>
      <mesh position={[0, 0.16, -0.02]}>
        <boxGeometry args={[0.3, 0.012, 0.9]} />
        <Toon color="#2c2f36" />
      </mesh>
      <group position={[0, 0.1, 0.5]}>
        <Wheel r={0.1} />
      </group>
      <group position={[0, 0.1, -0.5]}>
        <Wheel r={0.1} />
      </group>
      <Bar from={[0, 0.12, 0.5]} to={[0, 0.98, 0.42]} r={0.03} color="#c9ced6" />
      <mesh position={[0, 0.98, 0.42]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.03, 0.03, 0.5, 8]} />
        <Toon color="#2c2f36" />
      </mesh>
    </group>
  )
}

function Bike() {
  const spin = useRef<THREE.Group>(null)
  const spin2 = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    // 바퀴는 천천히 계속 돈다 (움직이는 중인지 몰라도 어색하지 않게)
    if (spin.current) spin.current.rotation.x += dt * 2
    if (spin2.current) spin2.current.rotation.x += dt * 2
  })
  return (
    <group>
      <group position={[0, 0.3, 0.55]}>
        <group ref={spin}>
          <Wheel r={0.3} w={0.06} />
          <mesh>
            <boxGeometry args={[0.02, 0.5, 0.02]} />
            <Toon color="#c9ced6" />
          </mesh>
        </group>
      </group>
      <group position={[0, 0.3, -0.55]}>
        <group ref={spin2}>
          <Wheel r={0.3} w={0.06} />
          <mesh>
            <boxGeometry args={[0.02, 0.5, 0.02]} />
            <Toon color="#c9ced6" />
          </mesh>
        </group>
      </group>
      <Bar from={[0, 0.3, -0.55]} to={[0, 0.58, -0.12]} color="#4a90e2" r={0.03} />
      <Bar from={[0, 0.58, -0.12]} to={[0, 0.3, 0.1]} color="#4a90e2" r={0.03} />
      <Bar from={[0, 0.3, 0.1]} to={[0, 0.3, -0.55]} color="#4a90e2" r={0.03} />
      <Bar from={[0, 0.58, -0.12]} to={[0, 0.58, 0.45]} color="#4a90e2" r={0.03} />
      <Bar from={[0, 0.58, 0.45]} to={[0, 0.3, 0.55]} color="#c9ced6" r={0.03} />
      <mesh position={[0, 0.62, -0.18]}>
        <boxGeometry args={[0.2, 0.06, 0.3]} />
        <Toon color="#2c2f36" />
      </mesh>
      <mesh position={[0, 0.74, 0.45]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.025, 0.025, 0.5, 8]} />
        <Toon color="#2c2f36" />
      </mesh>
      <Bar from={[0, 0.58, 0.45]} to={[0, 0.74, 0.45]} color="#c9ced6" r={0.025} />
      <mesh position={[0, 0.25, 0.1]}>
        <boxGeometry args={[0.28, 0.04, 0.1]} />
        <Toon color="#2c2f36" />
      </mesh>
    </group>
  )
}

function Horse() {
  const body = '#a8683a'
  const dark = '#5a361c'
  const legs: [number, number][] = [
    [0.15, 0.4],
    [-0.15, 0.4],
    [0.15, -0.4],
    [-0.15, -0.4],
  ]
  return (
    <group>
      {/* 몸통 */}
      <mesh position={[0, 0.62, 0]} scale={[0.5, 0.44, 1.1]}>
        <sphereGeometry args={[0.5, 18, 14]} />
        <Toon color={body} />
      </mesh>
      {legs.map(([x, z], i) => (
        <group key={i} position={[x, 0.42, z]}>
          <mesh position={[0, -0.2, 0]}>
            <cylinderGeometry args={[0.06, 0.05, 0.4, 8]} />
            <Toon color={body} />
          </mesh>
          <mesh position={[0, -0.4, 0.01]}>
            <cylinderGeometry args={[0.065, 0.065, 0.06, 8]} />
            <Toon color={dark} />
          </mesh>
        </group>
      ))}
      {/* 목 + 머리 */}
      <mesh position={[0, 0.95, 0.5]} rotation={[0.6, 0, 0]}>
        <cylinderGeometry args={[0.13, 0.19, 0.55, 10]} />
        <Toon color={body} />
      </mesh>
      <mesh position={[0, 1.12, 0.74]} rotation={[1.0, 0, 0]}>
        <boxGeometry args={[0.22, 0.4, 0.22]} />
        <Toon color={body} />
      </mesh>
      <mesh position={[0, 1.04, 0.9]}>
        <boxGeometry args={[0.2, 0.14, 0.14]} />
        <Toon color="#d9b48a" />
      </mesh>
      <mesh position={[0.09, 1.3, 0.66]} rotation={[0, 0, 0.2]}>
        <coneGeometry args={[0.05, 0.14, 6]} />
        <Toon color={dark} />
      </mesh>
      <mesh position={[-0.09, 1.3, 0.66]} rotation={[0, 0, -0.2]}>
        <coneGeometry args={[0.05, 0.14, 6]} />
        <Toon color={dark} />
      </mesh>
      <mesh position={[0.1, 1.18, 0.84]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshBasicMaterial color="#1c1c1c" />
      </mesh>
      <mesh position={[-0.1, 1.18, 0.84]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshBasicMaterial color="#1c1c1c" />
      </mesh>
      {/* 갈기·꼬리 */}
      <mesh position={[0, 1.08, 0.38]} rotation={[0.6, 0, 0]}>
        <boxGeometry args={[0.07, 0.5, 0.1]} />
        <Toon color={dark} />
      </mesh>
      <mesh position={[0, 0.7, -0.62]} rotation={[-0.5, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.1, 0.4, 8]} />
        <Toon color={dark} />
      </mesh>
      {/* 안장 */}
      <mesh position={[0, 0.88, -0.05]}>
        <boxGeometry args={[0.36, 0.06, 0.4]} />
        <Toon color="#c94a4a" />
      </mesh>
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
    [0, 0.12, 0, 0.42],
    [0.34, 0.08, 0.06, 0.3],
    [-0.34, 0.08, -0.04, 0.3],
    [0.12, 0.1, 0.34, 0.28],
    [-0.14, 0.1, -0.34, 0.28],
    [0.1, 0.18, -0.2, 0.26],
  ]
  return (
    <group ref={g}>
      {puffs.map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]} scale={[1, 0.7, 1]}>
          <sphereGeometry args={[r, 14, 12]} />
          <meshToonMaterial gradientMap={toonGradient} color={i % 2 ? '#ffffff' : '#eef5ff'} />
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
    if (glow.current) glow.current.scale.setScalar(1 + Math.sin(t * 6) * 0.08)
  })
  return (
    <group ref={g}>
      <mesh position={[0, 0.18, 0]} scale={[0.4, 0.06, 1]}>
        <sphereGeometry args={[0.5, 18, 10]} />
        <Toon color="#6b5bd6" />
      </mesh>
      <mesh position={[0, 0.215, 0]} scale={[0.34, 0.02, 0.88]}>
        <sphereGeometry args={[0.5, 18, 10]} />
        <Toon color="#2c2f36" />
      </mesh>
      <mesh position={[0, 0.17, 0.55]}>
        <boxGeometry args={[0.2, 0.05, 0.06]} />
        <meshBasicMaterial color="#7ff3ff" />
      </mesh>
      <mesh ref={glow} position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.16, 0.3, 24]} />
        <meshBasicMaterial color="#7ff3ff" transparent opacity={0.55} side={THREE.DoubleSide} depthWrite={false} />
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

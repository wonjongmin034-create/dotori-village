import { toonGradient } from './toon'

// 옷장 — 캐릭터 꾸미기.
export function WardrobeModel() {
  return (
    <group>
      {/* 본체 */}
      <mesh position={[0, 0.85, 0]}>
        <boxGeometry args={[1.3, 1.7, 0.7]} />
        <meshToonMaterial gradientMap={toonGradient} color="#9a6a3e" />
      </mesh>
      {/* 문 두 짝 */}
      {[-0.32, 0.32].map((x) => (
        <mesh key={x} position={[x, 0.9, 0.37]}>
          <boxGeometry args={[0.58, 1.4, 0.05]} />
          <meshToonMaterial gradientMap={toonGradient} color="#b07f4c" />
        </mesh>
      ))}
      {/* 손잡이 */}
      {[-0.06, 0.06].map((x) => (
        <mesh key={x} position={[x, 0.9, 0.42]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshToonMaterial gradientMap={toonGradient} color="#4a3524" />
        </mesh>
      ))}
      {/* 다리 */}
      {[
        [-0.55, -0.28],
        [0.55, -0.28],
        [-0.55, 0.28],
        [0.55, 0.28],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.06, z]}>
          <boxGeometry args={[0.1, 0.12, 0.1]} />
          <meshToonMaterial gradientMap={toonGradient} color="#6b4a2f" />
        </mesh>
      ))}
      {/* 위에 거울 */}
      <mesh position={[0, 1.55, -0.36]} rotation={[0.1, 0, 0]}>
        <boxGeometry args={[0.7, 0.9, 0.05]} />
        <meshToonMaterial gradientMap={toonGradient} color="#bfe3ea" />
      </mesh>
    </group>
  )
}

import { toonGradient } from './toon'

// 날아가는 화살. 앞쪽이 +Z (화살촉 쪽)라서 group.lookAt(목표) 또는 rotation.y = atan2(vx, vz) 로 방향을 맞춘다.
export function ArrowModel({ feather = '#ff6a6a', len = 1.1, scale = 1 }: { feather?: string; len?: number; scale?: number }) {
  const head = 0.24
  const shaft = len - head
  return (
    <group scale={scale}>
      {/* 화살대 */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -head / 2]}>
        <cylinderGeometry args={[0.035, 0.035, shaft, 6]} />
        <meshToonMaterial gradientMap={toonGradient} color="#b07a3e" />
      </mesh>
      {/* 화살촉 */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, shaft / 2 - head / 2 + head / 2]}>
        <coneGeometry args={[0.1, head, 6]} />
        <meshToonMaterial gradientMap={toonGradient} color="#dfe6ee" />
      </mesh>
      {/* 깃털 두 장 (십자) */}
      {[0, Math.PI / 2].map((roll) => (
        <group key={roll} position={[0, 0, -len / 2 + 0.16]} rotation={[0, 0, roll]}>
          <mesh rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[0.3, 0.22]} />
            <meshBasicMaterial color={feather} side={2} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

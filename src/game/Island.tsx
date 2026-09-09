import { useVillage, landHalf } from './store'

// 네모 섬. 크기는 마을 땅(집.land)에 따라 커진다. 잔디 윗면 y=0.
export function Island() {
  const half = useVillage((s) => landHalf(s.items))
  const w = half * 2

  return (
    <group>
      {/* 물 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.7, 0]}>
        <planeGeometry args={[600, 600]} />
        <meshStandardMaterial color="#57b6c8" />
      </mesh>

      {/* 모래 테두리 */}
      <mesh position={[0, -0.42, 0]}>
        <boxGeometry args={[w + 2.4, 0.4, w + 2.4]} />
        <meshStandardMaterial color="#ecdaa8" />
      </mesh>

      {/* 잔디 (윗면 y=0) */}
      <mesh position={[0, -0.25, 0]}>
        <boxGeometry args={[w, 0.5, w]} />
        <meshStandardMaterial color="#7cc25c" />
      </mesh>
    </group>
  )
}

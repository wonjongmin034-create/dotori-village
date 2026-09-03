// 빈 섬 — 시작할 땐 아무것도 없다. 학생이 직접 꾸민다.
// 잔디 윗면이 y=0 이 되도록 맞춘다 (배치되는 물건들의 기준면).
export function Island() {
  return (
    <group>
      {/* 물 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.7, 0]}>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial color="#57b6c8" />
      </mesh>

      {/* 모래 테두리 */}
      <mesh position={[0, -0.42, 0]}>
        <cylinderGeometry args={[20.5, 20.5, 0.4, 56]} />
        <meshStandardMaterial color="#ecdaa8" />
      </mesh>

      {/* 잔디 섬 (윗면 y=0) */}
      <mesh position={[0, -0.25, 0]}>
        <cylinderGeometry args={[19, 19.8, 0.5, 56]} />
        <meshStandardMaterial color="#7cc25c" />
      </mesh>
    </group>
  )
}

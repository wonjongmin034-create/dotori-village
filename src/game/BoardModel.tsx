import { toonGradient } from './toon'
// 마을 게시판 — 숙제·급식을 보는 곳.
export function BoardModel() {
  return (
    <group>
      {/* 기둥 */}
      {[-1.1, 1.1].map((x) => (
        <mesh key={x} position={[x, 1, 0]}>
          <cylinderGeometry args={[0.1, 0.12, 2, 7]} />
          <meshToonMaterial gradientMap={toonGradient} color="#7c5230" />
        </mesh>
      ))}
      {/* 게시판 뒷판 */}
      <mesh position={[0, 1.5, 0]}>
        <boxGeometry args={[2.6, 1.7, 0.12]} />
        <meshToonMaterial gradientMap={toonGradient} color="#5f3e22" />
      </mesh>
      {/* 코르크 면 */}
      <mesh position={[0, 1.5, 0.08]}>
        <boxGeometry args={[2.3, 1.4, 0.05]} />
        <meshToonMaterial gradientMap={toonGradient} color="#d8b98a" />
      </mesh>
      {/* 지붕 */}
      <mesh position={[0, 2.55, 0]} rotation={[0.35, 0, 0]}>
        <boxGeometry args={[2.9, 0.1, 0.9]} />
        <meshToonMaterial gradientMap={toonGradient} color="#a6522f" />
      </mesh>
      {/* 붙어있는 쪽지들 */}
      {[
        [-0.6, 1.7, '#fff6d6'],
        [0.5, 1.75, '#e5f2ff'],
        [-0.1, 1.15, '#ffe6ec'],
        [0.7, 1.15, '#e8f7e2'],
      ].map(([x, y, c], i) => (
        <mesh key={i} position={[x as number, y as number, 0.12]} rotation={[0, 0, (i - 1.5) * 0.05]}>
          <planeGeometry args={[0.62, 0.5]} />
          <meshToonMaterial gradientMap={toonGradient} color={c as string} />
        </mesh>
      ))}
    </group>
  )
}

import { toonGradient } from './toon'

function M({ c }: { c: string }) {
  return <meshToonMaterial gradientMap={toonGradient} color={c} />
}

const SOIL = '#7b5233'
const SOIL_DARK = '#684327'
const PLANK = '#b88650'
const PLANK_DARK = '#9c6d3e'

// 밭: 나무 테두리 + 이랑이 있는 흙
export function Plot() {
  return (
    <group>
      <mesh position={[0, 0.06, 0]}>
        <boxGeometry args={[1.32, 0.12, 1.32]} />
        <M c={SOIL} />
      </mesh>
      {[-0.4, 0, 0.4].map((z) => (
        <mesh key={z} position={[0, 0.13, z]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.085, 1.0, 4, 8]} />
          <M c={SOIL_DARK} />
        </mesh>
      ))}
      {/* 테두리 널빤지 */}
      {[
        [0, -0.7, 1.5, 0.1],
        [0, 0.7, 1.5, 0.1],
      ].map(([x, z, w, d], i) => (
        <mesh key={`h${i}`} position={[x, 0.09, z]}>
          <boxGeometry args={[w, 0.18, d]} />
          <M c={i ? PLANK : PLANK_DARK} />
        </mesh>
      ))}
      {[-0.7, 0.7].map((x, i) => (
        <mesh key={`v${i}`} position={[x, 0.09, 0]}>
          <boxGeometry args={[0.1, 0.18, 1.3]} />
          <M c={i ? PLANK_DARK : PLANK} />
        </mesh>
      ))}
      {/* 모서리 말뚝 */}
      {[
        [-0.7, -0.7],
        [0.7, -0.7],
        [-0.7, 0.7],
        [0.7, 0.7],
      ].map(([x, z], i) => (
        <mesh key={`p${i}`} position={[x, 0.13, z]}>
          <boxGeometry args={[0.15, 0.26, 0.15]} />
          <M c="#8d5f33" />
        </mesh>
      ))}
      {/* 작은 돌 */}
      <mesh position={[0.58, 0.13, 0.5]} scale={[1.3, 0.7, 1]}>
        <sphereGeometry args={[0.045, 6, 5]} />
        <M c="#b5b2a8" />
      </mesh>
      <mesh position={[-0.55, 0.13, -0.52]} scale={[1.2, 0.7, 1]}>
        <sphereGeometry args={[0.035, 6, 5]} />
        <M c="#c4c1b6" />
      </mesh>
    </group>
  )
}

// 우리: 짚이 깔린 울타리 + 빨간 작은 헛간 + 먹이통
export function Coop() {
  const WOOD = '#bd8a52'
  const RAIL = '#cf9d63'
  const posts: [number, number, number][] = [
    [-0.88, -0.88, 0.5],
    [0.88, -0.88, 0.5],
    [-0.88, 0.88, 0.5],
    [0.88, 0.88, 0.5],
    [-0.88, 0, 0.46],
    [0.88, 0, 0.46],
    [0, -0.88, 0.46],
    [-0.3, 0.88, 0.58],
    [0.3, 0.88, 0.58],
  ]
  return (
    <group>
      {/* 바닥 짚 */}
      <mesh position={[0, 0.03, 0]}>
        <boxGeometry args={[1.84, 0.06, 1.84]} />
        <M c="#e0c67c" />
      </mesh>
      {[
        [-0.45, 0.2, 0.3],
        [0.35, 0.05, -0.2],
        [-0.1, 0.55, 0.5],
      ].map(([x, z, r], i) => (
        <mesh key={i} position={[x, 0.07, z]} rotation={[0, r * 4, 0]} scale={[1.5, 0.35, 1]}>
          <sphereGeometry args={[0.16, 7, 5]} />
          <M c="#efd88a" />
        </mesh>
      ))}

      {/* 울타리 말뚝 */}
      {posts.map(([x, z, h], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, h / 2, 0]}>
            <boxGeometry args={[0.09, h, 0.09]} />
            <M c={WOOD} />
          </mesh>
          <mesh position={[0, h + 0.01, 0]}>
            <sphereGeometry args={[0.058, 7, 6]} />
            <M c="#d9a96d" />
          </mesh>
        </group>
      ))}
      {/* 가로대: 뒤·좌·우 + 앞(가운데 문 열림) */}
      {[0.2, 0.4].map((y) => (
        <group key={y}>
          <mesh position={[0, y, -0.88]}>
            <boxGeometry args={[1.76, 0.05, 0.05]} />
            <M c={RAIL} />
          </mesh>
          <mesh position={[-0.88, y, 0]}>
            <boxGeometry args={[0.05, 0.05, 1.76]} />
            <M c={RAIL} />
          </mesh>
          <mesh position={[0.88, y, 0]}>
            <boxGeometry args={[0.05, 0.05, 1.76]} />
            <M c={RAIL} />
          </mesh>
          <mesh position={[-0.59, y, 0.88]}>
            <boxGeometry args={[0.58, 0.05, 0.05]} />
            <M c={RAIL} />
          </mesh>
          <mesh position={[0.59, y, 0.88]}>
            <boxGeometry args={[0.58, 0.05, 0.05]} />
            <M c={RAIL} />
          </mesh>
        </group>
      ))}

      {/* 헛간 (뒤쪽) */}
      <group position={[0, 0, -0.62]}>
        <mesh position={[0, 0.3, 0]}>
          <boxGeometry args={[1.12, 0.6, 0.52]} />
          <M c="#d96a52" />
        </mesh>
        {/* 흰 문틀 + 어두운 문 */}
        <mesh position={[0, 0.25, 0.27]}>
          <boxGeometry args={[0.4, 0.46, 0.02]} />
          <M c="#fff5e6" />
        </mesh>
        <mesh position={[0, 0.23, 0.285]}>
          <boxGeometry args={[0.3, 0.4, 0.02]} />
          <M c="#6b3b2a" />
        </mesh>
        {/* 지붕 */}
        {[-1, 1].map((k) => (
          <mesh key={k} position={[0, 0.74, k * 0.2]} rotation={[k * -0.6, 0, 0]}>
            <boxGeometry args={[1.28, 0.06, 0.46]} />
            <M c="#8f4a35" />
          </mesh>
        ))}
        <mesh position={[0, 0.9, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.04, 0.04, 1.3, 6]} />
          <M c="#70382a" />
        </mesh>
        {/* 박공 삼각 */}
        {[-1, 1].map((k) => (
          <mesh key={k} position={[k * 0.55, 0.7, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.24, 0.24, 0.05, 3]} />
            <M c="#e57a60" />
          </mesh>
        ))}
        {/* 건초 창 */}
        <mesh position={[0.36, 0.5, 0.27]}>
          <boxGeometry args={[0.16, 0.12, 0.02]} />
          <M c="#fff5e6" />
        </mesh>
        <mesh position={[0.36, 0.5, 0.285]}>
          <boxGeometry args={[0.11, 0.08, 0.02]} />
          <M c="#f0d56a" />
        </mesh>
      </group>

      {/* 먹이통 */}
      <group position={[0.5, 0, 0.6]} rotation={[0, -0.3, 0]}>
        <mesh position={[0, 0.1, 0]}>
          <boxGeometry args={[0.5, 0.14, 0.2]} />
          <M c="#a97644" />
        </mesh>
        <mesh position={[0, 0.17, 0]}>
          <boxGeometry args={[0.42, 0.03, 0.13]} />
          <M c="#e8c657" />
        </mesh>
      </group>

      {/* 건초 더미 */}
      <mesh position={[-0.72, 0.13, 0.4]} rotation={[0, 0.4, Math.PI / 2]}>
        <cylinderGeometry args={[0.12, 0.12, 0.3, 10]} />
        <M c="#e9d27e" />
      </mesh>
      <mesh position={[-0.72, 0.13, 0.4]} rotation={[0, 0.4, Math.PI / 2]}>
        <torusGeometry args={[0.121, 0.012, 5, 14]} />
        <M c="#b88a45" />
      </mesh>
    </group>
  )
}

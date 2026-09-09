import type { ReactElement } from 'react'
import { toonGradient } from './toon'

// 우리 집 5단계 — 기본 도형 로우폴리. 나중에 glTF로 교체.
const WALL = '#f0e2c4'
const WALL2 = '#e9d3a8'
const WOOD = '#8a5a33'
const ROOF = '#b45c3c'
const ROOF2 = '#9a4a30'
const DOOR = '#6b4a30'
const WIN = '#bfe3ea'

function Tent(): ReactElement {
  return (
    <group>
      <mesh position={[0, 0.9, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[1.5, 1.8, 4]} />
        <meshToonMaterial gradientMap={toonGradient} color="#d98b5f" />
      </mesh>
      <mesh position={[0, 0.45, 0.75]}>
        <coneGeometry args={[0.45, 0.9, 3]} />
        <meshToonMaterial gradientMap={toonGradient} color={DOOR} />
      </mesh>
      <mesh position={[0, 1.85, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.5, 5]} />
        <meshToonMaterial gradientMap={toonGradient} color={WOOD} />
      </mesh>
    </group>
  )
}

function Cabin(): ReactElement {
  return (
    <group>
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[2.2, 1.2, 2]} />
        <meshToonMaterial gradientMap={toonGradient} color={WOOD} />
      </mesh>
      <mesh position={[0, 1.5, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[1.9, 0.9, 4]} />
        <meshToonMaterial gradientMap={toonGradient} color={ROOF} />
      </mesh>
      <mesh position={[0, 0.5, 1.01]}>
        <boxGeometry args={[0.6, 1, 0.08]} />
        <meshToonMaterial gradientMap={toonGradient} color={DOOR} />
      </mesh>
    </group>
  )
}

function Cottage(): ReactElement {
  return (
    <group>
      <mesh position={[0, 0.75, 0]}>
        <boxGeometry args={[2.8, 1.5, 2.4]} />
        <meshToonMaterial gradientMap={toonGradient} color={WALL} />
      </mesh>
      <mesh position={[0, 1.9, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[2.4, 1.1, 4]} />
        <meshToonMaterial gradientMap={toonGradient} color={ROOF} />
      </mesh>
      {/* 문 + 현관 */}
      <mesh position={[0, 0.55, 1.21]}>
        <boxGeometry args={[0.7, 1.1, 0.08]} />
        <meshToonMaterial gradientMap={toonGradient} color={DOOR} />
      </mesh>
      <mesh position={[0, 0.05, 1.5]}>
        <boxGeometry args={[1.1, 0.1, 0.7]} />
        <meshToonMaterial gradientMap={toonGradient} color={WOOD} />
      </mesh>
      {/* 창문 */}
      {[-0.9, 0.9].map((x) => (
        <mesh key={x} position={[x, 0.85, 1.22]}>
          <boxGeometry args={[0.55, 0.55, 0.06]} />
          <meshToonMaterial gradientMap={toonGradient} color={WIN} />
        </mesh>
      ))}
      {/* 굴뚝 */}
      <mesh position={[0.9, 2.3, -0.3]}>
        <boxGeometry args={[0.35, 0.8, 0.35]} />
        <meshToonMaterial gradientMap={toonGradient} color={ROOF2} />
      </mesh>
    </group>
  )
}

function TwoStory(): ReactElement {
  return (
    <group>
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[3, 1.6, 2.6]} />
        <meshToonMaterial gradientMap={toonGradient} color={WALL} />
      </mesh>
      <mesh position={[0, 2.1, 0]}>
        <boxGeometry args={[2.6, 1.3, 2.3]} />
        <meshToonMaterial gradientMap={toonGradient} color={WALL2} />
      </mesh>
      <mesh position={[0, 3.05, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[2.2, 1, 4]} />
        <meshToonMaterial gradientMap={toonGradient} color={ROOF} />
      </mesh>
      <mesh position={[0, 0.6, 1.31]}>
        <boxGeometry args={[0.75, 1.2, 0.08]} />
        <meshToonMaterial gradientMap={toonGradient} color={DOOR} />
      </mesh>
      {[
        [-1, 0.9, 1.32],
        [1, 0.9, 1.32],
        [-0.7, 2.1, 1.17],
        [0.7, 2.1, 1.17],
      ].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]}>
          <boxGeometry args={[0.5, 0.55, 0.06]} />
          <meshToonMaterial gradientMap={toonGradient} color={WIN} />
        </mesh>
      ))}
      <mesh position={[1.1, 3.4, -0.3]}>
        <boxGeometry args={[0.35, 0.9, 0.35]} />
        <meshToonMaterial gradientMap={toonGradient} color={ROOF2} />
      </mesh>
    </group>
  )
}

function Mansion(): ReactElement {
  return (
    <group>
      {/* 가운데 본채 */}
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[3.4, 2, 2.8]} />
        <meshToonMaterial gradientMap={toonGradient} color={WALL} />
      </mesh>
      <mesh position={[0, 2.5, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[2.6, 1.2, 4]} />
        <meshToonMaterial gradientMap={toonGradient} color={ROOF} />
      </mesh>
      {/* 양쪽 날개 */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 2.6, 0, 0.2]}>
          <mesh position={[0, 0.8, 0]}>
            <boxGeometry args={[2, 1.6, 2.2]} />
            <meshToonMaterial gradientMap={toonGradient} color={WALL2} />
          </mesh>
          <mesh position={[0, 1.9, 0]} rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[1.7, 0.9, 4]} />
            <meshToonMaterial gradientMap={toonGradient} color={ROOF2} />
          </mesh>
          <mesh position={[0, 0.9, 1.12]}>
            <boxGeometry args={[0.6, 0.6, 0.06]} />
            <meshToonMaterial gradientMap={toonGradient} color={WIN} />
          </mesh>
        </group>
      ))}
      {/* 현관 기둥 */}
      {[-0.7, 0.7].map((x) => (
        <mesh key={x} position={[x, 0.9, 1.7]}>
          <cylinderGeometry args={[0.14, 0.14, 1.8, 8]} />
          <meshToonMaterial gradientMap={toonGradient} color={WALL} />
        </mesh>
      ))}
      <mesh position={[0, 1.9, 1.6]}>
        <boxGeometry args={[2, 0.3, 0.8]} />
        <meshToonMaterial gradientMap={toonGradient} color={ROOF2} />
      </mesh>
      <mesh position={[0, 0.75, 1.42]}>
        <boxGeometry args={[0.9, 1.5, 0.1]} />
        <meshToonMaterial gradientMap={toonGradient} color={DOOR} />
      </mesh>
      {[-1.1, 1.1].map((x) => (
        <mesh key={x} position={[x, 1.1, 1.42]}>
          <boxGeometry args={[0.55, 0.7, 0.06]} />
          <meshToonMaterial gradientMap={toonGradient} color={WIN} />
        </mesh>
      ))}
      <mesh position={[1.3, 3, -0.4]}>
        <boxGeometry args={[0.4, 1, 0.4]} />
        <meshToonMaterial gradientMap={toonGradient} color={ROOF2} />
      </mesh>
    </group>
  )
}

const MODELS: Record<number, ReactElement> = {
  1: <Tent />,
  2: <Cabin />,
  3: <Cottage />,
  4: <TwoStory />,
  5: <Mansion />,
}

export function HouseView({ level }: { level: number }) {
  return MODELS[level] ?? MODELS[1]
}

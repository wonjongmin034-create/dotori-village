import type { ReactElement } from 'react'

// M1 카탈로그 — 지금은 기본 도형으로 만든 로우폴리 소품.
// 나중에 Kenney / Quaternius glTF 모델로 교체 예정.

const LEAF = '#4f9e57'
const LEAF2 = '#63b56b'
const WOOD = '#8a5a33'
const WOOD2 = '#a9702a'
const STONE = '#9aa0a6'
const SAND = '#e6d2a0'
const WATER = '#5bb7c9'
const RED = '#c65f5f'
const CREAM = '#f2e6cf'

export type CatalogEntry = {
  type: string
  label: string
  emoji: string
  model: ReactElement
}

function Tree(): ReactElement {
  return (
    <group>
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.16, 0.22, 1.4, 6]} />
        <meshStandardMaterial color={WOOD} />
      </mesh>
      <mesh position={[0, 1.9, 0]}>
        <icosahedronGeometry args={[1.1, 0]} />
        <meshStandardMaterial color={LEAF} flatShading />
      </mesh>
    </group>
  )
}

function Pine(): ReactElement {
  return (
    <group>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.13, 0.18, 1, 6]} />
        <meshStandardMaterial color={WOOD} />
      </mesh>
      <mesh position={[0, 1.3, 0]}>
        <coneGeometry args={[0.85, 1.2, 7]} />
        <meshStandardMaterial color={LEAF} flatShading />
      </mesh>
      <mesh position={[0, 2.0, 0]}>
        <coneGeometry args={[0.6, 1, 7]} />
        <meshStandardMaterial color={LEAF2} flatShading />
      </mesh>
    </group>
  )
}

function Bush(): ReactElement {
  return (
    <group position={[0, 0.35, 0]}>
      <mesh>
        <icosahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial color={LEAF2} flatShading />
      </mesh>
      <mesh position={[0.4, -0.05, 0.1]}>
        <icosahedronGeometry args={[0.35, 0]} />
        <meshStandardMaterial color={LEAF} flatShading />
      </mesh>
      <mesh position={[-0.35, -0.05, -0.1]}>
        <icosahedronGeometry args={[0.33, 0]} />
        <meshStandardMaterial color={LEAF} flatShading />
      </mesh>
    </group>
  )
}

function Flowers(): ReactElement {
  const spots: [number, number, string][] = [
    [0.2, 0.15, '#e8618c'],
    [-0.2, -0.1, '#f2c14e'],
    [0.05, -0.3, '#6db1e8'],
    [-0.3, 0.25, '#b57ede'],
    [0.35, -0.3, '#f2c14e'],
  ]
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <circleGeometry args={[0.6, 16]} />
        <meshStandardMaterial color="#6b8f4e" />
      </mesh>
      {spots.map(([x, z, c], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.18, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.36, 4]} />
            <meshStandardMaterial color="#3f7a3f" />
          </mesh>
          <mesh position={[0, 0.38, 0]}>
            <icosahedronGeometry args={[0.1, 0]} />
            <meshStandardMaterial color={c} flatShading />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function Rock(): ReactElement {
  return (
    <group position={[0, 0.28, 0]}>
      <mesh rotation={[0.3, 0.6, 0.1]}>
        <dodecahedronGeometry args={[0.55, 0]} />
        <meshStandardMaterial color={STONE} flatShading />
      </mesh>
      <mesh position={[0.45, -0.15, 0.2]} rotation={[0.1, 1, 0.4]}>
        <dodecahedronGeometry args={[0.28, 0]} />
        <meshStandardMaterial color="#adb2b8" flatShading />
      </mesh>
    </group>
  )
}

function Fence(): ReactElement {
  return (
    <group>
      {[-0.45, 0.45].map((x) => (
        <mesh key={x} position={[x, 0.35, 0]}>
          <boxGeometry args={[0.12, 0.7, 0.12]} />
          <meshStandardMaterial color={WOOD2} />
        </mesh>
      ))}
      {[0.2, 0.48].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <boxGeometry args={[1, 0.09, 0.07]} />
          <meshStandardMaterial color={WOOD} />
        </mesh>
      ))}
    </group>
  )
}

function Path(): ReactElement {
  return (
    <mesh position={[0, 0.04, 0]}>
      <boxGeometry args={[1, 0.08, 1]} />
      <meshStandardMaterial color={SAND} />
    </mesh>
  )
}

function Lamp(): ReactElement {
  return (
    <group>
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 1.8, 6]} />
        <meshStandardMaterial color="#3c4a44" />
      </mesh>
      <mesh position={[0, 1.9, 0]}>
        <boxGeometry args={[0.26, 0.3, 0.26]} />
        <meshStandardMaterial color="#ffe9a8" emissive="#ffcf5c" emissiveIntensity={0.5} />
      </mesh>
    </group>
  )
}

function Bench(): ReactElement {
  return (
    <group position={[0, 0.25, 0]}>
      <mesh>
        <boxGeometry args={[1.1, 0.1, 0.4]} />
        <meshStandardMaterial color={WOOD2} />
      </mesh>
      <mesh position={[0, 0.28, -0.16]}>
        <boxGeometry args={[1.1, 0.45, 0.08]} />
        <meshStandardMaterial color={WOOD2} />
      </mesh>
      {[-0.45, 0.45].map((x) => (
        <mesh key={x} position={[x, -0.18, 0]}>
          <boxGeometry args={[0.1, 0.3, 0.36]} />
          <meshStandardMaterial color={WOOD} />
        </mesh>
      ))}
    </group>
  )
}

function Table(): ReactElement {
  return (
    <group position={[0, 0.42, 0]}>
      <mesh>
        <cylinderGeometry args={[0.55, 0.55, 0.1, 16]} />
        <meshStandardMaterial color={CREAM} />
      </mesh>
      <mesh position={[0, -0.25, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 0.5, 8]} />
        <meshStandardMaterial color={WOOD} />
      </mesh>
      <mesh position={[0, -0.48, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.06, 12]} />
        <meshStandardMaterial color={WOOD} />
      </mesh>
    </group>
  )
}

function Mailbox(): ReactElement {
  return (
    <group>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 1, 6]} />
        <meshStandardMaterial color={WOOD} />
      </mesh>
      <mesh position={[0, 1.05, 0]}>
        <boxGeometry args={[0.36, 0.28, 0.5]} />
        <meshStandardMaterial color={RED} />
      </mesh>
      <mesh position={[0, 1.19, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.18, 0.18, 0.5, 10, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color="#d97b7b" />
      </mesh>
    </group>
  )
}

function Sign(): ReactElement {
  return (
    <group>
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.9, 6]} />
        <meshStandardMaterial color={WOOD} />
      </mesh>
      <mesh position={[0, 0.85, 0]}>
        <boxGeometry args={[0.7, 0.4, 0.08]} />
        <meshStandardMaterial color={WOOD2} />
      </mesh>
    </group>
  )
}

function Pond(): ReactElement {
  return (
    <group>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[1.2, 1.2, 0.12, 20]} />
        <meshStandardMaterial color={SAND} />
      </mesh>
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[1, 1, 0.08, 20]} />
        <meshStandardMaterial color={WATER} transparent opacity={0.85} />
      </mesh>
    </group>
  )
}

function Tent(): ReactElement {
  return (
    <group position={[0, 0, 0]}>
      <mesh position={[0, 0.55, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[0.95, 1.1, 4]} />
        <meshStandardMaterial color="#d98b5f" flatShading />
      </mesh>
      <mesh position={[0, 0.28, 0.5]}>
        <coneGeometry args={[0.3, 0.55, 3]} />
        <meshStandardMaterial color="#3a2a20" />
      </mesh>
    </group>
  )
}

function Crate(): ReactElement {
  return (
    <mesh position={[0, 0.3, 0]}>
      <boxGeometry args={[0.6, 0.6, 0.6]} />
      <meshStandardMaterial color={WOOD2} />
    </mesh>
  )
}

function Barrel(): ReactElement {
  return (
    <mesh position={[0, 0.4, 0]}>
      <cylinderGeometry args={[0.32, 0.28, 0.8, 12]} />
      <meshStandardMaterial color={WOOD} />
    </mesh>
  )
}

function Campfire(): ReactElement {
  return (
    <group position={[0, 0.1, 0]}>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * 0.3, 0, Math.sin(a) * 0.3]} rotation={[0, -a, 0]}>
            <cylinderGeometry args={[0.05, 0.06, 0.5, 5]} />
            <meshStandardMaterial color={WOOD} />
          </mesh>
        )
      })}
      <mesh position={[0, 0.22, 0]}>
        <coneGeometry args={[0.18, 0.4, 6]} />
        <meshStandardMaterial color="#ff9d3c" emissive="#ff7a1a" emissiveIntensity={0.7} />
      </mesh>
    </group>
  )
}

export const CATALOG: CatalogEntry[] = [
  { type: 'tree', label: '나무', emoji: '🌳', model: <Tree /> },
  { type: 'pine', label: '소나무', emoji: '🌲', model: <Pine /> },
  { type: 'bush', label: '덤불', emoji: '🌿', model: <Bush /> },
  { type: 'flowers', label: '꽃밭', emoji: '🌷', model: <Flowers /> },
  { type: 'rock', label: '바위', emoji: '🪨', model: <Rock /> },
  { type: 'fence', label: '울타리', emoji: '🚧', model: <Fence /> },
  { type: 'path', label: '길', emoji: '🟫', model: <Path /> },
  { type: 'lamp', label: '가로등', emoji: '💡', model: <Lamp /> },
  { type: 'bench', label: '벤치', emoji: '🪑', model: <Bench /> },
  { type: 'table', label: '탁자', emoji: '🍽️', model: <Table /> },
  { type: 'mailbox', label: '우편함', emoji: '📮', model: <Mailbox /> },
  { type: 'sign', label: '표지판', emoji: '🪧', model: <Sign /> },
  { type: 'pond', label: '연못', emoji: '💧', model: <Pond /> },
  { type: 'tent', label: '텐트', emoji: '⛺', model: <Tent /> },
  { type: 'crate', label: '나무상자', emoji: '📦', model: <Crate /> },
  { type: 'barrel', label: '나무통', emoji: '🛢️', model: <Barrel /> },
  { type: 'campfire', label: '모닥불', emoji: '🔥', model: <Campfire /> },
]

export const CATALOG_MAP: Record<string, CatalogEntry> = Object.fromEntries(
  CATALOG.map((e) => [e.type, e]),
)

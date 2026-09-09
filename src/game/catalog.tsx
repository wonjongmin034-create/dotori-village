import type { ReactElement } from 'react'
import { toonGradient } from './toon'

// M2 카탈로그 — 기본 도형 로우폴리. 나중에 Kenney / Quaternius glTF 로 교체.
// cost: 0 = 무료, 그 외 = 도토리 필요. category: 꾸미기 / 농사 / 가축.

const LEAF = '#4f9e57'
const LEAF2 = '#63b56b'
const WOOD = '#8a5a33'
const WOOD2 = '#a9702a'
const STONE = '#9aa0a6'
const SAND = '#e6d2a0'
const WATER = '#5bb7c9'
const RED = '#c65f5f'
const CREAM = '#f2e6cf'
const SOIL = '#7a5230'

export type Category = 'decor' | 'farm' | 'animal'

export type CatalogEntry = {
  type: string
  label: string
  emoji: string
  cost: number
  category: Category
  model: ReactElement
}

/* ---------- 무료 기본 꾸미기 ---------- */

function Tree(): ReactElement {
  return (
    <group>
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.16, 0.22, 1.4, 6]} />
        <meshToonMaterial gradientMap={toonGradient} color={WOOD} />
      </mesh>
      <mesh position={[0, 1.9, 0]}>
        <icosahedronGeometry args={[1.1, 0]} />
        <meshToonMaterial gradientMap={toonGradient} color={LEAF} />
      </mesh>
    </group>
  )
}

function Pine(): ReactElement {
  return (
    <group>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.13, 0.18, 1, 6]} />
        <meshToonMaterial gradientMap={toonGradient} color={WOOD} />
      </mesh>
      <mesh position={[0, 1.3, 0]}>
        <coneGeometry args={[0.85, 1.2, 7]} />
        <meshToonMaterial gradientMap={toonGradient} color={LEAF} />
      </mesh>
      <mesh position={[0, 2.0, 0]}>
        <coneGeometry args={[0.6, 1, 7]} />
        <meshToonMaterial gradientMap={toonGradient} color={LEAF2} />
      </mesh>
    </group>
  )
}

function Bush(): ReactElement {
  return (
    <group position={[0, 0.35, 0]}>
      <mesh>
        <icosahedronGeometry args={[0.5, 0]} />
        <meshToonMaterial gradientMap={toonGradient} color={LEAF2} />
      </mesh>
      <mesh position={[0.4, -0.05, 0.1]}>
        <icosahedronGeometry args={[0.35, 0]} />
        <meshToonMaterial gradientMap={toonGradient} color={LEAF} />
      </mesh>
      <mesh position={[-0.35, -0.05, -0.1]}>
        <icosahedronGeometry args={[0.33, 0]} />
        <meshToonMaterial gradientMap={toonGradient} color={LEAF} />
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
        <meshToonMaterial gradientMap={toonGradient} color="#6b8f4e" />
      </mesh>
      {spots.map(([x, z, c], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.18, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.36, 4]} />
            <meshToonMaterial gradientMap={toonGradient} color="#3f7a3f" />
          </mesh>
          <mesh position={[0, 0.38, 0]}>
            <icosahedronGeometry args={[0.1, 0]} />
            <meshToonMaterial gradientMap={toonGradient} color={c} />
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
        <meshToonMaterial gradientMap={toonGradient} color={STONE} />
      </mesh>
      <mesh position={[0.45, -0.15, 0.2]} rotation={[0.1, 1, 0.4]}>
        <dodecahedronGeometry args={[0.28, 0]} />
        <meshToonMaterial gradientMap={toonGradient} color="#adb2b8" />
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
          <meshToonMaterial gradientMap={toonGradient} color={WOOD2} />
        </mesh>
      ))}
      {[0.2, 0.48].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <boxGeometry args={[1, 0.09, 0.07]} />
          <meshToonMaterial gradientMap={toonGradient} color={WOOD} />
        </mesh>
      ))}
    </group>
  )
}

function Path(): ReactElement {
  return (
    <mesh position={[0, 0.04, 0]}>
      <boxGeometry args={[1, 0.08, 1]} />
      <meshToonMaterial gradientMap={toonGradient} color={SAND} />
    </mesh>
  )
}

function Lamp(): ReactElement {
  return (
    <group>
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 1.8, 6]} />
        <meshToonMaterial gradientMap={toonGradient} color="#3c4a44" />
      </mesh>
      <mesh position={[0, 1.9, 0]}>
        <boxGeometry args={[0.26, 0.3, 0.26]} />
        <meshToonMaterial gradientMap={toonGradient} color="#ffe9a8" emissive="#ffcf5c" emissiveIntensity={0.5} />
      </mesh>
    </group>
  )
}

function Bench(): ReactElement {
  return (
    <group position={[0, 0.25, 0]}>
      <mesh>
        <boxGeometry args={[1.1, 0.1, 0.4]} />
        <meshToonMaterial gradientMap={toonGradient} color={WOOD2} />
      </mesh>
      <mesh position={[0, 0.28, -0.16]}>
        <boxGeometry args={[1.1, 0.45, 0.08]} />
        <meshToonMaterial gradientMap={toonGradient} color={WOOD2} />
      </mesh>
      {[-0.45, 0.45].map((x) => (
        <mesh key={x} position={[x, -0.18, 0]}>
          <boxGeometry args={[0.1, 0.3, 0.36]} />
          <meshToonMaterial gradientMap={toonGradient} color={WOOD} />
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
        <meshToonMaterial gradientMap={toonGradient} color={CREAM} />
      </mesh>
      <mesh position={[0, -0.25, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 0.5, 8]} />
        <meshToonMaterial gradientMap={toonGradient} color={WOOD} />
      </mesh>
      <mesh position={[0, -0.48, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.06, 12]} />
        <meshToonMaterial gradientMap={toonGradient} color={WOOD} />
      </mesh>
    </group>
  )
}

function Mailbox(): ReactElement {
  return (
    <group>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 1, 6]} />
        <meshToonMaterial gradientMap={toonGradient} color={WOOD} />
      </mesh>
      <mesh position={[0, 1.05, 0]}>
        <boxGeometry args={[0.36, 0.28, 0.5]} />
        <meshToonMaterial gradientMap={toonGradient} color={RED} />
      </mesh>
      <mesh position={[0, 1.19, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.18, 0.18, 0.5, 10, 1, false, 0, Math.PI]} />
        <meshToonMaterial gradientMap={toonGradient} color="#d97b7b" />
      </mesh>
    </group>
  )
}

function Sign(): ReactElement {
  return (
    <group>
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.9, 6]} />
        <meshToonMaterial gradientMap={toonGradient} color={WOOD} />
      </mesh>
      <mesh position={[0, 0.85, 0]}>
        <boxGeometry args={[0.7, 0.4, 0.08]} />
        <meshToonMaterial gradientMap={toonGradient} color={WOOD2} />
      </mesh>
    </group>
  )
}

function Pond(): ReactElement {
  return (
    <group>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[1.2, 1.2, 0.12, 20]} />
        <meshToonMaterial gradientMap={toonGradient} color={SAND} />
      </mesh>
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[1, 1, 0.08, 20]} />
        <meshToonMaterial gradientMap={toonGradient} color={WATER} transparent opacity={0.85} />
      </mesh>
    </group>
  )
}

function Tent(): ReactElement {
  return (
    <group>
      <mesh position={[0, 0.55, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[0.95, 1.1, 4]} />
        <meshToonMaterial gradientMap={toonGradient} color="#d98b5f" />
      </mesh>
      <mesh position={[0, 0.28, 0.5]}>
        <coneGeometry args={[0.3, 0.55, 3]} />
        <meshToonMaterial gradientMap={toonGradient} color="#3a2a20" />
      </mesh>
    </group>
  )
}

function Crate(): ReactElement {
  return (
    <mesh position={[0, 0.3, 0]}>
      <boxGeometry args={[0.6, 0.6, 0.6]} />
      <meshToonMaterial gradientMap={toonGradient} color={WOOD2} />
    </mesh>
  )
}

function Barrel(): ReactElement {
  return (
    <mesh position={[0, 0.4, 0]}>
      <cylinderGeometry args={[0.32, 0.28, 0.8, 12]} />
      <meshToonMaterial gradientMap={toonGradient} color={WOOD} />
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
            <meshToonMaterial gradientMap={toonGradient} color={WOOD} />
          </mesh>
        )
      })}
      <mesh position={[0, 0.22, 0]}>
        <coneGeometry args={[0.18, 0.4, 6]} />
        <meshToonMaterial gradientMap={toonGradient} color="#ff9d3c" emissive="#ff7a1a" emissiveIntensity={0.7} />
      </mesh>
    </group>
  )
}

/* ---------- 코인 필요 (고급 꾸미기) ---------- */

function BigTree(): ReactElement {
  return (
    <group scale={1.5}>
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.22, 0.3, 1.6, 7]} />
        <meshToonMaterial gradientMap={toonGradient} color={WOOD} />
      </mesh>
      <mesh position={[0, 2.1, 0]}>
        <icosahedronGeometry args={[1.25, 0]} />
        <meshToonMaterial gradientMap={toonGradient} color="#3f8a48" />
      </mesh>
      <mesh position={[0.5, 1.7, 0.3]}>
        <icosahedronGeometry args={[0.7, 0]} />
        <meshToonMaterial gradientMap={toonGradient} color={LEAF} />
      </mesh>
    </group>
  )
}

function CherryTree(): ReactElement {
  return (
    <group>
      <mesh position={[0, 0.75, 0]}>
        <cylinderGeometry args={[0.16, 0.22, 1.5, 6]} />
        <meshToonMaterial gradientMap={toonGradient} color="#6b4a30" />
      </mesh>
      {[
        [0, 2, 0, 1],
        [0.55, 1.75, 0.2, 0.65],
        [-0.5, 1.7, -0.25, 0.6],
      ].map(([x, y, z, s], i) => (
        <mesh key={i} position={[x, y, z]} scale={s}>
          <icosahedronGeometry args={[1, 0]} />
          <meshToonMaterial gradientMap={toonGradient} color="#f4b8d0" />
        </mesh>
      ))}
    </group>
  )
}

function StonePath(): ReactElement {
  return (
    <group position={[0, 0.05, 0]}>
      <mesh>
        <boxGeometry args={[1, 0.1, 1]} />
        <meshToonMaterial gradientMap={toonGradient} color="#b9bcc0" />
      </mesh>
      {[
        [-0.25, 0.06, -0.2],
        [0.28, 0.06, 0.1],
        [-0.05, 0.06, 0.3],
      ].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[0, i, 0]}>
          <boxGeometry args={[0.34, 0.06, 0.28]} />
          <meshToonMaterial gradientMap={toonGradient} color="#9aa0a6" />
        </mesh>
      ))}
    </group>
  )
}

function Fountain(): ReactElement {
  return (
    <group>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[1.1, 1.2, 0.3, 20]} />
        <meshToonMaterial gradientMap={toonGradient} color="#c8ccd0" />
      </mesh>
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.95, 0.95, 0.16, 20]} />
        <meshToonMaterial gradientMap={toonGradient} color={WATER} transparent opacity={0.9} />
      </mesh>
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.1, 0.14, 0.7, 8]} />
        <meshToonMaterial gradientMap={toonGradient} color="#d4d8dc" />
      </mesh>
      <mesh position={[0, 0.95, 0]}>
        <sphereGeometry args={[0.22, 12, 10]} />
        <meshToonMaterial gradientMap={toonGradient} color={WATER} transparent opacity={0.7} />
      </mesh>
    </group>
  )
}

function GardenLight(): ReactElement {
  return (
    <group>
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.05, 0.07, 0.56, 6]} />
        <meshToonMaterial gradientMap={toonGradient} color="#4a5a52" />
      </mesh>
      <mesh position={[0, 0.62, 0]}>
        <sphereGeometry args={[0.14, 12, 10]} />
        <meshToonMaterial gradientMap={toonGradient} color="#fff2c2" emissive="#ffdf8a" emissiveIntensity={0.8} />
      </mesh>
    </group>
  )
}

/* ---------- 농사 · 가축 (땅/우리) ---------- */

function Plot(): ReactElement {
  return (
    <group>
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[1.4, 0.1, 1.4]} />
        <meshToonMaterial gradientMap={toonGradient} color={SOIL} />
      </mesh>
      {[-0.4, 0, 0.4].map((z) => (
        <mesh key={z} position={[0, 0.12, z]}>
          <boxGeometry args={[1.3, 0.06, 0.18]} />
          <meshToonMaterial gradientMap={toonGradient} color="#5f3f24" />
        </mesh>
      ))}
    </group>
  )
}

function Coop(): ReactElement {
  return (
    <group>
      <mesh position={[0, 0.04, 0]}>
        <boxGeometry args={[1.8, 0.08, 1.8]} />
        <meshToonMaterial gradientMap={toonGradient} color="#8a6b45" />
      </mesh>
      {[
        [-0.82, -0.82],
        [0.82, -0.82],
        [-0.82, 0.82],
        [0.82, 0.82],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.35, z]}>
          <boxGeometry args={[0.1, 0.7, 0.1]} />
          <meshToonMaterial gradientMap={toonGradient} color={WOOD2} />
        </mesh>
      ))}
      {[0.25, 0.6].map((y) => (
        <group key={y}>
          <mesh position={[0, y, -0.82]}>
            <boxGeometry args={[1.6, 0.06, 0.06]} />
            <meshToonMaterial gradientMap={toonGradient} color={WOOD} />
          </mesh>
          <mesh position={[0, y, 0.82]}>
            <boxGeometry args={[1.6, 0.06, 0.06]} />
            <meshToonMaterial gradientMap={toonGradient} color={WOOD} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.9, 0.5, 0.9]} />
        <meshToonMaterial gradientMap={toonGradient} color="#c98f5c" />
      </mesh>
      <mesh position={[0, 0.85, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[0.8, 0.4, 4]} />
        <meshToonMaterial gradientMap={toonGradient} color="#a6522f" />
      </mesh>
    </group>
  )
}

export const CATALOG: CatalogEntry[] = [
  // 무료 꾸미기
  { type: 'tree', label: '나무', emoji: '🌳', cost: 0, category: 'decor', model: <Tree /> },
  { type: 'pine', label: '소나무', emoji: '🌲', cost: 0, category: 'decor', model: <Pine /> },
  { type: 'bush', label: '덤불', emoji: '🌿', cost: 0, category: 'decor', model: <Bush /> },
  { type: 'flowers', label: '꽃밭', emoji: '🌷', cost: 0, category: 'decor', model: <Flowers /> },
  { type: 'rock', label: '바위', emoji: '🪨', cost: 0, category: 'decor', model: <Rock /> },
  { type: 'fence', label: '울타리', emoji: '🚧', cost: 0, category: 'decor', model: <Fence /> },
  { type: 'path', label: '흙길', emoji: '🟫', cost: 0, category: 'decor', model: <Path /> },
  { type: 'lamp', label: '가로등', emoji: '💡', cost: 0, category: 'decor', model: <Lamp /> },
  { type: 'bench', label: '벤치', emoji: '🪑', cost: 0, category: 'decor', model: <Bench /> },
  { type: 'table', label: '탁자', emoji: '🍽️', cost: 0, category: 'decor', model: <Table /> },
  { type: 'mailbox', label: '우편함', emoji: '📮', cost: 0, category: 'decor', model: <Mailbox /> },
  { type: 'sign', label: '표지판', emoji: '🪧', cost: 0, category: 'decor', model: <Sign /> },
  { type: 'pond', label: '연못', emoji: '💧', cost: 0, category: 'decor', model: <Pond /> },
  { type: 'tent', label: '텐트', emoji: '⛺', cost: 0, category: 'decor', model: <Tent /> },
  { type: 'crate', label: '나무상자', emoji: '📦', cost: 0, category: 'decor', model: <Crate /> },
  { type: 'barrel', label: '나무통', emoji: '🛢️', cost: 0, category: 'decor', model: <Barrel /> },
  { type: 'campfire', label: '모닥불', emoji: '🔥', cost: 0, category: 'decor', model: <Campfire /> },

  // 코인 필요 (고급 꾸미기)
  { type: 'bigtree', label: '큰나무', emoji: '🌳', cost: 15, category: 'decor', model: <BigTree /> },
  { type: 'cherry', label: '벚나무', emoji: '🌸', cost: 22, category: 'decor', model: <CherryTree /> },
  { type: 'stonepath', label: '돌길', emoji: '🪧', cost: 6, category: 'decor', model: <StonePath /> },
  { type: 'gardenlight', label: '정원등', emoji: '🏮', cost: 10, category: 'decor', model: <GardenLight /> },
  { type: 'fountain', label: '분수대', emoji: '⛲', cost: 40, category: 'decor', model: <Fountain /> },

  // 농사 · 가축
  { type: 'plot', label: '밭', emoji: '🟫', cost: 0, category: 'farm', model: <Plot /> },
  { type: 'coop', label: '우리', emoji: '🏠', cost: 0, category: 'animal', model: <Coop /> },
]

export const CATALOG_MAP: Record<string, CatalogEntry> = Object.fromEntries(
  CATALOG.map((e) => [e.type, e]),
)

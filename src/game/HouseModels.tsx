import type { ReactElement } from 'react'
import { toonGradient } from './toon'

// 우리 집 8단계 — 기본 도형 로우폴리. 나중에 glTF로 교체.
const WALL = '#f0e2c4'
const WALL2 = '#e9d3a8'
const WOOD = '#8a5a33'
const ROOF = '#b45c3c'
const ROOF2 = '#9a4a30'
const DOOR = '#6b4a30'
const WIN = '#bfe3ea'
const FENCE = '#7a6a52'
const STONE = '#a8a79c'
const STONE2 = '#8d8c81'
const GOLD = '#e7c35a'
const WATER = '#8fd6e8'
const HEDGE = '#4f8f3f'
const BANNER = '#c23b3b'
const BANNER2 = '#3f6fae'

/* ---------- 재사용 장식 조각 ---------- */

// 창문 — 십자 창살이 있는 작은 유리창
function Window({ x, y, z, w = 0.5, h = 0.5 }: { x: number; y: number; z: number; w?: number; h?: number }): ReactElement {
  return (
    <group position={[x, y, z]}>
      <mesh>
        <boxGeometry args={[w, h, 0.06]} />
        <meshToonMaterial gradientMap={toonGradient} color={WIN} />
      </mesh>
      <mesh position={[0, 0, 0.035]}>
        <boxGeometry args={[w * 0.09, h * 1.02, 0.03]} />
        <meshToonMaterial gradientMap={toonGradient} color={WOOD} />
      </mesh>
      <mesh position={[0, 0, 0.035]}>
        <boxGeometry args={[w * 1.02, h * 0.09, 0.03]} />
        <meshToonMaterial gradientMap={toonGradient} color={WOOD} />
      </mesh>
    </group>
  )
}

// 깃발 — 장대 + 펄럭이는 천
function Flag({ x, y, z, color = BANNER }: { x: number; y: number; z: number; color?: string }): ReactElement {
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.7, 5]} />
        <meshToonMaterial gradientMap={toonGradient} color={WOOD} />
      </mesh>
      <mesh position={[0.17, 0.58, 0]}>
        <boxGeometry args={[0.32, 0.22, 0.01]} />
        <meshToonMaterial gradientMap={toonGradient} color={color} />
      </mesh>
    </group>
  )
}

// 둥근 탑 — 원기둥 몸통 + 원뿔 지붕 + 작은 창
function Tower({
  x,
  z,
  radius = 0.55,
  height = 1.6,
  roofHeight = 0.8,
  wallColor = WALL,
  roofColor = ROOF,
}: {
  x: number
  z: number
  radius?: number
  height?: number
  roofHeight?: number
  wallColor?: string
  roofColor?: string
}): ReactElement {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[radius, radius, height, 10]} />
        <meshToonMaterial gradientMap={toonGradient} color={wallColor} />
      </mesh>
      <mesh position={[0, height + roofHeight / 2, 0]}>
        <coneGeometry args={[radius * 1.2, roofHeight, 10]} />
        <meshToonMaterial gradientMap={toonGradient} color={roofColor} />
      </mesh>
      <Window x={0} y={height * 0.62} z={radius + 0.01} w={0.3} h={0.4} />
    </group>
  )
}

// 정원 나무/덤불
function Hedge({ x, z, r = 0.28 }: { x: number; z: number; r?: number }): ReactElement {
  return (
    <mesh position={[x, r, z]}>
      <sphereGeometry args={[r, 8, 6]} />
      <meshToonMaterial gradientMap={toonGradient} color={HEDGE} />
    </mesh>
  )
}

// 앞뜰 분수
function Fountain({ z = 2.3 }: { z?: number }): ReactElement {
  return (
    <group position={[0, 0, z]}>
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.5, 0.55, 0.24, 14]} />
        <meshToonMaterial gradientMap={toonGradient} color={STONE} />
      </mesh>
      <mesh position={[0, 0.26, 0]}>
        <cylinderGeometry args={[0.42, 0.42, 0.04, 14]} />
        <meshToonMaterial gradientMap={toonGradient} color={WATER} />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.07, 0.09, 0.5, 8]} />
        <meshToonMaterial gradientMap={toonGradient} color={STONE} />
      </mesh>
      <mesh position={[0, 0.78, 0]}>
        <sphereGeometry args={[0.1, 8, 6]} />
        <meshToonMaterial gradientMap={toonGradient} color={WATER} />
      </mesh>
    </group>
  )
}

// 황금 도토리 장식 — 궁전 지붕 꼭대기
function AcornFinial({ y }: { y: number }): ReactElement {
  return (
    <group position={[0, y, 0]}>
      <mesh position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.16, 10, 8]} />
        <meshToonMaterial gradientMap={toonGradient} color={GOLD} />
      </mesh>
      <mesh position={[0, 0.23, 0]}>
        <coneGeometry args={[0.17, 0.12, 10]} />
        <meshToonMaterial gradientMap={toonGradient} color={ROOF2} />
      </mesh>
    </group>
  )
}

/* ---------- 1단계: 천막 ---------- */
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
      {/* 입구 돗자리 */}
      <mesh position={[0, 0.01, 1.25]}>
        <boxGeometry args={[0.9, 0.03, 0.6]} />
        <meshToonMaterial gradientMap={toonGradient} color="#c9a25e" />
      </mesh>
      {/* 장작더미 */}
      {[-0.15, 0, 0.15].map((o, i) => (
        <mesh key={i} position={[1.1, 0.1, 0.9 + o]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.08, 0.08, 0.5, 6]} />
          <meshToonMaterial gradientMap={toonGradient} color={WOOD} />
        </mesh>
      ))}
    </group>
  )
}

/* ---------- 2단계: 통나무 오두막 ---------- */
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
      <Window x={-0.75} y={0.75} z={1.01} w={0.4} h={0.4} />
      <Window x={0.75} y={0.75} z={1.01} w={0.4} h={0.4} />
      {/* 문 위 작은 차양 */}
      <mesh position={[0, 1.05, 1.15]}>
        <boxGeometry args={[0.8, 0.08, 0.3]} />
        <meshToonMaterial gradientMap={toonGradient} color={WOOD} />
      </mesh>
      {/* 모서리 통나무 기둥 */}
      {[
        [-1.1, 0.95],
        [1.1, 0.95],
        [-1.1, -0.95],
        [1.1, -0.95],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.6, z]}>
          <cylinderGeometry args={[0.1, 0.1, 1.2, 6]} />
          <meshToonMaterial gradientMap={toonGradient} color={WOOD} />
        </mesh>
      ))}
    </group>
  )
}

/* ---------- 3단계: 아담한 집 ---------- */
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
      {/* 창문 + 셔터 */}
      {[-0.9, 0.9].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.85, 1.22]}>
            <boxGeometry args={[0.55, 0.55, 0.06]} />
            <meshToonMaterial gradientMap={toonGradient} color={WIN} />
          </mesh>
          <mesh position={[x - 0.33, 0.85, 1.22]}>
            <boxGeometry args={[0.1, 0.6, 0.05]} />
            <meshToonMaterial gradientMap={toonGradient} color={DOOR} />
          </mesh>
          <mesh position={[x + 0.33, 0.85, 1.22]}>
            <boxGeometry args={[0.1, 0.6, 0.05]} />
            <meshToonMaterial gradientMap={toonGradient} color={DOOR} />
          </mesh>
        </group>
      ))}
      {/* 굴뚝 */}
      <mesh position={[0.9, 2.3, -0.3]}>
        <boxGeometry args={[0.35, 0.8, 0.35]} />
        <meshToonMaterial gradientMap={toonGradient} color={ROOF2} />
      </mesh>
      {/* 울타리 + 정원 */}
      {[-1.5, -1, 1, 1.5].map((x, i) => (
        <mesh key={i} position={[x, 0.22, 2.15]}>
          <boxGeometry args={[0.06, 0.44, 0.06]} />
          <meshToonMaterial gradientMap={toonGradient} color={FENCE} />
        </mesh>
      ))}
      <Hedge x={-1.7} z={1.7} />
      <Hedge x={1.7} z={1.7} />
    </group>
  )
}

/* ---------- 4단계: 이층집 ---------- */
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
      {/* 2층 발코니 */}
      <mesh position={[0, 1.42, 1.3]}>
        <boxGeometry args={[1.6, 0.06, 0.4]} />
        <meshToonMaterial gradientMap={toonGradient} color={WOOD} />
      </mesh>
      {[-0.75, 0.75].map((x) => (
        <mesh key={x} position={[x, 1.6, 1.48]}>
          <boxGeometry args={[0.06, 0.3, 0.06]} />
          <meshToonMaterial gradientMap={toonGradient} color={WOOD} />
        </mesh>
      ))}
      <mesh position={[0, 1.75, 1.48]}>
        <boxGeometry args={[1.6, 0.06, 0.06]} />
        <meshToonMaterial gradientMap={toonGradient} color={WOOD} />
      </mesh>
      <mesh position={[1.1, 3.4, -0.3]}>
        <boxGeometry args={[0.35, 0.9, 0.35]} />
        <meshToonMaterial gradientMap={toonGradient} color={ROOF2} />
      </mesh>
      <Flag x={0} y={3.55} z={0} />
    </group>
  )
}

/* ---------- 5단계: 큰 저택 ---------- */
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
      {/* 정원 + 분수 + 깃발 */}
      <Flag x={0} y={3.1} z={0} />
      <Fountain z={2.4} />
      <Hedge x={-3.3} z={1.6} />
      <Hedge x={3.3} z={1.6} />
      <Hedge x={-3.8} z={1} />
      <Hedge x={3.8} z={1} />
    </group>
  )
}

/* ---------- 6단계: 탑이 있는 저택 ---------- */
function TowerManor(): ReactElement {
  return (
    <group>
      {/* 본채 */}
      <mesh position={[0, 1.05, 0]}>
        <boxGeometry args={[3.8, 2.1, 3]} />
        <meshToonMaterial gradientMap={toonGradient} color={WALL} />
      </mesh>
      <mesh position={[0, 2.7, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[2.9, 1.3, 4]} />
        <meshToonMaterial gradientMap={toonGradient} color={ROOF} />
      </mesh>
      {/* 현관 */}
      <mesh position={[0, 0.85, 1.52]}>
        <boxGeometry args={[1, 1.7, 0.1]} />
        <meshToonMaterial gradientMap={toonGradient} color={DOOR} />
      </mesh>
      <mesh position={[0, 0.05, 1.9]}>
        <boxGeometry args={[1.6, 0.1, 0.9]} />
        <meshToonMaterial gradientMap={toonGradient} color={STONE} />
      </mesh>
      {/* 1층 창문 */}
      {[-1.4, 1.4].map((x) => (
        <Window key={x} x={x} y={1.1} z={1.52} w={0.55} h={0.6} />
      ))}
      {/* 2층 창문 */}
      {[-1.4, 0, 1.4].map((x, i) => (
        <Window key={`t${i}`} x={x} y={1.95} z={1.52} w={0.5} h={0.5} />
      ))}
      {/* 모서리 망루(탑) */}
      <Tower x={2.5} z={-0.5} radius={0.6} height={2.3} roofHeight={1} />
      {/* 정원 */}
      <Hedge x={-2.7} z={1.9} />
      <Hedge x={-3.2} z={1.3} />
      <Hedge x={2.9} z={1.9} />
      <Flag x={0} y={3.35} z={0} color={BANNER} />
    </group>
  )
}

/* ---------- 7단계: 작은 성 ---------- */
function Castle(): ReactElement {
  const battlements = [-2.2, -1.75, -0.85, -0.4, 0.4, 0.85, 1.75, 2.2]
  return (
    <group>
      {/* 중앙 성채 */}
      <mesh position={[0, 1.3, -0.2]}>
        <boxGeometry args={[2.6, 2.6, 2.4]} />
        <meshToonMaterial gradientMap={toonGradient} color={STONE} />
      </mesh>
      <mesh position={[0, 2.95, -0.2]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[2, 1, 4]} />
        <meshToonMaterial gradientMap={toonGradient} color={ROOF} />
      </mesh>
      {/* 좌우 탑 */}
      <Tower x={-2.6} z={0.6} radius={0.65} height={2.6} roofHeight={1.1} wallColor={STONE} roofColor={ROOF2} />
      <Tower x={2.6} z={0.6} radius={0.65} height={2.6} roofHeight={1.1} wallColor={STONE} roofColor={ROOF2} />
      {/* 앞쪽 성벽 */}
      <mesh position={[-1.3, 0.55, 1.8]}>
        <boxGeometry args={[2.3, 1.1, 0.4]} />
        <meshToonMaterial gradientMap={toonGradient} color={STONE2} />
      </mesh>
      <mesh position={[1.3, 0.55, 1.8]}>
        <boxGeometry args={[2.3, 1.1, 0.4]} />
        <meshToonMaterial gradientMap={toonGradient} color={STONE2} />
      </mesh>
      {/* 흉벽(톱니) */}
      {battlements.map((x, i) => (
        <mesh key={i} position={[x, 1.2, 1.8]}>
          <boxGeometry args={[0.3, 0.26, 0.4]} />
          <meshToonMaterial gradientMap={toonGradient} color={STONE2} />
        </mesh>
      ))}
      {/* 정문 */}
      <mesh position={[0, 0.7, 1.21]}>
        <boxGeometry args={[1, 1.4, 0.15]} />
        <meshToonMaterial gradientMap={toonGradient} color={DOOR} />
      </mesh>
      {/* 돌다리 + 해자 */}
      <mesh position={[0, -0.05, 2.3]}>
        <boxGeometry args={[4.4, 0.06, 1]} />
        <meshToonMaterial gradientMap={toonGradient} color={WATER} />
      </mesh>
      <mesh position={[0, 0.03, 2.3]}>
        <boxGeometry args={[1.4, 0.1, 1]} />
        <meshToonMaterial gradientMap={toonGradient} color={STONE} />
      </mesh>
      {/* 깃발 */}
      <Flag x={-2.6} y={3.8} z={0.6} color={BANNER} />
      <Flag x={2.6} y={3.8} z={0.6} color={BANNER2} />
      <Flag x={0} y={3.55} z={-0.2} color={BANNER} />
    </group>
  )
}

/* ---------- 8단계: 도토리 궁전 ---------- */
function Palace(): ReactElement {
  return (
    <group>
      {/* 중앙 돔 몸체 */}
      <mesh position={[0, 1.3, 0]}>
        <cylinderGeometry args={[1.5, 1.5, 1.6, 16]} />
        <meshToonMaterial gradientMap={toonGradient} color={WALL} />
      </mesh>
      <mesh position={[0, 2.5, 0]}>
        <sphereGeometry args={[1.5, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshToonMaterial gradientMap={toonGradient} color={GOLD} />
      </mesh>
      <AcornFinial y={3.5} />
      {/* 좌우 날개 */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 3.2, 0, 0.1]}>
          <mesh position={[0, 0.9, 0]}>
            <boxGeometry args={[2.2, 1.8, 2.4]} />
            <meshToonMaterial gradientMap={toonGradient} color={WALL2} />
          </mesh>
          <mesh position={[0, 2.05, 0]} rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[1.9, 1, 4]} />
            <meshToonMaterial gradientMap={toonGradient} color={ROOF2} />
          </mesh>
          <Window x={0} y={1} z={1.22} w={0.6} h={0.6} />
          <Flag x={0} y={2.6} z={0} color={s < 0 ? BANNER : BANNER2} />
        </group>
      ))}
      {/* 기둥 회랑 */}
      {[-2.1, -1.4, -0.7, 0, 0.7, 1.4, 2.1].map((x, i) => (
        <mesh key={i} position={[x, 0.95, 1.9]}>
          <cylinderGeometry args={[0.13, 0.13, 1.9, 8]} />
          <meshToonMaterial gradientMap={toonGradient} color={STONE} />
        </mesh>
      ))}
      <mesh position={[0, 1.95, 1.9]}>
        <boxGeometry args={[4.6, 0.2, 0.5]} />
        <meshToonMaterial gradientMap={toonGradient} color={STONE} />
      </mesh>
      {/* 정문 */}
      <mesh position={[0, 0.7, 1.52]}>
        <boxGeometry args={[1, 1.4, 0.1]} />
        <meshToonMaterial gradientMap={toonGradient} color={DOOR} />
      </mesh>
      {/* 정면 계단 */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 0.05 - i * 0.08, 2.1 + i * 0.3]}>
          <boxGeometry args={[2 - i * 0.3, 0.1, 0.3]} />
          <meshToonMaterial gradientMap={toonGradient} color={STONE2} />
        </mesh>
      ))}
      <Fountain z={3.4} />
      <Hedge x={-3.7} z={2.6} />
      <Hedge x={3.7} z={2.6} />
      <Hedge x={-4.2} z={2} />
      <Hedge x={4.2} z={2} />
    </group>
  )
}

const MODELS: Record<number, ReactElement> = {
  1: <Tent />,
  2: <Cabin />,
  3: <Cottage />,
  4: <TwoStory />,
  5: <Mansion />,
  6: <TowerManor />,
  7: <Castle />,
  8: <Palace />,
}

export function HouseView({ level }: { level: number }) {
  return MODELS[level] ?? MODELS[1]
}

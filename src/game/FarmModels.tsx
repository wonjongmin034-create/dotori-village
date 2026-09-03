import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CROP_MAP, ANIMAL_MAP } from './economy'
import type { CropState, AnimalState } from './store'

// 밭 위에서 자라는 작물
export function CropView({ crop, now }: { crop: CropState; now: number }) {
  const def = CROP_MAP[crop.seed]
  if (!def) return null

  const grown = Math.min(1, crop.waterCount / def.waterGoal)
  const ripe = crop.waterCount >= def.waterGoal && now - crop.plantedAt >= def.minGrowMs
  const h = 0.18 + grown * 0.85

  const spots: [number, number][] = [
    [-0.38, -0.38],
    [0.38, -0.38],
    [-0.38, 0.38],
    [0.38, 0.38],
    [0, 0],
  ]

  return (
    <group position={[0, 0.12, 0]}>
      {spots.map(([x, z], i) => (
        <mesh key={i} position={[x, h / 2, z]}>
          <cylinderGeometry args={[0.05, 0.08, h, 5]} />
          <meshStandardMaterial color={ripe ? '#7a9a4e' : '#5aa15a'} flatShading />
        </mesh>
      ))}
      {ripe &&
        spots.map(([x, z], i) => (
          <mesh key={`f${i}`} position={[x, h + 0.06, z]}>
            <icosahedronGeometry args={[0.14, 0]} />
            <meshStandardMaterial color={def.color} flatShading />
          </mesh>
        ))}
    </group>
  )
}

// 우리 안의 가축
export function AnimalView({ animal }: { animal: AnimalState }) {
  const def = ANIMAL_MAP[animal.species]
  const ref = useRef<THREE.Group>(null)
  const size = def ? (def.id === 'cow' ? 0.95 : def.id === 'sheep' ? 0.78 : def.id === 'hen' ? 0.55 : 0.42) : 0.5
  const base = 0.12 + size * 0.45

  useFrame((s) => {
    if (ref.current) ref.current.position.y = base + Math.sin(s.clock.elapsedTime * 2.5) * 0.04
  })
  if (!def) return null

  return (
    <group ref={ref} position={[0, base, 0]} scale={size}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.4, 0.5, 4, 10]} />
        <meshStandardMaterial color={def.body} />
      </mesh>
      <mesh position={[0, 0.28, 0.5]}>
        <sphereGeometry args={[0.3, 14, 12]} />
        <meshStandardMaterial color={def.body} />
      </mesh>
      <mesh position={[0.12, 0.32, 0.74]}>
        <sphereGeometry args={[0.04, 6, 6]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      <mesh position={[-0.12, 0.32, 0.74]}>
        <sphereGeometry args={[0.04, 6, 6]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      {(
        [
          [-0.22, -0.28],
          [0.22, -0.28],
          [-0.22, 0.3],
          [0.22, 0.3],
        ] as [number, number][]
      ).map(([x, z], i) => (
        <mesh key={i} position={[x, -0.42, z]}>
          <cylinderGeometry args={[0.07, 0.07, 0.4, 6]} />
          <meshStandardMaterial color={def.accent} />
        </mesh>
      ))}
    </group>
  )
}

// 밭/우리 위에 뜨는 알림 구슬 (파랑 = 돌볼 시간, 금색 = 거둘 시간)
export function Beacon({ color }: { color: string }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((s) => {
    if (ref.current) ref.current.position.y = 2.2 + Math.sin(s.clock.elapsedTime * 3) * 0.14
  })
  return (
    <mesh ref={ref} position={[0, 2.2, 0]}>
      <sphereGeometry args={[0.17, 12, 10]} />
      <meshBasicMaterial color={color} />
    </mesh>
  )
}

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Toon, Glow, Shaped } from './wearKit'

// 오목왕 모자 — 금요일마다 승점 1~3등만 받는 상. 1등 금관, 2등 은관, 3등 동관.
// 바둑돌 장식 + 앞쪽에 "5목" 판 장식 + 월계수 잎. 1등은 반짝이가 머리 위를 돈다.
const METAL: Record<number, { base: string; dark: string; glow: string }> = {
  1: { base: '#f4c93a', dark: '#c99a1f', glow: '#ffe27a' },
  2: { base: '#d9dfe8', dark: '#9aa3b0', glow: '#e8f1ff' },
  3: { base: '#d28b52', dark: '#9c5f33', glow: '#ffc58f' },
}

export function OmokCrown({ tier }: { tier: 1 | 2 | 3 }) {
  const m = METAL[tier]
  const orbit = useRef<THREE.Group>(null)
  useFrame((s) => {
    if (orbit.current) orbit.current.rotation.y = s.clock.elapsedTime * 1.4
  })
  const peaks = 7
  return (
    <group position={[0, 0.5, 0]} scale={tier === 1 ? 1.12 : 1}>
      {/* 테두리 띠 */}
      <mesh>
        <cylinderGeometry args={[0.43, 0.46, 0.18, 28]} />
        <Toon color={m.base} emissive={m.glow} ei={tier === 1 ? 0.28 : 0.1} />
      </mesh>
      <mesh position={[0, -0.075, 0]}>
        <cylinderGeometry args={[0.462, 0.462, 0.035, 28]} />
        <Toon color={m.dark} />
      </mesh>
      <mesh position={[0, 0.075, 0]}>
        <cylinderGeometry args={[0.432, 0.432, 0.03, 28]} />
        <Toon color="#26272c" />
      </mesh>

      {/* 뾰족한 봉우리 + 끝에 바둑돌 */}
      {Array.from({ length: peaks }, (_, i) => {
        const a = (i / peaks) * Math.PI * 2
        const front = i === 0
        const h = front ? 0.46 : 0.3
        return (
          <group key={i} position={[Math.sin(a) * 0.4, 0.09, Math.cos(a) * 0.4]} rotation={[0, a, 0]}>
            <mesh position={[0, h / 2, 0]}>
              <coneGeometry args={[front ? 0.12 : 0.085, h, 8]} />
              <Toon color={m.base} emissive={m.glow} ei={tier === 1 ? 0.25 : 0.08} />
            </mesh>
            <mesh position={[0, h + 0.03, 0]}>
              <sphereGeometry args={[front ? 0.075 : 0.058, 12, 10]} />
              <Toon color={i % 2 === 0 ? '#fbfbfb' : '#1f2025'} />
            </mesh>
          </group>
        )
      })}

      {/* 앞쪽 오목판 장식: 5개가 한 줄로 이어진 판 */}
      <group position={[0, 0.0, 0.452]} rotation={[0.08, 0, 0]}>
        <mesh>
          <boxGeometry args={[0.3, 0.17, 0.04]} />
          <Toon color="#e8c98a" />
        </mesh>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} position={[-0.11 + i * 0.055, 0.0, 0.03]}>
            <sphereGeometry args={[0.022, 8, 6]} />
            <Toon color={i === 2 ? '#fbfbfb' : '#1f2025'} />
          </mesh>
        ))}
        <mesh position={[0, -0.056, 0.022]}>
          <boxGeometry args={[0.26, 0.008, 0.01]} />
          <Toon color="#7a5a30" />
        </mesh>
        <mesh position={[0, 0.056, 0.022]}>
          <boxGeometry args={[0.26, 0.008, 0.01]} />
          <Toon color="#7a5a30" />
        </mesh>
      </group>

      {/* 월계수 잎 (양옆) */}
      {[-1, 1].map((s) =>
        Array.from({ length: 6 }, (_, i) => {
          const a = Math.PI / 2 + s * (0.5 + i * 0.3)
          return (
            <mesh
              key={`${s}${i}`}
              position={[Math.sin(a) * 0.47, -0.02 - i * 0.012, Math.cos(a) * 0.47]}
              rotation={[0.5, a, s * 0.6]}
              scale={[1, 0.35, 0.6]}
            >
              <sphereGeometry args={[0.065, 8, 6]} />
              <Toon color={i % 2 ? '#7fb54a' : '#5fa03e'} />
            </mesh>
          )
        }),
      )}

      {/* 1등: 머리 위를 도는 반짝이 */}
      {tier === 1 && (
        <group ref={orbit} position={[0, 0.34, 0]}>
          {[0, 1, 2].map((i) => {
            const a = (i / 3) * Math.PI * 2
            return <Shaped key={i} kind="star" size={0.075} color={m.glow} glow depth={0.02} position={[Math.sin(a) * 0.62, 0.05 * i, Math.cos(a) * 0.62]} rotation={[0, a, 0]} />
          })}
        </group>
      )}
      {tier === 2 && (
        <mesh position={[0, 0.5, 0]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <Glow color={m.glow} />
        </mesh>
      )}
    </group>
  )
}

import type { RefObject } from 'react'
import * as THREE from 'three'
import { toonGradient } from './toon'
import type { Avatar } from './avatar'

export type CharacterRefs = {
  bob: RefObject<THREE.Group | null>
  head: RefObject<THREE.Group | null>
  body: RefObject<THREE.Group | null>
  armL: RefObject<THREE.Group | null>
  armR: RefObject<THREE.Group | null>
  legL: RefObject<THREE.Group | null>
  legR: RefObject<THREE.Group | null>
  eyeL: RefObject<THREE.Group | null>
  eyeR: RefObject<THREE.Group | null>
}

function Toon({ color }: { color: string }) {
  return <meshToonMaterial gradientMap={toonGradient} color={color} />
}

function Hair({ style, color }: { style: string; color: string }) {
  if (style === 'none') return null
  if (style === 'bun') {
    return (
      <group>
        <mesh position={[0, 0.16, -0.04]} scale={[1.06, 0.9, 1.06]}>
          <sphereGeometry args={[0.52, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
          <Toon color={color} />
        </mesh>
        <mesh position={[0, 0.5, -0.18]}>
          <sphereGeometry args={[0.2, 14, 12]} />
          <Toon color={color} />
        </mesh>
      </group>
    )
  }
  // short (기본) — 둥근 바가지, 앞쪽 이마는 살짝 드러나게
  return (
    <group>
      <mesh position={[0, 0.14, -0.06]} scale={[1.05, 0.9, 1.05]}>
        <sphereGeometry args={[0.5, 22, 16, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
        <Toon color={color} />
      </mesh>
      {/* 옆·뒤 머리 */}
      <mesh position={[0, 0.02, -0.1]} scale={[1.05, 1, 0.9]}>
        <sphereGeometry args={[0.5, 22, 16, Math.PI * 0.35, Math.PI * 1.3, 0, Math.PI * 0.72]} />
        <Toon color={color} />
      </mesh>
      <mesh position={[0, 0.44, 0]}>
        <sphereGeometry args={[0.08, 10, 8]} />
        <Toon color={color} />
      </mesh>
    </group>
  )
}

function Hat({ id }: { id: string }) {
  if (id === 'acorn') {
    return (
      <group position={[0, 0.44, 0]}>
        <mesh>
          <sphereGeometry args={[0.36, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          <Toon color="#a56b2b" />
        </mesh>
        <mesh position={[0, 0.24, 0]}>
          <coneGeometry args={[0.06, 0.15, 8]} />
          <Toon color="#7c4e1e" />
        </mesh>
      </group>
    )
  }
  if (id === 'cap') {
    return (
      <group position={[0, 0.42, 0]}>
        <mesh scale={[1, 0.7, 1]}>
          <sphereGeometry args={[0.42, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          <Toon color="#e05252" />
        </mesh>
        <mesh position={[0, -0.02, 0.34]} rotation={[0.15, 0, 0]}>
          <boxGeometry args={[0.4, 0.05, 0.28]} />
          <Toon color="#c53f3f" />
        </mesh>
      </group>
    )
  }
  if (id === 'flower') {
    return (
      <group position={[0.32, 0.36, 0.06]}>
        {[0, 1, 2, 3, 4].map((i) => {
          const a = (i / 5) * Math.PI * 2
          return (
            <mesh key={i} position={[Math.cos(a) * 0.09, 0, Math.sin(a) * 0.09]}>
              <sphereGeometry args={[0.06, 8, 6]} />
              <Toon color="#f2a4c8" />
            </mesh>
          )
        })}
        <mesh>
          <sphereGeometry args={[0.05, 8, 6]} />
          <Toon color="#f2c14e" />
        </mesh>
      </group>
    )
  }
  return null
}

// 통통한 치비 캐릭터. refs를 통해 Player가 애니메이션한다.
export function Character({ avatar, refs }: { avatar: Avatar; refs: CharacterRefs }) {
  return (
    <group ref={refs.bob}>
      {/* 다리 */}
      <group ref={refs.legL} position={[0.14, 0.3, 0]}>
        <mesh position={[0, -0.11, 0]}>
          <capsuleGeometry args={[0.1, 0.1, 4, 8]} />
          <Toon color={avatar.pants} />
        </mesh>
        <mesh position={[0, -0.22, 0.05]} scale={[1, 0.7, 1.35]}>
          <sphereGeometry args={[0.12, 12, 10]} />
          <Toon color={avatar.shoes} />
        </mesh>
      </group>
      <group ref={refs.legR} position={[-0.14, 0.3, 0]}>
        <mesh position={[0, -0.11, 0]}>
          <capsuleGeometry args={[0.1, 0.1, 4, 8]} />
          <Toon color={avatar.pants} />
        </mesh>
        <mesh position={[0, -0.22, 0.05]} scale={[1, 0.7, 1.35]}>
          <sphereGeometry args={[0.12, 12, 10]} />
          <Toon color={avatar.shoes} />
        </mesh>
      </group>

      {/* 몸통 (상의) */}
      <group ref={refs.body} position={[0, 0.52, 0]}>
        <mesh>
          <capsuleGeometry args={[0.29, 0.16, 8, 16]} />
          <Toon color={avatar.shirt} />
        </mesh>
        {/* 배 살짝 */}
        <mesh position={[0, -0.06, 0.13]} scale={[0.9, 0.7, 0.7]}>
          <sphereGeometry args={[0.22, 14, 12]} />
          <Toon color={avatar.shirt} />
        </mesh>
      </group>

      {/* 팔 */}
      <group ref={refs.armL} position={[0.34, 0.66, 0]}>
        <mesh position={[0, -0.16, 0]}>
          <capsuleGeometry args={[0.085, 0.16, 4, 8]} />
          <Toon color={avatar.shirt} />
        </mesh>
        <mesh position={[0, -0.3, 0]}>
          <sphereGeometry args={[0.11, 10, 8]} />
          <Toon color={avatar.skin} />
        </mesh>
      </group>
      <group ref={refs.armR} position={[-0.34, 0.66, 0]}>
        <mesh position={[0, -0.16, 0]}>
          <capsuleGeometry args={[0.085, 0.16, 4, 8]} />
          <Toon color={avatar.shirt} />
        </mesh>
        <mesh position={[0, -0.3, 0]}>
          <sphereGeometry args={[0.11, 10, 8]} />
          <Toon color={avatar.skin} />
        </mesh>
      </group>

      {/* 머리 */}
      <group ref={refs.head} position={[0, 1.12, 0]}>
        <mesh scale={[1, 0.94, 0.96]}>
          <sphereGeometry args={[0.5, 24, 20]} />
          <Toon color={avatar.skin} />
        </mesh>

        {/* 눈 */}
        <group ref={refs.eyeL} position={[0.17, 0.03, 0.44]}>
          <mesh scale={[0.7, 1, 0.5]}>
            <sphereGeometry args={[0.075, 12, 10]} />
            <meshToonMaterial gradientMap={toonGradient} color="#2b2b2b" />
          </mesh>
          <mesh position={[0.02, 0.03, 0.05]}>
            <sphereGeometry args={[0.022, 6, 6]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
        <group ref={refs.eyeR} position={[-0.17, 0.03, 0.44]}>
          <mesh scale={[0.7, 1, 0.5]}>
            <sphereGeometry args={[0.075, 12, 10]} />
            <meshToonMaterial gradientMap={toonGradient} color="#2b2b2b" />
          </mesh>
          <mesh position={[0.02, 0.03, 0.05]}>
            <sphereGeometry args={[0.022, 6, 6]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>

        {/* 볼 */}
        <mesh position={[0.28, -0.08, 0.38]} scale={[1, 0.7, 0.4]}>
          <sphereGeometry args={[0.07, 10, 8]} />
          <meshToonMaterial gradientMap={toonGradient} color="#ffb0b0" transparent opacity={0.8} />
        </mesh>
        <mesh position={[-0.28, -0.08, 0.38]} scale={[1, 0.7, 0.4]}>
          <sphereGeometry args={[0.07, 10, 8]} />
          <meshToonMaterial gradientMap={toonGradient} color="#ffb0b0" transparent opacity={0.8} />
        </mesh>

        {/* 입 */}
        <mesh position={[0, -0.14, 0.45]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.08, 0.03, 0.02]} />
          <meshToonMaterial gradientMap={toonGradient} color="#b5665a" />
        </mesh>

        <Hair style={avatar.hair} color={avatar.hairColor} />
        {avatar.hat && <Hat id={avatar.hat} />}
      </group>
    </group>
  )
}

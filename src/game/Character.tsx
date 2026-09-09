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

function ShortBase({ color }: { color: string }) {
  return (
    <>
      <mesh position={[0, 0.14, -0.06]} scale={[1.05, 0.9, 1.05]}>
        <sphereGeometry args={[0.5, 22, 16, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
        <Toon color={color} />
      </mesh>
      <mesh position={[0, 0.02, -0.1]} scale={[1.05, 1, 0.9]}>
        <sphereGeometry args={[0.5, 22, 16, Math.PI * 0.35, Math.PI * 1.3, 0, Math.PI * 0.72]} />
        <Toon color={color} />
      </mesh>
    </>
  )
}

function Hair({ style, color }: { style: string; color: string }) {
  if (style === 'none') return null
  if (style === 'pigtails') {
    return (
      <group>
        <ShortBase color={color} />
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.5, -0.05, -0.05]}>
            <mesh>
              <sphereGeometry args={[0.14, 12, 10]} />
              <Toon color={color} />
            </mesh>
            <mesh position={[s * 0.02, -0.22, 0]} scale={[1, 1.6, 1]}>
              <capsuleGeometry args={[0.08, 0.2, 4, 8]} />
              <Toon color={color} />
            </mesh>
          </group>
        ))}
      </group>
    )
  }
  if (style === 'long') {
    return (
      <group>
        <ShortBase color={color} />
        <mesh position={[0, -0.18, -0.16]} scale={[0.9, 1.5, 0.55]}>
          <sphereGeometry args={[0.42, 16, 14]} />
          <Toon color={color} />
        </mesh>
      </group>
    )
  }
  if (style === 'spiky') {
    return (
      <group>
        <mesh position={[0, 0.1, -0.04]} scale={[1.02, 0.75, 1.02]}>
          <sphereGeometry args={[0.5, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          <Toon color={color} />
        </mesh>
        {[
          [0, 0.42, 0],
          [0.28, 0.3, 0.1],
          [-0.28, 0.3, 0.1],
          [0.12, 0.36, -0.24],
          [-0.14, 0.34, -0.22],
        ].map(([x, y, z], i) => (
          <mesh key={i} position={[x, y, z]} rotation={[z * 2, 0, -x * 2]}>
            <coneGeometry args={[0.1, 0.28, 5]} />
            <Toon color={color} />
          </mesh>
        ))}
      </group>
    )
  }
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
  // short (기본)
  return (
    <group>
      <ShortBase color={color} />
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
  if (id === 'party') {
    return (
      <group position={[0, 0.5, 0]}>
        <mesh position={[0, 0.18, 0]}>
          <coneGeometry args={[0.26, 0.6, 16]} />
          <Toon color="#f2955b" />
        </mesh>
        <mesh position={[0, 0.5, 0]}>
          <sphereGeometry args={[0.08, 10, 8]} />
          <Toon color="#f4f4f4" />
        </mesh>
      </group>
    )
  }
  if (id === 'straw') {
    return (
      <group position={[0, 0.42, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.6, 0.6, 0.04, 20]} />
          <Toon color="#e6c878" />
        </mesh>
        <mesh position={[0, 0.12, 0]} scale={[1, 0.8, 1]}>
          <sphereGeometry args={[0.34, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          <Toon color="#d9b45f" />
        </mesh>
        <mesh position={[0, 0.06, 0.34]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.35, 0.03, 8, 20, Math.PI]} />
          <Toon color="#c14a4a" />
        </mesh>
      </group>
    )
  }
  if (id === 'crown') {
    return (
      <group position={[0, 0.46, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.42, 0.42, 0.12, 12, 1, true]} />
          <Toon color="#f2c94e" />
        </mesh>
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const a = (i / 6) * Math.PI * 2
          return (
            <mesh key={i} position={[Math.cos(a) * 0.42, 0.12, Math.sin(a) * 0.42]}>
              <coneGeometry args={[0.06, 0.18, 4]} />
              <Toon color="#f2c94e" />
            </mesh>
          )
        })}
        <mesh position={[0, 0.02, 0.42]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <Toon color="#e0526b" />
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

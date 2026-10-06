import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { Character, type CharacterRefs } from './Character'
import { houseLevel } from './economy'
import { houseEmoji } from './friends'
import { useVillage } from './store'

// 친구 마을에 놀러 갔을 때: 친구 캐릭터가 집 앞에 서 있고, 집 위에 오두막 레벨 표시가 뜬다.
export function FriendStage() {
  const visiting = useVillage((s) => s.visiting)
  const root = useRef<THREE.Group>(null)
  const refs: CharacterRefs = {
    bob: useRef<THREE.Group>(null),
    head: useRef<THREE.Group>(null),
    body: useRef<THREE.Group>(null),
    armL: useRef<THREE.Group>(null),
    armR: useRef<THREE.Group>(null),
    legL: useRef<THREE.Group>(null),
    legR: useRef<THREE.Group>(null),
    eyeL: useRef<THREE.Group>(null),
    eyeR: useRef<THREE.Group>(null),
  }
  const blink = useRef({ t: 2, on: 0 })

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    if (refs.bob.current) refs.bob.current.position.y = Math.sin(t * 2) * 0.012
    if (refs.body.current) refs.body.current.scale.set(1, 1 + Math.sin(t * 2) * 0.025, 1)
    if (refs.armL.current) refs.armL.current.rotation.x = Math.sin(t * 1.6) * 0.06
    if (refs.armR.current) refs.armR.current.rotation.x = -Math.sin(t * 1.6) * 0.06
    blink.current.t -= dt
    if (blink.current.t <= 0 && blink.current.on === 0) {
      blink.current.on = 0.14
      blink.current.t = 2 + Math.random() * 3.5
    }
    if (blink.current.on > 0) blink.current.on = Math.max(0, blink.current.on - dt)
    const y = blink.current.on > 0 ? 0.08 : 1
    for (const e of [refs.eyeL.current, refs.eyeR.current]) if (e) e.scale.y = THREE.MathUtils.damp(e.scale.y, y, 30, dt)
  })

  if (!visiting) return null
  const house = visiting.items.find((i) => i.type === 'house')
  const hx = house?.x ?? 0
  const hz = house?.z ?? 0
  const level = house?.level ?? 1

  return (
    <>
      {/* 친구 캐릭터 (집 앞, 방문자 쪽을 바라봄) */}
      <group ref={root} position={[hx - 1.8, 0, hz + 2.3]} rotation={[0, 0.35, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <circleGeometry args={[0.5, 20]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.14} depthWrite={false} />
        </mesh>
        <Character avatar={visiting.avatar} refs={refs} />
        <Html position={[0, 2.25, 0]} center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
          <div className="name-tag">{visiting.name}</div>
        </Html>
      </group>

      {/* 오두막 레벨 표시 */}
      <Html
        position={[hx, 1.9 + level * 0.45, hz]}
        center
        zIndexRange={[4, 0]}
        style={{ pointerEvents: 'none' }}
      >
        <div className="house-tag">
          {houseEmoji(level)} Lv.{level} {houseLevel(level).label}
        </div>
      </Html>
    </>
  )
}

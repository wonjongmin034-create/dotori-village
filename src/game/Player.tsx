import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getMove } from './input'
import { playerPos } from './player-state'
import { useVillage, landHalf } from './store'
import { Character, type CharacterRefs } from './Character'

const SPEED = 6 // m/s
const UP = new THREE.Vector3(0, 1, 0)

function dampAngle(current: number, target: number, lambda: number, dt: number) {
  let diff = target - current
  while (diff > Math.PI) diff -= Math.PI * 2
  while (diff < -Math.PI) diff += Math.PI * 2
  return current + diff * (1 - Math.exp(-lambda * dt))
}

export function Player() {
  const root = useRef<THREE.Group>(null)
  const yawGroup = useRef<THREE.Group>(null)
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

  const avatar = useVillage((s) => s.avatar)

  const s = useRef({ facing: Math.PI, phase: 0, blink: 0, nextBlink: 2.5 })
  const tmp = useMemo(
    () => ({ forward: new THREE.Vector3(), right: new THREE.Vector3(), dir: new THREE.Vector3() }),
    [],
  )

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const st = s.current
    const t = state.clock.elapsedTime
    const editing = useVillage.getState().mode === 'edit'

    state.camera.getWorldDirection(tmp.forward)
    tmp.forward.setY(0).normalize()
    tmp.right.crossVectors(tmp.forward, UP).normalize()

    const m = editing ? { x: 0, y: 0 } : getMove()
    let mag = Math.hypot(m.x, m.y)
    const moving = mag > 0.02

    if (moving) {
      if (mag > 1) mag = 1
      tmp.dir.set(0, 0, 0).addScaledVector(tmp.right, m.x).addScaledVector(tmp.forward, m.y)
      if (tmp.dir.lengthSq() > 1e-6) tmp.dir.normalize()

      playerPos.addScaledVector(tmp.dir, SPEED * mag * dt)
      const b = landHalf(useVillage.getState().items) - 0.4
      playerPos.x = Math.max(-b, Math.min(b, playerPos.x))
      playerPos.z = Math.max(-b, Math.min(b, playerPos.z))

      st.facing = dampAngle(st.facing, Math.atan2(tmp.dir.x, tmp.dir.z), 12, dt)
      st.phase += dt * (7 + mag * 5)
    } else {
      st.phase += dt * 2
    }

    root.current?.position.copy(playerPos)
    if (yawGroup.current) yawGroup.current.rotation.y = st.facing

    // ── 애니메이션 ──
    const swing = moving ? Math.sin(st.phase) * 0.85 : Math.sin(t * 1.6) * 0.06
    const bobY = moving ? Math.abs(Math.sin(st.phase)) * 0.09 : Math.sin(t * 2) * 0.012

    if (refs.bob.current) {
      refs.bob.current.position.y = bobY
      refs.bob.current.rotation.x = THREE.MathUtils.damp(
        refs.bob.current.rotation.x,
        moving ? 0.09 : 0,
        6,
        dt,
      )
      refs.bob.current.rotation.z = moving ? 0 : Math.sin(t * 1.3) * 0.02
    }
    if (refs.body.current) {
      const breathe = 1 + Math.sin(t * 2) * (moving ? 0 : 0.025)
      refs.body.current.scale.set(1, breathe, 1)
    }
    if (refs.head.current) {
      refs.head.current.rotation.z = moving ? Math.sin(st.phase) * 0.04 : 0
      refs.head.current.position.y = 1.12 + (moving ? Math.abs(Math.sin(st.phase)) * -0.02 : 0)
    }
    if (refs.armL.current) refs.armL.current.rotation.x = swing
    if (refs.armR.current) refs.armR.current.rotation.x = -swing
    if (refs.legL.current) refs.legL.current.rotation.x = moving ? -Math.sin(st.phase) * 0.7 : 0
    if (refs.legR.current) refs.legR.current.rotation.x = moving ? Math.sin(st.phase) * 0.7 : 0

    // 눈 깜빡임
    st.nextBlink -= dt
    if (st.nextBlink <= 0 && st.blink === 0) {
      st.blink = 0.14
      st.nextBlink = 2 + Math.random() * 3.5
    }
    if (st.blink > 0) st.blink = Math.max(0, st.blink - dt)
    const eyeY = st.blink > 0 ? 0.08 : 1
    if (refs.eyeL.current) refs.eyeL.current.scale.y = THREE.MathUtils.damp(refs.eyeL.current.scale.y, eyeY, 30, dt)
    if (refs.eyeR.current) refs.eyeR.current.scale.y = THREE.MathUtils.damp(refs.eyeR.current.scale.y, eyeY, 30, dt)
  })

  return (
    <group ref={root}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.5, 20]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.14} depthWrite={false} />
      </mesh>
      <group ref={yawGroup}>
        <Character avatar={avatar} refs={refs} />
      </group>
    </group>
  )
}

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { getMove, jumpInput } from './input'
import { playerPos, playerMotion } from './player-state'
import { useVillage, landHalf, viewItems } from './store'
import { Character, type CharacterRefs } from './Character'
import { useLive } from './live'

const SPEED = 6 // m/s
const UP = new THREE.Vector3(0, 1, 0)
const GRAVITY = 24
const JUMP_SPEED = 7.4 // 높이 약 1.1m, 공중에 약 0.6초

function dampAngle(current: number, target: number, lambda: number, dt: number) {
  let diff = target - current
  while (diff > Math.PI) diff -= Math.PI * 2
  while (diff < -Math.PI) diff += Math.PI * 2
  return current + diff * (1 - Math.exp(-lambda * dt))
}

export function Player() {
  const root = useRef<THREE.Group>(null)
  const shadow = useRef<THREE.Mesh>(null)
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
  const myEmote = useLive((s) => s.emotes.__me)

  const s = useRef({ facing: Math.PI, phase: 0, blink: 0, nextBlink: 2.5, vy: 0, land: 0 })
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
      playerMotion.vx = tmp.dir.x * SPEED * mag
      playerMotion.vz = tmp.dir.z * SPEED * mag
      const b = landHalf(viewItems(useVillage.getState())) - 0.4
      playerPos.x = Math.max(-b, Math.min(b, playerPos.x))
      playerPos.z = Math.max(-b, Math.min(b, playerPos.z))

      st.facing = dampAngle(st.facing, Math.atan2(tmp.dir.x, tmp.dir.z), 12, dt)
      st.phase += dt * (7 + mag * 5)
    } else {
      st.phase += dt * 2
      playerMotion.vx = 0
      playerMotion.vz = 0
    }
    playerMotion.facing = st.facing

    // ── 점프 ──
    if (jumpInput.requested) {
      jumpInput.requested = false
      if (!editing && playerPos.y <= 0.001 && st.vy === 0) st.vy = JUMP_SPEED
    }
    if (playerPos.y > 0 || st.vy !== 0) {
      st.vy -= GRAVITY * dt
      playerPos.y += st.vy * dt
      if (playerPos.y <= 0) {
        if (st.vy < -3) st.land = 1 // 착지하면 살짝 찌그러짐
        playerPos.y = 0
        st.vy = 0
      }
    }
    playerMotion.vy = st.vy
    st.land = Math.max(0, st.land - dt * 6)
    const air = playerPos.y > 0.02
    if (shadow.current) {
      shadow.current.position.y = 0.02 - playerPos.y
      const k = 1 - Math.min(0.5, playerPos.y * 0.4)
      shadow.current.scale.set(k, k, k)
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
      refs.body.current.scale.set(
        1 + st.land * 0.08,
        air ? 1.06 : breathe * (1 - st.land * 0.16),
        1 + st.land * 0.08,
      )
    }
    if (refs.head.current) {
      refs.head.current.rotation.z = moving ? Math.sin(st.phase) * 0.04 : 0
      refs.head.current.position.y = 1.12 + (moving ? Math.abs(Math.sin(st.phase)) * -0.02 : 0)
    }
    if (refs.armL.current) refs.armL.current.rotation.x = swing
    if (refs.armR.current) refs.armR.current.rotation.x = -swing
    if (refs.legL.current) refs.legL.current.rotation.x = moving ? -Math.sin(st.phase) * 0.7 : 0
    if (refs.legR.current) refs.legR.current.rotation.x = moving ? Math.sin(st.phase) * 0.7 : 0
    if (air) {
      // 공중: 두 팔을 번쩍, 다리는 살짝 접기
      if (refs.armL.current) refs.armL.current.rotation.x = -2.5
      if (refs.armR.current) refs.armR.current.rotation.x = -2.5
      if (refs.legL.current) refs.legL.current.rotation.x = -0.55
      if (refs.legR.current) refs.legR.current.rotation.x = 0.25
    }

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
      <mesh ref={shadow} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.5, 20]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.14} depthWrite={false} />
      </mesh>
      <group ref={yawGroup}>
        <Character avatar={avatar} refs={refs} />
      </group>
      {myEmote && (
        <Html position={[0, 2.8, 0]} center zIndexRange={[6, 0]} style={{ pointerEvents: 'none' }}>
          <div className="emote-bubble">{myEmote}</div>
        </Html>
      )}
    </group>
  )
}

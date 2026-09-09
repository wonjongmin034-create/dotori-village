import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getMove } from './input'
import { playerPos } from './player-state'
import { useVillage, landHalf } from './store'

const SPEED = 6 // m/s
const UP = new THREE.Vector3(0, 1, 0)

// 각도를 target 쪽으로 부드럽게 (최단 경로).
function dampAngle(current: number, target: number, lambda: number, dt: number) {
  let diff = target - current
  while (diff > Math.PI) diff -= Math.PI * 2
  while (diff < -Math.PI) diff += Math.PI * 2
  return current + diff * (1 - Math.exp(-lambda * dt))
}

export function Player() {
  const yawGroup = useRef<THREE.Group>(null) // 바라보는 방향
  const bob = useRef<THREE.Group>(null) // 걷기 들썩임
  const armL = useRef<THREE.Group>(null)
  const armR = useRef<THREE.Group>(null)
  const legL = useRef<THREE.Group>(null)
  const legR = useRef<THREE.Group>(null)
  const root = useRef<THREE.Group>(null)

  const s = useRef({
    facing: Math.PI,
    phase: 0,
  })

  const tmp = useMemo(
    () => ({ forward: new THREE.Vector3(), right: new THREE.Vector3(), dir: new THREE.Vector3() }),
    [],
  )

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const st = s.current
    const editing = useVillage.getState().mode === 'edit'

    // 카메라가 바라보는 수평 방향 (이동은 카메라 기준)
    state.camera.getWorldDirection(tmp.forward)
    tmp.forward.setY(0).normalize()
    tmp.right.crossVectors(tmp.forward, UP).normalize()

    const m = editing ? { x: 0, y: 0 } : getMove()
    let mag = Math.hypot(m.x, m.y)
    const moving = mag > 0.02

    if (moving) {
      if (mag > 1) mag = 1
      tmp.dir
        .set(0, 0, 0)
        .addScaledVector(tmp.right, m.x)
        .addScaledVector(tmp.forward, m.y)
      if (tmp.dir.lengthSq() > 1e-6) tmp.dir.normalize()

      playerPos.addScaledVector(tmp.dir, SPEED * mag * dt)
      // 네모 섬 밖으로 못 나가게
      const b = landHalf(useVillage.getState().items) - 0.4
      playerPos.x = Math.max(-b, Math.min(b, playerPos.x))
      playerPos.z = Math.max(-b, Math.min(b, playerPos.z))

      const targetFacing = Math.atan2(tmp.dir.x, tmp.dir.z)
      st.facing = dampAngle(st.facing, targetFacing, 12, dt)
      st.phase += dt * (6 + mag * 5)
    } else {
      st.phase += dt * 2
    }

    root.current?.position.copy(playerPos)
    if (yawGroup.current) yawGroup.current.rotation.y = st.facing

    const swing = moving ? Math.sin(st.phase) * 0.7 : 0
    const bobY = moving ? Math.abs(Math.sin(st.phase)) * 0.08 : Math.sin(st.phase) * 0.02
    if (bob.current) bob.current.position.y = bobY
    if (armL.current) armL.current.rotation.x = swing
    if (armR.current) armR.current.rotation.x = -swing
    if (legL.current) legL.current.rotation.x = -swing
    if (legR.current) legR.current.rotation.x = swing
  })

  return (
    <group ref={root}>
      {/* 가짜 그림자 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.55, 20]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.16} depthWrite={false} />
      </mesh>

      <group ref={yawGroup}>
        <group ref={bob}>
          <mesh position={[0, 0.62, 0]}>
            <capsuleGeometry args={[0.3, 0.4, 6, 14]} />
            <meshStandardMaterial color="#5cc06b" />
          </mesh>
          <mesh position={[0, 1.3, 0]}>
            <sphereGeometry args={[0.42, 22, 18]} />
            <meshStandardMaterial color="#ffe1bd" />
          </mesh>
          <mesh position={[0.15, 1.34, 0.37]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color="#2a2a2a" />
          </mesh>
          <mesh position={[-0.15, 1.34, 0.37]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color="#2a2a2a" />
          </mesh>
          <mesh position={[0, 1.6, 0]}>
            <sphereGeometry args={[0.34, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
            <meshStandardMaterial color="#a56b2b" />
          </mesh>
          <mesh position={[0, 1.88, 0]}>
            <coneGeometry args={[0.07, 0.16, 8]} />
            <meshStandardMaterial color="#7c4e1e" />
          </mesh>
          <group ref={armL} position={[0.4, 0.9, 0]}>
            <mesh position={[0, -0.22, 0]}>
              <capsuleGeometry args={[0.1, 0.3, 4, 8]} />
              <meshStandardMaterial color="#4bad5a" />
            </mesh>
          </group>
          <group ref={armR} position={[-0.4, 0.9, 0]}>
            <mesh position={[0, -0.22, 0]}>
              <capsuleGeometry args={[0.1, 0.3, 4, 8]} />
              <meshStandardMaterial color="#4bad5a" />
            </mesh>
          </group>
          <group ref={legL} position={[0.15, 0.36, 0]}>
            <mesh position={[0, -0.18, 0]}>
              <capsuleGeometry args={[0.12, 0.2, 4, 8]} />
              <meshStandardMaterial color="#d79f66" />
            </mesh>
          </group>
          <group ref={legR} position={[-0.15, 0.36, 0]}>
            <mesh position={[0, -0.18, 0]}>
              <capsuleGeometry args={[0.12, 0.2, 4, 8]} />
              <meshStandardMaterial color="#d79f66" />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  )
}

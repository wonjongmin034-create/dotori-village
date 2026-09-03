import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { cameraDrag, cameraZoom, getMove } from './input'

const ISLAND_RADIUS = 16.5 // 캐릭터가 나갈 수 없는 반경
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
  const root = useRef<THREE.Group>(null) // 위치
  const yawGroup = useRef<THREE.Group>(null) // 바라보는 방향
  const bob = useRef<THREE.Group>(null) // 걷기 들썩임
  const armL = useRef<THREE.Group>(null)
  const armR = useRef<THREE.Group>(null)
  const legL = useRef<THREE.Group>(null)
  const legR = useRef<THREE.Group>(null)

  const { camera } = useThree()

  const s = useRef({
    pos: new THREE.Vector3(0, 0, 0),
    yaw: Math.PI * 0.12, // 캐릭터 주위를 도는 카메라 각도
    facing: Math.PI, // 캐릭터가 바라보는 방향
    phase: 0, // 걷기 사이클
    camPos: new THREE.Vector3(0, 8, 14),
  })

  const tmp = useMemo(
    () => ({
      forward: new THREE.Vector3(),
      right: new THREE.Vector3(),
      dir: new THREE.Vector3(),
      offset: new THREE.Vector3(),
      desired: new THREE.Vector3(),
    }),
    [],
  )

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const st = s.current

    // 드래그로 카메라 회전
    st.yaw += cameraDrag.yawDelta
    cameraDrag.yawDelta = 0

    // 카메라가 있어야 할 위치 (줌 배율만큼 멀리/가까이)
    tmp.offset.set(0, 8, 14).multiplyScalar(cameraZoom.value).applyAxisAngle(UP, st.yaw)
    tmp.desired.copy(st.pos).add(tmp.offset)

    // 카메라 기준 수평 방향
    tmp.forward.copy(st.pos).sub(tmp.desired).setY(0).normalize()
    tmp.right.crossVectors(tmp.forward, UP).normalize()

    const m = getMove()
    let mag = Math.hypot(m.x, m.y)
    const moving = mag > 0.02

    if (moving) {
      if (mag > 1) mag = 1
      tmp.dir
        .set(0, 0, 0)
        .addScaledVector(tmp.right, m.x)
        .addScaledVector(tmp.forward, m.y)
      if (tmp.dir.lengthSq() > 1e-6) tmp.dir.normalize()

      st.pos.addScaledVector(tmp.dir, SPEED * mag * dt)

      // 섬 밖으로 못 나가게
      const d = Math.hypot(st.pos.x, st.pos.z)
      if (d > ISLAND_RADIUS) {
        st.pos.x = (st.pos.x / d) * ISLAND_RADIUS
        st.pos.z = (st.pos.z / d) * ISLAND_RADIUS
      }

      const targetFacing = Math.atan2(tmp.dir.x, tmp.dir.z)
      st.facing = dampAngle(st.facing, targetFacing, 12, dt)
      st.phase += dt * (6 + mag * 5)
    } else {
      st.phase += dt * 2
    }

    root.current?.position.copy(st.pos)
    if (yawGroup.current) yawGroup.current.rotation.y = st.facing

    // 걷기 애니메이션
    const swing = moving ? Math.sin(st.phase) * 0.7 : 0
    const bobY = moving
      ? Math.abs(Math.sin(st.phase)) * 0.08
      : Math.sin(st.phase) * 0.02
    if (bob.current) bob.current.position.y = bobY
    if (armL.current) armL.current.rotation.x = swing
    if (armR.current) armR.current.rotation.x = -swing
    if (legL.current) legL.current.rotation.x = -swing
    if (legR.current) legR.current.rotation.x = swing

    // 카메라 부드럽게 따라가기
    const k = 1 - Math.pow(0.0016, dt)
    st.camPos.lerp(tmp.desired, k)
    camera.position.copy(st.camPos)
    camera.lookAt(st.pos.x, st.pos.y + 1.3, st.pos.z)
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
          {/* 몸통 */}
          <mesh position={[0, 0.62, 0]}>
            <capsuleGeometry args={[0.3, 0.4, 6, 14]} />
            <meshStandardMaterial color="#5cc06b" />
          </mesh>
          {/* 머리 */}
          <mesh position={[0, 1.3, 0]}>
            <sphereGeometry args={[0.42, 22, 18]} />
            <meshStandardMaterial color="#ffe1bd" />
          </mesh>
          {/* 눈 */}
          <mesh position={[0.15, 1.34, 0.37]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color="#2a2a2a" />
          </mesh>
          <mesh position={[-0.15, 1.34, 0.37]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color="#2a2a2a" />
          </mesh>
          {/* 도토리 모자 */}
          <mesh position={[0, 1.6, 0]}>
            <sphereGeometry args={[0.34, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
            <meshStandardMaterial color="#a56b2b" />
          </mesh>
          <mesh position={[0, 1.88, 0]}>
            <coneGeometry args={[0.07, 0.16, 8]} />
            <meshStandardMaterial color="#7c4e1e" />
          </mesh>
          {/* 팔 */}
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
          {/* 다리 */}
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

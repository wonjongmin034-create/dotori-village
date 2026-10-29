import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { cameraDrag, cameraZoom } from './input'
import { playerPos } from './player-state'
import { useVillage, landHalf, viewItems } from './store'
import { LAND_START } from './economy'
import { camShake } from './bossFx'
import { useFight } from './raidFight'

const UP = new THREE.Vector3(0, 1, 0)

// 둘러보기: 캐릭터 뒤 3인칭. 꾸미기: 섬 중심을 위에서 내려다봄.
const BROWSE_OFFSET = new THREE.Vector3(0, 5.5, 9)
const EDIT_OFFSET = new THREE.Vector3(0, 14, 11)

export function CameraRig() {
  const { camera } = useThree()
  const size = useThree((st) => st.size)

  const s = useRef({
    yaw: Math.PI * 0.12,
    camPos: new THREE.Vector3(0, 8, 14),
    look: new THREE.Vector3(0, 1.3, 0),
  })

  const tmp = useMemo(
    () => ({
      offset: new THREE.Vector3(),
      focus: new THREE.Vector3(),
      desired: new THREE.Vector3(),
      lookTarget: new THREE.Vector3(),
    }),
    [],
  )

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const st = s.current
    const editing = useVillage.getState().mode === 'edit'

    st.yaw += cameraDrag.yawDelta
    cameraDrag.yawDelta = 0

    // 땅이 크면 카메라도 조금 더 물러난다
    const cs = useVillage.getState()
    const half = cs.plaza != null ? 14 : landHalf(viewItems(cs))
    const zoomOut = 1 + Math.max(0, half - LAND_START) * 0.06

    if (cs.raidRoom) {
      // 레이드 대기실: 반 친구들이 늘어선 모습과 뒤쪽의 거대한 보스가 한 화면에 보이게 고정
      // 싸우는 동안은 거인(키 12)의 머리까지 보이게 조금 물러나 위를 본다
      const fighting = useFight.getState().st !== 'idle'
      tmp.focus.set(0, 0, 2)
      tmp.offset.set(0, fighting ? 10.5 : 7.5, fighting ? 19 : 13.5)
      tmp.lookTarget.set(0, fighting ? 6.6 : 3.4, -8.5)
    } else if (cs.bossRoom != null) {
      // 보스 방: 싸움터 가운데를 고정해서 본다 (보스와 팀이 한 화면에)
      tmp.focus.set(0, 0, 0.4)
      tmp.offset.set(0, 5.3, 10.8)
      tmp.lookTarget.set(0, 2.8, -3.0)
    } else if (cs.towerOn) {
      // 탑: 캐릭터를 따라가며 위에서 넓게 본다 (몬스터와 위험 표시가 잘 보이게)
      tmp.focus.set(playerPos.x, 0, playerPos.z)
      tmp.offset.set(0, 10.5, 8.6)
      tmp.lookTarget.set(playerPos.x, 0.6, playerPos.z)
    } else if (editing) {
      tmp.focus.set(0, 0, 0)
      tmp.offset.copy(EDIT_OFFSET).multiplyScalar(zoomOut)
      tmp.lookTarget.set(0, 0.5, 0)
    } else {
      tmp.focus.set(playerPos.x, 0, playerPos.z) // 점프해도 카메라는 출렁이지 않게
      tmp.offset.copy(BROWSE_OFFSET).multiplyScalar(1 + (zoomOut - 1) * 0.5)
      tmp.lookTarget.set(playerPos.x, 1.1 + playerPos.y * 0.35, playerPos.z)
    }

    tmp.offset.multiplyScalar(cameraZoom.value).applyAxisAngle(UP, st.yaw)
    tmp.desired.copy(tmp.focus).add(tmp.offset)

    const k = 1 - Math.pow(0.0016, dt)
    st.camPos.lerp(tmp.desired, k)
    st.look.lerp(tmp.lookTarget, k)
    camera.position.copy(st.camPos)
    camera.lookAt(st.look)
    // 보스 방: 아래쪽에 문제 창이 올라오므로, 장면을 위로 조금 밀어 올려 보스가 가려지지 않게 한다
    const pc = camera as THREE.PerspectiveCamera
    if (cs.bossRoom != null) {
      const off = Math.round(size.height * (size.height < 560 ? 0.06 : 0.17)) // 낮은 화면은 위 표시줄도 얇아서 덜 올린다
      if (!pc.view || !pc.view.enabled || pc.view.offsetY !== off || pc.view.fullHeight !== size.height) {
        pc.setViewOffset(size.width, size.height, 0, off, size.width, size.height)
      }
    } else if (pc.view && pc.view.enabled) pc.clearViewOffset()
    // 맞거나 공격당할 때 화면이 잠깐 흔들린다
    if (camShake.amp > 0.001) {
      const t = performance.now() / 1000
      camera.position.x += Math.sin(t * 53) * camShake.amp * 0.22
      camera.position.y += Math.sin(t * 71) * camShake.amp * 0.16
      camShake.amp *= Math.exp(-dt * 7)
    } else camShake.amp = 0
  })

  return null
}

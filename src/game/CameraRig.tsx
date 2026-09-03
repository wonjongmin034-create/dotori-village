import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { cameraDrag, cameraZoom } from './input'
import { playerPos } from './player-state'
import { useVillage } from './store'

const UP = new THREE.Vector3(0, 1, 0)

// 둘러보기: 캐릭터 뒤 3인칭. 꾸미기: 섬 중심을 위에서 내려다봄.
const BROWSE_OFFSET = new THREE.Vector3(0, 8, 14)
const EDIT_OFFSET = new THREE.Vector3(0, 16, 12)

export function CameraRig() {
  const { camera } = useThree()

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

    if (editing) {
      tmp.focus.set(0, 0, 0)
      tmp.offset.copy(EDIT_OFFSET)
      tmp.lookTarget.set(0, 0.5, 0)
    } else {
      tmp.focus.copy(playerPos)
      tmp.offset.copy(BROWSE_OFFSET)
      tmp.lookTarget.set(playerPos.x, playerPos.y + 1.3, playerPos.z)
    }

    tmp.offset.multiplyScalar(cameraZoom.value).applyAxisAngle(UP, st.yaw)
    tmp.desired.copy(tmp.focus).add(tmp.offset)

    const k = 1 - Math.pow(0.0016, dt)
    st.camPos.lerp(tmp.desired, k)
    st.look.lerp(tmp.lookTarget, k)
    camera.position.copy(st.camPos)
    camera.lookAt(st.look)
  })

  return null
}

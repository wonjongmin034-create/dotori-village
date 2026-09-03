import { useEffect } from 'react'
import type { RefObject } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useVillage } from './store'

// 꾸미기 모드에서 탭(짧게 누르기)을 잡아 배치·선택·이동 처리.
// 드래그는 무시한다(App의 stage 핸들러가 카메라 회전에 씀).
export function EditorControls({ itemsRef }: { itemsRef: RefObject<THREE.Group | null> }) {
  const { camera, gl } = useThree()

  useEffect(() => {
    const el = gl.domElement
    const ray = new THREE.Raycaster()
    const ndc = new THREE.Vector2()
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    const hitPoint = new THREE.Vector3()

    let downX = 0
    let downY = 0
    let downT = 0
    let moved = false

    const onDown = (e: PointerEvent) => {
      if (useVillage.getState().mode !== 'edit') return
      downX = e.clientX
      downY = e.clientY
      downT = performance.now()
      moved = false
    }

    const onMove = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 8) moved = true
    }

    const onUp = (e: PointerEvent) => {
      const st = useVillage.getState()
      if (st.mode !== 'edit') return
      if (moved) return // 드래그 → 카메라 회전
      if (performance.now() - downT > 500) return // 롱프레스 무시

      const r = el.getBoundingClientRect()
      ndc.set(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        -((e.clientY - r.top) / r.height) * 2 + 1,
      )
      ray.setFromCamera(ndc, camera)

      // 1) 배치된 물건 먼저
      const group = itemsRef.current
      if (group) {
        const hits = ray.intersectObjects(group.children, true)
        if (hits.length) {
          let o: THREE.Object3D | null = hits[0].object
          while (o && o.userData.editorKey === undefined) o = o.parent
          if (o) {
            const key = o.userData.editorKey as string
            if (st.placing) {
              st.placeAt(o.position.x, o.position.z)
            } else {
              st.select(st.selected === key ? null : key)
            }
            return
          }
        }
      }

      // 2) 땅
      if (ray.ray.intersectPlane(groundPlane, hitPoint)) {
        if (st.placing) st.placeAt(hitPoint.x, hitPoint.z)
        else if (st.selected) st.moveSelectedTo(hitPoint.x, hitPoint.z)
        else st.select(null)
        return
      }

      // 3) 허공
      st.select(null)
    }

    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
    }
  }, [camera, gl, itemsRef])

  return null
}

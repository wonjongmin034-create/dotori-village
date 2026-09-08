import { useEffect } from 'react'
import type { RefObject } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useVillage } from './store'

// 둘러보기 모드에서 밭/우리를 탭하면 관리 패널을 연다.
export function BrowseInteract({ itemsRef }: { itemsRef: RefObject<THREE.Group | null> }) {
  const { camera, gl } = useThree()

  useEffect(() => {
    const el = gl.domElement
    const ray = new THREE.Raycaster()
    const ndc = new THREE.Vector2()
    let downX = 0
    let downY = 0
    let downT = 0
    let moved = false

    const onDown = (e: PointerEvent) => {
      if (useVillage.getState().mode !== 'browse') return
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
      if (st.mode !== 'browse') return
      if (moved || performance.now() - downT > 500) return

      const r = el.getBoundingClientRect()
      ndc.set(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        -((e.clientY - r.top) / r.height) * 2 + 1,
      )
      ray.setFromCamera(ndc, camera)

      const group = itemsRef.current
      const hits = group ? ray.intersectObjects(group.children, true) : []
      if (!hits.length) {
        if (st.activeFarm) st.closeFarm()
        return
      }
      let o: THREE.Object3D | null = hits[0].object
      while (o && o.userData.editorKey === undefined) o = o.parent
      const key = o?.userData.editorKey as string | undefined
      const item = key ? st.items.find((i) => i.key === key) : undefined
      if (
        item &&
        (item.type === 'plot' ||
          item.type === 'coop' ||
          item.type === 'house' ||
          item.type === 'board' ||
          item.type === 'arcade')
      )
        st.openFarm(item.key)
      else if (st.activeFarm) st.closeFarm()
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

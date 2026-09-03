import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from 'react'
import { Canvas } from '@react-three/fiber'
import { Scene } from './game/Scene'
import { Joystick } from './game/Joystick'
import { cameraDrag, initKeyboard, nudgeZoom } from './game/input'

export default function App() {
  const [coarse] = useState(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(pointer: coarse)').matches,
  )

  // 화면에 닿아 있는 손가락/포인터들
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const lastDragX = useRef<number | null>(null)
  const pinchDist = useRef<number | null>(null)

  useEffect(() => initKeyboard(), [])

  const onPointerDown = (e: ReactPointerEvent) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size === 1) lastDragX.current = e.clientX
  }

  const onPointerMove = (e: ReactPointerEvent) => {
    const p = pointers.current.get(e.pointerId)
    if (!p) return
    p.x = e.clientX
    p.y = e.clientY

    if (pointers.current.size >= 2) {
      // 두 손가락 → 핀치 줌
      const [a, b] = [...pointers.current.values()]
      const d = Math.hypot(a.x - b.x, a.y - b.y)
      if (pinchDist.current != null && d > 0) {
        nudgeZoom(pinchDist.current / d) // 벌리면 가까이(확대), 오므리면 멀리
      }
      pinchDist.current = d
      lastDragX.current = null
    } else if (lastDragX.current != null) {
      // 한 손가락 / 마우스 → 카메라 회전
      const dx = e.clientX - lastDragX.current
      lastDragX.current = e.clientX
      cameraDrag.yawDelta += -dx * 0.005
    }
  }

  const onPointerUp = (e: ReactPointerEvent) => {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) pinchDist.current = null
    if (pointers.current.size === 0) lastDragX.current = null
    else if (pointers.current.size === 1) {
      const [only] = [...pointers.current.values()]
      lastDragX.current = only.x
    }
  }

  const onWheel = (e: ReactWheelEvent) => {
    nudgeZoom(e.deltaY > 0 ? 1.09 : 0.92)
  }

  return (
    <div
      className="stage"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onWheel={onWheel}
    >
      <Canvas
        dpr={[1, 1.5]}
        camera={{ fov: 60, position: [0, 8, 14], near: 0.1, far: 240 }}
      >
        <Scene />
      </Canvas>

      <div className="hud">
        <div className="badge">
          <b>도토리 마을</b>
          <span>M0 · 걸어다니는 섬</span>
        </div>
        <div className="hint">
          {coarse
            ? '조이스틱 이동 · 끌어서 카메라 회전 · 두 손가락으로 확대/축소'
            : 'WASD / 화살표 이동 · 드래그 카메라 회전 · 휠 확대/축소'}
        </div>
      </div>

      <Joystick />
    </div>
  )
}

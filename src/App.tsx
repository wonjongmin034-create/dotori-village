import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { Canvas } from '@react-three/fiber'
import { Scene } from './game/Scene'
import { Joystick } from './game/Joystick'
import { cameraDrag, initKeyboard } from './game/input'

export default function App() {
  const [coarse] = useState(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(pointer: coarse)').matches,
  )
  const drag = useRef<{ id: number | null; x: number }>({ id: null, x: 0 })

  useEffect(() => initKeyboard(), [])

  const onPointerDown = (e: ReactPointerEvent) => {
    drag.current.id = e.pointerId
    drag.current.x = e.clientX
  }
  const onPointerMove = (e: ReactPointerEvent) => {
    if (drag.current.id !== e.pointerId) return
    const dx = e.clientX - drag.current.x
    drag.current.x = e.clientX
    cameraDrag.yawDelta += -dx * 0.005
  }
  const onPointerUp = (e: ReactPointerEvent) => {
    if (drag.current.id === e.pointerId) drag.current.id = null
  }

  return (
    <div
      className="stage"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <Canvas
        dpr={[1, 1.5]}
        camera={{ fov: 50, position: [0, 6.4, 10.5], near: 0.1, far: 220 }}
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
            ? '왼쪽 조이스틱으로 이동 · 화면을 끌어 카메라 회전'
            : 'WASD / 화살표 = 이동 · 마우스 드래그 = 카메라 회전'}
        </div>
      </div>

      <Joystick />
    </div>
  )
}

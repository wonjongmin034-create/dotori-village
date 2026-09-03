import { useEffect, useRef } from 'react'
import { joystickVec } from './input'

// 화면 왼쪽 아래 가상 조이스틱. 태블릿·터치 크롬북용.
// 마우스로도 동작한다(포인터 이벤트).
export function Joystick() {
  const baseRef = useRef<HTMLDivElement>(null)
  const knobRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const base = baseRef.current
    const knob = knobRef.current
    if (!base || !knob) return

    const RADIUS = 44
    let activeId: number | null = null

    const apply = (e: PointerEvent) => {
      const rect = base.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      let dx = e.clientX - cx
      let dy = e.clientY - cy
      const dist = Math.hypot(dx, dy)
      if (dist > RADIUS) {
        dx = (dx / dist) * RADIUS
        dy = (dy / dist) * RADIUS
      }
      knob.style.transform = `translate(${dx}px, ${dy}px)`
      joystickVec.x = dx / RADIUS
      joystickVec.y = -dy / RADIUS // 화면 위 = 전진
    }

    const reset = () => {
      knob.style.transform = 'translate(0px, 0px)'
      joystickVec.x = 0
      joystickVec.y = 0
    }

    const onDown = (e: PointerEvent) => {
      activeId = e.pointerId
      base.setPointerCapture(e.pointerId)
      apply(e)
      e.stopPropagation()
      e.preventDefault()
    }
    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== activeId) return
      apply(e)
      e.stopPropagation()
    }
    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== activeId) return
      activeId = null
      reset()
      e.stopPropagation()
    }

    base.addEventListener('pointerdown', onDown)
    base.addEventListener('pointermove', onMove)
    base.addEventListener('pointerup', onUp)
    base.addEventListener('pointercancel', onUp)
    return () => {
      base.removeEventListener('pointerdown', onDown)
      base.removeEventListener('pointermove', onMove)
      base.removeEventListener('pointerup', onUp)
      base.removeEventListener('pointercancel', onUp)
    }
  }, [])

  return (
    <div className="joystick" ref={baseRef} aria-hidden="true">
      <div className="joystick-knob" ref={knobRef} />
    </div>
  )
}

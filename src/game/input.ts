// 입력 상태 — 키보드와 화면 조이스틱이 같은 값에 쓴다.
// R3F 루프(useFrame)에서 매 프레임 getMove()로 읽는다.

export const keyboardVec = { x: 0, y: 0 }
export const joystickVec = { x: 0, y: 0 }
export const cameraDrag = { yawDelta: 0 }

/** 이동 입력. 조이스틱이 움직이는 중이면 조이스틱 우선, 아니면 키보드. */
export function getMove(): { x: number; y: number } {
  if (joystickVec.x !== 0 || joystickVec.y !== 0) {
    return { x: joystickVec.x, y: joystickVec.y }
  }
  return { x: keyboardVec.x, y: keyboardVec.y }
}

const pressed = new Set<string>()

function refresh() {
  let x = 0
  let y = 0
  if (pressed.has('KeyW') || pressed.has('ArrowUp')) y += 1
  if (pressed.has('KeyS') || pressed.has('ArrowDown')) y -= 1
  if (pressed.has('KeyA') || pressed.has('ArrowLeft')) x -= 1
  if (pressed.has('KeyD') || pressed.has('ArrowRight')) x += 1
  keyboardVec.x = x
  keyboardVec.y = y
}

/** window에 키보드 리스너를 붙이고, 정리 함수를 돌려준다. */
export function initKeyboard(): () => void {
  const onDown = (e: KeyboardEvent) => {
    pressed.add(e.code)
    refresh()
  }
  const onUp = (e: KeyboardEvent) => {
    pressed.delete(e.code)
    refresh()
  }
  const onBlur = () => {
    pressed.clear()
    refresh()
  }
  window.addEventListener('keydown', onDown)
  window.addEventListener('keyup', onUp)
  window.addEventListener('blur', onBlur)
  return () => {
    window.removeEventListener('keydown', onDown)
    window.removeEventListener('keyup', onUp)
    window.removeEventListener('blur', onBlur)
  }
}

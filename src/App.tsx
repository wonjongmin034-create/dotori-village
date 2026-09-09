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
import { Quiz } from './game/Quiz'
import { FarmPanel } from './game/FarmPanel'
import { HousePanel } from './game/HousePanel'
import { BoardPanel } from './game/BoardPanel'
import { ArcadePanel } from './game/ArcadePanel'
import { cameraDrag, initKeyboard, nudgeZoom } from './game/input'
import { CATALOG, type Category } from './game/catalog'
import { useVillage } from './game/store'
import { Login } from './game/Login'
import { TeacherDashboard } from './game/TeacherDashboard'
import { loadLocalTeacher, logout } from './game/cloud'

const CATS: { id: Category; label: string }[] = [
  { id: 'decor', label: '꾸미기' },
  { id: 'farm', label: '농사' },
  { id: 'animal', label: '가축' },
]

export default function App() {
  const [coarse] = useState(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(pointer: coarse)').matches,
  )
  const [cat, setCat] = useState<Category>('decor')
  const [gate, setGate] = useState<'checking' | 'login' | 'in' | 'teacher'>('checking')
  const [teacherCode, setTeacherCode] = useState<string | null>(null)

  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const lastDragX = useRef<number | null>(null)
  const pinchDist = useRef<number | null>(null)

  const mode = useVillage((s) => s.mode)
  const coins = useVillage((s) => s.coins)
  const cloud = useVillage((s) => s.cloud)
  const session = useVillage((s) => s.session)
  const placing = useVillage((s) => s.placing)
  const selected = useVillage((s) => s.selected)
  const selectedType = useVillage((s) => s.items.find((i) => i.key === s.selected)?.type)
  const itemCount = useVillage((s) => s.items.length)
  const msg = useVillage((s) => s.msg)
  const setMode = useVillage((s) => s.setMode)
  const togglePlacing = useVillage((s) => s.togglePlacing)
  const rotateSelected = useVillage((s) => s.rotateSelected)
  const deleteSelected = useVillage((s) => s.deleteSelected)
  const clearAll = useVillage((s) => s.clearAll)

  useEffect(() => initKeyboard(), [])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.has('logout')) {
      logout()
      params.delete('logout')
      history.replaceState(null, '', location.pathname + (params.toString() ? '?' + params : ''))
    }
    // 매번 로그인 화면을 띄운다 (공용 기기 안전). 반 코드·이름은 Login에서 미리 채워짐.
    setGate('login')
  }, [])

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
      const [a, b] = [...pointers.current.values()]
      const d = Math.hypot(a.x - b.x, a.y - b.y)
      if (pinchDist.current != null && d > 0) nudgeZoom(pinchDist.current / d)
      pinchDist.current = d
      lastDragX.current = null
    } else if (lastDragX.current != null) {
      const dx = e.clientX - lastDragX.current
      lastDragX.current = e.clientX
      cameraDrag.yawDelta += -dx * 0.005
    }
  }
  const onPointerUp = (e: ReactPointerEvent) => {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) pinchDist.current = null
    if (pointers.current.size === 0) lastDragX.current = null
    else {
      const [only] = [...pointers.current.values()]
      lastDragX.current = only.x
    }
  }
  const onWheel = (e: ReactWheelEvent) => nudgeZoom(e.deltaY > 0 ? 1.09 : 0.92)

  const editing = mode === 'edit'
  const shown = CATALOG.filter((e) => e.category === cat)

  if (gate === 'checking') {
    return (
      <div className="login-screen">
        <div className="login-card">
          <div className="login-logo">🌰</div>
          <p className="login-sub">불러오는 중…</p>
        </div>
      </div>
    )
  }
  if (gate === 'login') {
    return (
      <Login
        onStudent={() => setGate('in')}
        onTeacher={() => {
          setTeacherCode(loadLocalTeacher())
          setGate('teacher')
        }}
      />
    )
  }
  if (gate === 'teacher' && teacherCode) {
    return (
      <TeacherDashboard
        classCode={teacherCode}
        onExit={() => {
          setTeacherCode(null)
          setGate('login')
        }}
      />
    )
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
      <Canvas dpr={[1, 1.5]} camera={{ fov: 60, position: [0, 8, 14], near: 0.1, far: 240 }}>
        <Scene />
      </Canvas>

      <div className="hud">
        <div className="badge">
          <b>도토리 마을</b>
          <span>
            {editing
              ? `꾸미는 중 · 물건 ${itemCount}개`
              : session
                ? `${session.name}${cloud === 'offline' ? ' · 📴 오프라인' : ''}`
                : '둘러보는 중'}
          </span>
        </div>

        <div className="coinbar">🌰 {coins}</div>

        <button
          type="button"
          className="mode-btn"
          onClick={() => setMode(editing ? 'browse' : 'edit')}
        >
          {editing ? '✓ 다 꾸몄어요' : '🔨 마을 꾸미기'}
        </button>

        {!editing && (
          <div className="hint">
            {coarse
              ? '밭·우리·게시판을 탭 · 끌어서 카메라 · 두 손가락 확대'
              : 'WASD 이동 · 밭/우리/게시판 클릭 · 드래그 카메라 · 휠 확대'}
          </div>
        )}

        {editing && (
          <>
            {selected ? (
              <div className="selbar">
                <button type="button" onClick={rotateSelected}>
                  ↻ 돌리기
                </button>
                {selectedType !== 'house' &&
                  selectedType !== 'board' &&
                  selectedType !== 'arcade' && (
                    <button type="button" className="danger" onClick={deleteSelected}>
                      🗑 지우기
                    </button>
                  )}
                <span className="tip">
                  {selectedType === 'house'
                    ? '우리 집은 옮길 수만 있어요'
                    : selectedType === 'board'
                      ? '게시판은 옮길 수만 있어요'
                      : selectedType === 'arcade'
                        ? '강화대는 옮길 수만 있어요'
                        : '빈 땅을 탭하면 그리로 옮겨져요'}
                </span>
              </div>
            ) : (
              <div className="selbar">
                <span className="tip">
                  {placing
                    ? '땅을 탭해서 놓기 · 아이콘 다시 눌러 취소'
                    : '아래에서 물건을 고르거나, 놓인 물건을 탭하세요'}
                </span>
                {itemCount > 0 && (
                  <button
                    type="button"
                    className="danger ghost"
                    onClick={() => {
                      if (window.confirm('마을의 모든 물건을 지울까요?')) clearAll()
                    }}
                  >
                    전체 지우기
                  </button>
                )}
              </div>
            )}

            <div className="cattabs">
              {CATS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={cat === c.id ? 'on' : ''}
                  onClick={() => setCat(c.id)}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="catalog">
              {shown.map((entry) => {
                const broke = entry.cost > coins
                return (
                  <button
                    key={entry.type}
                    type="button"
                    className={
                      (placing === entry.type ? 'on ' : '') + (broke ? 'broke' : '')
                    }
                    disabled={broke}
                    onClick={() => togglePlacing(entry.type)}
                  >
                    <span className="ico">{entry.emoji}</span>
                    <span className="lbl">{entry.label}</span>
                    <span className="price">{entry.cost === 0 ? '무료' : `🌰${entry.cost}`}</span>
                  </button>
                )
              })}
            </div>
          </>
        )}

        {msg && <div className="flash">{msg}</div>}
      </div>

      {!editing && <Joystick />}

      <FarmPanel />
      <HousePanel />
      <BoardPanel />
      <ArcadePanel />
      <Quiz />
    </div>
  )
}

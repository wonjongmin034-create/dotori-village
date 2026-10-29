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
import { WardrobePanel } from './game/WardrobePanel'
import { DailyLearnPanel } from './game/DailyLearnPanel'
import { SheetPanel } from './game/SheetPanel'
import { FriendsPanel } from './game/FriendsPanel'
import { FriendInfoPanel } from './game/FriendInfoPanel'
import { endVisit } from './game/friends'
import { requestJump } from './game/input'
import { enterPlaza, leavePlaza } from './game/plaza'
import { OmokHud } from './game/OmokHud'
import { BossHud, BossPicker, BossEntryButton } from './game/BossHud'
import { TowerHud, TowerPicker, TowerEntryButton } from './game/TowerHud'
import { RaidHud, RaidEntryButton } from './game/RaidHud'
import { leaveRaid } from './game/raid'
import { NameChangeButton, NameChangePanel } from './game/NameChange'
import { useTower, inTowerFight, exitTower } from './game/towerState'
import { leaveBoss } from './game/boss'
import { useBoss, isActive } from './game/bossState'
import { ArmoryButton, ArmoryPanel } from './game/ArmoryPanel'
import { PetButton, PetPanel } from './game/PetPanel'
import { refreshTitles } from './game/omokStats'
import { DPR, useGfx } from './game/gfx'
import { GfxButton } from './game/GfxSettings'
import { MAX_IN_ROOM, useLive } from './game/live'
import { LiveHud } from './game/LiveHud'
import { NoticeModal } from './game/NoticeModal'
import { DAILY_PER_SUBJECT, farmLimit } from './game/economy'
import { dailySet } from './game/questions'
import { cameraDrag, initKeyboard, nudgeZoom } from './game/input'
import { CATALOG, type Category } from './game/catalog'
import { useVillage } from './game/store'
import { Login } from './game/Login'
import { TeacherDashboard } from './game/TeacherDashboard'
import { loadLocalTeacher, logout } from './game/cloud'
import { CodeGate } from './game/CodeGate'
import { checkStoredCode, forgetCode } from './game/appcode'

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
  const [gate, setGate] = useState<'checking' | 'code' | 'login' | 'in' | 'teacher'>('checking')
  const [teacherCode, setTeacherCode] = useState<string | null>(null)

  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const lastDragX = useRef<number | null>(null)
  const pinchDist = useRef<number | null>(null)

  const gfxLevel = useGfx((s) => s.level)
  const mode = useVillage((s) => s.mode)
  const coins = useVillage((s) => s.coins)
  const cloud = useVillage((s) => s.cloud)
  const session = useVillage((s) => s.session)
  const placing = useVillage((s) => s.placing)
  const selected = useVillage((s) => s.selected)
  const items = useVillage((s) => s.items)
  const avatar = useVillage((s) => s.avatar)
  const rideOn = useVillage((s) => s.rideOn)
  const toggleRide = useVillage((s) => s.toggleRide)
  const selectedType = useVillage((s) => s.items.find((i) => i.key === s.selected)?.type)
  const itemCount = useVillage((s) => s.items.length)
  const msg = useVillage((s) => s.msg)
  const daily = useVillage((s) => s.daily)
  const classQuestions = useVillage((s) => s.classQuestions)
  const openLearn = useVillage((s) => s.openLearn)
  const worksheets = useVillage((s) => s.worksheets)
  const mySubs = useVillage((s) => s.mySubs)
  const openSheets = useVillage((s) => s.openSheets)
  const visiting = useVillage((s) => s.visiting)
  const plaza = useVillage((s) => s.plaza)
  const bossRoom = useVillage((s) => s.bossRoom)
  const raidRoom = useVillage((s) => s.raidRoom)
  const towerOn = useVillage((s) => s.towerOn)
  const towerPhase = useTower((s) => s.phase)
  const towerBusy = towerOn && towerPhase !== 'fight' && towerPhase !== 'intro'
  const bossCount = useBoss((s) => s.roster.length)
  // 보스전이 진행 중이고 내가 그 팀이면: 이동 조작을 숨긴다 (자리에 고정되어 있다)
  const inFight = useBoss((s) => !!s.game && isActive(s.game) && s.game.members.some((m) => m.n === session?.name))
  const roomCount = useLive((s) => s.names.length)
  const openFriends = useVillage((s) => s.openFriends)
  const setMode = useVillage((s) => s.setMode)
  const togglePlacing = useVillage((s) => s.togglePlacing)
  const rotateSelected = useVillage((s) => s.rotateSelected)
  const deleteSelected = useVillage((s) => s.deleteSelected)
  const clearAll = useVillage((s) => s.clearAll)

  useEffect(() => initKeyboard(), [])

  // 로그인한 동안: 지난주 오목왕 명단을 받아 내 오목왕 모자를 맞춘다 (새로 받거나 기간이 끝나 사라지는 것)
  const sessionName = session?.name
  useEffect(() => {
    if (!sessionName) return
    void refreshTitles()
    const t = setInterval(() => void refreshTitles(), 10 * 60_000)
    return () => clearInterval(t)
  }, [sessionName])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.has('logout')) {
      logout()
      params.delete('logout')
      history.replaceState(null, '', location.pathname + (params.toString() ? '?' + params : ''))
    }
    if (params.has('lock')) {
      forgetCode() // ?lock → 이 기기의 입장 코드를 잊게 한다
      params.delete('lock')
      history.replaceState(null, '', location.pathname + (params.toString() ? '?' + params : ''))
    }
    // 입장 코드부터 확인한 뒤, 매번 로그인 화면을 띄운다 (공용 기기 안전). 반 코드·이름은 Login에서 미리 채워짐.
    let dead = false
    void checkStoredCode().then((r) => !dead && setGate(r === 'ok' ? 'login' : 'code'))
    return () => {
      dead = true
    }
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
  if (gate === 'code') {
    return <CodeGate onOpen={() => setGate('login')} />
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
      <Canvas
        dpr={DPR[gfxLevel]}
        shadows="soft"
        camera={{ fov: 60, position: [0, 8, 14], near: 0.1, far: 240 }}
        onCreated={({ gl }) => {
          // 그래픽 장치 연결이 끊겼을 때(화면이 까맣게/깨져 보임): 잠깐 기다려도 안 돌아오면 새로고침
          const el = gl.domElement
          let t: ReturnType<typeof setTimeout> | null = null
          el.addEventListener('webglcontextlost', () => {
            if (t) clearTimeout(t)
            t = setTimeout(() => location.reload(), 4000)
          })
          el.addEventListener('webglcontextrestored', () => {
            if (t) clearTimeout(t)
            t = null
          })
        }}
      >
        <Scene />
      </Canvas>

      <div className="vignette" aria-hidden="true" />

      <div className="hud">
        <div className="badge">
          <b>도토리 마을</b>
          <span>
            {towerOn
              ? '도토리 탑'
              : raidRoom
              ? '학급 레이드 · 금요일의 거인'
              : bossRoom != null
              ? `보스 방 ${bossRoom}번 · ${Math.max(bossCount, roomCount + 1)}/4명`
              : plaza != null
              ? `도토리 광장 ${plaza}번 · ${roomCount + 1}/${MAX_IN_ROOM}명`
              : visiting
              ? `${visiting.name}의 마을 놀러 옴`
              : editing
              ? `꾸미는 중 · 물건 ${itemCount}개`
              : session
                ? `${session.name}${cloud === 'offline' ? ' · 📴 오프라인' : ''}`
                : '둘러보는 중'}
            {session && !towerOn && !raidRoom && bossRoom == null && plaza == null && !visiting && !editing && <NameChangeButton />}
          </span>
        </div>

        <GfxButton />
        <div className="coinbar">🌰 {coins}</div>

        {plaza != null && <OmokHud />}
        {bossRoom != null && <BossHud />}
        {raidRoom && <RaidHud />}
        {towerOn && <TowerHud />}

        {towerOn ? (
          towerPhase === 'clear' || towerPhase === 'fail' || towerPhase === 'quiz' ? null : (
            <button
              type="button"
              className="mode-btn visit-back"
              onClick={() => {
                if (inTowerFight() && !window.confirm('지금 나가면 입장권을 돌려받지 못해요. 정말 나갈까요?')) return
                exitTower()
              }}
            >
              🏠 마을로 돌아가기
            </button>
          )
        ) : raidRoom ? (
          <button type="button" className="mode-btn visit-back" onClick={leaveRaid}>
            🏠 마을로 돌아가기
          </button>
        ) : bossRoom != null ? (
          <button
            type="button"
            className="mode-btn visit-back"
            onClick={() => {
              if (inFight && !window.confirm('지금 나가면 팀이 힘들어져요. 정말 나갈까요?')) return
              leaveBoss()
            }}
          >
            🏠 마을로 돌아가기
          </button>
        ) : plaza != null ? (
          <button type="button" className="mode-btn visit-back" onClick={leavePlaza}>
            🏠 마을로 돌아가기
          </button>
        ) : visiting ? (
          <button type="button" className="mode-btn visit-back" onClick={endVisit}>
            🏠 내 마을로 돌아가기
          </button>
        ) : (
          <button
            type="button"
            className="mode-btn"
            onClick={() => setMode(editing ? 'browse' : 'edit')}
          >
            {editing ? '✓ 다 꾸몄어요' : '🔨 마을 꾸미기'}
          </button>
        )}

        {!editing && !visiting && plaza == null && bossRoom == null && !raidRoom && !towerOn && (
          <div className="hud-stack">
            {daily &&
              (() => {
            const total = dailySet(daily.day, DAILY_PER_SUBJECT, classQuestions).length
            const done = daily.idx >= total
            return (
              <button
                type="button"
                className={`learn-btn${done && daily.claimed ? ' done' : ''}${!done ? ' todo' : ''}`}
                onClick={openLearn}
              >
                📚 오늘의 학습{' '}
                {done ? (daily.claimed ? '✓' : '결과 보기') : `${daily.idx}/${total}`}
              </button>
            )
          })()}

            {(worksheets.length > 0 || !session) &&
              (() => {
                const todo = worksheets.filter((w) => mySubs[w.id]?.status !== 'submitted').length
                return (
                  <button
                    type="button"
                    className={`sheet-btn${todo ? ' todo' : ' done'}`}
                    onClick={openSheets}
                  >
                    📄 학습지 {!session ? '' : todo ? `${todo}개 남음` : '✓'}
                  </button>
                )
              })()}

            <ArmoryButton />
            <PetButton />
            {session && (
              <button type="button" className="friends-btn" onClick={openFriends}>
                👫 친구 마을
              </button>
            )}
            {session && (
              <button type="button" className="plaza-btn" onClick={() => enterPlaza(1)}>
                🏛️ 광장
              </button>
            )}
            <BossEntryButton />
            <TowerEntryButton />
            <RaidEntryButton />
          </div>
        )}

        {!editing && !visiting && bossRoom == null && !towerOn && avatar.ride && (
          <button
            type="button"
            className="ride-btn"
            onPointerDown={(e) => {
              e.stopPropagation()
              toggleRide()
            }}
          >
            {rideOn ? '🚶' : '🛞'}
            <span>{rideOn ? '내리기' : '타기'}</span>
          </button>
        )}

        {!editing && !inFight && !towerBusy && (
          <button
            type="button"
            className="jump-btn"
            onPointerDown={(e) => {
              e.stopPropagation()
              requestJump()
            }}
            aria-label="점프"
          >
            ⤒<span>점프</span>
          </button>
        )}

        {!editing && (
          <div className="hint">
            {towerOn
              ? '몬스터를 모두 잡으면 보물상자가 나와요 · 상자 문제 3개를 모두 맞혀야 클리어!'
              : raidRoom
              ? '반 친구들이 모이면 대장이 출발을 눌러요 · 대장은 가장 먼저 들어온 사람이에요'
              : bossRoom != null
              ? '친구 3~4명과 힘을 합쳐 보스를 쓰러뜨려요! 한 사람씩 차례로 문제를 풀어요'
              : plaza != null
              ? '친구들과 만나는 광장이에요 · 😊 이모티콘으로 인사해 보세요'
              : visiting
              ? '친구 집을 탭하면 오두막 레벨을 볼 수 있어요 · 구경만 할 수 있어요'
              : coarse
                ? '밭·우리·게시판을 탭 · 끌어서 카메라 · 두 손가락 확대'
                : 'WASD 이동 · Space 점프 · 밭/우리/게시판 클릭 · 드래그 카메라 · 휠 확대'}
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
                  selectedType !== 'arcade' &&
                  selectedType !== 'wardrobe' && (
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
                        : selectedType === 'wardrobe'
                          ? '옷장은 옮길 수만 있어요'
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
                const limit = farmLimit(entry.type, items.find((i) => i.type === 'house')?.level)
                const have = limit === null ? 0 : items.filter((i) => i.type === entry.type).length
                const full = limit !== null && have >= limit
                const broke = entry.cost > coins || full
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
                    <span className="price">
                      {limit !== null ? `${have}/${limit}개` : entry.cost === 0 ? '무료' : `🌰${entry.cost}`}
                    </span>
                  </button>
                )
              })}
            </div>
          </>
        )}

        {msg && <div className="flash">{msg}</div>}
      </div>

      {!editing && !inFight && !towerBusy && <Joystick />}

      <FarmPanel />
      <HousePanel />
      <BoardPanel />
      <ArcadePanel />
      <WardrobePanel />
      <ArmoryPanel />
      <PetPanel />
      <BossPicker />
      <TowerPicker />
      <NameChangePanel />
      <DailyLearnPanel />
      <SheetPanel />
      <LiveHud />
      <NoticeModal />
      <FriendsPanel />
      <FriendInfoPanel />
      <Quiz />
    </div>
  )
}

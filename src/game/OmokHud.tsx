import { useEffect, useMemo, useState } from 'react'
import { useVillage } from './store'
import { playerPos } from './player-state'
import { N, evaluate } from './omok'
import { OMOK_TABLES } from './plazaLayout'
import {
  TURN_MS,
  again,
  onOmokFinish,
  playCell,
  resign,
  seatPos,
  sitDown,
  standUp,
  useOmok,
  type GameState,
} from './omokState'
import {
  DAILY_GAME_LIMIT,
  PAIR_LIMIT,
  POINTS_DRAW,
  POINTS_WIN,
  REWARD_DRAW,
  REWARD_LOSS,
  REWARD_WIN,
  applyMyTitle,
  fetchStandings,
  loadMine,
  recordResult,
  refreshTitles,
  useOmokStats,
  type RewardResult,
} from './omokStats'
import { untilAward } from './omokWeek'
import { ArmoryButton } from './ArmoryPanel'

const S = 32 // 칸 간격 (svg 단위)
const SIZE = N * S

const KIND_TEXT: Record<string, string> = {
  win: '',
  draw: '판이 가득 찼어요',
  resign: '기권했어요',
  timeout: '시간이 다 됐어요',
  leave: '상대가 나갔어요',
}

/* ---------- 바둑판 ---------- */
function Board({
  game,
  myColor,
  canPlayNow,
  onPlay,
}: {
  game: GameState | null
  myColor: 'black' | 'white' | null
  canPlayNow: boolean
  onPlay: (cell: number) => void
}) {
  const [sel, setSel] = useState<number | null>(null)
  const moves = game?.moves ?? []
  const out = useMemo(() => evaluate(moves), [moves])
  const winLine = out.over ? new Set(out.line) : null
  useEffect(() => setSel(null), [moves.length, game?.gid])

  const tap = (cell: number) => {
    if (!canPlayNow || moves.includes(cell)) return
    if (sel === cell) {
      setSel(null)
      onPlay(cell)
    } else setSel(cell)
  }

  const lines = []
  for (let i = 0; i < N; i++) {
    const p = i * S + S / 2
    lines.push(<line key={`h${i}`} x1={S / 2} y1={p} x2={SIZE - S / 2} y2={p} />)
    lines.push(<line key={`v${i}`} x1={p} y1={S / 2} x2={p} y2={SIZE - S / 2} />)
  }
  const stars = [[3, 3], [11, 3], [7, 7], [3, 11], [11, 11]]
  return (
    <svg className="omok-svg" viewBox={`0 0 ${SIZE} ${SIZE}`}>
      <rect width={SIZE} height={SIZE} rx="8" fill="#e6c27d" />
      <g stroke="#5a3d1a" strokeWidth="1.2">
        {lines}
      </g>
      {stars.map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x * S + S / 2} cy={y * S + S / 2} r="3.2" fill="#5a3d1a" />
      ))}
      {moves.map((c, i) => {
        const cx = (c % N) * S + S / 2
        const cy = Math.floor(c / N) * S + S / 2
        const black = i % 2 === 0
        const isLast = i === moves.length - 1
        return (
          <g key={c}>
            <circle cx={cx} cy={cy} r={S * 0.44} fill={black ? '#1f2025' : '#fbfbfb'} stroke="#444" strokeWidth="0.8" />
            {winLine?.has(c) && <circle cx={cx} cy={cy} r={S * 0.5} fill="none" stroke="#e0405a" strokeWidth="3" />}
            {isLast && !winLine && <circle cx={cx} cy={cy} r="4" fill="#e0405a" />}
          </g>
        )
      })}
      {sel != null && (
        <circle
          cx={(sel % N) * S + S / 2}
          cy={Math.floor(sel / N) * S + S / 2}
          r={S * 0.44}
          fill={myColor === 'black' ? '#1f2025' : '#fbfbfb'}
          opacity="0.55"
          stroke="#e0405a"
          strokeWidth="2"
        />
      )}
      {Array.from({ length: N * N }, (_, c) => (
        <rect
          key={c}
          x={(c % N) * S}
          y={Math.floor(c / N) * S}
          width={S}
          height={S}
          fill="transparent"
          onPointerUp={() => tap(c)}
          style={{ cursor: canPlayNow ? 'pointer' : 'default' }}
        />
      ))}
    </svg>
  )
}

/* ---------- 대국 창 ---------- */
function OmokPanel({ result }: { result: RewardResult | null }) {
  const me = useOmok((s) => s.me)!
  const games = useOmok((s) => s.games)
  const seats = useOmok((s) => s.seats)
  const rcv = useOmok((s) => s.rcv)
  const pending = useOmok((s) => s.pending)
  const banner = useOmok((s) => s.banner)
  const session = useVillage((s) => s.session)
  const [open, setOpen] = useState(true)
  const [, tick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 300)
    return () => clearInterval(t)
  }, [])

  const name = session?.name ?? ''
  const [sa, sb] = seats[me.tb] ?? [null, null]
  const rawGame = games[me.tb] ?? null
  // 내가 두는 판이 아니면(상대가 바뀐 직후의 옛 판) 보여 주지 않는다
  const game = rawGame && (rawGame.black === session?.name || rawGame.white === session?.name) ? rawGame : null
  const opp = me.s === 0 ? sb : sa
  const myColor = game ? (game.black === name ? 'black' : 'white') : null
  const mover = game && !game.over ? (game.moves.length % 2 === 0 ? game.black : game.white) : null
  const myTurn = mover === name
  const left = game && !game.over ? Math.max(0, Math.ceil((TURN_MS - (Date.now() - (rcv[me.tb] ?? Date.now()))) / 1000)) : 0
  const over = game?.over ?? null
  const iResigned = !!over && over.kind === 'resign' && over.winner !== name

  let status = ''
  if (!opp) status = '상대를 기다리는 중이에요 🙂'
  else if (!game) status = '곧 시작해요… 선(흑)은 무작위로 정해져요 🎲'
  else if (over) status = ''
  else status = myTurn ? '내 차례예요! 한 곳을 눌러 보고, 한 번 더 누르면 둬요 👆' : `${mover}님 차례예요`

  if (!open)
    return (
      <button type="button" className="omok-fold" onClick={() => setOpen(true)}>
        ⚫⚪ 오목 {game && !game.over ? (myTurn ? '— 내 차례!' : `— ${mover}님 차례`) : '열기'}
      </button>
    )

  return (
    <div className="omok-back">
      <div className="omok-card">
        <div className="omok-head">
          <div className="omok-players">
            <span className={`omok-p ${mover === game?.black ? 'on' : ''}`}>
              ⚫ {game ? game.black : sa ?? '…'}
            </span>
            <span className="omok-vs">vs</span>
            <span className={`omok-p ${mover === game?.white ? 'on' : ''}`}>
              ⚪ {game ? game.white : sb ?? '…'}
            </span>
          </div>
          <button type="button" className="omok-x" onClick={() => setOpen(false)} aria-label="접기">
            ⌄
          </button>
        </div>

        {game && !game.over && (
          <div className={`omok-timer ${left <= 8 ? 'low' : ''}`}>
            ⏱ {mover === name ? '내가' : `${mover}님이`} 둘 시간 {left}초
          </div>
        )}

        <Board
          game={game}
          myColor={myColor}
          canPlayNow={!!game && !game.over && myTurn && !pending}
          onPlay={playCell}
        />

        {banner && <p className="omok-note">{banner}</p>}
        {status && <p className="omok-status">{status}</p>}

        {over && (
          <div className={`omok-result ${over.winner === name ? 'win' : over.winner === null ? 'draw' : 'lose'}`}>
            <b>{over.winner === name ? '🎉 이겼어요!' : over.winner === null ? '🤝 비겼어요' : '😢 졌어요'}</b>
            <span>
              {over.kind === 'resign' ? (iResigned ? '내가 기권했어요' : '상대가 기권했어요') : (KIND_TEXT[over.kind] ?? '')}
            </span>
            {result ? (
              result.coins > 0 ? (
                <em>
                  도토리 +{result.coins} 🌰 · 승점 +{result.points}
                </em>
              ) : (
                <em className="none">{result.note}</em>
              )
            ) : (
              <em className="none">결과를 정리하는 중…</em>
            )}
          </div>
        )}

        <div className="omok-btns">
          {over ? (
            <>
              <button type="button" className="again" disabled={!opp || me.rd === game?.gid} onClick={again}>
                {me.rd === game?.gid ? '상대를 기다려요…' : '한 판 더!'}
              </button>
              <button type="button" onClick={standUp}>
                일어나기
              </button>
            </>
          ) : (
            <>
              {game && (
                <button
                  type="button"
                  className="resign"
                  onClick={() => {
                    if (window.confirm('기권할까요? 기권하면 져요.')) resign()
                  }}
                >
                  🏳️ 기권
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (!game || window.confirm('지금 일어나면 기권패예요. 일어날까요?')) standUp()
                }}
              >
                일어나기
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ---------- 오목 순위 (광장 대시보드) ---------- */
function Dashboard({ onClose }: { onClose: () => void }) {
  const standings = useOmokStats((s) => s.standings)
  const lastWeek = useOmokStats((s) => s.lastWeek)
  const titles = useOmokStats((s) => s.titles)
  const daily = useOmokStats((s) => s.daily)
  const db = useOmokStats((s) => s.db)
  const session = useVillage((s) => s.session)
  const name = session?.name ?? ''
  const medals = ['🥇', '🥈', '🥉']
  useEffect(() => {
    void fetchStandings(true)
    const t = setInterval(() => void fetchStandings(true), 20_000)
    return () => clearInterval(t)
  }, [])
  const rows = standings.filter((r) => r.points > 0)
  const myIdx = rows.findIndex((r) => r.student === name)
  const holders = Object.entries(titles).sort((a, b) => a[1] - b[1])
  return (
    <div className="farm-overlay" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="farm-card omok-dash">
        <button type="button" className="farm-x" onClick={onClose} aria-label="닫기">
          ✕
        </button>
        <h3>🏆 오목 순위 (광장 대시보드)</h3>
        <p className="omok-sub">
          다음 시상까지 <b>{untilAward()}</b> · 금요일 오후 3시에 승점 1~3등이 오목왕 모자를 받아요
        </p>

        {db === 'missing' && (
          <p className="omok-warn">순위 저장소가 아직 준비되지 않았어요. (선생님: schema-7-omok.sql 실행 필요) 게임·도토리는 그대로 받아요.</p>
        )}

        <h4>이번 주 순위</h4>
        {rows.length === 0 ? (
          <p className="omok-empty">아직 승점이 없어요. 광장에서 오목을 두어 보세요!</p>
        ) : (
          <ol className="omok-rank">
            {rows.slice(0, 10).map((r, i) => (
              <li key={r.student} className={r.student === name ? 'me' : ''}>
                <span className="n">{medals[i] ?? i + 1}</span>
                <span className="who">{r.student}</span>
                <span className="pt">{r.points}점</span>
                <span className="wl">
                  {r.wins}승 {r.draws}무 {r.losses}패
                </span>
              </li>
            ))}
          </ol>
        )}
        {myIdx >= 10 && (
          <p className="omok-me">
            내 순위: {myIdx + 1}위 · {rows[myIdx].points}점
          </p>
        )}

        <h4>지난주 오목왕 👑</h4>
        {holders.length === 0 ? (
          <p className="omok-empty">아직 오목왕이 없어요. 이번 금요일에 정해져요!</p>
        ) : (
          <ul className="omok-kings">
            {holders.map(([who, tier]) => (
              <li key={who}>
                {medals[tier - 1]} <b>{who}</b> <small>모자를 쓰고 있어요</small>
              </li>
            ))}
          </ul>
        )}
        {lastWeek.length > 0 && holders.length === 0 && <p className="omok-empty">지난주는 승점이 없었어요.</p>}

        <h4>규칙</h4>
        <ul className="omok-rules">
          <li>가로·세로·대각선으로 같은 색 돌 5개 이상을 이으면 이겨요. 선(흑)은 무작위!</li>
          <li>
            이기면 도토리 {REWARD_WIN}개·승점 {POINTS_WIN}점, 지면 도토리 {REWARD_LOSS}개, 비기면 도토리 {REWARD_DRAW}개·승점 {POINTS_DRAW}점
          </li>
          <li>같은 친구와는 몇 번이든 둘 수 있지만 보상·승점은 하루 {PAIR_LIMIT}판까지예요</li>
          <li>
            하루에 보상이 있는 판은 {DAILY_GAME_LIMIT}판까지 · 오늘 {daily.games}판 했어요
          </li>
          <li>한 수는 30초 안에 두어야 해요. 너무 빨리 끝난 판은 보상이 없어요</li>
        </ul>
      </div>
    </div>
  )
}

/* ---------- 광장 오목 전체 화면 요소 ---------- */
export function OmokHud() {
  const me = useOmok((s) => s.me)
  const seats = useOmok((s) => s.seats)
  const session = useVillage((s) => s.session)
  const [near, setNear] = useState<{ tb: number; s: 0 | 1 } | null>(null)
  const [dash, setDash] = useState(false)
  const [result, setResult] = useState<RewardResult | null>(null)

  // 광장에 들어오면: 내 기록·순위·오목왕 모자 확인
  useEffect(() => {
    void loadMine()
    void refreshTitles()
    const t = setInterval(() => void refreshTitles(), 5 * 60_000)
    return () => clearInterval(t)
  }, [])

  // 대국이 끝나면 보상 계산
  useEffect(() => {
    onOmokFinish((f) => {
      setResult(null)
      void recordResult(f).then((r) => setResult(r))
    })
    return () => onOmokFinish(null)
  }, [])
  useEffect(() => {
    if (!me) setResult(null)
  }, [me])
  // 새 판이 시작되면 지난 결과 카드는 지운다
  const gid = useOmok((s) => (s.me ? s.games[s.me.tb]?.gid : null))
  useEffect(() => setResult(null), [gid])

  // 가까운 빈 자리 찾기
  useEffect(() => {
    if (me) {
      setNear(null)
      return
    }
    const t = setInterval(() => {
      let best: { tb: number; s: 0 | 1; d: number } | null = null
      for (const tb of OMOK_TABLES) {
        for (const s of [0, 1] as const) {
          if (seats[tb.id]?.[s]) continue
          const [x, z] = seatPos(tb.id, s)
          const d = Math.hypot(playerPos.x - x, playerPos.z - z)
          if (d < 2.4 && (!best || d < best.d)) best = { tb: tb.id, s, d }
        }
      }
      setNear((prev) => (best ? (prev && prev.tb === best.tb && prev.s === best.s ? prev : { tb: best.tb, s: best.s }) : null))
    }, 250)
    return () => clearInterval(t)
  }, [me, seats])

  useEffect(() => {
    // 로그인 이름이 바뀌었을 때(드문 경우)도 모자를 다시 맞춘다
    applyMyTitle()
  }, [session?.name])

  return (
    <>
      <div className="hud-stack omok-stack">
        <button type="button" className="omok-dash-btn" onClick={() => setDash(true)}>
          🏆 오목 순위
        </button>
        <ArmoryButton />
      </div>
      {near && !me && (
        <button type="button" className="omok-sit-btn" onClick={() => sitDown(near.tb, near.s)}>
          🪑 앉아서 오목 두기
        </button>
      )}
      {me && <OmokPanel result={result} />}
      {dash && <Dashboard onClose={() => setDash(false)} />}
    </>
  )
}


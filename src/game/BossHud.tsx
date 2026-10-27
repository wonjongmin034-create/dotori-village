import { useEffect, useRef, useState } from 'react'
import { useVillage, bossLeftOf } from './store'
import {
  answer,
  chooseStage,
  isActive,
  maxStageFor,
  notifyBoss,
  onBossFinish,
  onBossStart,
  setMyLeft,
  refreshMyPresence,
  rematch,
  setBossResult,
  setMyCleared,
  startBlockReason,
  startFight,
  useBoss,
  type BossGame,
} from './bossState'
import { BOSS_ROOMS, BOSS_DAILY, BOSS_HEAL_ON_MISS, HEAL_ON_PHASE, MAX_PARTY, MIN_PARTY, ROUND_NAMES, STAGES, ULT_EVERY, ULT_LIFE_LOSS, comboMult, dmgOf, soloTest, stageOf } from './bossData'
import { ShapeFig } from './ShapeFig'
import '../boss5.css'
import { enterBoss, leaveBoss, useBossUi } from './boss'
import { tierName, isFamily } from './weapons'

// 보스전 화면(DOM) — 위: 보스 체력·팀 생명, 아래: 문제와 보기 / 대기실 / 결과.
// 3D 장면(BossArena)이 가려지지 않도록 아래쪽에 작게 놓는다.

const useNow = (ms: number, on: boolean) => {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!on) return
    const t = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(t)
  }, [ms, on])
  return now
}

/* ---------- 입구 버튼 · 방 고르기 ---------- */
export function BossEntryButton() {
  const session = useVillage((s) => s.session)
  if (!session) return null
  return (
    <button type="button" className="boss-btn" onClick={() => useBossUi.setState({ picker: true })}>
      ⚔️ 보스
    </button>
  )
}

export function BossPicker() {
  const open = useBossUi((s) => s.picker)
  const cleared = useVillage((s) => s.bossCleared)
  if (!open) return null
  const close = () => useBossUi.setState({ picker: false })
  return (
    <div className="farm-overlay" onPointerDown={(e) => e.target === e.currentTarget && close()}>
      <div className="farm-card boss-picker">
        <button type="button" className="farm-x" onClick={close} aria-label="닫기">
          ✕
        </button>
        <h3>⚔️ 보스에 도전해요</h3>
        <p className="farm-note">
          친구 {MIN_PARTY}~{MAX_PARTY}명이 <b>같은 번호의 방</b>에 모여요. 팀이 생명을 같이 쓰고, 한 사람씩 문제를 풀어요!
        </p>
        <div className="boss-prog">
          {STAGES.map((s) => (
            <span key={s.id} className={cleared >= s.id ? 'done' : ''}>
              {cleared >= s.id ? '⭐' : '☆'} {s.id}단계 {s.subject}
            </span>
          ))}
        </div>
        <div className="boss-rooms">
          {Array.from({ length: BOSS_ROOMS }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => {
                close()
                enterBoss(n)
              }}
            >
              {n}번 방
            </button>
          ))}
        </div>
        <p className="farm-note">앞 단계를 깬 친구만 다음 단계에 도전할 수 있어요. 이미 깬 보스는 다시 해도 도토리를 주지 않아요.</p>
      </div>
    </div>
  )
}

/* ---------- 위쪽: 보스 체력 · 팀 생명 ---------- */
function BossTop({ game }: { game: BossGame }) {
  const cfg = stageOf(game.stage)
  const pct = Math.max(0, Math.min(100, (game.hp / game.maxHp) * 100))
  return (
    <div className="boss-top">
      <div className="boss-name">
        {cfg.name} <small>{cfg.subject}</small>
        {cfg.mixed && <span className={`boss-phase p${game.lv}`}>{cfg.rounds ? `${game.lv}라운드` : `${game.lv}페이즈`}</span>}
        {cfg.rounds && (game.combo ?? 0) >= 1 && (
          <span className="boss-combo" key={game.combo}>
            🔥 {game.combo}연속{game.combo >= 2 ? ` · 공격 ×${comboMult(game.combo)}` : ''}
          </span>
        )}
      </div>
      <div className="boss-hp">
        <div className="boss-hp-fill" style={{ width: `${pct}%` }} />
        <span>
          {game.hp} / {game.maxHp}
        </span>
      </div>
      <div className="boss-hearts" aria-label={`팀 생명 ${game.life}`}>
        {Array.from({ length: game.maxLife }, (_, i) => (
          <span key={i} className={i < game.life ? 'on' : 'off'}>
            {i < game.life ? '❤️' : '🖤'}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ---------- 아래쪽: 문제 ---------- */
const HAND_ICON = ['✌️', '✊', '✋']
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫']

function QuestionSheet({ game, name }: { game: BossGame; name: string }) {
  const rcv = useBoss((s) => s.rcv)
  const picked = useBoss((s) => s.picked)
  const pending = useBoss((s) => s.pending)
  const avatar = useVillage((s) => s.avatar)
  const myPet = useVillage((st) => st.pet?.st ?? 0)
  const cfg = stageOf(game.stage)
  const now = useNow(100, game.phase === 'ask')
  // 이 문제에서 내가 누르고 있는 것 (타일 번호 / 순서 / 숫자 글자). 문제가 바뀌면 비워진다.
  const key = `${game.gid}:${game.n}`
  const [sel, setSel] = useState<{ key: string; v: (number | string)[] }>({ key: '', v: [] })
  const cur = sel.key === key ? sel.v : []
  const setCur = (v: (number | string)[]) => setSel({ key, v })

  if (game.phase === 'intro') {
    return (
      <div className="boss-sheet intro">
        <b>⚔️ {cfg.name} 등장!</b>
        <span>{cfg.intro}</span>
        <small>
          팀 생명 {game.maxLife}개{cfg.mixed && game.maxLife > cfg.life ? ` (기본 ${cfg.life} + 집 보너스 ${game.maxLife - cfg.life})` : ''} · 한 사람씩 차례로 풀어요 · 제한 시간{' '}
          {cfg.mixed ? '문제마다 달라요' : `${Math.round(cfg.ms / 1000)}초`}
        </small>
        {cfg.healOnMiss && <small>⚠️ 틀리면 보스 체력이 {BOSS_HEAL_ON_MISS} 회복돼요!</small>}
        {cfg.rounds && (
          <small>
            🔥 연속으로 맞히면 공격이 점점 세져요 · ⚡ {ULT_EVERY}번째 문제는 필살기! 모두 맞히면 큰 피해, 한 명이라도 틀리면 팀 생명 −{ULT_LIFE_LOSS}
          </small>
        )}
      </div>
    )
  }

  const ult = !!game.ult
  // 필살기에서는 사람마다 서로 다른 문제를 받는다 (결과가 나온 뒤에도 내 문제가 계속 보인다)
  const q = game.uq?.[name] ?? game.q
  if (!q) return null
  const k = q.k ?? 'mc'
  const isMember = game.members.some((m) => m.n === name)
  const myDone = ult && (game.done ?? []).includes(name)
  const mine = ult ? isMember && !myDone : game.who === name
  const asking = game.phase === 'ask'
  const left = asking ? Math.max(0, game.ms - (now - rcv)) : 0
  const frac = asking ? left / game.ms : 0
  const last = game.last
  const showRes = game.phase === 'result' && last
  const myTier = avatar.weapon && isFamily(avatar.weapon) ? avatar.wt : 1
  const canAnswer = asking && mine && picked < 0 && !pending
  const locked = !canAnswer

  const tileTap = (i: number) => {
    if (locked || cur.includes(i)) return
    const next = [...cur, i]
    setCur(next)
    if (q.len && next.length >= q.len) answer(next.map((x) => q.o[x as number]).join(''))
  }
  const orderTap = (i: number) => {
    if (locked) return
    if (cur.includes(i)) {
      setCur(cur.slice(0, cur.indexOf(i))) // 눌렀던 것을 다시 누르면 거기서부터 취소
      return
    }
    const next = [...cur, i]
    setCur(next)
    if (next.length >= q.o.length) answer(next as number[])
  }
  const keyTap = (c: string) => {
    if (locked) return
    if (c === '⌫') setCur(cur.slice(0, -1))
    else if (c === '.' ? cur.length > 0 && !cur.includes('.') && cur.length < 7 : cur.length < 7) setCur([...cur, c])
  }

  return (
    <div className={`boss-sheet${mine && asking ? ' mine' : ''}`}>
      <div className="boss-turn">
        {asking ? (
          ult ? (
            <b className="boss-ult">{myDone ? '⚡ 필살기! 다른 친구를 기다려요…' : '⚡ 필살기! 각자 다른 문제를 풀어요 · 모두 맞혀야 해요 (한 명이라도 틀리면 팀 생명 −' + ULT_LIFE_LOSS + ')'}</b>
          ) : mine ? (
            <b>🫵 내 차례예요!</b>
          ) : (
            <b>{game.who}님 차례예요</b>
          )
        ) : showRes ? (
          last.ult ? (
            last.ok ? (
              <b className="ok">⚡ 필살기 성공! 모두 정답 — 큰 피해 −{last.dmg}</b>
            ) : (
              <b className="bad">
                💥 필살기 실패! {(last.ultBad ?? []).join(', ')}님이 {last.timeout ? '못 풀었어요' : '틀렸어요'} · 팀 생명 −{ULT_LIFE_LOSS}
              </b>
            )
          ) : last.draw ? (
            <b>🤝 비겼어요! 한 번 더 도전</b>
          ) : last.ok ? (
            <b className="ok">
              ✅ {last.kind === 'rps' || last.kind === 'oe' ? '이겼다!' : '정답!'} {last.who}님의 공격 −{last.dmg}
              {last.mult ? ` (콤보 ×${last.mult})` : ''}
            </b>
          ) : (
            <b className="bad">{last.timeout ? '⏰ 시간 초과!' : '❌ 아쉬워요!'} 보스의 반격 💥{last.heal ? ` · 보스 체력 +${last.heal} 회복` : ''}</b>
          )
        ) : null}
        <small>
          {q.cat && <span className="boss-cat">{q.cat}</span>}
          {ult ? '⚡ 필살기' : `${game.n}번째`} · 내 공격력 {dmgOf(myTier, game.stage, myPet)}
          {avatar.weapon && isFamily(avatar.weapon) ? ` (${tierName(avatar.weapon, avatar.wt)})` : ''}
          {myPet >= 2 ? ' 🐾펫 보너스' : ''}
        </small>
      </div>

      {asking && (
        <div className="boss-timer">
          <div className={frac < 0.3 ? 'low' : ''} style={{ width: `${frac * 100}%` }} />
          <span>{Math.ceil(left / 1000)}초</span>
        </div>
      )}

      {q.sub && <div className="boss-sub">{q.sub}</div>}
      {q.fig && <ShapeFig fig={q.fig} />}
      <div className={`boss-q${q.t.length > 26 || q.fig ? ' long' : ''}`}>{q.t}</div>

      {/* 보기 고르기 */}
      {k === 'mc' && (
        <div className="boss-opts">
          {q.o.map((o, i) => {
            let cls = ''
            if (showRes) {
              if (i === last.a) cls = 'right'
              else if (i === last.pick) cls = 'wrong'
            } else if (picked === i) cls = 'picked'
            return (
              <button key={i} type="button" className={cls} disabled={locked} onClick={() => answer(i)}>
                {o}
              </button>
            )
          })}
        </div>
      )}

      {/* 가위바위보 · 홀짝 */}
      {(k === 'rps' || k === 'oe') && (
        <div className={`boss-hands ${k}`}>
          {q.o.map((o, i) => (
            <button key={i} type="button" className={picked === i ? 'picked' : ''} disabled={locked} onClick={() => answer(i)}>
              <span>{k === 'rps' ? HAND_ICON[i] : i === 0 ? '1️⃣' : '2️⃣'}</span>
              {o}
            </button>
          ))}
        </div>
      )}

      {/* 글자 타일로 단어 만들기 */}
      {k === 'tiles' && (
        <>
          <div className="boss-slots">
            {Array.from({ length: q.len ?? 0 }, (_, i) => (
              <span key={i} className={cur[i] != null ? 'on' : ''}>
                {cur[i] != null ? q.o[cur[i] as number] : ''}
              </span>
            ))}
          </div>
          <div className="boss-tiles">
            {q.o.map((c, i) => (
              <button key={i} type="button" disabled={locked || cur.includes(i)} onClick={() => tileTap(i)}>
                {c}
              </button>
            ))}
          </div>
          {!locked && cur.length > 0 && (
            <button type="button" className="boss-undo" onClick={() => setCur(cur.slice(0, -1))}>
              ⌫ 한 글자 지우기
            </button>
          )}
        </>
      )}

      {/* 순서대로 누르기 */}
      {k === 'order' && (
        <>
          <div className="boss-order">
            {q.o.map((o, i) => {
              const at = cur.indexOf(i)
              return (
                <button key={i} type="button" className={at >= 0 ? 'on' : ''} disabled={locked && at < 0} onClick={() => orderTap(i)}>
                  <i>{at >= 0 ? at + 1 : ''}</i>
                  {o}
                </button>
              )
            })}
          </div>
          {!locked && cur.length > 0 && (
            <button type="button" className="boss-undo" onClick={() => setCur([])}>
              ↺ 처음부터 다시
            </button>
          )}
        </>
      )}

      {/* 숫자 입력 */}
      {k === 'num' && (
        <>
          <div className="boss-numshow">{cur.length ? cur.join('') : '?'}</div>
          <div className="boss-pad">
            {KEYS.map((c) => (
              <button key={c} type="button" disabled={locked} onClick={() => keyTap(c)}>
                {c}
              </button>
            ))}
            <button type="button" className="go" disabled={locked || cur.length === 0} onClick={() => answer(cur.join(''))}>
              확인
            </button>
          </div>
        </>
      )}

      {/* 결과: 정답 보여 주기 */}
      {showRes && k !== 'mc' && (
        <div className="boss-reveal">
          {k === 'rps' || k === 'oe' ? (
            <>
              {last.pickText ? `내 선택: ${last.pickText} · ` : ''}
              {last.ansText}
            </>
          ) : (
            <>
              정답: <b>{last.ult ? (last.ultAns?.[name] ?? '') : last.ansText}</b>
              {last.ult ? (
                (last.ultBad ?? []).includes(name) ? <small> (내 답이 틀렸거나 못 풀었어요)</small> : <small> ✅ 맞혔어요</small>
              ) : !last.ok && last.pickText ? (
                <small> (내 답: {last.pickText})</small>
              ) : null}
            </>
          )}
        </div>
      )}
      {asking && ult && (
        <div className="boss-wait">
          {game.members.map((m) => (
            <span key={m.n} className={(game.done ?? []).includes(m.n) ? 'done' : ''}>
              {(game.done ?? []).includes(m.n) ? '✅' : '✏️'} {m.n}
            </span>
          ))}
        </div>
      )}
      {asking && !ult && !mine && <div className="boss-wait">{game.who}님이 푸는 중이에요… 응원해 주세요! 📣</div>}
    </div>
  )
}

/* ---------- 대기실 ---------- */
function Lobby({ room }: { room: number }) {
  const roster = useBoss((s) => s.roster)
  const host = useBoss((s) => s.host)
  const lobbyStage = useBoss((s) => s.lobbyStage)
  const session = useVillage((s) => s.session)
  const [err, setErr] = useState('')
  const name = session?.name ?? ''
  const isHost = host === name
  const maxStage = maxStageFor(roster)
  const block = startBlockReason(roster)
  const stage = Math.min(lobbyStage, maxStage)

  const lowest = roster.length ? roster.reduce((a, b) => (b.cl < a.cl ? b : a)) : null

  return (
    <div className="boss-lobby">
      <h3>⚔️ 보스 방 {room}번</h3>
      <ul className="boss-roster">
        {roster.map((m) => (
          <li key={m.n} className={m.n === name ? 'me' : ''}>
            {m.n === host ? '👑 ' : ''}
            {m.n}
            {m.n === name ? ' (나)' : ''}
            <small> ⭐{m.cl}/{STAGES.length} · 🎟️{m.tl}/{BOSS_DAILY}</small>
          </li>
        ))}
      </ul>
      <p className="boss-hint">
        {soloTest() && roster.length < MIN_PARTY
          ? `🧪 연습 모드: ${roster.length}명으로도 시작해요 (도토리·클리어 기록 없음)`
          : roster.length < MIN_PARTY
            ? `${MIN_PARTY}명 이상 모여야 해요 (지금 ${roster.length}명). 친구를 불러요! 📣`
            : `${roster.length}명이 모였어요!`}
      </p>

      <div className="boss-stages">
        {STAGES.map((s) => {
          const locked = s.id > maxStage
          return (
            <button
              key={s.id}
              type="button"
              className={`${stage === s.id ? 'on' : ''}${locked ? ' locked' : ''}`}
              disabled={!isHost || locked}
              onClick={() => chooseStage(s.id)}
              title={locked ? '모두가 앞 단계를 깨야 해요' : ''}
            >
              <b>{locked ? '🔒' : s.id === stage ? '✔️' : ''} {s.id}단계</b>
              <span>{s.name}</span>
              <small>
                {s.subject} · {s.mixed ? '문제마다 다름' : `${Math.round(s.ms / 1000)}초`} · 🌰{s.reward}
              </small>
            </button>
          )
        })}
      </div>
      {maxStage < STAGES.length && lowest && (
        <p className="boss-hint small">
          {maxStage + 1}단계는 모두가 {maxStage}단계를 깨야 해요 (아직: {roster.filter((r) => r.cl < maxStage).map((r) => r.n).join(', ') || '없음'})
        </p>
      )}

      {isHost ? (
        <button
          type="button"
          className="boss-go"
          disabled={!!block}
          onClick={() => {
            const e = startFight()
            setErr(e ?? '')
          }}
        >
          {block ?? '⚔️ 도전 시작!'}
        </button>
      ) : (
        <p className="boss-hint">방장({host})이 단계를 고르고 시작해요 🙂</p>
      )}
      {err && <p className="boss-err">{err}</p>}
      <p className="boss-hint small">🎟️ 보스 도전은 하루 {BOSS_DAILY}번까지예요 (전투를 시작할 때마다 1번 써요).</p>
      <p className="boss-hint small">처음 깬 보스만 도토리를 줘요. 이미 깬 보스는 몇 번을 해도 연습만 돼요.</p>
    </div>
  )
}

/* ---------- 결과 ---------- */
function Outcome({ game, name }: { game: BossGame; name: string }) {
  const result = useBoss((s) => s.result)
  const host = useBoss((s) => s.host)
  const isHost = host === name
  const cfg = stageOf(game.stage)
  const won = game.phase === 'won'
  const aborted = game.phase === 'aborted'
  return (
    <div className={`boss-out ${won ? 'won' : 'lost'}`}>
      <h3>{won ? `🎉 ${cfg.name}을(를) 쓰러뜨렸어요!` : aborted ? '⚠️ 전투가 중단됐어요' : '😢 아쉽게 졌어요'}</h3>
      {won ? (
        <p>
          {result && result.coins > 0 ? (
            <b>처음 클리어! 도토리 +{result.coins} 🌰</b>
          ) : result ? (
            <span>{result.note}</span>
          ) : (
            <span>결과를 정리하는 중…</span>
          )}
        </p>
      ) : aborted ? (
        <p>방장이나 팀원이 나가서 전투를 멈췄어요. 보상도 손해도 없어요.</p>
      ) : (
        <p>팀 생명이 모두 사라졌어요. 다시 도전하면 이길 수 있어요! 💪</p>
      )}
      {isHost ? (
        <div className="boss-out-btns">
          <button type="button" onClick={() => void startFight()}>
            ⚔️ 같은 단계 다시
          </button>
          <button type="button" onClick={() => void rematch()}>
            🏠 대기실로
          </button>
        </div>
      ) : (
        <p className="boss-hint small">방장이 다시 시작하길 기다려요</p>
      )}
    </div>
  )
}

/* ---------- 전체 ---------- */
export function BossHud() {
  const game = useBoss((s) => s.game)
  const banner = useBoss((s) => s.banner)
  const roster = useBoss((s) => s.roster)
  const room = useVillage((s) => s.bossRoom)
  const session = useVillage((s) => s.session)
  const name = session?.name ?? ''
  const mine = !!game && game.members.some((m) => m.n === name)
  const active = !!game && isActive(game)

  // 전투가 시작되면 오늘 도전 횟수를 1 쓰고, 친구들에게도 남은 횟수를 알린다
  useEffect(() => {
    onBossStart((g) => {
      // 처음 센 판에서만 알린다. (판 상태가 바뀔 때마다 접속 정보를 다시 보내면, 친구들 화면에 "○○님이 돌아갔어요"가 계속 뜬다)
      if (!useVillage.getState().spendBossTry(g.gid)) return
      setMyLeft(bossLeftOf(useVillage.getState().bossTry))
      refreshMyPresence()
    })
    return () => onBossStart(null)
  }, [])

  // 한 판이 끝나면: 처음 깬 보스에만 도토리 (한 번만)
  useEffect(() => {
    onBossFinish((g) => {
      const v = useVillage.getState()
      if (g.phase === 'lost') {
        setBossResult({ gid: g.gid, won: false, stage: g.stage, coins: 0, note: '' })
        return
      }
      const cfg = stageOf(g.stage)
      if (g.members.length < MIN_PARTY) {
        // 3명 미만으로 한 판(선생님 연습 모드)은 도토리·클리어 기록이 없다
        setBossResult({ gid: g.gid, won: true, stage: g.stage, coins: 0, note: '연습 모드라 도토리와 클리어 기록은 없어요 🧪' })
        return
      }
      const first = v.bossCleared < g.stage && g.stage <= v.bossCleared + 1
      if (first) {
        v.markBossCleared(g.stage)
        v.addCoins(cfg.reward, `${cfg.name} 처음 클리어`)
        setMyCleared(g.stage)
        refreshMyPresence() // 친구들 화면에도 내가 깬 단계를 알린다 (다음 단계 도전 조건)
        setBossResult({ gid: g.gid, won: true, stage: g.stage, coins: cfg.reward, note: '' })
      } else {
        setBossResult({ gid: g.gid, won: true, stage: g.stage, coins: 0, note: '이미 클리어한 보스라 도토리는 없어요. 연습 성공! 👏' })
      }
    })
    return () => onBossFinish(null)
  }, [])

  // 종합 보스: 다음 페이즈로 올라가면 알린다
  const gidRef = useRef(0)
  const lvRef = useRef(1)
  const lv = game?.lv ?? 1
  const gid = game?.gid ?? 0
  useEffect(() => {
    if (!game || !mine) return
    if (gid !== gidRef.current) {
      gidRef.current = gid
      lvRef.current = lv
      return
    }
    if (lv > lvRef.current) {
      const rounds = stageOf(game.stage).rounds
      notifyBoss(rounds ? `⚡ ${lv}라운드 시작! ${ROUND_NAMES[lv]} (팀 생명 +${HEAL_ON_PHASE})` : `🔥 보스가 화났다! ${lv}페이즈 — 문제가 어려워져요 (팀 생명 +${HEAL_ON_PHASE})`)
    }
    lvRef.current = lv
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gid, lv, mine])

  // 이미 전투가 시작된 방에 나중에 들어왔으면 돌려보낸다
  useEffect(() => {
    if (!game || !isActive(game) || mine || !roster.some((r) => r.n === name)) return
    leaveBoss()
    useVillage.getState().setNotice('이 보스 방은 이미 전투 중이에요.\n다른 번호의 방에서 만나요! ⚔️')
  }, [game, mine, roster, name])

  if (room == null) return null

  return (
    <>
      {game && mine && <BossTop game={game} />}
      {banner && <div className="boss-banner">{banner}</div>}
      {game && mine && active && <QuestionSheet game={game} name={name} />}
      {(!game || !active) && (game && mine && !active ? <Outcome game={game} name={name} /> : <Lobby room={room} />)}
      {game && mine && game.phase === 'result' && game.last && !game.last.ok && <div key={game.seq} className="boss-flash" />}
    </>
  )
}

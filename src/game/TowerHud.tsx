import { useEffect, useRef, useState } from 'react'
import '../tower.css'
import { useVillage, towerLeftOf } from './store'
import {
  answerTower,
  closeTowerPicker,
  exitTower,
  fetchRank,
  openChest,
  openTowerPicker,
  startStage,
  useTower,
} from './towerState'
import { QUIZ_MS, STAGE_COUNT, TOWER, TOWER_DAILY, canEnter, heartsFor, isTowerTester, stageMonsterCount, stageTotalHp, titleOf, towerStage } from './towerData'
import { answerText } from './towerQuestions'
import { towerInput } from './player-state'
import { FAMILY_EMOJI, isFamily, tierName } from './weapons'

// 탑 화면(DOM) — 입구 버튼·단계 고르기·순위 / 싸울 때의 하트와 공격 버튼 / 상자 문제 / 결과.

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫']

export function TowerEntryButton() {
  const session = useVillage((s) => s.session)
  const best = useVillage((s) => s.tower.best)
  if (!session) return null
  const t = titleOf(best)
  return (
    <button type="button" className="tower-btn" onClick={openTowerPicker}>
      🗼 도토리 탑{t ? <i style={{ color: t.color }}>{best}단계</i> : null}
    </button>
  )
}

/* ---------- 단계 고르기 · 순위 ---------- */
export function TowerPicker() {
  const open = useTower((s) => s.picker)
  const standings = useTower((s) => s.standings)
  const db = useTower((s) => s.db)
  const tower = useVillage((s) => s.tower)
  const houseLv = useVillage((s) => s.items.find((i) => i.type === 'house')?.level ?? 1)
  const avatar = useVillage((s) => s.avatar)
  const session = useVillage((s) => s.session)
  const [tab, setTab] = useState<'stages' | 'rank'>('stages')
  const [err, setErr] = useState('')
  const [sel, setSel] = useState(0)

  useEffect(() => {
    if (open) {
      setErr('')
      setTab('stages')
      setSel(0)
    }
  }, [open])
  if (!open) return null

  const tester = isTowerTester(session?.name)
  const left = towerLeftOf(tower)
  const next = Math.min(STAGE_COUNT, tower.best + 1)
  const cur = sel || next
  const st = towerStage(cur)
  const chk = canEnter(cur, tower.best, houseLv, left, tester)
  const weaponOk = avatar.weapon && isFamily(avatar.weapon) ? avatar.wt : 1
  const title = titleOf(tower.best)

  return (
    <div className="farm-overlay" onPointerDown={(e) => e.target === e.currentTarget && closeTowerPicker()}>
      <div className="farm-card tower-card">
        <button type="button" className="farm-x" onClick={closeTowerPicker} aria-label="닫기">
          ✕
        </button>
        <h3>🗼 도토리 탑</h3>
        <div className="tower-me">
          <span>
            내 칭호{' '}
            {title ? (
              <b className="tt" style={{ background: title.color }}>
                {title.text}
              </b>
            ) : (
              <em>아직 없어요</em>
            )}
          </span>
          <span className="tickets">
            {tester ? '🎟️ 시험 계정 · 제한 없음' : `🎟️ 입장권 ${left}/${TOWER_DAILY}`}
          </span>
        </div>
        <div className="tower-tabs">
          <button type="button" className={tab === 'stages' ? 'on' : ''} onClick={() => setTab('stages')}>
            단계
          </button>
          <button
            type="button"
            className={tab === 'rank' ? 'on' : ''}
            onClick={() => {
              setTab('rank')
              void fetchRank(true)
            }}
          >
            🏆 순위
          </button>
        </div>

        {tab === 'stages' ? (
          <>
            <ol className="tower-list">
              {TOWER.map((s) => {
                const done = tower.best >= s.id
                const locked = s.id > tower.best + 1
                return (
                  <li key={s.id}>
                    <button type="button" className={`${cur === s.id ? 'on' : ''}${done ? ' done' : ''}${locked ? ' locked' : ''}`} onClick={() => setSel(s.id)}>
                      <span className="n">{done ? '✓' : locked ? '🔒' : s.id}</span>
                      <span className="nm">{s.name}</span>
                      <span className="tt-mini" style={{ color: s.color }}>
                        {s.title}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ol>
            <div className="tower-detail">
              <b>
                {cur}단계 · {st.name}
              </b>
              <p>{st.intro}</p>
              <ul>
                <li>몬스터 {stageMonsterCount(st)}마리 (체력 합계 {stageTotalHp(st).toLocaleString()})</li>
                <li>
                  권장 무기 {st.rec}단계 이상 · 내 무기 {weaponOk}단계
                  {avatar.weapon && isFamily(avatar.weapon) ? ` (${FAMILY_EMOJI[avatar.weapon]} ${tierName(avatar.weapon, avatar.wt)})` : ''}
                </li>
                <li>하트 {heartsFor(houseLv, tester)}개{tester ? ' (시험 계정은 3개 고정)' : ' (집이 좋을수록 늘어나요)'}</li>
                <li>
                  🌰 처음 깨면 {st.reward}개 · 칭호 「<span style={{ color: st.color, fontWeight: 900 }}>{st.title}</span>」
                </li>
                {st.house > 1 && <li>집 {st.house}단계 이상 필요</li>}
              </ul>
              <p className="tower-rule">몬스터를 모두 잡으면 보물상자가 나와요. 상자의 문제 3개(수학·영어·국어)를 문제당 30초 안에 모두 맞혀야 클리어예요. 하나라도 틀리면 몬스터부터 다시 싸워요!</p>
            </div>
            {err && <p className="boss-err">{err}</p>}
            <div className="armory-btns">
              <button
                type="button"
                className={chk.ok ? 'primary' : ''}
                disabled={!chk.ok || !session}
                onClick={() => {
                  const e = startStage(cur)
                  if (e) setErr(e)
                }}
              >
                {chk.ok ? `⚔️ ${cur}단계 도전! (입장권 1장)` : chk.why}
              </button>
            </div>
          </>
        ) : (
          <>
            {db === 'missing' && <p className="farm-note">순위 표가 아직 준비되지 않았어요. (선생님이 supabase/schema-9-tower.sql 을 한 번 실행해야 해요)</p>}
            <ol className="tower-rank">
              {standings.length === 0 && db !== 'missing' && <li className="empty">아직 기록이 없어요. 첫 번째 주인공이 되어 봐요!</li>}
              {standings.slice(0, 15).map((r, i) => {
                const t = titleOf(r.best)
                return (
                  <li key={r.student} className={r.student === session?.name ? 'me' : ''}>
                    <span className="rk">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</span>
                    <span className="nm">{r.student}</span>
                    {t && (
                      <i className="tt" style={{ background: t.color }}>
                        {t.text}
                      </i>
                    )}
                    <b>{r.best}단계</b>
                  </li>
                )
              })}
            </ol>
            <p className="farm-note">같은 단계는 먼저 도착한 친구가 위에 있어요.</p>
          </>
        )}
      </div>
    </div>
  )
}

/* ---------- 싸우는 동안 ---------- */
export function TowerHud() {
  const phase = useTower((s) => s.phase)
  const stage = useTower((s) => s.stage)
  const hearts = useTower((s) => s.hearts)
  const maxHearts = useTower((s) => s.maxHearts)
  const hpFrac = useTower((s) => s.hpFrac)
  const left = useTower((s) => s.left)
  const hurtSeq = useTower((s) => s.hurtSeq)
  const avatar = useVillage((s) => s.avatar)
  const st = towerStage(stage)
  const fam = avatar.weapon && isFamily(avatar.weapon) ? avatar.weapon : null

  // 키보드: J · Enter 로도 공격
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.code === 'KeyJ' || e.code === 'Enter') && !e.repeat) {
        towerInput.tap = true
        towerInput.hold = true
      }
    }
    const up = (e: KeyboardEvent) => {
      if (e.code === 'KeyJ' || e.code === 'Enter') towerInput.hold = false
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      towerInput.hold = false
      towerInput.tap = false
    }
  }, [])

  return (
    <>
      {hurtSeq > 0 && <div key={hurtSeq} className="tower-hurt" aria-hidden="true" />}

      <div className="boss-top tower-top">
        <div className="boss-name">
          🗼 {stage}단계 · {st.name}
          <small>몬스터 {left}마리 남음</small>
        </div>
        <div className="boss-hp">
          <div className="boss-hp-fill" style={{ width: `${Math.max(0, hpFrac) * 100}%` }} />
          <span>몬스터 체력</span>
        </div>
        <div className="boss-hearts" aria-label={`내 하트 ${hearts}`}>
          {Array.from({ length: maxHearts }, (_, i) => (
            <span key={i} className={i < hearts ? 'on' : 'off'}>
              {i < hearts ? '❤️' : '🖤'}
            </span>
          ))}
        </div>
      </div>

      {phase === 'intro' && (
        <div className="tower-banner">
          <b>🗼 {stage}단계</b>
          <span>{st.name}</span>
          <small>{st.intro}</small>
          <em>⚔️ 버튼을 누르고 있으면 계속 공격해요 · 몬스터에게 닿으면 하트가 줄어요</em>
        </div>
      )}

      {phase === 'fight' && (
        <button
          type="button"
          className="tower-atk"
          onPointerDown={(e) => {
            e.stopPropagation()
            e.preventDefault()
            towerInput.tap = true
            towerInput.hold = true
          }}
          onPointerUp={(e) => {
            e.stopPropagation()
            towerInput.hold = false
          }}
          onPointerLeave={() => (towerInput.hold = false)}
          onPointerCancel={() => (towerInput.hold = false)}
          onContextMenu={(e) => e.preventDefault()}
          aria-label="공격"
        >
          <span>{fam ? FAMILY_EMOJI[fam] : '🗡️'}</span>
          공격
        </button>
      )}

      {phase === 'chest' && (
        <div className="tower-chest">
          <b>🎁 보물상자가 나타났어요!</b>
          <small>문제 3개(수학·영어·국어)를 모두 맞히면 {stage}단계 클리어! 문제당 30초예요.</small>
          <button type="button" className="boss-go" onClick={openChest}>
            🎁 상자 열기
          </button>
        </div>
      )}

      {phase === 'quiz' && <TowerQuiz />}
      {(phase === 'clear' || phase === 'fail') && <TowerResult />}
    </>
  )
}

/* ---------- 상자 문제 ---------- */
function TowerQuiz() {
  const quiz = useTower((s) => s.quiz)
  const qi = useTower((s) => s.qi)
  const qStart = useTower((s) => s.qStart)
  const q = quiz[qi]
  const [now, setNow] = useState(() => Date.now())
  const [cur, setCur] = useState<(number | string)[]>([])
  const doneRef = useRef(-1)

  useEffect(() => {
    setCur([])
    doneRef.current = -1
  }, [qi, qStart])
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 100)
    return () => clearInterval(t)
  }, [])

  const leftMs = Math.max(0, QUIZ_MS - (now - qStart))
  useEffect(() => {
    if (leftMs <= 0 && doneRef.current !== qStart) {
      doneRef.current = qStart
      answerTower(null)
    }
  }, [leftMs, qStart])

  if (!q) return null
  const k = q.k ?? 'mc'
  const submit = (p: number | string) => {
    if (doneRef.current === qStart) return
    doneRef.current = qStart
    answerTower(p)
  }
  const tileTap = (i: number) => {
    if (cur.includes(i)) return
    const next = [...cur, i]
    setCur(next)
    if (next.length >= (q.len ?? 0)) submit(next.map((n) => q.o[n as number]).join(''))
  }
  const keyTap = (c: string) => {
    if (c === '⌫') setCur(cur.slice(0, -1))
    else if (c === '.' ? cur.length > 0 && !cur.includes('.') && cur.length < 7 : cur.length < 7) setCur([...cur, c])
  }

  return (
    <div className="boss-sheet mine tower-quiz">
      <div className="boss-turn">
        <b>
          🎁 상자 문제 {qi + 1}/{quiz.length}
        </b>
        <small>
          <span className="boss-cat">{q.cat}</span> 한 문제라도 틀리면 클리어가 아니에요
        </small>
      </div>
      <div className="boss-timer">
        <div className={leftMs < 8000 ? 'low' : ''} style={{ width: `${(leftMs / QUIZ_MS) * 100}%` }} />
        <span>{Math.ceil(leftMs / 1000)}초</span>
      </div>
      {q.sub && <div className="boss-sub">{q.sub}</div>}
      {q.passage && <div className="tower-passage">{q.passage}</div>}
      <div className={`boss-q${q.t.length > 18 ? ' long' : ''}${q.k === 'tiles' ? '' : ''}`}>{q.t}</div>

      {k === 'mc' && (
        <div className="boss-opts">
          {q.o.map((o, i) => (
            <button key={i} type="button" onClick={() => submit(i)}>
              {o}
            </button>
          ))}
        </div>
      )}

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
              <button key={i} type="button" disabled={cur.includes(i)} onClick={() => tileTap(i)}>
                {c}
              </button>
            ))}
          </div>
          {cur.length > 0 && (
            <button type="button" className="boss-undo" onClick={() => setCur(cur.slice(0, -1))}>
              ⌫ 한 글자 지우기
            </button>
          )}
        </>
      )}

      {k === 'num' && (
        <>
          <div className="boss-numshow">{cur.length ? cur.join('') : '?'}</div>
          <div className="boss-pad">
            {KEYS.map((c) => (
              <button key={c} type="button" onClick={() => keyTap(c)}>
                {c}
              </button>
            ))}
            <button type="button" className="go" disabled={cur.length === 0} onClick={() => submit(cur.join(''))}>
              확인
            </button>
          </div>
        </>
      )}
    </div>
  )
}

/* ---------- 결과 ---------- */
function TowerResult() {
  const phase = useTower((s) => s.phase)
  const stage = useTower((s) => s.stage)
  const why = useTower((s) => s.failWhy)
  const reveal = useTower((s) => s.reveal)
  const result = useTower((s) => s.result)
  const secs = useTower((s) => s.secs)
  const left = useVillage((s) => towerLeftOf(s.tower))
  const tester = useVillage((s) => isTowerTester(s.session?.name))
  const st = towerStage(stage)
  const won = phase === 'clear'

  return (
    <div className={`boss-out tower-out${won ? ' won' : ''}`}>
      {won ? (
        <>
          <h3>🏆 {stage}단계 클리어!</h3>
          {result?.first ? (
            <>
              <p>
                처음 깬 단계예요! 🌰 <b>+{result.reward}</b> 도토리
              </p>
              <p>
                새 칭호 <b className="tt" style={{ background: st.color }}>{st.title}</b>
              </p>
            </>
          ) : (
            <p>이미 클리어한 단계라 도토리는 없어요. 멋진 연습이었어요! 👏</p>
          )}
          <small>문제를 푼 시간: {secs.map((s) => `${s}초`).join(' · ')}</small>
        </>
      ) : why === 'dead' ? (
        <>
          <h3>💥 하트가 모두 사라졌어요</h3>
          <p>몬스터가 너무 셌나 봐요. 무기를 키우거나 집을 키우면 더 오래 버틸 수 있어요!</p>
        </>
      ) : (
        <>
          <h3>{why === 'time' ? '⏰ 시간이 끝났어요' : '❌ 아쉬워요!'}</h3>
          <p>상자 문제를 하나라도 틀리면 클리어가 아니에요. 몬스터부터 다시 도전해 봐요!</p>
          {reveal && (
            <div className="tower-reveal">
              <small>틀린 문제</small>
              <b>{reveal.q.passage ? `${reveal.q.t}` : reveal.q.t}</b>
              <span>
                정답: <em>{answerText(reveal.q)}</em>
              </span>
            </div>
          )}
        </>
      )}
      <small>{tester ? '시험 계정이라 입장권을 쓰지 않아요' : `오늘 남은 입장권 🎟️ ${left}/${TOWER_DAILY}`}</small>
      <div className="armory-btns">
        <button type="button" className="primary" onClick={exitTower}>
          🏠 마을로 돌아가기
        </button>
      </div>
    </div>
  )
}

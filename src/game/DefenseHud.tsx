import { useEffect, useState } from 'react'
import { useVillage, defOf, defLeftOf } from './store'
import { useNow } from './useNow'
import {
  BOX_GOLD,
  DEF_DAILY,
  DEF_MAX,
  DEF_MIN,
  DEF_ROOMS,
  DEF_STAGE_LIST,
  DEF_WAVES,
  MAX_TOWER_TIER,
  MONSTERS,
  SPEC_BOOST,
  TOWERS,
  TOWER_KINDS,
  TREE_HP,
  buildCost,
  defVisible,
  evolveCost,
} from './defData'
import {
  active,
  answerDef,
  canSpeak,
  chooseDefStage,
  giveUpDef,
  maxStageFor,
  myDefJob,
  requestBuild,
  requestEvolve,
  sendGift,
  speak,
  startBlock,
  startDefense,
  useDef,
  defMe,
} from './defState'
import { enterDefense, leaveDefense, useDefUi } from './defense'
import { colorOf } from './DefenseArena'
import { JOB_MAP, jobIcon } from './jobs'
import { isFamily } from './weapons'
import './defense.css'

const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(Math.max(0, 3 - n))

/* ---------- 마을: 들어가는 버튼 · 방 고르기 ---------- */
export function DefenseEntryButton() {
  const session = useVillage((s) => s.session)
  if (!session || !defVisible()) return null
  return (
    <button type="button" className="def-btn" onClick={() => useDefUi.setState({ picker: true })}>
      🌳 수비대
    </button>
  )
}

export function DefensePicker() {
  const open = useDefUi((s) => s.picker)
  const items = useVillage((s) => s.items)
  if (!open) return null
  const d = defOf(items)
  const close = () => useDefUi.setState({ picker: false })
  return (
    <div className="farm-overlay" onPointerDown={(e) => e.target === e.currentTarget && close()}>
      <div className="farm-card def-picker">
        <button type="button" className="farm-x" onClick={close} aria-label="닫기">
          ✕
        </button>
        <h3>🌳 도토리 나무 수비대</h3>
        <p className="farm-note">
          친구 {DEF_MIN}~{DEF_MAX}명이 <b>같은 번호의 방</b>에 모여요. 빈 터에 탑을 지어 몰려오는 몬스터로부터 도토리 나무를 지켜요!
          <br />
          탑을 지을 때마다 문제를 풀어요 (7초, 틀리면 돈을 잃어요). 오늘 남은 입장 {defLeftOf(d)}/{DEF_DAILY}
        </p>
        <div className="def-prog">
          {DEF_STAGE_LIST.map((s) => (
            <span key={s.id}>
              {s.id}단계 {s.name} <b>{stars(d.st[s.id - 1] ?? 0)}</b>
            </span>
          ))}
        </div>
        <div className="boss-rooms">
          {Array.from({ length: DEF_ROOMS }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => {
                close()
                enterDefense(n)
              }}
            >
              {n}번 방
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ---------- 수비대 방 화면 ---------- */
export function DefenseHud({ room }: { room: number }) {
  const snap = useDef((s) => s.snap)
  const banner = useDef((s) => s.banner)
  const result = useDef((s) => s.result)
  const playing = !!snap && active(snap)
  return (
    <div className="def-hud">
      {banner && <div className="def-banner">{banner}</div>}
      {playing ? (
        <>
          <TopBar />
          <SelPanel />
          <QuizBox />
        </>
      ) : result ? (
        <Result />
      ) : (
        <Lobby room={room} />
      )}
    </div>
  )
}

function Lobby({ room }: { room: number }) {
  const roster = useDef((s) => s.roster)
  const host = useDef((s) => s.host)
  const lobbyStage = useDef((s) => s.lobbyStage)
  const items = useVillage((s) => s.items)
  const [err, setErr] = useState('')
  const me = defMe()
  const isHost = host === me
  const maxStage = maxStageFor(roster)
  const stage = Math.min(lobbyStage, maxStage)
  const block = startBlock(roster)
  const d = defOf(items)
  return (
    <div className="def-lobby">
      <h3>🌳 수비대 {room}번 방</h3>
      <ul className="def-roster">
        {roster.map((m) => (
          <li key={m.n} style={{ borderColor: colorOf(roster.map((r) => r.n), m.n) }}>
            {m.n === host ? '👑 ' : ''}
            {jobIcon(m.jb)}
            {m.n}
            {m.n === me ? ' (나)' : ''}
            <small>
              {' '}
              {m.jb && isFamily(m.jb) ? `전문 탑: ${TOWERS[m.jb].name}` : '견습 (전문 탑 없음)'} · 🎟️{m.tl}
            </small>
          </li>
        ))}
      </ul>
      <div className="def-stages">
        {DEF_STAGE_LIST.map((s) => {
          const locked = s.id > maxStage
          return (
            <button key={s.id} type="button" className={`${stage === s.id ? 'on' : ''}${locked ? ' locked' : ''}`} disabled={!isHost || locked} onClick={() => chooseDefStage(s.id)}>
              <b>
                {locked ? '🔒' : stage === s.id ? '✔️' : ''} {s.id}단계
              </b>
              <span>{s.name}</span>
              <small>
                내 별 {stars(d.st[s.id - 1] ?? 0)} · 🌰{s.reward.join('/')}
              </small>
            </button>
          )
        })}
      </div>
      <p className="def-rules">
        🏗️ 빈 터를 눌러 탑 짓기 → 문제 7초 (틀리면 돈을 잃어요) · 💰 몬스터를 잡은 탑 주인 70%, 나머지는 모두가 나눠 가져요 · ⬆️ 내 탑을 눌러 진화 (3단계에서 갈림길) ·
        🎖️ 내 직업 탑은 30% 싸고 2단계로 지어져요
      </p>
      {isHost ? (
        <button
          type="button"
          className="boss-go"
          disabled={!!block}
          onClick={() => {
            const why = startDefense()
            setErr(why ?? '')
          }}
        >
          {block ?? `🌳 ${stage}단계 수비 시작!`}
        </button>
      ) : (
        <p className="boss-hint">방장({host})이 시작하기를 기다려요…</p>
      )}
      {err && <p className="boss-hint bad">{err}</p>}
      <button type="button" className="def-leave" onClick={leaveDefense}>
        🏠 마을로 돌아가기
      </button>
    </div>
  )
}

function TopBar() {
  const snap = useDef((s) => s.snap)!
  const rcvAt = useDef((s) => s.rcvAt)
  const now = useNow(250)
  const me = defMe()
  const [giftTo, setGiftTo] = useState<string | null>(null)
  void now
  const left = snap.left > 0 ? Math.max(0, Math.ceil((snap.left - (performance.now() - rcvAt)) / 1000)) : 0
  const mine = snap.gold[me] ?? 0
  return (
    <div className="def-top">
      <div className="def-row">
        <span className="def-wave">
          🌊 {snap.wave}/{DEF_WAVES} {snap.st === 'prep' ? `· 준비 ${left}초` : snap.st === 'break' ? `· 다음 웨이브 ${left}초` : ''}
        </span>
        <span className="def-tree">
          🌳 <i style={{ width: `${(snap.tree / TREE_HP) * 100}%` }} />
          <b>
            {snap.tree}/{TREE_HP}
          </b>
        </span>
        <span className="def-gold">💰 {mine}</span>
      </div>
      <div className="def-row small">
        {snap.members.map((n) => (
          <button
            key={n}
            type="button"
            className={`def-chip${n === me ? ' me' : ''}`}
            style={{ borderColor: colorOf(snap.members, n) }}
            onClick={() => n !== me && setGiftTo(giftTo === n ? null : n)}
          >
            {n} 💰{snap.gold[n] ?? 0} · 👾{snap.kills[n] ?? 0}
          </button>
        ))}
        {snap.next.length > 0 && (
          <span className="def-next" title={snap.next.map((k) => `${MONSTERS[k].name}: ${MONSTERS[k].hint}`).join('\n')}>
            다음: {snap.next.map((k) => MONSTERS[k].emoji).join('')}
          </span>
        )}
      </div>
      {giftTo && (
        <div className="def-gift">
          💝 {giftTo}님에게 보내기
          {[10, 20, 50].map((a) => (
            <button
              key={a}
              type="button"
              disabled={mine < a}
              onClick={() => {
                sendGift(giftTo, a)
                setGiftTo(null)
              }}
            >
              {a}
            </button>
          ))}
          <button type="button" onClick={() => setGiftTo(null)}>
            ✕
          </button>
        </div>
      )}
      {snap.st !== 'wave' && snap.next.length > 0 && (
        <div className="def-hint">
          {snap.next.map((k) => (
            <span key={k}>
              {MONSTERS[k].emoji} {MONSTERS[k].name} — {MONSTERS[k].hint}
            </span>
          ))}
          {snap.box >= 0 && <span className="box">🎁 길 위의 보급 상자를 먼저 누르고 문제를 맞히면 💰{BOX_GOLD}!</span>}
        </div>
      )}
    </div>
  )
}

function SelPanel() {
  const sel = useDef((s) => s.sel)
  const snap = useDef((s) => s.snap)!
  const myQ = useDef((s) => s.myQ)
  const me = defMe()
  const job = myDefJob()
  const [pickBr, setPickBr] = useState(false)
  useEffect(() => setPickBr(false), [sel])
  if (!sel || myQ) return null
  const gold = snap.gold[me] ?? 0
  const close = () => useDef.setState({ sel: null })
  if (sel.t === 'spot') {
    const busy = snap.busy.some((b) => b[0] === sel.i)
    return (
      <div className="def-sel">
        <div className="def-sel-head">
          🏗️ 어떤 탑을 지을까요? <small>지을 때 문제 7초 · 틀리면 돈을 잃어요</small>
          <button type="button" onClick={close}>
            ✕
          </button>
        </div>
        {busy ? (
          <p className="def-sel-note">친구가 공사 중이에요</p>
        ) : (
          <div className="def-build">
            {TOWER_KINDS.map((k) => {
              const t = TOWERS[k]
              const c = buildCost(k, job)
              const spec = job === k
              return (
                <button key={k} type="button" className={spec ? 'spec' : ''} disabled={gold < c} onClick={() => requestBuild(sel.i, k)}>
                  <span className="ico">{t.emoji}</span>
                  <b>{t.name}</b>
                  <small>{t.role.split(' — ')[0]}</small>
                  <i>
                    💰{c}
                    {spec ? ' 🎖️전문가' : ''}
                  </i>
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }
  const row = snap.towers.find((t) => t[0] === sel.id)
  if (!row) return null
  const [id, , kind, tier, br, owner, hp, spec] = row
  const t = TOWERS[kind]
  const mineT = owner === me
  const cost = evolveCost(kind, tier, mineT ? job : null)
  return (
    <div className="def-sel">
      <div className="def-sel-head">
        {t.emoji} {br ? t.branches[br - 1] : t.name} <b>{tier}단계</b> <small style={{ color: colorOf(snap.members, owner) }}>· {owner}의 탑</small>
        <button type="button" onClick={close}>
          ✕
        </button>
      </div>
      <p className="def-sel-note">
        {t.role} · 체력 {hp}%{spec ? ` · 🎖️ 전문가 (3단계부터 ${t.spec})` : ''}
      </p>
      {mineT ? (
        tier >= MAX_TOWER_TIER ? (
          <p className="def-sel-note">🏆 최고 단계 (각성)!</p>
        ) : tier === 2 ? (
          pickBr ? (
            <div className="def-branch">
              {t.branches.map((b, i) => (
                <button key={b} type="button" disabled={cost == null || gold < cost} onClick={() => requestEvolve(id, i + 1)}>
                  <b>{b}</b>
                  <small>{t.branchDesc[i]}</small>
                </button>
              ))}
            </div>
          ) : (
            <button type="button" className="def-evo" disabled={cost == null || gold < cost} onClick={() => setPickBr(true)}>
              ⬆️ 3단계 진화 (갈림길 고르기) · 💰{cost}
            </button>
          )
        ) : (
          <button type="button" className="def-evo" disabled={cost == null || gold < cost} onClick={() => requestEvolve(id)}>
            ⬆️ {tier + 1}단계로 진화 · 💰{cost}
            {tier + 1 === MAX_TOWER_TIER ? ' (각성!)' : ''}
          </button>
        )
      ) : (
        <div className="def-sel-note">
          주인만 진화시킬 수 있어요.{' '}
          <button type="button" className="def-mini" disabled={gold < 20} onClick={() => sendGift(owner, 20)}>
            💝 {owner}님에게 20 보내기
          </button>
        </div>
      )}
      {spec && tier >= 3 ? <p className="def-sel-note small">🎖️ 전문가 강화 중: 핵심 능력 ×{SPEC_BOOST}</p> : null}
    </div>
  )
}

function QuizBox() {
  const q = useDef((s) => s.myQ)
  const res = useDef((s) => s.qres)
  const now = useNow(100)
  void now
  if (!q) return null
  const ms = q.q.ms ?? 7000
  const left = res ? 0 : Math.max(0, ms - (performance.now() - q.at))
  const title = q.why === 'build' ? '🏗️ 탑 짓기 문제' : q.why === 'box' ? '🎁 보급 상자 문제' : '🚨 긴급 퀴즈 — 모두 맞혀야 해요!'
  const [head, ...rest] = q.q.t.split('\n')
  return (
    <div className="def-quiz">
      <div className="def-quiz-card">
        <div className="def-quiz-top">
          <span>{title}</span>
          {q.q.cat && <span className="boss-cat">{q.q.cat}</span>}
        </div>
        <div className="def-timer">
          <i style={{ width: `${(left / ms) * 100}%` }} />
        </div>
        {q.q.sub && q.q.sub !== q.q.cat && <small className="def-sub">{q.q.sub}</small>}
        <b className="def-q">{head}</b>
        {rest.length > 0 && <span className="def-q2">{rest.join(' ')}</span>}
        {q.q.say && (
          <button type="button" className="def-say" onClick={() => speak(q.q.say!)}>
            🔊 {canSpeak() ? '다시 듣기' : '소리가 안 나는 기기예요'}
          </button>
        )}
        <div className="def-opts">
          {q.q.o.map((o, i) => {
            let cls = q.picked === i ? 'picked' : ''
            if (res) cls = o === res.a ? 'right' : q.picked === i ? 'wrong' : 'dim'
            return (
              <button key={i} type="button" className={cls} disabled={q.picked >= 0 || !!res} onClick={() => answerDef(i)}>
                {o}
              </button>
            )
          })}
        </div>
        {res ? (
          <p className={`def-res ${res.ok ? 'ok' : 'bad'}`}>{res.ok ? '✅ ' : '❌ '}{res.note}</p>
        ) : (
          q.why !== 'emq' && (
            <button type="button" className="def-giveup" disabled={q.picked >= 0} onClick={giveUpDef}>
              {q.why === 'build' ? '포기하기 (돈을 잃어요)' : '포기하기'}
            </button>
          )
        )}
      </div>
    </div>
  )
}

function Result() {
  const r = useDef((s) => s.result)!
  const snap = useDef((s) => s.snap)
  return (
    <div className="def-result">
      <h3>{r.won ? '🎉 도토리 나무를 지켜 냈어요!' : '😢 도토리 나무가 쓰러졌어요'}</h3>
      {r.won && <div className="def-stars">{stars(r.stars)}</div>}
      <p>
        {r.stage}단계 · {r.note}
      </p>
      {snap && (
        <ul className="def-kills">
          {[...snap.members]
            .sort((a, b) => (snap.kills[b] ?? 0) - (snap.kills[a] ?? 0))
            .map((n, i) => (
              <li key={n} style={{ borderColor: colorOf(snap.members, n) }}>
                {i === 0 ? '🏅 ' : ''}
                {n} · 몬스터 {snap.kills[n] ?? 0}마리
              </li>
            ))}
        </ul>
      )}
      {r.won && r.stars < 3 && <p className="def-sel-note">나무 체력 {Math.ceil(TREE_HP * 0.9)} 이상으로 지키면 ★★★! (이번 {snap?.tree ?? 0})</p>}
      <button type="button" className="boss-go" onClick={() => useDef.setState({ result: null })}>
        대기실로
      </button>
    </div>
  )
}

export const jobTowerName = (jb: string | null) => (jb && isFamily(jb) ? `${JOB_MAP[jb].emoji} ${TOWERS[jb].name}` : '')

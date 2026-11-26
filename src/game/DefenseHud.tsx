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
  mapOf,
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
  evolveBlock,
  BEASTS,
  JOB_TIER,
  TIER_TITLE,
} from './defData'
import {
  active,
  answerDef,
  canSpeak,
  chooseDefStage,
  giveUpDef,
  maxStageFor,
  myDefJob,
  myDefWt,
  requestBuild,
  requestEvolve,
  speak,
  startBlock,
  startDefense,
  useDef,
  defMe,
} from './defState'
import { enterDefense, leaveDefense, useDefUi } from './defense'
import { colorOf } from './DefenseArena'
import { KIND_COLOR } from './defModels'
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

const GUIDE_KEY = 'dotori.defGuide.v1'
const seenGuide = () => {
  try {
    return localStorage.getItem(GUIDE_KEY) === '1'
  } catch {
    return false
  }
}

export function DefensePicker() {
  const open = useDefUi((s) => s.picker)
  const items = useVillage((s) => s.items)
  const [tab, setTab] = useState<'guide' | 'rooms'>(() => (seenGuide() ? 'rooms' : 'guide'))
  useEffect(() => {
    if (open) setTab(seenGuide() ? 'rooms' : 'guide')
  }, [open])
  if (!open) return null
  const d = defOf(items)
  const close = () => useDefUi.setState({ picker: false })
  const toRooms = () => {
    try {
      localStorage.setItem(GUIDE_KEY, '1')
    } catch {
      /* noop */
    }
    setTab('rooms')
  }
  return (
    <div className="farm-overlay" onPointerDown={(e) => e.target === e.currentTarget && close()}>
      <div className="farm-card def-picker">
        <button type="button" className="farm-x" onClick={close} aria-label="닫기">
          ✕
        </button>
        <h3>🌳 도토리 나무 수비대</h3>
        <div className="def-tabs">
          <button type="button" className={tab === 'guide' ? 'on' : ''} onClick={() => setTab('guide')}>
            📖 어떻게 해요?
          </button>
          <button type="button" className={tab === 'rooms' ? 'on' : ''} onClick={toRooms}>
            🚪 방 고르기
          </button>
        </div>
        {tab === 'guide' ? (
          <DefenseGuide onDone={toRooms} />
        ) : (
          <>
            <p className="farm-note">
              친구 {DEF_MIN}~{DEF_MAX}명이 <b>같은 번호의 방</b>에 모여요. 먼저 들어온 친구가 방장(👑)이 되어 시작을 눌러요.
              <br />
              오늘 남은 입장 <b>{defLeftOf(d)}/{DEF_DAILY}</b>
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
          </>
        )}
      </div>
    </div>
  )
}

/* ---------- 처음 하는 친구를 위한 안내 ---------- */
const MON_TIPS: [MonKindT, string][] = [
  ['bat', '🏹 궁수탑 · 🪄 마법탑만 맞힐 수 있어요'],
  ['turtle', '🪓 투석기가 잘 뚫어요'],
  ['fox', '🔱 창 함정으로 붙잡아요'],
  ['goblin', '🗡️ 검사 초소로 막고 🔨 대장간으로 고쳐요'],
  ['bomb', '🗡️ 검사 초소가 대신 맞아 줘요'],
  ['blob', '🪄 마법탑으로 한꺼번에 쓸어요'],
  ['golem', '🪄 마법탑만 제대로 먹혀요 (다른 탑은 거의 안 들어요)'],
  ['shaman', '주변 몬스터를 치료해요 — 🏹 궁수탑이 먼저 노려요'],
  ['drake', '하늘 + 단단한 비늘 — 🏹 궁수탑이 비늘을 뚫어요'],
  ['ghost', '🗡️ 검사·🔱 창·🔨 대장간처럼 가까이 베는 탑만 잘 먹혀요'],
  ['knight', '주변 몬스터 피해 -40% — 🔨 대장간이 먼저 노리고 방패를 깨요'],
  ['king', '탑을 무시하고 곧장 나무로! 놓치면 생명이 크게 깎여요 — 긴급 퀴즈를 다 맞히면 기절해요'],
]
type MonKindT = keyof typeof MONSTERS

function DefenseGuide({ onDone }: { onDone: () => void }) {
  const job = useVillage((s) => s.job)
  const mine = job && isFamily(job.f) ? job.f : null
  return (
    <div className="def-guide">
      <section>
        <h4>🎯 무엇을 하나요?</h4>
        <p>
          몬스터들이 길을 따라 <b>도토리 나무</b>로 몰려와요. 친구들과 길옆에 <b>탑</b>을 지어서 나무를 지켜요! 몬스터가 나무에 닿으면 나무 체력이 줄어요. 웨이브 {DEF_WAVES}번을 버티면 승리예요.
        </p>
      </section>

      <section>
        <h4>🏗️ 이렇게 해요</h4>
        <ol>
          <li>
            빈 터 <b>(＋ 표시)</b>를 눌러요.
          </li>
          <li>지을 탑을 골라요.</li>
          <li>
            <b>문제가 나와요 (7초)</b> — 맞히면 탑이 지어져요. <span className="warn">틀리거나 시간이 지나면 낸 돈을 잃어요!</span> 친구에게 묻지 말고 스스로 풀어요.
          </li>
          <li>
            몬스터를 잡으면 💰 돈이 생겨요. <b>내 탑을 눌러 진화</b>시켜요 (1~6단계). 3단계에서는 두 갈래 중 하나를 골라요. <b>4단계부터는 내 직업 탑만</b> 키울 수 있고 수호 신수가 나타나요 (5단계 각성은 직업 무기 영웅↑, 6단계 전설은 전설↑).
          </li>
        </ol>
        <p className="tip">⭐ 5초 안에 맞히면 "완벽 시공" — 그 탑이 더 세져요!</p>
      </section>

      <section>
        <h4>💰 돈은 어떻게 나눠요?</h4>
        <p>
          몬스터를 잡은 <b>탑 주인이 70%</b>, 나머지 <b>30%는 팀 모두</b>가 나눠 가져요. 위쪽의 친구 이름을 누르면 내 돈을 친구에게 보낼 수 있어요. 💝
        </p>
      </section>

      <section className="def-guide-job">
        <h4>🎖️ 내 직업 = 내 전문 탑</h4>
        {mine ? (
          <p className="me">
            나는 <b>{JOB_MAP[mine].emoji} {JOB_MAP[mine].label}</b> → <b>{TOWERS[mine].emoji} {TOWERS[mine].name}</b> 전문가예요!
          </p>
        ) : (
          <p className="me">
            나는 아직 <b>견습 검사</b>예요. 무기고에서 <b>1차 전직</b>을 하면 내 전문 탑이 생겨요!
          </p>
        )}
        <p>
          누구나 모든 탑을 지을 수 있어요. 그런데 <b>내 직업의 탑</b>은 특별해요:
        </p>
        <ul>
          <li>💸 짓기·진화가 <b>30% 싸요</b></li>
          <li>⬆️ 처음부터 <b>2단계</b>로 지어져요</li>
          <li>💪 3단계부터 그 탑의 <b>특기가 30% 더 강해져요</b></li>
        </ul>
        <div className="def-guide-jobs">
          {(Object.keys(TOWERS) as TowerKindT[]).map((k) => (
            <div key={k} className={mine === k ? 'mine' : ''}>
              <span>
                {JOB_MAP[k].emoji} {JOB_MAP[k].label}
              </span>
              <b>
                {TOWERS[k].emoji} {TOWERS[k].name}
              </b>
              <small>{TOWERS[k].role}</small>
            </div>
          ))}
        </div>
        <p className="tip">팀에 여러 직업이 섞여 있을수록 강해요. 친구들과 누가 어떤 탑을 지을지 정해 봐요!</p>
      </section>

      <section>
        <h4>👾 몬스터마다 필요한 탑이 달라요</h4>
        <p>웨이브 사이에 위쪽 "다음:"에 다음 몬스터가 보여요. 미리 맞는 탑을 지어요!</p>
        <ul className="def-guide-mons">
          {MON_TIPS.map(([k, tip]) => (
            <li key={k}>
              <b>
                {MONSTERS[k].emoji} {MONSTERS[k].name}
              </b>{' '}
              {tip}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h4>⭐ 별과 보상</h4>
        <p>
          단계는 7단계까지 있고 맵이 모두 달라요: 1단계 한 갈래 길 → 2단계 <b>갈림길</b> → 3단계 <b>양쪽 두 굴</b> → 4단계 <b>짧은 두 길</b> → 5단계 <b>세 굴</b> → 6단계 <b>유령 골짜기</b> → 7단계 <b>네 굴이 나무를 둘러싼 요새</b>! 단계가 오를수록 새 몬스터가 나오고 어려워져요.
          <br />
          나무 체력이 많이 남을수록 별을 많이 받아요 (★1~3). <b>처음 받은 별</b>만큼 도토리를 받아요. 하루에 {DEF_DAILY}번 도전할 수 있어요. 🎁 쉬는 시간에 길에 보급 상자가 나오면 먼저 눌러 보세요!
        </p>
      </section>

      <button type="button" className="boss-go" onClick={onDone}>
        알겠어요! 방 고르러 가기 🚪
      </button>
    </div>
  )
}
type TowerKindT = keyof typeof TOWERS

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
      <p className="def-map-tip">🗺️ {stage}단계 맵: {mapOf(stage).tip}</p>
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
  void now
  const left = snap.left > 0 ? Math.max(0, Math.ceil((snap.left - (performance.now() - rcvAt)) / 1000)) : 0
  const mine = snap.gold[me] ?? 0
  return (
    <div className="def-top">
      <div className="def-row">
        <span className="def-wave">
          <b>🌊 웨이브 {snap.wave}/{DEF_WAVES}</b>
          <span className="pips">
            {Array.from({ length: DEF_WAVES }, (_, i) => (
              <i key={i} className={`${i < snap.wave ? 'on' : ''}${i === 4 || i === 9 ? ' boss' : ''}`} />
            ))}
          </span>
          {snap.st === 'prep' ? <em>준비 {left}초</em> : snap.st === 'break' ? <em>다음 웨이브 {left}초</em> : null}
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
          <span key={n} className={`def-chip${n === me ? ' me' : ''}`} style={{ borderColor: colorOf(snap.members, n) }}>
            {n} 💰{snap.gold[n] ?? 0} · 👾{snap.kills[n] ?? 0}
          </span>
        ))}
        {snap.next.length > 0 && (
          <span className="def-next" title={snap.next.map((k) => `${MONSTERS[k].name}: ${MONSTERS[k].hint}`).join('\n')}>
            다음: {snap.next.map((k) => MONSTERS[k].emoji).join('')}
          </span>
        )}
      </div>
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
  const wt = myDefWt()
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
                <button key={k} type="button" className={spec ? 'spec' : ''} style={{ borderTopColor: KIND_COLOR[k] }} disabled={gold < c} onClick={() => requestBuild(sel.i, k)}>
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
  const block = mineT && tier < MAX_TOWER_TIER ? evolveBlock(kind, tier, job, wt) : null
  const beast = tier >= JOB_TIER ? BEASTS[kind] : null
  const nextTitle = TIER_TITLE[tier + 1]
  return (
    <div className="def-sel">
      <div className="def-sel-head">
        {t.emoji} {br ? t.branches[br - 1] : t.name} <b>{tier}단계{TIER_TITLE[tier] ? ` · ${TIER_TITLE[tier]}` : ''}</b> <small style={{ color: colorOf(snap.members, owner) }}>· {owner}의 탑</small>
        <button type="button" onClick={close}>
          ✕
        </button>
      </div>
      <p className="def-sel-note">
        {t.role} · 체력 {hp}%{spec ? ` · 🎖️ 전문가 (3단계부터 ${t.spec})` : ''}
      </p>
      {beast ? (
        <p className="def-sel-note small">
          {beast.emoji} 수호 신수 <b>{beast.name}</b>
          {tier >= MAX_TOWER_TIER ? '가 탑 대신 제단에서 싸워요!' : '가 함께 지켜요'}
        </p>
      ) : null}
      {mineT ? (
        tier >= MAX_TOWER_TIER ? (
          <p className="def-sel-note">🏆 최고 단계 — 전설의 수호 신수!</p>
        ) : block ? (
          <p className="def-sel-note def-lock">{block}</p>
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
            {nextTitle ? ` (${nextTitle}!)` : tier + 1 === JOB_TIER && BEASTS[kind] ? ` (${BEASTS[kind].emoji} 신수 등장)` : ''}
          </button>
        )
      ) : (
        <div className="def-sel-note">주인만 진화시킬 수 있어요.</div>
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

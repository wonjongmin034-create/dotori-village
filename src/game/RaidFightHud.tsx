import { useEffect, useState } from 'react'
import { useVillage } from './store'
import { fightAnswer, fightMyCap, useFight } from './raidFight'
import { raidToLobby, useRaid } from './raidState'
import { RAID_HEAL, RAID_LIVES, RAID_LUCK_EVERY, RAID_PHASES, RAID_RETURN_LIVES } from './raidData'
import { ShapeFig } from './ShapeFig'
import '../boss5.css'
import './raid.css'

// 학급 레이드 전투 화면 — 위: 보스 체력·페이즈·친구들 상태, 아래: 내 문제 (보스전의 문제 창과 같은 모양)

const HAND_ICON = ['✌️', '✊', '✋']
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫']
const PHASE_NAMES = ['잠에서 깬 거인', '불꽃의 거인', '번개의 거인', '폭주하는 거인']

const useNow = (ms: number, on: boolean) => {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!on) return
    const t = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(t)
  }, [ms, on])
  return now
}

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.max(0, Math.floor(s % 60))).padStart(2, '0')}`

function Top() {
  const f = useFight()
  const me = useVillage((s) => s.session?.name ?? '')
  const now = useNow(500, true)
  const cap = fightMyCap()
  const pct = f.max > 0 ? Math.max(0, Math.min(100, (f.hp / f.max) * 100)) : 0
  const left = Math.max(0, Math.round((f.endsAt - now) / 1000))
  return (
    <div className="boss-top raid-ftop">
      <div className="boss-name">
        🐲 {PHASE_NAMES[Math.min(RAID_PHASES, f.ph) - 1]}
        <small>
          {f.ph}/{RAID_PHASES} 페이즈
        </small>
        <span className="raid-time">⏱ {mmss(left)}</span>
      </div>
      <div className="boss-hp">
        <div className={`boss-hp-fill raid-p${f.ph}`} style={{ width: `${pct}%` }} />
        <span>
          {Math.max(0, f.hp)} / {f.max}
        </span>
      </div>
      <div className="raid-pips">
        {Array.from({ length: RAID_PHASES }, (_, i) => (
          <i key={i} className={i + 1 < f.ph || (i + 1 === f.ph && f.st === 'won') ? 'done' : i + 1 === f.ph ? 'now' : ''} />
        ))}
      </div>
      <div className="raid-team">
        {f.order.map((n) => {
          const m = f.members[n]
          const l = m?.l ?? 0
          const full = (m?.d ?? 0) >= cap
          return (
            <span key={n} className={`raid-mem${n === me ? ' me' : ''}${l <= 0 ? ' dead' : ''}`}>
              {n}
              <b>{l <= 0 ? '💤' : '❤'.repeat(l)}</b>
              {full && l > 0 ? '⭐' : ''}
            </span>
          )
        })}
      </div>
    </div>
  )
}

function Question() {
  const f = useFight()
  const now = useNow(100, !!f.q && !f.res)
  const key = `${f.gid}:${f.ph}:${f.qn}`
  const [sel, setSel] = useState<{ key: string; v: (number | string)[]; pick: number }>({ key: '', v: [], pick: -1 })
  const cur = sel.key === key ? sel.v : []
  const picked = sel.key === key ? sel.pick : -1
  const setCur = (v: (number | string)[]) => setSel({ key, v, pick: picked })
  const q = f.q
  if (!q) return null
  const k = q.k ?? 'mc'
  const res = f.res
  const locked = !!res
  const left = res ? 0 : Math.max(0, f.qMs - (now - f.qAt))
  const frac = res ? 0 : left / f.qMs
  const cap = fightMyCap()

  const pick = (i: number) => {
    if (locked) return
    setSel({ key, v: cur, pick: i })
    fightAnswer(i)
  }
  const tileTap = (i: number) => {
    if (locked || cur.includes(i)) return
    const next = [...cur, i]
    setCur(next)
    if (q.len && next.length >= q.len) fightAnswer(next.map((x) => q.o[x as number]).join(''))
  }
  const orderTap = (i: number) => {
    if (locked) return
    if (cur.includes(i)) {
      setCur(cur.slice(0, cur.indexOf(i)))
      return
    }
    const next = [...cur, i]
    setCur(next)
    if (next.length >= q.o.length) fightAnswer(next as number[])
  }
  const keyTap = (c: string) => {
    if (locked) return
    if (c === '⌫') setCur(cur.slice(0, -1))
    else if (c === '.' ? cur.length > 0 && !cur.includes('.') && cur.length < 7 : cur.length < 7) setCur([...cur, c])
  }

  return (
    <div className="boss-sheet mine">
      <div className="boss-turn">
        {res ? (
          res.draw ? (
            <b>🤝 비겼어요! 다음 문제로</b>
          ) : res.ok ? (
            <b className="ok">
              ✅ {f.luck ? '이겼다!' : '정답!'} {res.dmg > 0 ? `보스에게 −${res.dmg}` : '(이번 페이즈 한계라 피해는 더 못 줘요)'}
            </b>
          ) : (
            <b className="bad">
              {res.timeout ? '⏰ 시간 초과!' : '❌ 아쉬워요!'} {f.luck ? '운이 안 따랐어요 (목숨은 그대로!)' : '목숨 −1 💔'}
            </b>
          )
        ) : (
          <b>🫵 풀어 보세요!</b>
        )}
        <small>
          {q.cat && <span className="boss-cat">{q.cat}</span>}
          {f.qn}번째 · 내 공격 {f.myD}/{cap} · ❤️ {f.myL}
        </small>
      </div>

      {!res && (
        <div className="boss-timer">
          <div className={frac < 0.3 ? 'low' : ''} style={{ width: `${frac * 100}%` }} />
          <span>{Math.ceil(left / 1000)}초</span>
        </div>
      )}

      {q.sub && <div className="boss-sub">{q.sub}</div>}
      {q.fig && <ShapeFig fig={q.fig} />}
      <div className={`boss-q${q.t.length > 26 || q.fig ? ' long' : ''}`}>{q.t}</div>

      {k === 'mc' && (
        <div className="boss-opts">
          {q.o.map((o, i) => {
            let cls = ''
            if (res) {
              if (o === res.text) cls = 'right'
              else if (!res.ok && o === res.pick) cls = 'wrong'
            } else if (picked === i) cls = 'picked'
            return (
              <button key={i} type="button" className={cls} disabled={locked} onClick={() => pick(i)}>
                {o}
              </button>
            )
          })}
        </div>
      )}

      {(k === 'rps' || k === 'oe') && (
        <div className={`boss-hands ${k}`}>
          {q.o.map((o, i) => (
            <button key={i} type="button" className={picked === i ? 'picked' : ''} disabled={locked} onClick={() => pick(i)}>
              <span>{k === 'rps' ? HAND_ICON[i] : i === 0 ? '1️⃣' : '2️⃣'}</span>
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

      {k === 'num' && (
        <>
          <div className="boss-numshow">{cur.length ? cur.join('') : '?'}</div>
          <div className="boss-pad">
            {KEYS.map((c) => (
              <button key={c} type="button" disabled={locked} onClick={() => keyTap(c)}>
                {c}
              </button>
            ))}
            <button type="button" className="go" disabled={locked || cur.length === 0} onClick={() => fightAnswer(cur.join(''))}>
              확인
            </button>
          </div>
        </>
      )}

      {res && k !== 'mc' && (
        <div className="boss-reveal">
          {k === 'rps' || k === 'oe' ? (
            <>
              {res.pick ? `내 선택: ${res.pick} · ` : ''}
              {res.text}
            </>
          ) : (
            <>
              정답: <b>{res.text}</b>
              {!res.ok && res.pick ? <small> (내 답: {res.pick})</small> : null}
            </>
          )}
        </div>
      )}
    </div>
  )
}

function Message({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="boss-sheet intro">
      <b>{title}</b>
      {lines.map((l, i) => (
        <small key={i}>{l}</small>
      ))}
    </div>
  )
}

function Result() {
  const f = useFight()
  const status = useRaid((s) => s.status)
  const noServer = useRaid((s) => s.noServer)
  const won = f.st === 'won'
  const left = status ? status.left : 0
  return (
    <div className="boss-out raid-result">
      <h3>{won ? '🎉 거인을 쓰러뜨렸어요!' : '💥 이번 도전은 여기까지…'}</h3>
      <p>
        {won
          ? '반 친구들이 힘을 합쳐 해냈어요! 모두 정말 멋졌어요 👏'
          : f.why ?? '다음에는 더 힘을 합쳐 봐요!'}
      </p>
      {!won && <p className="raid-hint2">{noServer ? '다시 도전할 수 있어요' : left > 0 ? `오늘 남은 도전 ${left}번` : '오늘 도전 기회를 모두 썼어요'}</p>}
      <button type="button" className="raid-go" onClick={raidToLobby}>
        대기실로 돌아가기
      </button>
    </div>
  )
}

export function RaidFightHud() {
  const f = useFight()
  const cap = fightMyCap()
  if (f.st === 'idle') return null
  const dead = f.myL <= 0
  const capped = f.myD >= cap
  return (
    <>
      <Top />
      {f.st === 'intro' && (
        <Message
          title="🐲 거인이 눈을 떠요!"
          lines={[
            `목숨 ${RAID_LIVES}개 · 틀리면 목숨이 줄고 0이 되면 쓰러져요 (다음 페이즈에 돌아와요)`,
            `한 페이즈에서 내가 줄 수 있는 피해는 최대 ${cap} · 문제 ${RAID_LUCK_EVERY}개마다 가위바위보·홀짝이 나와요`,
          ]}
        />
      )}
      {f.st === 'between' && (
        <Message
          title={`✨ ${f.ph}페이즈 클리어!`}
          lines={[`거인의 모습이 바뀌어요… 살아 있는 친구는 목숨 +${RAID_HEAL}, 쓰러진 친구는 목숨 ${RAID_RETURN_LIVES}개로 돌아와요`, '곧 다음 페이즈가 시작돼요']}
        />
      )}
      {f.st === 'play' && f.q && (!dead || !!f.res) && <Question />}
      {f.st === 'play' && !f.q && !dead && !capped && <Message title="다음 문제를 준비하고 있어요…" lines={[]} />}
      {f.st === 'play' && !dead && capped && !f.q && (
        <Message title="⭐ 이번 페이즈의 내 공격은 여기까지!" lines={[`내가 줄 수 있는 피해 ${cap}을 다 썼어요. 친구들이 마무리하도록 응원해요 📣`, '다음 페이즈가 되면 다시 공격할 수 있어요']} />
      )}
      {f.st === 'play' && dead && (
        <Message title="💤 쓰러졌어요" lines={[`이번 페이즈가 끝나면 목숨 ${RAID_RETURN_LIVES}개로 돌아와요`, '친구들을 응원해요 📣']} />
      )}
      {(f.st === 'won' || f.st === 'lost') && <Result />}
    </>
  )
}

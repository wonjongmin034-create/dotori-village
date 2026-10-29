import { useEffect, useState } from 'react'
import { useVillage } from './store'
import { RAID_COUNTDOWN_S, RAID_MIN, RAID_TRIES, raidVisible } from './raidData'
import { raidBlockReason, raidCancel, raidStart, useRaid } from './raidState'
import { enterRaid } from './raid'
import './raid.css'

// 입구 버튼 (아직은 시험 계정·시험 주소에만 보인다)
export function RaidEntryButton() {
  const session = useVillage((s) => s.session)
  if (!session || !raidVisible(session.name)) return null
  return (
    <button type="button" className="raid-btn" onClick={() => void enterRaid()}>
      🐲 레이드
    </button>
  )
}

// 레이드 대기실 화면 위의 안내창
export function RaidHud() {
  const me = useVillage((s) => s.session?.name ?? '')
  const roster = useRaid((s) => s.roster)
  const leader = useRaid((s) => s.leader)
  const phase = useRaid((s) => s.phase)
  const countEnd = useRaid((s) => s.countEnd)
  const status = useRaid((s) => s.status)
  const noServer = useRaid((s) => s.noServer)
  const banner = useRaid((s) => s.banner)
  const tries = useRaid((s) => s.tries)
  const members = useRaid((s) => s.members)
  const starting = useRaid((s) => s.starting)
  const [msg, setMsg] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (phase !== 'count') return
    const t = setInterval(() => setNow(Date.now()), 150)
    return () => clearInterval(t)
  }, [phase])
  useEffect(() => {
    if (!msg) return
    const t = setTimeout(() => setMsg(null), 3500)
    return () => clearTimeout(t)
  }, [msg])

  const isLeader = leader === me
  const left = status ? status.left : RAID_TRIES
  const tryNo = status ? Math.min(RAID_TRIES, status.tries + 1) : 1
  const why = raidBlockReason(roster, status, noServer)
  const secs = Math.max(0, Math.ceil((countEnd - now) / 1000))

  return (
    <>
      <div className="raid-top">
        <div className="raid-card">
          <div className="raid-title">
            🐲 학급 레이드{status?.practice ? ' (연습)' : ''}
            <span className="raid-try">
              {phase === 'fight' ? `${tries || tryNo}번째 도전` : `오늘 남은 도전 ${left}번`}
            </span>
          </div>
          <div className="raid-count">
            모인 사람 <b className={roster.length >= RAID_MIN ? 'ok' : ''}>{roster.length}명</b> <span>(최소 {RAID_MIN}명)</span>
          </div>
          <div className="raid-names">
            {roster.map((n) => (
              <span key={n} className={`raid-chip${n === me ? ' me' : ''}${n === leader ? ' lead' : ''}`}>
                {n === leader ? '👑 ' : ''}
                {n}
              </span>
            ))}
          </div>
        </div>
        {(banner || msg) && <div className="raid-banner">{banner ?? msg}</div>}
      </div>

      {phase === 'count' && (
        <div className="raid-big" aria-live="polite">
          <div className="raid-num">{secs}</div>
          <div className="raid-sub">잠시 뒤 다 같이 출발해요!</div>
        </div>
      )}

      <div className="raid-bottom">
        {phase === 'lobby' &&
          (isLeader ? (
            <>
              <button
                type="button"
                className="raid-go"
                disabled={!!why || starting}
                onClick={() => {
                  const r = raidStart()
                  if (r) setMsg(r)
                }}
              >
                🚀 출발! ({RAID_COUNTDOWN_S}초 뒤 다 같이)
              </button>
              <div className="raid-hint">{why ?? '당신이 대장이에요. 모두 모였으면 눌러 주세요!'}</div>
            </>
          ) : (
            <div className="raid-wait">
              👑 <b>{leader ?? '…'}</b> 대장이 출발을 누르면 {RAID_COUNTDOWN_S}초 뒤 다 같이 출발해요
              <div className="raid-hint">{why ?? '준비됐어요! 기다려 주세요'}</div>
            </div>
          ))}
        {phase === 'count' && isLeader && (
          <button type="button" className="raid-cancel" onClick={raidCancel}>
            ✋ 잠깐, 취소할래요
          </button>
        )}
        {phase === 'fight' && (
          <div className="raid-wait">
            ⚔️ 출발! 함께 가는 사람 {members.length}명
            <div className="raid-hint">거인과의 싸움은 곧 열려요 (지금은 대기실까지만 만들어졌어요)</div>
          </div>
        )}
      </div>
    </>
  )
}

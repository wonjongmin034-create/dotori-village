import { useEffect, useState } from 'react'
import { useVillage } from './store'
import { RAID_COUNTDOWN_S, RAID_MIN, RAID_TRIES } from './raidData'
import { raidBlockReason, raidCancel, raidStart, useRaid } from './raidState'
import { enterRaid } from './raid'
import { RaidFightHud } from './RaidFightHud'
import { peers } from './live'
import { raidTitleOf } from './raidData'
import './raid.css'

// 입구 버튼 — 로그인한 모든 학생에게 보인다. 열리는 시간(금요일 8~14시)이 아니면 눌렀을 때 안내가 나온다.
export function RaidEntryButton() {
  const session = useVillage((s) => s.session)
  if (!session) return null
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
  const why = raidBlockReason(roster, status, noServer)
  const secs = Math.max(0, Math.ceil((countEnd - now) / 1000))

  // 싸우는 동안에는 전투 화면을 보여 준다
  if (phase === 'fight') {
    return (
      <>
        <RaidFightHud />
        {banner && (
          <div className="raid-top" style={{ top: 150 }}>
            <div className="raid-banner">{banner}</div>
          </div>
        )}
      </>
    )
  }

  return (
    <>
      <div className="raid-top">
        <div className="raid-card">
          <div className="raid-title">
            🐲 학급 레이드{status?.practice ? ' (연습)' : ''}
            <span className="raid-try">
              오늘 남은 도전 {left}번
            </span>
          </div>
          {(status?.mvp || status?.lastMvp) && (
            <div className="raid-mvp">
              🏆 {status.mvp ? `이번 주 MVP: ${status.mvp}` : `지난 MVP: ${status.lastMvp}`}
            </div>
          )}
          <div className="raid-count">
            모인 사람 <b className={roster.length >= RAID_MIN ? 'ok' : ''}>{roster.length}명</b> <span>(최소 {RAID_MIN}명)</span>
          </div>
          <div className="raid-names">
            {roster.map((n) => (
              <span key={n} className={`raid-chip${n === me ? ' me' : ''}${n === leader ? ' lead' : ''}`}>
                {n === leader ? '🚩 ' : ''}
                {peers.get(n)?.avatar.rm ? '👑 ' : ''}
                {(() => {
                  const t = raidTitleOf(Math.round(Number(peers.get(n)?.avatar.rt) || 0))
                  return t ? (
                    <i className="raid-tt" style={{ background: t.color }}>
                      {t.text}
                    </i>
                  ) : null
                })()}
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
              🚩 <b>{leader ?? '…'}</b> 대장이 출발을 누르면 {RAID_COUNTDOWN_S}초 뒤 다 같이 출발해요
              <div className="raid-hint">{why ?? '준비됐어요! 기다려 주세요'}</div>
            </div>
          ))}
        {phase === 'count' && isLeader && (
          <button type="button" className="raid-cancel" onClick={raidCancel}>
            ✋ 잠깐, 취소할래요
          </button>
        )}
      </div>
    </>
  )
}

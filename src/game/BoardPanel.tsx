import { useState } from 'react'
import { TEACHER_PIN } from './config'
import { lunchFor, noSchoolReason, dateKey, dateLabel } from './lunch'
import { useVillage } from './store'
import { SheetViewer } from './SheetViewer'
import { pdfUrl } from './sheets'

// 앞으로 2주 안에서 급식 데이터가 있는 날들
function upcomingLunchDays(
  custom?: Record<string, string[]>,
): { label: string; menu: string[]; today: boolean }[] {
  const out: { label: string; menu: string[]; today: boolean }[] = []
  const todayKey = dateKey()
  for (let i = 0; i < 14; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const k = dateKey(d)
    const menu = lunchFor(k, custom)
    if (menu) out.push({ label: dateLabel(d), menu, today: k === todayKey })
  }
  return out
}

export function BoardPanel() {
  const item = useVillage((s) => s.items.find((i) => i.key === s.activeFarm))
  const homework = useVillage((s) => s.homework)
  const mission = useVillage((s) => s.mission)
  const session = useVillage((s) => s.session)
  const lunch = useVillage((s) => s.classLunch)
  const setHomework = useVillage((s) => s.setHomework)
  const close = useVillage((s) => s.closeFarm)
  const flash = useVillage((s) => s.flash)

  const [tab, setTab] = useState<'hw' | 'lunch' | 'mission'>('hw')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [viewFile, setViewFile] = useState(false)

  if (!item || item.type !== 'board') return null

  if (viewFile && lunch.file) {
    return (
      <SheetViewer
        title={lunch.file.title}
        url={pdfUrl(lunch.file.path)}
        initial={{}}
        readOnly
        onClose={() => setViewFile(false)}
      />
    )
  }

  const startEdit = () => {
    const pin = window.prompt('선생님 비밀번호 (4자리)')
    if (pin === null) return
    if (pin !== TEACHER_PIN) {
      flash('비밀번호가 달라요')
      return
    }
    setDraft(homework)
    setEditing(true)
  }

  const todayMenu = lunchFor(dateKey(), lunch.menu)
  const todayOff = noSchoolReason(dateKey(), lunch.menu)
  const days = upcomingLunchDays(lunch.menu)

  return (
    <div className="farm-overlay" onPointerDown={(e) => e.target === e.currentTarget && close()}>
      <div className="farm-card board-card">
        <button type="button" className="farm-x" onClick={close} aria-label="닫기">
          ✕
        </button>
        <h3>📌 우리 반 게시판</h3>

        <div className="board-tabs">
          <button type="button" className={tab === 'hw' ? 'on' : ''} onClick={() => setTab('hw')}>
            📋 숙제
          </button>
          <button
            type="button"
            className={tab === 'lunch' ? 'on' : ''}
            onClick={() => setTab('lunch')}
          >
            🍚 급식
          </button>
          {mission && (
            <button
              type="button"
              className={tab === 'mission' ? 'on' : ''}
              onClick={() => setTab('mission')}
            >
              🤝 미션
            </button>
          )}
        </div>

        {tab === 'mission' && mission && (
          <div className="mission-view">
            <p className="mission-text">{mission.text}</p>
            <p className="mission-count">
              전원 완료하면 <b>모두 +{mission.reward} 도토리</b>
            </p>
            <p className="mission-done-line">
              완료한 친구 <b>{mission.done.length}명</b>
              {session && mission.done.includes(session.name) && ' · 나는 완료 ✓'}
            </p>
            <p className="hw-empty">다 같이 채워봐요! 못 한 친구를 도와주면 더 좋아요.</p>
          </div>
        )}

        {tab === 'hw' &&
          (editing ? (
            <div className="hw-edit">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={7}
                placeholder={'예)\n수학 익힘책 42~43쪽\n국어 독서록 1편\n준비물: 색연필'}
                autoFocus
              />
              <div className="hw-edit-btns">
                <button type="button" onClick={() => setEditing(false)}>
                  취소
                </button>
                <button
                  type="button"
                  className="primary"
                  onClick={() => {
                    setHomework(draft.trim())
                    setEditing(false)
                  }}
                >
                  저장
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="hw-view">
                {homework ? homework : <span className="hw-empty">아직 등록된 숙제가 없어요.</span>}
              </div>
              <button type="button" className="hw-editbtn" onClick={startEdit}>
                ✏️ 선생님: 숙제 쓰기
              </button>
            </>
          ))}

        {tab === 'lunch' && (
          <div className="lunch-wrap">
            <div className="lunch-today">
              <span className="lunch-daylabel">오늘 · {dateLabel(new Date())}</span>
              {todayMenu ? (
                <ul>
                  {todayMenu.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              ) : todayOff ? (
                <p className="hw-empty">오늘은 {todayOff}예요. 급식이 없어요.</p>
              ) : (
                <p className="hw-empty">오늘 급식 정보가 없어요.</p>
              )}
            </div>

            {days.filter((d) => !d.today).length > 0 && (
              <>
                <div className="lunch-sep">다가오는 급식</div>
                <ul className="lunch-list">
                  {days
                    .filter((d) => !d.today)
                    .map((d, i) => (
                      <li key={i}>
                        <span className="lunch-daylabel">{d.label}</span>
                        <span>{d.menu.join(' · ')}</span>
                      </li>
                    ))}
                </ul>
              </>
            )}

            {lunch.file && (
              <button type="button" className="lunch-filebtn" onClick={() => setViewFile(true)}>
                📄 {lunch.file.title} 크게 보기
              </button>
            )}

            {!lunch.file && days.length === 0 && !todayMenu && (
              <p className="hw-empty">아직 급식표가 등록되지 않았어요.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

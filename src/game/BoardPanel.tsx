import { useState } from 'react'
import { TEACHER_PIN } from './config'
import { LUNCH, lunchFor, dateKey, dateLabel } from './lunch'
import { useVillage } from './store'

// 앞으로 2주 안에서 급식 데이터가 있는 날들
function upcomingLunchDays(): { label: string; menu: string[]; today: boolean }[] {
  const out: { label: string; menu: string[]; today: boolean }[] = []
  const todayKey = dateKey()
  for (let i = 0; i < 14; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const k = dateKey(d)
    const menu = LUNCH[k]
    if (menu) out.push({ label: dateLabel(d), menu, today: k === todayKey })
  }
  return out
}

export function BoardPanel() {
  const item = useVillage((s) => s.items.find((i) => i.key === s.activeFarm))
  const homework = useVillage((s) => s.homework)
  const setHomework = useVillage((s) => s.setHomework)
  const close = useVillage((s) => s.closeFarm)
  const flash = useVillage((s) => s.flash)

  const [tab, setTab] = useState<'hw' | 'lunch'>('hw')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  if (!item || item.type !== 'board') return null

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

  const todayMenu = lunchFor(dateKey())
  const days = upcomingLunchDays()

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
        </div>

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

            {Object.keys(LUNCH).length === 0 && (
              <p className="hw-empty">아직 급식표가 등록되지 않았어요.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

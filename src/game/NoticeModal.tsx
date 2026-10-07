import { useVillage } from './store'

// 확인을 눌러야 닫히는 안내창 (예: 마을이 꽉 찼어요)
export function NoticeModal() {
  const notice = useVillage((s) => s.notice)
  const setNotice = useVillage((s) => s.setNotice)
  if (!notice) return null
  return (
    <div className="farm-overlay">
      <div className="farm-card notice-card">
        <div className="notice-ico">🏝️</div>
        <p className="notice-text">{notice}</p>
        <button type="button" className="primary wide" onClick={() => setNotice(null)}>
          확인
        </button>
      </div>
    </div>
  )
}

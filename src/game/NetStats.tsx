import { statsOn, useNet } from './live'

// 선생님용: 주소 끝에 ?stats 를 붙이면 광장 위쪽에 서버 메시지 사용량이 작게 보인다 (끄려면 ?stats=0).
export function NetStats() {
  const { n, sent, recv, est } = useNet()
  if (!statsOn() || n === 0) return null
  const hot = est > 80
  const warm = est > 55
  return (
    <div
      title={`서버 메시지 약 ${est}/초 (무료 한도 100) · 이 방 ${n}명 · 보냄 ${sent}/받음 ${recv}`}
      style={{
        position: 'fixed',
        top: 8,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 6,
        pointerEvents: 'none',
        font: '600 11px system-ui, sans-serif',
        whiteSpace: 'nowrap',
        padding: '4px 10px',
        borderRadius: 999,
        color: '#fff',
        background: hot ? '#d64545' : warm ? '#d98a1c' : 'rgba(40,60,40,.78)',
      }}
    >
      📡 {est}/100 · {n}명
    </div>
  )
}

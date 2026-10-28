import { useState } from 'react'
import { GFX_LABEL, setGfxPref, useGfx, type GfxPref } from './gfx'
import './gfx.css'

const OPTIONS: { id: GfxPref; label: string; desc: string }[] = [
  { id: 'auto', label: '자동', desc: '기기에 맞춰 알아서 골라요. 느려지면 스스로 낮춰요.' },
  { id: 'high', label: '높음', desc: '그림자·윤곽선·반짝이는 바다까지 가장 예뻐요. 컴퓨터에 알맞아요.' },
  { id: 'medium', label: '보통', desc: '풀·나무·구름은 그대로, 그림자와 윤곽선만 빼요. 태블릿에 알맞아요.' },
  { id: 'low', label: '낮음', desc: '장식을 줄여서 가장 가벼워요. 화면이 끊기면 골라 보세요.' },
]

export function GfxButton() {
  const [open, setOpen] = useState(false)
  const pref = useGfx((s) => s.pref)
  const level = useGfx((s) => s.level)
  return (
    <>
      <button type="button" className="gfx-btn" title="화면 품질" onClick={() => setOpen(true)} onPointerDown={(e) => e.stopPropagation()}>
        ⚙️
      </button>
      {open && (
        <div className="gfx-back" onPointerDown={(e) => e.stopPropagation()} onClick={() => setOpen(false)}>
          <div className="gfx-card" onClick={(e) => e.stopPropagation()}>
            <h3>화면 품질</h3>
            <p className="gfx-now">
              지금은 <b>{GFX_LABEL[level]}</b>으로 보고 있어요{pref === 'auto' ? ' (자동)' : ''}
            </p>
            <div className="gfx-list">
              {OPTIONS.map((o) => (
                <button key={o.id} type="button" className={`gfx-opt${pref === o.id ? ' on' : ''}`} onClick={() => setGfxPref(o.id)}>
                  <b>{o.label}</b>
                  <span>{o.desc}</span>
                </button>
              ))}
            </div>
            <button type="button" className="gfx-close" onClick={() => setOpen(false)}>
              닫기
            </button>
          </div>
        </div>
      )}
    </>
  )
}

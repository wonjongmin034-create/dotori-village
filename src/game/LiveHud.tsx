import { useState } from 'react'
import { EMOTES, sendEmote, useLive } from './live'
import { useVillage } from './store'

// 같이 걷기 화면 표시: 누가 같이 있는지 + 이모티콘 버튼(누르면 펼쳐짐)
export function LiveHud() {
  const names = useLive((s) => s.names)
  const mode = useVillage((s) => s.mode)
  const [open, setOpen] = useState(false)
  if (names.length === 0 || mode === 'edit') return null

  const shown = names.slice(0, 3).join(', ')
  return (
    <>
      <div className="live-chip">
        👥 {names.length}명 같이 있어요 · {shown}
        {names.length > 3 ? ` 외 ${names.length - 3}명` : ''}
      </div>
      <div className="emote-bar">
        {open &&
          EMOTES.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => {
                sendEmote(e)
                setOpen(false)
              }}
              aria-label={`이모티콘 ${e}`}
            >
              {e}
            </button>
          ))}
        <button
          type="button"
          className="emote-toggle"
          onClick={() => setOpen((o) => !o)}
          aria-label="이모티콘 열기"
        >
          {open ? '✕' : '😊'}
        </button>
      </div>
    </>
  )
}

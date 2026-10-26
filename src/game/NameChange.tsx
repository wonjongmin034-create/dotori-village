import { useEffect, useState, type FormEvent } from 'react'
import { create } from 'zustand'
import { useVillage } from './store'
import { nextNameChangeAt, renameSelf, type SelfRenameResult } from './cloud'

// 학생이 스스로 닉네임을 바꾸는 창. 한 달에 한 번, 12자 이내, 같은 반에 같은 이름이 있으면 안 된다.
// 마을·오목 기록·탑 순위·학습지 제출·도토리 지급 기록이 모두 새 이름으로 같이 바뀐다.

const useNameUi = create<{ open: boolean }>(() => ({ open: false }))

export function NameChangeButton() {
  return (
    <button
      type="button"
      className="name-edit-btn"
      onClick={() => useNameUi.setState({ open: true })}
      aria-label="닉네임 바꾸기"
      title="닉네임 바꾸기"
    >
      ✏️
    </button>
  )
}

const MESSAGES: Record<Exclude<SelfRenameResult, 'ok'>, string> = {
  invalid: '이름은 12자 이내로, 지금 이름과 다르게 적어 주세요',
  exists: '이미 같은 반에 있는 이름이에요. 다른 이름을 써 주세요',
  reserved: '이 이름은 쓸 수 없어요',
  cooldown: '닉네임은 한 달에 한 번만 바꿀 수 있어요. 이번 달에는 이미 바꿨어요',
  missing: '내 마을을 찾지 못했어요. 다시 로그인해 주세요',
  network: '연결이 안 돼요. 인터넷을 확인하고 다시 해 주세요',
}

export function NameChangePanel() {
  const open = useNameUi((s) => s.open)
  const session = useVillage((s) => s.session)
  const flash = useVillage((s) => s.flash)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [wait, setWait] = useState(0)

  useEffect(() => {
    if (open) {
      setName(session?.name ?? '')
      setErr('')
      setBusy(false)
      setWait(nextNameChangeAt())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  if (!open || !session) return null
  const close = () => useNameUi.setState({ open: false })

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setErr('')
    const r = await renameSelf(name)
    setBusy(false)
    if (r === 'ok') {
      flash(`이제 「${name.trim()}」(으)로 불려요! ✏️`)
      close()
    } else setErr(MESSAGES[r])
  }

  const waitText = wait
    ? `이번 달에는 이미 바꿨어요. 다음에 바꿀 수 있는 날: ${new Date(wait).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}`
    : ''

  return (
    <div className="farm-overlay" onPointerDown={(e) => e.target === e.currentTarget && close()}>
      <form className="farm-card" onSubmit={submit} style={{ maxWidth: 360 }}>
        <button type="button" className="farm-x" onClick={close} aria-label="닫기">
          ✕
        </button>
        <h3>✏️ 닉네임 바꾸기</h3>
        <p className="farm-note" style={{ margin: '4px 0 10px' }}>
          지금 이름: <b>{session.name}</b>
        </p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 12))}
          maxLength={12}
          autoFocus
          autoComplete="off"
          placeholder="새 이름 (12자 이내)"
          style={{ width: '100%', padding: '11px 12px', borderRadius: 12, border: '2px solid #d9d4be', fontSize: 16, fontFamily: 'inherit', boxSizing: 'border-box' }}
        />
        <p className="farm-note" style={{ margin: '8px 0' }}>
          한 달에 한 번만 바꿀 수 있어요. 신중하게 정하고, 친구들이 알아볼 수 있는 이름이 좋아요. 도토리·마을·기록은 그대로예요.
          <br />
          ⚠️ 바꾸고 나면 다음에 로그인할 때 <b>새 이름</b>으로 들어와야 해요.
        </p>
        {waitText && <p className="boss-err">{waitText}</p>}
        {err && <p className="boss-err">{err}</p>}
        <div className="armory-btns">
          <button type="submit" className="primary" disabled={busy || !!wait || name.trim() === '' || name.trim() === session.name}>
            {busy ? '바꾸는 중…' : '이 이름으로 바꾸기'}
          </button>
        </div>
      </form>
    </div>
  )
}

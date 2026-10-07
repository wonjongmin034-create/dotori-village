import { useState, type FormEvent } from 'react'
import { submitCode } from './appcode'

// 앱 맨 처음 화면 — 선생님이 알려 준 입장 코드를 넣어야 로그인 화면으로 넘어간다.
export function CodeGate({ onOpen }: { onOpen: () => void }) {
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (busy || !code.trim()) return
    setBusy(true)
    setErr('')
    const r = await submitCode(code)
    setBusy(false)
    if (r === 'ok') onOpen()
    else setErr(r === 'wrong' ? '코드가 달라요. 다시 확인해 주세요.' : '연결이 안 돼요. 인터넷을 확인하고 다시 시도해 주세요.')
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">🌰</div>
        <h1>도토리 마을</h1>
        <form onSubmit={submit}>
          <label>
            입장 코드
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\s/g, '').slice(0, 20))}
              inputMode="numeric"
              placeholder="선생님이 알려 준 코드"
              autoComplete="off"
              autoFocus
            />
          </label>
          {err && <p className="login-err">{err}</p>}
          <button type="submit" disabled={busy || !code.trim()}>
            {busy ? '확인 중…' : '들어가기'}
          </button>
          <p className="login-hint">선생님이 알려 준 코드가 있어야 열 수 있어요. 한 번 열면 이 기기에서는 다시 안 물어봐요.</p>
        </form>
      </div>
    </div>
  )
}

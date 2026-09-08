import { useState, type FormEvent } from 'react'
import { login } from './cloud'

export function Login({ onDone }: { onDone: () => void }) {
  const params = new URLSearchParams(typeof location !== 'undefined' ? location.search : '')
  const [code, setCode] = useState(params.get('class') ?? '')
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setErr('')
    const r = await login(code, name, pin)
    setBusy(false)
    if (r.ok) onDone()
    else
      setErr(
        r.error === 'pin'
          ? '비밀번호가 달라요'
          : '연결이 안 돼요. 인터넷을 확인하고 다시 시도해 주세요.',
      )
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">🌰</div>
        <h1>도토리 마을</h1>
        <p className="login-sub">반 코드와 이름으로 들어와요</p>
        <form onSubmit={submit}>
          <label>
            반 코드
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="예: 5-3"
              autoComplete="off"
              autoCapitalize="off"
              required
            />
          </label>
          <label>
            이름
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름"
              autoComplete="off"
              required
            />
          </label>
          <label>
            비밀번호 (숫자 4자리)
            <input
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              inputMode="numeric"
              placeholder="0000"
            />
          </label>
          {err && <p className="login-err">{err}</p>}
          <button type="submit" disabled={busy}>
            {busy ? '들어가는 중…' : '마을로 들어가기'}
          </button>
        </form>
        <p className="login-hint">
          처음이면 새 마을이 만들어져요. 다음엔 같은 이름·비밀번호로 들어오면 이어서 해요.
        </p>
        <button type="button" className="login-guest" onClick={onDone}>
          로그인 없이 둘러보기
        </button>
      </div>
    </div>
  )
}

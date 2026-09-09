import { useState, type FormEvent } from 'react'
import { login, teacherLogin, loadLocalSession, loadLocalTeacher } from './cloud'

export function Login({
  onStudent,
  onTeacher,
}: {
  onStudent: () => void
  onTeacher: () => void
}) {
  const params = new URLSearchParams(typeof location !== 'undefined' ? location.search : '')
  const savedS = loadLocalSession()
  const savedT = loadLocalTeacher()
  const [tab, setTab] = useState<'student' | 'teacher'>(
    params.has('teacher') || (!savedS && !!savedT) ? 'teacher' : 'student',
  )
  const [code, setCode] = useState(params.get('class') ?? savedS?.classCode ?? savedT ?? '')
  const [name, setName] = useState(savedS?.name ?? '')
  const [pin, setPin] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const submitStudent = async (e: FormEvent) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setErr('')
    const r = await login(code, name, pin)
    setBusy(false)
    if (r.ok) onStudent()
    else
      setErr(
        r.error === 'pin'
          ? '비밀번호가 달라요'
          : '연결이 안 돼요. 인터넷을 확인하고 다시 시도해 주세요.',
      )
  }

  const submitTeacher = async (e: FormEvent) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setErr('')
    const r = await teacherLogin(code, pin)
    setBusy(false)
    if (r === 'ok') onTeacher()
    else setErr(r === 'pin' ? '선생님 비밀번호가 달라요' : '연결이 안 돼요. 다시 시도해 주세요.')
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">🌰</div>
        <h1>도토리 마을</h1>

        <div className="login-tabs">
          <button
            type="button"
            className={tab === 'student' ? 'on' : ''}
            onClick={() => {
              setTab('student')
              setErr('')
            }}
          >
            학생
          </button>
          <button
            type="button"
            className={tab === 'teacher' ? 'on' : ''}
            onClick={() => {
              setTab('teacher')
              setErr('')
            }}
          >
            선생님
          </button>
        </div>

        {tab === 'student' ? (
          <form onSubmit={submitStudent}>
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
            <p className="login-hint">
              처음이면 새 마을이 만들어져요. 다음엔 같은 이름·비밀번호로 들어오면 이어서 해요.
            </p>
            <button type="button" className="login-guest" onClick={onStudent}>
              로그인 없이 둘러보기
            </button>
          </form>
        ) : (
          <form onSubmit={submitTeacher}>
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
              선생님 비밀번호
              <input
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="기본값 1234"
                autoComplete="off"
              />
            </label>
            {err && <p className="login-err">{err}</p>}
            <button type="submit" disabled={busy}>
              {busy ? '여는 중…' : '대시보드 열기'}
            </button>
            <p className="login-hint">
              반 코드가 처음이면 새로 만들어져요. 비밀번호는 대시보드에서 바꿀 수 있어요.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

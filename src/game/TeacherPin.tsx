import { useState } from 'react'
import { teacherChangePin } from './cloud'

// 선생님 화면: 선생님 비밀번호 바꾸기. 기본값(1234)이면 눈에 띄는 경고를 띄운다.
export function TeacherPin({
  classCode,
  isDefault,
  flash,
  onChanged,
}: {
  classCode: string
  isDefault: boolean
  flash: (t: string) => void
  onChanged: () => void
}) {
  const [open, setOpen] = useState(isDefault)
  const [cur, setCur] = useState('')
  const [next, setNext] = useState('')
  const [again, setAgain] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const save = async () => {
    setErr('')
    if (next.trim().length < 4) return setErr('새 비밀번호는 4글자 이상으로 해 주세요')
    if (next.trim() === '1234') return setErr('1234는 누구나 아는 번호라 쓸 수 없어요')
    if (next !== again) return setErr('새 비밀번호가 서로 달라요')
    setBusy(true)
    const r = await teacherChangePin(classCode, cur, next)
    setBusy(false)
    if (r === 'ok') {
      flash('선생님 비밀번호를 바꿨어요 🔑 다음부터 새 비밀번호로 들어오세요')
      setCur('')
      setNext('')
      setAgain('')
      setOpen(false)
      onChanged()
    } else if (r === 'wrong') setErr('지금 비밀번호가 맞지 않아요')
    else if (r === 'weak') setErr('새 비밀번호는 4글자 이상이고, 지금 것·1234와 달라야 해요')
    else setErr('바꾸지 못했어요. 인터넷을 확인해 주세요')
  }

  return (
    <section className={`dash-card${isDefault ? ' dash-warn' : ''}`}>
      <h3>🔑 선생님 비밀번호</h3>
      {isDefault && (
        <p className="dash-warn-text">
          ⚠️ 지금 비밀번호가 <b>기본값(1234)</b>이에요. 학생이 "선생님" 탭에서 1234를 넣으면 도토리를 주거나 계정을 지울 수 있어요. 지금 바꿔 주세요!
        </p>
      )}
      {!open ? (
        <button type="button" className="primary wide" onClick={() => setOpen(true)}>
          비밀번호 바꾸기
        </button>
      ) : (
        <div className="pin-form">
          <label>
            지금 비밀번호
            <input type="password" value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="off" placeholder={isDefault ? '기본값은 1234' : ''} />
          </label>
          <label>
            새 비밀번호 (4글자 이상)
            <input type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="off" />
          </label>
          <label>
            새 비밀번호 한 번 더
            <input type="password" value={again} onChange={(e) => setAgain(e.target.value)} autoComplete="off" />
          </label>
          {err && <p className="pin-err">{err}</p>}
          <button type="button" className="primary wide" disabled={busy} onClick={() => void save()}>
            {busy ? '바꾸는 중…' : '비밀번호 바꾸기'}
          </button>
          <p className="dash-note">학생들이 쉽게 짐작할 수 없는 번호로 해 주세요.</p>
        </div>
      )}
    </section>
  )
}

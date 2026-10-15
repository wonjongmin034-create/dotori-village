import { useCallback, useEffect, useState } from 'react'
import { teacherFetchControl, teacherSetControl, type Control } from './classControl'

// 선생님 화면: 광장·친구 마을 닫기 / 학생 전원 다시 접속시키기
export function TeacherControl({ classCode, flash }: { classCode: string; flash: (t: string) => void }) {
  const [ctl, setCtl] = useState<Control | 'missing' | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => setCtl(await teacherFetchControl(classCode)), [classCode])
  useEffect(() => {
    void load()
  }, [load])

  const setClosed = async (closed: boolean) => {
    setBusy(true)
    const ok = await teacherSetControl(classCode, { closed })
    setBusy(false)
    flash(ok ? (closed ? '광장·친구 마을을 닫았어요 (학생 화면에 10초 안에 반영)' : '광장·친구 마을을 열었어요') : '저장하지 못했어요')
    void load()
  }

  const kickAll = async () => {
    if (!window.confirm('학생 전원이 잠깐 나갔다가 다시 접속해요.\n(진행 중인 오목은 중단돼요) 계속할까요?')) return
    setBusy(true)
    const ok = await teacherSetControl(classCode, { kick: Date.now() })
    setBusy(false)
    flash(ok ? '전원 다시 접속 신호를 보냈어요 (10~20초 안에 다시 들어와요)' : '보내지 못했어요')
  }

  return (
    <section className="dash-card">
      <h3>🌐 수업 제어 (광장 · 친구 마을)</h3>
      {ctl === 'missing' ? (
        <p className="dash-note">
          이 기능을 쓰려면 한 번 준비가 필요해요. Supabase → SQL Editor 에서 <b>supabase/schema-8-control.sql</b> 내용을 붙여넣고 RUN 해
          주세요. (그전에도 게임은 그대로 돌아가요)
        </p>
      ) : (
        <>
          <p className="dash-note">
            서버가 힘들어하거나 수업에 집중해야 할 때 닫아요. 닫으면 광장·친구 마을 놀러 가기·오목이 멈추고, 내 마을 꾸미기·학습·도토리는 그대로예요.
          </p>
          <label className="dash-switch">
            <input type="checkbox" disabled={busy || ctl === null} checked={ctl !== null && ctl.closed} onChange={(e) => void setClosed(e.target.checked)} />
            <span>{ctl !== null && ctl.closed ? '🔒 닫힘 (학생이 광장·놀러 가기를 못 해요)' : '🟢 열림'}</span>
          </label>
          <button type="button" className="primary wide" disabled={busy || ctl === null} onClick={() => void kickAll()} style={{ marginTop: 10 }}>
            🔄 학생 전원 다시 접속시키기
          </button>
          <p className="dash-note" style={{ marginTop: 6 }}>
            화면이 이상하거나 연결이 꼬였을 때 눌러요. 학생들은 몇 초 안에 자기 마을로 돌아와 자동으로 다시 접속해요. (도토리·마을은 그대로 저장돼요)
          </p>
        </>
      )}
    </section>
  )
}

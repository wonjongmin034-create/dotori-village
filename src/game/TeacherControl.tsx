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

  const setPractice = async (on: boolean) => {
    setBusy(true)
    const ok = await teacherSetControl(classCode, { raidPractice: on })
    setBusy(false)
    flash(ok ? (on ? '레이드 연습을 열었어요 (아무 때나 들어올 수 있어요)' : '레이드 연습을 닫았어요 (금요일 8시~2시에만 열려요)') : '저장하지 못했어요')
    void load()
  }

  const kickAll = async () => {
    if (!window.confirm('학생 전원이 잠깐 나갔다가 다시 접속해요.\n(진행 중인 오목은 중단돼요) 계속할까요?')) return
    setBusy(true)
    const ok = await teacherSetControl(classCode, { kick: Date.now() })
    setBusy(false)
    flash(ok ? '전원 다시 접속 신호를 보냈어요 (10~20초 안에 다시 들어와요)' : '보내지 못했어요')
  }

  const resetBoss = async () => {
    if (!window.confirm('오늘 학생들이 쓴 보스 도전 횟수를 모두 0으로 되돌려요.\n(학생들은 오늘 5번을 다시 도전할 수 있어요) 계속할까요?')) return
    setBusy(true)
    const ok = await teacherSetControl(classCode, { bossReset: Date.now() })
    setBusy(false)
    flash(ok ? '오늘 보스 도전 횟수를 초기화했어요 (10초 안에 학생 화면에 반영)' : '초기화하지 못했어요')
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
          <label className="dash-switch" style={{ marginTop: 12 }}>
            <input type="checkbox" disabled={busy || ctl === null} checked={ctl !== null && ctl.raidPractice} onChange={(e) => void setPractice(e.target.checked)} />
            <span>{ctl !== null && ctl.raidPractice ? '🐲 레이드 연습 열림 (금요일이 아니어도 가능)' : '🐲 레이드 연습 닫힘 (금요일 8시~2시에만 열려요)'}</span>
          </label>
          <button type="button" className="primary wide" disabled={busy || ctl === null} onClick={() => void resetBoss()} style={{ marginTop: 10 }}>
            ⚔️ 오늘 보스 도전 횟수 초기화
          </button>
          <p className="dash-note" style={{ marginTop: 6 }}>
            학생들이 하루 5번을 다 썼을 때 눌러요. 지금까지 쓴 횟수가 0으로 돌아가서 오늘 5번을 다시 도전할 수 있어요. (이미 깬 보스의 도토리는 그대로예요)
          </p>
        </>
      )}
    </section>
  )
}

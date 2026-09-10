import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  teacherFetch,
  teacherGrant,
  teacherSetHomework,
  teacherSetMission,
  teacherSetQuestions,
  teacherToggleArcade,
  teacherResetPin,
  teacherLogout,
  type ClassData,
  type StudentRow,
} from './cloud'
import { DAILY_PER_SUBJECT } from './economy'
import { dailySet, parseQuestions, newQuestionId, SUBJECTS, type Question } from './questions'
import type { Mission } from './store'

// 학생이 오늘 틀린 문제 목록
function wrongToday(s: StudentRow, extra: Question[]) {
  if (!s.daily) return []
  const set = dailySet(s.daily.day, DAILY_PER_SUBJECT, extra)
  return set
    .filter((q) => s.dailyPicks[q.id] != null && s.dailyPicks[q.id] !== q.answer)
    .map((q) => ({
      q,
      picked: s.dailyPicks[q.id],
    }))
}

function DailyLearnCard({
  students,
  customQuestions,
}: {
  students: StudentRow[]
  customQuestions: Question[]
}) {
  const [open, setOpen] = useState<Set<string>>(new Set())
  const toggle = (n: string) =>
    setOpen((p) => {
      const x = new Set(p)
      x.has(n) ? x.delete(n) : x.add(n)
      return x
    })

  // 오늘 반 전체가 많이 틀린 문제 top 3
  const hardest = useMemo(() => {
    const count = new Map<string, { q: Question; n: number }>()
    for (const s of students) {
      for (const w of wrongToday(s, customQuestions)) {
        const e = count.get(w.q.id) ?? { q: w.q, n: 0 }
        e.n++
        count.set(w.q.id, e)
      }
    }
    return [...count.values()].sort((a, b) => b.n - a.n).slice(0, 3)
  }, [students, customQuestions])

  const did = students.filter((s) => s.daily && s.daily.idx > 0)

  return (
    <section className="dash-card">
      <h3>📚 오늘의 학습</h3>
      <p className="dash-note">
        하루 20문제(국어·수학·사회·과학·영어). 같은 반은 같은 문제를 풀어요. 학생별로 틀린 문제를 볼 수 있어요.
      </p>

      {hardest.length > 0 && (
        <div className="learn-hard">
          <b>반이 많이 틀린 문제</b>
          {hardest.map((h) => (
            <div key={h.q.id} className="learn-hard-row">
              <span className="learn-hard-n">{h.n}명</span>
              <span className="learn-hard-sub">{h.q.subject}</span>
              <span className="learn-hard-q">{h.q.q}</span>
            </div>
          ))}
        </div>
      )}

      <div className="learn-stus">
        {did.length === 0 && <p className="dash-note">아직 오늘 학습을 시작한 학생이 없어요.</p>}
        {did.map((s) => {
          const d = s.daily!
          const wrong = wrongToday(s, customQuestions)
          const state = d.idx >= d.total ? (d.claimed ? '완료' : '다 풂') : `${d.idx}/${d.total}`
          return (
            <div key={s.name} className="learn-stu">
              <button type="button" className="learn-stu-head" onClick={() => toggle(s.name)}>
                <span className="learn-stu-name">{s.name}</span>
                <span className="learn-stu-score">
                  {d.score}/{d.total} 맞힘
                </span>
                <span className="learn-stu-state">{state}</span>
                <span className="learn-stu-wrong">
                  {wrong.length > 0 ? `틀림 ${wrong.length} ▾` : '전부 정답 ✓'}
                </span>
              </button>
              {open.has(s.name) && (
                <div className="learn-detail">
                  {s.learnLog.length > 0 && (
                    <p className="learn-recent">
                      지난 결과{' '}
                      {s.learnLog
                        .slice(0, 6)
                        .map((r) => `${r.score}/${r.total}`)
                        .join(' · ')}
                    </p>
                  )}
                  {wrong.length > 0 ? (
                    <ul className="learn-wrong-list">
                      {wrong.map(({ q, picked }) => (
                        <li key={q.id}>
                          <span className="lw-sub">{q.subject}</span>
                          <span className="lw-q">{q.q}</span>
                          <span className="lw-a">
                            학생: <b className="bad">{q.choices[picked]}</b> · 정답:{' '}
                            <b className="good">{q.choices[q.answer]}</b>
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="dash-note">오늘 틀린 문제가 없어요.</p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

function QuestionMakerCard({
  classCode,
  questions,
  onSaved,
}: {
  classCode: string
  questions: Question[]
  onSaved: () => void
}) {
  const [mode, setMode] = useState<'one' | 'bulk'>('one')
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')

  const [subject, setSubject] = useState<Question['subject']>('수학')
  const [q, setQ] = useState('')
  const [choices, setChoices] = useState(['', '', '', ''])
  const [answer, setAnswer] = useState(0)
  const [explain, setExplain] = useState('')
  const [bulk, setBulk] = useState('')

  const save = async (next: Question[]) => {
    setBusy(true)
    const ok = await teacherSetQuestions(classCode, next)
    setBusy(false)
    if (!ok) {
      setNote('저장 실패 — Supabase에서 schema-3-questions.sql 을 먼저 실행하세요')
      return false
    }
    onSaved()
    return true
  }

  const addOne = async () => {
    const cs = choices.map((c) => c.trim()).filter(Boolean)
    if (!q.trim() || cs.length < 2 || answer >= cs.length) {
      setNote('문제 · 보기 2개 이상 · 정답 위치를 확인하세요')
      return
    }
    const ok = await save([
      ...questions,
      { id: newQuestionId(), subject, q: q.trim(), choices: cs, answer, explain: explain.trim() },
    ])
    if (!ok) return
    setQ('')
    setChoices(['', '', '', ''])
    setAnswer(0)
    setExplain('')
    setNote('문제를 추가했어요')
  }

  const addBulk = async () => {
    const { questions: parsed, errors } = parseQuestions(bulk)
    if (parsed.length === 0) {
      setNote('형식에 맞는 문제를 찾지 못했어요')
      return
    }
    const ok = await save([...questions, ...parsed])
    if (!ok) return
    setBulk('')
    setNote(`${parsed.length}문제 추가${errors ? ` · ${errors}개는 건너뜀` : ''}`)
  }

  const remove = (id: string) => save(questions.filter((x) => x.id !== id))

  return (
    <section className="dash-card">
      <h3>📝 문제 만들기</h3>
      <p className="dash-note">
        여기서 추가한 문제는 기본 문제와 함께 &ldquo;오늘의 학습&rdquo;에 나와요. 과목당 하루 4문제라, 많이 넣을수록 우리 반 문제가 자주 나옵니다.
      </p>

      <div className="qm-counts">
        {SUBJECTS.map((sub) => {
          const n = questions.filter((x) => x.subject === sub).length
          return (
            <span key={sub} className={n ? 'has' : ''}>
              {sub} {n}
            </span>
          )
        })}
      </div>

      <div className="qm-tabs">
        <button type="button" className={mode === 'one' ? 'on' : ''} onClick={() => setMode('one')}>
          하나씩
        </button>
        <button type="button" className={mode === 'bulk' ? 'on' : ''} onClick={() => setMode('bulk')}>
          여러 개 붙여넣기
        </button>
      </div>

      {mode === 'one' ? (
        <div className="qm-form">
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value as Question['subject'])}
          >
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <textarea rows={2} placeholder="문제" value={q} onChange={(e) => setQ(e.target.value)} />
          {choices.map((c, i) => (
            <label key={i} className="qm-choice">
              <input
                type="radio"
                name="qm-ans"
                checked={answer === i}
                onChange={() => setAnswer(i)}
              />
              <input
                placeholder={`보기 ${i + 1}${i > 1 ? ' (선택)' : ''}`}
                value={c}
                onChange={(e) =>
                  setChoices((cs) => cs.map((x, j) => (j === i ? e.target.value : x)))
                }
              />
            </label>
          ))}
          <input
            placeholder="해설 (선택)"
            value={explain}
            onChange={(e) => setExplain(e.target.value)}
          />
          <button type="button" className="primary wide" disabled={busy} onClick={addOne}>
            문제 추가
          </button>
        </div>
      ) : (
        <div className="qm-form">
          <textarea
            rows={9}
            className="qm-bulk"
            value={bulk}
            onChange={(e) => setBulk(e.target.value)}
            placeholder={
              '[수학] 3 + 4 = ?\n- 5\n* 7\n- 8\n- 9\n해설: 3 더하기 4는 7\n\n[국어] 다음 중 높임말은?\n* 진지\n- 밥\n- 물\n- 손'
            }
          />
          <p className="qm-help">
            <code>[과목]</code> 으로 시작 · <code>-</code> 보기 · <code>*</code> 정답 ·{' '}
            <code>해설:</code> 선택 · 빈 줄로 문제 구분
          </p>
          <button type="button" className="primary wide" disabled={busy} onClick={addBulk}>
            붙여넣은 문제 추가
          </button>
        </div>
      )}

      {note && <p className="qm-note">{note}</p>}

      {questions.length > 0 && (
        <div className="qm-list">
          {SUBJECTS.filter((sub) => questions.some((x) => x.subject === sub)).map((sub) => (
            <div key={sub}>
              <div className="qm-list-sub">{sub}</div>
              {questions
                .filter((x) => x.subject === sub)
                .map((x) => (
                  <div key={x.id} className="qm-item">
                    <span className="qm-item-q">
                      {x.q} <b>→ {x.choices[x.answer]}</b>
                    </span>
                    <button type="button" onClick={() => remove(x.id)}>
                      🗑
                    </button>
                  </div>
                ))}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

const ago = (iso: string | null) => {
  if (!iso) return '접속 전'
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 90) return '방금'
  if (s < 3600) return `${Math.floor(s / 60)}분 전`
  if (s < 86400) return `${Math.floor(s / 3600)}시간 전`
  return `${Math.floor(s / 86400)}일 전`
}

export function TeacherDashboard({ classCode, onExit }: { classCode: string; onExit: () => void }) {
  const [data, setData] = useState<ClassData | null>(null)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [amount, setAmount] = useState(5)
  const [reason, setReason] = useState('')

  const [hw, setHw] = useState('')
  const [mText, setMText] = useState('')
  const [mReward, setMReward] = useState(20)

  const flash = (t: string) => {
    setMsg(t)
    setTimeout(() => setMsg(''), 2500)
  }

  const load = useCallback(async () => {
    setLoading(true)
    const d = await teacherFetch(classCode)
    setData(d)
    if (d) {
      setHw(d.homework)
      setMText(d.mission?.text ?? '')
      setMReward(d.mission?.reward ?? 20)
    }
    setLoading(false)
  }, [classCode])

  useEffect(() => {
    void load()
    const t = setInterval(load, 30_000)
    return () => clearInterval(t)
  }, [load])

  if (loading && !data) {
    return (
      <div className="dash">
        <div className="dash-loading">불러오는 중…</div>
      </div>
    )
  }
  if (!data) {
    return (
      <div className="dash">
        <div className="dash-loading">
          연결이 안 돼요.
          <button type="button" onClick={load}>
            다시
          </button>
          <button type="button" onClick={onExit}>
            나가기
          </button>
        </div>
      </div>
    )
  }

  const toggle = (name: string) =>
    setPicked((p) => {
      const n = new Set(p)
      n.has(name) ? n.delete(name) : n.add(name)
      return n
    })

  const doGrant = async (sign: 1 | -1) => {
    const amt = Math.abs(amount) * sign
    if (!amt) return
    const targets = picked.size === data.students.length || picked.size === 0 ? [] : [...picked]
    await teacherGrant(classCode, targets, amt, reason.trim())
    flash(
      `${targets.length === 0 ? '반 전체' : `${targets.length}명`}에게 ${amt > 0 ? '+' : ''}${amt} 도토리`,
    )
    setReason('')
  }

  const saveHw = async () => {
    await teacherSetHomework(classCode, hw.trim())
    flash('숙제 저장됨')
    void load()
  }

  const saveMission = async () => {
    const m: Mission | null = mText.trim()
      ? { text: mText.trim(), reward: mReward, done: data.mission?.done ?? [] }
      : null
    await teacherSetMission(classCode, m)
    flash(m ? '미션 저장됨' : '미션 삭제됨')
    void load()
  }

  const missionDone = data.mission?.done ?? []
  const toggleMissionDone = async (name: string) => {
    if (!data.mission) return
    const done = missionDone.includes(name)
      ? missionDone.filter((n) => n !== name)
      : [...missionDone, name]
    await teacherSetMission(classCode, { ...data.mission, done })
    void load()
  }
  const rewardAll = async () => {
    if (!data.mission) return
    await teacherGrant(classCode, [], data.mission.reward, `공동 미션: ${data.mission.text}`)
    await teacherSetMission(classCode, null)
    flash(`반 전체에게 미션 보상 +${data.mission.reward}`)
    void load()
  }

  const allDone =
    data.mission != null &&
    data.students.length > 0 &&
    data.students.every((s) => missionDone.includes(s.name))

  return (
    <div className="dash">
      <header className="dash-head">
        <div>
          <b>선생님 대시보드</b>
          <span>반 코드 {classCode} · 학생 {data.students.length}명</span>
        </div>
        <div className="dash-head-btns">
          <button type="button" onClick={load}>
            새로고침
          </button>
          <button
            type="button"
            onClick={() => {
              teacherLogout()
              onExit()
            }}
          >
            나가기
          </button>
        </div>
      </header>

      {msg && <div className="dash-toast">{msg}</div>}

      {/* 도토리 주기 */}
      <section className="dash-card">
        <h3>🌰 도토리 주기</h3>
        <p className="dash-note">
          1인 1역 · 발표 · 친구 돕기 · 청소 같은 걸 잘했을 때 주세요. 아무도 안 고르면 반 전체에게
          갑니다.
        </p>
        <div className="grant-row">
          <label>
            개수
            <input
              type="number"
              value={amount}
              min={1}
              max={200}
              onChange={(e) => setAmount(Math.max(1, Math.min(200, +e.target.value || 0)))}
            />
          </label>
          <label className="grant-reason">
            이유 (선택)
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="예: 발표 잘함"
            />
          </label>
        </div>
        <div className="grant-btns">
          <button type="button" className="primary" onClick={() => doGrant(1)}>
            + 주기
          </button>
          <button type="button" className="danger" onClick={() => doGrant(-1)}>
            − 빼기
          </button>
        </div>
      </section>

      {/* 학생 목록 */}
      <section className="dash-card">
        <h3>👦 학생 ({picked.size > 0 ? `${picked.size}명 선택` : '전체'})</h3>
        <div className="stu-list">
          {data.students.length === 0 && <p className="dash-note">아직 들어온 학생이 없어요.</p>}
          {data.students.map((s) => {
            return (
              <label key={s.name} className={`stu ${picked.has(s.name) ? 'on' : ''}`}>
                <input type="checkbox" checked={picked.has(s.name)} onChange={() => toggle(s.name)} />
                <span className="stu-name">{s.name}</span>
                <span className="stu-stat">🌰 {s.coins}</span>
                <span className="stu-stat">집 Lv{s.houseLevel}</span>
                <span className="stu-stat">
                  {s.daily && s.daily.idx > 0
                    ? `학습 ${s.daily.score}/${s.daily.total}`
                    : '학습 —'}
                </span>
                <span className="stu-stat dim">{ago(s.lastSeen)}</span>
                {data.mission && (
                  <span className={`stu-mission ${missionDone.includes(s.name) ? 'done' : ''}`}>
                    {missionDone.includes(s.name) ? '미션✓' : '미션…'}
                  </span>
                )}
                <button
                  type="button"
                  className="stu-pin"
                  onClick={(e) => {
                    e.preventDefault()
                    if (window.confirm(`${s.name}의 비밀번호를 초기화할까요? (다음 로그인 때 새로 정함)`)) {
                      void teacherResetPin(classCode, s.name).then(() => flash('비번 초기화됨'))
                    }
                  }}
                >
                  비번↺
                </button>
              </label>
            )
          })}
        </div>
      </section>

      <DailyLearnCard students={data.students} customQuestions={data.customQuestions} />

      <QuestionMakerCard
        classCode={classCode}
        questions={data.customQuestions}
        onSaved={load}
      />

      {/* 숙제 */}
      <section className="dash-card">
        <h3>📋 숙제</h3>
        <textarea
          rows={4}
          value={hw}
          onChange={(e) => setHw(e.target.value)}
          placeholder={'수학 익힘책 42~43쪽\n국어 독서록 1편'}
        />
        <button type="button" className="primary wide" onClick={saveHw}>
          숙제 저장
        </button>
      </section>

      {/* 학급 공동 미션 */}
      <section className="dash-card">
        <h3>🤝 학급 공동 미션</h3>
        <p className="dash-note">전원이 완료하면 반 전체에게 보상. 개인 지목은 안 보이게 하세요.</p>
        <textarea
          rows={2}
          value={mText}
          onChange={(e) => setMText(e.target.value)}
          placeholder="예: 이번 주 전원 구구단 7단 통과"
        />
        <div className="grant-row">
          <label>
            전원 보상
            <input
              type="number"
              value={mReward}
              min={0}
              max={500}
              onChange={(e) => setMReward(Math.max(0, Math.min(500, +e.target.value || 0)))}
            />
          </label>
          <button type="button" onClick={saveMission}>
            {mText.trim() ? '미션 저장' : '미션 없음으로'}
          </button>
        </div>

        {data.mission && (
          <div className="mission-track">
            <p>
              완료 <b>{missionDone.length}</b> / {data.students.length}
            </p>
            <div className="mission-stus">
              {data.students.map((s) => (
                <button
                  key={s.name}
                  type="button"
                  className={missionDone.includes(s.name) ? 'done' : ''}
                  onClick={() => toggleMissionDone(s.name)}
                >
                  {missionDone.includes(s.name) ? '✓ ' : ''}
                  {s.name}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="primary wide"
              disabled={!allDone}
              onClick={rewardAll}
            >
              {allDone ? `🎉 전원에게 +${data.mission.reward} 지급` : '아직 전원 완료 아니에요'}
            </button>
          </div>
        )}
      </section>

      {/* 강화 게임 */}
      <section className="dash-card">
        <h3>🎰 도토리 강화 게임</h3>
        <p className="dash-note">
          코인 도박 요소가 있어요. 필요하면 이 반에서 꺼두세요.
        </p>
        <label className="dash-switch">
          <input
            type="checkbox"
            checked={data.arcadeEnabled}
            onChange={async (e) => {
              await teacherToggleArcade(classCode, e.target.checked)
              flash(e.target.checked ? '강화 게임 켬' : '강화 게임 끔')
              void load()
            }}
          />
          <span>{data.arcadeEnabled ? '켜짐 (학생이 할 수 있음)' : '꺼짐 (학생 화면에서 잠김)'}</span>
        </label>
      </section>
    </div>
  )
}

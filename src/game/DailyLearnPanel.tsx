import { useMemo, useState } from 'react'
import { DAILY_PER_SUBJECT, DAILY_PER_CORRECT, dailyBonus } from './economy'
import { dailySet, SUBJECTS, type Question } from './questions'
import { useVillage } from './store'

export function DailyLearnPanel() {
  const open = useVillage((s) => s.learnOpen)
  const daily = useVillage((s) => s.daily)
  const close = useVillage((s) => s.closeLearn)
  const answerDaily = useVillage((s) => s.answerDaily)
  const claimDaily = useVillage((s) => s.claimDaily)

  const set = useMemo(
    () => (daily ? dailySet(daily.day, DAILY_PER_SUBJECT) : []),
    [daily?.day],
  )
  const [fb, setFb] = useState<{ q: Question; pick: number } | null>(null)

  if (!open || !daily) return null

  const total = set.length
  const doneAll = daily.idx >= total
  const cur = doneAll ? null : set[daily.idx]

  const choose = (i: number) => {
    if (fb || !cur) return
    setFb({ q: cur, pick: i })
    answerDaily(i)
  }

  // ── 결과 화면 ──
  if (!fb && doneAll) {
    const rate = total ? daily.score / total : 0
    const tier = dailyBonus(rate)
    const bonus = tier?.add ?? 0
    const base = daily.score * DAILY_PER_CORRECT
    const perSub = SUBJECTS.map((sub) => {
      const qs = set.filter((q) => q.subject === sub)
      const got = qs.filter((q) => daily.picks[q.id] === q.answer).length
      return { sub, got, of: qs.length }
    })
    return (
      <div className="farm-overlay" onPointerDown={(e) => e.target === e.currentTarget && close()}>
        <div className="farm-card learn-card">
          <button type="button" className="farm-x" onClick={close} aria-label="닫기">
            ✕
          </button>
          <h3>📚 오늘의 학습 결과</h3>
          <p className="learn-score">
            <b>{daily.score}</b> / {total} 맞힘
            {tier && <span className="learn-tier"> · {tier.label}</span>}
          </p>
          <div className="learn-subgrid">
            {perSub.map((p) => (
              <div key={p.sub} className={`learn-sub ${p.got === p.of ? 'full' : ''}`}>
                <span>{p.sub}</span>
                <b>
                  {p.got}/{p.of}
                </b>
              </div>
            ))}
          </div>
          <div className="learn-reward">
            <div>
              맞힌 문제 {daily.score} × {DAILY_PER_CORRECT} = <b>{base}</b> 도토리
            </div>
            {bonus > 0 && (
              <div>
                정답률 보너스 <b>+{bonus}</b> 도토리
              </div>
            )}
            <div className="learn-total">
              오늘 받는 도토리 <b>🌰 {base + bonus}</b>
            </div>
          </div>
          {daily.claimed ? (
            <p className="learn-claimed">이미 받았어요. 내일 새 문제로 또 만나요! 👋</p>
          ) : (
            <button type="button" className="primary wide" onClick={claimDaily}>
              🌰 도토리 받기
            </button>
          )}
        </div>
      </div>
    )
  }

  // ── 문제 풀이 ──
  const show = fb ? fb.q : cur!
  const shownIdx = fb ? daily.idx - 1 : daily.idx
  const picked = fb ? fb.pick : null
  const isWrong = fb != null && fb.pick !== fb.q.answer
  const last = daily.idx >= total

  return (
    <div className="farm-overlay" onPointerDown={(e) => e.target === e.currentTarget && close()}>
      <div className="farm-card learn-card">
        <button type="button" className="farm-x" onClick={close} aria-label="닫기">
          ✕
        </button>

        <div className="learn-top">
          <span className="learn-sub-tag">{show.subject}</span>
          <span className="learn-progress">
            {shownIdx + 1} / {total}
          </span>
        </div>
        <div className="learn-bar">
          <div style={{ width: `${((shownIdx + (fb ? 1 : 0)) / total) * 100}%` }} />
        </div>

        <p className="quiz-q">{show.q}</p>

        <div className="quiz-choices">
          {show.choices.map((c, i) => {
            let cls = 'quiz-choice'
            if (fb) {
              if (i === show.answer) cls += ' right'
              else if (i === picked) cls += ' wrong'
            }
            return (
              <button
                key={i}
                type="button"
                className={cls}
                disabled={fb != null}
                onClick={() => choose(i)}
              >
                {c}
              </button>
            )
          })}
        </div>

        {fb && (
          <div className={`quiz-feedback ${isWrong ? 'wrong-fb' : 'right-fb'}`}>
            <p>
              {isWrong ? '아쉬워요. ' : '정답! '}
              {show.explain}
            </p>
            <button type="button" onClick={() => setFb(null)}>
              {last ? '결과 보기 →' : '다음 문제 →'}
            </button>
          </div>
        )}

        {!fb && (
          <p className="learn-hint">
            한 번 고르면 바꿀 수 없어요. 맞히면 도토리 +{DAILY_PER_CORRECT}, 다 풀면 정답률 보너스!
          </p>
        )}
      </div>
    </div>
  )
}

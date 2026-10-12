import { useMemo, useState } from 'react'
import { DAILY_PAY, DAILY_RETRY_CREDIT, DAILY_PER_SUBJECT, dailyPay, dailyPoints } from './economy'
import { dailySet, hintOf, SUBJECTS, type Question } from './questions'
import { useVillage } from './store'

// 틀린 문제의 두 번째 기회에서 지워 주는 오답 하나 (힌트 글이 없는 문제용)
const wrongToCross = (q: Question, firstPick: number): number =>
  q.choices.findIndex((_, i) => i !== q.answer && i !== firstPick)

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1))

export function DailyLearnPanel() {
  const open = useVillage((s) => s.learnOpen)
  const daily = useVillage((s) => s.daily)
  const classQuestions = useVillage((s) => s.classQuestions)
  const close = useVillage((s) => s.closeLearn)
  const answerDaily = useVillage((s) => s.answerDaily)
  const retryDaily = useVillage((s) => s.retryDaily)
  const claimDaily = useVillage((s) => s.claimDaily)

  const set = useMemo(
    () => (daily ? dailySet(daily.day, DAILY_PER_SUBJECT, classQuestions) : []),
    [daily?.day, classQuestions],
  )
  // 방금 끝낸 문제의 결과 (first = 처음에 고른 보기, pick = 마지막에 고른 보기)
  const [fb, setFb] = useState<{ q: Question; first: number; pick: number; retried: boolean } | null>(null)

  if (!open || !daily) return null

  const total = set.length
  const doneAll = daily.idx >= total
  const cur = doneAll ? null : set[daily.idx]
  // 이 문제를 이미 한 번 틀렸으면 힌트를 보고 다시 고르는 중
  const firstWrong = cur && daily.picks[cur.id] != null ? daily.picks[cur.id] : null

  const choose = (i: number) => {
    if (fb || !cur) return
    if (firstWrong != null) {
      retryDaily(i)
      setFb({ q: cur, first: firstWrong, pick: i, retried: true })
    } else {
      answerDaily(i)
      if (i === cur.answer) setFb({ q: cur, first: i, pick: i, retried: false })
    }
  }

  // ── 결과 화면 ──
  if (!fb && doneAll) {
    const first = daily.first ?? daily.score
    const second = daily.score - first
    const points = dailyPoints(daily.score, daily.first)
    const tier = dailyPay(points, total)
    const pay = tier?.coins ?? 0
    const perSub = SUBJECTS.map((sub) => {
      const qs = set.filter((q) => q.subject === sub)
      const got = qs.filter(
        (q) => daily.picks[q.id] === q.answer || daily.retry?.[q.id] === q.answer,
      ).length
      return { sub, got, of: qs.length }
    })
    const need = Math.ceil(total * DAILY_PAY[DAILY_PAY.length - 1].rate - 1e-9)
    return (
      <div className="farm-overlay" onPointerDown={(e) => e.target === e.currentTarget && close()}>
        <div className="farm-card learn-card">
          <button type="button" className="farm-x" onClick={close} aria-label="닫기">
            ✕
          </button>
          <h3>📚 오늘의 학습 결과</h3>
          <p className="learn-score">
            <b>{fmt(points)}</b> / {total} 점
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
              처음에 맞힘 {first}개 = <b>{first}</b>점
            </div>
            {second > 0 && (
              <div>
                힌트 보고 맞힘 {second}개 × {DAILY_RETRY_CREDIT} = <b>{fmt(second * DAILY_RETRY_CREDIT)}</b>점
              </div>
            )}
            <div className="learn-total">
              {pay > 0 ? (
                <>
                  오늘 받는 도토리 <b>🌰 {pay}</b>
                </>
              ) : (
                <>
                  {need}점 이상이어야 도토리를 받아요.
                  <br />
                  내일 다시 도전! 💪
                </>
              )}
            </div>
          </div>
          <table className="learn-paytable">
            <tbody>
              {DAILY_PAY.map((t) => (
                <tr key={t.rate} className={tier?.rate === t.rate ? 'on' : ''}>
                  <td>{Math.ceil(total * t.rate - 1e-9)}점 이상</td>
                  <td>{t.label}</td>
                  <td>🌰 {t.coins}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {daily.claimed ? (
            <p className="learn-claimed">이미 받았어요. 내일 새 문제로 또 만나요! 👋</p>
          ) : (
            <button type="button" className="primary wide" onClick={claimDaily}>
              {pay > 0 ? '🌰 도토리 받기' : '확인'}
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
  const retrying = !fb && firstWrong != null
  const hint = retrying ? hintOf(show) : null
  const crossed = retrying && !hint ? wrongToCross(show, firstWrong) : -1

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

        {retrying && (
          <div className="learn-hintbox">
            <b>앗, 아쉬워요! 한 번 더 도전해요 (맞히면 ½점)</b>
            <p>{hint ? `💡 힌트: ${hint}` : '💡 힌트: 틀린 보기와 오답 하나를 지워 줬어요.'}</p>
          </div>
        )}

        <div className="quiz-choices">
          {show.choices.map((c, i) => {
            let cls = 'quiz-choice'
            let off = false
            if (fb) {
              if (i === show.answer) cls += ' right'
              else if (i === picked || i === fb.first) cls += ' wrong'
              off = true
            } else if (retrying && (i === firstWrong || i === crossed)) {
              cls += ' wrong'
              off = true
            }
            return (
              <button key={i} type="button" className={cls} disabled={off} onClick={() => choose(i)}>
                {c}
              </button>
            )
          })}
        </div>

        {fb && (
          <div className={`quiz-feedback ${isWrong ? 'wrong-fb' : 'right-fb'}`}>
            <p>
              {isWrong ? '아쉬워요. ' : fb.retried ? '이번엔 맞혔어요! (½점) ' : '정답! '}
              {show.explain}
            </p>
            <button type="button" onClick={() => setFb(null)}>
              {last ? '결과 보기 →' : '다음 문제 →'}
            </button>
          </div>
        )}

        {!fb && !retrying && (
          <p className="learn-hint">
            처음에 맞히면 1점! 틀리면 힌트를 보고 한 번 더 풀 수 있어요(½점). 절반 이상 점수를 모아야 도토리를 받아요.
          </p>
        )}
      </div>
    </div>
  )
}

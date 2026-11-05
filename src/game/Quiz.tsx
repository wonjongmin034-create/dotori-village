import { useEffect, useRef, useState } from 'react'
import { QUIZ_REWARD } from './economy'
import { randomQuestion, type Question } from './questions'
import { useVillage } from './store'
import { pushQuizStat } from './cloud'

// 돌봄(물주기·먹이주기·비료) 전에 뜨는 학습 문제.
//  · 틀리면 그 자리에서 이번 기회가 사라진다 (다른 문제로 다시 풀 수 없다).
//  · 풀기 전에 닫았다가 다시 열면 같은 문제가 나온다 (문제를 보고 닫아서 새 문제를 뽑는 꼼수를 막는다).
const asked = new Map<string, Question>()

export function Quiz() {
  const quiz = useVillage((s) => s.quiz)
  const passQuiz = useVillage((s) => s.passQuiz)
  const failQuiz = useVillage((s) => s.failQuiz)
  const cancelQuiz = useVillage((s) => s.cancelQuiz)

  const [q, setQ] = useState<Question>(() => randomQuestion())
  const [picked, setPicked] = useState<number | null>(null)
  const [wrong, setWrong] = useState(false)
  const logged = useRef(false) // 이 문제에 대해 통계 기록했는지

  // quiz 요청이 새로 들어올 때마다 새 문제로 초기화
  useEffect(() => {
    if (quiz) {
      const saved = quiz.id ? asked.get(quiz.id) : undefined
      const next = saved ?? randomQuestion()
      if (quiz.id) asked.set(quiz.id, next)
      setQ(next)
      setPicked(null)
      setWrong(false)
      logged.current = false
    }
  }, [quiz])

  if (!quiz) return null

  const answered = picked !== null
  const correct = answered && picked === q.answer

  const done = () => {
    if (quiz.id) asked.delete(quiz.id)
  }
  // 틀린 뒤에 닫으면(✕든 확인이든) 기회가 사라진다. 풀기 전에 닫는 것은 그냥 닫기.
  const close = () => {
    if (wrong) {
      done()
      failQuiz()
    } else cancelQuiz()
  }

  const choose = (i: number) => {
    if (answered) return // 한 번 고르면 끝 — 다시 고를 수 없다
    setPicked(i)
    setWrong(i !== q.answer)
    if (!logged.current) {
      logged.current = true
      void pushQuizStat(i === q.answer)
    }
  }

  return (
    <div className="quiz-overlay">
      <div className="quiz-card">
        <div className="quiz-top">
          <span className="quiz-sub">{q.subject}</span>
          <button type="button" className="quiz-x" onClick={close} aria-label="닫기">
            ✕
          </button>
        </div>

        <p className="quiz-q">{q.q}</p>

        <div className="quiz-choices">
          {q.choices.map((c, i) => {
            let cls = 'quiz-choice'
            if (answered && i === q.answer && (correct || wrong)) cls += ' right'
            else if (answered && i === picked && wrong) cls += ' wrong'
            return (
              <button key={i} type="button" className={cls} onClick={() => choose(i)}>
                {c}
              </button>
            )
          })}
        </div>

        {wrong && (
          <div className="quiz-feedback wrong-fb">
            <p>
              <b>틀렸어요 😢 이번 기회가 사라졌어요.</b>
              <br />
              {q.explain}
            </p>
            <button type="button" onClick={close}>
              확인
            </button>
          </div>
        )}

        {correct && (
          <div className="quiz-feedback right-fb">
            <p>정답이에요! +{QUIZ_REWARD} 도토리</p>
            <button
              type="button"
              onClick={() => {
                done()
                passQuiz()
              }}
            >
              계속하기
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

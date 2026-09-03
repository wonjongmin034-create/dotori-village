import { useEffect, useState } from 'react'
import { QUIZ_REWARD } from './economy'
import { randomQuestion, type Question } from './questions'
import { useVillage } from './store'

// 돌봄(물주기·먹이주기·비료) 전에 뜨는 학습 문제.
export function Quiz() {
  const quiz = useVillage((s) => s.quiz)
  const passQuiz = useVillage((s) => s.passQuiz)
  const cancelQuiz = useVillage((s) => s.cancelQuiz)

  const [q, setQ] = useState<Question>(() => randomQuestion())
  const [picked, setPicked] = useState<number | null>(null)
  const [wrong, setWrong] = useState(false)

  // quiz 요청이 새로 들어올 때마다 새 문제로 초기화
  useEffect(() => {
    if (quiz) {
      setQ(randomQuestion())
      setPicked(null)
      setWrong(false)
    }
  }, [quiz])

  if (!quiz) return null

  const answered = picked !== null
  const correct = answered && picked === q.answer

  const choose = (i: number) => {
    if (answered && correct) return
    setPicked(i)
    setWrong(i !== q.answer)
  }

  const retry = () => {
    setQ((prev) => randomQuestion(prev))
    setPicked(null)
    setWrong(false)
  }

  return (
    <div className="quiz-overlay">
      <div className="quiz-card">
        <div className="quiz-top">
          <span className="quiz-sub">{q.subject}</span>
          <button type="button" className="quiz-x" onClick={cancelQuiz} aria-label="닫기">
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
            <p>{q.explain}</p>
            <button type="button" onClick={retry}>
              다른 문제 풀기
            </button>
          </div>
        )}

        {correct && (
          <div className="quiz-feedback right-fb">
            <p>정답이에요! +{QUIZ_REWARD} 도토리</p>
            <button type="button" onClick={passQuiz}>
              계속하기
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

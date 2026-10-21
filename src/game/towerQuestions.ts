import { WORDS } from './englishWords'
import { GRADE_BANK } from './gradeBank'
import { mathQ5 } from './mathGrade5'
import { englishQ, shuffle, type BossQ } from './bossQuestions'
import { TOWER_EN, TOWER_KO } from './towerBank'
import { QUIZ_MS, towerStage } from './towerData'

// 보물상자 문제 3개: 수학 1 + 영어 1 + 국어 1 (순서는 섞는다). 단계가 오를수록 어려워진다.
//  · 수학: 5학년 문제 생성기 (숫자가 매번 새로 만들어져서, 친구에게 답을 물어봐도 소용없다)
//  · 영어: 단어 뜻 → 문장 빈칸 → 철자 → 짧은 글 읽기
//  · 국어: 5학년 국어 문제 + 탑 전용 문제
// 정답은 이 기기 안에서만 확인한다 (혼자 하는 콘텐츠).

export type TowerQ = BossQ & { passage?: string }

const ri = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1))
const pickOne = <T,>(arr: readonly T[]): T => arr[ri(0, arr.length - 1)]

function mc(t: string, correct: string, wrongs: string[], cat: string, sub?: string, passage?: string): TowerQ {
  const o = shuffle([correct, ...wrongs.slice(0, 3)])
  return { k: 'mc', t, o, a: o.indexOf(correct), cat, sub, passage, ms: QUIZ_MS }
}

/* ---------- 수학 ---------- */
function math(stage: number): TowerQ {
  const lv = towerStage(stage).mathLv
  let q: BossQ
  if (stage === 1) q = mathQ5(1, 'mc')
  else if (stage === 2) q = mathQ5(2, 'mc')
  else if (stage === 3) q = mathQ5(2, Math.random() < 0.5 ? 'mc' : 'num')
  else if (stage === 4) q = mathQ5(3, 'mc')
  else q = mathQ5(3, Math.random() < 0.6 ? 'num' : 'mc') // 5단계 이후엔 직접 입력이 더 많다
  void lv
  return { ...q, cat: '수학', ms: QUIZ_MS }
}

/* ---------- 국어 ---------- */
function korean(stage: number): TowerQ {
  const lv = towerStage(stage).koLv
  const own = GRADE_BANK.filter((g) => g.c === '국어' && g.lv === lv).map((g) => ({ q: g.q, a: g.a, w: [...g.w] }))
  const extra = lv >= 2 ? TOWER_KO.filter((k) => k.lv === lv).map((k) => ({ q: k.q, a: k.a, w: [...k.w] })) : []
  const item = pickOne([...own, ...extra])
  return mc(item.q, item.a, item.w, '국어', '국어 문제')
}

/* ---------- 영어 ---------- */
const isWord = (s: string) => /^[a-z]+$/i.test(s)

function tiles(minLen: number, maxLen: number, decoys: number): TowerQ {
  const pool = WORDS.filter((w) => isWord(w.en) && w.en.length >= minLen && w.en.length <= maxLen)
  const w = pickOne(pool.length ? pool : WORDS.filter((x) => isWord(x.en)))
  const word = w.en.toLowerCase()
  const letters = word.split('')
  const abc = 'abcdefghijklmnopqrstuvwxyz'.split('').filter((c) => !letters.includes(c))
  const o = shuffle([...letters, ...shuffle(abc).slice(0, decoys)])
  return { k: 'tiles', t: w.ko, o, a: word, len: letters.length, cat: '영어', sub: '알파벳 타일을 눌러 영어 단어를 만들어 보세요', ms: QUIZ_MS }
}

function sentence(lv: 1 | 2 | 3, reading = false): TowerQ {
  const pool = TOWER_EN.filter((e) => e.lv === lv && (reading ? !!e.sub : !e.sub))
  const e = pickOne(pool)
  if (e.sub) return mc(e.q, e.a, e.w, '영어', '글을 읽고 알맞은 답을 골라요', e.sub)
  return mc(e.q, e.a, e.w, '영어', '빈칸에 알맞은 말은?')
}

function shortWord(minLen: number, maxLen: number): TowerQ {
  const idx = WORDS.map((w, i) => (w.en.length >= minLen && w.en.length <= maxLen ? i : -1)).filter((i) => i >= 0)
  const q = englishQ(pickOne(idx))
  return { ...q, ms: QUIZ_MS }
}

function english(stage: number): TowerQ {
  const r = Math.random()
  switch (stage) {
    case 1:
      return shortWord(2, 7)
    case 2:
      return r < 0.7 ? sentence(2) : shortWord(5, 9)
    case 3:
      return r < 0.5 ? sentence(2) : shortWord(8, 14)
    case 4:
      return r < 0.5 ? tiles(4, 6, 0) : sentence(3)
    case 5:
      return r < 0.5 ? sentence(3) : tiles(6, 9, 2)
    default:
      return r < 0.4 ? sentence(3, true) : r < 0.7 ? tiles(7, 10, 3) : sentence(3)
  }
}

export function towerQuiz(stage: number): TowerQ[] {
  return shuffle([math(stage), english(stage), korean(stage)])
}

// 답이 맞는지
export function judgeTower(q: TowerQ, pick: number | string | null): boolean {
  if (pick == null) return false
  if (q.k === 'tiles') return typeof pick === 'string' && pick.toLowerCase() === String(q.a)
  if (q.k === 'num') return typeof pick === 'string' && Math.abs(Number(pick) - Number(q.a)) < 1e-9
  return typeof pick === 'number' && pick === q.a
}

export const answerText = (q: TowerQ): string => (q.k === 'tiles' || q.k === 'num' ? String(q.a) : q.o[q.a as number])

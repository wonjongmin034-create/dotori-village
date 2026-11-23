import { WORDS } from './englishWords'
import { HISTORY } from './historyBank'
import { HISTORY2 } from './historyBank2'
import { GRADE_BANK } from './gradeBank'
import { DAILY_KO } from './dailyBankKo'
import { SPELLING } from './spellingBank'
import { mathQ5 } from './mathGrade5'
import { englishQ, mathQ, shuffle, type BossQ } from './bossQuestions'
import { QUIZ_LONG_MS, QUIZ_MS } from './defData'

// 수비대 문제 — 초등 5학년 수준의 영어 단어 · 수학 · 한국사 · 국어 어휘 · 받아쓰기.
//  7초 안에 풀 수 있는 짧은 보기 고르기만 낸다 (글이 길거나 받아쓰기는 9초).
//  받아쓰기는 낱말·문장을 소리로 읽어 주고(say), 바르게 쓴 것을 고른다. 소리가 안 나는 기기에서는 글로 낸다.

export type DefQ = BossQ & { say?: string }

function build(correct: string, wrongs: string[], t: string, sub: string, cat: string): DefQ {
  const uniq = [...new Set(wrongs.filter((w) => w && w !== correct))].slice(0, 3)
  const o = shuffle([correct, ...uniq])
  return { k: 'mc', t, o, a: o.indexOf(correct), sub, cat }
}

const short = (s: string, n: number) => s.length <= n

// 섞어서 한 장씩 (한 판 안에서 같은 문제가 덜 겹치게)
class Pile<T> {
  private items: T[]
  private order: T[] = []
  constructor(items: T[]) {
    this.items = items
  }
  next(): T {
    if (!this.order.length) this.order = shuffle(this.items)
    return this.order.pop()!
  }
}

const hist = new Pile([
  ...HISTORY.filter((h) => short(h.q, 46)).map((h) => ({ q: h.q, a: h.a, w: h.w })),
  ...HISTORY2.filter((h) => h.e <= 3 && short(h.q, 46)).map((h) => ({ q: h.q, a: h.a, w: h.w })),
])
const vocab = new Pile([
  ...GRADE_BANK.filter((g) => g.c === '국어' && g.lv <= 2 && short(g.q, 46) && !g.q.includes('맞춤법')).map((g) => ({ q: g.q, a: g.a, w: g.w as string[] })),
  ...DAILY_KO.filter((t) => short(t[0], 40) && [t[1], t[2], t[3], t[4]].every((x) => x.length <= 16)).map((t) => ({ q: t[0], a: t[1], w: [t[2], t[3], t[4]] })),
])
const dict = new Pile(SPELLING)
const words = new Pile(WORDS.map((_, i) => i))

function historyQ(): DefQ {
  const h = hist.next()
  return build(h.a, h.w, h.q, '한국사', '한국사')
}
function vocabQ(): DefQ {
  const v = vocab.next()
  return build(v.a, v.w, v.q, '국어 어휘', '국어')
}
// 받아쓰기: 낱말 문제는 그 낱말을, 빈칸 문장은 정답을 넣은 문장을 읽어 준다
function dictationQ(): DefQ {
  const s = dict.next()
  const m = s.q.match(/"([^"]*\(\s*\)[^"]*)"/)
  const say = m ? m[1].replace(/\(\s*\)/, s.a) : s.a
  const t = m ? `🔊 잘 듣고 빈칸에 바르게 쓴 것을 고르세요\n"${m[1]}"` : '🔊 잘 듣고 바르게 쓴 것을 고르세요'
  const q = build(s.a, [...s.w], t, '받아쓰기', '받아쓰기')
  return { ...q, say }
}
function englishWordQ(): DefQ {
  const q = englishQ(words.next()) as DefQ
  return { ...q, cat: '영어' }
}
function mathShortQ(): DefQ {
  if (Math.random() < 0.6) return { ...mathQ(), cat: '수학' }
  for (let i = 0; i < 6; i++) {
    const q = mathQ5(1, 'mc')
    if ((q.k ?? 'mc') === 'mc' && short(q.t, 40)) return { ...q, cat: '수학' }
  }
  return { ...mathQ(), cat: '수학' }
}

const MIX: [number, () => DefQ][] = [
  [0.25, englishWordQ],
  [0.25, mathShortQ],
  [0.2, historyQ],
  [0.15, vocabQ],
  [0.15, dictationQ],
]

export function defQuestion(): DefQ {
  let r = Math.random()
  let q: DefQ | null = null
  for (const [w, fn] of MIX) {
    if (r < w) {
      q = fn()
      break
    }
    r -= w
  }
  q ??= englishWordQ()
  const long = q.say != null || q.t.length > 26 || q.o.some((x) => x.length > 12)
  return { ...q, ms: long ? QUIZ_LONG_MS : QUIZ_MS }
}

export const publicDefQ = (q: DefQ): Omit<DefQ, 'a'> => {
  const { a, ...rest } = q
  void a
  return rest
}

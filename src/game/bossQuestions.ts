import { WORDS } from './englishWords'
import { HISTORY } from './historyBank'

// 보스가 내는 문제. 모두 보기 4개 중 하나를 고르는 방식 (태블릿에서 누르기 쉽게).
//  1단계: 계산(덧셈·뺄셈·곱셈·나눗셈) — 매번 새로 만들어서 외울 수 없다.
//  2단계: 영어 단어 — 뜻 고르기 / 영어 고르기를 섞는다. 한 판 안에서는 같은 단어가 다시 나오지 않는다.
//  3단계: 한국사 — 문제 은행에서 한 판 안에서 겹치지 않게 뽑고, 보기 순서를 섞는다.

export type BossQ = {
  t: string // 문제
  o: string[] // 보기 4개
  a: number // 정답 번호 (방장만 알고 있고, 다른 사람에게는 보내지 않는다)
  sub?: string // 문제 위에 작게 보이는 안내
}

const ri = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1))
export function shuffle<T>(arr: readonly T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = ri(0, i)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function build(correct: string, wrongs: string[], sub?: string, t = ''): BossQ {
  const uniq = [...new Set(wrongs.filter((w) => w !== correct))].slice(0, 3)
  const o = shuffle([correct, ...uniq])
  return { t, o, a: o.indexOf(correct), sub }
}

/* ---------- 1단계: 계산 ---------- */
function numWrongs(ans: number, extra: number[]): string[] {
  const pool = shuffle([...new Set([...extra, ans + 1, ans - 1, ans + 10, ans - 10, ans + 2, ans - 2])]).filter((n) => n > 0 && n !== ans)
  const out = pool.slice(0, 3)
  let k = 3
  while (out.length < 3) {
    const n = ans + k++
    if (n > 0 && n !== ans && !out.includes(n)) out.push(n)
  }
  return out.map(String)
}

export function mathQ(): BossQ {
  const r = Math.random()
  let t = ''
  let ans = 0
  let wrong: number[] = []
  if (r < 0.35) {
    // 구구단
    const a = ri(2, 9)
    const b = ri(2, 9)
    ans = a * b
    t = `${a} × ${b}`
    wrong = [a * (b + 1), a * (b - 1), (a + 1) * b, (a - 1) * b]
  } else if (r < 0.55) {
    const a = ri(12, 89)
    const b = ri(12, 89)
    ans = a + b
    t = `${a} + ${b}`
    wrong = [ans + 10, ans - 10, a + b + (a % 10 < 5 ? 1 : -1)]
  } else if (r < 0.75) {
    const a = ri(35, 99)
    const b = ri(11, a - 8)
    ans = a - b
    t = `${a} − ${b}`
    wrong = [ans + 10, ans - 10, a - b + (b % 10 > 4 ? 1 : -1)]
  } else {
    // 구구단 거꾸로 (나눗셈)
    const b = ri(2, 9)
    const q = ri(2, 9)
    ans = q
    t = `${b * q} ÷ ${b}`
    wrong = [q + 1, q - 1, q + 2, q - 2, b]
  }
  return build(String(ans), numWrongs(ans, wrong), '계산해 보세요!', `${t} = ?`)
}

/* ---------- 2단계: 영어 단어 ---------- */
const overlaps = (a: string, b: string) => a === b || a.includes(b) || b.includes(a)

export function englishQ(idx: number): BossQ {
  const w = WORDS[idx]
  const toKo = Math.random() < 0.55
  const pool = shuffle(WORDS.filter((x) => x !== w && !overlaps(x.ko, w.ko) && !overlaps(x.en.toLowerCase(), w.en.toLowerCase())))
  if (toKo) return build(w.ko, pool.slice(0, 6).map((x) => x.ko), '이 단어의 뜻은?', w.en)
  return build(w.en, pool.slice(0, 6).map((x) => x.en), '뜻에 맞는 영어 단어는?', w.ko)
}

/* ---------- 3단계: 한국사 ---------- */
export function historyQ(idx: number): BossQ {
  const h = HISTORY[idx]
  return build(h.a, [...h.w], '한국사 문제', h.q)
}

/* ---------- 한 판 동안 쓰는 "카드 더미" (같은 문제가 다시 나오지 않게) ---------- */
export class Deck {
  private order: number[] = []
  private pos = 0
  private stage: number
  constructor(stage: number) {
    this.stage = stage
    this.refill()
  }
  private refill() {
    const n = this.stage === 2 ? WORDS.length : this.stage === 3 ? HISTORY.length : 0
    this.order = shuffle([...Array(n).keys()])
    this.pos = 0
  }
  next(): BossQ {
    if (this.stage === 1) return mathQ()
    if (this.pos >= this.order.length) this.refill()
    const i = this.order[this.pos++]
    return this.stage === 2 ? englishQ(i) : historyQ(i)
  }
}

import { WORDS } from './englishWords'
import { HISTORY } from './historyBank'
import { GRADE_BANK } from './gradeBank'
import { mathQ5 } from './mathGrade5'
import { orderQ } from './orderBank'
import { formulaQ, shapeQ, ultShapeQ, type Figure } from './bossShapes'
import { SPELLING } from './spellingBank'
import { DAILY_ENGLISH } from './dailyEnglish'

// 보스가 내는 문제.
//  1단계: 계산 — 매번 새로 만든 4지선다
//  2단계: 영어 단어 — 뜻 고르기/영어 고르기
//  3단계: 한국사 — 문제 은행
//  4단계(종합): 위의 모두 + 5학년 수학·국어·사회·과학 + 글자 타일·순서 맞히기·숫자 입력 + 가위바위보·홀짝.
//               보스 체력이 줄어 페이즈(lv)가 올라갈수록 어려운 문제가 나온다.
// 한 판 안에서는 같은 문제가 다시 나오지 않는다 (카드 더미).

export type QKind = 'mc' | 'tiles' | 'order' | 'num' | 'rps' | 'oe'
// 정답: mc/rps/oe = 보기 번호, tiles = 만든 단어, num = 숫자 글자, order = 보기 번호를 맞는 순서로 나열한 목록
export type Answer = number | string | number[] | null

export type BossQ = {
  k?: QKind // 없으면 보기 고르기(mc)
  t: string // 문제
  o: string[] // 보기 (tiles 는 섞인 글자, order 는 섞인 항목, num 은 비어 있음)
  a: Answer // 정답 — 방장만 알고 있고, 다른 사람에게는 보내지 않는다
  sub?: string // 문제 위에 작게 보이는 안내
  ms?: number // 이 문제의 제한 시간 (없으면 단계 기본값)
  cat?: string // 과목 이름표 (종합 보스에서 보인다)
  len?: number // (tiles) 만들어야 하는 단어의 글자 수
  fig?: Figure // 문제 위에 그려 주는 도형 그림 (5단계)
}
export type PublicQ = Omit<BossQ, 'a'>
export const publicOf = (q: BossQ): PublicQ => {
  const { a, ...rest } = q
  void a
  return rest
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

function build(correct: string, wrongs: string[], sub?: string, t = '', cat?: string): BossQ {
  const uniq = [...new Set(wrongs.filter((w) => w !== correct))].slice(0, 3)
  const o = shuffle([correct, ...uniq])
  return { k: 'mc', t, o, a: o.indexOf(correct), sub, cat }
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
  return build(String(ans), numWrongs(ans, wrong), '계산해 보세요!', `${t} = ?`, '계산')
}

/* ---------- 2단계: 영어 단어 ---------- */
const overlaps = (a: string, b: string) => a === b || a.includes(b) || b.includes(a)

export function englishQ(idx: number): BossQ {
  const w = WORDS[idx]
  const toKo = Math.random() < 0.55
  const pool = shuffle(WORDS.filter((x) => x !== w && !overlaps(x.ko, w.ko) && !overlaps(x.en.toLowerCase(), w.en.toLowerCase())))
  if (toKo) return build(w.ko, pool.slice(0, 6).map((x) => x.ko), '이 단어의 뜻은?', w.en, '영어')
  return build(w.en, pool.slice(0, 6).map((x) => x.en), '뜻에 맞는 영어 단어는?', w.ko, '영어')
}

/* ---------- 3단계: 한국사 ---------- */
export function historyQ(idx: number): BossQ {
  const h = HISTORY[idx]
  return build(h.a, [...h.w], '한국사 문제', h.q, '한국사')
}

/* ---------- 4단계(종합) 재료 ---------- */

// 같은 문제가 다시 나오지 않게 섞어서 한 장씩 넘기는 더미
class Cycler {
  private order: number[] = []
  private pos = 0
  private items: number[]
  constructor(items: number[]) {
    this.items = items
  }
  next(): number {
    if (this.items.length === 0) return -1
    if (this.pos >= this.order.length) {
      this.order = shuffle(this.items)
      this.pos = 0
    }
    return this.order[this.pos++]
  }
}

const isWord = (s: string) => /^[a-z]+$/i.test(s)
const idxs = (pred: (w: { en: string; ko: string }) => boolean) => WORDS.map((w, i) => (pred(w) ? i : -1)).filter((i) => i >= 0)

export function rpsQ(): BossQ {
  return { k: 'rps', t: '가위 바위 보!', o: ['가위', '바위', '보'], a: null, sub: '보스와 가위바위보! 이기면 큰 피해, 지면 팀 생명이 줄어요', ms: 6000, cat: '🎲 가위바위보' }
}
export function oeQ(): BossQ {
  return { k: 'oe', t: '보스가 도토리를 몇 개 숨겼을까?', o: ['홀수', '짝수'], a: null, sub: '홀수일까 짝수일까? 맞히면 공격, 틀리면 팀 생명이 줄어요', ms: 6000, cat: '🎲 홀짝' }
}

// 알파벳 타일로 단어 만들기 (decoys = 정답에 없는 가짜 글자 개수)
function tilesQ(w: { en: string; ko: string }, decoys: number): BossQ {
  const word = w.en.toLowerCase()
  const letters = word.split('')
  const abc = 'abcdefghijklmnopqrstuvwxyz'.split('').filter((c) => !letters.includes(c))
  const extra = shuffle(abc).slice(0, decoys)
  return { k: 'tiles', t: w.ko, o: shuffle([...letters, ...extra]), a: word, sub: '알파벳 타일을 눌러 영어 단어를 만들어 보세요', ms: decoys ? 22_000 : 18_000, cat: '영어', len: word.length }
}

class MixedDeck {
  private hist = new Cycler(HISTORY.map((_, i) => i))
  private mcWords = {
    1: new Cycler(idxs((w) => w.en.length <= 7)),
    2: new Cycler(idxs((w) => w.en.length >= 5 && w.en.length <= 9)),
    3: new Cycler(idxs((w) => w.en.length >= 8)),
  }
  private tileWords = {
    mid: new Cycler(idxs((w) => isWord(w.en) && w.en.length >= 4 && w.en.length <= 6)),
    long: new Cycler(idxs((w) => isWord(w.en) && w.en.length >= 7 && w.en.length <= 10)),
  }
  private grade = new Map<string, Cycler>()
  private lastMini = false

  private gradeQ(c: '국어' | '사회' | '과학', lv: 1 | 2 | 3): BossQ {
    const key = `${c}${lv}`
    let cy = this.grade.get(key)
    if (!cy) {
      cy = new Cycler(GRADE_BANK.map((g, i) => (g.c === c && g.lv === lv ? i : -1)).filter((i) => i >= 0))
      this.grade.set(key, cy)
    }
    const g = GRADE_BANK[cy.next()]
    return build(g.a, [...g.w], `${c} 문제`, g.q, c)
  }
  private english(lv: 1 | 2 | 3): BossQ {
    return englishQ(this.mcWords[lv].next())
  }
  private history(): BossQ {
    return historyQ(this.hist.next())
  }
  private tiles(kind: 'mid' | 'long', decoys: number): BossQ {
    return tilesQ(WORDS[this.tileWords[kind].next()], decoys)
  }

  next(lv: 1 | 2 | 3): BossQ {
    // 가위바위보·홀짝 (두 번 연달아 나오지는 않는다)
    const mini = [0.1, 0.15, 0.22][lv - 1]
    if (!this.lastMini && Math.random() < mini) {
      this.lastMini = true
      const m = Math.random() < 0.5 ? rpsQ() : oeQ()
      m.ms = timeFor(m, lv)
      return m
    }
    this.lastMini = false

    const table: [number, () => BossQ][] =
      lv === 1
        ? [
            [0.22, () => mathQ5(1)],
            [0.14, () => this.gradeQ('국어', 1)],
            [0.12, () => this.gradeQ('사회', 1)],
            [0.14, () => this.gradeQ('과학', 1)],
            [0.1, () => ({ ...mathQ(), ms: 8000 })],
            [0.14, () => this.english(1)],
            [0.14, () => this.history()],
          ]
        : lv === 2
          ? [
              [0.18, () => mathQ5(2, 'mc')],
              [0.1, () => this.gradeQ('국어', 2)],
              [0.08, () => this.gradeQ('사회', 2)],
              [0.1, () => this.gradeQ('과학', 2)],
              [0.14, () => this.tiles('mid', 0)],
              [0.1, () => this.history()],
              [0.12, () => orderQ(2)],
              [0.08, () => this.english(2)],
              [0.1, () => mathQ5(2, 'num')],
            ]
          : [
              [0.12, () => mathQ5(3, 'mc')],
              [0.12, () => mathQ5(3, 'num')],
              [0.08, () => this.gradeQ('국어', 3)],
              [0.08, () => this.gradeQ('사회', 3)],
              [0.1, () => this.gradeQ('과학', 3)],
              [0.16, () => this.tiles('long', 2)],
              [0.08, () => this.history()],
              [0.16, () => orderQ(3)],
              [0.1, () => this.english(3)],
            ]
    let r = Math.random()
    let q: BossQ = table[table.length - 1][1]()
    for (const [w, fn] of table) {
      if (r < w) {
        q = fn()
        break
      }
      r -= w
    }
    q.ms = timeFor(q, lv) // 페이즈가 오를수록 촉박해진다
    return q
  }
}

// 제한 시간 — 페이즈(lv)가 오를수록 짧아진다. 마지막(3페이즈)은 보기 고르기 4초.
//  · 보기 고르기: 8초 → 6초 → 4초 (문제 글이 길면 읽는 시간을 조금 더 준다)
//  · 가위바위보·홀짝: 5초 → 4초 → 3초
//  · 글자 타일·순서·숫자 입력은 손으로 여러 번 눌러야 해서, 같은 5초로는 불가능하니 따로 정한다 (직접 쓰는 문제는 넉넉하게)
//      숫자 입력 22초 → 17초 → 13초 · 글자 타일 13초 → 13초 → 9.5초 · 순서 15초 → 15초 → 12초
export function timeFor(q: BossQ, lv: 1 | 2 | 3): number {
  const k = q.k ?? 'mc'
  const i = lv - 1
  if (k === 'rps' || k === 'oe') return [5000, 4000, 3000][i]
  if (k === 'num') return [22_000, 17_000, 13_000][i]
  if (k === 'tiles') return lv === 3 ? 9500 + Math.max(0, (q.len ?? 7) - 7) * 700 : 13_000
  if (k === 'order') return lv === 3 ? 12_000 : 15_000
  const base = [8000, 6000, 4000][i]
  const longText = q.t.length > 26 ? [2500, 2000, 1500][i] : 0
  const longOpt = q.o.some((x) => x.length > 12) ? 1200 : 0
  return base + longText + longOpt
}

/* ---------- 5단계: 도형 · 영어 · 맞춤법 (라운드제) ---------- */
class RoundDeck {
  private words = {
    1: new Cycler(idxs((w) => w.en.length <= 7)),
    2: new Cycler(idxs((w) => w.en.length >= 5 && w.en.length <= 9)),
    3: new Cycler(idxs((w) => w.en.length >= 7)),
  }
  private tileWords = {
    mid: new Cycler(idxs((w) => isWord(w.en) && w.en.length >= 4 && w.en.length <= 6)),
    long: new Cycler(idxs((w) => isWord(w.en) && w.en.length >= 7 && w.en.length <= 10)),
  }
  private spell = new Cycler(SPELLING.map((_, i) => i))
  private daily = new Cycler(DAILY_ENGLISH.map((_, i) => i))

  private spelling(lv: 1 | 2 | 3): BossQ {
    const s = SPELLING[this.spell.next()]
    const q = build(s.a, [...s.w], '맞춤법 문제', s.q, '맞춤법')
    q.ms = [10_000, 9_000, 8_000][lv - 1]
    return q
  }
  private everyday(lv: 1 | 2 | 3): BossQ {
    const d = DAILY_ENGLISH[this.daily.next()]
    const q = build(d.a, [...d.w], '영어 일상표현', d.q, '영어 표현')
    q.ms = [14_000, 12_000, 10_000][lv - 1]
    return q
  }
  private word(lv: 1 | 2 | 3): BossQ {
    const q = englishQ(this.words[lv].next())
    q.ms = [9_000, 7_000, 6_000][lv - 1]
    return q
  }
  private tiles(kind: 'mid' | 'long', decoys: number): BossQ {
    const q = tilesQ(WORDS[this.tileWords[kind].next()], decoys)
    q.ms = 14_000 + Math.max(0, (q.len ?? 6) - 6) * 800
    return q
  }
  private mini(lv: 1 | 2 | 3): BossQ {
    const m = Math.random() < 0.5 ? rpsQ() : oeQ()
    m.ms = [6_000, 5_000, 4_000][lv - 1]
    return m
  }

  // n = 몇 번째 문제인지 (3번째마다 가위바위보·홀짝)
  next(lv: 1 | 2 | 3, n: number): BossQ {
    if (n > 0 && n % 3 === 0) return this.mini(lv)
    const table: [number, () => BossQ][] =
      lv === 1
        ? [
            [0.45, () => shapeQ(1)],
            [0.25, () => formulaQ(14_000)],
            [0.15, () => this.word(1)],
            [0.15, () => this.spelling(1)],
          ]
        : lv === 2
          ? [
              [0.25, () => this.word(2)],
              [0.15, () => this.tiles('mid', 0)],
              [0.28, () => this.spelling(2)],
              [0.2, () => shapeQ(2)],
              [0.12, () => this.everyday(2)],
            ]
          : [
              [0.25, () => this.everyday(3)],
              [0.25, () => shapeQ(3)],
              [0.1, () => formulaQ(10_000)],
              [0.15, () => this.spelling(3)],
              [0.15, () => this.tiles('long', 2)],
              [0.1, () => this.word(3)],
            ]
    let r = Math.random()
    for (const [w, fn] of table) {
      if (r < w) return fn()
      r -= w
    }
    return table[table.length - 1][1]()
  }

  ult(): BossQ {
    return ultShapeQ()
  }
}

/* ---------- 한 판 동안 쓰는 "카드 더미" (같은 문제가 다시 나오지 않게) ---------- */
export class Deck {
  private rounds: RoundDeck | null = null
  private order: number[] = []
  private pos = 0
  private stage: number
  private mixed: MixedDeck | null = null
  constructor(stage: number) {
    this.stage = stage
    if (stage >= 5) this.rounds = new RoundDeck()
    else if (stage >= 4) this.mixed = new MixedDeck()
    else this.refill()
  }
  private refill() {
    const n = this.stage === 2 ? WORDS.length : this.stage === 3 ? HISTORY.length : 0
    this.order = shuffle([...Array(n).keys()])
    this.pos = 0
  }
  // 필살기(전원 동시) 문제 — 5단계만
  ult(): BossQ {
    return this.rounds ? this.rounds.ult() : this.next(3)
  }
  next(lv: 1 | 2 | 3 = 1, n = 0): BossQ {
    if (this.rounds) return this.rounds.next(lv, n)
    if (this.mixed) return this.mixed.next(lv)
    if (this.stage === 1) return mathQ()
    if (this.pos >= this.order.length) this.refill()
    const i = this.order[this.pos++]
    return this.stage === 2 ? englishQ(i) : historyQ(i)
  }
}

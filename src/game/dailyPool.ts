import type { Question, Subject } from './questions'
import { GRADE_BANK } from './gradeBank'
import { HISTORY } from './historyBank'
import { TOWER_EN, TOWER_KO } from './towerBank'
import { SPELLING } from './spellingBank'
import { DAILY_ENGLISH } from './dailyEnglish'
import { WORDS } from './englishWords'
import { mathQ5 } from './mathGrade5'
import { DAILY_SCI, DAILY_SOC, type Tup } from './dailyBank'
import { DAILY_KO } from './dailyBankKo'
import { DAILY_SCI2 } from './dailyBankSci2'

// 오늘의 학습 새 문제 (NEW_DAILY_FROM 날짜부터).
//  · 문제 은행이 크다: 국어·사회·과학·영어는 수백 문제를 한 번씩 돌려 쓰고, 수학은 매일 숫자를 새로 만든다.
//  · "앞으로 안 겹치게": 과목마다 문제를 고정된 순서로 섞어 두고, 날짜 번호에 따라 차례대로 꺼낸다.
//    → 은행을 한 바퀴 다 돌기 전에는 같은 문제가 다시 나오지 않는다 (같은 반 학생은 같은 날 같은 문제를 푼다).
//  · "정답 번호 골고루": 하루 20문제의 정답 번호(①~④)가 5개씩 되도록 보기 순서를 정한다.

export const NEW_DAILY_FROM = '2026-10-29'

/* ---------- 날짜로 정해지는 난수 (같은 날이면 모든 기기에서 같다) ---------- */
function hashStr(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
function rng(seed: string): () => number {
  let a = hashStr(seed) || 1
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
function seededShuffle<T>(arr: readonly T[], seed: string): T[] {
  const r = rng(seed)
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
// 수학 문제 생성기는 Math.random 을 쓰므로, 잠깐 날짜 난수로 바꿔 끼운다 (끝나면 바로 되돌린다)
function withSeed<T>(seed: string, fn: () => T): T {
  const orig = Math.random
  Math.random = rng(seed)
  try {
    return fn()
  } finally {
    Math.random = orig
  }
}
const dayNum = (k: string) => {
  const [y, m, d] = k.split('-').map(Number)
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000)
}

/* ---------- 문제 은행 (과목별로 한 줄 목록) ---------- */
type Item = { id: string; q: string; a: string; w: string[]; x: string }
const tup = (prefix: string, list: readonly Tup[]): Item[] =>
  list.map(([q, a, w1, w2, w3, x], i) => ({ id: `${prefix}${i}`, q, a, w: [w1, w2, w3], x: x ?? `정답은 "${a}"예요.` }))
const pool = <T extends { q: string; a: string; w: readonly string[] }>(prefix: string, list: readonly T[], take?: (t: T) => boolean): Item[] =>
  list.flatMap((t, i) => (take && !take(t) ? [] : [{ id: `${prefix}${i}`, q: t.q, a: t.a, w: [...t.w], x: `정답은 "${t.a}"예요.` }]))

let cache: Record<string, Item[]> | null = null
function banks(): Record<string, Item[]> {
  if (cache) return cache
  const ko = [
    ...pool('g', GRADE_BANK, (g) => g.c === '국어'),
    ...pool('k', TOWER_KO),
    ...pool('s', SPELLING),
    ...tup('n', DAILY_KO),
  ]
  const soc = [...pool('g', GRADE_BANK, (g) => g.c === '사회'), ...pool('h', HISTORY), ...tup('n', DAILY_SOC)]
  const sci = [...pool('g', GRADE_BANK, (g) => g.c === '과학'), ...tup('n', DAILY_SCI), ...tup('x', DAILY_SCI2)]
  const expr = pool('e', DAILY_ENGLISH)
  const sent = TOWER_EN.flatMap((e, i) =>
    e.sub ? [] : [{ id: `t${i}`, q: `빈칸에 알맞은 말은?  ${e.q}`, a: e.a, w: [...e.w], x: `정답은 "${e.a}"예요.` }],
  )
  // 여러 은행에 같은 문제가 있으면 한 번만 쓴다 (문제 글과 정답이 같은 것)
  const uniq = (list: Item[]) => {
    const seen = new Set<string>()
    return list.filter((it) => {
      const k = `${it.q}|${it.a}`
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
  }
  const shuffle = (name: string, list: Item[]) => seededShuffle(uniq(list), `daily|${name}|v1`)
  cache = { 국어: shuffle('ko', ko), 사회: shuffle('soc', soc), 과학: shuffle('sci', sci), 영문: shuffle('en', [...expr, ...sent]) }
  return cache
}

// 은행에서 차례대로 count개 (은행을 한 바퀴 돌 때까지 겹치지 않는다)
function take(list: Item[], start: number, count: number): Item[] {
  return Array.from({ length: count }, (_, i) => list[(start + i) % list.length])
}

/* ---------- 영어 단어 문제 (단어 709개 중에서 차례대로) ---------- */
let wordOrder: number[] | null = null
const overlaps = (a: string, b: string) => a === b || a.includes(b) || b.includes(a)
function wordItem(order: number, salt: string): Item {
  wordOrder ??= seededShuffle(WORDS.map((_, i) => i), 'daily|words|v1')
  const wi = wordOrder[order % wordOrder.length]
  const w = WORDS[wi]
  const toKo = order % 2 === 0
  const r = seededShuffle(WORDS.map((_, i) => i), `${salt}|${wi}`)
  const others = r.map((i) => WORDS[i]).filter((x) => x !== w && !overlaps(x.ko, w.ko) && !overlaps(x.en.toLowerCase(), w.en.toLowerCase()))
  return toKo
    ? { id: `w${wi}`, q: `영어 단어 "${w.en}"의 뜻은?`, a: w.ko, w: others.slice(0, 3).map((x) => x.ko), x: `${w.en} = ${w.ko}` }
    : { id: `w${wi}`, q: `뜻이 "${w.ko}"인 영어 단어는?`, a: w.en, w: others.slice(0, 3).map((x) => x.en), x: `${w.ko} = ${w.en}` }
}

/* ---------- 과목별로 그날의 문제 뽑기 ---------- */
function itemsFor(sub: Subject, dayKey: string, count: number, per: number): Item[] {
  const d = Math.max(0, dayNum(dayKey) - dayNum(NEW_DAILY_FROM))
  const b = banks()
  if (count <= 0) return []
  if (sub === '영어') {
    // 단어 2개 + 일상표현·문장 빈칸 2개 (모자라면 단어로 채운다)
    const list: Item[] = [wordItem(d * 2, dayKey), wordItem(d * 2 + 1, dayKey), ...take(b.영문, d * 2, 2)]
    for (let i = list.length; i < count; i++) list.push(wordItem(d * per + i + 7, dayKey))
    return list.slice(0, count)
  }
  return take(b[sub], d * per, count)
}

// 수학: 매일 숫자를 새로 만든다 (날짜가 같으면 모든 기기에서 같은 문제). 쉬움 2개 + 보통 2개.
// 시작일부터 하루씩 차례로 만들면서, 지난 60일에 실제로 나간 문제와 같은 글이 나오면 숫자를 다시 만든다.
const mathBase = (dayKey: string, i: number, salt: number) => withSeed(`${dayKey}|math|${i}|${salt}`, () => mathQ5(i < 2 ? 1 : 2, 'mc'))
const dayKeyOf = (n: number) => new Date(n * 86_400_000).toISOString().slice(0, 10)
const mathSalts = new Map<number, number[]>() // 날짜 번호 → 문제마다 몇 번째 시도를 썼는지
const mathTexts = new Map<number, string[]>()
function ensureMath(upTo: number) {
  for (let dn = dayNum(NEW_DAILY_FROM); dn <= upTo; dn++) {
    if (mathSalts.has(dn)) continue
    const k = dayKeyOf(dn)
    const recent = new Set<string>()
    for (let back = 1; back <= 60; back++) for (const t of mathTexts.get(dn - back) ?? []) recent.add(t)
    const salts: number[] = []
    const texts: string[] = []
    for (let i = 0; i < 4; i++) {
      let salt = 0
      let q = mathBase(k, i, 0)
      while (salt < 12 && (recent.has(q.t) || texts.includes(q.t))) q = mathBase(k, i, ++salt)
      salts.push(salt)
      texts.push(q.t)
    }
    mathSalts.set(dn, salts)
    mathTexts.set(dn, texts)
  }
}
function mathItems(dayKey: string, count: number): Item[] {
  const today = dayNum(dayKey)
  ensureMath(today)
  const salts = mathSalts.get(today) ?? [0, 0, 0, 0]
  return Array.from({ length: count }, (_, i) => {
    const q = mathBase(dayKey, i, salts[i] ?? 0)
    const a = q.o[q.a as number]
    return {
      id: `m${i}`,
      q: q.sub && !q.t.includes(q.sub) ? `${q.t}  (${q.sub})` : q.t,
      a,
      w: q.o.filter((_, k) => k !== q.a),
      x: `정답은 ${a}예요. 차근차근 다시 계산해 보세요.`,
    }
  })
}

/* ---------- 하루 문제 만들기 ---------- */
// custom: 선생님이 그 반에 추가한 문제(과목별, 이미 그날 순서로 정렬됨). 먼저 채우고 모자라는 만큼 기본 은행에서 뽑는다.
export function newDailySet(dayKey: string, per: number, custom: Record<Subject, Question[]>): Question[] {
  const SUBJ: Subject[] = ['국어', '수학', '사회', '과학', '영어']
  type Slot = { sub: Subject; item: Item } | { fixed: Question }
  const slots: Slot[] = []
  for (const sub of SUBJ) {
    const mine = custom[sub].slice(0, per)
    for (const q of mine) slots.push({ fixed: q })
    const need = per - mine.length
    const items = sub === '수학' ? mathItems(dayKey, need) : itemsFor(sub, dayKey, need, per)
    for (const item of items) slots.push({ sub, item })
  }
  // 정답 번호(0~3)가 골고루: 0,1,2,3 을 되풀이한 목록을 날짜로 섞어서 한 문제씩 나눠 준다
  const n = slots.filter((s) => 'item' in s).length
  const base = Array.from({ length: n }, (_, i) => i % 4)
  let targets = seededShuffle(base, `${dayKey}|answers`)
  // 같은 번호가 세 번 이상 이어지지 않는 배치를 찾는다 (없으면 마지막 것을 쓴다)
  for (let tries = 1; tries < 60 && targets.some((v, i) => i >= 2 && v === targets[i - 1] && v === targets[i - 2]); tries++) {
    targets = seededShuffle(base, `${dayKey}|answers|${tries}`)
  }
  let t = 0
  return slots.map((s) => {
    if ('fixed' in s) return s.fixed
    const { item } = s
    const wrongs = seededShuffle(item.w, `${dayKey}|${item.id}`).slice(0, 3)
    const pos = Math.min(targets[t++], wrongs.length)
    const choices = [...wrongs]
    choices.splice(pos, 0, item.a)
    return { id: `n:${s.sub}:${item.id}`, subject: s.sub, q: item.q, choices, answer: pos, explain: item.x }
  })
}

// 점검용: 과목별 은행 크기와, 같은 문제 없이 며칠 갈 수 있는지
export function dailyBankStats(per = 4) {
  const b = banks()
  return { 국어: b.국어.length, 사회: b.사회.length, 과학: b.과학.length, '영어표현·문장': b.영문.length, 영어단어: WORDS.length, days: Math.min(Math.floor(b.국어.length / per), Math.floor(b.사회.length / per), Math.floor(b.과학.length / per), Math.floor(b.영문.length / 2)) }
}

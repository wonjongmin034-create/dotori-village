// 4단계 종합 보스용 — 초등학교 5학년 수학 문제 생성기 (자연수 혼합 계산 · 약수와 배수 · 약분과 통분 · 분수의 덧셈과 뺄셈 ·
// 다각형의 둘레와 넓이 · 어림하기 · 소수의 곱셈 · 평균 · 가능성 · 직육면체 · 규칙과 대응)
// 문제를 매번 새로 만들어서 외울 수 없고, lv(1 쉬움·2 보통·3 어려움)에 따라 어려운 문제가 나온다.
// 보기 4개짜리(mc)와 숫자를 직접 입력하는(num) 두 가지로 만든다.
import type { BossQ } from './bossQuestions'

const ri = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1))
const pick = <T,>(arr: readonly T[]): T => arr[ri(0, arr.length - 1)]
function shuffle<T>(arr: readonly T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = ri(0, i)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
export const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a)
export const lcm = (a: number, b: number) => (a / gcd(a, b)) * b

const CAT = '수학'

// 보기 4개 (정답 + 오답 3개). 오답은 값이 정답과 같으면 안 된다.
function mc(t: string, correct: string, wrongs: string[], sub?: string): BossQ {
  const uniq = [...new Set(wrongs.filter((w) => w !== correct))].slice(0, 3)
  let n = 1
  while (uniq.length < 3 && !Number.isNaN(Number(correct))) {
    const alt = String(Number(correct) + n * (n % 2 ? 1 : -1) * ri(1, 3))
    n++
    if (alt !== correct && !uniq.includes(alt) && Number(alt) >= 0) uniq.push(alt)
    if (n > 40) break
  }
  const o = shuffle([correct, ...uniq])
  return { k: 'mc', t, o, a: o.indexOf(correct), sub: sub ?? '계산해 보세요', cat: CAT }
}
// 숫자를 직접 입력
function num(t: string, ans: number | string, sub?: string): BossQ {
  return { k: 'num', t, o: [], a: String(ans), sub: sub ?? '답을 숫자로 눌러 보세요', cat: CAT }
}

/* ---------- 분수 도우미 ---------- */
type Fr = [number, number] // [분자, 분모]
const reduce = ([n, d]: Fr): Fr => {
  const g = gcd(Math.abs(n), d) || 1
  return [n / g, d / g]
}
const fs = ([n, d]: Fr) => (d === 1 ? String(n) : `${n}/${d}`)
const val = ([n, d]: Fr) => n / d
function fracWrongs(ans: Fr, cands: Fr[]): string[] {
  const out: string[] = []
  for (const c of shuffle(cands)) {
    if (c[1] <= 0 || c[0] <= 0) continue
    if (Math.abs(val(c) - val(ans)) < 1e-9) continue // 값이 같으면(예: 10/12) 정답과 헷갈리니 뺀다
    const s = fs(reduce(c))
    if (!out.includes(s) && s !== fs(ans)) out.push(s)
  }
  // 모자라면 가까운 분수로 채운다
  for (let k = 1; out.length < 3 && k < 20; k++) {
    const c = reduce([ans[0] + k, ans[1]])
    const s = fs(c)
    if (!out.includes(s) && s !== fs(ans) && Math.abs(val(c) - val(ans)) > 1e-9) out.push(s)
  }
  return out
}

/* ============ lv 1 (쉬움) ============ */
function mix1(): BossQ {
  const a = ri(5, 30)
  const b = ri(2, 9)
  const c = ri(2, 9)
  const ans = a + b * c
  return mc(`${a} + ${b} × ${c} = ?`, String(ans), [String((a + b) * c), String(a + b + c), String(a * b + c), String(ans + 10)], '곱셈을 먼저 계산해요')
}
function mul1(): BossQ {
  const a = ri(12, 49)
  const b = ri(3, 9)
  const ans = a * b
  return mc(`${a} × ${b} = ?`, String(ans), [String(ans + 10), String(ans - 10), String(ans + b), String(ans - b)])
}
function div1(): BossQ {
  const b = ri(3, 9)
  const q = ri(12, 99)
  return mc(`${b * q} ÷ ${b} = ?`, String(q), [String(q + 1), String(q - 1), String(q + 10), String(q - 10)])
}
function factor1(): BossQ {
  const n = pick([12, 16, 18, 20, 24, 30, 36])
  const divs = Array.from({ length: n }, (_, i) => i + 1).filter((d) => n % d === 0 && d < n)
  const non = Array.from({ length: n - 1 }, (_, i) => i + 2).filter((d) => n % d !== 0 && d < n)
  const bad = pick(non)
  const good = shuffle(divs.filter((d) => d !== 1)).slice(0, 3)
  const o = shuffle([String(bad), ...good.map(String)])
  return { k: 'mc', t: `${n}의 약수가 아닌 것은?`, o, a: o.indexOf(String(bad)), sub: '약수란 나누어떨어지게 하는 수예요', cat: CAT }
}
function multiple1(): BossQ {
  const k = pick([3, 4, 6, 7, 8, 9])
  const good = k * ri(3, 12)
  const bads: number[] = []
  while (bads.length < 3) {
    const x = good + ri(-12, 12)
    if (x > 0 && x % k !== 0 && !bads.includes(x)) bads.push(x)
  }
  const o = shuffle([String(good), ...bads.map(String)])
  return { k: 'mc', t: `${k}의 배수는 어느 것일까요?`, o, a: o.indexOf(String(good)), sub: '배수란 어떤 수를 1배, 2배, 3배… 한 수예요', cat: CAT }
}
function avg1(): BossQ {
  for (;;) {
    const a = ri(3, 15)
    const b = ri(3, 15)
    const c = ri(3, 15)
    if ((a + b + c) % 3 === 0) {
      const m = (a + b + c) / 3
      return mc(`${a}, ${b}, ${c}의 평균은?`, String(m), [String(m + 1), String(m - 1), String(a + b + c), String(m + 2)], '평균 = 모두 더한 값 ÷ 개수')
    }
  }
}

/* ============ lv 2 (보통) ============ */
function gcd2(): BossQ {
  for (;;) {
    const g = ri(2, 9)
    const x = g * ri(2, 6)
    const y = g * ri(2, 6)
    if (x === y) continue
    const G = gcd(x, y)
    return mc(`${x}와 ${y}의 최대공약수는?`, String(G), [String(G * 2), String(Math.max(1, G - 1)), String(G + 1), '1'], '두 수의 공약수 중 가장 큰 수')
  }
}
function lcm2(): BossQ {
  for (;;) {
    const x = ri(3, 12)
    const y = ri(3, 12)
    if (x === y) continue
    const L = lcm(x, y)
    return mc(`${x}와 ${y}의 최소공배수는?`, String(L), [String(x * y), String(L + x), String(L - 1), String(gcd(x, y))].filter((v) => v !== String(L)), '두 수의 공배수 중 가장 작은 수')
  }
}
function reduce2(): BossQ {
  for (;;) {
    const q = ri(2, 9)
    const p = ri(1, q - 1)
    if (gcd(p, q) !== 1) continue
    const k = ri(2, 5)
    const ans: Fr = [p, q]
    const wr = fracWrongs(ans, [[p, q + 1], [p + 1, q], [p * k, q * k + 1], [q, p], [p, q * 2], [p + 1, q + 1]])
    return mc(`${p * k}/${q * k}을(를) 약분하여 가장 간단한 분수로 나타내면?`, fs(ans), wr, '분자와 분모를 같은 수로 나누어요')
  }
}
function compare2(): BossQ {
  for (;;) {
    const d1 = ri(2, 9)
    const d2 = ri(2, 9)
    const n1 = ri(1, d1 - 1)
    const n2 = ri(1, d2 - 1)
    if (Math.abs(n1 / d1 - n2 / d2) < 0.05) continue
    const a = fs([n1, d1])
    const b = fs([n2, d2])
    if (a === b) continue
    const big = n1 / d1 > n2 / d2 ? a : b
    const o = shuffle([a, b, '두 수는 같다', '비교할 수 없다'])
    return { k: 'mc', t: `${a}와 ${b} 중 더 큰 분수는?`, o, a: o.indexOf(big), sub: '통분해서 비교해 보세요', cat: CAT }
  }
}
function fracAdd2(): BossQ {
  for (;;) {
    const d1 = ri(2, 6)
    const d2 = ri(2, 6)
    if (d1 === d2) continue
    const n1 = ri(1, d1 - 1)
    const n2 = ri(1, d2 - 1)
    const L = lcm(d1, d2)
    const sum = reduce([n1 * (L / d1) + n2 * (L / d2), L])
    if (sum[1] === 1) continue
    const wr = fracWrongs(sum, [[n1 + n2, d1 + d2], [n1 + n2, d1 * d2], [n1 + n2, Math.max(d1, d2)], [sum[0] + 1, sum[1]], [sum[0], sum[1] + 1]])
    return mc(`${n1}/${d1} + ${n2}/${d2} = ?`, fs(sum), wr, '통분한 다음 더해요')
  }
}
function area2(): BossQ {
  if (Math.random() < 0.5) {
    const b = ri(3, 9) * 2
    const h = ri(3, 9)
    const A = (b * h) / 2
    return mc(`밑변이 ${b}cm, 높이가 ${h}cm인 삼각형의 넓이는? (cm²)`, String(A), [String(b * h), String(b + h), String(A + b), String(A - h)], '삼각형의 넓이 = 밑변 × 높이 ÷ 2')
  }
  const w = ri(4, 14)
  const h = ri(3, 12)
  return mc(`가로 ${w}cm, 세로 ${h}cm인 직사각형의 둘레는? (cm)`, String((w + h) * 2), [String(w * h), String(w + h), String((w + h) * 2 + 2), String((w + h) * 2 - 2)], '둘레 = (가로 + 세로) × 2')
}
function paren2(): BossQ {
  const a = ri(3, 12)
  const b = ri(2, 9)
  const c = ri(2, 6)
  const d = ri(1, 9)
  const ans = (a + b) * c - d
  return mc(`(${a} + ${b}) × ${c} − ${d} = ?`, String(ans), [String(a + b * c - d), String(ans + d * 2), String((a + b) * (c - d)), String(ans + c)], '괄호 안을 먼저 계산해요')
}
function round2(): BossQ {
  const n = ri(1200, 9899)
  const unit = pick([10, 100])
  const r = Math.round(n / unit) * unit
  const fl = Math.floor(n / unit) * unit
  const ce = Math.ceil(n / unit) * unit
  const where = unit === 10 ? '십' : '백'
  const f = (x: number) => String(x)
  return mc(`${n}을(를) 반올림하여 ${where}의 자리까지 나타내면?`, f(r), [f(fl), f(ce), f(r + unit), f(r - unit)], '5 이상이면 올리고 4 이하면 버려요')
}
function paren2num(): BossQ {
  const a = ri(3, 12)
  const b = ri(2, 9)
  const c = ri(2, 6)
  const d = ri(1, 9)
  return num(`(${a} + ${b}) × ${c} − ${d} = ?`, (a + b) * c - d, '괄호 안을 먼저 계산해요')
}
function mix2num(): BossQ {
  const a = ri(10, 40)
  const b = ri(2, 9)
  const c = ri(2, 9)
  return num(`${a} + ${b} × ${c} = ?`, a + b * c, '곱셈을 먼저 계산해요')
}

/* ============ lv 3 (어려움) ============ */
function fracSub3(): BossQ {
  for (;;) {
    const d1 = ri(2, 8)
    const d2 = ri(2, 8)
    if (d1 === d2) continue
    const n1 = ri(1, d1 - 1)
    const n2 = ri(1, d2 - 1)
    const L = lcm(d1, d2)
    const x = n1 * (L / d1)
    const y = n2 * (L / d2)
    if (x <= y) continue
    const dif = reduce([x - y, L])
    const wr = fracWrongs(dif, [[n1 - n2, Math.abs(d1 - d2) || 1], [x - y, d1 * d2], [dif[0] + 1, dif[1]], [dif[0], dif[1] + 1], [n1 + n2, L]])
    return mc(`${n1}/${d1} − ${n2}/${d2} = ?`, fs(dif), wr, '통분한 다음 빼요')
  }
}
function trapezoid3(): BossQ {
  for (;;) {
    const a = ri(3, 9)
    const b = ri(a + 1, a + 8)
    const h = ri(2, 10)
    if (((a + b) * h) % 2 !== 0) continue
    return num(`윗변 ${a}cm, 아랫변 ${b}cm, 높이 ${h}cm인 사다리꼴의 넓이는? (cm²)`, ((a + b) * h) / 2, '사다리꼴 = (윗변 + 아랫변) × 높이 ÷ 2')
  }
}
function parallelogram3(): BossQ {
  const b = ri(4, 15)
  const h = ri(3, 12)
  return num(`밑변 ${b}cm, 높이 ${h}cm인 평행사변형의 넓이는? (cm²)`, b * h, '평행사변형 = 밑변 × 높이')
}
function decimal3(): BossQ {
  const x10 = ri(12, 99)
  const y = ri(2, 9)
  const p10 = x10 * y
  const ans = p10 % 10 === 0 ? String(p10 / 10) : (p10 / 10).toFixed(1)
  return num(`${(x10 / 10).toFixed(1)} × ${y} = ?`, ans, '소수점도 눌러 보세요 (예: 4.2)')
}
function mix3(): BossQ {
  const e = ri(2, 6)
  const d = e * ri(2, 6)
  const a = ri(3, 12)
  const b = ri(2, 9)
  const c = ri(2, 6)
  return num(`(${a} + ${b}) × ${c} − ${d} ÷ ${e} = ?`, (a + b) * c - d / e, '곱셈·나눗셈을 먼저, 괄호는 가장 먼저')
}
function avg3(): BossQ {
  const n = pick([4, 5])
  const m = ri(6, 15)
  const total = m * n
  const nums: number[] = []
  let left = total
  for (let i = 0; i < n - 1; i++) {
    const x = ri(Math.max(2, m - 4), m + 4)
    nums.push(x)
    left -= x
  }
  if (left < 1) return avg3()
  return num(`${n}개 수의 평균이 ${m}입니다. 그중 ${n - 1}개가 ${nums.join(', ')}일 때, 나머지 한 수는?`, left, '평균 × 개수 = 모두 더한 값')
}
function divCount3(): BossQ {
  const n = pick([12, 18, 20, 24, 28, 30, 36, 40, 42, 48])
  const c = Array.from({ length: n }, (_, i) => i + 1).filter((d) => n % d === 0).length
  return num(`${n}의 약수는 모두 몇 개일까요?`, c, '1과 자기 자신도 포함해요')
}
function rule3(): BossQ {
  const a = ri(2, 6)
  const b = ri(1, 9)
  const x = ri(5, 12)
  return num(`y = x × ${a} + ${b} 일 때, x가 ${x}이면 y는?`, x * a + b, '규칙과 대응')
}
function cuboid3(): BossQ {
  const w = pick([
    { t: '직육면체의 모서리는 모두 몇 개일까요?', a: '12개', w: ['8개', '6개', '10개'] },
    { t: '직육면체의 꼭짓점은 모두 몇 개일까요?', a: '8개', w: ['12개', '6개', '4개'] },
    { t: '직육면체의 면은 모두 몇 개일까요?', a: '6개', w: ['8개', '12개', '4개'] },
  ])
  const o = shuffle([w.a, ...w.w])
  return { k: 'mc', t: w.t, o, a: o.indexOf(w.a), sub: '직육면체를 떠올려 보세요', cat: CAT }
}
function prob3(): BossQ {
  const ev = pick([
    { t: '짝수', a: '1/2', w: ['1/3', '1/6', '2/3'] },
    { t: '3의 배수', a: '1/3', w: ['1/2', '1/6', '2/3'] },
    { t: '5 이상의 수', a: '1/3', w: ['1/2', '1/6', '5/6'] },
    { t: '6 이하의 수', a: '1', w: ['1/2', '1/6', '5/6'] },
  ])
  const o = shuffle([ev.a, ...ev.w])
  return { k: 'mc', t: `주사위를 한 번 던질 때 ${ev.t}가 나올 가능성을 분수로 나타내면?`, o, a: o.indexOf(ev.a), sub: '가능성', cat: CAT }
}

/* ============ 내보내기 ============ */
const POOL: Record<1 | 2 | 3, { mc: (() => BossQ)[]; num: (() => BossQ)[] }> = {
  1: { mc: [mix1, mul1, div1, factor1, multiple1, avg1], num: [mix2num] },
  2: { mc: [gcd2, lcm2, reduce2, compare2, fracAdd2, area2, paren2, round2], num: [paren2num, mix2num] },
  3: { mc: [fracSub3, fracAdd2, cuboid3, prob3, reduce2, round2], num: [trapezoid3, parallelogram3, decimal3, mix3, avg3, divCount3, rule3] },
}

export function mathQ5(lv: 1 | 2 | 3, kind: 'mc' | 'num' = 'mc'): BossQ {
  const pool = POOL[lv][kind].length ? POOL[lv][kind] : POOL[lv].mc
  return pick(pool)()
}

// 시험·점검용: 모든 생성기를 한 번씩 돌려 본다
export const ALL_GENERATORS: [string, () => BossQ][] = [
  ['mix1', mix1], ['mul1', mul1], ['div1', div1], ['factor1', factor1], ['multiple1', multiple1], ['avg1', avg1],
  ['gcd2', gcd2], ['lcm2', lcm2], ['reduce2', reduce2], ['compare2', compare2], ['fracAdd2', fracAdd2], ['area2', area2], ['paren2', paren2], ['round2', round2], ['paren2num', paren2num], ['mix2num', mix2num],
  ['fracSub3', fracSub3], ['trapezoid3', trapezoid3], ['parallelogram3', parallelogram3], ['decimal3', decimal3], ['mix3', mix3], ['avg3', avg3], ['divCount3', divCount3], ['rule3', rule3], ['cuboid3', cuboid3], ['prob3', prob3],
]

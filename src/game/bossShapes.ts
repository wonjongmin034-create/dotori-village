import type { BossQ } from './bossQuestions'

// 5단계 보스 — 초등 5학년 도형의 둘레와 넓이.
// 숫자는 매번 새로 만들어서 외워서 풀 수 없고, 그림(fig)에 변의 길이가 표시된다.
// 답은 모두 딱 떨어지는 자연수가 되도록 숫자를 고른다. (넓이는 cm², 둘레는 cm)

// hide: 그림에서 ?로 가려서 보여 줄 길이 이름 (거꾸로 구하는 문제에서 답이 그림에 드러나지 않게)
export type Figure = (
  | { k: 'rect'; w: number; h: number }
  | { k: 'square'; s: number }
  | { k: 'para'; base: number; h: number; side?: number }
  | { k: 'tri'; base: number; h: number }
  | { k: 'trap'; top: number; bottom: number; h: number }
  | { k: 'rhombus'; d1: number; d2: number }
  | { k: 'L'; W: number; H: number; w: number; h: number } // 큰 직사각형 W×H 에서 오른쪽 위를 w×h 만큼 뗀 ㄱ자 모양
  | { k: 'frame'; W: number; H: number; t: number } // 큰 직사각형 W×H, 가장자리 두께 t 만 색칠
) & { hide?: string[] }

const ri = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1))
const even = (a: number, b: number) => ri(Math.ceil(a / 2), Math.floor(b / 2)) * 2
const pick = <T,>(arr: readonly T[]): T => arr[ri(0, arr.length - 1)]

function num(t: string, a: number, fig: Figure | undefined, sub: string, ms = 35_000): BossQ {
  return { k: 'num', t, o: [], a: String(a), sub, cat: '도형', fig, ms }
}
const AREA = '넓이를 구해 보세요 (단위: cm²)'
const LEN = '둘레를 구해 보세요 (단위: cm)'

/* ---------- 1라운드(쉬움): 기본 도형의 넓이·둘레 ---------- */
const rectArea = (): BossQ => {
  const w = ri(4, 15)
  const h = ri(3, 12)
  return num(`가로 ${w}cm, 세로 ${h}cm인 직사각형`, w * h, { k: 'rect', w, h }, AREA)
}
const rectPerimeter = (): BossQ => {
  const w = ri(4, 18)
  const h = ri(3, 14)
  return num(`가로 ${w}cm, 세로 ${h}cm인 직사각형`, (w + h) * 2, { k: 'rect', w, h }, LEN)
}
const squareBoth = (): BossQ => {
  const s = ri(4, 16)
  return Math.random() < 0.5 ? num(`한 변이 ${s}cm인 정사각형`, s * s, { k: 'square', s }, AREA) : num(`한 변이 ${s}cm인 정사각형`, s * 4, { k: 'square', s }, LEN)
}
const paraArea = (): BossQ => {
  const base = ri(5, 16)
  const h = ri(4, 12)
  return num(`밑변 ${base}cm, 높이 ${h}cm인 평행사변형`, base * h, { k: 'para', base, h }, AREA)
}
const triArea = (): BossQ => {
  const base = even(6, 20)
  const h = ri(4, 14)
  return num(`밑변 ${base}cm, 높이 ${h}cm인 삼각형`, (base * h) / 2, { k: 'tri', base, h }, AREA)
}

/* ---------- 2라운드(보통): 사다리꼴·마름모·둘레 거꾸로 ---------- */
const trapArea = (): BossQ => {
  let top = ri(3, 10)
  let bottom = ri(top + 2, 18)
  const h = ri(4, 12)
  if ((top + bottom) % 2 === 1 && h % 2 === 1) bottom += 1
  return num(`윗변 ${top}cm, 아랫변 ${bottom}cm, 높이 ${h}cm인 사다리꼴`, ((top + bottom) * h) / 2, { k: 'trap', top, bottom, h }, AREA)
}
const rhombusArea = (): BossQ => {
  const d1 = even(6, 20)
  const d2 = ri(4, 16)
  return num(`두 대각선이 ${d1}cm, ${d2}cm인 마름모`, (d1 * d2) / 2, { k: 'rhombus', d1, d2 }, AREA)
}
const paraPerimeter = (): BossQ => {
  const base = ri(6, 16)
  const side = ri(4, 12)
  const h = ri(3, Math.max(3, side - 1))
  return num(`밑변 ${base}cm, 옆의 변 ${side}cm, 높이 ${h}cm인 평행사변형`, (base + side) * 2, { k: 'para', base, h, side }, LEN)
}
const rectFindSide = (): BossQ => {
  const w = ri(5, 14)
  const h = ri(3, 12)
  return num(`둘레가 ${(w + h) * 2}cm이고 가로가 ${w}cm인 직사각형의 세로는 몇 cm일까요?`, h, { k: 'rect', w, h, hide: ['h'] }, '세로의 길이를 구해 보세요 (단위: cm)')
}
const triFindHeight = (): BossQ => {
  const base = even(6, 20)
  const h = ri(4, 14)
  return num(`넓이가 ${(base * h) / 2}cm²이고 밑변이 ${base}cm인 삼각형의 높이는 몇 cm일까요?`, h, { k: 'tri', base, h, hide: ['h'] }, '높이를 구해 보세요 (단위: cm)')
}
const paraFindBase = (): BossQ => {
  const base = ri(5, 16)
  const h = ri(4, 12)
  return num(`넓이가 ${base * h}cm²이고 높이가 ${h}cm인 평행사변형의 밑변은 몇 cm일까요?`, base, { k: 'para', base, h, hide: ['base'] }, '밑변의 길이를 구해 보세요 (단위: cm)')
}

/* ---------- 3라운드(어려움): ㄱ자·테두리·거꾸로 구하기 ---------- */
const lArea = (): BossQ => {
  const W = ri(10, 20)
  const H = ri(8, 16)
  const w = ri(3, W - 4)
  const h = ri(3, H - 3)
  return num('색칠한 ㄱ자 모양의 넓이는 얼마일까요? (큰 직사각형에서 한 귀퉁이를 잘라 냈어요)', W * H - w * h, { k: 'L', W, H, w, h }, AREA, 45_000)
}
const lPerimeter = (): BossQ => {
  const W = ri(10, 20)
  const H = ri(8, 16)
  const w = ri(3, W - 4)
  const h = ri(3, H - 3)
  return num('ㄱ자 모양의 둘레는 몇 cm일까요? (잘라 낸 귀퉁이를 생각해 보세요)', (W + H) * 2, { k: 'L', W, H, w, h }, LEN, 45_000)
}
const frameArea = (): BossQ => {
  const t = ri(2, 4)
  const W = ri(2 * t + 4, 22)
  const H = ri(2 * t + 3, 18)
  return num(`가로 ${W}cm, 세로 ${H}cm인 직사각형의 가장자리를 ${t}cm 너비로 색칠했어요. 색칠한 부분의 넓이는?`, W * H - (W - 2 * t) * (H - 2 * t), { k: 'frame', W, H, t }, AREA, 45_000)
}
const trapFindHeight = (): BossQ => {
  const top = ri(4, 10)
  const bottom = ri(top + 2, 18)
  let h = ri(4, 12)
  if ((top + bottom) % 2 === 1 && h % 2 === 1) h += 1
  return num(`넓이가 ${((top + bottom) * h) / 2}cm²이고 윗변 ${top}cm, 아랫변 ${bottom}cm인 사다리꼴의 높이는 몇 cm일까요?`, h, { k: 'trap', top, bottom, h, hide: ['h'] }, '높이를 구해 보세요 (단위: cm)', 40_000)
}
const rhombusFindDiagonal = (): BossQ => {
  const d1 = even(6, 20)
  const d2 = ri(4, 16)
  return num(`넓이가 ${(d1 * d2) / 2}cm²이고 한 대각선이 ${d1}cm인 마름모의 다른 대각선은 몇 cm일까요?`, d2, { k: 'rhombus', d1, d2, hide: ['d2'] }, '대각선의 길이를 구해 보세요 (단위: cm)', 40_000)
}

/* ---------- 외우는 공식·단위 (보기 고르기) ---------- */
type F = { q: string; a: string; w: [string, string, string] }
const FORMULA: F[] = [
  { q: '직사각형의 넓이를 구하는 식은?', a: '(가로) × (세로)', w: ['(가로) + (세로)', '(가로 + 세로) × 2', '(가로) × (세로) ÷ 2'] },
  { q: '직사각형의 둘레를 구하는 식은?', a: '(가로 + 세로) × 2', w: ['(가로) × (세로)', '(가로) × (세로) × 2', '가로 + 세로'] },
  { q: '정사각형의 둘레를 구하는 식은?', a: '(한 변) × 4', w: ['(한 변) × (한 변)', '(한 변) × 2', '(한 변) + 4'] },
  { q: '평행사변형의 넓이를 구하는 식은?', a: '(밑변) × (높이)', w: ['(밑변) × (높이) ÷ 2', '(밑변) + (높이)', '(밑변 + 높이) × 2'] },
  { q: '삼각형의 넓이를 구하는 식은?', a: '(밑변) × (높이) ÷ 2', w: ['(밑변) × (높이)', '(밑변) + (높이) ÷ 2', '(밑변 + 높이) × 2'] },
  { q: '마름모의 넓이를 구하는 식은?', a: '(한 대각선) × (다른 대각선) ÷ 2', w: ['(한 대각선) × (다른 대각선)', '(한 변) × 4', '(한 변) × (한 변) ÷ 2'] },
  { q: '사다리꼴의 넓이를 구하는 식은?', a: '(윗변 + 아랫변) × (높이) ÷ 2', w: ['(윗변 + 아랫변) × (높이)', '(윗변) × (아랫변) × (높이) ÷ 2', '(윗변 − 아랫변) × (높이) ÷ 2'] },
  { q: '평행사변형의 둘레를 구하는 식은?', a: '(이웃한 두 변의 길이의 합) × 2', w: ['(밑변) × (높이)', '(밑변) × (높이) ÷ 2', '(밑변) + (높이)'] },
  { q: '넓이가 같은 삼각형이 되려면 꼭 같아야 하는 것은?', a: '밑변과 높이의 곱', w: ['세 변의 길이의 합', '가장 긴 변의 길이', '세 각의 크기'] },
  { q: '삼각형의 높이는 밑변과 어떤 관계일까요?', a: '밑변에 수직으로 잰 길이', w: ['밑변과 평행한 길이', '가장 긴 변의 길이', '밑변의 절반 길이'] },
  { q: '1m²는 몇 cm²일까요?', a: '10000cm²', w: ['100cm²', '1000cm²', '100000cm²'] },
  { q: '1km²는 몇 m²일까요?', a: '1000000m²', w: ['1000m²', '10000m²', '100000m²'] },
  { q: '넓이의 단위가 아닌 것은?', a: 'cm', w: ['cm²', 'm²', 'km²'] },
  { q: '둘레의 길이를 나타낼 때 알맞은 단위는?', a: 'cm', w: ['cm²', 'm²', 'kg'] },
  { q: '가로 4cm, 세로 3cm인 직사각형 2개의 넓이를 합하면 몇 cm²일까요?', a: '24cm²', w: ['12cm²', '14cm²', '48cm²'] },
  { q: '한 변이 1cm인 정사각형의 넓이를 무엇이라고 할까요?', a: '1cm²', w: ['1cm', '1m²', '4cm'] },
  { q: '마름모의 네 변의 길이는 어떤가요?', a: '모두 같다', w: ['마주 보는 두 변만 같다', '모두 다르다', '이웃한 두 변만 같다'] },
  { q: '사다리꼴은 어떤 도형일까요?', a: '평행한 변이 한 쌍 이상 있는 사각형', w: ['네 변이 모두 같은 사각형', '네 각이 모두 직각인 사각형', '평행한 변이 없는 사각형'] },
]

function formula(f: F, ms: number): BossQ {
  const o = [f.a, ...f.w]
  // 보기 섞기
  for (let i = o.length - 1; i > 0; i--) {
    const j = ri(0, i)
    ;[o[i], o[j]] = [o[j], o[i]]
  }
  return { k: 'mc', t: f.q, o, a: o.indexOf(f.a), cat: '도형 공식', sub: '공식을 떠올려 보세요', ms }
}

export const formulaQ = (ms = 14_000): BossQ => formula(pick(FORMULA), ms)

/* ---------- 라운드별 도형 문제 ---------- */
const R1 = [rectArea, rectPerimeter, squareBoth, paraArea, triArea]
const R2 = [trapArea, rhombusArea, paraPerimeter, rectFindSide, triFindHeight, paraFindBase, triArea, paraArea]
const R3 = [lArea, lPerimeter, frameArea, trapFindHeight, rhombusFindDiagonal, trapArea, rhombusArea]

export function shapeQ(lv: 1 | 2 | 3): BossQ {
  const q = pick(lv === 1 ? R1 : lv === 2 ? R2 : R3)()
  q.ms = lv === 1 ? 40_000 : lv === 2 ? 35_000 : (q.ms ?? 40_000)
  return q
}

// 필살기 문제: 팀원이 동시에 풀되, 사람마다 서로 다른 문제를 받는다 (옆 친구가 답을 알려 줄 수 없게).
// 가장 어려운 도형 문제만 나오고, 문제 종류가 겹치지 않게 사람 수만큼 서로 다른 생성기를 쓴다.
const ULT_GENS = [lArea, lPerimeter, frameArea, trapFindHeight, rhombusFindDiagonal]
export function ultShapeQs(n: number): BossQ[] {
  const gens = [...ULT_GENS].sort(() => Math.random() - 0.5)
  return Array.from({ length: n }, (_, i) => {
    const q = gens[i % gens.length]()
    q.ms = 50_000
    q.sub = '⚡ 필살기! 내 문제는 친구와 달라요 · ' + (q.sub ?? '')
    return q
  })
}

// 시험·점검용
export const ALL_SHAPE_GENERATORS: [string, () => BossQ][] = [
  ['rectArea', rectArea], ['rectPerimeter', rectPerimeter], ['squareBoth', squareBoth], ['paraArea', paraArea], ['triArea', triArea],
  ['trapArea', trapArea], ['rhombusArea', rhombusArea], ['paraPerimeter', paraPerimeter], ['rectFindSide', rectFindSide], ['triFindHeight', triFindHeight], ['paraFindBase', paraFindBase],
  ['lArea', lArea], ['lPerimeter', lPerimeter], ['frameArea', frameArea], ['trapFindHeight', trapFindHeight], ['rhombusFindDiagonal', rhombusFindDiagonal],
]

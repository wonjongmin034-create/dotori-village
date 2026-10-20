// "순서대로 눌러 보세요" 문제 — 사건을 시간 순서로, 행성을 태양에서 가까운 순서로, 수를 작은 것부터 누른다.
// 보기를 찍어서는 맞히기 어렵다 (4개면 24가지, 5개면 120가지 순서).
import type { BossQ } from './bossQuestions'

const ri = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1))
function shuffle<T>(arr: readonly T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = ri(0, i)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// [연도, 사건]  (기원전은 음수). 서로 30년 이상 떨어진 것만 한 문제에 같이 나온다.
export const EVENTS: [number, string][] = [
  [-108, '고조선 멸망'],
  [-37, '고구려 건국'],
  [391, '광개토대왕 즉위'],
  [427, '장수왕, 평양으로 도읍을 옮김'],
  [527, '신라, 불교 공인'],
  [660, '백제 멸망'],
  [698, '발해 건국'],
  [918, '고려 건국'],
  [993, '서희의 담판(거란 1차 침입)'],
  [1170, '무신정변'],
  [1377, '직지심체요절 금속 활자 인쇄'],
  [1392, '조선 건국'],
  [1446, '훈민정음 반포'],
  [1485, '경국대전 완성'],
]
const PLANETS = ['수성', '금성', '지구', '화성', '목성', '토성', '천왕성', '해왕성']

// 정답 순서대로 놓인 목록 → 문제로 (보기는 섞고, 정답은 "보기 번호를 맞는 순서로 나열한 것")
function build(t: string, sub: string, inOrder: string[], cat: string, ms: number): BossQ {
  const o = shuffle(inOrder)
  return { k: 'order', t, o, a: inOrder.map((x) => o.indexOf(x)), sub, cat, ms }
}

function historyOrder(n: number): BossQ {
  for (;;) {
    const picked = shuffle(EVENTS).slice(0, n).sort((x, y) => x[0] - y[0])
    if (picked.every((p, i) => i === 0 || p[0] - picked[i - 1][0] >= 30)) {
      return build('일어난 순서대로 눌러 보세요', '먼저 일어난 일부터', picked.map((p) => p[1]), '한국사', n === 4 ? 20_000 : 24_000)
    }
  }
}
function planetOrder(n: number): BossQ {
  const start = ri(0, PLANETS.length - n)
  const picked = PLANETS.slice(start, start + n)
  return build('태양에서 가까운 순서대로 눌러 보세요', '태양에 가장 가까운 행성부터', picked, '과학', 18_000)
}
function numberOrder(n: number, mixed: boolean): BossQ {
  for (;;) {
    const items: { s: string; v: number }[] = []
    while (items.length < n) {
      const useDec = mixed && Math.random() < 0.4
      let s: string
      let v: number
      if (useDec) {
        v = ri(1, 9) / 10
        s = v.toFixed(1)
      } else {
        const d = ri(2, 8)
        const nu = ri(1, d - 1)
        v = nu / d
        s = `${nu}/${d}`
      }
      if (items.every((x) => Math.abs(x.v - v) >= 0.03)) items.push({ s, v })
    }
    items.sort((a, b) => a.v - b.v)
    return build('작은 수부터 순서대로 눌러 보세요', mixed ? '분수와 소수를 비교해 보세요' : '분수를 비교해 보세요', items.map((x) => x.s), '수학', 24_000)
  }
}

export function orderQ(lv: 2 | 3): BossQ {
  const n = lv === 2 ? 4 : 5
  const r = Math.random()
  if (r < 0.4) return historyOrder(n)
  if (r < 0.6) return planetOrder(n)
  return numberOrder(n, lv === 3)
}

// 도토리 마을 경제 밸런스 — 여기 숫자만 바꾸면 난이도가 조절된다.

const SEC = 1000
const MIN = 60 * SEC
const HOUR = 60 * MIN
const DAY = 24 * HOUR

export const START_COINS = 30 // 처음 주는 도토리
export const QUIZ_REWARD = 1 // 농장 돌봄(물주기·먹이주기·친구 돕기) 문제 하나 맞히면 주는 도토리

/* ---------- 오늘의 학습 (하루 할당 문제) ---------- */
export const DAILY_PER_SUBJECT = 4 // 과목(국어·수학·사회·과학·영어)당 문제 수 → 하루 20문제
// 처음에 맞히면 1점, 틀려서 힌트를 보고 두 번째에 맞히면 ½점. 점수가 절반(20문제 중 10점) 미만이면 도토리는 없다.
export const DAILY_RETRY_CREDIT = 0.5
// 점수 비율(맞힌 점수 ÷ 문제 수)에 따라 한꺼번에 지급 — 위에서부터 맞는 첫 칸
export const DAILY_PAY: { rate: number; coins: number; label: string }[] = [
  { rate: 1.0, coins: 35, label: '만점 🏆' },
  { rate: 0.9, coins: 27, label: '훌륭해요' },
  { rate: 0.8, coins: 20, label: '아주 잘했어요' },
  { rate: 0.7, coins: 14, label: '잘했어요' },
  { rate: 0.6, coins: 9, label: '좋아요' },
  { rate: 0.5, coins: 5, label: '통과' },
]
export const DAILY_MIN_RATE = DAILY_PAY[DAILY_PAY.length - 1].rate
// 맞힌 개수(score) 중 처음에 맞힌 개수(first)로 점수를 계산 (first 없는 옛 기록은 전부 처음에 맞힌 것으로 본다)
export const dailyPoints = (score: number, first?: number) => {
  const f = first ?? score
  return f + (score - f) * DAILY_RETRY_CREDIT
}
export function dailyPay(points: number, total: number): { rate: number; coins: number; label: string } | null {
  const rate = total ? points / total : 0
  return DAILY_PAY.find((t) => rate >= t.rate - 1e-9) ?? null
}
/* ---------- 농장 (하루 한 번 돌봄) ---------- */
// · 밭과 우리는 하루에 한 번씩 돌볼 수 있다 (서버 날짜 기준). 돌볼 때 문제를 푼다.
//     맞히면: 작물은 하루 자라고 / 동물은 하루치 먹이를 먹는다.  틀리면: 그날 기회가 사라지고 품질(별)이 하나 준다.
// · 작물은 "돌본 날"만큼 자란다 (실제 날짜가 아니라). 동물은 먹이를 먹은 날만큼 생산물을 모은다.
// · 학교 날(평일, 학급 휴일 제외)로 3일 동안 돌보지 않으면 시들어서(동물은 배가 고파서) 별이 하나 준다.
// · 거둔 것은 창고에 쌓이고, 시장에서 판다. 시장 값은 날마다 바뀐다.
// · 품질 ★1~3 — 별이 많을수록 비싸게 팔린다.
export const STAR_MULT = [0, 0.6, 1, 1.5] // ★1 · ★2 · ★3 값 배수
export const WILT_SCHOOL_DAYS = 3
export const DEX_NEW_REWARD = 3 // 도감에 처음 올린 것마다

export type CropDef = {
  id: string
  label: string
  emoji: string
  cost: number // 씨앗 값 (0 = 무료)
  days: number // 다 자라는 데 필요한 "돌본 날" 수
  base: number // ★2 품질일 때 시장 기본값
  color: string // 3D 표시용
}

// 기본(무료·짧음) → 고급(씨앗값·길지만 비쌈)
export const CROPS: CropDef[] = [
  { id: 'rice', label: '벼', emoji: '🌾', cost: 0, days: 2, base: 3, color: '#e3c65b' },
  { id: 'potato', label: '감자', emoji: '🥔', cost: 2, days: 3, base: 6, color: '#c9a25e' },
  { id: 'corn', label: '옥수수', emoji: '🌽', cost: 4, days: 4, base: 9, color: '#f2c14e' },
  { id: 'apple', label: '사과', emoji: '🍎', cost: 8, days: 5, base: 14, color: '#d64b46' },
  { id: 'pear', label: '배', emoji: '🍐', cost: 12, days: 6, base: 19, color: '#cdd66a' },
  { id: 'peach', label: '복숭아', emoji: '🍑', cost: 16, days: 7, base: 25, color: '#f2a3a3' },
]

export const CROP_MAP: Record<string, CropDef> = Object.fromEntries(CROPS.map((c) => [c.id, c]))

// 비료는 심을 때만 줄 수 있다 — 자라는 날이 하루 줄어든다 (최소 1일)
export const fertCost = (c: CropDef) => 3 + Math.floor(c.cost / 4)
export const cropDays = (c: CropDef, fert: boolean) => Math.max(1, c.days - (fert ? 1 : 0))

export type AnimalDef = {
  id: string
  label: string
  emoji: string
  cost: number // 데려오는 값 (한 번만)
  need: number // 생산물 하나를 모으려면 먹이를 먹어야 하는 날 수
  base: number // ★2 품질일 때 생산물 시장 기본값
  produceLabel: string
  produceEmoji: string
  body: string
  accent: string
}

export const ANIMALS: AnimalDef[] = [
  { id: 'chick', label: '병아리', emoji: '🐤', cost: 0, need: 2, base: 2, produceLabel: '달걀', produceEmoji: '🥚', body: '#f2d24e', accent: '#e8912e' },
  { id: 'hen', label: '닭', emoji: '🐔', cost: 10, need: 2, base: 4, produceLabel: '달걀 꾸러미', produceEmoji: '🧺', body: '#f5f0e4', accent: '#d94f4f' },
  { id: 'sheep', label: '양', emoji: '🐑', cost: 25, need: 3, base: 7, produceLabel: '양털', produceEmoji: '🧶', body: '#f3f1ea', accent: '#cdbfae' },
  { id: 'cow', label: '젖소', emoji: '🐄', cost: 45, need: 4, base: 11, produceLabel: '우유', produceEmoji: '🥛', body: '#f5f2ec', accent: '#3f3a37' },
]

export const ANIMAL_MAP: Record<string, AnimalDef> = Object.fromEntries(ANIMALS.map((a) => [a.id, a]))

/* ---------- 창고 · 시장 ---------- */
// 창고에 쌓이는 것: 작물은 'c:벼id', 동물 생산물은 'a:동물id'
export type ProductInfo = { id: string; label: string; emoji: string; base: number }
export function productInfo(pid: string): ProductInfo | null {
  const [k, id] = pid.split(':')
  if (k === 'c' && CROP_MAP[id]) return { id: pid, label: CROP_MAP[id].label, emoji: CROP_MAP[id].emoji, base: CROP_MAP[id].base }
  if (k === 'a' && ANIMAL_MAP[id]) return { id: pid, label: ANIMAL_MAP[id].produceLabel, emoji: ANIMAL_MAP[id].produceEmoji, base: ANIMAL_MAP[id].base }
  return null
}
export const ALL_PRODUCTS: string[] = [...CROPS.map((c) => 'c:' + c.id), ...ANIMALS.map((a) => 'a:' + a.id)]

// 오늘의 시장 값 배수 (0.7 ~ 1.4, 0.05 단위) — 날짜와 물건으로 정해지므로 모두에게 같다
export function marketMult(day: string, pid: string): number {
  let h = 2166136261
  for (const ch of day + '|' + pid) {
    h ^= ch.charCodeAt(0)
    h = Math.imul(h, 16777619)
  }
  const r = ((h >>> 0) % 1000) / 1000
  return Math.round((0.7 + r * 0.7) * 20) / 20
}
export const sellPrice = (base: number, star: number, mult: number) => Math.max(1, Math.round(base * (STAR_MULT[star] ?? 1) * mult))

/* ---------- 도토리 강화 게임 ---------- */
// 하루 시도 제한 (도박 중독 방지)
export const ENHANCE_DAILY_LIMIT = 20

export type EnhanceStep = {
  cost: number // 이 레벨에서 강화 시도 비용
  chance: number // 성공 확률 (0~1)
  onFail: number // 실패 시 레벨 변화 (0 = 유지, -1 = 한 단계 하락 …)
  sell: number // 이 레벨에서 팔 때 받는 도토리
}

// ENHANCE[i] = 현재 +i 일 때의 정보. 마지막 항목(+9) 다음이 최고 레벨 +10.
export const ENHANCE: EnhanceStep[] = [
  { cost: 3, chance: 0.95, onFail: 0, sell: 0 },
  { cost: 4, chance: 0.9, onFail: 0, sell: 5 },
  { cost: 6, chance: 0.8, onFail: 0, sell: 12 },
  { cost: 8, chance: 0.68, onFail: 0, sell: 24 },
  { cost: 12, chance: 0.55, onFail: -1, sell: 42 },
  { cost: 16, chance: 0.44, onFail: -1, sell: 72 },
  { cost: 22, chance: 0.34, onFail: -1, sell: 120 },
  { cost: 30, chance: 0.24, onFail: -2, sell: 200 },
  { cost: 42, chance: 0.15, onFail: -2, sell: 340 },
  { cost: 60, chance: 0.08, onFail: -3, sell: 560 },
]
export const ENHANCE_MAX = ENHANCE.length // +10
export const ENHANCE_MAX_SELL = 950

export function enhanceStep(level: number): EnhanceStep | null {
  return level >= 0 && level < ENHANCE_MAX ? ENHANCE[level] : null
}
export function enhanceSell(level: number): number {
  if (level <= 0) return 0
  if (level >= ENHANCE_MAX) return ENHANCE_MAX_SELL
  return ENHANCE[level].sell
}

// 우리 집 — 시작은 천막, 코인으로 단계 발전
export type HouseLevel = { level: number; label: string; cost: number; desc: string }
export const HOUSE_LEVELS: HouseLevel[] = [
  { level: 1, label: '천막', cost: 0, desc: '작지만 아늑한 시작' },
  { level: 2, label: '통나무 오두막', cost: 45, desc: '지붕과 문이 생겼어요' },
  { level: 3, label: '아담한 집', cost: 130, desc: '창문과 굴뚝, 작은 현관' },
  { level: 4, label: '이층집', cost: 340, desc: '위층이 생겨 넓어졌어요' },
  { level: 5, label: '큰 저택', cost: 750, desc: '마을에서 제일 멋진 집' },
]
export const MAX_HOUSE_LEVEL = HOUSE_LEVELS.length

// 밭·우리는 무료라서 무한정 늘리면 도토리가 끝없이 불어난다 → 집 단계에 따라 개수 제한.
// 밭 3~7개, 우리 2~6개 (집 1~5단계). 이미 더 많이 가진 학생은 그대로 두고 새로 놓기만 막는다.
export const FARM_LIMIT_TYPES = ['plot', 'coop'] as const
export function farmLimit(type: string, level: number | undefined): number | null {
  const lv = Math.max(1, Math.min(MAX_HOUSE_LEVEL, level ?? 1))
  if (type === 'plot') return 2 + lv
  if (type === 'coop') return 1 + lv
  return null
}
export const houseLevel = (n: number | undefined) =>
  HOUSE_LEVELS.find((l) => l.level === (n ?? 1)) ?? HOUSE_LEVELS[0]

// ── 마을 땅 (네모) ──
// half = 반쪽 크기. 땅은 (half*2) x (half*2) 정사각형. 1칸 = "1평".
export const LAND_START = 5 // 처음: 10 x 10 = 100평
export const LAND_MAX = 18 // 최대: 36 x 36
export const LAND_STEP = 1 // 한 번 넓히면 반쪽 +1 (가로세로 각 +2)
export const LAND_PRICE_PER_TILE = 1 // 평당 도토리
export const LAND_OLD = 17 // 예전(둥근) 마을 크기 — 기존 학생은 이걸로 유지

// 땅은 집 단계에 따라 넓힐 수 있는 한계가 있다 (집 1~5단계 → 반쪽 7·9·11·14·18 = 14×14 ~ 36×36칸).
// 이미 그보다 큰 땅을 가진 학생은 그대로 두고, 더 넓히는 것만 막는다.
export const LAND_CAP_BY_HOUSE = [7, 9, 11, 14, 18]
export const landCapFor = (houseLv: number | undefined) => LAND_CAP_BY_HOUSE[Math.max(1, Math.min(LAND_CAP_BY_HOUSE.length, houseLv ?? 1)) - 1]
// 이 크기(반쪽)까지 넓히려면 필요한 가장 낮은 집 단계
export const houseNeededForLand = (half: number) => {
  const i = LAND_CAP_BY_HOUSE.findIndex((c) => c >= half)
  return i < 0 ? LAND_CAP_BY_HOUSE.length : i + 1
}

export function landPyeong(half: number) {
  return (half * 2) * (half * 2)
}
export function landExpand(half: number): { next: number; addTiles: number; cost: number } | null {
  if (half >= LAND_MAX) return null
  const next = half + LAND_STEP
  const addTiles = landPyeong(next) - landPyeong(half)
  return { next, addTiles, cost: addTiles * LAND_PRICE_PER_TILE }
}

// 남은 시간을 사람이 읽기 좋게: "3일" / "5시간" / "20분"
export function fmtLeft(ms: number): string {
  if (ms <= 0) return ''
  const m = Math.ceil(ms / MIN)
  if (m < 60) return `${m}분`
  const h = Math.round(ms / HOUR)
  if (h < 24) return `${h}시간`
  return `${Math.round(ms / DAY)}일`
}

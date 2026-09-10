// 도토리 마을 경제 밸런스 — 여기 숫자만 바꾸면 난이도가 조절된다.
//
// ⏱ 시간은 "실제 학급 운영" 기준(일·시간)이다.
//    빠르게 테스트하려면 주소 뒤에 ?fast 를 붙인다 → 하루가 약 10초로 압축된다.
//    예: https://.../dotori-village/?fast

const SEC = 1000
const MIN = 60 * SEC
const HOUR = 60 * MIN
const DAY = 24 * HOUR

const FAST =
  typeof location !== 'undefined' && new URLSearchParams(location.search).has('fast')
// FAST 모드에서 하루 ≈ 10초
const SCALE = FAST ? (10 * SEC) / DAY : 1

const days = (n: number) => n * DAY * SCALE
const hours = (n: number) => n * HOUR * SCALE

export const START_COINS = 30 // 처음 주는 도토리
export const QUIZ_REWARD = 2 // 돌봄(물주기 등) 앞 문제 하나 맞히면 주는 도토리

/* ---------- 오늘의 학습 (하루 할당 문제) ---------- */
export const DAILY_PER_SUBJECT = 4 // 과목(국어·수학·사회·과학·영어)당 문제 수 → 하루 20문제
export const DAILY_PER_CORRECT = 1 // 한 문제 맞힐 때마다 주는 도토리
// 다 풀면 정답률에 따라 추가 보상 (위에서부터 맞는 첫 칸)
export const DAILY_BONUS: { rate: number; add: number; label: string }[] = [
  { rate: 1.0, add: 15, label: '만점 🏆' },
  { rate: 0.9, add: 9, label: '훌륭해요' },
  { rate: 0.75, add: 5, label: '잘했어요' },
  { rate: 0.6, add: 2, label: '통과' },
]
export function dailyBonus(rate: number): { rate: number; add: number; label: string } | null {
  return DAILY_BONUS.find((t) => rate >= t.rate - 1e-9) ?? null
}
export const CARE_COOLDOWN_MS = hours(10) // 물/먹이 다시 줄 수 있을 때까지 (약 10시간 → 하루 1~2번)
export const FERTILIZER_COST = 3 // 비료 값
export const FERTILIZER_BONUS = 1.5 // 비료 주면 수확 보상 배수

export type CropDef = {
  id: string
  label: string
  emoji: string
  cost: number // 씨앗 값 (0 = 무료)
  waterGoal: number // 몇 번 물 줘야 다 자라는지
  minGrowMs: number // 최소 성장 시간
  reward: number // 수확 보상 (도토리)
  color: string // 3D 표시용
}

// 기본(무료·낮은 보상·빠름) → 고급(코인 필요·높은 보상·느림)
export const CROPS: CropDef[] = [
  { id: 'rice', label: '벼', emoji: '🌾', cost: 0, waterGoal: 2, minGrowMs: days(1.5), reward: 5, color: '#e3c65b' },
  { id: 'potato', label: '감자', emoji: '🥔', cost: 4, waterGoal: 2, minGrowMs: days(2.5), reward: 13, color: '#c9a25e' },
  { id: 'corn', label: '옥수수', emoji: '🌽', cost: 9, waterGoal: 3, minGrowMs: days(4), reward: 28, color: '#f2c14e' },
  { id: 'apple', label: '사과', emoji: '🍎', cost: 20, waterGoal: 4, minGrowMs: days(7), reward: 62, color: '#d64b46' },
  { id: 'pear', label: '배', emoji: '🍐', cost: 27, waterGoal: 5, minGrowMs: days(10), reward: 88, color: '#cdd66a' },
  { id: 'peach', label: '복숭아', emoji: '🍑', cost: 35, waterGoal: 5, minGrowMs: days(14), reward: 115, color: '#f2a3a3' },
]

export const CROP_MAP: Record<string, CropDef> = Object.fromEntries(CROPS.map((c) => [c.id, c]))

export type AnimalDef = {
  id: string
  label: string
  emoji: string
  cost: number
  feedGoal: number // 생산 주기 안에 이만큼 먹여야 "잘 키운" 보상
  produceMs: number // 생산물이 다시 차는 시간
  produceLabel: string
  produceEmoji: string
  reward: number // 생산물 거둘 때 보상
  wellFedBonus: number // 잘 먹였을 때 배수
  body: string
  accent: string
}

export const ANIMALS: AnimalDef[] = [
  { id: 'chick', label: '병아리', emoji: '🐤', cost: 0, feedGoal: 2, produceMs: days(1), produceLabel: '달걀', produceEmoji: '🥚', reward: 6, wellFedBonus: 1.4, body: '#f2d24e', accent: '#e8912e' },
  { id: 'hen', label: '닭', emoji: '🐔', cost: 12, feedGoal: 3, produceMs: days(2), produceLabel: '달걀 꾸러미', produceEmoji: '🥚', reward: 22, wellFedBonus: 1.5, body: '#f5f0e4', accent: '#d94f4f' },
  { id: 'sheep', label: '양', emoji: '🐑', cost: 30, feedGoal: 3, produceMs: days(4.5), produceLabel: '양털', produceEmoji: '🧶', reward: 52, wellFedBonus: 1.5, body: '#f3f1ea', accent: '#cdbfae' },
  { id: 'cow', label: '젖소', emoji: '🐄', cost: 55, feedGoal: 4, produceMs: days(7), produceLabel: '우유', produceEmoji: '🥛', reward: 88, wellFedBonus: 1.6, body: '#f5f2ec', accent: '#3f3a37' },
]

export const ANIMAL_MAP: Record<string, AnimalDef> = Object.fromEntries(ANIMALS.map((a) => [a.id, a]))

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
export const houseLevel = (n: number | undefined) =>
  HOUSE_LEVELS.find((l) => l.level === (n ?? 1)) ?? HOUSE_LEVELS[0]

// ── 마을 땅 (네모) ──
// half = 반쪽 크기. 땅은 (half*2) x (half*2) 정사각형. 1칸 = "1평".
export const LAND_START = 5 // 처음: 10 x 10 = 100평
export const LAND_MAX = 18 // 최대: 36 x 36
export const LAND_STEP = 1 // 한 번 넓히면 반쪽 +1 (가로세로 각 +2)
export const LAND_PRICE_PER_TILE = 1 // 평당 도토리
export const LAND_OLD = 17 // 예전(둥근) 마을 크기 — 기존 학생은 이걸로 유지

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

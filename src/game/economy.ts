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
export const QUIZ_REWARD = 2 // 문제 하나 맞히면 주는 도토리
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

// 남은 시간을 사람이 읽기 좋게: "3일" / "5시간" / "20분"
export function fmtLeft(ms: number): string {
  if (ms <= 0) return ''
  const m = Math.ceil(ms / MIN)
  if (m < 60) return `${m}분`
  const h = Math.round(ms / HOUR)
  if (h < 24) return `${h}시간`
  return `${Math.round(ms / DAY)}일`
}

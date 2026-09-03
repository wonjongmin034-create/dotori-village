// 도토리 마을 경제 밸런스 — 여기 숫자만 바꾸면 난이도가 조절된다.
//
// ⏱  성장·돌봄 시간은 지금 "테스트용(초 단위)"이다.
//    실제 학급 운영 때는 CARE_COOLDOWN_MS 를 몇 시간, minGrowMs 를 며칠로 늘린다.

export const START_COINS = 30 // 처음 주는 도토리
export const QUIZ_REWARD = 2 // 문제 하나 맞히면 주는 도토리
export const CARE_COOLDOWN_MS = 8_000 // 물/먹이 다시 줄 수 있을 때까지 (테스트: 8초)
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

// 기본(무료·낮은 보상) → 고급(코인 필요·높은 보상)
export const CROPS: CropDef[] = [
  { id: 'rice', label: '벼', emoji: '🌾', cost: 0, waterGoal: 2, minGrowMs: 18_000, reward: 5, color: '#e3c65b' },
  { id: 'potato', label: '감자', emoji: '🥔', cost: 4, waterGoal: 2, minGrowMs: 24_000, reward: 12, color: '#c9a25e' },
  { id: 'corn', label: '옥수수', emoji: '🌽', cost: 9, waterGoal: 3, minGrowMs: 34_000, reward: 24, color: '#f2c14e' },
  { id: 'apple', label: '사과', emoji: '🍎', cost: 20, waterGoal: 4, minGrowMs: 55_000, reward: 55, color: '#d64b46' },
  { id: 'pear', label: '배', emoji: '🍐', cost: 27, waterGoal: 4, minGrowMs: 66_000, reward: 72, color: '#cdd66a' },
  { id: 'peach', label: '복숭아', emoji: '🍑', cost: 35, waterGoal: 5, minGrowMs: 82_000, reward: 98, color: '#f2a3a3' },
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
  { id: 'chick', label: '병아리', emoji: '🐤', cost: 0, feedGoal: 2, produceMs: 26_000, produceLabel: '달걀', produceEmoji: '🥚', reward: 6, wellFedBonus: 1.4, body: '#f2d24e', accent: '#e8912e' },
  { id: 'hen', label: '닭', emoji: '🐔', cost: 12, feedGoal: 3, produceMs: 38_000, produceLabel: '달걀 꾸러미', produceEmoji: '🥚', reward: 20, wellFedBonus: 1.5, body: '#f5f0e4', accent: '#d94f4f' },
  { id: 'sheep', label: '양', emoji: '🐑', cost: 30, feedGoal: 3, produceMs: 55_000, produceLabel: '양털', produceEmoji: '🧶', reward: 46, wellFedBonus: 1.5, body: '#f3f1ea', accent: '#cdbfae' },
  { id: 'cow', label: '젖소', emoji: '🐄', cost: 55, feedGoal: 4, produceMs: 74_000, produceLabel: '우유', produceEmoji: '🥛', reward: 78, wellFedBonus: 1.6, body: '#f5f2ec', accent: '#3f3a37' },
]

export const ANIMAL_MAP: Record<string, AnimalDef> = Object.fromEntries(ANIMALS.map((a) => [a.id, a]))

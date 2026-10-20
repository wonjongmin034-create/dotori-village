// 무기 — 여러 종류(계열)의 무기를 도토리로 단계별로 진화시킨다.
// 처음에는 모두 "나무 목검"을 들고 있고, 도토리를 써서 한 단계씩 진화한다. 단계가 올라갈수록 훨씬 많은 도토리가 든다.
// 무기는 모습만 멋진 장식이다 (싸우는 기능은 없음).

export type WeaponFamily = 'sword' | 'axe' | 'spear' | 'bow' | 'staff' | 'hammer'

export const WEAPON_FAMILIES: WeaponFamily[] = ['sword', 'axe', 'spear', 'bow', 'staff', 'hammer']
export const MAX_TIER = 6

export const FAMILY_LABEL: Record<WeaponFamily, string> = {
  sword: '검',
  axe: '도끼',
  spear: '창',
  bow: '활',
  staff: '마법 지팡이',
  hammer: '망치',
}
export const FAMILY_EMOJI: Record<WeaponFamily, string> = {
  sword: '🗡️',
  axe: '🪓',
  spear: '🔱',
  bow: '🏹',
  staff: '🪄',
  hammer: '🔨',
}

// 단계별 이름 (1단계 = 처음 모습)
export const TIER_NAMES: Record<WeaponFamily, string[]> = {
  sword: ['나무 목검', '철검', '은빛 강철검', '불꽃의 검', '용사의 룬검', '전설의 성검'],
  axe: ['나무 도끼', '철 도끼', '쌍날 도끼', '화염 도끼', '번개 도끼', '거신의 도끼'],
  spear: ['나무 창', '철 창', '은빛 장창', '불꽃 창', '폭풍의 삼지창', '별빛 신창'],
  bow: ['나무 활', '사냥꾼의 활', '은빛 활', '불꽃 활', '바람의 룬 활', '별빛 신궁'],
  staff: ['나뭇가지 지팡이', '수정 지팡이', '별 지팡이', '달빛 지팡이', '불사조 지팡이', '은하 지팡이'],
  hammer: ['나무 망치', '철 망치', '가시 망치', '용암 망치', '폭풍 망치', '천둥신의 망치'],
}

export const GRADES = [
  { name: '일반', color: '#8a8f96' },
  { name: '고급', color: '#4fae60' },
  { name: '희귀', color: '#3a8bd8' },
  { name: '영웅', color: '#9b59d6' },
  { name: '전설', color: '#f0a020' },
  { name: '신화', color: '#e8408a' },
]

// 한 단계 올리는 데 드는 도토리: [1→2, 2→3, 3→4, 4→5, 5→6]  (한 무기를 끝까지 키우면 합계 5,140개)
export const EVOLVE_COST = [120, 320, 700, 1400, 2600]
// 다른 종류의 무기를 새로 얻는 값 (1단계 나무 무기)
export const NEW_WEAPON_COST = 150

export const evolveCost = (tier: number): number | null => (tier >= 1 && tier < MAX_TIER ? EVOLVE_COST[tier - 1] : null)
export const totalCostToMax = () => EVOLVE_COST.reduce((a, b) => a + b, 0)

// 손에 쥐었을 때 기울기 (0 = 똑바로 세움, 1 = 앞으로 눕힘). 활·지팡이는 거의 세워서 든다.
export const HOLD_TILT: Record<WeaponFamily, number> = { sword: 1.05, axe: 1.0, spear: 0.8, bow: 0.1, staff: 0.5, hammer: 1.0 }

// 몸에서 바깥쪽으로 벌려 드는 정도 — 뒤에서 봐도 칼날·창끝이 몸에 가리지 않고 보이게
export const HOLD_ROLL: Record<WeaponFamily, number> = { sword: 0.42, axe: 0.36, spear: 0.32, bow: 0.12, staff: 0.2, hammer: 0.36 }

// 새 무기 종류를 얻으려면 필요한 집 단계 (검은 처음부터 가지고 있다). 이미 가진 무기는 그대로.
export const FAMILY_HOUSE: Record<WeaponFamily, number> = { sword: 1, axe: 2, spear: 2, bow: 3, hammer: 3, staff: 4 }

export const isFamily = (f: unknown): f is WeaponFamily => WEAPON_FAMILIES.includes(f as WeaponFamily)
export const tierName = (f: WeaponFamily, tier: number) => TIER_NAMES[f][Math.max(1, Math.min(MAX_TIER, tier)) - 1]
export const gradeOf = (tier: number) => GRADES[Math.max(1, Math.min(MAX_TIER, tier)) - 1]

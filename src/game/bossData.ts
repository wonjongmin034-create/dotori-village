// 보스 — 단계별 설정. 4명까지 들어가는 "보스 방"에서 3~4명이 팀으로 싸운다.
//  팀은 생명(하트)을 같이 쓴다. 한 사람씩 차례로 문제를 푼다.
//  맞히면 그 사람의 무기 단계만큼 보스 체력이 깎이고, 시간 안에 못 풀거나 틀리면 팀 생명이 1 깎인다.

export type StageId = 1 | 2 | 3 | 4

export type Stage = {
  id: StageId
  name: string // 보스 이름
  subject: string // 어떤 문제인지
  ms: number // 한 문제 제한 시간
  hp: number // 보스 체력
  life: number // 팀 생명(하트)
  reward: number // 처음 클리어할 때 받는 도토리 (한 번만)
  intro: string // 보스가 나올 때 한마디
  mixed?: boolean // 종합 보스: 문제를 섞어 내고, 체력이 줄면 페이즈가 올라가 어려워진다
  theme: { sky: string; fog: string; ground: string; ring: string; accent: string }
}

export const STAGES: Stage[] = [
  {
    id: 1,
    name: '셈돌 골렘',
    subject: '속도 연산',
    ms: 10_000,
    hp: 100,
    life: 5,
    reward: 30,
    intro: '덧셈·뺄셈·곱셈·나눗셈! 10초 안에 풀어라!',
    theme: { sky: '#bfe6ef', fog: '#cdeaf0', ground: '#86c46a', ring: '#c9c2ad', accent: '#ffb347' },
  },
  {
    id: 2,
    name: '알파벳 용 렉시',
    subject: '영어 단어',
    ms: 10_000,
    hp: 100,
    life: 5,
    reward: 60,
    intro: '영어 단어를 알아야 나를 이길 수 있다!',
    theme: { sky: '#cdb8f0', fog: '#d9cbf3', ground: '#6fb9a0', ring: '#b7aedc', accent: '#a98bff' },
  },
  {
    id: 3,
    name: '호랑이 장군',
    subject: '한국사 (조선 전기까지)',
    ms: 20_000,
    hp: 110,
    life: 6,
    reward: 100,
    intro: '역사를 모르는 자는 이 문을 지날 수 없다!',
    theme: { sky: '#f3c9a0', fog: '#f1d2b4', ground: '#b9a56a', ring: '#c9b48a', accent: '#e5533d' },
  },
  {
    id: 4,
    name: '올빼미 대마법사 아르카',
    subject: '종합 (5학년)',
    ms: 10_000,
    hp: 270,
    life: 6, // 기본 생명 — 팀원의 집이 좋을수록 늘어난다 (lifeFor)
    reward: 200,
    mixed: true,
    intro: '지금까지 배운 모든 것으로 덤벼라! 내 체력이 줄수록 문제는 어려워진다!',
    theme: { sky: '#1b1a44', fog: '#2a2860', ground: '#3b4080', ring: '#6c70c8', accent: '#ffd86b' },
  },
]

export const stageOf = (id: number): Stage => STAGES[Math.max(1, Math.min(STAGES.length, id)) - 1]

export const MIN_PARTY = 3
export const BOSS_DAILY = 5 // 하루에 보스에 도전할 수 있는 횟수 (전투를 시작할 때마다 1번 쓴다)

// 종합(4단계) 보스의 팀 생명 = 기본 생명 + 팀원 각자의 집 보너스. 집 1~5단계 → 0·0·1·1·2 (합계는 최대 6)
export const HOUSE_LIFE = [0, 0, 1, 1, 2]
export const HOUSE_LIFE_CAP = 6
export const houseLife = (houseLv: number) => HOUSE_LIFE[Math.max(1, Math.min(HOUSE_LIFE.length, Math.round(houseLv || 1))) - 1]
export function lifeFor(cfg: Stage, houseLevels: number[]): number {
  if (!cfg.mixed) return cfg.life
  return cfg.life + Math.min(HOUSE_LIFE_CAP, houseLevels.reduce((a, lv) => a + houseLife(lv), 0))
}

// 선생님 혼자 시험해 볼 수 있는 연습 모드: 주소 끝에 ?solo 를 붙이면 1명으로도 시작하고 모든 단계를 고를 수 있다.
// 대신 3명 미만으로 한 판은 도토리·클리어 기록이 없다 (그래서 학생이 주소를 따라 써도 얻을 것이 없다).
export const soloTest = () => typeof location !== 'undefined' && /[?&]solo(\b|=)/.test(location.search)
export const MAX_PARTY = 4
export const BOSS_ROOMS = 9 // 보스 방 번호는 1~9

// 무기 단계(1~6)에 따른 공격력. 승부는 문제를 맞히는 것이 크고, 무기는 보너스.
export const BASE_DMG = 10
export const TIER_MULT = [1, 1.15, 1.3, 1.5, 1.75, 2]
// 4단계(종합)는 무기 단계 차이가 훨씬 크다: 1단계 무기는 6, 6단계 무기는 30. (밸런스는 시뮬레이션으로 맞춤)
export const STAGE_DMG: Record<number, number[]> = { 4: [6, 9, 13, 18, 24, 30] }
export const dmgOf = (tier: number, stage = 1) => {
  const t = Math.max(1, Math.min(6, Math.round(tier || 1)))
  const table = STAGE_DMG[stage]
  return table ? table[t - 1] : Math.round(BASE_DMG * TIER_MULT[t - 1])
}

// 종합 보스의 페이즈: 보스 체력이 66% 아래면 2, 33% 아래면 3. 페이즈가 오를 때마다 팀 생명이 조금 회복된다.
export const phaseOf = (hp: number, maxHp: number): 1 | 2 | 3 => (hp / maxHp > 0.66 ? 1 : hp / maxHp > 0.33 ? 2 : 3)
export const HEAL_ON_PHASE = 2
// 종합(4단계) 보스는 학생이 틀리거나 시간이 넘으면 체력을 이만큼 회복한다 (가위바위보 비김은 제외, 최대 체력까지)
export const BOSS_HEAL_ON_MISS = 8
export const RPS_WIN_MULT = 1.5 // 가위바위보에서 이기면 이만큼 센 공격

export const RESULT_MS = 1900 // 문제 하나가 끝나고 정답·연출을 보여 주는 시간
export const ANSWER_GRACE_MS = 1200 // 인터넷 지연 때문에 억울하지 않게 더 기다려 주는 시간

// 보스 — 단계별 설정. 4명까지 들어가는 "보스 방"에서 3~4명이 팀으로 싸운다.
//  팀은 생명(하트)을 같이 쓴다. 한 사람씩 차례로 문제를 푼다.
//  맞히면 그 사람의 무기 단계만큼 보스 체력이 깎이고, 시간 안에 못 풀거나 틀리면 팀 생명이 1 깎인다.

export type StageId = 1 | 2 | 3

export type Stage = {
  id: StageId
  name: string // 보스 이름
  subject: string // 어떤 문제인지
  ms: number // 한 문제 제한 시간
  hp: number // 보스 체력
  life: number // 팀 생명(하트)
  reward: number // 처음 클리어할 때 받는 도토리 (한 번만)
  intro: string // 보스가 나올 때 한마디
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
    ms: 15_000,
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
]

export const stageOf = (id: number): Stage => STAGES[Math.max(1, Math.min(STAGES.length, id)) - 1]

export const MIN_PARTY = 3
export const MAX_PARTY = 4
export const BOSS_ROOMS = 9 // 보스 방 번호는 1~9

// 무기 단계(1~6)에 따른 공격력. 승부는 문제를 맞히는 것이 크고, 무기는 보너스.
export const BASE_DMG = 10
export const TIER_MULT = [1, 1.15, 1.3, 1.5, 1.75, 2]
export const dmgOf = (tier: number) => Math.round(BASE_DMG * TIER_MULT[Math.max(1, Math.min(6, Math.round(tier || 1))) - 1])

export const RESULT_MS = 1900 // 문제 하나가 끝나고 정답·연출을 보여 주는 시간
export const ANSWER_GRACE_MS = 1200 // 인터넷 지연 때문에 억울하지 않게 더 기다려 주는 시간

// 도토리 탑 — 혼자 몬스터 한 무리를 잡고, 떨어진 보물상자의 문제 3개(수학·영어·국어)를 모두 맞히면 그 단계 클리어.
// 상자 문제를 하나라도 틀리면 클리어가 아니다 → 몬스터부터 다시 싸운다 (입장권 1장 더).
// 하루 입장권 3장. 처음 깬 단계에만 도토리를 주고, 깬 단계마다 글자 칭호를 달아 준다 (가장 높은 단계 칭호가 자동으로 붙는다).

import { dmgOf, houseLife } from './bossData'
import type { WeaponFamily } from './weapons'

export type MonsterKind = 'slime' | 'mushroom' | 'bat' | 'shooter' | 'charger' | 'boss'

export type KindDef = {
  name: string
  r: number // 몸 반지름 (부딪힘)
  speed: number
  scale: number // 그릴 때 크기
  contact: boolean // 닿으면 아픈지 (원거리 몬스터는 거리를 두므로 닿아도 아프다)
}

export const KINDS: Record<MonsterKind, KindDef> = {
  slime: { name: '슬라임', r: 0.55, speed: 1.5, scale: 1, contact: true },
  mushroom: { name: '달려드는 버섯', r: 0.5, speed: 2.7, scale: 1, contact: true },
  bat: { name: '박쥐', r: 0.42, speed: 4.1, scale: 1, contact: true },
  shooter: { name: '가시 도깨비불', r: 0.5, speed: 2.1, scale: 1, contact: true },
  charger: { name: '멧돼지', r: 0.75, speed: 2.0, scale: 1, contact: true },
  boss: { name: '우두머리', r: 1.4, speed: 1.8, scale: 2.2, contact: true },
}

export type Spawn = [MonsterKind, number, number] // 종류, 마릿수, 한 마리 체력

export type TowerStage = {
  id: number
  name: string // 단계 이름 (장소)
  intro: string
  spawns: Spawn[]
  rec: number // 권장 무기 단계
  house: number // 필요한 집 단계
  reward: number // 처음 클리어할 때만 받는 도토리
  title: string // 클리어하면 받는 칭호
  color: string // 칭호 색
  theme: { sky: string; fog: string; ground: string; ring: string; accent: string }
  // 수학·국어 문제 난이도(1 쉬움 · 2 보통 · 3 어려움)와 영어 문제 종류
  mathLv: 1 | 2 | 3
  koLv: 1 | 2 | 3
}

export const STAGE_COUNT = 8
export const TOWER_DAILY = 3 // 하루 입장권
export const QUIZ_MS = 30_000 // 상자 문제 하나당 제한 시간
export const MAX_ALIVE = 6 // 한 번에 화면에 있는 몬스터 수 (태블릿 성능)
export const ARENA_R = 10

export const TOWER: TowerStage[] = [
  {
    id: 1, name: '슬라임 언덕', intro: '말랑말랑 슬라임들을 모두 물리쳐요!',
    spawns: [['slime', 6, 15]], rec: 1, house: 1, reward: 10, title: '슬라임 사냥꾼', color: '#8bd450',
    theme: { sky: '#bfe6ef', fog: '#cdeaf0', ground: '#86c46a', ring: '#c9c2ad', accent: '#8bd450' }, mathLv: 1, koLv: 1,
  },
  {
    id: 2, name: '버섯 숲', intro: '달려드는 버섯을 조심해요!',
    spawns: [['slime', 3, 30], ['mushroom', 6, 35]], rec: 2, house: 1, reward: 15, title: '버섯 정복자', color: '#3fa34d',
    theme: { sky: '#c9e8c0', fog: '#d4ecc9', ground: '#5fa857', ring: '#b8c9a0', accent: '#e86a6a' }, mathLv: 2, koLv: 2,
  },
  {
    id: 3, name: '박쥐 동굴', intro: '빠르고 어지러운 박쥐 떼!',
    spawns: [['bat', 4, 40], ['slime', 3, 40], ['mushroom', 3, 40]], rec: 2, house: 2, reward: 25, title: '박쥐 추격자', color: '#3aa7e6',
    theme: { sky: '#8aa0c8', fog: '#97aacf', ground: '#6a7690', ring: '#9aa4b8', accent: '#7ab8ff' }, mathLv: 2, koLv: 2,
  },
  {
    id: 4, name: '불꽃 협곡', intro: '멀리서 쏘는 도깨비불을 피하며 싸워요!',
    spawns: [['shooter', 3, 45], ['mushroom', 3, 50], ['bat', 3, 45], ['slime', 3, 50]], rec: 3, house: 2, reward: 35, title: '사격 명수', color: '#2b5fd9',
    theme: { sky: '#f3c9a0', fog: '#f1d2b4', ground: '#b9915a', ring: '#c9a878', accent: '#ff7a3d' }, mathLv: 3, koLv: 3,
  },
  {
    id: 5, name: '멧돼지 고개', intro: '돌진을 피하고, 우두머리를 쓰러뜨려요!',
    spawns: [['boss', 1, 120], ['charger', 4, 60], ['shooter', 3, 50], ['mushroom', 3, 50]], rec: 3, house: 3, reward: 50, title: '돌진 막이', color: '#8e4fd8',
    theme: { sky: '#d6c4ee', fog: '#ddd0f1', ground: '#8f7fb0', ring: '#b7aedc', accent: '#a98bff' }, mathLv: 3, koLv: 3,
  },
  {
    id: 6, name: '용사의 성', intro: '온갖 몬스터가 한꺼번에 몰려와요!',
    spawns: [['charger', 3, 70], ['shooter', 3, 55], ['bat', 4, 45], ['mushroom', 4, 55], ['slime', 2, 70]], rec: 4, house: 3, reward: 70, title: '탑의 용사', color: '#f08a1c',
    theme: { sky: '#f0d9a8', fog: '#f1e0b8', ground: '#a8a58f', ring: '#c8c2a8', accent: '#f08a1c' }, mathLv: 3, koLv: 3,
  },
  {
    id: 7, name: '폭풍 정상', intro: '바람처럼 빠른 적들이 몰려와요!',
    spawns: [['bat', 5, 50], ['shooter', 3, 60], ['charger', 4, 80], ['mushroom', 3, 60], ['slime', 2, 40]], rec: 4, house: 4, reward: 90, title: '폭풍 돌파자', color: '#e0392d',
    theme: { sky: '#7a86a8', fog: '#8a94b4', ground: '#58607c', ring: '#8a94b4', accent: '#e0392d' }, mathLv: 3, koLv: 3,
  },
  {
    id: 8, name: '정복자의 왕좌', intro: '탑의 주인이 나타났다! 모든 힘을 다해 싸워요!',
    spawns: [['boss', 1, 700], ['mushroom', 10, 50]], rec: 5, house: 4, reward: 120, title: '탑의 정복자', color: '#e8b317',
    theme: { sky: '#1b1a44', fog: '#2a2860', ground: '#3b4080', ring: '#6c70c8', accent: '#ffd86b' }, mathLv: 3, koLv: 3,
  },
]

export const towerStage = (id: number): TowerStage => TOWER[Math.max(1, Math.min(STAGE_COUNT, id)) - 1]
export const stageTotalHp = (s: TowerStage) => s.spawns.reduce((a, [, n, hp]) => a + n * hp, 0)
export const stageMonsterCount = (s: TowerStage) => s.spawns.reduce((a, [, n]) => a + n, 0)

// 가장 높게 깬 단계의 칭호 (0 이면 없음)
export const titleOf = (best: number): { text: string; color: string } | null =>
  best >= 1 ? { text: TOWER[Math.min(STAGE_COUNT, best) - 1].title, color: TOWER[Math.min(STAGE_COUNT, best) - 1].color } : null

/* ---------- 내 하트와 공격 ---------- */
export const HEARTS_BASE = 3
export const heartsFor = (houseLv: number, tester = false) => (tester ? HEARTS_BASE : HEARTS_BASE + houseLife(houseLv)) // 집 1~5단계 → 3·3·4·4·5 (시험 계정은 항상 3)

// 선생님 시험 계정: 입장권·단계 순서·집 단계 제한 없이 아무 단계나 들어갈 수 있다. 하트는 기본 3개로 고정 (학생이 처음 겪는 난이도 그대로 점검).
// 이 계정은 앞 단계를 깨지 않은 단계는 클리어해도 기록·도토리·칭호가 바뀌지 않는다.
export const TOWER_TESTERS = ['원종민']
export const isTowerTester = (name: string | null | undefined) => !!name && TOWER_TESTERS.includes(name.trim())
export const INVULN_S = 2 // 맞은 뒤 무적 시간

// 활·지팡이는 쏜 뒤 이 시간 동안 이동 속도가 절반이 된다 ("쏘면서 도망"을 막는다)
export const RANGED_SLOW_S = 0.35
export const RANGED_SLOW_MULT = 0.5

export type WeaponStyle = {
  melee: boolean
  range: number // 가까이 때리는 무기의 사거리 / 날아가는 공격의 최대 거리
  arc: number // 휘두르는 각도 (라디안, 부채꼴 전체 폭)
  cd: number // 다시 공격할 수 있을 때까지 (초)
  mult: number // 공격력 배율
  speed?: number // 날아가는 공격의 속도
  splash?: number // 날아가 터지는 범위
}
export const STYLE: Record<WeaponFamily, WeaponStyle> = {
  sword: { melee: true, range: 2.4, arc: (130 * Math.PI) / 180, cd: 0.46, mult: 1.2 },
  axe: { melee: true, range: 2.5, arc: (210 * Math.PI) / 180, cd: 0.72, mult: 1.8 },
  spear: { melee: true, range: 3.5, arc: (46 * Math.PI) / 180, cd: 0.56, mult: 1.4 },
  hammer: { melee: true, range: 2.3, arc: Math.PI * 2, cd: 0.92, mult: 2.2 },
  bow: { melee: false, range: 10, arc: 0, cd: 0.52, mult: 1.4, speed: 15 },
  staff: { melee: false, range: 8.5, arc: 0, cd: 0.82, mult: 1.9, speed: 10, splash: 1.5 },
}

// 한 번 맞혔을 때 주는 피해 = 무기 단계별 기본 공격력 × 무기 종류 배율 + 펫 보너스
export const hitDamage = (family: WeaponFamily, tier: number, petStage: number) =>
  Math.max(1, Math.round(dmgOf(tier, 1, petStage) * STYLE[family].mult))

/* ---------- 입장 조건 ---------- */
export type EnterCheck = { ok: boolean; why: string }
export function canEnter(stageId: number, best: number, houseLv: number, left: number, tester = false): EnterCheck {
  if (tester) return { ok: true, why: '' }
  const st = towerStage(stageId)
  if (stageId > best + 1) return { ok: false, why: `${stageId - 1}단계를 먼저 깨야 해요` }
  if (houseLv < st.house) return { ok: false, why: `🔒 집이 ${st.house}단계가 되면 도전할 수 있어요` }
  if (left <= 0) return { ok: false, why: '오늘 입장권을 모두 썼어요' }
  return { ok: true, why: '' }
}

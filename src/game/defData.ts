// 도토리 나무 수비대 (디펜스) — 규칙과 숫자. 여기 숫자만 바꾸면 난이도가 조절된다.
//  · 2~4명이 한 방에서 함께. 길을 따라 몰려오는 몬스터로부터 도토리 나무를 지킨다.
//  · 빈 터에 탑을 지으려면 문제를 맞혀야 한다 (틀리면 낸 돈을 잃는다). 몬스터를 잡으면 돈 → 탑 진화(1~5단계).
//  · 몬스터를 잡은 탑의 주인이 70%, 나머지 30%는 팀원 모두가 나눠 갖는다.
//  · 직업 = 전문 탑: 내 직업의 탑은 30% 싸고 2단계로 지어지며, 3단계부터 핵심 능력 +30%.
import type { WeaponFamily } from './weapons'

// 아직 학생들에게 공개하지 않았다 — 주소 끝에 ?def 를 붙이면 들어가는 버튼이 보인다 (선생님 시험용). 공개하려면 true 로.
export const DEF_OPEN = false
export const defVisible = () => {
  if (DEF_OPEN) return true
  try {
    return /[?&](def|solo)(|=)/.test(location.search)
  } catch {
    return false
  }
}
export const DEF_ROOMS = 9
export const DEF_MIN = 2
export const DEF_MAX = 4
export const DEF_DAILY = 3 // 하루 입장(전투 시작) 횟수
export const DEF_STAGES = 3
export const DEF_WAVES = 10
export const START_GOLD = 150
export const TREE_HP = 20
export const QUIZ_MS = 7000 // 문제 제한 시간 (짧게 — 친구에게 묻지 않고 스스로)
export const QUIZ_LONG_MS = 9000 // 글이 긴 문제·받아쓰기
export const PREP_MS = 15_000 // 첫 웨이브 전 준비 시간
export const BREAK_MS = 9000 // 웨이브 사이 쉬는 시간
export const OWNER_SHARE = 0.7 // 잡은 탑 주인 몫

/* ---------- 맵 (월드 좌표: x 왼→오, z 위→아래, 카메라는 +z 쪽에서 내려다본다) ---------- */
export const PATH: [number, number][] = [
  [-13.5, -5.5],
  [7, -5.5],
  [7, -0.5],
  [-7, -0.5],
  [-7, 4.5],
  [9, 4.5],
  [9, 7.6],
]
export const TREE_POS: [number, number] = [9, 8.4]
// 탑을 지을 수 있는 빈 터
export const SPOTS: [number, number][] = [
  [-9, -8.2], [-3, -8.2], [3, -8.2],
  [-10, -3], [-5, -3], [-1, -3], [3, -3], [9.6, -3],
  [-9.6, 2], [-3, 2], [1, 2], [5, 2],
  [-3, 7.2], [1.5, 7.2], [5.5, 7.2], [11.8, 6],
]

const segs = PATH.slice(1).map((p, i) => {
  const a = PATH[i]
  const len = Math.hypot(p[0] - a[0], p[1] - a[1])
  return { a, b: p, len }
})
export const PATH_LEN = segs.reduce((s, x) => s + x.len, 0)
// 길 위 거리 d 의 위치
export function pathPos(d: number): [number, number] {
  let r = Math.max(0, Math.min(PATH_LEN, d))
  for (const s of segs) {
    if (r <= s.len) {
      const t = s.len ? r / s.len : 0
      return [s.a[0] + (s.b[0] - s.a[0]) * t, s.a[1] + (s.b[1] - s.a[1]) * t]
    }
    r -= s.len
  }
  return PATH[PATH.length - 1]
}

/* ---------- 탑 ---------- */
export type TowerKind = WeaponFamily // 탑 종류 = 직업(무기) 종류
export type TowerDef = {
  kind: TowerKind
  name: string
  emoji: string
  role: string
  range: number
  dmg: number // 한 번 공격 피해
  rate: number // 공격 간격(초)
  hp: number
  air: number // 하늘 몬스터에게 주는 피해 배율 (0 = 못 때림)
  splash?: number // 범위 피해 반경
  melee?: boolean // 가까이 베기 (빠른 몬스터에게 빗나가지 않는다)
  branches: [string, string] // 3단계 갈림길 이름
  branchDesc: [string, string]
  spec: string // 전문가 강화 설명
}

export const TOWERS: Record<TowerKind, TowerDef> = {
  sword: {
    kind: 'sword', name: '검사 초소', emoji: '🗡️', role: '탱커 — 체력이 아주 많고, 주변 몬스터의 공격을 끌어와요',
    range: 2.9, dmg: 8, rate: 0.6, hp: 260, air: 0, melee: true,
    branches: ['철벽 초소', '반격 초소'], branchDesc: ['체력 +60%, 끌어오는 범위 +1', '공격력 ×1.7, 맞으면 되받아쳐요'],
    spec: '체력 +30%, 끌어오는 범위 +30%',
  },
  hammer: {
    kind: 'hammer', name: '대장간', emoji: '🔨', role: '수리 — 주변 탑의 체력을 계속 고쳐요',
    range: 3.2, dmg: 5, rate: 1.0, hp: 140, air: 0, melee: true,
    branches: ['명장의 대장간', '전투 대장간'], branchDesc: ['수리량 ×1.8', '주변 탑 공격력 +20%'],
    spec: '수리량 +30%',
  },
  bow: {
    kind: 'bow', name: '궁수탑', emoji: '🏹', role: '대공 — 하늘을 나는 몬스터를 잡아요',
    range: 5, dmg: 8, rate: 0.6, hp: 100, air: 1.3,
    branches: ['연사 궁수', '저격 궁수'], branchDesc: ['공격 속도 ×1.8', '사거리 +2, 공격력 ×1.8'],
    spec: '하늘 몬스터 피해 +30%',
  },
  staff: {
    kind: 'staff', name: '마법탑', emoji: '🪄', role: '범위 — 몰려오는 떼를 한 번에 쓸어요',
    range: 4.2, dmg: 8, rate: 1.25, hp: 100, air: 0.5, splash: 1.4,
    branches: ['불꽃 마법', '얼음 마법'], branchDesc: ['맞은 몬스터가 불타요 (지속 피해)', '맞은 몬스터가 느려져요'],
    spec: '폭발 범위 +30%',
  },
  axe: {
    kind: 'axe', name: '투석기', emoji: '🪓', role: '방어 뚫기 — 단단한 몬스터에게 큰 피해',
    range: 4.6, dmg: 24, rate: 1.9, hp: 110, air: 0, splash: 0.7,
    branches: ['바위 폭탄', '철퇴 투석기'], branchDesc: ['폭발 범위 ×2.4', '공격력 ×1.8'],
    spec: '철갑 몬스터 피해 +30%',
  },
  spear: {
    kind: 'spear', name: '창 함정', emoji: '🔱', role: '저지 — 빠른 몬스터를 붙잡아 멈춰요',
    range: 2.9, dmg: 6, rate: 0.9, hp: 110, air: 0, melee: true,
    branches: ['독창 함정', '연속 찌르기'], branchDesc: ['찔린 몬스터가 중독돼요', '공격 속도 ×2'],
    spec: '붙잡는 시간 +30%',
  },
}
export const TOWER_KINDS: TowerKind[] = ['sword', 'hammer', 'bow', 'staff', 'axe', 'spear']

export const BUILD_COST = 40
export const EVOLVE_COST = [0, 0, 40, 80, 140, 220] // [_, _, →2, →3, →4, →5]
export const SPEC_DISCOUNT = 0.7
export const SPEC_BOOST = 1.3
export const TIER_DMG = [0, 1, 1.5, 2.2, 3.2, 4.6]
export const TIER_HP = [0, 1, 1.4, 1.9, 2.6, 3.5]
export const TIER_RANGE = [0, 0, 0.2, 0.4, 0.6, 0.9]
export const MAX_TOWER_TIER = 5
export const HOLD_S = 0.7 // 창 함정이 붙잡는 시간
export const HEAL_PER_S = 5 // 대장간 기본 수리량 (초당)
export const TAUNT_R = 3.2 // 검사 초소가 끌어오는 범위
export const SYNERGY_R = 3.2 // 연계: 이 거리 안에 서로 다른 탑 3종류 → 공격력 +10%
export const SYNERGY = 1.1

export const buildCost = (kind: TowerKind, job: string | null) => Math.round(BUILD_COST * (job === kind ? SPEC_DISCOUNT : 1))
export const evolveCost = (kind: TowerKind, tier: number, job: string | null) =>
  tier >= MAX_TOWER_TIER ? null : Math.round(EVOLVE_COST[tier + 1] * (job === kind ? SPEC_DISCOUNT : 1))

/* ---------- 몬스터 ---------- */
export type MonKind = 'slime' | 'bat' | 'turtle' | 'fox' | 'goblin' | 'bomb' | 'blob' | 'king'
export type MonDef = {
  kind: MonKind
  name: string
  emoji: string
  hp: number
  spd: number
  gold: number
  leak: number // 나무까지 가면 깎는 체력
  air?: boolean
  armor?: number // 투석기 말고 다른 탑의 피해 배율
  evasive?: number // 날아가는 공격이 빗나갈 확률 (가까이 베기·창은 빗나가지 않는다)
  attack?: number // 지나가며 탑을 공격 (초당 피해)
  bomb?: number // 탑에 달려들어 자폭 (피해)
  split?: number // 잡히면 슬라임 몇 마리로 갈라지는지
  hint: string
}
export const MONSTERS: Record<MonKind, MonDef> = {
  slime: { kind: 'slime', name: '슬라임', emoji: '🟢', hp: 22, spd: 1.9, gold: 5, leak: 1, hint: '기본 몬스터' },
  bat: { kind: 'bat', name: '박쥐', emoji: '🦇', hp: 16, spd: 2.4, gold: 6, leak: 1, air: true, hint: '하늘을 날아요 — 궁수탑·마법탑만 맞힐 수 있어요' },
  turtle: { kind: 'turtle', name: '철갑 거북', emoji: '🐢', hp: 70, spd: 1.0, gold: 12, leak: 2, armor: 0.4, hint: '아주 단단해요 — 투석기가 잘 뚫어요' },
  fox: { kind: 'fox', name: '바람 여우', emoji: '🦊', hp: 20, spd: 3.6, gold: 8, leak: 1, evasive: 0.5, hint: '아주 빨라서 화살·마법이 잘 빗나가요 — 창 함정으로 붙잡아요' },
  goblin: { kind: 'goblin', name: '도끼 고블린', emoji: '👺', hp: 45, spd: 1.4, gold: 10, leak: 1, attack: 6, hint: '지나가며 탑을 부숴요 — 검사 초소로 막고 대장간으로 고쳐요' },
  bomb: { kind: 'bomb', name: '폭탄벌레', emoji: '💣', hp: 18, spd: 2.2, gold: 6, leak: 1, bomb: 30, hint: '탑에 달려들어 터져요' },
  blob: { kind: 'blob', name: '큰 슬라임', emoji: '🫧', hp: 45, spd: 1.5, gold: 6, leak: 2, split: 2, hint: '잡으면 작은 슬라임 둘로 갈라져요 — 마법탑으로 한꺼번에' },
  king: { kind: 'king', name: '몬스터 대왕', emoji: '👑', hp: 450, spd: 0.75, gold: 100, leak: 6, armor: 0.5, attack: 10, hint: '우두머리! 단단하고 탑을 부숴요 — 다 함께!' },
}

/* ---------- 단계 · 웨이브 ---------- */
export type StageDef = { id: number; name: string; hpMult: number; reward: [number, number, number] } // ★1·★2·★3 처음 달성 보상
export const DEF_STAGE_LIST: StageDef[] = [
  { id: 1, name: '들판 입구', hpMult: 1, reward: [30, 20, 30] },
  { id: 2, name: '들판 한가운데', hpMult: 1.35, reward: [40, 30, 40] },
  { id: 3, name: '들판 끝 언덕', hpMult: 1.4, reward: [50, 40, 60] },
]
export const defStage = (s: number) => DEF_STAGE_LIST[Math.max(1, Math.min(DEF_STAGES, s)) - 1]
// 남은 나무 체력 → 별
export const starsFor = (tree: number) => (tree <= 0 ? 0 : tree >= TREE_HP * 0.9 ? 3 : tree >= TREE_HP * 0.5 ? 2 : 1)

export type Spawn = [MonKind, number, number] // 종류, 마리 수, 간격(초)
// 웨이브 구성 — 단계가 오를수록 섞이는 종류가 많아진다
export function waveOf(stage: number, w: number): Spawn[] {
  const n = 6 + w * 2
  const s = stage
  const list: Spawn[] = []
  if (w === 5) return [['slime', 8, 0.6], ['king', 1, 1], ['goblin', 2 + s, 1.2]]
  if (w === 10) return [['blob', 6, 0.8], ['king', 1 + (s >= 3 ? 1 : 0), 4], ['turtle', 2 + s, 1.5], ['bat', 4 + s * 2, 0.5]]
  list.push(['slime', n, 0.7])
  if (w >= 2) list.push(['goblin', 1 + Math.floor(w / 3) + (s - 1), 1.6])
  if (w >= 3 || s >= 2) list.push(['bat', 2 + Math.floor(w / 2) + s, 0.8])
  if (w >= 4) list.push(['turtle', 1 + Math.floor(w / 4) + (s - 1), 2.2])
  if (w >= 6 || s >= 2) list.push(['fox', 2 + Math.floor(w / 3) + s, 0.9])
  if (w >= 7 || s >= 3) list.push(['bomb', 2 + Math.floor(w / 4) + s, 1.2])
  if (w >= 8) list.push(['blob', 2 + s, 1.4])
  return list
}
// 사람 수에 따른 몬스터 체력 (2명이어도 깰 수 있게)
export const TEAM_HP = [0.7, 0.7, 0.75, 0.88, 1]
export const waveHpMult = (stage: number, w: number) => defStage(stage).hpMult * (1 + 0.07 * (w - 1))

// 보급 상자 · 긴급 퀴즈
export const BOX_GOLD = 40
export const BOX_CHANCE = 0.45
export const EMERGENCY_STUN_S = 5

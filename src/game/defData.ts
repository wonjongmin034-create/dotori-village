// 도토리 나무 수비대 (디펜스) — 규칙과 숫자. 여기 숫자만 바꾸면 난이도가 조절된다.
//  · 2~4명이 한 방에서 함께. 길을 따라 몰려오는 몬스터로부터 도토리 나무를 지킨다.
//  · 빈 터에 탑을 지으려면 문제를 맞혀야 한다 (틀리면 낸 돈을 잃는다). 몬스터를 잡으면 돈 → 탑 진화(1~6단계).
//  · 4단계부터는 내 직업 탑만, 5단계(각성)는 직업 무기 영웅(4단계)↑, 6단계(전설 · 수호 신수)는 전설(5단계)↑.
//  · 몬스터를 잡은 탑의 주인이 70%, 나머지 30%는 팀원 모두가 나눠 갖는다.
//  · 직업 = 전문 탑: 내 직업의 탑은 30% 싸고 2단계로 지어지며, 3단계부터 핵심 능력 +30%.
import { FAMILY_LABEL, gradeOf, type WeaponFamily } from './weapons'

// 아직 학생들에게 공개하지 않았다 — 주소 끝에 ?def 를 붙이면 들어가는 버튼이 보인다 (선생님 시험용). 공개하려면 true 로.
export const DEF_OPEN = true
export const defVisible = () => {
  if (DEF_OPEN) return true
  try {
    return /[?&](def|solo)(\b|=)/.test(location.search)
  } catch {
    return false
  }
}
export const DEF_ROOMS = 9
export const DEF_MIN = 2
export const DEF_MAX = 4
export const DEF_DAILY = 10 // 하루 입장(전투 시작) 횟수
export const DEF_STAGES = 7
export const DEF_WAVES = 10
export const START_GOLD = 150
export const STAGE_GOLD = 40 // 단계마다 시작 돈 추가 (높은 단계는 처음부터 더 많이 짓게)
export const TREE_HP = 10
export const QUIZ_MS = 7000 // 문제 제한 시간 (짧게 — 친구에게 묻지 않고 스스로)
export const QUIZ_LONG_MS = 9000 // 글이 긴 문제·받아쓰기
export const PREP_MS = 15_000 // 첫 웨이브 전 준비 시간
export const BREAK_MS = 9000 // 웨이브 사이 쉬는 시간
export const OWNER_SHARE = 0.7 // 잡은 탑 주인 몫

/* ---------- 맵 (월드 좌표: x 왼→오, z 위→아래, 카메라는 +z 쪽에서 내려다본다) ----------
   단계마다 맵이 다르다. 단계가 오를수록 길이 짧아지고 갈래가 늘어 더 어려워진다.
   · 1단계: 한 줄로 길게 굽은 길
   · 2단계: 길이 두 갈래로 나뉘었다가 나무 앞에서 다시 만난다 (몬스터가 번갈아 양쪽으로)
   · 3단계: 왼쪽·오른쪽 두 굴에서 동시에 몰려온다
   · 4단계: 왼쪽 위·아래 두 굴, 나무는 오른쪽 — 길이 더 짧다
   · 5단계: 왼쪽·오른쪽·위 세 굴에서 한꺼번에
   · 6단계: 세 굴 + 위 굴의 길이 아주 짧다, 유령이 나온다
   · 7단계: 네 모서리 굴, 나무는 한가운데 — 사방에서 몰려온다, 방패 기사가 나온다 */
export type Pt = [number, number]
type Seg = { a: Pt; b: Pt; len: number }
export type Lane = { pts: Pt[]; segs: Seg[]; len: number }
export type DefMap = { id: number; tip: string; lanes: Lane[]; spots: Pt[]; tree: Pt; dens: { p: Pt; rot: number }[] }

const lane = (pts: Pt[]): Lane => {
  const segs = pts.slice(1).map((b, i) => {
    const a = pts[i]
    return { a, b, len: Math.hypot(b[0] - a[0], b[1] - a[1]) }
  })
  return { pts, segs, len: segs.reduce((s, x) => s + x.len, 0) }
}

export const DEF_MAPS: DefMap[] = [
  {
    id: 1,
    tip: '한 갈래로 길게 굽은 길이에요.',
    lanes: [
      lane([
        [-13.5, -5.5],
        [7, -5.5],
        [7, -0.5],
        [-7, -0.5],
        [-7, 4.5],
        [9, 4.5],
        [9, 7.6],
      ]),
    ],
    tree: [9, 8.4],
    dens: [{ p: [-15.2, -5.5], rot: 0 }],
    spots: [
      [-9, -8.2], [-3, -8.2], [3, -8.2],
      [-10, -3], [-5, -3], [-1, -3], [3, -3], [9.6, -3],
      [-9.6, 2], [-3, 2], [1, 2], [5, 2],
      [-3, 7.2], [1.5, 7.2], [5.5, 7.2], [11.5, 3.6],
    ],
  },
  {
    id: 2,
    tip: '길이 두 갈래로 나뉘어요! 몬스터가 번갈아 양쪽 길로 와요. 길도 더 짧아요.',
    lanes: [
      lane([
        [-13.5, -6.5],
        [11, -6.5],
        [11, 4],
        [-1, 4],
        [-1, 7.6],
      ]),
      lane([
        [-13.5, -6.5],
        [-1, -6.5],
        [-1, -1],
        [-11, -1],
        [-11, 4],
        [-1, 4],
        [-1, 7.6],
      ]),
    ],
    tree: [-1, 8.4],
    dens: [{ p: [-15.2, -6.5], rot: 0 }],
    spots: [
      [-9, -9], [-4, -9], [3, -9], [8, -9],
      [-8, -3.75], [-4, -3.75], [2, -3.75], [8, -3.75],
      [-13.5, 1.5], [-8, 1.5], [-4, 1.5], [1.5, 1.5], [5, 1.5], [8.5, 1.5], [13.5, -1],
      [-6, 6.8], [4, 6.8],
    ],
  },
  {
    id: 3,
    tip: '왼쪽·오른쪽 두 굴에서 동시에 몰려와요! 팀을 나눠서 양쪽을 막아요.',
    lanes: [
      lane([
        [-13.5, -7],
        [-6, -7],
        [-6, -1],
        [-12, -1],
        [-12, 5],
        [-0.5, 5],
        [-0.5, 7.6],
      ]),
      lane([
        [12.5, -7],
        [5, -7],
        [5, -1],
        [11, -1],
        [11, 5],
        [-0.5, 5],
        [-0.5, 7.6],
      ]),
    ],
    tree: [-0.5, 8.4],
    dens: [
      { p: [-15.2, -7], rot: 0 },
      { p: [14.2, -7], rot: Math.PI },
    ],
    spots: [
      [-10, -9.5], [-9, -4], [-3.5, -4], [-14.5, 2], [-9, 2], [-4, 2], [-6, 7.5],
      [9, -9.5], [8, -4], [2.5, -4], [13.5, 2], [8, 2], [3, 2], [5, 7.5],
      [-0.5, 1.5],
    ],
  },
  {
    id: 4,
    tip: '왼쪽 위·아래 두 굴에서 와요! 길이 짧아서 금방 나무에 닿아요. 돌 골렘·치유 주술사·새끼 용도 나와요.',
    lanes: [
      lane([
        [-13.5, -7.5],
        [-3, -7.5],
        [-3, -2.5],
        [5, -2.5],
        [5, 2.5],
        [11.2, 2.5],
      ]),
      lane([
        [-13.5, 7.5],
        [-3, 7.5],
        [-3, 2.5],
        [11.2, 2.5],
      ]),
    ],
    tree: [12, 2.2],
    dens: [
      { p: [-15.2, -7.5], rot: 0 },
      { p: [-15.2, 7.5], rot: 0 },
    ],
    spots: [
      [-11, -10], [-6, -10], [-10, -5], [-6, -5], [0, -5], [7.5, -5],
      [-6, 0], [-0.5, 0], [2.5, 0], [8.5, -1], [13, -1.2],
      [1, 5], [5.5, 5], [10, 5.2], [-10, 5], [-6, 5], [-8, 10],
    ],
  },
  {
    id: 5,
    tip: '마지막 단계! 왼쪽·오른쪽·위 세 굴에서 한꺼번에 몰려와요. 모든 직업의 힘을 모아요!',
    lanes: [
      lane([
        [-13.5, -6],
        [-10, -6],
        [-10, 1],
        [-6, 1],
        [-6, 5.5],
        [-0.5, 5.5],
        [-0.5, 7.6],
      ]),
      lane([
        [12.5, -6],
        [9, -6],
        [9, 1],
        [5, 1],
        [5, 5.5],
        [-0.5, 5.5],
        [-0.5, 7.6],
      ]),
      lane([
        [-0.5, -8.4],
        [-0.5, -6],
        [2.5, -6],
        [2.5, -1.5],
        [-3, -1.5],
        [-3, 5.5],
        [-0.5, 5.5],
        [-0.5, 7.6],
      ]),
    ],
    tree: [-0.5, 8.4],
    dens: [
      { p: [-15.2, -6], rot: 0 },
      { p: [14.2, -6], rot: Math.PI },
      { p: [-0.5, -10.1], rot: -Math.PI / 2 },
    ],
    spots: [
      [-11.5, -8.5], [-7.5, -3.5], [-12.7, -2.5], [-8.5, 3.8], [-3.5, 8],
      [10.5, -8.5], [6.5, -3.5], [11.7, -2.5], [7.5, 3.8], [2.5, 8],
      [-3.5, -4], [1, 2.5], [3, -8.8], [-3.5, -8.8],
    ],
  },
  {
    id: 6,
    tip: '왼쪽 위·아래와 위쪽, 세 굴에서 와요! 위쪽 굴의 길은 아주 짧아요. 가까이 베는 탑만 통하는 유령도 나와요.',
    lanes: [
      lane([
        [-13.5, -7],
        [-7, -7],
        [-7, -2],
        [3, -2],
        [3, 0.5],
        [11.7, 0.5],
      ]),
      lane([
        [-13.5, 7],
        [-7, 7],
        [-7, 3],
        [3, 3],
        [3, 0.5],
        [11.7, 0.5],
      ]),
      lane([
        [-0.5, -8.4],
        [-0.5, -6],
        [7, -6],
        [7, 0.5],
        [11.7, 0.5],
      ]),
    ],
    tree: [12.5, 0.5],
    dens: [
      { p: [-15.2, -7], rot: 0 },
      { p: [-15.2, 7], rot: 0 },
      { p: [-0.5, -10.1], rot: -Math.PI / 2 },
    ],
    spots: [
      [6.5, 3], [9.5, -2], [-0.5, 0.5], [-3, -4.5], [-5, 0.5], [10.5, 3], [-10, -4.5], [-10, 4.5],
      [-4.5, 5.5], [3, -8.5], [-10, -9.5], [-10, 9.5], [-0.5, 5.5], [-9, 0], [-4.5, -8],
    ],
  },
  {
    id: 7,
    tip: '마지막 요새! 네 모서리 굴에서 사방으로 몰려오고, 나무는 한가운데 있어요. 방패 기사가 친구들을 지켜 줘요.',
    lanes: [
      lane([
        [-13.5, -7.5],
        [-5, -7.5],
        [-5, -3],
        [-9, -3],
        [-9, 1],
        [-1.3, 1],
      ]),
      lane([
        [12.5, -7.5],
        [4, -7.5],
        [4, -3],
        [8, -3],
        [8, 1],
        [0.3, 1],
      ]),
      lane([
        [-13.5, 4.5],
        [-7, 4.5],
        [-7, 8.5],
        [-0.5, 8.5],
        [-0.5, 1.8],
      ]),
      lane([
        [12.5, 4.5],
        [6, 4.5],
        [6, 8.5],
        [-0.5, 8.5],
        [-0.5, 1.8],
      ]),
    ],
    tree: [-0.5, 1],
    dens: [
      { p: [-15.2, -7.5], rot: 0 },
      { p: [14.2, -7.5], rot: Math.PI },
      { p: [-15.2, 4.5], rot: 0 },
      { p: [14.2, 4.5], rot: Math.PI },
    ],
    spots: [
      [-3.5, 5], [2.5, 5], [-10.5, -5], [9.5, -5], [-10, 7], [9, 7], [-3, -1.5], [2, -1.5],
      [-11.5, 1], [10.5, 1], [-10, -10], [9, -10], [-2.5, -5.5], [1.5, -5.5], [-6, -10], [5, -10],
    ],
  },
]
export const mapOf = (stage: number) => DEF_MAPS[Math.max(1, Math.min(DEF_MAPS.length, Math.round(stage) || 1)) - 1]

// 길 위 거리 d 의 위치
export function lanePos(L: Lane, d: number): Pt {
  let r = Math.max(0, Math.min(L.len, d))
  for (const s of L.segs) {
    if (r <= s.len) {
      const t = s.len ? r / s.len : 0
      return [s.a[0] + (s.b[0] - s.a[0]) * t, s.a[1] + (s.b[1] - s.a[1]) * t]
    }
    r -= s.len
  }
  return L.pts[L.pts.length - 1]
}
// 가장 가까운 길까지의 거리
export function distToLanes(lanes: Lane[], x: number, z: number) {
  let best = 1e9
  for (const L of lanes)
    for (const { a, b } of L.segs) {
      const dx = b[0] - a[0]
      const dz = b[1] - a[1]
      const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz || 1)))
      best = Math.min(best, Math.hypot(x - a[0] - t * dx, z - a[1] - t * dz))
    }
  return best
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
export const EVOLVE_COST = [0, 0, 40, 80, 140, 220, 320] // [_, _, →2, →3, →4, →5, →6]
export const SPEC_DISCOUNT = 0.7
export const SPEC_BOOST = 1.3
export const TIER_DMG = [0, 1, 1.5, 2.2, 3.2, 4.6, 6.4]
export const TIER_HP = [0, 1, 1.4, 1.9, 2.6, 3.5, 4.8]
export const TIER_RANGE = [0, 0, 0.2, 0.4, 0.6, 0.9, 1.2]
// 탑의 공격 범위 (방장 계산 · 화면 표시가 같은 값을 쓴다)
export const rangeOf = (kind: TowerKind, tier: number, br: number) => TOWERS[kind].range + TIER_RANGE[tier] + (kind === 'bow' && br === 2 ? 2 : 0)
export const MAX_TOWER_TIER = 6
export const JOB_TIER = 4 // 이 단계부터는 내 직업 탑만 키울 수 있다
export const WEAPON_NEED: Record<number, number> = { 5: 4, 6: 5 } // 탑 단계 → 필요한 내 직업 무기 단계 (영웅 · 전설)
export const TIER_TITLE: Record<number, string> = { 5: '각성', 6: '전설' }
// 4단계부터 직업 탑 곁에 나타나는 수호 신수 (6단계에서는 탑 대신 제단 위에)
export const BEASTS: Record<TowerKind, { name: string; emoji: string }> = {
  sword: { name: '백호', emoji: '🐯' },
  bow: { name: '주작', emoji: '🐦‍🔥' },
  staff: { name: '청룡', emoji: '🐉' },
  axe: { name: '현무', emoji: '🐢' },
  spear: { name: '해치', emoji: '🦁' },
  hammer: { name: '불가사리', emoji: '🔥' },
}
// 다음 단계로 못 키우는 까닭 (없으면 null) — 방장 계산과 화면이 같은 규칙을 쓴다
export function evolveBlock(kind: TowerKind, tier: number, job: string | null, wt: number): string | null {
  const next = tier + 1
  if (next >= JOB_TIER && job !== kind) return `🔒 ${JOB_TIER}단계부터는 내 직업 탑만 키울 수 있어요`
  const need = WEAPON_NEED[next]
  if (need && wt < need) {
    const g = gradeOf(need)
    return `🔒 ${next >= 6 ? '전설의 수호 신수가 되려면' : '각성하려면'} ${FAMILY_LABEL[kind]} 무기가 ${g.name}(${need}단계) 이상이어야 해요 (지금 ${wt}단계)`
  }
  return null
}
export const HOLD_S = 0.7 // 창 함정이 붙잡는 시간
export const HEAL_PER_S = 5 // 대장간 기본 수리량 (초당)
export const HEAL_R = 3 // 치유 주술사가 치료하는 범위
export const SHIELD_R = 2.2 // 방패 기사가 지켜 주는 범위
export const SHIELD_F = 0.6 // 방패 안의 몬스터가 받는 피해 배율
export const TAUNT_R = 3.2 // 검사 초소가 끌어오는 범위
export const SYNERGY_R = 3.2 // 연계: 이 거리 안에 서로 다른 탑 3종류 → 공격력 +10%
export const SYNERGY = 1.1

export const buildCost = (kind: TowerKind, job: string | null) => Math.round(BUILD_COST * (job === kind ? SPEC_DISCOUNT : 1))
export const evolveCost = (kind: TowerKind, tier: number, job: string | null) =>
  tier >= MAX_TOWER_TIER ? null : Math.round(EVOLVE_COST[tier + 1] * (job === kind ? SPEC_DISCOUNT : 1))

/* ---------- 몬스터 ---------- */
export type MonKind = 'slime' | 'bat' | 'turtle' | 'fox' | 'goblin' | 'bomb' | 'blob' | 'king' | 'golem' | 'shaman' | 'drake' | 'ghost' | 'knight'
export type MonDef = {
  kind: MonKind
  name: string
  emoji: string
  hp: number
  spd: number
  gold: number
  leak: number // 나무까지 가면 깎는 체력
  air?: boolean
  armor?: number // 단단함: 뚫는 탑(pierce) 말고 다른 탑의 피해 배율
  pierce?: TowerKind[] // 단단함을 뚫는 탑 (없으면 투석기)
  heal?: number // 주변 몬스터 치료 (초당, 기본 체력 기준)
  shield?: boolean // 주변 몬스터를 방패로 지켜 준다 (받는 피해 SHIELD_F 배)
  weak?: [TowerKind, number] // 이 탑에게 더 아프게 맞는다 (그 탑은 이 몬스터부터 노린다)
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
  golem: { kind: 'golem', name: '돌 골렘', emoji: '🗿', hp: 110, spd: 0.9, gold: 16, leak: 3, armor: 0.2, pierce: ['staff'], hint: '온몸이 돌이라 칼·화살·돌이 거의 안 들어요 — 🪄 마법탑만 제대로 먹혀요' },
  shaman: { kind: 'shaman', name: '치유 주술사', emoji: '🧙', hp: 32, spd: 1.3, gold: 12, leak: 1, heal: 5, weak: ['bow', 2], hint: '주변 몬스터를 계속 치료해요 — 🏹 궁수탑이 먼저 노리고 2배로 맞혀요' },
  drake: { kind: 'drake', name: '새끼 용', emoji: '🐲', hp: 90, spd: 1.5, gold: 16, leak: 2, air: true, armor: 0.4, pierce: ['bow'], hint: '단단한 비늘로 하늘을 날아요 — 🏹 궁수탑이 비늘을 뚫어요' },
  ghost: { kind: 'ghost', name: '그림자 유령', emoji: '👻', hp: 55, spd: 1.6, gold: 14, leak: 2, armor: 0.3, pierce: ['sword', 'spear', 'hammer'], hint: '몸이 흐릿해서 멀리서 쏘는 화살·마법·돌이 거의 빠져나가요 — 🗡️ 검사 초소·🔱 창 함정·🔨 대장간처럼 가까이 베는 탑이 잘 먹혀요' },
  knight: { kind: 'knight', name: '방패 기사', emoji: '🛡️', hp: 110, spd: 1.0, gold: 20, leak: 2, armor: 0.5, pierce: ['hammer', 'axe'], weak: ['hammer', 2.5], shield: true, hint: '큰 방패로 주변 몬스터를 지켜 줘요 (받는 피해 40% 줄여요) — 🔨 대장간 망치가 먼저 노리고 방패를 깨요, 🪓 투석기도 잘 먹혀요' },
  king: { kind: 'king', name: '몬스터 대왕', emoji: '👑', hp: 450, spd: 0.6, gold: 100, leak: 5, armor: 0.5, hint: '우두머리! 탑은 본체만체 곧장 나무로 가요 — 놓치면 생명이 절반이나 깎여요. 다 함께!' },
}

/* ---------- 단계 · 웨이브 ---------- */
export type StageDef = { id: number; name: string; hpMult: number; reward: [number, number, number] } // ★1·★2·★3 처음 달성 보상
export const DEF_STAGE_LIST: StageDef[] = [
  { id: 1, name: '들판 오솔길', hpMult: 1, reward: [30, 20, 30] },
  { id: 2, name: '갈림길 숲', hpMult: 1.5, reward: [40, 30, 40] },
  { id: 3, name: '쌍둥이 굴', hpMult: 1.95, reward: [50, 40, 60] },
  { id: 4, name: '골짜기 늪', hpMult: 2.1, reward: [60, 50, 70] },
  { id: 5, name: '세 굴 요새', hpMult: 2.35, reward: [80, 60, 100] },
  { id: 6, name: '유령 골짜기', hpMult: 2.7, reward: [100, 70, 120] },
  { id: 7, name: '사방 요새', hpMult: 2.45, reward: [120, 90, 150] }, // 직업 탑을 각성(영웅 무기)까지 키워야 잘 깨진다
]
export const defStage = (s: number) => DEF_STAGE_LIST[Math.max(1, Math.min(DEF_STAGES, s)) - 1]
// 남은 나무 체력 → 별
export const starsFor = (tree: number) => (tree <= 0 ? 0 : tree >= TREE_HP * 0.9 ? 3 : tree >= TREE_HP * 0.5 ? 2 : 1)

export type Spawn = [MonKind, number, number] // 종류, 마리 수, 간격(초)
// 웨이브 구성 — 단계가 오를수록 섞이는 종류가 많아진다
export function waveOf(stage: number, w: number): Spawn[] {
  const s = stage
  const k = Math.min(4, s - 1) // 단계가 오를수록 조금씩 많이 (5단계부터는 수 대신 새 몬스터 · 체력 배율 hpMult 로 세진다)
  const h = Math.floor(k / 2)
  const c = Math.min(5, s) // 예전 몬스터 수는 5단계에서 멈춘다
  const list: Spawn[] = []
  if (w === 5) {
    list.push(['slime', 8 + k, 0.6], ['king', 1, 1], ['goblin', 2 + h, 1.2])
    if (s >= 3) list.push(['golem', 1 + Math.floor((c - 3) / 2), 2.2])
    if (s >= 4) list.push(['shaman', 1, 2.4], ['drake', c - 3, 2])
    if (s >= 6) list.push(['ghost', 2 + (s - 6), 1.4])
    if (s >= 7) list.push(['knight', 1, 3])
    return list
  }
  if (w === 10) {
    list.push(['blob', 6, 0.8], ['king', 1 + (s >= 3 ? 1 : 0) + (s >= 5 ? 1 : 0), 4], ['turtle', 2 + h, 1.5], ['bat', 4 + k, 0.5])
    if (s >= 2) list.push(['golem', 1 + h, 1.8])
    if (s >= 3) list.push(['shaman', c - 2, 2])
    if (s >= 4) list.push(['drake', c - 2, 1.6])
    if (s >= 6) list.push(['ghost', 3 + (s - 6), 1.2])
    if (s >= 7) list.push(['knight', 2, 2.6])
    return list
  }
  list.push(['slime', 6 + w * 2 + k, 0.7])
  if (w >= 2) list.push(['goblin', 1 + Math.floor(w / 3) + h, 1.6])
  if (w >= 3 || s >= 2) list.push(['bat', 2 + Math.floor(w / 2) + h, 0.8])
  if (w >= 4) list.push(['turtle', 1 + Math.floor(w / 4) + h, 2.2])
  if (w >= 6 || s >= 2) list.push(['fox', 1 + Math.floor(w / 3) + h, 0.9])
  if (w >= 7 || s >= 3) list.push(['bomb', 1 + Math.floor(w / 4) + h, 1.2])
  if (w >= 8) list.push(['blob', 2 + h, 1.4])
  // 새 몬스터: 1단계는 끝 무렵 골렘만, 단계가 오를수록 일찍 · 많이
  if (w >= (s >= 2 ? 4 : 7)) list.push(['golem', 1 + Math.floor(w / 4) + Math.floor(Math.max(0, c - 2) / 2), 2.4])
  if (s >= 3 && w >= 3) list.push(['shaman', 1 + Math.floor(w / 5), 2.2])
  if (s >= 4 && w >= 3) list.push(['drake', 1 + Math.floor(w / 4) + (c - 4), 1.8])
  if (s >= 6 && w >= 2) list.push(['ghost', 1 + Math.floor(w / 3) + (s - 6), 1.4])
  if (s >= 7 && w >= 3) list.push(['knight', 1 + Math.floor(w / 5), 3])
  return list
}
// 사람 수에 따른 몬스터 체력 (2명이어도 깰 수 있게)
export const TEAM_HP = [0.7, 0.7, 0.75, 0.88, 1]
// 사람 수에 따른 몬스터 돈 (사람이 많으면 몬스터가 단단한 만큼 돈도 더)
export const TEAM_GOLD = [1, 1, 1, 1.15, 1.3]
export const waveHpMult = (stage: number, w: number) => defStage(stage).hpMult * (1 + 0.07 * (w - 1))

// 보급 상자 · 긴급 퀴즈
export const BOX_GOLD = 40
export const BOX_CHANCE = 0.45
export const EMERGENCY_STUN_S = 5

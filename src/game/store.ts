import { create } from 'zustand'
import {
  START_COINS,
  QUIZ_REWARD,
  CROP_MAP,
  fertCost,
  DEX_NEW_REWARD,
  productInfo,
  sellPrice,
  marketMult,
  ANIMAL_MAP,
  HOUSE_LEVELS,
  ENHANCE_DAILY_LIMIT,
  DAILY_PER_SUBJECT,
  dailyPoints,
  dailyPay,
  enhanceStep,
  enhanceSell,
  LAND_START,
  LAND_OLD,
  landExpand,
  landCapFor,
  houseNeededForLand,
  farmLimit,
} from './economy'
import { BOSS_DAILY } from './bossData'
import { STAGE_COUNT, TOWER_DAILY, towerStage } from './towerData'
import { RAID_REWARD_CLEAR, RAID_REWARD_MVP, RAID_REWARD_PHASE, RAID_REWARD_PHASE_MAX, raidTitleOf } from './raidData'
import { dailySet, type Question } from './questions'
import type { Worksheet, MySub } from './sheets'
import { findFreeSpot, resolveFarmOverlaps } from './layout'
import { dateKey, type ClassLunch } from './lunch'
import { serverNow } from './serverClock'
import {
  normCrop,
  normAnimal,
  applyWilt,
  cropRipe,
  animalReady,
  normBarn,
  normDex,
  type CropState,
  type AnimalState,
  type Barn,
  type Dex,
} from './farm'
import { CATALOG_MAP } from './catalog'
import { DEFAULT_AVATAR, normalizeAvatar, type Avatar } from './avatar'
import { findItem, houseNeeded, ownsItem, type Slot } from './wardrobe'
import {
  EVOLVE_COST_PET,
  FEED_NEED,
  FEED_NEED_SCORE,
  MAX_STAGE,
  SPECIES_MAP,
  canEvolve,
  isPetSpecies,
  normalizePet,
  rollEvolve,
  stageLabel,
  type PetState,
} from './pets'
import { FAMILY_HOUSE, MAX_TIER, NEW_WEAPON_COST, evolveCost, isFamily, tierName, type WeaponFamily } from './weapons'

export type { Avatar }

export type { CropState, AnimalState }

export type EnhanceState = {
  level: number
  day: string // 마지막으로 시도한 날 (YYYY-MM-DD)
  used: number // 오늘 시도 횟수
  net: number // 오늘 손익 (도토리)
}

// 오늘의 학습 — 하루 할당된 문제 풀이 상태
export type DailyLearn = {
  day: string // YYYY-MM-DD
  picks: Record<string, number> // 문제 id → 고른 보기 (첫 제출)
  idx: number // 지금까지 답한 문제 수 (= 다음에 풀 문제 번호)
  score: number // 맞힌 개수 (두 번째에 맞힌 것 포함)
  first?: number // 그중 처음에 맞힌 개수 (없으면 옛 기록 = 전부 처음에 맞힘)
  retry?: Record<string, number> // 문제 id → 힌트를 보고 다시 고른 보기
  v?: number // 2 = 점수 합산 후 한꺼번에 지급 (옛 기록은 맞힐 때마다 지급했음)
  claimed: boolean // 보상 받았는지
  earned: number // 받은 도토리
}
export type DailyResult = { day: string; score: number; total: number; wrong: string[] }

export type PlacedItem = {
  key: string
  type: string
  x: number
  z: number
  rot: number
  crop?: CropState
  animal?: AnimalState
  level?: number // 우리 집 등급
  land?: number // (집에만) 마을 땅 반쪽 크기
  avatar?: Avatar // (집에만) 내 캐릭터 외형
  wardrobe?: string[] // (집에만) 산 옷 id들 ("slot:id")
  weapons?: Record<string, number> // (집에만) 가진 무기와 단계 { sword: 3, bow: 1 }
  boss?: number // (집에만) 지금까지 클리어한 가장 높은 보스 단계 (0 = 아직 없음)
  pet?: PetState | null // (집에만) 키우는 펫 (한 마리)
  bossTry?: BossTry // (집에만) 오늘 보스 도전 횟수
  tower?: TowerData // (집에만) 도토리 탑 기록
  raid?: RaidData // (집에만) 학급 레이드 기록
  nameAt?: number // (집에만) 학생이 스스로 닉네임을 마지막으로 바꾼 시각 (한 달에 한 번만)
  petFed?: string // (집에만) 마지막으로 먹이를 준 날 — 펫을 버려도 남아서, 새로 키우며 하루에 두 번 주는 건 막는다
  daily?: DailyLearn // (집에만) 오늘의 학습 상태
  learnLog?: DailyResult[] // (집에만) 지난 날 학습 결과 (최근 것부터, 최대 20개)
  enh?: EnhanceState // 강화 게임 상태 (arcade)
  barn?: Barn // (집에만) 창고 — 거둔 작물·생산물 (별 개수별)
  dex?: Dex // (집에만) 농장 도감 — 거둔 것과 가장 좋은 별
}


// 하루 보스 도전 기록 — day 가 오늘이 아니면 0번으로 본다. gid 는 마지막으로 센 전투 (다시 접속해도 같은 판을 두 번 세지 않게)
export type BossTry = { day: string; n: number; gid: number }
// 선생님이 "오늘 보스 도전 횟수 초기화"를 누른 시각(bossResetAt) 이전에 센 기록은 없는 걸로 본다 (gid 는 그 전투가 시작된 시각 ms)
const bossUsedToday = (t: BossTry | null | undefined, resetAt: number): number =>
  t && t.day === dateKey() && t.gid > resetAt ? t.n : 0
export const bossLeftOf = (t: BossTry | null | undefined): number =>
  Math.max(0, BOSS_DAILY - bossUsedToday(t, useVillage.getState().bossResetAt))

// 도토리 탑 기록 — best: 깬 가장 높은 단계, day/n: 오늘 쓴 입장권, log: 최근 도전 기록 (선생님이 볼 수 있게)
export type TowerLog = { t: number; s: number; r: 'dead' | 'quiz' | 'clear'; ok?: boolean[]; sec?: number[] }
export type TowerData = { best: number; day: string; n: number; log: TowerLog[] }
export const towerLeftOf = (t: TowerData | null | undefined): number =>
  Math.max(0, TOWER_DAILY - (t && t.day === dateKey() ? t.n : 0))

// 학급 레이드 기록 — clears: 보상을 받은 클리어 횟수(칭호), mvps: MVP 횟수, part: 참여한 도전 수,
// mvpAt: 마지막으로 MVP가 된 날(YYYY-MM-DD, 일주일 동안 이름 옆에 왕관), gid: 마지막으로 보상을 받은 도전(같은 도전을 두 번 받지 않게)
export type RaidData = { clears: number; mvps: number; part: number; mvpAt: string; gid: number }
export const raidMvpActive = (r: RaidData | null | undefined): boolean => {
  if (!r || !r.mvpAt) return false
  const t = Date.parse(r.mvpAt + 'T00:00:00')
  return Number.isFinite(t) && Date.now() - t < 7 * 86_400_000
}

export type Mode = 'browse' | 'edit'

const STORAGE_KEY = 'dotori.village.v2'

type Persisted = { coins: number; items: PlacedItem[]; homework: string }

function load(): Persisted {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { coins: START_COINS, items: [], homework: '' }
    const p = JSON.parse(raw) as Partial<Persisted>
    return {
      coins: typeof p.coins === 'number' ? p.coins : START_COINS,
      homework: typeof p.homework === 'string' ? p.homework : '',
      items: Array.isArray(p.items)
        ? p.items.filter(
            (o): o is PlacedItem =>
              !!o && typeof o.type === 'string' && typeof o.x === 'number' && typeof o.z === 'number',
          )
        : [],
    }
  } catch {
    return { coins: START_COINS, items: [], homework: '' }
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null
function saveLocal(coins: number, items: PlacedItem[], homework: string) {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ coins, items, homework }))
    } catch {
      // 저장 불가 — 무시
    }
  }, 120)
}

// 클라우드 저장 훅 — cloud.ts가 등록한다. store는 cloud.ts를 import하지 않는다(순환 방지).
type CloudHook = (coins: number, items: PlacedItem[], homework: string) => void
let cloudHook: CloudHook | null = null
export function registerCloudHook(fn: CloudHook) {
  cloudHook = fn
}

function save(coins: number, items: PlacedItem[], homework: string) {
  saveLocal(coins, items, homework)
  cloudHook?.(coins, items, homework)
}

let seq = 0
const newKey = () => `k${Date.now().toString(36)}_${(seq++).toString(36)}`

// 마을에는 항상 우리 집이 하나 있다. 없으면 천막(1단계)을 마을 한가운데에 놓아준다.
function ensureHouse(items: PlacedItem[]): PlacedItem[] {
  const house = items.find((i) => i.type === 'house')
  if (!house) {
    return [
      { key: 'house', type: 'house', x: 0, z: 0, rot: 0, level: 1, land: LAND_START, avatar: DEFAULT_AVATAR },
      ...items,
    ]
  }
  let next = items
  // 예전 기본 위치(-5,-3)에 있던 집은 가운데로 한 번 옮긴다
  if (house.x === -5 && house.z === -3) {
    next = next.map((i) => (i.type === 'house' ? { ...i, x: 0, z: 0 } : i))
  }
  // 땅 크기가 없는 기존 마을은 예전(둥근) 크기로 유지
  if (house.land == null) {
    next = next.map((i) => (i.type === 'house' ? { ...i, land: LAND_OLD } : i))
  }
  return next
}

const isNewVillage = (items: PlacedItem[]) => {
  const h = items.find((i) => i.type === 'house')
  return items.filter((i) => i.type !== 'house' && i.type !== 'board' && i.type !== 'arcade').length === 0 &&
    (h?.land ?? LAND_OLD) === LAND_START
}

// 마을엔 항상 게시판(숙제·급식)이 하나 있다.
function ensureBoard(items: PlacedItem[]): PlacedItem[] {
  if (items.some((i) => i.type === 'board')) return items
  const [x, z] = isNewVillage(items) ? [-3.5, 2.5] : [-7, 3]
  return [...items, { key: 'board', type: 'board', x, z, rot: Math.PI * 0.16 }]
}

// 천막 옆 도토리 강화 게임대.
function ensureArcade(items: PlacedItem[]): PlacedItem[] {
  if (items.some((i) => i.type === 'arcade')) return items
  const [x, z] = isNewVillage(items) ? [3.5, 2.5] : [4.5, 2]
  return [
    ...items,
    { key: 'arcade', type: 'arcade', x, z, rot: -Math.PI * 0.15, enh: { level: 0, day: '', used: 0, net: 0 } },
  ]
}

// 옷장 (캐릭터 꾸미기).
function ensureWardrobe(items: PlacedItem[]): PlacedItem[] {
  if (items.some((i) => i.type === 'wardrobe')) return items
  const [x, z] = isNewVillage(items) ? [-3.5, -2.5] : [-5, -4]
  return [...items, { key: 'wardrobe', type: 'wardrobe', x, z, rot: Math.PI * 0.1 }]
}

// 예전 방식(물주기 횟수·시간)의 작물·동물을 새 규칙(하루 한 번 돌봄)으로 옮긴다
function ensureFarm(items: PlacedItem[]): PlacedItem[] {
  if (!items.some((i) => (i.crop && i.crop.v !== 2) || (i.animal && i.animal.v !== 2))) return items
  const today = dateKey()
  return items.map((i) =>
    i.crop && i.crop.v !== 2
      ? { ...i, crop: normCrop(i.crop, today) }
      : i.animal && i.animal.v !== 2
        ? { ...i, animal: normAnimal(i.animal, today) }
        : i,
  )
}

// 거둔 것을 창고에 넣고 도감에 적는다. 도감에 처음 올리면(그리고 처음 ★3을 거두면) 도토리를 더 준다.
function storeProduce(items: PlacedItem[], pid: string, star: number): { items: PlacedItem[]; bonus: number; note: string } {
  const h = items.find((i) => i.type === 'house')
  const barn = normBarn(h?.barn)
  const dex = normDex(h?.dex)
  const row = [...(barn[pid] ?? [0, 0, 0])] as [number, number, number]
  row[star - 1] += 1
  const prev = dex[pid] ?? 0
  let bonus = 0
  let note = ''
  if (!prev) {
    bonus += DEX_NEW_REWARD
    note = ` 📖 도감에 새로 올렸어요! +${DEX_NEW_REWARD}`
  } else if (star === 3 && prev < 3) {
    bonus += DEX_NEW_REWARD
    note = ` 📖 처음으로 ★★★! +${DEX_NEW_REWARD}`
  }
  const nextDex = { ...dex, [pid]: Math.max(prev, star) }
  return {
    items: items.map((i) => (i.type === 'house' ? { ...i, barn: { ...barn, [pid]: row }, dex: nextDex } : i)),
    bonus,
    note,
  }
}

export const landHalf = (items: PlacedItem[]) =>
  items.find((i) => i.type === 'house')?.land ?? LAND_OLD

// 이미 겹쳐 있는 밭·우리를 가까운 빈자리로 옮긴다 (움직인 개수도 돌려줌)
function ensureLayout(items: PlacedItem[]): PlacedItem[] {
  return resolveFarmOverlaps(items, landHalf(items)).items
}

const avatarOf = (items: PlacedItem[]) =>
  normalizeAvatar(items.find((i) => i.type === 'house')?.avatar)
// 가진 무기 (없으면 처음 주는 나무 목검 하나)
const weaponsOf = (items: PlacedItem[]): Record<string, number> => {
  const w = items.find((i) => i.type === 'house')?.weapons
  const out: Record<string, number> = {}
  if (w && typeof w === 'object')
    for (const [k, v] of Object.entries(w)) if (isFamily(k) && typeof v === 'number') out[k] = Math.max(1, Math.min(MAX_TIER, Math.round(v)))
  if (!out.sword && Object.keys(out).length === 0) out.sword = 1
  return out
}
// 클리어한 보스 단계 (0~3)
const bossOf = (items: PlacedItem[]): number => {
  const b = items.find((i) => i.type === 'house')?.boss
  return typeof b === 'number' && Number.isFinite(b) ? Math.max(0, Math.min(9, Math.round(b))) : 0
}
const bossTryOf = (items: PlacedItem[]): BossTry | null => {
  const t = items.find((i) => i.type === 'house')?.bossTry
  return t && typeof t.day === 'string' && Number.isFinite(t.n) ? { day: t.day, n: Math.max(0, Math.round(t.n)), gid: Number(t.gid) || 0 } : null
}
const towerOf = (items: PlacedItem[]): TowerData => {
  const t = items.find((i) => i.type === 'house')?.tower
  return {
    best: t && Number.isFinite(t.best) ? Math.max(0, Math.min(STAGE_COUNT, Math.round(t.best))) : 0,
    day: t && typeof t.day === 'string' ? t.day : '',
    n: t && Number.isFinite(t.n) ? Math.max(0, Math.round(t.n)) : 0,
    log: t && Array.isArray(t.log) ? (t.log as TowerLog[]).slice(0, 20) : [],
  }
}
const raidOf = (items: PlacedItem[]): RaidData => {
  const r = items.find((i) => i.type === 'house')?.raid
  const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.round(v)) : 0)
  return { clears: n(r?.clears), mvps: n(r?.mvps), part: n(r?.part), mvpAt: typeof r?.mvpAt === 'string' ? r.mvpAt : '', gid: n(r?.gid) }
}
const petOf = (items: PlacedItem[]): PetState | null => normalizePet(items.find((i) => i.type === 'house')?.pet)
const wardrobeOf = (items: PlacedItem[]) => {
  const w = items.find((i) => i.type === 'house')?.wardrobe
  return Array.isArray(w) ? w : []
}

const freshDaily = (day: string): DailyLearn => ({
  day,
  picks: {},
  idx: 0,
  score: 0,
  first: 0,
  retry: {},
  v: 2,
  claimed: false,
  earned: 0,
})

const dailyOf = (items: PlacedItem[]): DailyLearn | null => {
  const d = items.find((i) => i.type === 'house')?.daily
  return d && typeof d === 'object' && typeof d.day === 'string' ? (d as DailyLearn) : null
}
const learnLogOf = (items: PlacedItem[]): DailyResult[] => {
  const l = items.find((i) => i.type === 'house')?.learnLog
  return Array.isArray(l) ? (l as DailyResult[]) : []
}

// 하루가 지나면 지난 학습을 기록으로 넘기고 오늘치를 새로 만든다.
function ensureDaily(items: PlacedItem[], extra: Question[] = []): PlacedItem[] {
  const today = dateKey()
  const cur = dailyOf(items)
  if (cur && cur.day === today) return items
  let log = learnLogOf(items)
  if (cur && Object.keys(cur.picks).length > 0) {
    const set = dailySet(cur.day, DAILY_PER_SUBJECT, extra)
    const wrong = set.filter((q) => cur.picks[q.id] != null && cur.picks[q.id] !== q.answer).map((q) => q.id)
    log = [{ day: cur.day, score: cur.score, total: set.length, wrong }, ...log].slice(0, 20)
  }
  return items.map((i) =>
    i.type === 'house' ? { ...i, daily: freshDaily(today), learnLog: log } : i,
  )
}

function clampToLand(x: number, z: number, half: number): [number, number] {
  const b = half - 0.5
  return [Math.max(-b, Math.min(b, x)), Math.max(-b, Math.min(b, z))]
}

export type QuizRequest = { onPass: () => void; onFail?: () => void; id?: string } // 틀리면 onFail(기회 박탈). id 가 같으면 닫았다 다시 열어도 같은 문제가 나온다
// 친구 마을을 놀러 간 상태 (읽기 전용 — 내 마을 데이터는 그대로)
export type Visiting = { name: string; items: PlacedItem[]; avatar: Avatar }
// 지금 화면에 보이는 마을의 물건들 (놀러 가 있으면 친구 것)
export const viewItems = (s: { visiting: Visiting | null; items: PlacedItem[] }) =>
  s.visiting ? s.visiting.items : s.items
export type Session = { classCode: string; name: string }
export type CloudStatus = 'local' | 'synced' | 'offline'
export type EnhanceFx = { n: number; ok: boolean; from: number; to: number }
export type Mission = { text: string; reward: number; done: string[] }

interface VillageState {
  mode: Mode
  coins: number
  items: PlacedItem[]
  homework: string
  session: Session | null
  cloud: CloudStatus
  arcadeLocked: boolean
  mission: Mission | null
  avatar: Avatar
  rideOn: boolean // 탈 것을 타고 있는지 (장착한 탈 것이 있을 때만 의미 있음)
  wardrobe: string[]
  daily: DailyLearn | null
  classQuestions: Question[] // 선생님이 이 반에 추가한 문제
  classLunch: ClassLunch // 선생님이 올린 급식표 (PDF·날짜별 메뉴)
  visiting: Visiting | null // 놀러 간 친구 마을
  plaza: number | null // 광장 번호 (null = 내 마을에 있음)
  bossRoom: number | null // 보스 방 번호 (null = 보스 방에 있지 않음)
  raidRoom: boolean // 학급 레이드(수·금요일) 대기실에 있는지
  bossCleared: number // 클리어한 가장 높은 보스 단계
  pet: PetState | null // 키우는 펫
  bossTry: BossTry | null // 오늘 보스 도전 횟수
  bossResetAt: number // 선생님이 보스 도전 횟수를 초기화한 시각 (반 설정에서 받아온다)
  tower: TowerData // 도토리 탑 기록
  raid: RaidData // 학급 레이드 기록
  towerOn: boolean // 탑 안에 있는지
  petOpen: boolean // 펫 창 열림
  petFx: { at: number; ok: boolean; st: number } | null // 방금 한 진화 결과 (반짝이는 화면용)
  friendsOpen: boolean // 친구 목록 패널
  friendInfoOpen: boolean // 친구 집 정보 패널
  barnOpen: boolean // 창고·시장·도감 창
  notice: string | null // 화면 가운데 안내창 (확인을 누를 때까지)
  worksheets: Worksheet[] // 선생님이 보낸 학습지(PDF)
  mySubs: Record<string, MySub> // 학습지 id → 내 제출 상태
  sheetsOpen: boolean // 학습지 목록 패널 열림

  placing: string | null
  selected: string | null
  activeFarm: string | null // browse 모드에서 열어둔 밭/우리/게시판 key
  learnOpen: boolean // 오늘의 학습 패널 열림
  weapons: Record<string, number> // 가진 무기 { 종류: 단계 }
  armoryOpen: boolean // 무기 창 열림
  evolveFx: { family: string; tier: number; at: number } | null // 방금 진화한 무기 (반짝이는 화면용)
  quiz: QuizRequest | null
  msg: string | null
  enhanceFx: EnhanceFx | null

  setHomework: (text: string) => void
  setAvatar: (a: Avatar) => void
  openArmory: () => void
  closeArmory: () => void
  equipWeapon: (family: WeaponFamily | null) => void
  markBossCleared: (stage: number) => void
  spendBossTry: (gid: number) => boolean
  spendTowerTry: () => void
  markNameChanged: () => void
  towerClear: (stage: number, log: TowerLog) => { first: boolean; reward: number }
  towerLog: (log: TowerLog) => void
  raidReward: (r: { gid: number; won: boolean; phases: number; mvp: boolean }) => { coins: number; clears: number; titleUp: string | null; mvpDay: boolean } | null
  buyWeapon: (family: WeaponFamily) => void
  evolveWeapon: (family: WeaponFamily) => void
  openPet: () => void
  closePet: () => void
  choosePet: (sp: string) => void
  feedPet: () => void
  evolvePet: () => void
  releasePet: () => void
  toggleRide: () => void
  chooseWardrobe: (slot: Slot, id: string) => void
  hydrateFromCloud: (coins: number, items: PlacedItem[]) => void
  hydrateHomework: (text: string) => void
  setSession: (s: Session | null) => void
  setCloud: (c: CloudStatus) => void
  setClassConfig: (cfg: {
    arcadeEnabled?: boolean
    mission?: Mission | null
    questions?: Question[]
    lunch?: ClassLunch
  }) => void
  grantCoins: (amount: number, reason: string) => void
  addCoins: (amount: number, reason: string) => void
  setMode: (m: Mode) => void
  togglePlacing: (type: string) => void
  select: (key: string | null) => void
  openFarm: (key: string) => void
  closeFarm: () => void
  flash: (text: string) => void

  placeAt: (x: number, z: number) => void
  moveSelectedTo: (x: number, z: number) => void
  rotateSelected: () => void
  deleteSelected: () => void
  clearAll: () => void
  upgradeHouse: () => void
  expandLand: () => void

  openLearn: () => void
  closeLearn: () => void
  openSheets: () => void
  closeSheets: () => void
  openFriends: () => void
  closeFriends: () => void
  openFriendInfo: () => void
  closeFriendInfo: () => void
  setVisiting: (v: Visiting | null) => void
  setNotice: (text: string | null) => void
  answerDaily: (pick: number) => void
  retryDaily: (pick: number) => void
  claimDaily: () => void

  askQuiz: (onPass: () => void, onFail?: () => void, id?: string) => void
  passQuiz: () => void
  failQuiz: () => void
  cancelQuiz: () => void

  plantCrop: (key: string, seedId: string, fert: boolean) => void
  waterCrop: (key: string) => void
  harvestCrop: (key: string) => void

  buyAnimal: (key: string, speciesId: string) => void
  feedAnimal: (key: string) => void
  collectProduce: (key: string) => void
  openBarn: () => void
  closeBarn: () => void
  sellProduce: (pid: string, star: number, n: number) => void
  sellAllProduce: () => void

  enhanceTry: () => void
  enhanceSell: () => void
}

const initialRaw = load()
const initialItems = ensureFarm(
  ensureLayout(ensureDaily(ensureWardrobe(ensureArcade(ensureBoard(ensureHouse(initialRaw.items)))))),
)
const initial = { coins: initialRaw.coins, items: initialItems, homework: initialRaw.homework }
if (initialItems !== initialRaw.items) save(initialRaw.coins, initialItems, initialRaw.homework)
let msgTimer: ReturnType<typeof setTimeout> | null = null

export const useVillage = create<VillageState>((set, get) => {
  const commit = (items: PlacedItem[], coins = get().coins) => {
    save(coins, items, get().homework)
    set({ items, coins })
  }

  return {
    mode: 'browse',
    coins: initial.coins,
    items: initial.items,
    homework: initial.homework,
    session: null,
    cloud: 'local',
    arcadeLocked: false,
    mission: null,
    avatar: avatarOf(initial.items),
    rideOn: true,
    wardrobe: wardrobeOf(initial.items),
    daily: dailyOf(initial.items),
    classQuestions: [],
    classLunch: {},
    visiting: null,
    plaza: null,
    bossRoom: null,
    raidRoom: false,
    bossCleared: bossOf(initial.items),
    pet: petOf(initial.items),
    bossTry: bossTryOf(initial.items),
    bossResetAt: 0,
    tower: towerOf(initial.items),
    raid: raidOf(initial.items),
    towerOn: false,
    petOpen: false,
    petFx: null,
    friendsOpen: false,
    friendInfoOpen: false,
    barnOpen: false,
    notice: null,
    worksheets: [],
    mySubs: {},
    sheetsOpen: false,
    placing: null,
    selected: null,
    activeFarm: null,
    learnOpen: false,
    weapons: weaponsOf(initial.items),
    armoryOpen: false,
    evolveFx: null,
    quiz: null,
    msg: null,
    enhanceFx: null,

    setHomework: (text) => {
      save(get().coins, get().items, text)
      set({ homework: text })
      get().flash('숙제를 저장했어요')
    },

    setAvatar: (a) => {
      const next = get().items.map((i) => (i.type === 'house' ? { ...i, avatar: a } : i))
      save(get().coins, next, get().homework)
      set({ items: next, avatar: normalizeAvatar(a) })
    },

    toggleRide: () => set({ rideOn: !get().rideOn }),

    openArmory: () => set({ armoryOpen: true }),
    closeArmory: () => set({ armoryOpen: false, evolveFx: null }),

    // 들고 다닐 무기를 고른다 (null = 내려놓기)
    equipWeapon: (family) => {
      const { items, weapons } = get()
      const tier = family ? (weapons[family] ?? 0) : 0
      if (family && !tier) return
      const next = { ...get().avatar, weapon: family, wt: family ? tier : 1 }
      const nextItems = items.map((i) => (i.type === 'house' ? { ...i, avatar: next, weapons } : i))
      save(get().coins, nextItems, get().homework)
      set({ items: nextItems, avatar: normalizeAvatar(next) })
    },

    // 보스를 처음 깼을 때 기록한다 (집 데이터에 저장 → 서버에도 올라감)
    markBossCleared: (stage) => {
      const { items, bossCleared } = get()
      if (stage <= bossCleared) return
      const nextItems = items.map((i) => (i.type === 'house' ? { ...i, boss: stage } : i))
      save(get().coins, nextItems, get().homework)
      set({ items: nextItems, bossCleared: stage })
    },

    // 보스 전투를 시작할 때 오늘 도전 횟수를 1 쓴다 (같은 판은 한 번만)
    spendBossTry: (gid) => {
      const { items, bossTry } = get()
      if (bossTry && bossTry.gid === gid) return false // 같은 판은 한 번만 센다
      const today = dateKey()
      const next: BossTry = { day: today, n: bossUsedToday(bossTry, get().bossResetAt) + 1, gid }
      const nextItems = items.map((i) => (i.type === 'house' ? { ...i, bossTry: next } : i))
      save(get().coins, nextItems, get().homework)
      set({ items: nextItems, bossTry: next })
      return true
    },

    // 학생이 닉네임을 바꿨다는 표시 (하루에 한 번만 바꿀 수 있게)
    markNameChanged: () => {
      const nextItems = get().items.map((i) => (i.type === 'house' ? { ...i, nameAt: Date.now() } : i))
      save(get().coins, nextItems, get().homework)
      set({ items: nextItems })
    },

    // 탑에 들어갈 때 오늘 입장권을 1장 쓴다
    spendTowerTry: () => {
      const { items, tower } = get()
      const today = dateKey()
      const next: TowerData = { ...tower, day: today, n: (tower.day === today ? tower.n : 0) + 1 }
      const nextItems = items.map((i) => (i.type === 'house' ? { ...i, tower: next } : i))
      save(get().coins, nextItems, get().homework)
      set({ items: nextItems, tower: next })
    },

    // 도전 기록 한 줄 남기기 (최근 20개)
    towerLog: (log) => {
      const { items, tower } = get()
      const next: TowerData = { ...tower, log: [log, ...tower.log].slice(0, 20) }
      const nextItems = items.map((i) => (i.type === 'house' ? { ...i, tower: next } : i))
      save(get().coins, nextItems, get().homework)
      set({ items: nextItems, tower: next })
    },

    // 탑 단계 클리어 — 처음 깬 단계(바로 다음 단계)에만 도토리와 칭호
    towerClear: (stage, log) => {
      const { items, tower, coins } = get()
      const first = stage === tower.best + 1
      const reward = first ? towerStage(stage).reward : 0
      const next: TowerData = { ...tower, best: first ? stage : tower.best, log: [log, ...tower.log].slice(0, 20) }
      const nextCoins = coins + reward
      const nextItems = items.map((i) => (i.type === 'house' ? { ...i, tower: next } : i))
      save(nextCoins, nextItems, get().homework)
      set({ items: nextItems, tower: next, coins: nextCoins })
      return { first, reward }
    },

    // 학급 레이드 한 번이 끝났을 때의 보상 — 이긴 도전은 도토리와 칭호, 진 도전은 넘긴 페이즈만큼 위로 도토리
    raidReward: ({ gid, won, phases, mvp }) => {
      const { items, raid, coins } = get()
      if (gid <= raid.gid) return null // 이미 받은 도전
      const reward = (won ? RAID_REWARD_CLEAR : Math.min(RAID_REWARD_PHASE_MAX, Math.max(0, phases) * RAID_REWARD_PHASE)) + (won && mvp ? RAID_REWARD_MVP : 0)
      const next: RaidData = {
        clears: raid.clears + (won ? 1 : 0),
        mvps: raid.mvps + (won && mvp ? 1 : 0),
        part: raid.part + 1,
        mvpAt: won && mvp ? dateKey() : raid.mvpAt,
        gid,
      }
      const nextCoins = coins + reward
      const nextItems = items.map((i) => (i.type === 'house' ? { ...i, raid: next } : i))
      save(nextCoins, nextItems, get().homework)
      set({ items: nextItems, raid: next, coins: nextCoins })
      const before = raidTitleOf(raid.clears)
      const after = raidTitleOf(next.clears)
      return { coins: reward, clears: next.clears, titleUp: after && after.text !== before?.text ? after.text : null, mvpDay: won && mvp }
    },

    // 다른 종류의 무기를 새로 얻는다 (1단계 나무 무기)
    buyWeapon: (family) => {
      const { weapons, coins, items } = get()
      if (weapons[family]) return
      const houseLv = items.find((i) => i.type === 'house')?.level ?? 1
      if (houseLv < FAMILY_HOUSE[family]) {
        get().flash(`집이 ${FAMILY_HOUSE[family]}단계가 되면 얻을 수 있어요 🔒`)
        return
      }
      if (coins < NEW_WEAPON_COST) {
        get().flash(`도토리가 ${NEW_WEAPON_COST - coins}개 모자라요`)
        return
      }
      const nextW = { ...weapons, [family]: 1 }
      const avatar = { ...get().avatar, weapon: family, wt: 1 }
      const nextItems = items.map((i) => (i.type === 'house' ? { ...i, weapons: nextW, avatar } : i))
      const nextCoins = coins - NEW_WEAPON_COST
      save(nextCoins, nextItems, get().homework)
      set({ items: nextItems, coins: nextCoins, weapons: nextW, avatar: normalizeAvatar(avatar) })
      get().flash(`${tierName(family, 1)}을(를) 얻었어요! -${NEW_WEAPON_COST} 도토리`)
    },

    // 한 단계 진화 (도토리를 쓴다. 실패는 없다)
    evolveWeapon: (family) => {
      const { weapons, coins, items } = get()
      const tier = weapons[family]
      const cost = tier ? evolveCost(tier) : null
      if (!tier || cost == null) return
      if (coins < cost) {
        get().flash(`도토리가 ${cost - coins}개 모자라요`)
        return
      }
      const nextTier = tier + 1
      const nextW = { ...weapons, [family]: nextTier }
      const equipped = get().avatar.weapon === family
      const avatar = equipped ? { ...get().avatar, wt: nextTier } : get().avatar
      const nextItems = items.map((i) => (i.type === 'house' ? { ...i, weapons: nextW, avatar } : i))
      const nextCoins = coins - cost
      save(nextCoins, nextItems, get().homework)
      set({
        items: nextItems,
        coins: nextCoins,
        weapons: nextW,
        avatar: normalizeAvatar(avatar),
        evolveFx: { family, tier: nextTier, at: Date.now() },
      })
    },

    openPet: () => set({ petOpen: true }),
    closePet: () => set({ petOpen: false, petFx: null }),

    // 처음 키울 알을 고른다 (한 번에 한 마리)
    choosePet: (sp) => {
      const { items, pet } = get()
      if (pet || !isPetSpecies(sp)) return
      const next: PetState = { sp, st: 0, fed: 0, pity: 0 }
      const nextItems = items.map((i) => (i.type === 'house' ? { ...i, pet: next } : i))
      save(get().coins, nextItems, get().homework)
      set({ items: nextItems, pet: next })
      get().flash(`${SPECIES_MAP[sp].label}의 알을 받았어요! 🥚`)
    },

    // 먹이 주기 — 하루 한 번, 오늘의 학습을 15문제 이상 맞힌 날만
    feedPet: () => {
      const { items, pet, daily } = get()
      if (!pet) return
      const today = dateKey()
      const house = items.find((i) => i.type === 'house')
      if (pet.st >= MAX_STAGE) {
        get().flash('다 자란 펫은 먹이가 필요 없어요 🏆')
        return
      }
      if (house?.petFed === today) {
        get().flash('오늘은 이미 먹이를 줬어요. 내일 또 주세요!')
        return
      }
      const score = daily && daily.day === today ? daily.score : 0
      if (score < FEED_NEED_SCORE) {
        get().flash(`오늘의 학습을 ${FEED_NEED_SCORE}문제 이상 맞히면 먹이를 줄 수 있어요 (지금 ${score}문제)`)
        return
      }
      if (pet.fed >= FEED_NEED[pet.st]) {
        get().flash('배가 불러요! 이제 진화할 수 있어요 ✨')
        return
      }
      const next: PetState = { ...pet, fed: pet.fed + 1 }
      const nextItems = items.map((i) => (i.type === 'house' ? { ...i, pet: next, petFed: today } : i))
      save(get().coins, nextItems, get().homework)
      set({ items: nextItems, pet: next })
      get().flash('냠냠! 먹이를 먹었어요 🍖')
    },

    // 진화 — 도토리를 내고 확률로 성공한다. 집 단계가 모자라면 할 수 없다.
    evolvePet: () => {
      const { items, pet, coins } = get()
      if (!pet) return
      const houseLv = items.find((i) => i.type === 'house')?.level ?? 1
      const chk = canEvolve(pet, houseLv)
      if (!chk.ok) {
        get().flash(chk.why)
        return
      }
      const cost = EVOLVE_COST_PET[pet.st]
      if (coins < cost) {
        get().flash(`도토리가 ${cost - coins}개 모자라요`)
        return
      }
      const ok = rollEvolve(pet)
      const next: PetState = ok
        ? { ...pet, st: pet.st + 1, fed: 0, pity: 0 }
        : { ...pet, pity: pet.pity + 1 }
      const nextItems = items.map((i) => (i.type === 'house' ? { ...i, pet: next } : i))
      const nextCoins = coins - cost
      save(nextCoins, nextItems, get().homework)
      set({ items: nextItems, coins: nextCoins, pet: next, petFx: { at: Date.now(), ok, st: next.st } })
      get().flash(ok ? `${stageLabel(next.sp, next.st)}(으)로 진화! -${cost} 도토리` : `아쉽게 실패… 다음엔 성공 확률이 올라가요 -${cost} 도토리`)
    },

    // 펫을 보낸다 (다른 알을 키우려면 먼저 버려야 한다)
    releasePet: () => {
      const { items, pet } = get()
      if (!pet) return
      const nextItems = items.map((i) => (i.type === 'house' ? { ...i, pet: null } : i))
      save(get().coins, nextItems, get().homework)
      set({ items: nextItems, pet: null, petFx: null })
      get().flash('펫을 떠나보냈어요. 새 알을 고를 수 있어요')
    },

    chooseWardrobe: (slot, id) => {
      const item = findItem(slot, id)
      if (!item) return
      const { items, coins } = get()
      const owned = wardrobeOf(items)
      const key = `${slot}:${id}`
      const has = ownsItem(item, owned)
      if (!has) {
        const need = houseNeeded(item)
        const lv = items.find((i) => i.type === 'house')?.level ?? 1
        if (lv < need) {
          get().flash(`집이 ${need}단계가 되면 살 수 있어요 🔒`)
          return
        }
      }
      if (!has && coins < item.cost) {
        get().flash(`${item.cost} 도토리가 필요해요`)
        return
      }
      const nextOwned = has ? owned : [...owned, key]
      const nullable = slot === 'hat' || slot === 'acc' || slot === 'costume' || slot === 'ride'
      const nextAvatar = { ...get().avatar, [slot]: nullable && id === 'none' ? null : id }
      const nextItems = items.map((i) =>
        i.type === 'house' ? { ...i, avatar: nextAvatar, wardrobe: nextOwned } : i,
      )
      const nextCoins = has ? coins : coins - item.cost
      save(nextCoins, nextItems, get().homework)
      set({
        items: nextItems,
        coins: nextCoins,
        avatar: normalizeAvatar(nextAvatar),
        wardrobe: nextOwned,
        ...(slot === 'ride' && id !== 'none' ? { rideOn: true } : {}),
      })
      if (!has) get().flash(`${item.label} 구매! -${item.cost} 도토리`)
    },

    hydrateFromCloud: (coins, items) => {
      const merged = ensureFarm(
        ensureLayout(
          ensureDaily(
            ensureWardrobe(ensureArcade(ensureBoard(ensureHouse(items)))),
            get().classQuestions,
          ),
        ),
      )
      saveLocal(coins, merged, get().homework)
      set({
        coins,
        items: merged,
        avatar: avatarOf(merged),
        wardrobe: wardrobeOf(merged),
        weapons: weaponsOf(merged),
        bossCleared: bossOf(merged),
        pet: petOf(merged),
        bossTry: bossTryOf(merged),
        tower: towerOf(merged),
        raid: raidOf(merged),
        daily: dailyOf(merged),
      })
    },

    hydrateHomework: (text) => {
      saveLocal(get().coins, get().items, text)
      set({ homework: text })
    },

    setSession: (session) => set(session ? { session } : { session, towerOn: false }),
    setCloud: (cloud) => set({ cloud }),
    setClassConfig: (cfg) =>
      set((s) => ({
        arcadeLocked: cfg.arcadeEnabled === undefined ? s.arcadeLocked : !cfg.arcadeEnabled,
        mission: cfg.mission === undefined ? s.mission : cfg.mission,
        classQuestions: cfg.questions === undefined ? s.classQuestions : cfg.questions,
        classLunch: cfg.lunch === undefined ? s.classLunch : cfg.lunch,
      })),

    // 선생님이 준 도토리를 받는다 (cloud.ts 폴링에서 호출)
    grantCoins: (amount, reason) => {
      const next = get().coins + amount
      save(next, get().items, get().homework)
      set({ coins: next })
      get().flash(
        amount >= 0
          ? `선생님이 도토리를 줬어요! +${amount}${reason ? ` (${reason})` : ''}`
          : `도토리 ${amount}${reason ? ` (${reason})` : ''}`,
      )
    },

    // 오목 같은 게임에서 받은 도토리 (선생님이 준 것과 구분되는 안내)
    addCoins: (amount, reason) => {
      const next = get().coins + amount
      save(next, get().items, get().homework)
      set({ coins: next })
      get().flash(`${reason ? reason + ' · ' : ''}도토리 +${amount} 🌰`)
    },

    setMode: (mode) =>
      set({ mode, placing: null, selected: null, activeFarm: null }),

    togglePlacing: (type) =>
      set((s) => ({ placing: s.placing === type ? null : type, selected: null })),

    select: (selected) => set({ selected, placing: null }),

    openFarm: (key) => set({ activeFarm: key }),
    closeFarm: () => set({ activeFarm: null }),

    flash: (text) => {
      set({ msg: text })
      if (msgTimer) clearTimeout(msgTimer)
      msgTimer = setTimeout(() => set({ msg: null }), 2200)
    },

    placeAt: (x, z) => {
      const { placing, items, coins } = get()
      if (!placing) return
      const entry = CATALOG_MAP[placing]
      if (!entry) return
      if (entry.cost > coins) {
        get().flash(`도토리가 부족해요 (${entry.cost}개 필요)`)
        return
      }
      const limit = farmLimit(placing, items.find((i) => i.type === 'house')?.level)
      if (limit !== null && items.filter((i) => i.type === placing).length >= limit) {
        get().flash(
          `${entry.label}은(는) 지금 ${limit}개까지만 둘 수 있어요. 우리 집을 키우면 더 늘어나요!`,
        )
        return
      }
      const half = landHalf(items)
      const [tx, tz] = clampToLand(Math.round(x), Math.round(z), half)
      // 누른 자리에 다른 물건이 있으면 가장 가까운 빈자리에 놓는다
      const spot = findFreeSpot({ type: placing }, tx, tz, half, items)
      if (!spot) {
        get().flash('여기엔 놓을 자리가 없어요. 다른 곳을 눌러 보세요')
        return
      }
      const [cx, cz] = spot
      const item: PlacedItem = { key: newKey(), type: placing, x: cx, z: cz, rot: 0 }
      commit([...items, item], coins - entry.cost)
      set({ selected: item.key })
    },

    moveSelectedTo: (x, z) => {
      const { selected, items } = get()
      if (!selected) return
      const half = landHalf(items)
      const me = items.find((it) => it.key === selected)
      if (!me) return
      const [tx, tz] = clampToLand(Math.round(x), Math.round(z), half)
      const spot = findFreeSpot(me, tx, tz, half, items, selected)
      if (!spot) {
        get().flash('여기엔 옮길 자리가 없어요. 다른 곳을 눌러 보세요')
        return
      }
      const [cx, cz] = spot
      commit(items.map((it) => (it.key === selected ? { ...it, x: cx, z: cz } : it)))
    },

    rotateSelected: () => {
      const { selected, items } = get()
      if (!selected) return
      commit(
        items.map((it) =>
          it.key === selected ? { ...it, rot: (it.rot + Math.PI / 4) % (Math.PI * 2) } : it,
        ),
      )
    },

    deleteSelected: () => {
      const { selected, items } = get()
      if (!selected) return
      const it = items.find((i) => i.key === selected)
      const fixed: Record<string, string> = {
        house: '우리 집은 지울 수 없어요',
        board: '게시판은 지울 수 없어요',
        arcade: '강화대는 지울 수 없어요',
        wardrobe: '옷장은 지울 수 없어요',
      }
      if (it && fixed[it.type]) {
        get().flash(fixed[it.type])
        return
      }
      if (it?.crop && !window.confirm('밭에 작물이 자라고 있어요.\n지우면 작물도 함께 사라져요. 지울까요?')) return
      if (it?.animal && !window.confirm('우리에 동물이 살고 있어요.\n지우면 동물도 함께 떠나요. 지울까요?')) return
      commit(items.filter((i) => i.key !== selected))
      set({ selected: null })
    },

    clearAll: () => {
      const keep = new Set(['house', 'board', 'arcade', 'wardrobe'])
      commit(get().items.filter((i) => keep.has(i.type)))
      set({ selected: null, placing: null })
    },

    upgradeHouse: () => {
      const { items, coins } = get()
      const h = items.find((i) => i.type === 'house')
      if (!h) return
      const cur = h.level ?? 1
      const next = HOUSE_LEVELS.find((l) => l.level === cur + 1)
      if (!next) {
        get().flash('이미 제일 좋은 집이에요')
        return
      }
      if (coins < next.cost) {
        get().flash(`${next.cost} 도토리가 필요해요`)
        return
      }
      const grown = items.map((i) => (i.type === 'house' ? { ...i, level: cur + 1 } : i))
      const fixed = resolveFarmOverlaps(grown, landHalf(grown))
      commit(fixed.items, coins - next.cost)
      get().flash(
        fixed.moved
          ? `집이 ${next.label}(으)로 커졌어요! 🏡 (겹친 밭·우리 ${fixed.moved}개를 옮겼어요)`
          : `집이 ${next.label}(으)로 커졌어요! 🏡`,
      )
    },

    expandLand: () => {
      const { items, coins } = get()
      const h = items.find((i) => i.type === 'house')
      const cur = h?.land ?? LAND_OLD
      const info = landExpand(cur)
      if (!info) {
        get().flash('땅을 더 넓힐 수 없어요')
        return
      }
      if (info.next > landCapFor(h?.level)) {
        get().flash(`집이 ${houseNeededForLand(info.next)}단계가 되면 땅을 더 넓힐 수 있어요 🔒`)
        return
      }
      if (coins < info.cost) {
        get().flash(`${info.cost} 도토리가 필요해요`)
        return
      }
      commit(
        items.map((i) => (i.type === 'house' ? { ...i, land: info.next } : i)),
        coins - info.cost,
      )
      get().flash(`땅을 +${info.addTiles}평 넓혔어요! 🟩`)
    },

    openLearn: () => set({ learnOpen: true }),
    closeLearn: () => set({ learnOpen: false }),
    openSheets: () => set({ sheetsOpen: true }),
    closeSheets: () => set({ sheetsOpen: false }),
    openFriends: () => set({ friendsOpen: true }),
    closeFriends: () => set({ friendsOpen: false }),
    setNotice: (notice) => set({ notice }),
    openFriendInfo: () => set({ friendInfoOpen: true }),
    closeFriendInfo: () => set({ friendInfoOpen: false }),
    setVisiting: (visiting) =>
      set({
        visiting,
        friendsOpen: false,
        friendInfoOpen: false,
        activeFarm: null,
        selected: null,
        placing: null,
        mode: 'browse',
        learnOpen: false,
        sheetsOpen: false,
        quiz: null,
      }),

    // 첫 시도: 맞히면 다음 문제로, 틀리면 같은 문제에서 힌트를 보고 한 번 더 고른다 (retryDaily)
    answerDaily: (pick) => {
      const { items } = get()
      const d = dailyOf(items)
      if (!d || d.claimed) return
      const set_ = dailySet(d.day, DAILY_PER_SUBJECT, get().classQuestions)
      if (d.idx >= set_.length) return
      const q = set_[d.idx]
      if (d.picks[q.id] != null) return
      const correct = pick === q.answer
      const nextDaily: DailyLearn = {
        ...d,
        picks: { ...d.picks, [q.id]: pick },
        idx: d.idx + (correct ? 1 : 0),
        score: d.score + (correct ? 1 : 0),
        first: (d.first ?? d.score) + (correct ? 1 : 0),
      }
      const nextItems = items.map((i) => (i.type === 'house' ? { ...i, daily: nextDaily } : i))
      save(get().coins, nextItems, get().homework)
      set({ items: nextItems, daily: nextDaily })
    },

    // 두 번째 시도 (힌트를 본 뒤) — 맞히면 ½점
    retryDaily: (pick) => {
      const { items } = get()
      const d = dailyOf(items)
      if (!d || d.claimed) return
      const set_ = dailySet(d.day, DAILY_PER_SUBJECT, get().classQuestions)
      if (d.idx >= set_.length) return
      const q = set_[d.idx]
      const first = d.picks[q.id]
      if (first == null || first === q.answer || pick === first) return
      if (d.retry?.[q.id] != null) return
      const nextDaily: DailyLearn = {
        ...d,
        retry: { ...d.retry, [q.id]: pick },
        idx: d.idx + 1,
        score: d.score + (pick === q.answer ? 1 : 0),
        first: d.first ?? d.score,
      }
      const nextItems = items.map((i) => (i.type === 'house' ? { ...i, daily: nextDaily } : i))
      save(get().coins, nextItems, get().homework)
      set({ items: nextItems, daily: nextDaily })
    },

    claimDaily: () => {
      const { items } = get()
      const d = dailyOf(items)
      if (!d || d.claimed) return
      const set_ = dailySet(d.day, DAILY_PER_SUBJECT, get().classQuestions)
      if (d.idx < set_.length) return
      const pay = dailyPay(dailyPoints(d.score, d.first), set_.length)?.coins ?? 0
      // 옛 방식(맞힐 때마다 1개씩 지급)으로 이미 받은 만큼은 빼고 준다
      const already = d.v === 2 ? 0 : d.score
      const add = Math.max(0, pay - already)
      const total = Math.max(pay, already)
      const nextDaily: DailyLearn = { ...d, claimed: true, earned: total }
      const nextCoins = get().coins + add
      const nextItems = items.map((i) => (i.type === 'house' ? { ...i, daily: nextDaily } : i))
      save(nextCoins, nextItems, get().homework)
      set({ items: nextItems, daily: nextDaily, coins: nextCoins })
      get().flash(
        total > 0
          ? `오늘의 학습 끝! ${d.score}/${set_.length} · +${total} 도토리`
          : `오늘의 학습 끝! ${d.score}/${set_.length} · 내일 다시 도전해요`,
      )
    },

    askQuiz: (onPass, onFail, id) => set({ quiz: { onPass, onFail, id } }),
    // 문제를 틀렸다 → 이번 돌봄 기회가 사라진다
    failQuiz: () => {
      const q = get().quiz
      if (!q) return
      set({ quiz: null })
      q.onFail?.()
    },
    passQuiz: () => {
      const q = get().quiz
      if (!q) return
      set({ quiz: null, coins: get().coins + QUIZ_REWARD })
      save(get().coins, get().items, get().homework)
      q.onPass()
    },
    cancelQuiz: () => set({ quiz: null }),

    /* ---------- 농장: 하루 한 번 돌봄 ---------- */

    plantCrop: (key, seedId, fert) => {
      const def = CROP_MAP[seedId]
      if (!def) return
      const { items, coins } = get()
      const it = items.find((i) => i.key === key)
      if (!it || it.crop) return
      const cost = def.cost + (fert ? fertCost(def) : 0)
      if (cost > coins) {
        get().flash(`${cost}도토리가 필요해요`)
        return
      }
      const today = dateKey()
      const crop: CropState = {
        v: 2,
        seed: seedId,
        plantedAt: serverNow(),
        plantDay: today,
        grow: 0,
        stars: 3,
        fert,
        lastDay: '',
        tryDay: '',
      }
      commit(
        items.map((i) => (i.key === key ? { ...i, crop } : i)),
        coins - cost,
      )
      get().flash(`${def.label} 씨앗을 심었어요${fert ? ' (비료 🧪)' : ''} — 날마다 물을 주세요`)
    },

    // 물주기: 하루 한 번, 문제를 맞히면 하루 자란다. 틀리면 오늘 기회가 사라지고 별이 하나 준다.
    waterCrop: (key) => {
      const it = get().items.find((i) => i.key === key)
      if (!it?.crop) return
      const today = dateKey()
      const c = normCrop(it.crop, today)
      if (cropRipe(c)) {
        get().flash('다 자랐어요! 수확해요 🧺')
        return
      }
      if (c.tryDay === today) {
        get().flash('오늘은 이미 돌봤어요. 내일 또 와요 🌙')
        return
      }
      const update = (ok: boolean) => {
        const t = dateKey()
        const cur = get().items.find((i) => i.key === key)?.crop
        if (!cur) return
        const w = applyWilt(normCrop(cur, t), t, get().classLunch)
        const next = ok
          ? { ...w.s, grow: w.s.grow + 1, lastDay: t, tryDay: t }
          : { ...w.s, stars: Math.max(1, w.s.stars - 1), tryDay: t }
        commit(get().items.map((i) => (i.key === key ? { ...i, crop: next } : i)))
        const wilt = w.wilted ? ' (며칠 못 돌봐서 시들었어요 🥀 ★-1)' : ''
        get().flash(
          ok
            ? cropRipe(next)
              ? `물을 줬어요 💧 다 자랐어요! 수확해요 🧺${wilt}`
              : `물을 줬어요 💧 하루 자랐어요${wilt}`
            : `틀렸어요… 오늘 물주기 기회가 사라지고 품질이 ★1 내려갔어요${wilt}`,
        )
      }
      get().askQuiz(() => update(true), () => update(false), `water:${key}:${today}`)
    },

    harvestCrop: (key) => {
      const it = get().items.find((i) => i.key === key)
      if (!it?.crop) return
      const today = dateKey()
      const w = applyWilt(normCrop(it.crop, today), today, get().classLunch)
      const def = CROP_MAP[w.s.seed]
      if (!def) return
      if (!cropRipe(w.s)) {
        get().flash('아직 다 자라지 않았어요')
        return
      }
      const got = storeProduce(get().items, 'c:' + def.id, w.s.stars)
      commit(
        got.items.map((i) => (i.key === key ? { ...i, crop: undefined } : i)),
        get().coins + got.bonus,
      )
      get().flash(
        `${def.emoji} ${def.label} ${'★'.repeat(w.s.stars)} 수확! 창고에 넣었어요${w.wilted ? ' (조금 시들었어요 🥀)' : ''}${got.note}`,
      )
    },

    buyAnimal: (key, speciesId) => {
      const def = ANIMAL_MAP[speciesId]
      if (!def) return
      const { items, coins } = get()
      const it = items.find((i) => i.key === key)
      if (!it || it.animal) return
      if (def.cost > coins) {
        get().flash(`${def.label} 값 ${def.cost}도토리가 부족해요`)
        return
      }
      const animal: AnimalState = {
        v: 2,
        species: speciesId,
        boughtAt: serverNow(),
        buyDay: dateKey(),
        fed: 0,
        stars: 3,
        lastDay: '',
        tryDay: '',
      }
      commit(
        items.map((i) => (i.key === key ? { ...i, animal } : i)),
        coins - def.cost,
      )
      get().flash(`${def.label}를 데려왔어요 — 날마다 먹이를 주세요`)
    },

    // 먹이주기: 하루 한 번. 먹이를 먹은 날이 모이면 생산물이 생긴다.
    feedAnimal: (key) => {
      const it = get().items.find((i) => i.key === key)
      if (!it?.animal) return
      const today = dateKey()
      const a = normAnimal(it.animal, today)
      const def = ANIMAL_MAP[a.species]
      if (!def) return
      if (animalReady(a)) {
        get().flash(`${def.produceLabel}을(를) 먼저 거둬요 ${def.produceEmoji}`)
        return
      }
      if (a.tryDay === today) {
        get().flash('오늘은 이미 먹이를 줬어요. 내일 또 와요 🌙')
        return
      }
      const update = (ok: boolean) => {
        const t = dateKey()
        const cur = get().items.find((i) => i.key === key)?.animal
        if (!cur) return
        const w = applyWilt(normAnimal(cur, t), t, get().classLunch)
        const next = ok
          ? { ...w.s, fed: w.s.fed + 1, lastDay: t, tryDay: t }
          : { ...w.s, stars: Math.max(1, w.s.stars - 1), tryDay: t }
        commit(get().items.map((i) => (i.key === key ? { ...i, animal: next } : i)))
        const hungry = w.wilted ? ' (며칠 굶어서 기운이 없어요 😢 ★-1)' : ''
        get().flash(
          ok
            ? animalReady(next)
              ? `먹이를 줬어요 🌾 ${def.produceLabel}이(가) 생겼어요! ${def.produceEmoji}${hungry}`
              : `먹이를 줬어요 🌾${hungry}`
            : `틀렸어요… 오늘 먹이주기 기회가 사라지고 품질이 ★1 내려갔어요${hungry}`,
        )
      }
      get().askQuiz(() => update(true), () => update(false), `feed:${key}:${today}`)
    },

    collectProduce: (key) => {
      const it = get().items.find((i) => i.key === key)
      if (!it?.animal) return
      const today = dateKey()
      const w = applyWilt(normAnimal(it.animal, today), today, get().classLunch)
      const def = ANIMAL_MAP[w.s.species]
      if (!def) return
      if (!animalReady(w.s)) {
        get().flash(`${def.produceLabel}이(가) 아직 안 모였어요`)
        return
      }
      const got = storeProduce(get().items, 'a:' + def.id, w.s.stars)
      const next = { ...w.s, fed: 0, stars: 3, lastDay: today }
      commit(
        got.items.map((i) => (i.key === key ? { ...i, animal: next } : i)),
        get().coins + got.bonus,
      )
      get().flash(
        `${def.produceEmoji} ${def.produceLabel} ${'★'.repeat(w.s.stars)} 거둠! 창고에 넣었어요${w.wilted ? ' (기운이 없었어요 😢)' : ''}${got.note}`,
      )
    },

    /* ---------- 창고 · 시장 ---------- */

    openBarn: () => set({ barnOpen: true, activeFarm: null }),
    closeBarn: () => set({ barnOpen: false }),

    sellProduce: (pid, star, n) => {
      const info = productInfo(pid)
      if (!info || star < 1 || star > 3) return
      const { items } = get()
      const barn = normBarn(items.find((i) => i.type === 'house')?.barn)
      const have = barn[pid]?.[star - 1] ?? 0
      const k = Math.min(have, Math.max(0, Math.floor(n)))
      if (k <= 0) return
      const price = sellPrice(info.base, star, marketMult(dateKey(), pid))
      const row = [...(barn[pid] ?? [0, 0, 0])] as [number, number, number]
      row[star - 1] -= k
      const nextBarn = { ...barn, [pid]: row }
      commit(
        items.map((i) => (i.type === 'house' ? { ...i, barn: normBarn(nextBarn) } : i)),
        get().coins + price * k,
      )
      get().flash(`${info.emoji} ${info.label} ${'★'.repeat(star)} ${k}개 팔았어요! +${price * k} 도토리`)
    },

    sellAllProduce: () => {
      const { items } = get()
      const barn = normBarn(items.find((i) => i.type === 'house')?.barn)
      const today = dateKey()
      let total = 0
      let count = 0
      for (const [pid, row] of Object.entries(barn)) {
        const info = productInfo(pid)
        if (!info) continue
        row.forEach((n, i) => {
          total += n * sellPrice(info.base, i + 1, marketMult(today, pid))
          count += n
        })
      }
      if (count <= 0) {
        get().flash('창고가 비어 있어요')
        return
      }
      commit(
        items.map((i) => (i.type === 'house' ? { ...i, barn: {} } : i)),
        get().coins + total,
      )
      get().flash(`창고의 ${count}개를 모두 팔았어요! +${total} 도토리`)
    },

    /* ---------- 도토리 강화 게임 ---------- */

    enhanceTry: () => {
      const { items, coins } = get()
      if (get().arcadeLocked) {
        get().flash('강화 게임은 지금 잠겨 있어요')
        return
      }
      const arc = items.find((i) => i.type === 'arcade')
      if (!arc?.enh) return
      const today = dateKey()
      // 날짜 바뀌면 일일 카운트 리셋
      let e = arc.enh.day === today ? arc.enh : { ...arc.enh, day: today, used: 0, net: 0 }

      const step = enhanceStep(e.level)
      if (!step) {
        get().flash('이미 최고 레벨이에요')
        return
      }
      if (e.used >= ENHANCE_DAILY_LIMIT) {
        get().flash('오늘은 여기까지! 내일 또 도전해요')
        return
      }
      if (coins < step.cost) {
        get().flash(`${step.cost} 도토리가 필요해요`)
        return
      }

      const success = Math.random() < step.chance
      const before = e.level
      const after = success
        ? e.level + 1
        : Math.max(0, e.level + step.onFail)

      e = { ...e, level: after, used: e.used + 1, net: e.net - step.cost }

      commit(
        items.map((i) => (i.type === 'arcade' ? { ...i, enh: e } : i)),
        coins - step.cost,
      )
      set((s) => ({
        enhanceFx: { n: (s.enhanceFx?.n ?? 0) + 1, ok: success, from: before, to: after },
      }))
      get().flash(
        success
          ? `강화 성공! +${before} → +${after} ✨`
          : after === before
            ? `강화 실패… +${before} 유지`
            : `강화 실패… +${before} → +${after}`,
      )
    },

    enhanceSell: () => {
      const { items, coins } = get()
      const arc = items.find((i) => i.type === 'arcade')
      if (!arc?.enh) return
      const price = enhanceSell(arc.enh.level)
      if (price <= 0) {
        get().flash('강화된 도토리가 없어요')
        return
      }
      const today = dateKey()
      const sameDay = arc.enh.day === today
      const e: EnhanceState = {
        level: 0,
        day: today,
        used: sameDay ? arc.enh.used : 0,
        net: (sameDay ? arc.enh.net : 0) + price,
      }
      commit(
        items.map((i) => (i.type === 'arcade' ? { ...i, enh: e } : i)),
        coins + price,
      )
      get().flash(`+${arc.enh.level} 도토리 판매! +${price} 도토리`)
    },
  }
})

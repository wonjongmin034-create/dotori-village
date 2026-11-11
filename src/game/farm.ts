import { ANIMAL_MAP, CROP_MAP, WILT_SCHOOL_DAYS, cropDays } from './economy'
import { noSchoolReason, type ClassLunch } from './lunch'

// 농장 규칙 (하루 한 번 돌봄 · 시들기 · 품질) — 화면과 저장소가 함께 쓰는 순수 함수들.
//  · 날짜는 모두 'YYYY-MM-DD' (서버 기준 한국 날짜 = dateKey()).
//  · 예전 방식(물주기 횟수·시간)으로 저장된 작물·동물도 normCrop / normAnimal 로 새 규칙에 맞춰 읽는다.
//    (친구 마을처럼 아직 바뀌지 않은 데이터를 보여 줄 때도 안전하게)

export type CropState = {
  v?: 2
  seed: string
  plantedAt: number
  plantDay?: string // 심은 날
  grow?: number // 돌본 날 수 (= 자란 정도)
  stars?: number // 품질 1~3
  fert?: boolean // 심을 때 비료를 줬다 (자라는 날 -1)
  lastDay?: string // 마지막으로 잘 돌본 날
  tryDay?: string // 마지막으로 돌봄을 시도한 날 (하루 한 번)
  wiltAt?: string // 마지막으로 시들어서 별이 준 날
  // ↓ 예전 방식 (옮길 때만 읽는다)
  waterCount?: number
  fertilized?: boolean
  lastCareAt?: number
  fertTryAt?: number
}

export type AnimalState = {
  v?: 2
  species: string
  boughtAt: number
  buyDay?: string
  fed?: number // 이번 생산물을 위해 먹이를 먹은 날 수
  stars?: number
  lastDay?: string
  tryDay?: string
  wiltAt?: string
  // ↓ 예전 방식
  feedCount?: number
  lastCareAt?: number
  cycleStart?: number
}

export type Crop2 = Required<Pick<CropState, 'seed' | 'plantedAt' | 'plantDay' | 'grow' | 'stars' | 'fert' | 'lastDay' | 'tryDay'>> &
  Pick<CropState, 'wiltAt'> & { v: 2 }
export type Animal2 = Required<Pick<AnimalState, 'species' | 'boughtAt' | 'buyDay' | 'fed' | 'stars' | 'lastDay' | 'tryDay'>> &
  Pick<AnimalState, 'wiltAt'> & { v: 2 }

// 예전 규칙의 목표치 (옮길 때 "다 자랐는지" 판단용)
const OLD_WATER: Record<string, number> = { rice: 2, potato: 2, corn: 3, apple: 4, pear: 5, peach: 5 }
const OLD_PRODUCE_DAYS: Record<string, number> = { chick: 1, hen: 2, sheep: 4.5, cow: 7 }
const OLD_GROW_DAYS: Record<string, number> = { rice: 1.5, potato: 2.5, corn: 4, apple: 7, pear: 10, peach: 14 }
const DAY_MS = 86_400_000

const clampStar = (n: unknown, d = 3) => (typeof n === 'number' && isFinite(n) ? Math.max(1, Math.min(3, Math.round(n))) : d)
const str = (s: unknown) => (typeof s === 'string' ? s : '')

export function normCrop(c: CropState, today: string, now = Date.now()): Crop2 {
  const def = CROP_MAP[c.seed]
  const days = def ? cropDays(def, !!c.fert) : 1
  if (c.v === 2) {
    return {
      v: 2,
      seed: c.seed,
      plantedAt: c.plantedAt || 0,
      plantDay: str(c.plantDay) || today,
      grow: Math.max(0, Math.min(days, Math.round(c.grow ?? 0))),
      stars: clampStar(c.stars),
      fert: !!c.fert,
      lastDay: str(c.lastDay),
      tryDay: str(c.tryDay),
      wiltAt: c.wiltAt,
    }
  }
  // 예전 작물 → 새 규칙: 다 자란 것은 그대로 수확할 수 있게, 아니면 물 준 횟수만큼 자란 것으로
  const wc = Math.max(0, c.waterCount ?? 0)
  const oldRipe = wc >= (OLD_WATER[c.seed] ?? 2) && now - (c.plantedAt || now) >= (OLD_GROW_DAYS[c.seed] ?? 2) * DAY_MS
  const plantDays = days
  return {
    v: 2,
    seed: c.seed,
    plantedAt: c.plantedAt || now,
    plantDay: today,
    grow: oldRipe ? plantDays : Math.min(plantDays - 1, wc),
    stars: c.fertilized ? 3 : 2,
    fert: false,
    lastDay: today,
    tryDay: '',
  }
}

export function normAnimal(a: AnimalState, today: string, now = Date.now()): Animal2 {
  const def = ANIMAL_MAP[a.species]
  const need = def?.need ?? 2
  if (a.v === 2) {
    return {
      v: 2,
      species: a.species,
      boughtAt: a.boughtAt || 0,
      buyDay: str(a.buyDay) || today,
      fed: Math.max(0, Math.min(need, Math.round(a.fed ?? 0))),
      stars: clampStar(a.stars),
      lastDay: str(a.lastDay),
      tryDay: str(a.tryDay),
      wiltAt: a.wiltAt,
    }
  }
  const fc = Math.max(0, a.feedCount ?? 0)
  const oldReady = now - (a.cycleStart || now) >= (OLD_PRODUCE_DAYS[a.species] ?? 1) * DAY_MS
  return {
    v: 2,
    species: a.species,
    boughtAt: a.boughtAt || now,
    buyDay: today,
    fed: oldReady ? need : Math.min(need - 1, fc),
    stars: 2,
    lastDay: today,
    tryDay: '',
  }
}

/* ---------- 날짜 계산 ---------- */

const toUTC = (k: string) => {
  const [y, m, d] = k.split('-').map(Number)
  return Date.UTC(y, (m || 1) - 1, d || 1)
}
const fromUTC = (t: number) => {
  const d = new Date(t)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}

export const isSchoolDay = (k: string, lunch?: ClassLunch) => {
  const wd = new Date(toUTC(k)).getUTCDay()
  if (wd === 0 || wd === 6) return false
  return !noSchoolReason(k, lunch?.menu, lunch?.off)
}

// from 과 to 사이(둘 다 빼고)에 있는 학교 날 수 (최대 30까지만 센다)
export function schoolDaysBetween(from: string, to: string, lunch?: ClassLunch): number {
  if (!from || !to || from >= to) return 0
  let n = 0
  let t = toUTC(from) + DAY_MS
  const end = toUTC(to)
  for (let i = 0; t < end && i < 60; i++, t += DAY_MS) {
    if (isSchoolDay(fromUTC(t), lunch)) n++
    if (n >= 30) break
  }
  return n
}

const maxDay = (...ds: (string | undefined)[]) => ds.reduce<string>((m, d) => (d && d > m ? d : m), '')

// 마지막으로 돌본 날 (심은 날·돌본 날·시도한 날·마지막으로 시든 날 중 가장 늦은 날)
export const lastActive = (s: { plantDay?: string; buyDay?: string; lastDay?: string; tryDay?: string; wiltAt?: string }) =>
  maxDay(s.plantDay, s.buyDay, s.lastDay, s.tryDay, s.wiltAt)

// 오늘 시들었는지 (학교 날로 3일 넘게 돌보지 않았다) — 다음에 만질 때 별이 하나 준다
export function wiltPending(s: Crop2 | Animal2, today: string, lunch?: ClassLunch): boolean {
  const from = lastActive(s)
  return !!from && schoolDaysBetween(from, today, lunch) >= WILT_SCHOOL_DAYS
}

// 시든 것을 반영한다 (별 -1, 최소 1). 바뀌지 않았으면 같은 객체를 돌려준다.
export function applyWilt<T extends Crop2 | Animal2>(s: T, today: string, lunch?: ClassLunch): { s: T; wilted: boolean } {
  if (!wiltPending(s, today, lunch)) return { s, wilted: false }
  return { s: { ...s, stars: Math.max(1, s.stars - 1), wiltAt: today }, wilted: true }
}

export const cropRipe = (c: Crop2) => {
  const def = CROP_MAP[c.seed]
  return !!def && c.grow >= cropDays(def, c.fert)
}
export const animalReady = (a: Animal2) => {
  const def = ANIMAL_MAP[a.species]
  return !!def && a.fed >= def.need
}

/* ---------- 창고 · 도감 ---------- */

// 창고: 물건 id → [★1 개수, ★2 개수, ★3 개수]
export type Barn = Record<string, [number, number, number]>
// 도감: 물건 id → 거둔 가장 좋은 별
export type Dex = Record<string, number>

export function normBarn(raw: unknown): Barn {
  const out: Barn = {}
  if (!raw || typeof raw !== 'object') return out
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!Array.isArray(v)) continue
    const n = [0, 1, 2].map((i) => Math.max(0, Math.floor(Number(v[i]) || 0))) as [number, number, number]
    if (n[0] + n[1] + n[2] > 0) out[k] = n
  }
  return out
}
export function normDex(raw: unknown): Dex {
  const out: Dex = {}
  if (!raw || typeof raw !== 'object') return out
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) if (typeof v === 'number') out[k] = clampStar(v)
  return out
}

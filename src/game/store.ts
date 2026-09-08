import { create } from 'zustand'
import {
  START_COINS,
  QUIZ_REWARD,
  CARE_COOLDOWN_MS,
  FERTILIZER_COST,
  FERTILIZER_BONUS,
  CROP_MAP,
  ANIMAL_MAP,
  HOUSE_LEVELS,
  ENHANCE_DAILY_LIMIT,
  enhanceStep,
  enhanceSell,
} from './economy'
import { dateKey } from './lunch'
import { CATALOG_MAP } from './catalog'

export type CropState = {
  seed: string
  plantedAt: number
  waterCount: number
  fertilized: boolean
  lastCareAt: number
}

export type AnimalState = {
  species: string
  boughtAt: number
  feedCount: number
  lastCareAt: number
  cycleStart: number // 이번 생산 주기 시작 시각
}

export type EnhanceState = {
  level: number
  day: string // 마지막으로 시도한 날 (YYYY-MM-DD)
  used: number // 오늘 시도 횟수
  net: number // 오늘 손익 (도토리)
}

export type PlacedItem = {
  key: string
  type: string
  x: number
  z: number
  rot: number
  crop?: CropState
  animal?: AnimalState
  level?: number // 우리 집 등급
  enh?: EnhanceState // 강화 게임 상태 (arcade)
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
    return [{ key: 'house', type: 'house', x: 0, z: 0, rot: 0, level: 1 }, ...items]
  }
  // 예전 기본 위치(-5,-3)에 있던 집은 가운데로 한 번 옮긴다
  if (house.x === -5 && house.z === -3) {
    return items.map((i) => (i.type === 'house' ? { ...i, x: 0, z: 0 } : i))
  }
  return items
}

// 마을엔 항상 게시판(숙제·급식)이 하나 있다.
function ensureBoard(items: PlacedItem[]): PlacedItem[] {
  if (items.some((i) => i.type === 'board')) return items
  return [...items, { key: 'board', type: 'board', x: -7, z: 3, rot: Math.PI * 0.16 }]
}

// 천막 옆 도토리 강화 게임대.
function ensureArcade(items: PlacedItem[]): PlacedItem[] {
  if (items.some((i) => i.type === 'arcade')) return items
  return [
    ...items,
    {
      key: 'arcade',
      type: 'arcade',
      x: 4.5,
      z: 2,
      rot: -Math.PI * 0.15,
      enh: { level: 0, day: '', used: 0, net: 0 },
    },
  ]
}

const PLACE_RADIUS = 17.5
function clampToIsland(x: number, z: number): [number, number] {
  const d = Math.hypot(x, z)
  if (d > PLACE_RADIUS) return [(x / d) * PLACE_RADIUS, (z / d) * PLACE_RADIUS]
  return [x, z]
}

export type QuizRequest = { onPass: () => void }
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

  placing: string | null
  selected: string | null
  activeFarm: string | null // browse 모드에서 열어둔 밭/우리/게시판 key
  quiz: QuizRequest | null
  msg: string | null
  enhanceFx: EnhanceFx | null

  setHomework: (text: string) => void
  hydrateFromCloud: (coins: number, items: PlacedItem[]) => void
  hydrateHomework: (text: string) => void
  setSession: (s: Session | null) => void
  setCloud: (c: CloudStatus) => void
  setClassConfig: (cfg: { arcadeEnabled?: boolean; mission?: Mission | null }) => void
  grantCoins: (amount: number, reason: string) => void
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

  askQuiz: (onPass: () => void) => void
  passQuiz: () => void
  cancelQuiz: () => void

  plantCrop: (key: string, seedId: string) => void
  waterCrop: (key: string) => void
  fertilizeCrop: (key: string) => void
  harvestCrop: (key: string) => void

  buyAnimal: (key: string, speciesId: string) => void
  feedAnimal: (key: string) => void
  collectProduce: (key: string) => void

  enhanceTry: () => void
  enhanceSell: () => void
}

const initialRaw = load()
const initialItems = ensureArcade(ensureBoard(ensureHouse(initialRaw.items)))
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
    placing: null,
    selected: null,
    activeFarm: null,
    quiz: null,
    msg: null,
    enhanceFx: null,

    setHomework: (text) => {
      save(get().coins, get().items, text)
      set({ homework: text })
      get().flash('숙제를 저장했어요')
    },

    hydrateFromCloud: (coins, items) => {
      const merged = ensureArcade(ensureBoard(ensureHouse(items)))
      saveLocal(coins, merged, get().homework)
      set({ coins, items: merged })
    },

    hydrateHomework: (text) => {
      saveLocal(get().coins, get().items, text)
      set({ homework: text })
    },

    setSession: (session) => set({ session }),
    setCloud: (cloud) => set({ cloud }),
    setClassConfig: (cfg) =>
      set((s) => ({
        arcadeLocked: cfg.arcadeEnabled === undefined ? s.arcadeLocked : !cfg.arcadeEnabled,
        mission: cfg.mission === undefined ? s.mission : cfg.mission,
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
      const [cx, cz] = clampToIsland(Math.round(x), Math.round(z))
      const item: PlacedItem = { key: newKey(), type: placing, x: cx, z: cz, rot: 0 }
      commit([...items, item], coins - entry.cost)
      set({ selected: item.key })
    },

    moveSelectedTo: (x, z) => {
      const { selected, items } = get()
      if (!selected) return
      const [cx, cz] = clampToIsland(Math.round(x), Math.round(z))
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
      }
      if (it && fixed[it.type]) {
        get().flash(fixed[it.type])
        return
      }
      commit(items.filter((i) => i.key !== selected))
      set({ selected: null })
    },

    clearAll: () => {
      const keep = new Set(['house', 'board', 'arcade'])
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
      commit(
        items.map((i) => (i.type === 'house' ? { ...i, level: cur + 1 } : i)),
        coins - next.cost,
      )
      get().flash(`집이 ${next.label}(으)로 커졌어요! 🏡`)
    },

    askQuiz: (onPass) => set({ quiz: { onPass } }),
    passQuiz: () => {
      const q = get().quiz
      if (!q) return
      set({ quiz: null, coins: get().coins + QUIZ_REWARD })
      save(get().coins, get().items, get().homework)
      q.onPass()
    },
    cancelQuiz: () => set({ quiz: null }),

    plantCrop: (key, seedId) => {
      const def = CROP_MAP[seedId]
      if (!def) return
      const { items, coins } = get()
      const it = items.find((i) => i.key === key)
      if (!it || it.crop) return
      if (def.cost > coins) {
        get().flash(`씨앗 값 ${def.cost}도토리가 부족해요`)
        return
      }
      const now = Date.now()
      commit(
        items.map((i) =>
          i.key === key
            ? {
                ...i,
                crop: { seed: seedId, plantedAt: now, waterCount: 0, fertilized: false, lastCareAt: 0 },
              }
            : i,
        ),
        coins - def.cost,
      )
      get().flash(`${def.label} 씨앗을 심었어요`)
    },

    waterCrop: (key) => {
      const it = get().items.find((i) => i.key === key)
      if (!it?.crop) return
      if (Date.now() - it.crop.lastCareAt < CARE_COOLDOWN_MS) {
        get().flash('아직 물 줄 때가 아니에요')
        return
      }
      get().askQuiz(() => {
        const now = Date.now()
        commit(
          get().items.map((i) =>
            i.key === key && i.crop
              ? { ...i, crop: { ...i.crop, waterCount: i.crop.waterCount + 1, lastCareAt: now } }
              : i,
          ),
        )
        get().flash('물을 줬어요 💧')
      })
    },

    fertilizeCrop: (key) => {
      const it = get().items.find((i) => i.key === key)
      if (!it?.crop || it.crop.fertilized) return
      if (get().coins < FERTILIZER_COST) {
        get().flash(`비료 값 ${FERTILIZER_COST}도토리가 부족해요`)
        return
      }
      get().askQuiz(() => {
        commit(
          get().items.map((i) =>
            i.key === key && i.crop ? { ...i, crop: { ...i.crop, fertilized: true } } : i,
          ),
          get().coins - FERTILIZER_COST,
        )
        get().flash('비료를 줬어요 (수확 보상 ↑)')
      })
    },

    harvestCrop: (key) => {
      const { items } = get()
      const it = items.find((i) => i.key === key)
      if (!it?.crop) return
      const def = CROP_MAP[it.crop.seed]
      if (!def) return
      const ripe =
        it.crop.waterCount >= def.waterGoal &&
        Date.now() - it.crop.plantedAt >= def.minGrowMs
      if (!ripe) {
        get().flash('아직 다 자라지 않았어요')
        return
      }
      const gain = Math.round(def.reward * (it.crop.fertilized ? FERTILIZER_BONUS : 1))
      commit(
        items.map((i) => (i.key === key ? { ...i, crop: undefined } : i)),
        get().coins + gain,
      )
      get().flash(`${def.label} 수확! +${gain} 도토리`)
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
      const now = Date.now()
      commit(
        items.map((i) =>
          i.key === key
            ? {
                ...i,
                animal: { species: speciesId, boughtAt: now, feedCount: 0, lastCareAt: 0, cycleStart: now },
              }
            : i,
        ),
        coins - def.cost,
      )
      get().flash(`${def.label}를 데려왔어요`)
    },

    feedAnimal: (key) => {
      const it = get().items.find((i) => i.key === key)
      if (!it?.animal) return
      if (Date.now() - it.animal.lastCareAt < CARE_COOLDOWN_MS) {
        get().flash('아직 먹이 줄 때가 아니에요')
        return
      }
      get().askQuiz(() => {
        const now = Date.now()
        commit(
          get().items.map((i) =>
            i.key === key && i.animal
              ? { ...i, animal: { ...i.animal, feedCount: i.animal.feedCount + 1, lastCareAt: now } }
              : i,
          ),
        )
        get().flash('먹이를 줬어요 🌾')
      })
    },

    collectProduce: (key) => {
      const { items } = get()
      const it = items.find((i) => i.key === key)
      if (!it?.animal) return
      const def = ANIMAL_MAP[it.animal.species]
      if (!def) return
      const ready = Date.now() - it.animal.cycleStart >= def.produceMs
      if (!ready) {
        get().flash('생산물이 아직 안 모였어요')
        return
      }
      const wellFed = it.animal.feedCount >= def.feedGoal
      const gain = Math.round(def.reward * (wellFed ? def.wellFedBonus : 1))
      const now = Date.now()
      commit(
        items.map((i) =>
          i.key === key && i.animal
            ? { ...i, animal: { ...i.animal, cycleStart: now, feedCount: 0 } }
            : i,
        ),
        get().coins + gain,
      )
      get().flash(`${def.produceLabel} 거둠! +${gain} 도토리${wellFed ? ' (잘 키웠어요!)' : ''}`)
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

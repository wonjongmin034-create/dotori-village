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
} from './economy'
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

export type PlacedItem = {
  key: string
  type: string
  x: number
  z: number
  rot: number
  crop?: CropState
  animal?: AnimalState
  level?: number // 우리 집 등급
}

export type Mode = 'browse' | 'edit'

const STORAGE_KEY = 'dotori.village.v2'

type Persisted = { coins: number; items: PlacedItem[] }

function load(): Persisted {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { coins: START_COINS, items: [] }
    const p = JSON.parse(raw) as Partial<Persisted>
    return {
      coins: typeof p.coins === 'number' ? p.coins : START_COINS,
      items: Array.isArray(p.items)
        ? p.items.filter(
            (o): o is PlacedItem =>
              !!o && typeof o.type === 'string' && typeof o.x === 'number' && typeof o.z === 'number',
          )
        : [],
    }
  } catch {
    return { coins: START_COINS, items: [] }
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null
function save(coins: number, items: PlacedItem[]) {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ coins, items }))
    } catch {
      // 저장 불가 — 무시
    }
  }, 120)
}

let seq = 0
const newKey = () => `k${Date.now().toString(36)}_${(seq++).toString(36)}`

// 마을에는 항상 우리 집이 하나 있다. 없으면 천막(1단계)을 놓아준다.
function ensureHouse(items: PlacedItem[]): PlacedItem[] {
  if (items.some((i) => i.type === 'house')) return items
  return [{ key: 'house', type: 'house', x: -5, z: -3, rot: 0, level: 1 }, ...items]
}

const PLACE_RADIUS = 17.5
function clampToIsland(x: number, z: number): [number, number] {
  const d = Math.hypot(x, z)
  if (d > PLACE_RADIUS) return [(x / d) * PLACE_RADIUS, (z / d) * PLACE_RADIUS]
  return [x, z]
}

export type QuizRequest = { onPass: () => void }

interface VillageState {
  mode: Mode
  coins: number
  items: PlacedItem[]

  placing: string | null
  selected: string | null
  activeFarm: string | null // browse 모드에서 열어둔 밭/우리 key
  quiz: QuizRequest | null
  msg: string | null

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
}

const initialRaw = load()
const initial = { coins: initialRaw.coins, items: ensureHouse(initialRaw.items) }
let msgTimer: ReturnType<typeof setTimeout> | null = null

export const useVillage = create<VillageState>((set, get) => {
  const commit = (items: PlacedItem[], coins = get().coins) => {
    save(coins, items)
    set({ items, coins })
  }

  return {
    mode: 'browse',
    coins: initial.coins,
    items: initial.items,
    placing: null,
    selected: null,
    activeFarm: null,
    quiz: null,
    msg: null,

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
      if (it?.type === 'house') {
        get().flash('우리 집은 지울 수 없어요')
        return
      }
      commit(items.filter((i) => i.key !== selected))
      set({ selected: null })
    },

    clearAll: () => {
      commit(get().items.filter((i) => i.type === 'house'))
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
      save(get().coins, get().items)
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
  }
})

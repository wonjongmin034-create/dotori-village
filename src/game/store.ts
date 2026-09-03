import { create } from 'zustand'

// 섬에 놓인 물건 하나
export type PlacedItem = {
  key: string
  type: string
  x: number
  z: number
  rot: number // 라디안, 45도(π/4) 단위
}

export type Mode = 'browse' | 'edit'

const STORAGE_KEY = 'dotori.village.v1'
const PLACE_RADIUS = 17.5 // 이 반경 밖으로는 못 놓는다

function loadItems(): PlacedItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(
        (o): o is PlacedItem =>
          !!o &&
          typeof o.type === 'string' &&
          typeof o.x === 'number' &&
          typeof o.z === 'number',
      )
      .map((o, i) => ({
        key: typeof o.key === 'string' ? o.key : `k${i}`,
        type: o.type,
        x: o.x,
        z: o.z,
        rot: typeof o.rot === 'number' ? o.rot : 0,
      }))
  } catch {
    return []
  }
}

function saveItems(items: PlacedItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // 시크릿 모드 등 저장 불가 — 조용히 무시
  }
}

let seq = 0
const newKey = () => `k${Date.now().toString(36)}_${(seq++).toString(36)}`

function clampToIsland(x: number, z: number): [number, number] {
  const d = Math.hypot(x, z)
  if (d > PLACE_RADIUS) return [(x / d) * PLACE_RADIUS, (z / d) * PLACE_RADIUS]
  return [x, z]
}

interface VillageState {
  mode: Mode
  placing: string | null // 카탈로그에서 고른 놓을 물건 종류
  selected: string | null // 선택된 배치 물건의 key
  items: PlacedItem[]

  setMode: (m: Mode) => void
  togglePlacing: (type: string) => void
  select: (key: string | null) => void
  placeAt: (x: number, z: number) => void
  moveSelectedTo: (x: number, z: number) => void
  rotateSelected: () => void
  deleteSelected: () => void
  clearAll: () => void
}

export const useVillage = create<VillageState>((set, get) => ({
  mode: 'browse',
  placing: null,
  selected: null,
  items: loadItems(),

  setMode: (mode) => set({ mode, placing: null, selected: null }),

  togglePlacing: (type) =>
    set((s) => ({ placing: s.placing === type ? null : type, selected: null })),

  select: (selected) => set({ selected, placing: null }),

  placeAt: (x, z) => {
    const { placing, items } = get()
    if (!placing) return
    const [cx, cz] = clampToIsland(Math.round(x), Math.round(z))
    const item: PlacedItem = { key: newKey(), type: placing, x: cx, z: cz, rot: 0 }
    const next = [...items, item]
    saveItems(next)
    set({ items: next, selected: item.key })
  },

  moveSelectedTo: (x, z) => {
    const { selected, items } = get()
    if (!selected) return
    const [cx, cz] = clampToIsland(Math.round(x), Math.round(z))
    const next = items.map((it) => (it.key === selected ? { ...it, x: cx, z: cz } : it))
    saveItems(next)
    set({ items: next })
  },

  rotateSelected: () => {
    const { selected, items } = get()
    if (!selected) return
    const next = items.map((it) =>
      it.key === selected ? { ...it, rot: (it.rot + Math.PI / 4) % (Math.PI * 2) } : it,
    )
    saveItems(next)
    set({ items: next })
  },

  deleteSelected: () => {
    const { selected, items } = get()
    if (!selected) return
    const next = items.filter((it) => it.key !== selected)
    saveItems(next)
    set({ items: next, selected: null })
  },

  clearAll: () => {
    saveItems([])
    set({ items: [], selected: null, placing: null })
  },
}))

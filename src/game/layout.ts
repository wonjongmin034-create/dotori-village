import type { PlacedItem } from './store'

// 마을에 놓인 물건끼리 겹치지 않게 하는 규칙.
// 밭·우리·집·게시판·강화대·옷장 같은 "큰 물건"은 다른 물건(바닥 장식 제외)과 겹칠 수 없다.
// 나무·벤치 같은 작은 장식끼리는 지금처럼 자유롭게 놓을 수 있다.

const GROUND = new Set(['path', 'stonepath', 'flowers']) // 바닥에 깔리는 장식: 어디에나 겹쳐도 됨
const BIG = new Set(['plot', 'coop', 'house', 'board', 'arcade', 'wardrobe'])
const FARM = new Set(['plot', 'coop'])

// 대략적인 바닥 점유 반지름 (월드 단위)
const RADIUS: Record<string, number> = {
  plot: 0.95,
  coop: 0.98,
  board: 0.95,
  arcade: 0.9,
  wardrobe: 0.85,
  tree: 0.6,
  pine: 0.6,
  bush: 0.5,
  rock: 0.55,
  fence: 0.5,
  lamp: 0.3,
  bench: 0.7,
  table: 0.7,
  mailbox: 0.3,
  sign: 0.3,
  pond: 1.0,
  tent: 0.9,
  crate: 0.45,
  barrel: 0.45,
  campfire: 0.5,
  bigtree: 0.9,
  cherry: 0.9,
  gardenlight: 0.3,
  fountain: 1.1,
}
const HOUSE_R = [1.1, 1.4, 1.7, 2.0, 2.4] // 집 단계별 (천막 → 큰 저택)

type Lite = { type: string; level?: number }

export const radiusOf = (it: Lite) =>
  it.type === 'house' ? (HOUSE_R[(it.level ?? 1) - 1] ?? 1.1) : (RADIUS[it.type] ?? 0.5)

const blocks = (a: string, b: string) =>
  !GROUND.has(a) && !GROUND.has(b) && (BIG.has(a) || BIG.has(b))

export const isFarm = (type: string) => FARM.has(type)

// (x, z)에 이 물건을 놓으면 다른 물건과 겹치는가?
export function collides(
  me: Lite,
  x: number,
  z: number,
  items: PlacedItem[],
  ignoreKey?: string,
): boolean {
  const r = radiusOf(me)
  return items.some(
    (o) =>
      o.key !== ignoreKey &&
      blocks(me.type, o.type) &&
      Math.hypot(o.x - x, o.z - z) < r + radiusOf(o) - 0.05,
  )
}

const inside = (x: number, z: number, half: number) => Math.abs(x) <= half - 0.5 && Math.abs(z) <= half - 0.5

// 누른 자리가 막혀 있으면 가장 가까운 빈자리(1칸 단위)를 찾는다. 없으면 null.
export function findFreeSpot(
  me: Lite,
  x: number,
  z: number,
  half: number,
  items: PlacedItem[],
  ignoreKey?: string,
  maxR = 3,
): [number, number] | null {
  const cands: [number, number, number][] = []
  for (let dx = -maxR; dx <= maxR; dx++) {
    for (let dz = -maxR; dz <= maxR; dz++) {
      const cx = x + dx
      const cz = z + dz
      if (inside(cx, cz, half)) cands.push([cx, cz, dx * dx + dz * dz])
    }
  }
  cands.sort((a, b) => a[2] - b[2])
  for (const [cx, cz] of cands) {
    if (!collides(me, cx, cz, items, ignoreKey)) return [cx, cz]
  }
  return null
}

// 이미 겹쳐 있는 밭·우리를 가까운 빈자리로 옮긴다. (다른 물건은 그대로 두고 밭·우리만 움직임)
export function resolveFarmOverlaps(
  items: PlacedItem[],
  half: number,
): { items: PlacedItem[]; moved: number } {
  const fixed = items.filter((i) => !isFarm(i.type))
  const placed: PlacedItem[] = [...fixed]
  const next = new Map<string, PlacedItem>()
  let moved = 0
  for (const f of items.filter((i) => isFarm(i.type))) {
    if (!collides(f, f.x, f.z, placed)) {
      placed.push(f)
      continue
    }
    const spot = findFreeSpot(f, Math.round(f.x), Math.round(f.z), half, placed, undefined, 8)
    if (spot) {
      const m = { ...f, x: spot[0], z: spot[1] }
      next.set(f.key, m)
      placed.push(m)
      moved++
    } else {
      placed.push(f) // 자리가 정말 없으면 그대로 둔다
    }
  }
  return moved ? { items: items.map((i) => next.get(i.key) ?? i), moved } : { items, moved: 0 }
}

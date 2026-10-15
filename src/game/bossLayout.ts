// 보스 방의 모양 — 가운데 뒤쪽에 보스, 앞쪽에 팀이 부채꼴로 선다. (다른 파일을 불러오지 않는다)

export const ARENA_R = 11.5 // 갈 수 있는 땅의 반지름
export const BOSS_POS = { x: 0, z: -5.2 }
export const BOSS_SCALE = 1.3 // 보스를 이만큼 크게 그린다
export const BOSS_R = 3.5 // 보스 몸에 부딪히는 반지름
export const LOBBY_SPAWN_Z = 7.5

// 전투 중 팀원 자리 (i번째 / 전체 n명)
export function slotPos(i: number, n: number): [number, number] {
  const k = i - (n - 1) / 2
  return [k * 2.5, 3.3 + Math.abs(k) * 0.35]
}

// 자리에서 보스를 바라보는 방향
export function slotFacing(x: number, z: number): number {
  return Math.atan2(BOSS_POS.x - x, BOSS_POS.z - z)
}

// 아레나 안에서만 움직이게 + 보스 몸에는 부딪히게
export function constrainToArena(p: { x: number; z: number }) {
  const d = Math.hypot(p.x, p.z)
  const lim = ARENA_R - 0.6
  if (d > lim) {
    p.x *= lim / d
    p.z *= lim / d
  }
  const dx = p.x - BOSS_POS.x
  const dz = p.z - BOSS_POS.z
  const dd = Math.hypot(dx, dz)
  const min = BOSS_R + 0.35
  if (dd < min) {
    const k = dd < 1e-4 ? 0 : min / dd
    p.x = dd < 1e-4 ? BOSS_POS.x + min : BOSS_POS.x + dx * k
    p.z = dd < 1e-4 ? BOSS_POS.z : BOSS_POS.z + dz * k
  }
}

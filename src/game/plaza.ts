import * as THREE from 'three'
import { useVillage } from './store'
import { playerPos } from './player-state'

// 도토리 광장 — 같은 반 친구들이 모이는 공동 장소.
// 방 하나에 MAX_IN_ROOM(10)명까지. 꽉 차면 다음 번호의 광장으로 자동으로 옮겨 간다.

export const PLAZA_RADIUS = 15 // 갈 수 있는 땅의 반지름
export const PLAZA_ROOMS = 9 // 광장 번호는 1~9

type Ring = { x: number; z: number; a: number }
const ring = (n: number, r: number, off = 0): Ring[] =>
  Array.from({ length: n }, (_, i) => {
    const a = off + (i / n) * Math.PI * 2
    return { x: Math.sin(a) * r, z: Math.cos(a) * r, a }
  })

export const FOUNTAIN = { x: 0, z: 0, r: 2.5 }
export const BENCHES = ring(8, 6.6, Math.PI / 8) // 분수를 바라보는 의자
export const LAMPS = ring(8, 7.7, 0)
export const BEDS = ring(4, 9.4, Math.PI / 4).map((p) => ({ ...p, r: 1.3 })) // 꽃밭
export const STAGE = { x: 0, z: -12.7, w: 7.4, d: 3.4 } // 북쪽 무대

// 나무: 가장자리 둥글게 (무대 앞은 비운다)
export const TREES = [
  ...ring(20, 13.6, 0.05).filter((p) => !(Math.abs(p.x) < 5.2 && p.z < -9)),
  { x: -11.5, z: -9, a: 0 },
  { x: 11.8, z: -8.4, a: 0 },
  { x: -12.6, z: 7.2, a: 0 },
  { x: 12.4, z: 7.6, a: 0 },
]

// 숨을 수 있는 곳 (나중에 숨바꼭질을 만들 때 그대로 쓴다)
export type Hideout = { id: string; kind: 'bush' | 'tent' | 'barrel'; x: number; z: number; r: number }
export const HIDEOUTS: Hideout[] = [
  ...ring(8, 11, Math.PI / 8).map((p, i): Hideout => ({ id: `bush${i + 1}`, kind: 'bush', x: p.x, z: p.z, r: 0.95 })),
  { id: 'tent1', kind: 'tent', x: -11.6, z: 0.2, r: 1.35 },
  { id: 'tent2', kind: 'tent', x: 11.6, z: 0.2, r: 1.35 },
  { id: 'barrel1', kind: 'barrel', x: -6.2, z: 11.8, r: 0.5 },
  { id: 'barrel2', kind: 'barrel', x: -5.3, z: 12.5, r: 0.5 },
  { id: 'barrel3', kind: 'barrel', x: 6.2, z: 11.8, r: 0.5 },
  { id: 'barrel4', kind: 'barrel', x: 5.3, z: 12.5, r: 0.5 },
]

// 지나갈 수 없는 동그라미들: [x, z, 반지름]
export const COLLIDERS: [number, number, number][] = [
  [FOUNTAIN.x, FOUNTAIN.z, FOUNTAIN.r],
  ...BEDS.map((b): [number, number, number] => [b.x, b.z, b.r]),
  ...LAMPS.map((l): [number, number, number] => [l.x, l.z, 0.22]),
  ...TREES.map((t): [number, number, number] => [t.x, t.z, 0.55]),
  ...HIDEOUTS.map((h): [number, number, number] => [h.x, h.z, h.r]),
]

const BODY = 0.32 // 캐릭터 몸 반지름

// 광장 안에서만 움직이게 + 분수·나무 같은 것에는 부딪히게
export function constrainToPlaza(p: THREE.Vector3) {
  const d = Math.hypot(p.x, p.z)
  const lim = PLAZA_RADIUS - 0.5
  if (d > lim) {
    p.x *= lim / d
    p.z *= lim / d
  }
  if (p.y > 0.9) return // 높이 뛰면 넘어간다
  for (let pass = 0; pass < 2; pass++) {
    for (const [cx, cz, r] of COLLIDERS) {
      const dx = p.x - cx
      const dz = p.z - cz
      const dd = Math.hypot(dx, dz)
      const min = r + BODY
      if (dd < min) {
        const k = dd < 1e-4 ? 0 : min / dd
        p.x = dd < 1e-4 ? cx + min : cx + dx * k
        p.z = dd < 1e-4 ? cz : cz + dz * k
      }
    }
  }
}

/* ---------- 들어가고 나오기 ---------- */

export function enterPlaza(room = 1) {
  const s = useVillage.getState()
  if (!s.session) {
    s.flash('로그인해야 광장에 갈 수 있어요')
    return
  }
  s.setVisiting(null) // 열려 있던 창·친구 마을 정리
  playerPos.set((Math.random() - 0.5) * 6, 0, 11.4 + Math.random() * 1.2)
  useVillage.setState({ plaza: room })
}

export function leavePlaza() {
  playerPos.set(0, 0, 3)
  useVillage.setState({ plaza: null })
}

// 이 방이 꽉 찼으면 다음 번호의 광장으로
export function nextPlazaRoom() {
  const s = useVillage.getState()
  const cur = s.plaza
  if (cur == null) return
  if (cur >= PLAZA_ROOMS) {
    leavePlaza()
    s.setNotice('광장이 모두 가득 찼어요.\n조금 있다가 다시 와 주세요! 🙏')
    return
  }
  useVillage.setState({ plaza: cur + 1 })
  s.flash(`광장 ${cur}번이 가득 차서 ${cur + 1}번으로 왔어요`)
}

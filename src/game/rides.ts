import type { CharacterRefs } from './Character'

// 탈 것 — 옷장의 "탈 것" 칸에서 도토리로 산다. 비싼 것일수록 빠르다.
// 가격은 wardrobe.ts 에 있다 (옷장 카탈로그와 같은 방식으로 사고 쓴다).
export type RideDef = {
  id: string
  label: string
  speed: number // 걷는 속도의 배수
  jump: number // 점프 높이 배수
  seat: number // 캐릭터를 얼마나 위로 올릴지 (m)
  pose: 'kick' | 'bike' | 'horse' | 'cloud' | 'board'
  blurb: string
}

export const RIDES: Record<string, RideDef> = {
  kick: { id: 'kick', label: '킥보드', speed: 1.15, jump: 1, seat: 0.16, pose: 'kick', blurb: '가볍게 쓩!' },
  bike: { id: 'bike', label: '자전거', speed: 1.3, jump: 1, seat: 0.34, pose: 'bike', blurb: '페달을 밟아요' },
  horse: { id: 'horse', label: '말', speed: 1.45, jump: 1.1, seat: 0.64, pose: 'horse', blurb: '다그닥 다그닥' },
  cloud: { id: 'cloud', label: '구름', speed: 1.3, jump: 1.7, seat: 0.4, pose: 'cloud', blurb: '높이높이 뛰어요' },
  board: { id: 'board', label: '호버보드', speed: 1.6, jump: 1.2, seat: 0.3, pose: 'board', blurb: '제일 빨라요!' },
}

export const rideOf = (id: string | null | undefined): RideDef | null => (id ? (RIDES[id] ?? null) : null)

// 탄 채로 걸을 때의 팔·다리 자세. (타고 있지 않으면 옆으로 벌린 각도만 원래대로 돌린다)
export function applyRidePose(refs: CharacterRefs, ride: RideDef | null, moving: boolean, phase: number) {
  const { armL, armR, legL, legR } = refs
  if (!ride) {
    if (armL.current) armL.current.rotation.z = 0
    if (armR.current) armR.current.rotation.z = 0
    if (legL.current) legL.current.rotation.z = 0
    if (legR.current) legR.current.rotation.z = 0
    return
  }
  const set = (g: typeof armL, x: number, z: number) => {
    if (!g.current) return
    g.current.rotation.x = x
    g.current.rotation.z = z
  }
  switch (ride.pose) {
    case 'kick': // 손잡이를 잡고 서 있기
      set(armL, -1.25, 0.12)
      set(armR, -1.25, -0.12)
      set(legL, -0.12, 0)
      set(legR, 0.18, 0)
      break
    case 'bike': { // 앉아서 페달
      const p = moving ? Math.sin(phase * 0.9) * 0.4 : 0
      set(armL, -1.15, 0.1)
      set(armR, -1.15, -0.1)
      set(legL, -0.95 + p, 0.08)
      set(legR, -0.95 - p, -0.08)
      break
    }
    case 'horse': // 말 등에 걸터앉기
      set(armL, -1.0, 0.15)
      set(armR, -1.0, -0.15)
      set(legL, -1.05, 0.38)
      set(legR, -1.05, -0.38)
      break
    case 'cloud': // 구름 위에 책상다리
      set(armL, -0.35, 0.35)
      set(armR, -0.35, -0.35)
      set(legL, -1.3, 0.6)
      set(legR, -1.3, -0.6)
      break
    case 'board': // 두 팔을 벌리고 균형
      set(armL, -0.15, 0.85)
      set(armR, -0.15, -0.85)
      set(legL, -0.08, 0)
      set(legR, 0.12, 0)
      break
  }
}

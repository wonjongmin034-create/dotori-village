import * as THREE from 'three'
import { useVillage } from './store'
import { playerPos } from './player-state'
import { COLLIDERS, GATE_Z, PLAZA_RADIUS } from './plazaLayout'

// 도토리 광장 — 같은 반 친구들이 모이는 공동 장소.
// 방 하나에 MAX_IN_ROOM(10)명까지. 꽉 차면 다음 번호의 광장으로 자동으로 옮겨 간다.
// 자리(나무·분수·숨는 곳 등)는 plazaLayout.ts 에 있다.

export * from './plazaLayout'

export const PLAZA_ROOMS = 9 // 광장 번호는 1~9

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
  playerPos.set((Math.random() - 0.5) * 6, 0, GATE_Z - 2.6 + Math.random() * 1.2)
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

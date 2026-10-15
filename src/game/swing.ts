// 무기 휘두르기 — 문제를 맞힌 사람의 캐릭터가 무기를 크게 휘두르는 동작.
// Player(나)와 RemotePlayers(친구들)가 같은 함수로 팔을 움직인다.

export const SWING_MS = 560

const starts = new Map<string, number>() // 이름 → 휘두르기 시작 시각 (performance.now)

export function startSwing(name: string, delayMs = 0) {
  starts.set(name, performance.now() + delayMs)
}

const ease = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3)

export type SwingPose = { arm: number; armL: number; lunge: number; lean: number; strike: number }

// 지금 이 이름의 캐릭터가 휘두르는 중이면 자세를 돌려준다 (아니면 null)
//  0~0.32 : 팔을 뒤로 번쩍 (준비)   0.32~0.5 : 앞으로 내리친다   0.5~1 : 천천히 원래대로
//  strike : 내리치는 순간(0.32~0.5)에 1 → 이때 이펙트가 터진다
export function swingPose(name: string): SwingPose | null {
  const s = starts.get(name)
  if (s == null) return null
  const t = (performance.now() - s) / SWING_MS
  if (t < 0) return null
  if (t >= 1) {
    starts.delete(name)
    return null
  }
  let arm: number
  let lunge: number
  let lean: number
  if (t < 0.32) {
    const k = ease(t / 0.32)
    arm = -2.9 * k
    lunge = -0.08 * k
    lean = -0.16 * k
  } else if (t < 0.5) {
    const k = ease((t - 0.32) / 0.18)
    arm = -2.9 + (2.9 + 0.55) * k
    lunge = -0.08 + 0.62 * k
    lean = -0.16 + 0.52 * k
  } else {
    const k = ease((t - 0.5) / 0.5)
    arm = 0.55 * (1 - k)
    lunge = 0.54 * (1 - k)
    lean = 0.36 * (1 - k)
  }
  return { arm, armL: arm * -0.4, lunge, lean, strike: t >= 0.32 && t < 0.5 ? 1 : 0 }
}

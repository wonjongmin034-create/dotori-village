// 무기 휘두르기 — 문제를 맞힌 사람의 캐릭터가 무기를 쓰는 동작.
// Player(나)와 RemotePlayers(친구들)가 같은 함수로 팔을 움직인다.
// 무기마다 동작이 다르다: 칼·도끼·망치는 내리치고, 창은 찌르고, 활은 당겨 쏘고, 지팡이는 높이 들었다 겨눈다.

export const SWING_MS = 560

type Start = { at: number; fam: string }
const starts = new Map<string, Start>() // 이름 → 시작 시각 (performance.now) + 무기 종류

export function startSwing(name: string, delayMs = 0, fam?: string | null) {
  starts.set(name, { at: performance.now() + delayMs, fam: fam ?? 'sword' })
}

const ease = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3)
const lerp = (a: number, b: number, k: number) => a + (b - a) * k

export type SwingPose = { arm: number; armL: number; lunge: number; lean: number; strike: number }

// 지금 이 이름의 캐릭터가 휘두르는 중이면 자세를 돌려준다 (아니면 null)
//  strike : 효과가 터지는 순간에 1 (칼 계열은 0.32~0.5, 활·지팡이·창은 아래 각 줄 참고)
export function swingPose(name: string): SwingPose | null {
  const s = starts.get(name)
  if (s == null) return null
  const t = (performance.now() - s.at) / SWING_MS
  if (t < 0) return null
  if (t >= 1) {
    starts.delete(name)
    return null
  }
  switch (s.fam) {
    case 'spear':
      return spearPose(t)
    case 'bow':
      return bowPose(t)
    case 'staff':
      return staffPose(t)
    default:
      return slashPose(t, s.fam === 'hammer' ? 1.25 : 1)
  }
}

//  0~0.32 : 팔을 뒤로 번쩍 (준비)   0.32~0.5 : 앞으로 내리친다   0.5~1 : 천천히 원래대로
function slashPose(t: number, heavy: number): SwingPose {
  let arm: number
  let lunge: number
  let lean: number
  if (t < 0.32) {
    const k = ease(t / 0.32)
    arm = -2.9 * k * (heavy > 1 ? 1.05 : 1)
    lunge = -0.08 * k
    lean = -0.16 * k * heavy
  } else if (t < 0.5) {
    const k = ease((t - 0.32) / 0.18)
    arm = -2.9 + (2.9 + 0.55) * k
    lunge = -0.08 + 0.62 * k
    lean = -0.16 * heavy + (0.52 + 0.16 * (heavy - 1)) * k
  } else {
    const k = ease((t - 0.5) / 0.5)
    arm = 0.55 * (1 - k)
    lunge = 0.54 * (1 - k)
    lean = 0.36 * (1 - k) * heavy
  }
  return { arm, armL: arm * -0.4, lunge, lean, strike: t >= 0.32 && t < 0.5 ? 1 : 0 }
}

//  0~0.3 : 창을 뒤로 빼고 몸을 낮춘다   0.3~0.44 : 앞으로 쭉 찌른다   0.44~1 : 거둔다
function spearPose(t: number): SwingPose {
  let arm: number
  let lunge: number
  let lean: number
  if (t < 0.3) {
    const k = ease(t / 0.3)
    arm = lerp(0, -1.05, k)
    lunge = -0.14 * k
    lean = 0.08 * k
  } else if (t < 0.44) {
    const k = ease((t - 0.3) / 0.14)
    arm = lerp(-1.05, -1.62, k)
    lunge = lerp(-0.14, 0.8, k)
    lean = lerp(0.08, 0.34, k)
  } else {
    const k = ease((t - 0.44) / 0.56)
    arm = lerp(-1.62, 0, k)
    lunge = lerp(0.8, 0, k)
    lean = lerp(0.34, 0, k)
  }
  return { arm, armL: -0.5 * Math.abs(arm) * 0.3, lunge, lean, strike: t >= 0.3 && t < 0.44 ? 1 : 0 }
}

//  0~0.36 : 활을 앞으로 들고 시위를 당긴다   0.36~0.46 : 놓는다 (살짝 뒤로 튕김)   나머지 : 내린다
function bowPose(t: number): SwingPose {
  let arm: number
  let armL: number
  let lunge: number
  let lean: number
  if (t < 0.36) {
    const k = ease(t / 0.36)
    arm = lerp(0, -1.52, k)
    armL = lerp(0, -0.55, k) // 시위 잡은 손이 뒤로
    lunge = 0
    lean = lerp(0, -0.08, k)
  } else if (t < 0.46) {
    const k = ease((t - 0.36) / 0.1)
    arm = -1.52
    armL = lerp(-0.55, 0.35, k) // 놓으면서 손이 튕겨 나온다
    lunge = lerp(0, -0.1, k)
    lean = lerp(-0.08, 0.04, k)
  } else {
    const k = ease((t - 0.46) / 0.54)
    arm = lerp(-1.52, 0, k)
    armL = lerp(0.35, 0, k)
    lunge = lerp(-0.1, 0, k)
    lean = lerp(0.04, 0, k)
  }
  return { arm, armL, lunge, lean, strike: t >= 0.36 && t < 0.46 ? 1 : 0 }
}

//  0~0.38 : 지팡이를 머리 위로 번쩍   0.38~0.5 : 앞으로 겨눈다   나머지 : 내린다
function staffPose(t: number): SwingPose {
  let arm: number
  let lunge: number
  let lean: number
  if (t < 0.38) {
    const k = ease(t / 0.38)
    arm = lerp(0, -2.75, k)
    lunge = 0
    lean = lerp(0, -0.12, k)
  } else if (t < 0.5) {
    const k = ease((t - 0.38) / 0.12)
    arm = lerp(-2.75, -1.45, k)
    lunge = lerp(0, 0.18, k)
    lean = lerp(-0.12, 0.24, k)
  } else {
    const k = ease((t - 0.5) / 0.5)
    arm = lerp(-1.45, 0, k)
    lunge = lerp(0.18, 0, k)
    lean = lerp(0.24, 0, k)
  }
  return { arm, armL: arm * -0.35, lunge, lean, strike: t >= 0.38 && t < 0.5 ? 1 : 0 }
}

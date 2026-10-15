// 보스 연출에서 3D 부품들이 함께 읽는 값 (React 상태가 아니라 매 프레임 읽는 값이라 밖에 둔다)
// 시각은 모두 performance.now()/1000 (초).

export const bossFx = {
  hitAt: -99, // 보스가 맞은 시각
  atkAt: -99, // 보스가 공격한 시각 (오답·시간 초과)
  deadAt: -99, // 보스가 쓰러지기 시작한 시각
  introAt: -99, // 등장 연출 시작
  dmg: 0,
}

export const resetBossFx = () => {
  bossFx.hitAt = bossFx.atkAt = bossFx.deadAt = bossFx.introAt = -99
  bossFx.dmg = 0
}

// 화면 흔들림 (CameraRig 가 읽는다). 0~1, 저절로 줄어든다.
export const camShake = { amp: 0 }

export const nowSec = () => performance.now() / 1000
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x))

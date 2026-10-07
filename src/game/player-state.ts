import * as THREE from 'three'

// 캐릭터의 현재 위치 — Player가 매 프레임 쓰고, CameraRig가 읽는다.
// 시작 위치: 마을 한가운데 집 바로 앞.
export const playerPos = new THREE.Vector3(0, 0, 3)

// 내 캐릭터의 움직임 — 같이 걷기(live.ts)가 친구들에게 보낼 때 읽는다.
export const playerMotion = { vx: 0, vz: 0, vy: 0, facing: Math.PI }

// 친구 마을에 들어갈 때 겹치지 않게 조금씩 다른 곳에서 시작
export const spawnAt = () => playerPos.set((Math.random() - 0.5) * 2.4, 0, 3 + Math.random() * 0.8)

import * as THREE from 'three'

// 캐릭터의 현재 위치 — Player가 매 프레임 쓰고, CameraRig가 읽는다.
// 시작 위치: 마을 한가운데 집 바로 앞.
export const playerPos = new THREE.Vector3(0, 0, 3)

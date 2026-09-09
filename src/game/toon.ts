import * as THREE from 'three'

// 3단계 툰 그라디언트 — 부드러운 셀 셰이딩 (동물의 숲 느낌)
const steps = new Uint8Array([72, 150, 235, 255])
export const toonGradient = new THREE.DataTexture(steps, steps.length, 1, THREE.RedFormat)
toonGradient.needsUpdate = true
toonGradient.minFilter = THREE.NearestFilter
toonGradient.magFilter = THREE.NearestFilter

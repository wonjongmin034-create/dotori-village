// 광장의 모양(자리) 데이터 — 화면 그리기(PlazaScene)와 부딪힘(plaza.ts)이 같이 쓴다. 다른 파일을 불러오지 않는다.

export const PLAZA_RADIUS = 24 // 갈 수 있는 땅의 반지름
export const GATE_Z = 23.2 // 남쪽 입구의 위치
export const PAVING_R = 10.6 // 돌바닥 바깥 반지름

type Ring = { x: number; z: number; a: number }
const ring = (n: number, r: number, off = 0): Ring[] =>
  Array.from({ length: n }, (_, i) => {
    const a = off + (i / n) * Math.PI * 2
    return { x: Math.sin(a) * r, z: Math.cos(a) * r, a }
  })

export const FOUNTAIN = { x: 0, z: 0, r: 3.1, scale: 1.25 }
// 오목 테이블 4개: 분수 둘레 네 대각선에 놓는다. 테이블 가운데(x,z), 양옆에 앉는 자리 2개가 있다.
export const OMOK_TABLES = ring(4, 6.9, Math.PI / 4).map((p, i) => ({ id: i, x: p.x, z: p.z }))
// 분수를 바라보는 의자 (오목 테이블이 있는 대각선 자리는 비운다)
export const BENCHES = ring(12, 8.4, Math.PI / 12).filter((b) => {
  const deg = ((b.a * 180) / Math.PI + 360) % 360
  const k = (((deg - 45) % 90) + 90) % 90
  return k > 6 && k < 84
})
export const LAMPS = ring(12, 9.8, 0)
export const BEDS = ring(8, 13.8, Math.PI / 8).map((p) => ({ ...p, r: 1.5 })) // 꽃밭
export const BOARD_SIGN = { x: -2.9, z: 12.3 } // 오목 순위판
export const STAGE = { x: 0, z: -20.4, w: 10.4, d: 4.4 } // 북쪽 무대

// 나무: 가장자리 둥글게 (무대 앞·입구 앞은 비운다)
export const TREES = [
  ...ring(34, 21.9, 0.05).filter((p) => !(Math.abs(p.x) < 7.6 && p.z < -15.5) && !(Math.abs(p.x) < 4.6 && p.z > 19)),
]

// 네 모퉁이의 놀거리: 연못, 정자, 놀이터(그네·시소), 소풍 자리
export type Feature = { id: string; kind: 'pond' | 'gazebo' | 'playground' | 'picnic'; x: number; z: number; r: number }
export const FEATURES: Feature[] = [
  { id: 'pond', kind: 'pond', x: -13.0, z: -12.6, r: 3.0 },
  { id: 'gazebo', kind: 'gazebo', x: 13.0, z: -12.6, r: 2.3 },
  { id: 'playground', kind: 'playground', x: -13.2, z: 12.6, r: 2.6 },
  { id: 'picnic', kind: 'picnic', x: 13.2, z: 12.6, r: 1.7 },
]

// 정자 기둥 6개
const GAZEBO = FEATURES.find((f) => f.kind === 'gazebo')!
export const GAZEBO_POSTS = ring(6, GAZEBO.r * 0.88, Math.PI / 6).map((p) => ({ x: GAZEBO.x + p.x, z: GAZEBO.z + p.z }))

// 숨을 수 있는 곳 (나중에 숨바꼭질을 만들 때 그대로 쓴다)
export type Hideout = { id: string; kind: 'bush' | 'tent' | 'barrel'; x: number; z: number; r: number }
export const HIDEOUTS: Hideout[] = [
  ...[...ring(8, 17.6, Math.PI / 8), ...ring(4, 11.8, Math.PI / 4)].map(
    (p, i): Hideout => ({ id: `bush${i + 1}`, kind: 'bush', x: p.x, z: p.z, r: 0.95 }),
  ),
  { id: 'tent1', kind: 'tent', x: -19.4, z: 2.6, r: 1.35 },
  { id: 'tent2', kind: 'tent', x: 19.4, z: 2.6, r: 1.35 },
  { id: 'tent3', kind: 'tent', x: -17.6, z: -9.0, r: 1.35 },
  { id: 'tent4', kind: 'tent', x: 17.6, z: -9.0, r: 1.35 },
  { id: 'barrel1', kind: 'barrel', x: -8.4, z: 18.4, r: 0.5 },
  { id: 'barrel2', kind: 'barrel', x: -7.4, z: 19.3, r: 0.5 },
  { id: 'barrel3', kind: 'barrel', x: -9.2, z: 17.4, r: 0.5 },
  { id: 'barrel4', kind: 'barrel', x: 8.4, z: 18.4, r: 0.5 },
  { id: 'barrel5', kind: 'barrel', x: 7.4, z: 19.3, r: 0.5 },
  { id: 'barrel6', kind: 'barrel', x: 9.2, z: 17.4, r: 0.5 },
]

// 지나갈 수 없는 동그라미들: [x, z, 반지름]
export const COLLIDERS: [number, number, number][] = [
  [FOUNTAIN.x, FOUNTAIN.z, FOUNTAIN.r],
  ...BEDS.map((b): [number, number, number] => [b.x, b.z, b.r]),
  ...LAMPS.map((l): [number, number, number] => [l.x, l.z, 0.22]),
  ...TREES.map((t): [number, number, number] => [t.x, t.z, 0.55]),
  ...HIDEOUTS.map((h): [number, number, number] => [h.x, h.z, h.r]),
  ...OMOK_TABLES.map((t): [number, number, number] => [t.x, t.z, 1.05]),
  [BOARD_SIGN.x, BOARD_SIGN.z, 0.55],
  // 연못은 막고, 정자는 기둥만 막는다 (놀이터·소풍 자리는 걸어서 지나갈 수 있다)
  ...FEATURES.filter((f) => f.kind === 'pond').map((f): [number, number, number] => [f.x, f.z, f.r * 0.9]),
  ...GAZEBO_POSTS.map((p): [number, number, number] => [p.x, p.z, 0.2]),
]

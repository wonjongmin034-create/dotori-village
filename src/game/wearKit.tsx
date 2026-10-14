import * as THREE from 'three'
import { toonGradient } from './toon'

// 옷·모자·코스튬 모델이 같이 쓰는 재료와 도형

export const WHITE = '#f4f4f4'

export function Toon({
  color,
  emissive,
  ei = 0.4,
  opacity,
}: {
  color: string
  emissive?: string
  ei?: number
  opacity?: number
}) {
  return (
    <meshToonMaterial
      gradientMap={toonGradient}
      color={color}
      emissive={emissive ?? '#000000'}
      emissiveIntensity={emissive ? ei : 0}
      transparent={opacity !== undefined && opacity < 1}
      opacity={opacity ?? 1}
    />
  )
}

export function Glow({ color }: { color: string }) {
  return <meshBasicMaterial color={color} />
}

// ── 별·하트 (납작하게 뽑아낸 도형) ──
function starShape(n = 5, inner = 0.45) {
  const s = new THREE.Shape()
  for (let i = 0; i < n * 2; i++) {
    const a = Math.PI / 2 + (i * Math.PI) / n
    const r = i % 2 ? inner : 1
    const x = Math.cos(a) * r
    const y = Math.sin(a) * r
    if (i === 0) s.moveTo(x, y)
    else s.lineTo(x, y)
  }
  s.closePath()
  return s
}
function heartShape() {
  const s = new THREE.Shape()
  s.moveTo(0, -0.9)
  s.bezierCurveTo(-1.35, 0.1, -0.7, 1.0, 0, 0.35)
  s.bezierCurveTo(0.7, 1.0, 1.35, 0.1, 0, -0.9)
  return s
}
// 박쥐 날개 (한쪽, +x 방향으로 펼침)
function wingShape() {
  const s = new THREE.Shape()
  s.moveTo(0, 0)
  s.lineTo(0.5, 0.75)
  s.quadraticCurveTo(0.7, 0.5, 0.9, 0.62)
  s.quadraticCurveTo(1.0, 0.28, 1.25, 0.3)
  s.quadraticCurveTo(1.1, -0.1, 1.3, -0.35)
  s.quadraticCurveTo(0.8, -0.2, 0.6, -0.6)
  s.quadraticCurveTo(0.4, -0.25, 0, -0.2)
  s.closePath()
  return s
}

// 속이 빈 도형(안경테용): 바깥 모양에서 같은 모양을 줄여 구멍을 낸다
function withHole(outer: THREE.Shape, make: () => THREE.Shape, k: number) {
  const hole = make()
  const pts = hole.getPoints(24).map((p) => new THREE.Vector2(p.x * k, p.y * k + (k < 1 ? 0.02 : 0)))
  outer.holes.push(new THREE.Path(pts.reverse()))
  return outer
}

// 도끼날: 손잡이 쪽은 좁고 바깥쪽 날은 둥글게 퍼진다 (+x 방향)
function axeShape() {
  const s = new THREE.Shape()
  s.moveTo(0, 0.14)
  s.lineTo(0.12, 0.2)
  s.quadraticCurveTo(0.3, 0.36, 0.42, 0.34)
  s.quadraticCurveTo(0.5, 0.1, 0.46, 0)
  s.quadraticCurveTo(0.5, -0.1, 0.42, -0.34)
  s.quadraticCurveTo(0.3, -0.36, 0.12, -0.2)
  s.lineTo(0, -0.14)
  s.closePath()
  return s
}

export type ShapeKind = 'star' | 'heart' | 'wing' | 'starring' | 'heartring' | 'axehead'

const geoCache = new Map<string, THREE.BufferGeometry>()
function geo(kind: ShapeKind, depth: number): THREE.BufferGeometry {
  const key = `${kind}:${depth}`
  let g = geoCache.get(key)
  if (!g) {
    let shape: THREE.Shape
    if (kind === 'star') shape = starShape()
    else if (kind === 'heart') shape = heartShape()
    else if (kind === 'wing') shape = wingShape()
    else if (kind === 'axehead') shape = axeShape()
    else if (kind === 'starring') shape = withHole(starShape(), starShape, 0.55)
    else shape = withHole(heartShape(), heartShape, 0.6)
    g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 10 })
    g.translate(0, 0, -depth / 2)
    geoCache.set(key, g)
  }
  return g
}

export function Shaped({
  kind,
  size,
  depth = 0.03,
  color,
  position,
  rotation,
  glow,
  scale,
  opacity,
}: {
  kind: ShapeKind
  size: number
  depth?: number
  color: string
  position?: [number, number, number]
  rotation?: [number, number, number]
  glow?: boolean
  scale?: [number, number, number]
  opacity?: number
}) {
  const sc: [number, number, number] = scale ?? [1, 1, 1]
  return (
    <mesh
      geometry={geo(kind, depth / size)}
      position={position}
      rotation={rotation}
      scale={[size * sc[0], size * sc[1], size * sc[2]]}
    >
      {glow ? <Glow color={color} /> : <Toon color={color} opacity={opacity} />}
    </mesh>
  )
}

// 머리 위를 덮는 반구 (머리카락·모자 밑판)
export function Dome({
  color,
  r = 0.5,
  y = 0.14,
  z = -0.06,
  cover = 0.52,
  scale = [1.05, 0.9, 1.05],
}: {
  color: string
  r?: number
  y?: number
  z?: number
  cover?: number
  scale?: [number, number, number]
}) {
  return (
    <mesh position={[0, y, z]} scale={scale}>
      <sphereGeometry args={[r, 22, 16, 0, Math.PI * 2, 0, Math.PI * cover]} />
      <Toon color={color} />
    </mesh>
  )
}

// 기본 짧은 머리 바탕 (뒤통수까지)
export function HairBase({ color }: { color: string }) {
  return (
    <>
      <Dome color={color} />
      <mesh position={[0, 0.02, -0.1]} scale={[1.05, 1, 0.9]}>
        <sphereGeometry args={[0.5, 22, 16, Math.PI * 0.35, Math.PI * 1.3, 0, Math.PI * 0.72]} />
        <Toon color={color} />
      </mesh>
    </>
  )
}

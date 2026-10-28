import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Instance, Instances } from '@react-three/drei'
import * as THREE from 'three'
import { useGfx } from './gfx'

// 하늘: 지금 시각에 맞춰 색이 바뀌는 그라데이션 하늘 + 해(또는 달) + 별 + 둥실둥실 떠가는 구름.
// 학교 시간(낮)에는 늘 밝고 쾌청하고, 아침·저녁에는 따뜻한 빛이 돌며, 밤에는 어두워도 놀 수 있을 만큼은 밝다.

type Stop = { h: number; top: string; mid: string; hor: string; sun: string; key: number; hemi: number; fog: string }
const STOPS: Stop[] = [
  { h: 0, top: '#1d2755', mid: '#2c3b78', hor: '#4a5a98', sun: '#aab8ff', key: 0.5, hemi: 0.55, fog: '#3c4a86' },
  { h: 5.5, top: '#2a3a78', mid: '#6a78b8', hor: '#f0a890', sun: '#ffb98a', key: 0.7, hemi: 0.6, fog: '#c8a0a8' },
  { h: 7.5, top: '#5a9ee8', mid: '#9ccdf5', hor: '#ffe0b8', sun: '#ffe3b0', key: 1.05, hemi: 0.68, fog: '#ddeaf0' },
  { h: 11, top: '#3f98f0', mid: '#8fd0fa', hor: '#d9f1ff', sun: '#fff4dc', key: 1.2, hemi: 0.7, fog: '#cdeaf3' },
  { h: 15.5, top: '#4a9ced', mid: '#95cff6', hor: '#e2f1ff', sun: '#fff0d0', key: 1.15, hemi: 0.68, fog: '#d3e9f2' },
  { h: 18, top: '#5a86d8', mid: '#e8b8a0', hor: '#ffb27a', sun: '#ffc080', key: 0.95, hemi: 0.62, fog: '#f0c8a8' },
  { h: 19.8, top: '#3a3f88', mid: '#8a6aa8', hor: '#ff8a6a', sun: '#ff9a70', key: 0.7, hemi: 0.55, fog: '#b890a0' },
  { h: 21.5, top: '#202a62', mid: '#33427f', hor: '#56609e', sun: '#aab8ff', key: 0.52, hemi: 0.55, fog: '#3c4a86' },
  { h: 24, top: '#1d2755', mid: '#2c3b78', hor: '#4a5a98', sun: '#aab8ff', key: 0.5, hemi: 0.55, fog: '#3c4a86' },
]

export type SkyState = { top: THREE.Color; mid: THREE.Color; hor: THREE.Color; sun: THREE.Color; fog: THREE.Color; key: number; hemi: number; night: number; hour: number }

const c = (hex: string) => new THREE.Color(hex)
const cache = STOPS.map((s) => ({ ...s, top: c(s.top), mid: c(s.mid), hor: c(s.hor), sun: c(s.sun), fog: c(s.fog) }))

export function skyAt(hour: number): SkyState {
  const h = ((hour % 24) + 24) % 24
  let i = 0
  while (i < cache.length - 2 && h >= cache[i + 1].h) i++
  const a = cache[i]
  const b = cache[i + 1]
  const k = Math.min(1, Math.max(0, (h - a.h) / (b.h - a.h)))
  const mix = (x: THREE.Color, y: THREE.Color) => x.clone().lerp(y, k)
  const night = h < 5 || h > 21.5 ? 1 : h < 6.5 ? 1 - (h - 5) / 1.5 : h > 20 ? (h - 20) / 1.5 : 0
  return { top: mix(a.top, b.top), mid: mix(a.mid, b.mid), hor: mix(a.hor, b.hor), sun: mix(a.sun, b.sun), fog: mix(a.fog, b.fog), key: a.key + (b.key - a.key) * k, hemi: a.hemi + (b.hemi - a.hemi) * k, night, hour: h }
}

// 해는 동쪽(+x)에서 떠서 정오에 가장 높고 서쪽(−x)으로 진다. 밤에는 달이 같은 길을 간다.
export function sunDirAt(sky: SkyState): THREE.Vector3 {
  const day = sky.night > 0.5 ? (sky.hour + 12) % 24 : sky.hour
  const t = Math.min(1, Math.max(0, (day - 6) / 12))
  const ang = Math.PI * t
  return new THREE.Vector3(Math.cos(ang), Math.max(0.22, Math.sin(ang)), -0.45).normalize()
}

// 물·안개처럼 하늘 색을 따라가야 하는 곳이 읽는 현재 값 (Scene이 갱신한다)
export const skyLive = { fog: new THREE.Color('#cdeaf3'), light: 1, night: 0 }

// 지금 시각 (기기 시계). ?hour=18 처럼 주소에 붙이면 그 시각으로 미리 볼 수 있다.
export function nowHour(): number {
  try {
    const q = new URLSearchParams(location.search).get('hour')
    if (q != null && q !== '' && Number.isFinite(Number(q))) return Number(q)
  } catch {
    /* noop */
  }
  const d = new Date()
  return d.getHours() + d.getMinutes() / 60
}

const skyVert = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`
const skyFrag = /* glsl */ `
uniform vec3 uTop; uniform vec3 uMid; uniform vec3 uHor; uniform vec3 uSun; uniform vec3 uSunDir;
varying vec3 vDir;
void main() {
  float y = clamp(vDir.y, -0.2, 1.0);
  vec3 col = mix(uHor, uMid, smoothstep(0.0, 0.32, y));
  col = mix(col, uTop, smoothstep(0.25, 0.9, y));
  // 해 둘레의 은은한 빛무리
  float s = max(dot(normalize(vDir), normalize(uSunDir)), 0.0);
  col += uSun * (pow(s, 24.0) * 0.55 + pow(s, 400.0) * 1.4);
  // 땅 쪽은 수평선 색으로 이어 붙인다
  col = mix(col, uHor, smoothstep(0.0, -0.2, vDir.y));
  gl_FragColor = vec4(col, 1.0);
}`

export function SkyDome({ sky }: { sky: SkyState }) {
  const uniforms = useMemo(
    () => ({ uTop: { value: new THREE.Color() }, uMid: { value: new THREE.Color() }, uHor: { value: new THREE.Color() }, uSun: { value: new THREE.Color() }, uSunDir: { value: new THREE.Vector3(0.5, 0.6, -0.5) } }),
    [],
  )
  const root = useRef<THREE.Group>(null)
  useEffect(() => {
    uniforms.uTop.value.copy(sky.top)
    uniforms.uMid.value.copy(sky.mid)
    uniforms.uHor.value.copy(sky.hor)
    uniforms.uSun.value.copy(sky.sun)
    uniforms.uSunDir.value.copy(sunDirAt(sky))
  }, [sky, uniforms])
  // 하늘은 카메라를 따라다닌다 (끝이 보이지 않게)
  useFrame((s) => root.current?.position.copy(s.camera.position))
  const stars = useMemo(() => {
    let a = 12345
    const rnd = () => ((a = (a * 1664525 + 1013904223) >>> 0) / 4294967296)
    const arr = new Float32Array(160 * 3)
    for (let i = 0; i < 160; i++) {
      const th = rnd() * Math.PI * 2
      const ph = Math.acos(0.15 + rnd() * 0.85)
      arr[i * 3] = Math.sin(ph) * Math.cos(th) * 170
      arr[i * 3 + 1] = Math.cos(ph) * 170
      arr[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * 170
    }
    return arr
  }, [])
  return (
    <group ref={root}>
      <mesh renderOrder={-10}>
        <sphereGeometry args={[200, 24, 16]} />
        <shaderMaterial vertexShader={skyVert} fragmentShader={skyFrag} uniforms={uniforms} side={THREE.BackSide} depthWrite={false} fog={false} />
      </mesh>
      {sky.night > 0.15 && (
        <points renderOrder={-9}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[stars, 3]} />
          </bufferGeometry>
          <pointsMaterial color="#ffffff" size={1.6} sizeAttenuation={false} transparent opacity={Math.min(1, sky.night)} depthWrite={false} fog={false} />
        </points>
      )}
    </group>
  )
}

/* ---------- 구름: 동글동글한 덩어리들이 천천히 흘러간다 ---------- */
type Puff = { x: number; y: number; z: number; s: number }
function makeClouds(n: number, seed: number): { puffs: Puff[]; speed: number }[] {
  let a = seed
  const rnd = () => ((a = (a * 1664525 + 1013904223) >>> 0) / 4294967296)
  return Array.from({ length: n }, () => {
    const cx = (rnd() - 0.5) * 220
    const cz = -40 - rnd() * 120
    const cy = 24 + rnd() * 20
    const k = 4 + Math.floor(rnd() * 3)
    const puffs = Array.from({ length: k }, (_, i) => ({ x: cx + (i - k / 2) * 4.2 + rnd() * 2, y: cy + rnd() * 2.2, z: cz + rnd() * 3, s: 4.6 + rnd() * 3.4 - Math.abs(i - k / 2) * 0.6 }))
    return { puffs, speed: 0.5 + rnd() * 0.7 }
  })
}

export function Clouds({ night }: { night: number }) {
  const level = useGfx((s) => s.level)
  const clouds = useMemo(() => makeClouds(level === 'high' ? 11 : 7, 99), [level])
  const total = clouds.reduce((a, c2) => a + c2.puffs.length, 0)
  const refs = useRef<(THREE.Group | null)[]>([])
  useFrame((_, dt) => {
    clouds.forEach((cl, i) => {
      const g = refs.current[i]
      if (!g) return
      g.position.x += cl.speed * Math.min(dt, 0.1)
      if (g.position.x > 130) g.position.x = -130
    })
  })
  const tint = night > 0.5 ? '#8a94c8' : '#ffffff'
  return (
    <>
      {clouds.map((cl, i) => (
        <group key={i} ref={(el) => void (refs.current[i] = el)}>
          <Instances limit={Math.max(total, 8)} range={cl.puffs.length}>
            <icosahedronGeometry args={[1, 1]} />
            <meshBasicMaterial color={tint} fog={false} transparent opacity={0.96} depthWrite={false} />
            {cl.puffs.map((p, j) => (
              <Instance key={j} position={[p.x, p.y, p.z]} scale={[p.s, p.s * 0.62, p.s * 0.9]} />
            ))}
          </Instances>
        </group>
      ))}
    </>
  )
}

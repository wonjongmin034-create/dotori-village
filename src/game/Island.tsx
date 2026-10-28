import { useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'
import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useVillage, landHalf, viewItems } from './store'
import { toonGradient } from './toon'
import { useGfx, type GfxLevel } from './gfx'
import { Water } from './Water'

/* ---------- 바람 ---------- */
// 풀·꽃·야자잎이 같은 시계로 살랑인다. 위치(instanceMatrix)마다 위상이 달라서 물결처럼 번진다.
const wind = { value: 0 }

function windToon(mode: 'blade' | 'head' | 'frond', amp: number) {
  const m = new THREE.MeshToonMaterial({ gradientMap: toonGradient })
  const weight =
    mode === 'blade'
      ? 'clamp((position.y + 0.16) / 0.32, 0.0, 1.0)'
      : mode === 'frond'
        ? 'clamp((position.y + 0.7) / 1.4, 0.0, 1.0)'
        : '1.0'
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uWind = wind
    sh.vertexShader =
      'uniform float uWind;\n' +
      sh.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        float ph = uWind * 1.7 + instanceMatrix[3].x * 0.8 + instanceMatrix[3].z * 0.6;
        float wgt = ${weight};
        transformed.x += sin(ph) * ${amp.toFixed(3)} * wgt;
        transformed.z += cos(ph * 0.8) * ${(amp * 0.6).toFixed(3)} * wgt;`,
      )
  }
  m.customProgramCacheKey = () => `wind-${mode}-${amp}`
  return m
}

/* ---------- 인스턴스 묶음 ---------- */
type Spot = { x: number; y: number; z: number; r?: number; s?: number; sy?: number; c?: string; m?: THREE.Matrix4 }

function Mass({ spots, children, limit }: { spots: Spot[]; children: ReactNode; limit: number }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const im = ref.current
    if (!im) return
    const o = new THREE.Object3D()
    const col = new THREE.Color()
    spots.forEach((p, i) => {
      if (p.m) im.setMatrixAt(i, p.m)
      else {
        o.position.set(p.x, p.y, p.z)
        o.rotation.set(0, p.r ?? 0, 0)
        const s = p.s ?? 1
        o.scale.set(s, p.sy ?? s, s)
        o.updateMatrix()
        im.setMatrixAt(i, o.matrix)
      }
      if (p.c) im.setColorAt(i, col.set(p.c))
    })
    im.count = spots.length
    im.instanceMatrix.needsUpdate = true
    if (im.instanceColor) im.instanceColor.needsUpdate = true
  }, [spots])
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, limit]} frustumCulled={false}>
      {children}
    </instancedMesh>
  )
}

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const GRASS_COLORS = ['#69bd58', '#7bcb67', '#5aa84f', '#86d179', '#9bdc7a']
const FLOWER_COLORS = ['#f2c14e', '#e8618c', '#8fb3f0', '#d38ee8', '#f7f2ff', '#ff9a6b']
const BUSH_COLORS = ['#4f9d4b', '#5aa84f', '#478f45']

// 단계별 장식 양: [풀 한계, 풀 밀도, 꽃 한계, 덤불 수, 야자수]
const DENSITY: Record<GfxLevel, { tuft: number; dens: number; flower: number; bush: number; palm: number }> = {
  high: { tuft: 520, dens: 2.4, flower: 70, bush: 14, palm: 8 },
  medium: { tuft: 260, dens: 1.3, flower: 40, bush: 8, palm: 5 },
  low: { tuft: 100, dens: 0.6, flower: 14, bush: 3, palm: 2 },
}

// 높이 → 야자수 잎/줄기용 행렬
const _m = new THREE.Matrix4()
const _q = new THREE.Quaternion()
const _e = new THREE.Euler()
const _v = new THREE.Vector3()
const _s = new THREE.Vector3()

function palmMatrices(half: number, n: number) {
  const rng = mulberry32(Math.round(half * 100) + 31)
  const ringIn = half + 0.15
  const ringOut = half + 1.15
  const trunks: Spot[] = []
  const fronds: Spot[] = []
  // 모래 둘레를 따라 고르게 흩뿌린다 (모서리 쪽을 먼저)
  const corners: [number, number][] = [
    [1, 1],
    [-1, 1],
    [1, -1],
    [-1, -1],
  ]
  for (let i = 0; i < n; i++) {
    let x: number
    let z: number
    if (i < 4) {
      const [cx, cz] = corners[i]
      x = cx * (ringOut - 0.2 - rng() * 0.2)
      z = cz * (ringOut - 0.2 - rng() * 0.2)
    } else {
      const side = (rng() * 4) | 0
      const t = (rng() * 2 - 1) * (half - 1)
      const r = ringIn + 0.35 + rng() * 0.5
      x = side < 2 ? t : side === 2 ? r : -r
      z = side < 2 ? (side === 0 ? r : -r) : t
    }
    const yaw = rng() * Math.PI * 2
    const lean = 0.18 + rng() * 0.2
    const sc = 0.85 + rng() * 0.45
    const base = -0.2
    // 줄기: 휘어지는 네 마디
    let px = 0
    let py = 0
    for (let k = 0; k < 4; k++) {
      const tilt = lean * (0.5 + k * 0.28)
      _e.set(0, yaw, -tilt, 'YXZ')
      _q.setFromEuler(_e)
      // 마디 중심: 누적 기울기를 따라 위로
      const seg = 0.5 * sc
      const ox = Math.sin(tilt) * seg * 0.5
      const oy = Math.cos(tilt) * seg * 0.5
      const lx = px + ox
      const ly = py + oy
      const wx = Math.cos(yaw) * lx
      const wz = -Math.sin(yaw) * lx
      _v.set(x + wx, base + ly, z + wz)
      _s.set(sc * (1 - k * 0.1), sc, sc * (1 - k * 0.1))
      _m.compose(_v, _q, _s)
      trunks.push({ x: 0, y: 0, z: 0, m: _m.clone() })
      px += Math.sin(tilt) * seg
      py += Math.cos(tilt) * seg
    }
    const topX = x + Math.cos(yaw) * px
    const topZ = z - Math.sin(yaw) * px
    const topY = base + py
    // 잎: 사방으로 늘어지는 일곱 장
    const count = 7
    for (let f = 0; f < count; f++) {
      const a = yaw + (f / count) * Math.PI * 2 + rng() * 0.3
      const droop = 1.25 + rng() * 0.35 // 클수록 많이 처진다
      _e.set(0, a, -(Math.PI / 2 + droop - 1.2), 'YXZ')
      _q.setFromEuler(_e)
      // 원뿔은 가운데가 중심이라, 뿌리가 줄기 끝에 닿도록 축 방향으로 반 길이만큼 민다
      _v.set(0, 0.7 * sc, 0).applyQuaternion(_q).add(_s.set(topX, topY + 0.1, topZ))
      _s.set(0.45 * sc, sc, 1.3 * sc)
      _m.compose(_v, _q, _s)
      fronds.push({ x: 0, y: 0, z: 0, m: _m.clone() })
    }
  }
  return { trunks, fronds }
}

/* ---------- 섬 위 장식 ---------- */
function Detail({ half }: { half: number }) {
  const level = useGfx((s) => s.level)
  const D = DENSITY[level]

  useFrame((s) => {
    wind.value = s.clock.elapsedTime
  })

  const bladeMat = useMemo(() => windToon('blade', 0.07), [])
  const headMat = useMemo(() => windToon('head', 0.05), [])
  const frondMat = useMemo(() => {
    const m = windToon('frond', 0.1)
    m.color.set('#58b05a')
    return m
  }, [])

  const { tufts, flowers, stems, pebbles, bushes, palms } = useMemo(() => {
    const rng = mulberry32(Math.round(half * 100) + 7)
    const b = half - 0.7
    const spot = () => [(rng() * 2 - 1) * b, (rng() * 2 - 1) * b] as [number, number]
    const tufts: Spot[] = Array.from({ length: Math.min(D.tuft, Math.round(half * half * D.dens)) }, () => {
      const [x, z] = spot()
      return { x, y: 0.13, z, r: rng() * Math.PI, s: 0.6 + rng() * 0.8, c: GRASS_COLORS[(rng() * GRASS_COLORS.length) | 0] }
    })
    const fl = Array.from({ length: Math.min(D.flower, Math.round(half * 3)) }, () => {
      const [x, z] = spot()
      return { x, z, c: FLOWER_COLORS[(rng() * FLOWER_COLORS.length) | 0], h: 0.22 + rng() * 0.1 }
    })
    const flowers: Spot[] = fl.map((f) => ({ x: f.x, y: f.h + 0.02, z: f.z, s: 1, c: f.c }))
    const stems: Spot[] = fl.map((f) => ({ x: f.x, y: f.h / 2, z: f.z, sy: f.h / 0.26, s: 1 }))
    const pebbles: Spot[] = Array.from({ length: Math.min(18, half + 4) }, () => {
      const [x, z] = spot()
      const s = 0.5 + rng() * 0.5
      return { x, y: 0.05, z, r: rng() * Math.PI, s, sy: s * 0.55 }
    })
    // 덤불: 섬 가장자리 안쪽에 둥글둥글
    const bushes: Spot[] = Array.from({ length: D.bush }, () => {
      const side = (rng() * 4) | 0
      const t = (rng() * 2 - 1) * (half - 0.8)
      const e = half - 0.45
      const x = side < 2 ? t : side === 2 ? e : -e
      const z = side < 2 ? (side === 0 ? e : -e) : t
      const s = 0.55 + rng() * 0.5
      return { x, y: 0.2 * s, z, r: rng() * 3, s, sy: s * 0.85, c: BUSH_COLORS[(rng() * BUSH_COLORS.length) | 0] }
    })
    const palms = palmMatrices(half, D.palm)
    return { tufts, flowers, stems, pebbles, bushes, palms }
  }, [half, D])

  return (
    <group>
      <Mass spots={tufts} limit={DENSITY.high.tuft}>
        <coneGeometry args={[0.085, 0.32, 4]} />
        <primitive object={bladeMat} attach="material" />
      </Mass>

      <Mass spots={stems} limit={DENSITY.high.flower}>
        <cylinderGeometry args={[0.015, 0.015, 0.26, 4]} />
        <meshToonMaterial gradientMap={toonGradient} color="#4c8a44" />
      </Mass>
      <Mass spots={flowers} limit={DENSITY.high.flower}>
        <icosahedronGeometry args={[0.075, 0]} />
        <primitive object={headMat} attach="material" />
      </Mass>

      <Mass spots={bushes} limit={DENSITY.high.bush}>
        <icosahedronGeometry args={[0.5, 1]} />
        <meshToonMaterial gradientMap={toonGradient} />
      </Mass>

      <Mass spots={pebbles} limit={24}>
        <dodecahedronGeometry args={[0.16, 0]} />
        <meshToonMaterial gradientMap={toonGradient} color="#b3b8bd" />
      </Mass>

      {/* 모래 위 야자수 */}
      <Mass spots={palms.trunks} limit={DENSITY.high.palm * 4}>
        <cylinderGeometry args={[0.1, 0.14, 0.5, 6]} />
        <meshToonMaterial gradientMap={toonGradient} color="#a8794a" />
      </Mass>
      <Mass spots={palms.fronds} limit={DENSITY.high.palm * 7}>
        <coneGeometry args={[0.2, 1.4, 4]} />
        <primitive object={frondMat} attach="material" />
      </Mass>
    </group>
  )
}

/* ---------- 섬 ---------- */
export function Island() {
  const half = useVillage((s) => landHalf(viewItems(s)))
  const w = half * 2
  const sandHalf = half + 1.3

  return (
    <group>
      <Water half={sandHalf} rounded={0.45} />

      {/* 바다 밑으로 이어지는 흙 단면 */}
      <mesh position={[0, -0.7, 0]} userData={{ noShadow: true }}>
        <boxGeometry args={[w + 2.2, 0.5, w + 2.2]} />
        <meshToonMaterial gradientMap={toonGradient} color="#b9946a" />
      </mesh>

      {/* 모래 테두리 */}
      <RoundedBox args={[w + 2.6, 0.45, w + 2.6]} radius={0.22} smoothness={3} position={[0, -0.42, 0]} receiveShadow>
        <meshToonMaterial gradientMap={toonGradient} color="#ecdcac" />
      </RoundedBox>

      {/* 잔디 (윗면 y=0) */}
      <RoundedBox args={[w, 0.55, w]} radius={0.18} smoothness={3} position={[0, -0.26, 0]} receiveShadow>
        <meshToonMaterial gradientMap={toonGradient} color="#79c556" />
      </RoundedBox>

      <Detail half={half} />
    </group>
  )
}

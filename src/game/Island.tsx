import { useMemo, useRef } from 'react'
import { Instance, Instances } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useVillage, landHalf } from './store'
import { toonGradient } from './toon'

/* ---------- 물 ---------- */
function Water() {
  const ref = useRef<THREE.MeshBasicMaterial>(null)
  useFrame((s) => {
    if (ref.current) {
      // 아주 은은하게 색이 출렁이도록
      ref.current.color.setHSL(0.52, 0.44, 0.52 + Math.sin(s.clock.elapsedTime * 0.5) * 0.03)
    }
  })
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
      <planeGeometry args={[600, 600]} />
      <meshBasicMaterial ref={ref} color="#4fb4c6" />
    </mesh>
  )
}

/* ---------- 잔디 위 디테일 ---------- */
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

const GRASS_COLORS = ['#69bd58', '#7bcb67', '#5aa84f', '#86d179']
const FLOWER_COLORS = ['#f2c14e', '#e8618c', '#8fb3f0', '#d38ee8', '#f7f2ff']

function Detail({ half }: { half: number }) {
  const { tufts, flowers, pebbles } = useMemo(() => {
    const rng = mulberry32(Math.round(half * 100) + 7)
    const b = half - 0.7
    const spot = () => [(rng() * 2 - 1) * b, (rng() * 2 - 1) * b] as [number, number]
    const tufts = Array.from({ length: Math.min(150, Math.round(half * half * 0.9)) }, () => {
      const [x, z] = spot()
      return {
        x,
        z,
        r: rng() * Math.PI,
        s: 0.6 + rng() * 0.7,
        c: GRASS_COLORS[(rng() * GRASS_COLORS.length) | 0],
      }
    })
    const flowers = Array.from({ length: Math.min(26, Math.round(half * 1.6)) }, () => {
      const [x, z] = spot()
      return { x, z, c: FLOWER_COLORS[(rng() * FLOWER_COLORS.length) | 0] }
    })
    const pebbles = Array.from({ length: Math.min(16, half) }, () => {
      const [x, z] = spot()
      return { x, z, r: rng() * Math.PI, s: 0.5 + rng() * 0.5 }
    })
    return { tufts, flowers, pebbles }
  }, [half])

  return (
    <group>
      <Instances limit={200} range={tufts.length}>
        <coneGeometry args={[0.085, 0.32, 4]} />
        <meshToonMaterial gradientMap={toonGradient} />
        {tufts.map((t, i) => (
          <Instance
            key={i}
            position={[t.x, 0.13, t.z]}
            rotation={[0, t.r, 0]}
            scale={[t.s, t.s, t.s]}
            color={t.c}
          />
        ))}
      </Instances>

      {flowers.map((f, i) => (
        <group key={i} position={[f.x, 0, f.z]}>
          <mesh position={[0, 0.13, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 0.26, 4]} />
            <meshToonMaterial gradientMap={toonGradient} color="#4c8a44" />
          </mesh>
          <mesh position={[0, 0.28, 0]}>
            <icosahedronGeometry args={[0.075, 0]} />
            <meshToonMaterial gradientMap={toonGradient} color={f.c} />
          </mesh>
        </group>
      ))}

      <Instances limit={20} range={pebbles.length}>
        <dodecahedronGeometry args={[0.16, 0]} />
        <meshToonMaterial gradientMap={toonGradient} color="#b3b8bd" />
        {pebbles.map((p, i) => (
          <Instance
            key={i}
            position={[p.x, 0.05, p.z]}
            rotation={[0.3, p.r, 0.1]}
            scale={[p.s, p.s * 0.55, p.s]}
          />
        ))}
      </Instances>
    </group>
  )
}

/* ---------- 섬 ---------- */
export function Island() {
  const half = useVillage((s) => landHalf(s.items))
  const w = half * 2

  return (
    <group>
      <Water />

      {/* 모래 테두리 */}
      <mesh position={[0, -0.42, 0]}>
        <boxGeometry args={[w + 2.6, 0.45, w + 2.6]} />
        <meshToonMaterial gradientMap={toonGradient} color="#ecdcac" />
      </mesh>

      {/* 잔디 (윗면 y=0) */}
      <mesh position={[0, -0.26, 0]}>
        <boxGeometry args={[w, 0.55, w]} />
        <meshToonMaterial gradientMap={toonGradient} color="#79c556" />
      </mesh>

      <Detail half={half} />
    </group>
  )
}

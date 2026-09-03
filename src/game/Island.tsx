import { useMemo } from 'react'
import { Instances, Instance } from '@react-three/drei'

// 씨앗 고정용 작은 난수 생성기 — 매번 같은 섬이 나오도록.
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

type Tree = { x: number; z: number; s: number; h: number }
type Rock = { x: number; z: number; s: number; r: number }

export function Island() {
  const trees = useMemo<Tree[]>(() => {
    const rng = mulberry32(20260903)
    const list: Tree[] = []
    let tries = 0
    while (list.length < 16 && tries < 500) {
      tries++
      const ang = rng() * Math.PI * 2
      const rad = 4 + rng() * 11
      const x = Math.cos(ang) * rad
      const z = Math.sin(ang) * rad
      if (Math.hypot(x, z) < 3.5) continue
      if (list.some((t) => Math.hypot(t.x - x, t.z - z) < 2.6)) continue
      list.push({ x, z, s: 0.85 + rng() * 0.6, h: rng() * 0.7 })
    }
    return list
  }, [])

  const rocks = useMemo<Rock[]>(() => {
    const rng = mulberry32(77)
    return Array.from({ length: 7 }, () => {
      const ang = rng() * Math.PI * 2
      const rad = 3 + rng() * 12
      return {
        x: Math.cos(ang) * rad,
        z: Math.sin(ang) * rad,
        s: 0.4 + rng() * 0.5,
        r: rng() * Math.PI,
      }
    })
  }, [])

  return (
    <group>
      {/* 물 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.35, 0]}>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial color="#57b6c8" />
      </mesh>

      {/* 모래 테두리 */}
      <mesh position={[0, -0.12, 0]}>
        <cylinderGeometry args={[20.5, 20.5, 0.4, 56]} />
        <meshStandardMaterial color="#ecdaa8" />
      </mesh>

      {/* 잔디 섬 */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[19, 19.8, 0.5, 56]} />
        <meshStandardMaterial color="#7cc25c" />
      </mesh>

      {/* 낮은 언덕 하나 */}
      <mesh position={[-5.5, 0.15, -4.5]}>
        <sphereGeometry args={[4.2, 22, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#84ca63" />
      </mesh>

      {/* 나무 기둥 (인스턴싱 — draw call 1) */}
      <Instances limit={40} range={40}>
        <cylinderGeometry args={[0.16, 0.22, 1.4, 6]} />
        <meshStandardMaterial color="#8a5a33" />
        {trees.map((t, i) => (
          <Instance key={i} position={[t.x, 0.85, t.z]} scale={[t.s, t.s + t.h, t.s]} />
        ))}
      </Instances>

      {/* 나무 잎 (인스턴싱 — draw call 1) */}
      <Instances limit={40} range={40}>
        <icosahedronGeometry args={[1.15, 0]} />
        <meshStandardMaterial color="#4f9e57" flatShading />
        {trees.map((t, i) => (
          <Instance key={i} position={[t.x, 2.0 + t.h * 1.4, t.z]} scale={t.s * 1.15} />
        ))}
      </Instances>

      {/* 바위 */}
      <Instances limit={20} range={20}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#9aa0a6" flatShading />
        {rocks.map((r, i) => (
          <Instance key={i} position={[r.x, 0.22, r.z]} scale={r.s} rotation={[0.25, r.r, 0.15]} />
        ))}
      </Instances>
    </group>
  )
}

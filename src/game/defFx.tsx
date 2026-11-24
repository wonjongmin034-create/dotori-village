import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ArrowModel } from './ArrowModel'
import { toonGradient } from './toon'
import type { TowerKind } from './defData'

// 수비대 공격 연출 — 탑이 쏠 때 번쩍 · 날아가며 꼬리 · 맞으면 터짐.
// 물체를 미리 만들어 두고(풀) 매 프레임 위치·크기·투명도만 바꾼다 (리렌더 없음).

type Shot = { kind: TowerKind; br: number; from: THREE.Vector3; to: THREE.Vector3; at: number; dur: number; splash: number; seed: number }
type Boom = { x: number; z: number; r: number; at: number }
type Heal = { x: number; z: number; at: number }
const shots: Shot[] = []
const booms: Boom[] = []
const heals: Heal[] = []

const IMPACT_MS = 420
const MUZZLE_MS = 180
const FLIGHT: Record<TowerKind, number> = { bow: 260, staff: 380, axe: 560, sword: 230, spear: 120, hammer: 60 }
export const FX_COLOR: Record<TowerKind, string> = { sword: '#8fd0ff', hammer: '#ffa24a', bow: '#ffe27a', staff: '#d8a8ff', axe: '#c9a46a', spear: '#fff4c8' }
const STAFF_COLOR = ['#d8a8ff', '#ff8a3a', '#8fe4ff']

export function pushShot(kind: TowerKind, br: number, from: THREE.Vector3, to: THREE.Vector3, splash: number) {
  shots.push({ kind, br, from, to, at: performance.now(), dur: FLIGHT[kind], splash, seed: Math.random() * 10 })
  while (shots.length > 90) shots.shift()
}
export function pushBoom(x: number, z: number, r: number) {
  booms.push({ x, z, r, at: performance.now() })
  while (booms.length > 24) booms.shift()
}
export function pushHeal(x: number, z: number) {
  heals.push({ x, z, at: performance.now() })
  while (heals.length > 24) heals.shift()
}

const colorOfShot = (s: Shot) => (s.kind === 'staff' ? (STAFF_COLOR[s.br] ?? STAFF_COLOR[0]) : s.kind === 'bow' && s.br === 2 ? '#9ff0ff' : FX_COLOR[s.kind])
const basic = (color: string, opacity = 1) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false })

function usePool<T extends THREE.Object3D>(n: number) {
  return useRef<(T | null)[]>(new Array(n).fill(null))
}
const setOp = (o: THREE.Object3D, op: number) => {
  o.traverse((c) => {
    const m = (c as THREE.Mesh).material as THREE.MeshBasicMaterial | undefined
    if (m && 'opacity' in m && m.transparent) m.opacity = op * ((m.userData.base as number | undefined) ?? 1)
  })
}
const setCol = (o: THREE.Object3D, color: string) => {
  o.traverse((c) => {
    const m = (c as THREE.Mesh).material as THREE.MeshBasicMaterial | undefined
    if (m && m.userData.tint) m.color.set(color)
  })
}

const v = new THREE.Vector3()
const w = new THREE.Vector3()

export function DefEffects() {
  const arrows = usePool<THREE.Group>(30)
  const orbs = usePool<THREE.Group>(24)
  const rocks = usePool<THREE.Group>(16)
  const waves = usePool<THREE.Group>(16)
  const spikes = usePool<THREE.Group>(14)
  const flashes = usePool<THREE.Mesh>(60)
  const sparks = usePool<THREE.Mesh>(120)
  const rings = usePool<THREE.Mesh>(40)
  const puffs = usePool<THREE.Mesh>(40)
  const pluses = usePool<THREE.Group>(24)

  const mk = useMemo(
    () => ({
      flash: () => {
        const m = basic('#ffffff', 0.9)
        m.userData.tint = true
        return m
      },
      tinted: (op: number) => {
        const m = basic('#ffffff', op)
        m.userData.tint = true
        m.userData.base = op
        return m
      },
    }),
    [],
  )

  useFrame(() => {
    const now = performance.now()
    const i = { arrow: 0, orb: 0, rock: 0, wave: 0, spike: 0, flash: 0, spark: 0, ring: 0, puff: 0, plus: 0 }
    const flash = (p: THREE.Vector3, color: string, age: number, size: number) => {
      const m = flashes.current[i.flash++]
      if (!m) return
      m.position.copy(p)
      m.scale.setScalar(size * 1.6 * (0.5 + age * 0.9))
      ;(m.material as THREE.MeshBasicMaterial).color.set(color)
      ;(m.material as THREE.MeshBasicMaterial).opacity = 0.85 * (1 - age)
      m.visible = true
    }
    const ring = (x: number, y: number, z: number, color: string, age: number, r: number) => {
      const m = rings.current[i.ring++]
      if (!m) return
      m.position.set(x, y, z)
      m.scale.setScalar(Math.max(0.35, r) * 1.25 * (0.25 + age * 0.9))
      ;(m.material as THREE.MeshBasicMaterial).color.set(color)
      ;(m.material as THREE.MeshBasicMaterial).opacity = 0.85 * (1 - age)
      m.visible = true
    }
    const burst = (p: THREE.Vector3, color: string, age: number, n: number, speed: number, seed: number) => {
      for (let k = 0; k < n; k++) {
        const m = sparks.current[i.spark++]
        if (!m) return
        const a = seed + (k / n) * Math.PI * 2
        const up = 0.6 + ((k * 37) % 10) / 10
        m.position.set(p.x + Math.cos(a) * speed * age, p.y + Math.sin(age * Math.PI) * up * 0.8, p.z + Math.sin(a) * speed * age)
        m.scale.setScalar(1.7 * (1 - age * 0.8))
        m.rotation.set(age * 8 + k, age * 6, 0)
        ;(m.material as THREE.MeshBasicMaterial).color.set(color)
        m.visible = true
      }
    }
    const puff = (x: number, z: number, age: number, r: number, color: string, n: number, seed: number) => {
      for (let k = 0; k < n; k++) {
        const m = puffs.current[i.puff++]
        if (!m) return
        const a = seed + (k / n) * Math.PI * 2
        m.position.set(x + Math.cos(a) * r * (0.3 + age * 0.7), 0.25 + age * 0.6, z + Math.sin(a) * r * (0.3 + age * 0.7))
        m.scale.setScalar(0.25 + age * 0.45)
        ;(m.material as THREE.MeshBasicMaterial).color.set(color)
        ;(m.material as THREE.MeshBasicMaterial).opacity = 0.7 * (1 - age)
        m.visible = true
      }
    }

    for (const s of shots) {
      const t = now - s.at
      const end = s.dur + IMPACT_MS
      if (t < 0 || t > end) continue
      const col = colorOfShot(s)
      // 쏠 때 번쩍
      if (t < MUZZLE_MS) flash(s.from, col, t / MUZZLE_MS, s.kind === 'axe' ? 0.55 : 0.42)
      const f = Math.min(1, t / s.dur)
      // 날아가는 모습
      if (t < s.dur) {
        if (s.kind === 'bow') {
          const g = arrows.current[i.arrow++]
          if (g) {
            v.lerpVectors(s.from, s.to, f)
            v.y += Math.sin(f * Math.PI) * 0.5
            w.lerpVectors(s.from, s.to, Math.min(1, f + 0.05))
            w.y += Math.sin(Math.min(1, f + 0.05) * Math.PI) * 0.5
            g.position.copy(v)
            g.lookAt(w)
            setCol(g, col)
            g.visible = true
          }
        } else if (s.kind === 'staff') {
          const g = orbs.current[i.orb++]
          if (g) {
            const e = f * f
            v.lerpVectors(s.from, s.to, e)
            v.y += Math.sin(f * Math.PI) * 0.3
            g.position.copy(v)
            // 꼬리: 뒤따르는 작은 구슬들
            g.children.forEach((c, k) => {
              if (k < 2) return
              const back = Math.max(0, e - k * 0.07)
              w.lerpVectors(s.from, s.to, back)
              w.y += Math.sin(back * Math.PI) * 0.3
              c.position.copy(w).sub(v)
            })
            g.rotation.set(0, 0, 0)
            setCol(g, col)
            g.visible = true
          }
        } else if (s.kind === 'axe') {
          const g = rocks.current[i.rock++]
          if (g) {
            v.lerpVectors(s.from, s.to, f)
            v.y += Math.sin(f * Math.PI) * 3.2
            g.position.copy(v)
            g.children[0].rotation.set(f * 12, f * 8, 0)
            g.children.forEach((c, k) => {
              if (k === 0) return
              const back = Math.max(0, f - k * 0.06)
              w.lerpVectors(s.from, s.to, back)
              w.y += Math.sin(back * Math.PI) * 3.2
              c.position.copy(w).sub(v)
              c.scale.setScalar(0.6 + k * 0.15)
            })
            setCol(g, s.br === 1 ? '#3a3a42' : '#a89a86')
            g.visible = true
          }
        } else if (s.kind === 'sword') {
          // 푸른 검기가 날아간다
          const g = waves.current[i.wave++]
          if (g) {
            v.lerpVectors(s.from, s.to, f)
            v.y = 0.7 + (1 - f) * 0.6
            g.position.copy(v)
            w.copy(s.to)
            w.y = v.y
            g.lookAt(w)
            g.scale.setScalar(0.8 + f * 0.5)
            setCol(g, col)
            setOp(g, 1)
            g.visible = true
          }
        } else if (s.kind === 'hammer') {
          ring(s.from.x, 0.15, s.from.z, col, f, 2.8)
        }
      }
      // 맞을 때
      if (t >= s.dur) {
        const a = (t - s.dur) / IMPACT_MS
        if (s.kind === 'staff') {
          flash(s.to, col, a, 0.6 + s.splash * 0.9)
          ring(s.to.x, 0.12, s.to.z, col, a, s.splash * 1.2)
          burst(s.to, col, a, 7, 1.4, s.seed)
        } else if (s.kind === 'axe') {
          ring(s.to.x, 0.1, s.to.z, '#e8d2a0', a, Math.max(1.1, s.splash * 1.3))
          puff(s.to.x, s.to.z, a, Math.max(0.8, s.splash), '#cdb48a', 6, s.seed)
          burst(s.to, '#8a7a62', a, 6, 1.8, s.seed)
        } else if (s.kind === 'spear') {
          const g = spikes.current[i.spike++]
          if (g) {
            g.position.set(s.to.x, 0, s.to.z)
            const up = a < 0.35 ? a / 0.35 : 1 - (a - 0.35) / 0.65
            g.scale.set(1, Math.max(0.01, up), 1)
            g.visible = true
          }
          ring(s.to.x, 0.08, s.to.z, '#fff4c8', a, 0.9)
          burst(s.to, '#ffffff', a, 4, 0.9, s.seed)
        } else if (s.kind === 'sword') {
          // X 자로 벤다
          for (let k = 0; k < 2; k++) {
            const g = waves.current[i.wave++]
            if (!g) break
            g.position.set(s.to.x, s.to.y + 0.3, s.to.z)
            g.rotation.set(-0.3, 0, (k ? 1 : -1) * 0.8 + a * 0.6)
            g.scale.setScalar(0.9 + a * 0.4)
            setCol(g, '#ffffff')
            setOp(g, 1 - a)
            g.visible = true
          }
          burst(s.to, col, a, 5, 1.2, s.seed)
          flash(s.to, '#ffffff', a, 0.5)
        } else if (s.kind === 'hammer') {
          burst(s.to, col, a, 4, 1.0, s.seed)
        } else {
          flash(s.to, col, a, 0.45)
          burst(s.to, col, a, 5, 1.1, s.seed)
        }
      }
    }
    for (const b of booms) {
      const a = (now - b.at) / 520
      if (a < 0 || a >= 1) continue
      ring(b.x, 0.15, b.z, '#ffb347', a, Math.max(1, b.r * 1.4))
      flash(v.set(b.x, 0.5, b.z), '#ffd27a', a, 0.8 + b.r * 0.5)
      puff(b.x, b.z, a, Math.max(0.7, b.r), '#9a8a7a', 5, b.at * 0.001)
      burst(v.set(b.x, 0.4, b.z), '#ff8a3a', a, 6, 2.0, b.at * 0.002)
    }
    for (const h of heals) {
      const a = (now - h.at) / 900
      if (a < 0 || a >= 1) continue
      for (let k = 0; k < 2; k++) {
        const g = pluses.current[i.plus++]
        if (!g) break
        g.position.set(h.x + (k ? 0.35 : -0.3), 1.2 + a * 1.4 + k * 0.2, h.z + 0.4)
        g.scale.setScalar(0.8 + Math.sin(a * Math.PI) * 0.4)
        setOp(g, 1 - a)
        g.visible = true
      }
    }

    const hide = (arr: (THREE.Object3D | null)[], from: number) => {
      for (let k = from; k < arr.length; k++) if (arr[k]) arr[k]!.visible = false
    }
    hide(arrows.current, i.arrow)
    hide(orbs.current, i.orb)
    hide(rocks.current, i.rock)
    hide(waves.current, i.wave)
    hide(spikes.current, i.spike)
    hide(flashes.current, i.flash)
    hide(sparks.current, i.spark)
    hide(rings.current, i.ring)
    hide(puffs.current, i.puff)
    hide(pluses.current, i.plus)
  })

  return (
    <group>
      {Array.from({ length: 30 }, (_, k) => (
        <group key={k} ref={(el) => void (arrows.current[k] = el)} visible={false}>
          <ArrowModel feather="#ff6a6a" len={1.1} scale={1.8} />
          {/* 빛 꼬리 */}
          <mesh position={[0, 0, -1.5]} rotation={[Math.PI / 2, 0, 0]} material={mk.tinted(0.7)}>
            <cylinderGeometry args={[0.13, 0.01, 2.2, 6]} />
          </mesh>
        </group>
      ))}
      {Array.from({ length: 24 }, (_, k) => (
        <group key={k} ref={(el) => void (orbs.current[k] = el)} visible={false}>
          <mesh material={mk.tinted(1)}>
            <sphereGeometry args={[0.32, 12, 10]} />
          </mesh>
          <mesh scale={2.1} material={mk.tinted(0.3)}>
            <sphereGeometry args={[0.32, 12, 10]} />
          </mesh>
          {[0, 1, 2, 3].map((t) => (
            <mesh key={t} scale={0.75 - t * 0.15} material={mk.tinted(0.55 - t * 0.1)}>
              <sphereGeometry args={[0.28, 8, 6]} />
            </mesh>
          ))}
        </group>
      ))}
      {Array.from({ length: 16 }, (_, k) => (
        <group key={k} ref={(el) => void (rocks.current[k] = el)} visible={false}>
          <mesh>
            <dodecahedronGeometry args={[0.48, 0]} />
            <meshToonMaterial gradientMap={toonGradient} color="#a89a86" userData={{ tint: true }} />
          </mesh>
          {[0, 1, 2].map((t) => (
            <mesh key={t} material={basic('#d8c8a8', 0.4 - t * 0.1)}>
              <sphereGeometry args={[0.2, 8, 6]} />
            </mesh>
          ))}
        </group>
      ))}
      {Array.from({ length: 16 }, (_, k) => (
        <group key={k} ref={(el) => void (waves.current[k] = el)} visible={false}>
          <mesh rotation={[0, 0, 0]} material={mk.tinted(0.9)}>
            <torusGeometry args={[0.95, 0.13, 6, 24, Math.PI]} />
          </mesh>
          <mesh rotation={[0, 0, 0]} scale={1.15} material={mk.tinted(0.35)}>
            <torusGeometry args={[0.95, 0.24, 6, 24, Math.PI]} />
          </mesh>
        </group>
      ))}
      {Array.from({ length: 14 }, (_, k) => (
        <group key={k} ref={(el) => void (spikes.current[k] = el)} visible={false}>
          {[0, 1, 2].map((t) => {
            const a = (t / 3) * Math.PI * 2
            return (
              <mesh key={t} position={[Math.cos(a) * 0.35, 0.75, Math.sin(a) * 0.35]} rotation={[Math.sin(a) * 0.25, 0, -Math.cos(a) * 0.25]}>
                <coneGeometry args={[0.16, 1.5, 5]} />
                <meshToonMaterial gradientMap={toonGradient} color="#e8eef5" />
              </mesh>
            )
          })}
        </group>
      ))}
      {Array.from({ length: 60 }, (_, k) => (
        <mesh key={k} ref={(el) => void (flashes.current[k] = el)} visible={false} material={mk.flash()}>
          <sphereGeometry args={[0.5, 12, 8]} />
        </mesh>
      ))}
      {Array.from({ length: 120 }, (_, k) => (
        <mesh key={k} ref={(el) => void (sparks.current[k] = el)} visible={false} material={basic('#ffffff', 1)}>
          <octahedronGeometry args={[0.09]} />
        </mesh>
      ))}
      {Array.from({ length: 40 }, (_, k) => (
        <mesh key={k} ref={(el) => void (rings.current[k] = el)} rotation={[-Math.PI / 2, 0, 0]} visible={false} material={basic('#ffffff', 0.8)}>
          <ringGeometry args={[0.72, 1, 32]} />
        </mesh>
      ))}
      {Array.from({ length: 40 }, (_, k) => (
        <mesh key={k} ref={(el) => void (puffs.current[k] = el)} visible={false} material={basic('#cdb48a', 0.6)}>
          <sphereGeometry args={[0.5, 8, 6]} />
        </mesh>
      ))}
      {Array.from({ length: 24 }, (_, k) => (
        <group key={k} ref={(el) => void (pluses.current[k] = el)} visible={false}>
          <mesh material={basic('#5ee36a', 1)}>
            <boxGeometry args={[0.42, 0.13, 0.13]} />
          </mesh>
          <mesh material={basic('#5ee36a', 1)}>
            <boxGeometry args={[0.13, 0.42, 0.13]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

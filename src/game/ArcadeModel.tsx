import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useVillage } from './store'

/* ---------- 레벨별 도토리 겉모습 ---------- */
function acornStyle(lv: number) {
  const t = Math.min(1, lv / 10)
  const shell =
    lv >= 8 ? '#ffe9a8' : lv >= 5 ? '#f2c14e' : lv >= 3 ? '#cf9a52' : '#8a5a33'
  const cap = lv >= 8 ? '#e6ad4e' : lv >= 5 ? '#b9822e' : '#6f4726'
  const emissive =
    lv >= 8 ? '#ffcf6a' : lv >= 5 ? '#ffb43a' : lv >= 3 ? '#7a4a1f' : '#000000'
  const emissiveIntensity = lv >= 3 ? Math.min(1.3, (lv - 2) * 0.22) : 0
  const scale = 1 + t * 0.6
  const sparks = lv >= 4 ? Math.min(10, lv - 2) : 0
  return { shell, cap, emissive, emissiveIntensity, scale, sparks, aura: lv >= 7, crown: lv >= 9 }
}

function Acorn({
  level,
  shakeRef,
  popRef,
}: {
  level: number
  shakeRef: React.MutableRefObject<number>
  popRef: React.MutableRefObject<number>
}) {
  const g = useRef<THREE.Group>(null)
  const s = useMemo(() => acornStyle(level), [level])
  const sparkRefs = useRef<THREE.Mesh[]>([])

  useFrame((state, dt) => {
    const time = state.clock.elapsedTime
    const shake = shakeRef.current
    popRef.current = Math.max(0, popRef.current - dt * 3)
    if (g.current) {
      g.current.rotation.y = time * 0.6 + (shake > 0 ? Math.sin(time * 60) * shake * 0.5 : 0)
      g.current.position.y =
        1.85 + Math.sin(time * 1.6) * 0.06 + (shake > 0 ? Math.sin(time * 70) * shake * 0.12 : 0)
      g.current.scale.setScalar(s.scale * (1 + popRef.current * 0.45))
    }
    if (shakeRef.current > 0) shakeRef.current = Math.max(0, shakeRef.current - dt * 1.5)
    // 궤도 반짝이
    sparkRefs.current.forEach((m, i) => {
      if (!m) return
      const a = time * 2 + (i / Math.max(1, s.sparks)) * Math.PI * 2
      const r = 0.55 + Math.sin(time * 3 + i) * 0.05
      m.position.set(Math.cos(a) * r, Math.sin(time * 2.5 + i) * 0.15, Math.sin(a) * r)
    })
  })

  return (
    <group ref={g} position={[0, 1.85, 0]}>
      {/* 몸통 */}
      <mesh scale={[1, 1.15, 1]}>
        <sphereGeometry args={[0.34, 20, 16]} />
        <meshStandardMaterial
          color={s.shell}
          emissive={s.emissive}
          emissiveIntensity={s.emissiveIntensity}
          roughness={level >= 5 ? 0.25 : 0.7}
          metalness={level >= 5 ? 0.5 : 0}
        />
      </mesh>
      {/* 뚜껑 */}
      <mesh position={[0, 0.26, 0]} scale={[1.15, 0.6, 1.15]}>
        <sphereGeometry args={[0.34, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        <meshStandardMaterial color={s.cap} roughness={0.85} />
      </mesh>
      {/* 꼭지 */}
      <mesh position={[0, 0.48, 0]}>
        <cylinderGeometry args={[0.03, 0.045, 0.14, 6]} />
        <meshStandardMaterial color="#5b3a1e" />
      </mesh>

      {/* 아우라 링 */}
      {s.aura && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 0.62, 28]} />
          <meshBasicMaterial color="#ffdf7a" transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      )}
      {/* 왕관 별 */}
      {s.crown && (
        <mesh position={[0, 0.62, 0]} rotation={[0, 0, Math.PI / 5]}>
          <torusGeometry args={[0.1, 0.03, 6, 5]} />
          <meshStandardMaterial color="#fff0b0" emissive="#ffd24a" emissiveIntensity={1} />
        </mesh>
      )}

      {/* 반짝이 */}
      {Array.from({ length: s.sparks }).map((_, i) => (
        <mesh key={i} ref={(m) => { if (m) sparkRefs.current[i] = m }}>
          <sphereGeometry args={[0.035, 6, 6]} />
          <meshBasicMaterial color="#fff2b0" />
        </mesh>
      ))}
    </group>
  )
}

/* ---------- 성공/실패 임팩트 ---------- */
function Burst({
  shakeRef,
  popRef,
}: {
  shakeRef: React.MutableRefObject<number>
  popRef: React.MutableRefObject<number>
}) {
  const fxN = useVillage((s) => s.enhanceFx?.n ?? 0)
  const fxOk = useVillage((s) => s.enhanceFx?.ok ?? true)

  const ring = useRef<THREE.Mesh>(null)
  const particles = useRef<THREE.Group>(null)
  const anim = useRef({ t: 999, ok: true })
  const seenN = useRef(0)

  const parts = useMemo(
    () =>
      Array.from({ length: 16 }, () => ({
        dir: new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          Math.random() * 1.4 + 0.4,
          (Math.random() - 0.5) * 2,
        ).normalize(),
        speed: 2 + Math.random() * 2,
      })),
    [],
  )

  useFrame((_, dt) => {
    if (fxN !== seenN.current) {
      seenN.current = fxN
      anim.current = { t: 0, ok: fxOk }
      shakeRef.current = fxOk ? 0.35 : 0.85
      if (fxOk) popRef.current = 1
    }
    const a = anim.current
    if (a.t > 1.2) {
      if (ring.current) ring.current.visible = false
      if (particles.current) particles.current.visible = false
      return
    }
    a.t += dt
    const p = a.t / 1.1 // 0..1

    if (ring.current) {
      ring.current.visible = true
      const sc = 0.3 + p * (a.ok ? 3.5 : 2)
      ring.current.scale.setScalar(sc)
      const mat = ring.current.material as THREE.MeshBasicMaterial
      mat.opacity = Math.max(0, 0.8 * (1 - p))
      mat.color.set(a.ok ? '#ffe27a' : '#9aa0a6')
    }
    if (particles.current) {
      particles.current.visible = true
      particles.current.children.forEach((c, i) => {
        const pt = parts[i]
        const d = a.ok ? 1 : -0.4
        c.position.set(
          pt.dir.x * pt.speed * p * 1.4,
          1.85 + pt.dir.y * pt.speed * p * d * 1.2 - p * p * 2,
          pt.dir.z * pt.speed * p * 1.4,
        )
        const m = (c as THREE.Mesh).material as THREE.MeshBasicMaterial
        m.opacity = Math.max(0, 1 - p)
        m.color.set(a.ok ? '#ffd85a' : '#8b8f94')
        c.scale.setScalar(Math.max(0.001, 1 - p))
      })
    }
  })

  return (
    <group>
      <mesh ref={ring} position={[0, 1.85, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.35, 0.5, 32]} />
        <meshBasicMaterial color="#ffe27a" transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <group ref={particles} visible={false}>
        {parts.map((_, i) => (
          <mesh key={i}>
            <sphereGeometry args={[0.07, 6, 6]} />
            <meshBasicMaterial color="#ffd85a" transparent opacity={0} depthWrite={false} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

export function ArcadeModel({ level }: { level: number }) {
  const shakeRef = useRef(0)
  const popRef = useRef(0)
  return (
    <group>
      {/* 그루터기 받침 */}
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.6, 0.7, 0.7, 12]} />
        <meshStandardMaterial color="#6f4a2c" />
      </mesh>
      <mesh position={[0, 0.71, 0]}>
        <cylinderGeometry args={[0.62, 0.62, 0.06, 12]} />
        <meshStandardMaterial color="#8a5f39" />
      </mesh>
      {/* 모루 */}
      <mesh position={[0, 0.92, 0]}>
        <boxGeometry args={[0.9, 0.22, 0.5]} />
        <meshStandardMaterial color="#3a3d42" metalness={0.7} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.78, 0]}>
        <boxGeometry args={[0.4, 0.16, 0.34]} />
        <meshStandardMaterial color="#2c2f33" metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh position={[0.5, 0.95, 0]} rotation={[0, 0, 0.15]}>
        <coneGeometry args={[0.14, 0.36, 4]} />
        <meshStandardMaterial color="#3a3d42" metalness={0.7} roughness={0.35} />
      </mesh>

      <Acorn level={level} shakeRef={shakeRef} popRef={popRef} />
      <Burst shakeRef={shakeRef} popRef={popRef} />
    </group>
  )
}

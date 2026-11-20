import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { isFamily, type WeaponFamily } from './weapons'
import { skillJob } from './jobs'

// 전직한 학생 둘레의 직업 이펙트 — 발밑 고리 + 직업마다 다른 작은 입자들 (가벼운 기본 재질, 그림자·외곽선 없음)
//  검사: 파란 검기가 허리 둘레를 돈다 · 광전사: 붉은 불씨가 피어오른다 · 창기사: 노란 번개가 번쩍인다
//  궁수: 초록 잎이 바람처럼 휘감아 오른다 · 마법사: 보라 별이 머리 위를 돈다 · 수호자: 금빛 육각 방패가 몸을 감싼다

export const JOB_COLOR: Record<WeaponFamily, string> = {
  sword: '#6ec8ff',
  axe: '#ff5a3c',
  spear: '#ffd23c',
  bow: '#7be36b',
  staff: '#b67bff',
  hammer: '#ffc04d',
}

// 기술 알림 글자를 직업 색으로
export const skillStyle = (text: string) => {
  const f = skillJob(text)
  return f ? { background: JOB_COLOR[f] + '33', color: '#4a3410', boxShadow: '0 0 0 2px ' + JOB_COLOR[f] + 'aa' } : undefined
}

const N = 6 // 입자 수

function mat(color: string, opacity = 0.85) {
  return new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, toneMapped: false, side: THREE.DoubleSide })
}

export function JobAura({ jb }: { jb: unknown }) {
  if (!isFamily(jb)) return null
  return <Aura f={jb} />
}

function Aura({ f }: { f: WeaponFamily }) {
  const color = JOB_COLOR[f]
  const ringMat = useMemo(() => mat(color, 0.6), [color])
  const partMat = useMemo(() => mat(color, 0.9), [color])
  const shieldMat = useMemo(() => mat(color, 0.25), [color])
  const ring = useRef<THREE.Mesh>(null)
  const shield = useRef<THREE.Mesh>(null)
  const parts = useRef<(THREE.Mesh | null)[]>([])
  const seed = useMemo(() => Math.random() * 10, [])

  // 입자 모양 (직업마다)
  const geo = useMemo(() => {
    switch (f) {
      case 'sword':
        return new THREE.OctahedronGeometry(0.07).scale(0.5, 2.6, 0.5) // 길쭉한 검기
      case 'axe':
        return new THREE.SphereGeometry(0.045, 6, 5) // 불씨
      case 'spear':
        return new THREE.BoxGeometry(0.025, 0.32, 0.025) // 번개 줄기
      case 'bow':
        return new THREE.PlaneGeometry(0.1, 0.05) // 잎
      case 'staff':
        return new THREE.OctahedronGeometry(0.06) // 별
      default:
        return new THREE.OctahedronGeometry(0.05) // 금빛 반짝이
    }
  }, [f])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime + seed
    if (ring.current) {
      ring.current.rotation.z = t * (f === 'hammer' ? 0.3 : 0.8)
      ;(ring.current.material as THREE.MeshBasicMaterial).opacity = 0.55 + Math.sin(t * 2.4) * 0.15
    }
    if (shield.current) {
      shield.current.rotation.y = t * 0.6
      shield.current.scale.setScalar(1 + Math.sin(t * 2) * 0.04)
      ;(shield.current.material as THREE.MeshBasicMaterial).opacity = 0.22 + Math.sin(t * 2) * 0.08
    }
    parts.current.forEach((m, i) => {
      if (!m) return
      const ph = i / N
      const a = ph * Math.PI * 2
      switch (f) {
        case 'sword': {
          const b = a + t * 2.2
          m.position.set(Math.cos(b) * 0.62, 0.75 + Math.sin(t * 3 + i) * 0.06, Math.sin(b) * 0.62)
          m.rotation.set(0, -b, 0.9)
          m.visible = i < 4
          break
        }
        case 'axe': {
          const u = (t * 0.55 + ph) % 1 // 0 → 1 올라가며 사라진다
          m.position.set(Math.cos(a * 3.1) * 0.45, 0.1 + u * 1.5, Math.sin(a * 3.1) * 0.45)
          m.scale.setScalar(1.2 - u)
          break
        }
        case 'spear': {
          const on = Math.sin(t * 9 + i * 2.7) > 0.72 // 가끔 번쩍
          m.visible = on
          m.position.set(Math.cos(a + Math.floor(t * 2)) * 0.6, 0.35 + (i % 3) * 0.35, Math.sin(a + Math.floor(t * 2)) * 0.6)
          m.rotation.set(0, 0, (i % 2 ? 0.5 : -0.5))
          break
        }
        case 'bow': {
          const u = (t * 0.4 + ph) % 1
          const b = a + u * Math.PI * 2.2
          m.position.set(Math.cos(b) * (0.55 - u * 0.2), 0.1 + u * 1.6, Math.sin(b) * (0.55 - u * 0.2))
          m.rotation.set(t * 3 + i, b, t * 2)
          m.scale.setScalar(1.1 - u * 0.6)
          break
        }
        case 'staff': {
          const b = a + t * 1.3
          m.position.set(Math.cos(b) * 0.45, 1.95 + Math.sin(t * 2 + i) * 0.08, Math.sin(b) * 0.45)
          m.rotation.set(t * 2, t * 3, 0)
          m.scale.setScalar(0.8 + Math.max(0, Math.sin(t * 5 + i * 1.3)) * 0.7)
          break
        }
        default: {
          const b = a - t * 0.9
          m.position.set(Math.cos(b) * 0.72, 0.3 + ((i * 0.37 + t * 0.2) % 1) * 1.2, Math.sin(b) * 0.72)
          m.scale.setScalar(0.6 + Math.max(0, Math.sin(t * 4 + i)) * 0.8)
        }
      }
    })
  })

  return (
    <group>
      {/* 발밑 고리 — 수호자는 육각형 */}
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]} material={ringMat}>
        <ringGeometry args={[0.56, 0.68, f === 'hammer' ? 6 : 32]} />
      </mesh>
      {/* 수호자: 몸을 감싸는 육각 방패 */}
      {f === 'hammer' && (
        <mesh ref={shield} position={[0, 0.8, 0]} material={shieldMat}>
          <cylinderGeometry args={[0.78, 0.78, 1.3, 6, 1, true]} />
        </mesh>
      )}
      {Array.from({ length: N }, (_, i) => (
        <mesh key={i} ref={(el) => void (parts.current[i] = el)} geometry={geo} material={partMat} />
      ))}
    </group>
  )
}

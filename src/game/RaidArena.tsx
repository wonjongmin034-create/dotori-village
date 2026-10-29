import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { toonGradient } from './toon'
import { RAID_BOSS, RAID_INTRO_MS, RAID_PHASES } from './raidData'
import { RaidGiant } from './RaidGiant'
import { raidFx, useFight } from './raidFight'

// 학급 레이드 대기실 — 어둑한 돌바닥 위, 뒤쪽에 거대한 보스가 "봉인된 알" 모습으로 잠들어 있다.
// (싸움이 시작되면 알이 깨지며 페이즈마다 다른 모습이 나온다. 지금은 대기실만.)

const PHASE_COLORS = ['#6fd66f', '#4fb3ff', '#b46bff', '#ff5d4d']
// 페이즈마다 알(거인)의 몸 색과 빛이 바뀐다
const EGG_BODY = ['#2f1d52', '#1d3a66', '#4a1f66', '#6a1f2a']
const EGG_GLOW = ['#6a1fd6', '#1f6ad6', '#b01fd6', '#ff3a2a']

function Embers() {
  const refs = useRef<(THREE.Mesh | null)[]>([])
  const seeds = useMemo(
    () => Array.from({ length: 26 }, (_, i) => ({ a: (i / 26) * Math.PI * 2 + i, r: 2.4 + (i % 5) * 0.9, s: 0.6 + (i % 7) * 0.12, ph: i * 0.37 })),
    [],
  )
  useFrame((st) => {
    const t = st.clock.elapsedTime
    seeds.forEach((e, i) => {
      const m = refs.current[i]
      if (!m) return
      const k = (t * 0.18 * e.s + e.ph) % 1
      m.position.set(RAID_BOSS.x + Math.cos(e.a + t * 0.25) * e.r, 0.8 + k * 11, RAID_BOSS.z + Math.sin(e.a + t * 0.25) * e.r)
      m.scale.setScalar(0.1 * (1 - k) + 0.02)
    })
  })
  return (
    <>
      {seeds.map((_, i) => (
        <mesh key={i} ref={(el) => void (refs.current[i] = el)}>
          <sphereGeometry args={[1, 6, 5]} />
          <meshBasicMaterial color="#ffb347" transparent opacity={0.85} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      ))}
    </>
  )
}

function Egg() {
  const egg = useRef<THREE.Group>(null)
  const mat = useRef<THREE.MeshToonMaterial>(null)
  const cracks = useRef<(THREE.Mesh | null)[]>([])
  const gems = useRef<(THREE.Group | null)[]>([])
  useFrame((st) => {
    const t = st.clock.elapsedTime
    const f = useFight.getState()
    const ph = Math.max(1, Math.min(RAID_PHASES, f.ph))
    const now = Date.now()
    const hitAge = now - raidFx.hitAt
    const flash = hitAge < 220 ? 1 - hitAge / 220 : 0 // 맞으면 번쩍하며 살짝 커진다
    // 싸움이 시작되면(intro) 알이 심하게 흔들리며 빛나다가 깨지고, 그 자리에서 거인이 솟아오른다 (RaidGiant)
    const introK = f.st === 'intro' ? 1 - Math.max(0, f.nextAt - now) / RAID_INTRO_MS : 0
    const eggOn = f.st === 'idle' || (f.st === 'intro' && introK < 0.45)
    if (egg.current) {
      egg.current.scale.setScalar(1 + (ph - 1) * 0.1 + Math.sin(t * 1.6) * 0.018 + flash * 0.05 + introK * 0.25)
      egg.current.rotation.z = introK > 0 ? Math.sin(t * 45) * 0.05 * introK : 0
      egg.current.visible = eggOn
    }
    if (mat.current) {
      mat.current.color.set(EGG_BODY[ph - 1])
      mat.current.emissive.set(EGG_GLOW[ph - 1])
      mat.current.emissiveIntensity = 0.28 + flash * 1.1 + introK * 2.2
    }
    cracks.current.forEach((m, i) => {
      if (m) (m.material as THREE.MeshBasicMaterial).opacity = 0.55 + Math.sin(t * 2.2 + i * 1.3) * 0.35
    })
    gems.current.forEach((g, i) => {
      if (!g) return
      const a = t * 0.5 + (i / RAID_PHASES) * Math.PI * 2
      g.position.set(Math.cos(a) * 7.2, 4.4 + Math.sin(t * 1.4 + i) * 0.5, Math.sin(a) * 7.2)
      g.rotation.y = t * 1.2
    })
  })
  const crackAt: [number, number][] = [
    [0.1, 0.4],
    [1.9, 0.0],
    [3.3, 0.55],
    [4.7, 0.15],
  ]
  return (
    <group position={[RAID_BOSS.x, 0, RAID_BOSS.z]}>
      {/* 제단 */}
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[6.2, 6.8, 0.5, 40]} />
        <meshToonMaterial gradientMap={toonGradient} color="#3b3350" />
      </mesh>
      <mesh position={[0, 0.58, 0]}>
        <cylinderGeometry args={[5.2, 5.6, 0.2, 40]} />
        <meshToonMaterial gradientMap={toonGradient} color="#524868" />
      </mesh>
      {/* 봉인된 알 */}
      <group ref={egg} position={[0, 6.6, 0]}>
        <mesh scale={[4.2, 5.9, 4.2]}>
          <sphereGeometry args={[1, 36, 28]} />
          <meshToonMaterial ref={mat} gradientMap={toonGradient} color="#2f1d52" emissive="#6a1fd6" emissiveIntensity={0.28} />
        </mesh>
        {/* 갈라진 틈 */}
        {crackAt.map(([ang, y], i) => (
          <mesh key={i} ref={(el) => void (cracks.current[i] = el)} position={[Math.sin(ang) * 4.15, (y - 0.3) * 5, Math.cos(ang) * 4.15]} rotation={[0, ang, 0.15 * (i % 2 ? 1 : -1)]}>
            <boxGeometry args={[0.16, 3.6 - i * 0.3, 0.12]} />
            <meshBasicMaterial color="#ff7a3d" transparent opacity={0.8} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
        ))}
      </group>
      {/* 4페이즈를 뜻하는 보석 네 개가 알 둘레를 돈다 */}
      {PHASE_COLORS.map((c, i) => (
        <group key={i} ref={(el) => void (gems.current[i] = el)}>
          <mesh scale={[0.7, 1.1, 0.7]}>
            <octahedronGeometry args={[1, 0]} />
            <meshBasicMaterial color={c} />
          </mesh>
          <mesh scale={[1.5, 2.1, 1.5]}>
            <octahedronGeometry args={[1, 0]} />
            <meshBasicMaterial color={c} transparent opacity={0.25} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
        </group>
      ))}
      <pointLight position={[0, 6.5, 2]} color="#a86bff" intensity={60} distance={30} decay={2} />
    </group>
  )
}

export function RaidArena() {
  const pillars = useMemo(() => Array.from({ length: 10 }, (_, i) => [Math.sin((i / 10) * Math.PI * 2 + 0.3) * 17, Math.cos((i / 10) * Math.PI * 2 + 0.3) * 17 - 4] as [number, number]), [])
  return (
    <>
      {/* 바닥 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -4]} receiveShadow>
        <circleGeometry args={[21, 48]} />
        <meshToonMaterial gradientMap={toonGradient} color="#4d4560" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -4]}>
        <ringGeometry args={[14.5, 15.1, 64]} />
        <meshBasicMaterial color="#8b6cff" transparent opacity={0.55} />
      </mesh>
      {/* 바깥 땅 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, -4]}>
        <circleGeometry args={[120, 40]} />
        <meshToonMaterial gradientMap={toonGradient} color="#2c2540" />
      </mesh>
      {pillars.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 2.2, 0]}>
            <cylinderGeometry args={[0.7, 0.9, 4.4, 8]} />
            <meshToonMaterial gradientMap={toonGradient} color="#5a5070" />
          </mesh>
          <mesh position={[0, 4.7, 0]}>
            <sphereGeometry args={[0.42, 10, 8]} />
            <meshBasicMaterial color={PHASE_COLORS[i % 4]} />
          </mesh>
        </group>
      ))}
      <Egg />
      <RaidGiant />
      <Embers />
    </>
  )
}

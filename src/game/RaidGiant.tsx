import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { toonGradient } from './toon'
import { RAID_BOSS, RAID_INTRO_MS, RAID_PHASES } from './raidData'
import { raidFx, useFight } from './raidFight'

// 금요일의 거인 — 키 12(보스방 보스의 두 배쯤). 페이즈마다 모습이 바뀐다.
//  1 잠에서 깬 거인 (이끼 낀 돌)  2 불꽃의 거인 (용암이 흐르는 몸)  3 번개의 거인 (떠도는 수정)  4 폭주하는 거인 (뿔과 가시, 더 커진 몸)
// 알이 깨지는 순간(intro)에 땅에서 솟아오르고, 쓰러지면(won) 무너져 사라진다.

type Palette = { body: string; plate: string; accent: string; glow: string; eye: string; scale: number }
const PALETTES: Palette[] = [
  { body: '#6f6c5f', plate: '#85816f', accent: '#5f9650', glow: '#7dff9a', eye: '#b6ffb0', scale: 1 },
  { body: '#4d3a35', plate: '#6a4a3f', accent: '#ff6a1f', glow: '#ffb347', eye: '#ffd27a', scale: 1.04 },
  { body: '#393e6b', plate: '#4d5594', accent: '#7ad7ff', glow: '#b58cff', eye: '#e3f4ff', scale: 1.08 },
  { body: '#2b1a22', plate: '#40242e', accent: '#ff2e3a', glow: '#ff9a3a', eye: '#ffeb99', scale: 1.1 },
]

const ease = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3)

function Spike({ p, r = 0, s = [0.5, 1.6, 0.5], m }: { p: [number, number, number]; r?: number; s?: [number, number, number]; m: THREE.Material }) {
  return (
    <mesh position={p} rotation={[0, 0, r]} scale={s} material={m}>
      <coneGeometry args={[1, 1, 5]} />
    </mesh>
  )
}

export function RaidGiant() {
  const ph = useFight((s) => Math.max(1, Math.min(RAID_PHASES, s.ph)))
  const pal = PALETTES[ph - 1]

  const mats = useMemo(() => {
    const t = (c: string) => new THREE.MeshToonMaterial({ gradientMap: toonGradient, color: c })
    return {
      body: new THREE.MeshToonMaterial({ gradientMap: toonGradient, color: pal.body, emissive: pal.glow, emissiveIntensity: 0.05 }),
      plate: t(pal.plate),
      accent: new THREE.MeshToonMaterial({ gradientMap: toonGradient, color: pal.accent, emissive: pal.accent, emissiveIntensity: 0.35 }),
      glow: new THREE.MeshBasicMaterial({ color: pal.glow }),
      eye: new THREE.MeshBasicMaterial({ color: pal.eye }),
      halo: new THREE.MeshBasicMaterial({ color: pal.glow, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false }),
    }
  }, [pal])

  const root = useRef<THREE.Group>(null)
  const armL = useRef<THREE.Group>(null)
  const armR = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)
  const core = useRef<THREE.Mesh>(null)
  const orbit = useRef<(THREE.Group | null)[]>([])
  const flames = useRef<(THREE.Mesh | null)[]>([])
  const bolts = useRef<(THREE.Mesh | null)[]>([])

  useFrame((state) => {
    const g = root.current
    if (!g) return
    const f = useFight.getState()
    const t = state.clock.elapsedTime
    const now = Date.now()
    const active = f.st !== 'idle'
    // 알이 깨지는 동안(intro)은 아래에서 솟아오른다. 끝나면 보통 크기.
    const introK = f.st === 'intro' ? ease(1 - Math.max(0, f.nextAt - now) / RAID_INTRO_MS) : 1
    const rise = f.st === 'intro' ? Math.max(0, (introK - 0.35) / 0.65) : 1
    // 쓰러뜨리면 무너져 사라진다
    const dying = f.st === 'won' ? Math.min(1, (now - raidFx.clearAt) / 1500) : 0
    // 페이즈가 바뀌는 동안(between) 몸을 떨며 빛난다
    const morph = f.st === 'between' ? 1 : 0
    const hitAge = now - raidFx.hitAt
    const hit = hitAge < 200 ? 1 - hitAge / 200 : 0
    const s0 = pal.scale * (1 + Math.sin(t * 1.4) * 0.012 - hit * 0.012)
    g.visible = active && (f.st !== 'intro' || rise > 0) && dying < 1
    g.position.set(RAID_BOSS.x + (morph ? Math.sin(t * 40) * 0.12 : 0), -13 * (1 - rise) - dying * 6, RAID_BOSS.z)
    g.scale.set(s0, s0 * (1 - dying * 0.85), s0)
    g.rotation.x = -hit * 0.035 + dying * 0.4
    const roar = f.st === 'between' || f.st === 'intro' ? 1 : 0
    if (armL.current) armL.current.rotation.x = Math.sin(t * 1.1) * 0.12 - roar * 0.9 + (f.st === 'won' ? 0.4 : 0)
    if (armR.current) armR.current.rotation.x = Math.sin(t * 1.1 + 2.2) * 0.12 - roar * 0.9 + (f.st === 'won' ? 0.4 : 0)
    if (head.current) head.current.rotation.x = Math.sin(t * 0.9) * 0.05 - roar * 0.3
    const glowK = 0.05 + hit * 0.7 + morph * (0.4 + Math.sin(t * 20) * 0.3) + (f.st === 'between' ? 0.2 : 0)
    mats.body.emissiveIntensity = glowK
    if (core.current) core.current.scale.setScalar(1 + Math.sin(t * 3) * 0.12 + hit * 0.35 + morph * 0.4)
    flames.current.forEach((m, i) => m && m.scale.set(0.7 + Math.sin(t * 9 + i) * 0.12, 1.5 + Math.sin(t * 11 + i * 2) * 0.45, 0.7))
    orbit.current.forEach((o, i) => {
      if (!o) return
      const a = t * 0.8 + (i / 4) * Math.PI * 2
      o.position.set(Math.cos(a) * 6.2, 7.6 + Math.sin(t * 1.6 + i) * 0.7, Math.sin(a) * 4.4)
      o.rotation.y = t * 2
    })
    bolts.current.forEach((m, i) => {
      if (m) m.visible = Math.sin(t * 17 + i * 3.1) > 0.15
    })
  })

  const B = mats.body
  const P = mats.plate
  const A = mats.accent
  const GL = mats.glow
  const EY = mats.eye

  return (
    <group ref={root} userData={{ outline: true }} visible={false}>
      {/* 다리 */}
      {[-1.9, 1.9].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 2.1, 0]} material={B}>
            <cylinderGeometry args={[1.25, 1.5, 4.2, 8]} />
          </mesh>
          <mesh position={[0, 0.45, 0.5]} material={P}>
            <boxGeometry args={[2.5, 0.9, 3.2]} />
          </mesh>
        </group>
      ))}
      {/* 허리와 몸통 */}
      <mesh position={[0, 4.4, 0]} material={P}>
        <boxGeometry args={[5, 1.5, 2.8]} />
      </mesh>
      <mesh position={[0, 7.3, 0]} rotation={[0.08, 0, 0]} material={B}>
        <boxGeometry args={[5.6, 4.8, 3.4]} />
      </mesh>
      <mesh position={[0, 7.6, 1.3]} material={P}>
        <boxGeometry args={[4.2, 3.2, 1.2]} />
      </mesh>
      {/* 가슴의 핵 */}
      <mesh ref={core} position={[0, 7.7, 2]} material={GL}>
        <sphereGeometry args={[0.8, 14, 12]} />
      </mesh>
      <mesh position={[0, 7.7, 2]} scale={1.45} material={mats.halo}>
        <sphereGeometry args={[0.95, 12, 10]} />
      </mesh>
      {/* 어깨 */}
      {[-3.5, 3.5].map((x) => (
        <mesh key={x} position={[x, 9.3, 0]} material={P}>
          <sphereGeometry args={[1.5, 12, 10]} />
        </mesh>
      ))}
      {/* 팔 (어깨를 축으로 흔들린다) */}
      <group ref={armL} position={[-3.6, 9.2, 0]}>
        <mesh position={[0, -2, 0]} material={B}>
          <capsuleGeometry args={[0.85, 2.8, 6, 10]} />
        </mesh>
        <mesh position={[0, -4.6, 0.3]} material={P}>
          <sphereGeometry args={[1.45, 12, 10]} />
        </mesh>
      </group>
      <group ref={armR} position={[3.6, 9.2, 0]}>
        <mesh position={[0, -2, 0]} material={B}>
          <capsuleGeometry args={[0.85, 2.8, 6, 10]} />
        </mesh>
        <mesh position={[0, -4.6, 0.3]} material={P}>
          <sphereGeometry args={[1.45, 12, 10]} />
        </mesh>
      </group>
      {/* 머리 */}
      <group ref={head} position={[0, 11.1, 0.5]}>
        <mesh material={B}>
          <boxGeometry args={[2.9, 2.6, 2.7]} />
        </mesh>
        <mesh position={[0, -0.9, 1.2]} material={P}>
          <boxGeometry args={[2.2, 0.7, 0.6]} />
        </mesh>
        {[-0.75, 0.75].map((x) => (
          <mesh key={x} position={[x, 0.3, 1.38]} material={EY}>
            <boxGeometry args={[0.7, 0.4, 0.1]} />
          </mesh>
        ))}
        <mesh position={[0, 1.65, 0]} rotation={[0, 0, 0]} material={ph >= 4 ? A : P}>
          <boxGeometry args={[ph >= 4 ? 3.1 : 2.4, 0.5, ph >= 4 ? 2.9 : 2.1]} />
        </mesh>
        {/* 4페이즈: 커다란 뿔 */}
        {ph >= 4 && (
          <>
            <Spike p={[-1.6, 2.5, 0]} r={0.5} s={[0.55, 2.4, 0.55]} m={mats.plate} />
            <Spike p={[1.6, 2.5, 0]} r={-0.5} s={[0.55, 2.4, 0.55]} m={mats.plate} />
          </>
        )}
      </group>

      {/* 1페이즈: 이끼 */}
      {ph === 1 && (
        <>
          <mesh position={[-3.4, 10.5, 0.2]} scale={[1.2, 0.5, 1]} material={A}>
            <sphereGeometry args={[1, 8, 6]} />
          </mesh>
          <mesh position={[3.3, 10.4, -0.3]} scale={[1, 0.45, 0.9]} material={A}>
            <sphereGeometry args={[1, 8, 6]} />
          </mesh>
          <mesh position={[0.6, 9.9, -1.8]} scale={[1.8, 0.5, 0.8]} material={A}>
            <sphereGeometry args={[1, 8, 6]} />
          </mesh>
        </>
      )}

      {/* 2페이즈: 용암 줄기와 어깨의 불꽃 */}
      {ph === 2 && (
        <>
          {[-1.2, 0.3, 1.4].map((x, i) => (
            <mesh key={i} position={[x, 7.2 - i * 0.2, 1.98]} rotation={[0, 0, (i - 1) * 0.5]} scale={[0.12, 3.2 - i * 0.4, 0.1]} material={GL}>
              <boxGeometry args={[1, 1, 1]} />
            </mesh>
          ))}
          {[-3.5, 3.5, 0].map((x, i) => (
            <mesh key={x} ref={(el) => void (flames.current[i] = el)} position={[x, x === 0 ? 12.9 : 11, x === 0 ? 0.4 : 0]} material={GL}>
              <coneGeometry args={[0.7, 1.6, 6]} />
            </mesh>
          ))}
        </>
      )}

      {/* 3페이즈: 떠도는 수정과 번개 */}
      {ph === 3 && (
        <>
          {[0, 1, 2, 3].map((i) => (
            <group key={i} ref={(el) => void (orbit.current[i] = el)}>
              <mesh scale={[0.8, 1.5, 0.8]} material={A}>
                <octahedronGeometry args={[1, 0]} />
              </mesh>
              <mesh scale={[1.7, 2.8, 1.7]} material={mats.halo}>
                <octahedronGeometry args={[1, 0]} />
              </mesh>
            </group>
          ))}
          {[-3.5, 3.5].map((x) => (
            <Spike key={x} p={[x, 11.2, 0]} r={x > 0 ? -0.2 : 0.2} s={[0.6, 2.3, 0.6]} m={A} />
          ))}
          {[0, 1, 2].map((i) => (
            <mesh key={i} ref={(el) => void (bolts.current[i] = el)} position={[(i - 1) * 2.6, 11.6 - i * 0.2, 1]} rotation={[0, 0, (i - 1) * 0.9]} scale={[0.1, 3.2, 0.1]} material={GL}>
              <boxGeometry args={[1, 1, 1]} />
            </mesh>
          ))}
        </>
      )}

      {/* 4페이즈: 등의 가시, 불타는 핵, 떠 있는 주먹 */}
      {ph === 4 && (
        <>
          {[-2.4, -1.2, 0, 1.2, 2.4].map((x, i) => (
            <Spike key={i} p={[x, 9.6 + (i === 2 ? 0.8 : 0), -2]} r={x * -0.15} s={[0.55, 2.2 + (i === 2 ? 0.8 : 0), 0.55]} m={A} />
          ))}
          {[-5.6, 5.6].map((x) => (
            <group key={x} position={[x, 6.4, -1.2]}>
              <mesh material={A}>
                <sphereGeometry args={[1.2, 10, 8]} />
              </mesh>
            </group>
          ))}
          {[-1.2, 0.3, 1.4].map((x, i) => (
            <mesh key={i} position={[x, 7.2 - i * 0.2, 1.98]} rotation={[0, 0, (i - 1) * 0.5]} scale={[0.12, 3.2 - i * 0.4, 0.1]} material={GL}>
              <boxGeometry args={[1, 1, 1]} />
            </mesh>
          ))}
          {[-3.5, 3.5].map((x, i) => (
            <mesh key={x} ref={(el) => void (flames.current[i] = el)} position={[x, 11, 0]} material={GL}>
              <coneGeometry args={[0.7, 1.6, 6]} />
            </mesh>
          ))}
        </>
      )}
    </group>
  )
}

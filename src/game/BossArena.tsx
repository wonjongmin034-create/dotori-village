import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { Toon } from './wearKit'
import { Baked } from './Baked'
import { BossModel, labelTex } from './bossModels'
import { useBoss, type BossGame, type LastHit } from './bossState'
import { stageOf } from './bossData'
import { ARENA_R, BOSS_POS, BOSS_SCALE, slotPos } from './bossLayout'
import { bossFx, camShake, clamp01, nowSec, resetBossFx } from './bossFx'
import { startSwing } from './swing'
import { ArrowModel } from './ArrowModel'
import { GRADES } from './weapons'

// 보스 방 — 보스와 팀이 있는 둥근 싸움터. 단계마다 분위기가 다르다.
// 문제를 맞히면 그 사람이 무기를 휘두르고(swing.ts) 보스에게 무기 종류·등급에 맞는 이펙트가 터진다.

type V3 = [number, number, number]

/* ============ 배경 ============ */
function Flames({ spots, color }: { spots: V3[]; color: string }) {
  const refs = useRef<(THREE.Mesh | null)[]>([])
  useFrame(() => {
    const t = nowSec()
    refs.current.forEach((m, i) => {
      if (!m) return
      const k = 1 + Math.sin(t * 9 + i * 2.1) * 0.18 + Math.sin(t * 15 + i) * 0.08
      m.scale.set(1 + (k - 1) * 0.5, k, 1 + (k - 1) * 0.5)
    })
  })
  return (
    <>
      {spots.map((p, i) => (
        <mesh key={i} ref={(el) => void (refs.current[i] = el)} position={p}>
          <coneGeometry args={[0.2, 0.62, 10]} />
          <meshBasicMaterial color={color} />
        </mesh>
      ))}
    </>
  )
}

function ring(n: number, r: number, off = 0): V3[] {
  return Array.from({ length: n }, (_, i) => {
    const a = off + (i / n) * Math.PI * 2
    return [Math.sin(a) * r, 0, Math.cos(a) * r] as V3
  })
}

function ArenaBase({ stage }: { stage: number }) {
  const th = stageOf(stage).theme
  const pillars = useMemo(() => ring(10, ARENA_R - 0.9, 0.2), [])
  const flameSpots: V3[] = pillars.map(([x, , z]) => [x, 2.35, z])

  return (
    <>
      <Baked>
        {/* 땅 */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <circleGeometry args={[ARENA_R + 6, 56]} />
          <Toon color={th.ground} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <circleGeometry args={[ARENA_R - 0.4, 56]} />
          <Toon color={stage === 4 ? '#454b96' : stage === 3 ? '#d2c08e' : stage === 2 ? '#8c7fd0' : '#b9ae94'} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
          <ringGeometry args={[ARENA_R - 1.6, ARENA_R - 0.4, 56]} />
          <Toon color={th.ring} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.035, 1.5]}>
          <ringGeometry args={[4.9, 5.1, 48]} />
          <Toon color={th.accent} emissive={th.accent} ei={0.25} />
        </mesh>
        {/* 기둥 */}
        {pillars.map(([x, , z], i) => (
          <group key={i} position={[x, 0, z]}>
            {stage === 4 ? (
              <>
                <mesh position={[0, 1.4, 0]}>
                  <boxGeometry args={[1.0, 2.8, 0.9]} />
                  <Toon color="#3b2a4a" />
                </mesh>
                {['#ff6b6b', '#ffd166', '#6bd6a0', '#6bb6ff', '#c58bff'].map((c, k) => (
                  <mesh key={c} position={[0, 0.55 + k * 0.5, 0.47]}>
                    <boxGeometry args={[0.8, 0.34, 0.06]} />
                    <Toon color={c} />
                  </mesh>
                ))}
              </>
            ) : stage === 3 ? (
              <>
                <mesh position={[0, 1.2, 0]}>
                  <cylinderGeometry args={[0.32, 0.38, 2.4, 14]} />
                  <Toon color="#b8392e" />
                </mesh>
                <mesh position={[0, 2.45, 0]}>
                  <boxGeometry args={[0.95, 0.22, 0.95]} />
                  <Toon color="#e8c24a" />
                </mesh>
                <mesh position={[0, 0.12, 0]}>
                  <boxGeometry args={[0.9, 0.25, 0.9]} />
                  <Toon color="#9a8f7a" />
                </mesh>
              </>
            ) : stage === 2 ? (
              <>
                <mesh position={[0, 1.1, 0]}>
                  <coneGeometry args={[0.55, 2.6 + (i % 3) * 0.5, 6]} />
                  <Toon color={i % 2 ? '#9b7bff' : '#6fd6c4'} emissive={i % 2 ? '#7a58ff' : '#3fbfa8'} ei={0.45} />
                </mesh>
                <mesh position={[0.5, 0.4, 0.3]}>
                  <coneGeometry args={[0.28, 1.0, 6]} />
                  <Toon color="#c9b6ff" emissive="#7a58ff" ei={0.35} />
                </mesh>
              </>
            ) : (
              <>
                <mesh position={[0, 1.15, 0]}>
                  <cylinderGeometry args={[0.45, 0.55, 2.3, 10]} />
                  <Toon color="#a39a8a" />
                </mesh>
                <mesh position={[0, 2.4, 0]}>
                  <cylinderGeometry args={[0.62, 0.5, 0.3, 10]} />
                  <Toon color="#c2b9a6" />
                </mesh>
                <mesh position={[0.1, 1.6, 0.46]} scale={[1, 1, 0.3]}>
                  <sphereGeometry args={[0.28, 10, 8]} />
                  <Toon color="#6fa04a" />
                </mesh>
              </>
            )}
          </group>
        ))}
        {/* 바닥 장식 */}
        {stage === 1 &&
          ring(8, ARENA_R - 3.0, 0.4).map(([x, , z], i) => (
            <mesh key={i} position={[x, 0.05, z]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[1.3, 1.3]} />
              <meshBasicMaterial map={labelTex(['+', '−', '×', '÷'][i % 4], '#ffe0a0', '#5a5568')} />
            </mesh>
          ))}
        {stage === 2 &&
          ring(8, ARENA_R - 3.0, 0.4).map(([x, , z], i) => (
            <mesh key={i} position={[x, 0.05, z]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[1.3, 1.3]} />
              <meshBasicMaterial map={labelTex('ABCDEFGH'[i], '#fff2c0', '#5a4aa0')} />
            </mesh>
          ))}
        {stage === 3 &&
          ring(8, ARENA_R - 3.0, 0.4).map(([x, , z], i) => (
            <mesh key={i} position={[x, 0.05, z]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[1.3, 1.3]} />
              <meshBasicMaterial map={labelTex(['天', '地', '玄', '黃'][i % 4], '#ffe9a8', '#9b3a30')} />
            </mesh>
          ))}
        {stage === 4 &&
          ring(8, ARENA_R - 3.0, 0.4).map(([x, , z], i) => (
            <mesh key={i} position={[x, 0.05, z]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[1.3, 1.3]} />
              <meshBasicMaterial map={labelTex(['수', '국', '영', '과', '사', '史', '✎', '?'][i], '#ffe9a8', '#2b2f78')} />
            </mesh>
          ))}
      </Baked>
      <Flames spots={flameSpots} color={stage === 5 ? '#5ee6ff' : stage === 4 ? '#8fd8ff' : stage === 2 ? '#b9a0ff' : '#ffb347'} />
    </>
  )
}

/* ============ 먼 배경 (단계마다 다르게) ============ */
function Backdrop({ stage }: { stage: number }) {
  const hills = useMemo(() => {
    const rnd = (() => {
      let a = 7 + stage * 13
      return () => ((a = (a * 1664525 + 1013904223) >>> 0) / 4294967296)
    })()
    return Array.from({ length: 22 }, (_, i) => {
      const ang = (i / 22) * Math.PI * 2 + rnd() * 0.15
      const r = 58 + rnd() * 20
      return { x: Math.sin(ang) * r, z: Math.cos(ang) * r, h: 6 + rnd() * 12, w: 5 + rnd() * 5, k: i % 3 }
    })
  }, [stage])
  const stars = useMemo(() => {
    let a = 99
    const rnd = () => ((a = (a * 1664525 + 1013904223) >>> 0) / 4294967296)
    return Array.from({ length: 70 }, () => {
      const ang = rnd() * Math.PI * 2
      const r = 70 + rnd() * 25
      return [Math.sin(ang) * r, 12 + rnd() * 50, Math.cos(ang) * r] as V3
    })
  }, [])
  const cols =
    stage === 1
      ? ['#8fc98a', '#7fb8a8', '#9ccf8f']
      : stage === 2
        ? ['#9a86e8', '#7a68d0', '#b7a4f5']
        : stage === 4
          ? ['#2b2a6a', '#3a3a86', '#24235a']
          : stage === 5
            ? ['#1f5f78', '#2a7a96', '#174d63']
            : ['#5c8f86', '#4d7f7a', '#6aa095']
  return (
    <Baked>
      {hills.map((h, i) => (
        <mesh key={i} position={[h.x, stage === 1 ? 0 : h.h / 2 - 1, h.z]} scale={stage === 1 ? [1.6, 0.55, 1.6] : [1, 1, 1]}>
          {stage === 2 || stage === 4 ? <coneGeometry args={[h.w * 0.45, h.h * (stage === 4 ? 1.8 : 1.3), 5]} /> : stage === 3 ? <coneGeometry args={[h.w, h.h, 6]} /> : <sphereGeometry args={[h.w, 14, 10]} />}
          <Toon color={cols[h.k]} emissive={stage === 2 ? '#6a4fe0' : undefined} ei={0.25} />
        </mesh>
      ))}
      <mesh position={stage === 3 ? [0, 22, -70] : stage === 2 ? [-26, 30, -62] : stage === 4 ? [-30, 36, -66] : [26, 34, -64]}>
        <circleGeometry args={[stage === 3 ? 12 : stage === 4 ? 9 : 7, 40]} />
        <meshBasicMaterial color={stage === 3 ? '#ff6a4a' : stage === 2 || stage === 4 ? '#fff3c4' : '#fff1b8'} fog={false} />
      </mesh>
      {stage === 4 &&
        stars.map((p, i) => (
          <mesh key={i} position={p}>
            <sphereGeometry args={[0.35, 5, 4]} />
            <meshBasicMaterial color={i % 3 === 0 ? '#bfe9ff' : '#fff6c8'} fog={false} />
          </mesh>
        ))}
    </Baked>
  )
}

/* ============ 내 팀 자리 표시 ============ */
function SlotMarkers({ stage }: { stage: number }) {
  const th = stageOf(stage).theme
  const game = useBoss((s) => s.game)
  const roster = useBoss((s) => s.roster)
  const n = game && (game.phase !== 'won' && game.phase !== 'lost' && game.phase !== 'aborted') ? game.members.length : Math.max(3, Math.min(4, roster.length))
  const who = game && game.phase === 'ask' ? game.members.findIndex((m) => m.n === game.who) : -1
  const refs = useRef<(THREE.Mesh | null)[]>([])
  useFrame(() => {
    const t = nowSec()
    refs.current.forEach((m, i) => {
      if (!m) return
      const on = i === who
      const mat = m.material as THREE.MeshBasicMaterial
      mat.opacity = on ? 0.65 + Math.sin(t * 6) * 0.25 : 0.32
      const s = on ? 1.08 + Math.sin(t * 6) * 0.05 : 1
      m.scale.set(s, s, s)
    })
  })
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const [x, z] = slotPos(i, n)
        return (
          <mesh key={i} ref={(el) => void (refs.current[i] = el)} position={[x, 0.06, z]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.62, 0.86, 28]} />
            <meshBasicMaterial color={th.accent} transparent opacity={0.4} depthWrite={false} />
          </mesh>
        )
      })}
    </>
  )
}

/* ============ 이펙트 ============ */
type FxInput = { kind: 'hit'; last: LastHit; from: V3; to: V3 } | { kind: 'shock' } | { kind: 'confetti' }
type Fx = FxInput & { id: number }

const gradeColor = (tier: number) => GRADES[Math.max(1, Math.min(6, tier)) - 1].color
const AIM: V3 = [BOSS_POS.x, 2.8, BOSS_POS.z + 2.9] // 보스의 가슴 앞 (맞는 자리 — 몸에 가려지지 않게 앞쪽)

// 사방으로 튀는 불꽃 알갱이
function Sparks({ n, color, at, speed = 4.2, life = 0.75 }: { n: number; color: string; at: V3; speed?: number; life?: number }) {
  const refs = useRef<(THREE.Mesh | null)[]>([])
  const t0 = useRef(performance.now())
  const data = useMemo(
    () =>
      Array.from({ length: n }, () => {
        const a = Math.random() * Math.PI * 2
        const e = Math.random() * 1.3 - 0.15
        const sp = speed * (0.45 + Math.random() * 0.8)
        return { vx: Math.cos(a) * sp * Math.cos(e), vy: Math.sin(e) * sp + 1.6, vz: Math.sin(a) * sp * Math.cos(e) + 1.2, s: 0.07 + Math.random() * 0.11 }
      }),
    [n, speed],
  )
  useFrame(() => {
    const t = (performance.now() - t0.current) / 1000
    refs.current.forEach((m, i) => {
      if (!m) return
      const d = data[i]
      m.position.set(at[0] + d.vx * t, at[1] + d.vy * t - 6 * t * t, at[2] + d.vz * t)
      m.scale.setScalar(Math.max(0.001, d.s * (1 - t / life)))
      m.visible = t < life
    })
  })
  return (
    <>
      {data.map((_, i) => (
        <mesh key={i} ref={(el) => void (refs.current[i] = el)}>
          <sphereGeometry args={[1, 6, 5]} />
          <meshBasicMaterial color={color} blending={THREE.AdditiveBlending} transparent depthWrite={false} />
        </mesh>
      ))}
    </>
  )
}

// 맞는 순간 번쩍이는 둥근 빛
function Flash({ at, color, size }: { at: V3; color: string; size: number }) {
  const m = useRef<THREE.Mesh>(null)
  const t0 = useRef(performance.now())
  useFrame(() => {
    const t = clamp01((performance.now() - t0.current) / 260)
    if (m.current) {
      m.current.scale.setScalar(size * (0.35 + t * 0.9))
      ;(m.current.material as THREE.MeshBasicMaterial).opacity = (1 - t) * 0.6
    }
  })
  return (
    <mesh ref={m} position={at}>
      <sphereGeometry args={[1, 14, 10]} />
      <meshBasicMaterial color={color} transparent blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  )
}

// 휘두른 칼날 자국 (초승달 모양 호)
function Arc({ at, color, tier, tilt, wide, delay = 0 }: { at: V3; color: string; tier: number; tilt: number; wide: number; delay?: number }) {
  const m = useRef<THREE.Mesh>(null)
  const t0 = useRef(performance.now() + delay)
  useFrame(() => {
    const t = clamp01((performance.now() - t0.current) / 380)
    if (!m.current) return
    m.current.visible = t > 0 || performance.now() >= t0.current
    const k = 0.55 + t * (0.9 + tier * 0.08)
    m.current.scale.set(k * wide, k, 1)
    m.current.rotation.z = tilt + t * 0.5
    ;(m.current.material as THREE.MeshBasicMaterial).opacity = Math.pow(1 - t, 1.5)
  })
  const o = 1.5 + tier * 0.14
  return (
    <mesh ref={m} position={at} rotation={[0, 0, tilt]}>
      <ringGeometry args={[o * 0.6, o, 30, 1, 0.2, 2.5]} />
      <meshBasicMaterial color={color} transparent opacity={1} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  )
}

// 땅으로 퍼지는 충격 고리
function Wave({ at, color, to = 6, ms = 600 }: { at: V3; color: string; to?: number; ms?: number }) {
  const m = useRef<THREE.Mesh>(null)
  const t0 = useRef(performance.now())
  useFrame(() => {
    const t = clamp01((performance.now() - t0.current) / ms)
    if (m.current) {
      m.current.scale.setScalar(0.4 + t * to)
      ;(m.current.material as THREE.MeshBasicMaterial).opacity = (1 - t) * 0.85
    }
  })
  return (
    <mesh ref={m} position={at} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.8, 1, 40]} />
      <meshBasicMaterial color={color} transparent blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  )
}

// 활: 화살이 포물선으로 날아가 보스에 꽂힌다.  지팡이: 빛나는 마법 구슬이 날아가 맞는다.
function Bolt({ from, to, color, fam, onArrive }: { from: V3; to: V3; color: string; fam: string; onArrive: () => void }) {
  const orb = useRef<THREE.Mesh>(null)
  const arrow = useRef<THREE.Group>(null)
  const trail = useRef<(THREE.Mesh | null)[]>([])
  const t0 = useRef(performance.now())
  const done = useRef(false)
  const isArrow = fam === 'bow'
  useFrame(() => {
    const t = clamp01((performance.now() - t0.current) / (isArrow ? 260 : 300))
    const pos = (k: number): V3 => [from[0] + (to[0] - from[0]) * k, from[1] + (to[1] - from[1]) * k + Math.sin(k * Math.PI) * (isArrow ? 0.55 : 0.8), from[2] + (to[2] - from[2]) * k]
    if (orb.current) {
      const p = pos(t)
      orb.current.position.set(p[0], p[1], p[2])
      orb.current.visible = !isArrow && t < 1
    }
    if (arrow.current) {
      const p = pos(t)
      const q = pos(Math.min(1, t + 0.03))
      arrow.current.position.set(p[0], p[1], p[2])
      arrow.current.lookAt(q[0], q[1], q[2]) // 날아가는 방향으로 화살촉이 향한다
      arrow.current.visible = t < 1
    }
    trail.current.forEach((m, i) => {
      if (!m) return
      const p = pos(Math.max(0, t - (i + 1) * 0.06))
      m.position.set(p[0], p[1], p[2])
      m.scale.setScalar(Math.max(0.001, 0.16 - i * 0.03))
      m.visible = t < 1
    })
    if (t >= 1 && !done.current) {
      done.current = true
      onArrive()
    }
  })
  return (
    <>
      <mesh ref={orb} scale={0.24}>
        <sphereGeometry args={[1, 12, 10]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <group ref={arrow} visible={false}>
        <ArrowModel feather={color} len={1.5} scale={1.1} />
      </group>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} ref={(el) => void (trail.current[i] = el)}>
          <sphereGeometry args={[1, 8, 6]} />
          <meshBasicMaterial color={color} transparent opacity={0.75} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      ))}
    </>
  )
}

// 맞는 자리에서 일어나는 모든 연출 한 세트
function HitFx({ last, from }: { last: LastHit; from: V3 }) {
  const color = gradeColor(last.tier)
  const fam = last.fam ?? 'sword'
  const ranged = fam === 'bow' || fam === 'staff'
  const [landed, setLanded] = useState(!ranged)
  const big = last.tier >= 5

  const burst = (
    <>
      <Flash at={AIM} color={color} size={0.5 + last.tier * 0.07} />
      <Sparks n={10 + last.tier * 3} color={color} at={AIM} speed={3.6 + last.tier * 0.3} />
      <Sparks n={6} color="#ffffff" at={AIM} speed={2.4} life={0.5} />
    </>
  )

  return (
    <>
      {ranged && !landed && <Bolt from={[from[0], 1.7, from[2] - 0.5]} to={AIM} color={color} fam={fam} onArrive={() => setLanded(true)} />}
      {landed && (
        <>
          {burst}
          {fam === 'spear' ? (
            <Arc at={AIM} color={color} tier={last.tier} tilt={Math.PI / 2 + 0.2} wide={0.35} />
          ) : fam === 'axe' ? (
            <>
              <Arc at={AIM} color={color} tier={last.tier} tilt={0.5} wide={1.25} />
              <Arc at={AIM} color="#ffffff" tier={Math.max(1, last.tier - 2)} tilt={0.55} wide={1.15} delay={30} />
            </>
          ) : fam === 'hammer' ? (
            <>
              <Wave at={[AIM[0], 0.07, AIM[2] + 0.4]} color={color} to={5 + last.tier * 0.4} ms={520} />
              <Arc at={AIM} color={color} tier={last.tier} tilt={-0.2} wide={0.8} />
            </>
          ) : fam === 'bow' || fam === 'staff' ? (
            <Wave at={AIM} color={color} to={2.6} ms={420} />
          ) : (
            <>
              <Arc at={AIM} color={color} tier={last.tier} tilt={0.6} wide={1} />
              <Arc at={AIM} color="#ffffff" tier={Math.max(1, last.tier - 2)} tilt={-0.5} wide={0.9} delay={70} />
            </>
          )}
          {big && <Wave at={[AIM[0], 0.07, AIM[2]]} color={color} to={7} ms={650} />}
          <Html position={[AIM[0], AIM[1] + 1.6, AIM[2]]} center zIndexRange={[20, 10]} style={{ pointerEvents: 'none' }}>
            <div className="boss-dmg" style={{ color: '#fff', textShadow: `0 0 10px ${color}, 0 3px 0 rgba(0,0,0,.35)` }}>
              −{last.dmg}
            </div>
          </Html>
        </>
      )}
    </>
  )
}

// 오답: 보스가 공격해서 팀 쪽으로 붉은 충격파가 퍼진다
function ShockFx() {
  return (
    <>
      <Wave at={[BOSS_POS.x, 0.08, BOSS_POS.z + 1.4]} color="#ff4d4d" to={9} ms={700} />
      <Wave at={[BOSS_POS.x, 0.08, BOSS_POS.z + 1.4]} color="#ffd0a0" to={6.5} ms={560} />
    </>
  )
}

// 승리: 위에서 쏟아지는 색종이
function Confetti() {
  const refs = useRef<(THREE.Mesh | null)[]>([])
  const t0 = useRef(performance.now())
  const items = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => ({
        x: (Math.random() - 0.5) * 16,
        z: (Math.random() - 0.5) * 12 + 1,
        y: 7 + Math.random() * 5,
        v: 1.6 + Math.random() * 1.8,
        sp: 2 + Math.random() * 5,
        c: ['#ff6b6b', '#ffd166', '#6bd6a0', '#6bb6ff', '#c58bff', '#ff8fd0'][i % 6],
        d: Math.random() * 1.2,
      })),
    [],
  )
  useFrame(() => {
    const t = (performance.now() - t0.current) / 1000
    refs.current.forEach((m, i) => {
      if (!m) return
      const it = items[i]
      const k = Math.max(0, t - it.d)
      m.position.set(it.x + Math.sin(k * 2 + i) * 0.6, it.y - it.v * k, it.z)
      m.rotation.set(k * it.sp, k * it.sp * 0.7, 0)
      m.visible = k > 0 && m.position.y > 0.1
    })
  })
  return (
    <>
      {items.map((it, i) => (
        <mesh key={i} ref={(el) => void (refs.current[i] = el)} scale={[0.22, 0.34, 0.02]} visible={false}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color={it.c} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </>
  )
}

// 게임 상태가 바뀔 때마다 연출을 시작한다 (모든 사람 화면에서 같은 순간에)
function FxLayer() {
  const [fx, setFx] = useState<Fx[]>([])
  const idRef = useRef(1)

  useEffect(() => {
    const add = (f: FxInput, ms: number) => {
      const id = idRef.current++
      setFx((l) => [...l, { ...f, id }])
      setTimeout(() => setFx((l) => l.filter((x) => x.id !== id)), ms)
    }
    const onGame = (g: BossGame | null, prev: BossGame | null) => {
      if (!g) return
      const newFight = !prev || prev.gid !== g.gid
      if (newFight && g.phase === 'intro') {
        resetBossFx()
        bossFx.introAt = nowSec()
      }
      bossFx.lv = g.lv ?? 1
      if (!newFight && prev && prev.seq === g.seq) return
      if (g.phase === 'result' && g.last) {
        const last = g.last
        const idx = Math.max(0, g.members.findIndex((m) => m.n === last.who))
        const [sx, sz] = slotPos(idx, g.members.length)
        if (last.ok) {
          // 필살기: 팀원 모두가 한꺼번에 휘두른다
          if (last.ult) g.members.forEach((m, i) => startSwing(m.n, i * 70, m.wf))
          else startSwing(last.who, 0, last.fam)
          const ranged = last.fam === 'bow' || last.fam === 'staff'
          // 칼을 내리치는 순간(약 0.19초 뒤)에 맞는다
          setTimeout(() => {
            bossFx.hitAt = nowSec() + (ranged ? 0.3 : 0)
            bossFx.dmg = last.dmg
            camShake.amp = Math.max(camShake.amp, last.ult ? 1.1 : 0.25 + last.tier * 0.06)
          }, 190)
          setTimeout(() => add({ kind: 'hit', last, from: [sx, 0, sz], to: AIM }, 2400), 190)
        } else if (last.draw) {
          // 가위바위보 비김: 아무 일도 없다
        } else {
          setTimeout(() => {
            bossFx.atkAt = nowSec()
          }, 250)
          setTimeout(() => {
            add({ kind: 'shock' }, 1000)
            camShake.amp = Math.max(camShake.amp, 0.9)
          }, 620)
        }
        // 보스가 다음 페이즈로: 포효하며 충격파
        if (last.lvUp) {
          setTimeout(() => {
            bossFx.atkAt = nowSec()
            add({ kind: 'shock' }, 1000)
            camShake.amp = Math.max(camShake.amp, 1)
          }, 700)
        }
        // 마지막 일격이면 보스가 쓰러진다
        if (g.end === 'won') bossFx.deadAt = nowSec() + (last.fam === 'bow' || last.fam === 'staff' ? 0.9 : 0.6)
      }
      if (g.phase === 'won' && (!prev || prev.phase !== 'won')) add({ kind: 'confetti' }, 6500)
      if (g.phase === 'lost' && (!prev || prev.phase !== 'lost')) bossFx.atkAt = nowSec()
    }
    let prev = useBoss.getState().game
    return useBoss.subscribe((s) => {
      const g = s.game
      if (g !== prev) {
        onGame(g, prev)
        prev = g
      }
    })
  }, [])

  return (
    <>
      {fx.map((f) =>
        f.kind === 'hit' ? <HitFx key={f.id} last={f.last} from={f.from} /> : f.kind === 'shock' ? <ShockFx key={f.id} /> : <Confetti key={f.id} />,
      )}
    </>
  )
}

/* ============ 전체 ============ */
export function BossArena() {
  const stage = useBoss((s) => s.game?.stage ?? s.lobbyStage)
  // 방에 들어왔을 때·단계가 바뀔 때 보스가 "쑥" 등장
  useEffect(() => {
    resetBossFx()
    bossFx.introAt = nowSec()
  }, [stage])

  return (
    <>
      <ArenaBase stage={stage} />
      <Backdrop stage={stage} />
      <group position={[BOSS_POS.x, 0, BOSS_POS.z]} scale={BOSS_SCALE}>
        <BossModel stage={stage} />
      </group>
      <SlotMarkers stage={stage} />
      <FxLayer />
    </>
  )
}

import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { Character, type CharacterRefs } from './Character'
import { SimpleFigure } from './SimpleFigure'
import { playerPos } from './player-state'
import { useOmok } from './omokState'
import { useGfx } from './gfx'
import { normalizeAvatar } from './avatar'
import { rideOf, applyRidePose } from './rides'
import { peers, useLive } from './live'

const MAX_SHOWN = 10 // 한 번에 그리는 친구 수 (한 방 최대 10명)
const DETAILED = 4 // 가까운 이만큼만 옷까지 자세히 그리고, 나머지는 단순하게 (크롬북 성능)
const DETAIL_DIST = 16

function dampAngle(current: number, target: number, lambda: number, dt: number) {
  let diff = target - current
  while (diff > Math.PI) diff -= Math.PI * 2
  while (diff < -Math.PI) diff += Math.PI * 2
  return current + diff * (1 - Math.exp(-lambda * dt))
}

// 같은 마을에 있는 친구들 — 받은 위치를 부드럽게 따라가며 걷는 모션을 보여 준다.
export function RemotePlayers() {
  const names = useLive((s) => s.names)
  const [detail, setDetail] = useState<Set<string>>(() => new Set(names.slice(0, DETAILED)))

  // 0.5초마다: 나와 가까운 친구 몇 명만 자세히 그린다
  useEffect(() => {
    const pick = () => {
      const ranked = names
        .slice(0, MAX_SHOWN)
        .map((n) => {
          const p = peers.get(n)
          return { n, d: p && p.at ? Math.hypot(p.x - playerPos.x, p.z - playerPos.z) : 99 }
        })
        .sort((a, b) => a.d - b.d)
      const keep = useGfx.getState().lite ? 2 : DETAILED // 느릴 때는 자세히 그리는 친구를 줄인다
      const next = new Set(ranked.filter((r, i) => i < keep && r.d < DETAIL_DIST).map((r) => r.n))
      setDetail((prev) => (prev.size === next.size && [...next].every((n) => prev.has(n)) ? prev : next))
    }
    pick()
    const t = setInterval(pick, 500)
    return () => clearInterval(t)
  }, [names])

  return (
    <>
      {names.slice(0, MAX_SHOWN).map((n) => (
        <RemoteFigure key={n} name={n} simple={!detail.has(n)} />
      ))}
    </>
  )
}

function RemoteFigure({ name, simple }: { name: string; simple: boolean }) {
  const root = useRef<THREE.Group>(null)
  const shadow = useRef<THREE.Mesh>(null)
  const yaw = useRef<THREE.Group>(null)
  const refs: CharacterRefs = {
    bob: useRef<THREE.Group>(null),
    head: useRef<THREE.Group>(null),
    body: useRef<THREE.Group>(null),
    armL: useRef<THREE.Group>(null),
    armR: useRef<THREE.Group>(null),
    legL: useRef<THREE.Group>(null),
    legR: useRef<THREE.Group>(null),
    eyeL: useRef<THREE.Group>(null),
    eyeR: useRef<THREE.Group>(null),
  }
  const st = useRef({ x: 0, z: 0, y: 0, facing: 0, phase: 0, init: false, blink: 0, nextBlink: 2 })
  const peer = peers.get(name)
  const emote = useLive((s) => s.emotes[name])

  useFrame((state, rawDt) => {
    const g = root.current
    const p = peers.get(name)
    if (!g) return
    if (!p || p.at === 0) {
      g.visible = false
      return
    }
    g.visible = true
    const dt = Math.min(rawDt, 0.05)
    const s = st.current
    const t = state.clock.elapsedTime

    // 마지막으로 받은 위치에서 속도만큼 조금 더 간 곳을 목표로 (최대 0.35초)
    const rawAge = (performance.now() - p.at) / 1000
    const age = Math.min(3, rawAge) // 인원이 많으면 위치가 2~3초에 한 번 온다 → 그 사이를 속도로 이어 그린다
    const ageY = Math.min(1.1, rawAge)
    const tx = p.x + p.vx * age
    const tz = p.z + p.vz * age
    if (!s.init) {
      s.x = tx
      s.z = tz
      s.facing = p.facing
      s.init = true
    }
    const k = 1 - Math.exp(-11 * dt)
    const ox = s.x
    const oz = s.z
    s.x += (tx - s.x) * k
    s.z += (tz - s.z) * k
    // 점프 높이: 받은 높이에서 속도·중력으로 조금 더 간 곳을 따라간다
    const ty = Math.max(0, p.y + p.vy * ageY - 12 * ageY * ageY)
    s.y += (ty - s.y) * (1 - Math.exp(-18 * dt))
    // 너무 멀어졌으면(순간이동) 바로 붙는다
    if (Math.hypot(tx - s.x, tz - s.z) > 6) {
      s.x = tx
      s.z = tz
    }
    const speed = Math.hypot(s.x - ox, s.z - oz) / Math.max(dt, 1e-4)
    const moving = speed > 0.5 || Math.hypot(p.vx, p.vz) > 0.3
    if (moving && Math.hypot(p.vx, p.vz) > 0.3) {
      s.facing = dampAngle(s.facing, Math.atan2(p.vx, p.vz), 12, dt)
    } else if (!moving) {
      s.facing = dampAngle(s.facing, p.facing, 6, dt)
    }
    s.phase += dt * (moving ? 7 + Math.min(1, speed / 6) * 5 : 2)

    g.position.set(s.x, s.y, s.z)
    if (shadow.current) {
      shadow.current.position.y = 0.02 - s.y
      const sk = 1 - Math.min(0.5, s.y * 0.4)
      shadow.current.scale.set(sk, sk, sk)
    }
    if (yaw.current) yaw.current.rotation.y = s.facing

    const swing = moving ? Math.sin(s.phase) * 0.85 : Math.sin(t * 1.6) * 0.06
    if (refs.bob.current) {
      refs.bob.current.position.y = moving ? Math.abs(Math.sin(s.phase)) * 0.09 : Math.sin(t * 2) * 0.012
      refs.bob.current.rotation.x = THREE.MathUtils.damp(refs.bob.current.rotation.x, moving ? 0.09 : 0, 6, dt)
    }
    if (refs.body.current) refs.body.current.scale.set(1, 1 + Math.sin(t * 2) * (moving ? 0 : 0.025), 1)
    if (refs.armL.current) refs.armL.current.rotation.x = swing
    if (refs.armR.current) refs.armR.current.rotation.x = -swing
    if (refs.legL.current) refs.legL.current.rotation.x = moving ? -Math.sin(s.phase) * 0.7 : 0
    if (refs.legR.current) refs.legR.current.rotation.x = moving ? Math.sin(s.phase) * 0.7 : 0
    if (s.y > 0.05) {
      if (refs.armL.current) refs.armL.current.rotation.x = -2.5
      if (refs.armR.current) refs.armR.current.rotation.x = -2.5
      if (refs.legL.current) refs.legL.current.rotation.x = -0.55
      if (refs.legR.current) refs.legR.current.rotation.x = 0.25
    }

    applyRidePose(refs, rideOf(p.avatar.ride), moving, s.phase)
    {
      const seats = useOmok.getState().seats
      const sitting = Object.values(seats).some((r) => r[0] === name || r[1] === name)
      if (sitting) {
        if (refs.legL.current) refs.legL.current.rotation.x = -1.25
        if (refs.legR.current) refs.legR.current.rotation.x = -1.25
        if (refs.armL.current) refs.armL.current.rotation.x = -0.8
        if (refs.armR.current) refs.armR.current.rotation.x = -0.8
      }
    }

    s.nextBlink -= dt
    if (s.nextBlink <= 0 && s.blink === 0) {
      s.blink = 0.14
      s.nextBlink = 2 + Math.random() * 3.5
    }
    if (s.blink > 0) s.blink = Math.max(0, s.blink - dt)
    const eyeY = s.blink > 0 ? 0.08 : 1
    for (const e of [refs.eyeL.current, refs.eyeR.current]) {
      if (e) e.scale.y = THREE.MathUtils.damp(e.scale.y, eyeY, 30, dt)
    }
  })

  return (
    <group ref={root} visible={false}>
      <mesh ref={shadow} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.5, 20]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.14} depthWrite={false} />
      </mesh>
      <group ref={yaw}>
        {simple ? (
          <SimpleFigure avatar={peer?.avatar ?? normalizeAvatar(null)} />
        ) : (
          <Character avatar={peer?.avatar ?? normalizeAvatar(null)} refs={refs} />
        )}
      </group>
      <Html position={[0, 2.25, 0]} center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
        <div className="name-tag">{name}</div>
      </Html>
      {emote && (
        <Html position={[0, 2.8, 0]} center zIndexRange={[6, 0]} style={{ pointerEvents: 'none' }}>
          <div className="emote-bubble">{emote}</div>
        </Html>
      )}
    </group>
  )
}

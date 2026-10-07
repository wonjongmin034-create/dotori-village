import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { Character, type CharacterRefs } from './Character'
import { normalizeAvatar } from './avatar'
import { peers, useLive } from './live'

const MAX_SHOWN = 8 // 크롬북 성능을 위해 한 번에 그리는 친구 수

function dampAngle(current: number, target: number, lambda: number, dt: number) {
  let diff = target - current
  while (diff > Math.PI) diff -= Math.PI * 2
  while (diff < -Math.PI) diff += Math.PI * 2
  return current + diff * (1 - Math.exp(-lambda * dt))
}

// 같은 마을에 있는 친구들 — 받은 위치를 부드럽게 따라가며 걷는 모션을 보여 준다.
export function RemotePlayers() {
  const names = useLive((s) => s.names)
  return (
    <>
      {names.slice(0, MAX_SHOWN).map((n) => (
        <RemoteFigure key={n} name={n} />
      ))}
    </>
  )
}

function RemoteFigure({ name }: { name: string }) {
  const root = useRef<THREE.Group>(null)
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
  const st = useRef({ x: 0, z: 0, facing: 0, phase: 0, init: false, blink: 0, nextBlink: 2 })
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
    const age = Math.min(0.35, (performance.now() - p.at) / 1000)
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

    g.position.set(s.x, 0, s.z)
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
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.5, 20]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.14} depthWrite={false} />
      </mesh>
      <group ref={yaw}>
        <Character avatar={peer?.avatar ?? normalizeAvatar(null)} refs={refs} />
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

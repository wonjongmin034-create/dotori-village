import { useEffect, useMemo, useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { Toon } from './wearKit'
import { MONSTERS, PATH, SPOTS, TOWERS, TREE_POS, pathPos, type MonKind, type TowerKind } from './defData'
import { claimBox, useDef, defMe, type MonRow, type TowerRow } from './defState'

// 수비대 3D 장면 — 들판 · 길 · 빈 터 · 도토리 나무 · 탑 · 몬스터 · 공격 연출
export const PLAYER_COLORS = ['#e8524a', '#3a8fe0', '#3cb85a', '#f0b429']
export const colorOf = (members: string[], n: string) => PLAYER_COLORS[Math.max(0, members.indexOf(n)) % 4]

const tmpV = new THREE.Vector3()

// 몬스터 위치를 부드럽게: 장면을 받을 때마다 [이전 거리 → 새 거리]를 0.25초 동안 이어 준다
const monTrack = new Map<number, { d0: number; d1: number; t0: number }>()
const towerShot = new Map<number, number>() // 탑 id → 마지막으로 쏜 시각 (반동 연출)
type Fx = { k: 'shot' | 'boom'; kind?: TowerKind; from: [number, number]; to: [number, number]; at: number; r: number; air?: boolean }
const fxList: Fx[] = []

function useSnapTracking() {
  const snap = useDef((s) => s.snap)
  useEffect(() => {
    if (!snap) return
    const now = performance.now()
    const seen = new Set<number>()
    for (const m of snap.mons) {
      seen.add(m[0])
      const tr = monTrack.get(m[0])
      if (!tr) monTrack.set(m[0], { d0: m[2], d1: m[2], t0: now })
      else {
        const cur = tr.d0 + (tr.d1 - tr.d0) * Math.min(1, (now - tr.t0) / 260)
        monTrack.set(m[0], { d0: cur, d1: m[2], t0: now })
      }
    }
    for (const id of [...monTrack.keys()]) if (!seen.has(id)) monTrack.delete(id)
    const towers = new Map(snap.towers.map((t) => [t[0], t]))
    for (const [tid, mid] of snap.shots) {
      const t = towers.get(tid)
      const m = snap.mons.find((x) => x[0] === mid)
      if (!t) continue
      towerShot.set(tid, now)
      const to = m ? pathPos(m[2]) : SPOTS[t[1]]
      fxList.push({ k: 'shot', kind: t[2], from: SPOTS[t[1]], to, at: now, r: 0, air: m ? !!MONSTERS[m[1]].air : false })
    }
    for (const [x, z, r] of snap.booms) fxList.push({ k: 'boom', from: [x, z], to: [x, z], at: now, r })
    while (fxList.length > 80) fxList.shift()
  }, [snap])
}

/* ---------- 바닥 · 길 ---------- */
function Ground() {
  const segs = useMemo(
    () =>
      PATH.slice(1).map((b, i) => {
        const a = PATH[i]
        const len = Math.hypot(b[0] - a[0], b[1] - a[1])
        return { x: (a[0] + b[0]) / 2, z: (a[1] + b[1]) / 2, len, rot: Math.atan2(b[0] - a[0], b[1] - a[1]) }
      }),
    [],
  )
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow onClick={() => useDef.getState().sel && useDef.setState({ sel: null })}>
        <planeGeometry args={[40, 28]} />
        <Toon color="#7cc26a" />
      </mesh>
      {/* 바깥 테두리 언덕 */}
      {Array.from({ length: 18 }, (_, i) => {
        const a = (i / 18) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * 21, 0.6, Math.sin(a) * 14.5]} scale={[2.6, 1.4, 2.2]}>
            <sphereGeometry args={[1, 10, 8]} />
            <Toon color={i % 2 ? '#5fae5a' : '#6dbb63'} />
          </mesh>
        )
      })}
      {segs.map((s, i) => (
        <group key={i}>
          <mesh position={[s.x, 0.01, s.z]} rotation={[0, s.rot, 0]} receiveShadow>
            <boxGeometry args={[1.7, 0.04, s.len + 1.7]} />
            <Toon color="#d9b77a" />
          </mesh>
          <mesh position={[s.x, 0.0, s.z]} rotation={[0, s.rot, 0]}>
            <boxGeometry args={[2.0, 0.03, s.len + 2.0]} />
            <Toon color="#b8935a" />
          </mesh>
        </group>
      ))}
      {/* 시작 굴 */}
      <group position={[PATH[0][0] - 0.6, 0, PATH[0][1]]}>
        <mesh position={[0, 0.9, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[1.3, 1.3, 1.2, 16, 1, false, 0, Math.PI]} />
          <Toon color="#5a4636" />
        </mesh>
        <mesh position={[0.2, 0.75, 0]}>
          <boxGeometry args={[0.2, 1.4, 1.8]} />
          <Toon color="#2a1e18" />
        </mesh>
      </group>
    </group>
  )
}

/* ---------- 도토리 나무 ---------- */
function Tree() {
  const g = useRef<THREE.Group>(null)
  const lastTree = useRef(99)
  const hitAt = useRef(0)
  const tree = useDef((s) => s.snap?.tree ?? 20)
  useEffect(() => {
    if (tree < lastTree.current) hitAt.current = performance.now()
    lastTree.current = tree
  }, [tree])
  useFrame(() => {
    if (!g.current) return
    const k = Math.max(0, 1 - (performance.now() - hitAt.current) / 500)
    g.current.rotation.z = Math.sin(performance.now() / 30) * 0.05 * k
  })
  return (
    <group ref={g} position={[TREE_POS[0], 0, TREE_POS[1]]}>
      <mesh position={[0, 1.1, 0]}>
        <cylinderGeometry args={[0.38, 0.55, 2.2, 10]} />
        <Toon color="#7a5232" />
      </mesh>
      {[
        [0, 2.7, 0, 1.6],
        [-0.9, 2.3, 0.3, 1.0],
        [0.9, 2.4, -0.2, 1.05],
        [0, 3.4, -0.3, 1.0],
      ].map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]}>
          <sphereGeometry args={[r, 14, 12]} />
          <Toon color={i % 2 ? '#3f9a45' : '#4fae52'} />
        </mesh>
      ))}
      {[
        [0.7, 2.0, 1.2],
        [-0.8, 1.9, 0.9],
        [0.2, 2.5, 1.5],
        [1.3, 2.7, 0.5],
      ].map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh>
            <sphereGeometry args={[0.18, 10, 8]} />
            <Toon color="#b87333" />
          </mesh>
          <mesh position={[0, 0.13, 0]}>
            <sphereGeometry args={[0.15, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <Toon color="#6b4423" />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/* ---------- 빈 터 ---------- */
function Spots() {
  const snap = useDef((s) => s.snap)
  const sel = useDef((s) => s.sel)
  const used = new Set(snap?.towers.map((t) => t[1]) ?? [])
  const busy = new Map(snap?.busy ?? [])
  const pick = (i: number) => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    const s = useDef.getState()
    if (!s.snap || s.myQ) return
    useDef.setState({ sel: { t: 'spot', i } })
  }
  return (
    <group>
      {SPOTS.map(([x, z], i) => {
        if (used.has(i)) return null
        const b = busy.get(i)
        const on = sel?.t === 'spot' && sel.i === i
        return (
          <group key={i} position={[x, 0, z]} onClick={pick(i)}>
            <mesh position={[0, 0.08, 0]}>
              <cylinderGeometry args={[0.85, 0.95, 0.16, 18]} />
              <Toon color={on ? '#ffe08a' : '#c9b99a'} emissive={on ? '#ffcf4a' : undefined} ei={on ? 0.5 : 0} />
            </mesh>
            <mesh position={[0, 0.17, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.45, 0.6, 18]} />
              <meshBasicMaterial color={on ? '#ff9f1a' : '#a8977a'} />
            </mesh>
            {b && (
              <group>
                {/* 공사 중: 비계 + 짓는 사람 색 깃발 */}
                {[-0.4, 0.4].map((dx) => (
                  <mesh key={dx} position={[dx, 0.7, 0]}>
                    <boxGeometry args={[0.08, 1.2, 0.08]} />
                    <Toon color="#a07a4a" />
                  </mesh>
                ))}
                <mesh position={[0, 1.2, 0]}>
                  <boxGeometry args={[0.9, 0.08, 0.08]} />
                  <Toon color="#a07a4a" />
                </mesh>
                <mesh position={[0.15, 1.5, 0]}>
                  <boxGeometry args={[0.4, 0.26, 0.02]} />
                  <meshBasicMaterial color={colorOf(snap?.members ?? [], b)} />
                </mesh>
              </group>
            )}
          </group>
        )
      })}
    </group>
  )
}

/* ---------- 탑 ---------- */
function TowerModel({ kind, tier, br }: { kind: TowerKind; tier: number; br: number }) {
  const acc = ['', '#9aa3ad', '#7fb2e5', '#a37ee8', '#f0a020', '#ff6fae'][tier]
  const stone = '#b9b2a6'
  switch (kind) {
    case 'sword':
      return (
        <group>
          <mesh position={[0, 0.55, 0]}>
            <cylinderGeometry args={[0.6, 0.72, 1.1, 8]} />
            <Toon color={br === 1 ? '#8d97a6' : stone} />
          </mesh>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <mesh key={i} position={[Math.cos((i / 8) * Math.PI * 2) * 0.58, 1.18, Math.sin((i / 8) * Math.PI * 2) * 0.58]}>
              <boxGeometry args={[0.2, 0.2, 0.2]} />
              <Toon color={stone} />
            </mesh>
          ))}
          <mesh position={[0, 1.6, 0]}>
            <boxGeometry args={[0.1, 0.9, 0.04]} />
            <Toon color="#e8eef5" emissive={acc} ei={0.3} />
          </mesh>
          <mesh position={[0, 1.2, 0]}>
            <boxGeometry args={[0.4, 0.07, 0.07]} />
            <Toon color={acc} />
          </mesh>
        </group>
      )
    case 'hammer':
      return (
        <group>
          <mesh position={[0, 0.45, 0]}>
            <boxGeometry args={[1.1, 0.9, 1.0]} />
            <Toon color="#8a5a3a" />
          </mesh>
          <mesh position={[0, 1.05, 0]} rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[0.9, 0.5, 4]} />
            <Toon color="#6e3d28" />
          </mesh>
          <mesh position={[0.35, 1.2, -0.25]}>
            <cylinderGeometry args={[0.1, 0.12, 0.6, 8]} />
            <Toon color="#555" />
          </mesh>
          <mesh position={[0, 0.25, 0.6]}>
            <boxGeometry args={[0.5, 0.25, 0.3]} />
            <Toon color="#4a4f57" emissive={acc} ei={0.25} />
          </mesh>
        </group>
      )
    case 'bow':
      return (
        <group>
          {[
            [-0.35, -0.35],
            [0.35, -0.35],
            [-0.35, 0.35],
            [0.35, 0.35],
          ].map(([x, z], i) => (
            <mesh key={i} position={[x, 0.7, z]}>
              <boxGeometry args={[0.12, 1.4, 0.12]} />
              <Toon color="#9b6a3c" />
            </mesh>
          ))}
          <mesh position={[0, 1.45, 0]}>
            <boxGeometry args={[1.0, 0.14, 1.0]} />
            <Toon color="#b07a48" />
          </mesh>
          <mesh position={[0, 1.85, 0]} rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[0.75, 0.6, 4]} />
            <Toon color={br === 2 ? '#2f6f3a' : '#3f8f4a'} />
          </mesh>
          <mesh position={[0, 1.6, 0.52]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.28, 0.035, 6, 12, Math.PI]} />
            <Toon color={acc} />
          </mesh>
        </group>
      )
    case 'staff':
      return (
        <group>
          <mesh position={[0, 0.8, 0]}>
            <cylinderGeometry args={[0.32, 0.6, 1.6, 8]} />
            <Toon color="#6c4fb8" />
          </mesh>
          <mesh position={[0, 1.9, 0]}>
            <coneGeometry args={[0.45, 0.8, 8]} />
            <Toon color="#4a3590" />
          </mesh>
          <mesh position={[0, 2.5, 0]}>
            <sphereGeometry args={[0.22, 12, 10]} />
            <Toon color={br === 1 ? '#ff7a3a' : br === 2 ? '#8fdcff' : '#d8b4ff'} emissive={br === 1 ? '#ff5a1a' : br === 2 ? '#5ec8ff' : '#b67bff'} ei={0.8} />
          </mesh>
        </group>
      )
    case 'axe':
      return (
        <group>
          <mesh position={[0, 0.3, 0]}>
            <boxGeometry args={[1.1, 0.35, 0.9]} />
            <Toon color="#8a6040" />
          </mesh>
          {[-0.5, 0.5].map((x) => (
            <mesh key={x} position={[x, 0.25, 0.45]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.22, 0.22, 0.12, 12]} />
              <Toon color="#5a3f2a" />
            </mesh>
          ))}
          <group position={[0, 0.55, 0]} rotation={[-0.6, 0, 0]}>
            <mesh position={[0, 0.5, 0]}>
              <boxGeometry args={[0.12, 1.1, 0.12]} />
              <Toon color="#7a5232" />
            </mesh>
            <mesh position={[0, 1.05, 0]}>
              <sphereGeometry args={[0.2, 10, 8]} />
              <Toon color="#8f8a84" emissive={acc} ei={0.2} />
            </mesh>
          </group>
        </group>
      )
    default:
      return (
        <group>
          <mesh position={[0, 0.12, 0]}>
            <cylinderGeometry args={[0.75, 0.8, 0.24, 12]} />
            <Toon color="#7d6b58" />
          </mesh>
          {Array.from({ length: 7 }, (_, i) => {
            const a = (i / 7) * Math.PI * 2
            return (
              <mesh key={i} position={[Math.cos(a) * 0.45, 0.55, Math.sin(a) * 0.45]} rotation={[Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3]}>
                <coneGeometry args={[0.09, 0.8, 6]} />
                <Toon color={br === 1 ? '#6fd36f' : '#d8dde4'} emissive={acc} ei={0.2} />
              </mesh>
            )
          })}
          <mesh position={[0, 0.7, 0]}>
            <coneGeometry args={[0.12, 1.1, 6]} />
            <Toon color={acc} />
          </mesh>
        </group>
      )
  }
}

function Bar({ pct, y, w = 1.0, color }: { pct: number; y: number; w?: number; color: string }) {
  return (
    <group position={[0, y, 0]} rotation={[-0.9, 0, 0]}>
      <mesh>
        <planeGeometry args={[w, 0.12]} />
        <meshBasicMaterial color="#222" transparent opacity={0.6} depthWrite={false} />
      </mesh>
      <mesh position={[(-w * (1 - pct / 100)) / 2, 0, 0.001]}>
        <planeGeometry args={[(w * pct) / 100, 0.09]} />
        <meshBasicMaterial color={color} depthWrite={false} />
      </mesh>
    </group>
  )
}

function Tower({ row, members, selected }: { row: TowerRow; members: string[]; selected: boolean }) {
  const [id, spot, kind, tier, br, owner, hp, spec, perfect] = row
  const g = useRef<THREE.Group>(null)
  const [x, z] = SPOTS[spot]
  useFrame(() => {
    if (!g.current) return
    const k = Math.max(0, 1 - (performance.now() - (towerShot.get(id) ?? 0)) / 180)
    const s = 1.05 + tier * 0.1
    g.current.scale.set(s * (1 + k * 0.08), s * (1 - k * 0.1), s * (1 + k * 0.08))
  })
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    if (useDef.getState().myQ) return
    useDef.setState({ sel: { t: 'tower', id } })
  }
  const color = colorOf(members, owner)
  return (
    <group position={[x, 0, z]} onClick={onClick}>
      <group ref={g}>
        <TowerModel kind={kind} tier={tier} br={br} />
      </group>
      {/* 주인 깃발 */}
      <mesh position={[-0.7, 0.7, 0]}>
        <boxGeometry args={[0.04, 1.4, 0.04]} />
        <Toon color="#6b5a46" />
      </mesh>
      <mesh position={[-0.53, 1.25, 0]}>
        <boxGeometry args={[0.32, 0.22, 0.02]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {/* 단계 표시 · 전문가 · 완벽 시공 */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.9, 1.0, 24]} />
        <meshBasicMaterial color={selected ? '#ffd23c' : spec ? '#ffb83d' : color} transparent opacity={selected ? 1 : 0.7} />
      </mesh>
      {tier >= 5 && (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.02, 1.12, 24]} />
          <meshBasicMaterial color="#ff6fae" />
        </mesh>
      )}
      {perfect ? (
        <mesh position={[0.65, 1.6, 0]}>
          <octahedronGeometry args={[0.12]} />
          <meshBasicMaterial color="#ffd23c" />
        </mesh>
      ) : null}
      {hp < 100 && <Bar pct={hp} y={2.6} color={hp > 50 ? '#4cd964' : hp > 25 ? '#ffcc00' : '#ff3b30'} />}
      {[...Array(tier)].map((_, i) => (
        <mesh key={i} position={[-0.32 + i * 0.16, 0.02, 0.92]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.06, 8]} />
          <meshBasicMaterial color={TOWERS[kind] ? '#fff3c4' : '#fff'} />
        </mesh>
      ))}
    </group>
  )
}

/* ---------- 몬스터 ---------- */
function MonModel({ kind }: { kind: MonKind }) {
  switch (kind) {
    case 'slime':
      return (
        <mesh position={[0, 0.3, 0]} scale={[1, 0.75, 1]}>
          <sphereGeometry args={[0.38, 14, 10]} />
          <Toon color="#5fd068" />
        </mesh>
      )
    case 'blob':
      return (
        <mesh position={[0, 0.45, 0]} scale={[1, 0.8, 1]}>
          <sphereGeometry args={[0.6, 16, 12]} />
          <Toon color="#7fc8f0" />
        </mesh>
      )
    case 'bat':
      return (
        <group position={[0, 1.6, 0]}>
          <mesh>
            <sphereGeometry args={[0.25, 10, 8]} />
            <Toon color="#4a3a5a" />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.4, 0.05, 0]} rotation={[0, 0, s * 0.3]}>
              <boxGeometry args={[0.55, 0.04, 0.3]} />
              <Toon color="#2f2440" />
            </mesh>
          ))}
        </group>
      )
    case 'turtle':
      return (
        <group>
          <mesh position={[0, 0.35, 0]} scale={[1, 0.65, 1.15]}>
            <sphereGeometry args={[0.55, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <Toon color="#6f7f8f" />
          </mesh>
          <mesh position={[0, 0.25, 0.62]}>
            <sphereGeometry args={[0.2, 10, 8]} />
            <Toon color="#9bc28a" />
          </mesh>
        </group>
      )
    case 'fox':
      return (
        <group>
          <mesh position={[0, 0.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <capsuleGeometry args={[0.2, 0.45, 4, 8]} />
            <Toon color="#f08a2e" />
          </mesh>
          <mesh position={[0, 0.5, 0.42]}>
            <coneGeometry args={[0.18, 0.35, 8]} />
            <Toon color="#f6a24e" />
          </mesh>
          <mesh position={[0, 0.45, -0.45]} rotation={[-0.8, 0, 0]}>
            <coneGeometry args={[0.13, 0.5, 8]} />
            <Toon color="#fff4e6" />
          </mesh>
        </group>
      )
    case 'goblin':
      return (
        <group>
          <mesh position={[0, 0.5, 0]}>
            <capsuleGeometry args={[0.26, 0.4, 4, 8]} />
            <Toon color="#6aa84f" />
          </mesh>
          <mesh position={[0, 1.0, 0]}>
            <sphereGeometry args={[0.24, 10, 8]} />
            <Toon color="#7cbf5a" />
          </mesh>
          <mesh position={[0.32, 0.65, 0.1]} rotation={[0, 0, -0.5]}>
            <boxGeometry args={[0.06, 0.6, 0.06]} />
            <Toon color="#7a5232" />
          </mesh>
          <mesh position={[0.45, 0.88, 0.1]}>
            <boxGeometry args={[0.24, 0.18, 0.04]} />
            <Toon color="#c7ccd2" />
          </mesh>
        </group>
      )
    case 'bomb':
      return (
        <group>
          <mesh position={[0, 0.32, 0]}>
            <sphereGeometry args={[0.3, 12, 10]} />
            <Toon color="#2e2e36" />
          </mesh>
          <mesh position={[0, 0.66, 0]}>
            <sphereGeometry args={[0.07, 6, 6]} />
            <meshBasicMaterial color="#ff8a1a" />
          </mesh>
        </group>
      )
    default:
      return (
        <group scale={1.7}>
          <mesh position={[0, 0.55, 0]}>
            <sphereGeometry args={[0.5, 16, 12]} />
            <Toon color="#7a3fb0" />
          </mesh>
          {[-0.18, 0.18].map((x) => (
            <mesh key={x} position={[x, 0.65, 0.42]}>
              <sphereGeometry args={[0.07, 8, 6]} />
              <meshBasicMaterial color="#ffef5a" />
            </mesh>
          ))}
          {Array.from({ length: 5 }, (_, i) => {
            const a = (i / 5) * Math.PI * 2
            return (
              <mesh key={i} position={[Math.cos(a) * 0.25, 1.1, Math.sin(a) * 0.25]}>
                <coneGeometry args={[0.07, 0.25, 4]} />
                <Toon color="#ffd23c" emissive="#ffb000" ei={0.4} />
              </mesh>
            )
          })}
        </group>
      )
  }
}

function Monster({ row }: { row: MonRow }) {
  const [id, kind, , hp, fx] = row
  const g = useRef<THREE.Group>(null)
  const body = useRef<THREE.Group>(null)
  useFrame(() => {
    const tr = monTrack.get(id)
    if (!tr || !g.current) return
    const now = performance.now()
    const d = tr.d0 + (tr.d1 - tr.d0) * Math.min(1, (now - tr.t0) / 260)
    const [x, z] = pathPos(d)
    const [x2, z2] = pathPos(d + 0.3)
    g.current.position.set(x, 0, z)
    g.current.rotation.y = Math.atan2(x2 - x, z2 - z)
    if (body.current) {
      const hop = kind === 'slime' || kind === 'blob' ? Math.abs(Math.sin(now / 160 + id)) * 0.15 : kind === 'bat' ? Math.sin(now / 120 + id) * 0.12 : 0
      body.current.position.y = hop
    }
  })
  const big = kind === 'king' ? 3.3 : kind === 'blob' ? 1.6 : kind === 'bat' ? 2.6 : 1.6
  return (
    <group ref={g}>
      <group ref={body} scale={1.3}>
        <MonModel kind={kind} />
      </group>
      {fx & 16 ? (
        <mesh position={[0, big + 0.25, 0]}>
          <torusGeometry args={[0.25, 0.04, 6, 12]} />
          <meshBasicMaterial color="#ffef5a" />
        </mesh>
      ) : null}
      {fx & 1 ? (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.5, 12]} />
          <meshBasicMaterial color="#8fdcff" transparent opacity={0.5} />
        </mesh>
      ) : null}
      {fx & 2 ? (
        <mesh position={[0, 0.3, 0]}>
          <torusGeometry args={[0.45, 0.05, 6, 14]} />
          <meshBasicMaterial color="#e0e4ea" />
        </mesh>
      ) : null}
      {fx & 4 ? (
        <mesh position={[0, 0.9, 0]}>
          <coneGeometry args={[0.12, 0.3, 6]} />
          <meshBasicMaterial color="#ff6a1a" />
        </mesh>
      ) : null}
      {hp < 100 && <Bar pct={hp} y={big} w={kind === 'king' ? 1.8 : 0.8} color={fx & 8 ? '#9b59d6' : '#ff4d4d'} />}
    </group>
  )
}

/* ---------- 공격 연출 ---------- */
const SHOT_COLOR: Record<TowerKind, string> = { sword: '#cfe8ff', hammer: '#ffb84d', bow: '#c8a26a', staff: '#c79bff', axe: '#8f8a84', spear: '#e0e4ea' }
function Effects() {
  const pool = useRef<(THREE.Mesh | null)[]>([])
  const rings = useRef<(THREE.Mesh | null)[]>([])
  useFrame(() => {
    const now = performance.now()
    let si = 0
    let ri = 0
    for (const f of fxList) {
      const age = (now - f.at) / (f.k === 'shot' ? 260 : 420)
      if (age >= 1) continue
      if (f.k === 'shot') {
        const m = pool.current[si++]
        if (!m) continue
        const melee = f.kind === 'sword' || f.kind === 'spear' || f.kind === 'hammer'
        const t = melee ? 1 : age
        const arc = f.kind === 'axe' ? Math.sin(t * Math.PI) * 2 : 0
        tmpV.set(f.from[0] + (f.to[0] - f.from[0]) * t, 1.4 + (f.air ? 0.4 : -0.9) * t + arc, f.from[1] + (f.to[1] - f.from[1]) * t)
        m.position.copy(tmpV)
        m.visible = true
        m.scale.setScalar(melee ? 1.4 * (1 - age) + 0.3 : f.kind === 'axe' ? 1.5 : 1)
        ;(m.material as THREE.MeshBasicMaterial).color.set(SHOT_COLOR[f.kind ?? 'bow'])
      } else {
        const m = rings.current[ri++]
        if (!m) continue
        m.position.set(f.from[0], 0.15, f.from[1])
        m.scale.setScalar(0.3 + age * f.r)
        m.visible = true
        ;(m.material as THREE.MeshBasicMaterial).opacity = 0.7 * (1 - age)
      }
    }
    for (; si < pool.current.length; si++) if (pool.current[si]) pool.current[si]!.visible = false
    for (; ri < rings.current.length; ri++) if (rings.current[ri]) rings.current[ri]!.visible = false
  })
  return (
    <group>
      {Array.from({ length: 40 }, (_, i) => (
        <mesh key={i} ref={(el) => void (pool.current[i] = el)} visible={false}>
          <sphereGeometry args={[0.12, 8, 6]} />
          <meshBasicMaterial color="#fff" />
        </mesh>
      ))}
      {Array.from({ length: 16 }, (_, i) => (
        <mesh key={i} ref={(el) => void (rings.current[i] = el)} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
          <ringGeometry args={[0.8, 1, 24]} />
          <meshBasicMaterial color="#ffd27a" transparent opacity={0.6} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

/* ---------- 보급 상자 ---------- */
function SupplyBox() {
  const box = useDef((s) => s.snap?.box ?? -1)
  const g = useRef<THREE.Group>(null)
  useFrame(() => {
    if (g.current) {
      g.current.position.y = 0.4 + Math.sin(performance.now() / 250) * 0.12
      g.current.rotation.y += 0.02
    }
  })
  if (box < 0) return null
  const [x, z] = pathPos(box)
  return (
    <group
      position={[x, 0, z]}
      onClick={(e) => {
        e.stopPropagation()
        claimBox()
      }}
    >
      <group ref={g}>
        <mesh>
          <boxGeometry args={[0.7, 0.6, 0.7]} />
          <Toon color="#e8524a" emissive="#ff6a3a" ei={0.3} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.16, 0.62, 0.72]} />
          <Toon color="#ffd23c" />
        </mesh>
        <mesh>
          <boxGeometry args={[0.72, 0.62, 0.16]} />
          <Toon color="#ffd23c" />
        </mesh>
      </group>
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.6, 0.8, 20]} />
        <meshBasicMaterial color="#ffd23c" />
      </mesh>
    </group>
  )
}

export function DefenseArena() {
  useSnapTracking()
  const snap = useDef((s) => s.snap)
  const sel = useDef((s) => s.sel)
  const members = snap?.members ?? []
  void defMe
  return (
    <group>
      <Ground />
      <Tree />
      <Spots />
      {snap?.towers.map((t) => <Tower key={t[0]} row={t} members={members} selected={sel?.t === 'tower' && sel.id === t[0]} />)}
      {snap?.mons.map((m) => <Monster key={m[0]} row={m} />)}
      <Effects />
      <SupplyBox />
    </group>
  )
}

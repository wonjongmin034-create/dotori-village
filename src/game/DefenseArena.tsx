import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { Toon } from './wearKit'
import { toonGradient } from './toon'
import { Baked } from './Baked'
import { Water } from './Water'
import { ArrowModel } from './ArrowModel'
import { PATH, SPOTS, TREE_HP, TREE_POS, pathPos, type MonKind, type TowerKind } from './defData'
import { claimBox, useDef, type MonRow, type TowerRow } from './defState'
import { AcornTree, BuildPad, MonModel, MonsterDen, TowerModel, KIND_COLOR, type MonAnim, type TowerAnim } from './defModels'

// 수비대 3D 장면 — 바다 위의 섬 · 돌길 · 빈 터 · 큰 도토리 나무 · 몬스터 굴 · 탑 · 몬스터 · 공격 연출
export const PLAYER_COLORS = ['#e8524a', '#3a8fe0', '#3cb85a', '#f0b429']
export const colorOf = (members: string[], n: string) => PLAYER_COLORS[Math.max(0, members.indexOf(n)) % 4]

const PI = Math.PI
// 섬 크기 (가운데가 x=-0.5)
const CX = -0.5
const HX = 16.5
const HZ = 11.6
const DEN_POS: [number, number] = [-15.2, PATH[0][1]]

/* ---------- 장면 상태 (리렌더 없이 매 프레임 읽는 값) ---------- */
const monTrack = new Map<number, { d0: number; d1: number; t0: number; hp: number }>()
const monAnim = new Map<number, MonAnim>()
const towerAnim = new Map<number, TowerAnim>()
type Fx = { k: 'arrow' | 'orb' | 'rock' | 'slash' | 'boom'; color: string; from: THREE.Vector3; to: THREE.Vector3; at: number; dur: number; r: number }
const fxList: Fx[] = []
const treeHit = { v: 0 }

const SHOT_H: Record<TowerKind, number> = { sword: 1.6, hammer: 1.0, bow: 2.3, staff: 2.6, axe: 1.6, spear: 0.9 }
const ORB_COLOR = ['#d8b4ff', '#ff7a3a', '#8fdcff']
const MON_H: Record<MonKind, number> = { slime: 0.35, blob: 0.5, bat: 1.5, turtle: 0.4, fox: 0.5, goblin: 0.7, bomb: 0.4, king: 1.2 }

function useSnapTracking() {
  const snap = useDef((s) => s.snap)
  const lastTree = useRef(TREE_HP)
  useEffect(() => {
    if (!snap) return
    const now = performance.now()
    if (snap.tree < lastTree.current) treeHit.v = now
    lastTree.current = snap.tree
    const seen = new Set<number>()
    for (const m of snap.mons) {
      seen.add(m[0])
      const tr = monTrack.get(m[0])
      if (!tr) monTrack.set(m[0], { d0: m[2], d1: m[2], t0: now, hp: m[3] })
      else {
        const cur = tr.d0 + (tr.d1 - tr.d0) * Math.min(1, (now - tr.t0) / 260)
        if (m[3] < tr.hp) {
          const a = monAnim.get(m[0])
          if (a) a.hitAt = now
        }
        monTrack.set(m[0], { d0: cur, d1: m[2], t0: now, hp: m[3] })
      }
    }
    for (const id of [...monTrack.keys()])
      if (!seen.has(id)) {
        monTrack.delete(id)
        monAnim.delete(id)
      }
    const towers = new Map(snap.towers.map((t) => [t[0], t]))
    for (const [tid, mid] of snap.shots) {
      const t = towers.get(tid)
      if (!t) continue
      const [, spot, kind, , br] = t
      const m = snap.mons.find((x) => x[0] === mid)
      const [sx, sz] = SPOTS[spot]
      const d = m ? m[2] : 0
      const [mx, mz] = m ? pathPos(d) : [sx, sz]
      const mh = m ? MON_H[m[1]] : 0.4
      const an = towerAnim.get(tid)
      if (an) {
        an.fireAt = now
        an.aim = Math.atan2(mx - sx, mz - sz)
      }
      const from = new THREE.Vector3(sx, SHOT_H[kind], sz)
      const to = new THREE.Vector3(mx, mh, mz)
      if (kind === 'bow') fxList.push({ k: 'arrow', color: br === 2 ? '#3a7f8a' : '#ff6a6a', from, to, at: now, dur: 230, r: 0 })
      else if (kind === 'staff') fxList.push({ k: 'orb', color: ORB_COLOR[br] ?? ORB_COLOR[0], from, to, at: now, dur: 300, r: 0 })
      else if (kind === 'axe') fxList.push({ k: 'rock', color: br === 1 ? '#3a3a42' : '#9a9286', from, to, at: now, dur: 480, r: 0 })
      else fxList.push({ k: 'slash', color: kind === 'sword' ? '#bfe0ff' : kind === 'spear' ? '#f6f0c8' : '#ffb84d', from: to.clone(), to, at: now, dur: 240, r: kind === 'sword' ? 0.7 : 0.5 })
    }
    for (const [x, z, r] of snap.booms) fxList.push({ k: 'boom', color: '#ffd27a', from: new THREE.Vector3(x, 0.2, z), to: new THREE.Vector3(x, 0.2, z), at: now + 0, dur: 480, r })
    while (fxList.length > 120) fxList.shift()
  }, [snap])
}

/* ---------- 땅: 섬 · 모래 · 바다 · 돌길 ---------- */
function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
function distToPath(x: number, z: number) {
  let best = 1e9
  for (let i = 1; i < PATH.length; i++) {
    const [ax, az] = PATH[i - 1]
    const [bx, bz] = PATH[i]
    const dx = bx - ax
    const dz = bz - az
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)))
    best = Math.min(best, Math.hypot(x - ax - t * dx, z - az - t * dz))
  }
  return best
}
const freeAt = (x: number, z: number, pathGap: number, spotGap: number) =>
  distToPath(x, z) > pathGap &&
  SPOTS.every(([sx, sz]) => Math.hypot(sx - x, sz - z) > spotGap) &&
  Math.hypot(x - TREE_POS[0], z - TREE_POS[1]) > 2.8 &&
  Math.hypot(x - DEN_POS[0], z - DEN_POS[1]) > 3.2

// 같은 모양 여러 개를 한 번에 (풀·꽃·자갈)
function Instances({ geo, items, flat = false }: { geo: THREE.BufferGeometry; items: { p: [number, number, number]; s: [number, number, number]; r: number; c: string }[]; flat?: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const mat = useMemo(() => (flat ? new THREE.MeshBasicMaterial() : new THREE.MeshToonMaterial({ gradientMap: toonGradient })), [flat])
  useLayoutEffect(() => {
    const m = ref.current
    if (!m) return
    const o = new THREE.Object3D()
    const c = new THREE.Color()
    items.forEach((it, i) => {
      o.position.set(...it.p)
      o.rotation.set(0, it.r, 0)
      o.scale.set(...it.s)
      o.updateMatrix()
      m.setMatrixAt(i, o.matrix)
      m.setColorAt(i, c.set(it.c))
    })
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [items])
  return <instancedMesh ref={ref} args={[geo, mat, items.length]} userData={{ noBake: true }} />
}

function Ground() {
  const clear = () => useDef.getState().sel && useDef.setState({ sel: null })
  const segs = useMemo(
    () =>
      PATH.slice(1).map((b, i) => {
        const a = PATH[i]
        const len = Math.hypot(b[0] - a[0], b[1] - a[1])
        return { x: (a[0] + b[0]) / 2, z: (a[1] + b[1]) / 2, len, rot: Math.atan2(b[0] - a[0], b[1] - a[1]) }
      }),
    [],
  )
  // 돌길의 자갈과 가장자리 돌
  const cobbles = useMemo(() => {
    const r = rng(7)
    const out: { p: [number, number, number]; s: [number, number, number]; r: number; c: string }[] = []
    const cols = ['#c9b48e', '#bba680', '#d4c19a', '#b09a74']
    const total = PATH.slice(1).reduce((s, b, i) => s + Math.hypot(b[0] - PATH[i][0], b[1] - PATH[i][1]), 0)
    for (let d = 0.3; d < total; d += 0.34) {
      const [x, z] = pathPos(d)
      const [x2, z2] = pathPos(d + 0.1)
      const nx = -(z2 - z)
      const nz = x2 - x
      const nl = Math.hypot(nx, nz) || 1
      for (let k = 0; k < 2; k++) {
        const off = (r() - 0.5) * 1.3
        out.push({ p: [x + (nx / nl) * off, 0.035, z + (nz / nl) * off], s: [0.2 + r() * 0.12, 0.05, 0.16 + r() * 0.1], r: r() * PI, c: cols[Math.floor(r() * cols.length)] })
      }
    }
    return out
  }, [])
  const edges = useMemo(() => {
    const r = rng(11)
    const out: { p: [number, number, number]; s: [number, number, number]; r: number; c: string }[] = []
    const total = PATH.slice(1).reduce((s, b, i) => s + Math.hypot(b[0] - PATH[i][0], b[1] - PATH[i][1]), 0)
    for (let d = 0.2; d < total; d += 0.62) {
      const [x, z] = pathPos(d)
      const [x2, z2] = pathPos(d + 0.1)
      const nx = -(z2 - z)
      const nz = x2 - x
      const nl = Math.hypot(nx, nz) || 1
      for (const side of [-1, 1]) {
        const px = x + (nx / nl) * 1.02 * side
        const pz = z + (nz / nl) * 1.02 * side
        if (distToPath(px, pz) < 0.95) continue
        const sc = 0.14 + r() * 0.1
        out.push({ p: [px, 0.06, pz], s: [sc * 1.3, sc * 0.8, sc], r: r() * PI, c: r() < 0.5 ? '#a8a094' : '#968e82' })
      }
    }
    return out
  }, [])
  const sphere = useMemo(() => new THREE.SphereGeometry(1, 8, 6), [])
  return (
    <group>
      <Water half={HX + 1.4} halfZ={HZ + 1.4} rounded={0.7} />
      <group position={[CX, 0, 0]}>
        <mesh position={[0, -0.7, 0]} userData={{ noShadow: true }}>
          <boxGeometry args={[HX * 2 + 2.2, 0.5, HZ * 2 + 2.2]} />
          <meshToonMaterial gradientMap={toonGradient} color="#b9946a" />
        </mesh>
        <RoundedBox args={[HX * 2 + 2.6, 0.45, HZ * 2 + 2.6]} radius={0.3} smoothness={3} position={[0, -0.42, 0]} receiveShadow>
          <meshToonMaterial gradientMap={toonGradient} color="#ecdcac" />
        </RoundedBox>
        <RoundedBox args={[HX * 2, 0.55, HZ * 2]} radius={0.22} smoothness={3} position={[0, -0.26, 0]} receiveShadow onClick={clear}>
          <meshToonMaterial gradientMap={toonGradient} color="#79c556" />
        </RoundedBox>
      </group>
      <Baked>
        {/* 잔디 얼룩 */}
        {(
          [
            [-9, 6.5, 3.2, '#86cf63'],
            [2, -3, 2.6, '#86cf63'],
            [-2, 7.5, 2.4, '#6db84f'],
            [12, -1, 3, '#6db84f'],
            [-11, -9, 2.8, '#86cf63'],
            [6, 9.5, 2.2, '#86cf63'],
            [4, 2.6, 1.8, '#6db84f'],
          ] as [number, number, number, string][]
        ).map(([x, z, r, c], i) => (
          <mesh key={i} position={[x, 0.012, z]} rotation={[-PI / 2, 0, 0]} scale={[1, 0.7, 1]}>
            <circleGeometry args={[r, 20]} />
            <meshToonMaterial gradientMap={toonGradient} color={c} />
          </mesh>
        ))}
        {/* 흙길 */}
        {segs.map((s, i) => (
          <group key={i}>
            <mesh position={[s.x, 0.012, s.z]} rotation={[0, s.rot, 0]}>
              <boxGeometry args={[2.0, 0.025, s.len]} />
              <meshToonMaterial gradientMap={toonGradient} color="#b8935a" />
            </mesh>
            <mesh position={[s.x, 0.022, s.z]} rotation={[0, s.rot, 0]}>
              <boxGeometry args={[1.7, 0.025, s.len]} />
              <meshToonMaterial gradientMap={toonGradient} color="#dcc08a" />
            </mesh>
          </group>
        ))}
        {PATH.map(([x, z], i) => (
          <group key={i}>
            <mesh position={[x, 0.012, z]}>
              <cylinderGeometry args={[1.0, 1.0, 0.025, 20]} />
              <meshToonMaterial gradientMap={toonGradient} color="#b8935a" />
            </mesh>
            <mesh position={[x, 0.022, z]}>
              <cylinderGeometry args={[0.85, 0.85, 0.025, 20]} />
              <meshToonMaterial gradientMap={toonGradient} color="#dcc08a" />
            </mesh>
          </group>
        ))}
      </Baked>
      <Instances geo={sphere} items={cobbles} />
      <Instances geo={sphere} items={edges} />
    </group>
  )
}

/* ---------- 장식: 나무 · 덤불 · 바위 · 꽃 · 풀 ---------- */
function Decor() {
  const d = useMemo(() => {
    const r = rng(42)
    const trees: [number, number, number, number][] = []
    const bushes: [number, number, number][] = []
    const rocks: [number, number, number][] = []
    const flowers: { p: [number, number, number]; s: [number, number, number]; r: number; c: string }[] = []
    const tufts: { p: [number, number, number]; s: [number, number, number]; r: number; c: string }[] = []
    const pick = (gapPath: number, gapSpot: number, edge = false) => {
      for (let k = 0; k < 40; k++) {
        const x = CX + (r() * 2 - 1) * (HX - 0.6)
        const z = (r() * 2 - 1) * (HZ - 0.6)
        if (edge && !(z < -HZ + 2.8 || (Math.abs(x - CX) > HX - 3.0 && z < 5))) continue
        if (freeAt(x, z, gapPath, gapSpot)) return [x, z] as [number, number]
      }
      return null
    }
    for (let i = 0; i < 30; i++) {
      const p = pick(2.4, 2.0, true)
      if (p) trees.push([p[0], p[1], 0.8 + r() * 0.5, Math.floor(r() * 3)])
    }

    for (let i = 0; i < 34; i++) {
      const p = pick(1.7, 1.5)
      if (p) bushes.push([p[0], p[1], 0.35 + r() * 0.3])
    }
    for (let i = 0; i < 22; i++) {
      const p = pick(1.6, 1.4)
      if (p) rocks.push([p[0], p[1], 0.2 + r() * 0.35])
    }
    const fc = ['#f2c14e', '#e8618c', '#8fb3f0', '#d38ee8', '#ffffff', '#ff9a6b']
    for (let i = 0; i < 220; i++) {
      const p = pick(1.35, 1.2)
      if (p) flowers.push({ p: [p[0], 0.14, p[1]], s: [0.09, 0.06, 0.09], r: 0, c: fc[Math.floor(r() * fc.length)] })
    }
    const gc = ['#69bd58', '#7bcb67', '#5aa84f', '#86d179']
    for (let i = 0; i < 380; i++) {
      const p = pick(1.25, 1.1)
      if (p) tufts.push({ p: [p[0], 0.1, p[1]], s: [0.08, 0.22 + r() * 0.12, 0.08], r: r() * PI, c: gc[Math.floor(r() * gc.length)] })
    }
    return { trees, bushes, rocks, flowers, tufts }
  }, [])
  const flowerGeo = useMemo(() => new THREE.SphereGeometry(1, 6, 4), [])
  const tuftGeo = useMemo(() => new THREE.ConeGeometry(1, 1, 4), [])
  const LEAF = ['#4fa24a', '#5bb257', '#3f8f45']
  return (
    <group>
      <Baked>
        {d.trees.map(([x, z, s, k], i) => (
          <group key={i} position={[x, 0, z]} scale={s}>
            <mesh position={[0, 0.7, 0]}>
              <cylinderGeometry args={[0.16, 0.24, 1.4, 8]} />
              <meshToonMaterial gradientMap={toonGradient} color="#7a5232" />
            </mesh>
            {k === 2 ? (
              // 뾰족한 침엽수
              <>
                <mesh position={[0, 1.6, 0]}>
                  <coneGeometry args={[0.95, 1.4, 8]} />
                  <meshToonMaterial gradientMap={toonGradient} color="#3f8f55" />
                </mesh>
                <mesh position={[0, 2.35, 0]}>
                  <coneGeometry args={[0.7, 1.1, 8]} />
                  <meshToonMaterial gradientMap={toonGradient} color="#4fa262" />
                </mesh>
              </>
            ) : (
              <>
                <mesh position={[0, 1.85, 0]}>
                  <sphereGeometry args={[0.95, 12, 9]} />
                  <meshToonMaterial gradientMap={toonGradient} color={LEAF[k]} />
                </mesh>
                <mesh position={[0.5, 1.55, 0.2]}>
                  <sphereGeometry args={[0.6, 10, 8]} />
                  <meshToonMaterial gradientMap={toonGradient} color={LEAF[(k + 1) % 3]} />
                </mesh>
                <mesh position={[-0.45, 1.6, -0.15]}>
                  <sphereGeometry args={[0.62, 10, 8]} />
                  <meshToonMaterial gradientMap={toonGradient} color={LEAF[(k + 2) % 3]} />
                </mesh>
                {k === 1 &&
                  [
                    [0.5, 1.9, 0.7],
                    [-0.6, 2.0, 0.45],
                  ].map((p, j) => (
                    <mesh key={j} position={p as [number, number, number]}>
                      <sphereGeometry args={[0.1, 8, 6]} />
                      <meshToonMaterial gradientMap={toonGradient} color="#e8524a" />
                    </mesh>
                  ))}
              </>
            )}
          </group>
        ))}
        {d.bushes.map(([x, z, s], i) => (
          <group key={i} position={[x, 0, z]} scale={s}>
            <mesh position={[0, 0.45, 0]}>
              <sphereGeometry args={[0.7, 10, 8]} />
              <meshToonMaterial gradientMap={toonGradient} color={LEAF[i % 3]} />
            </mesh>
            <mesh position={[0.5, 0.3, 0.1]}>
              <sphereGeometry args={[0.5, 10, 8]} />
              <meshToonMaterial gradientMap={toonGradient} color={LEAF[(i + 1) % 3]} />
            </mesh>
            <mesh position={[-0.45, 0.32, 0]}>
              <sphereGeometry args={[0.48, 10, 8]} />
              <meshToonMaterial gradientMap={toonGradient} color={LEAF[(i + 2) % 3]} />
            </mesh>
          </group>
        ))}
        {d.rocks.map(([x, z, s], i) => (
          <mesh key={i} position={[x, s * 0.35, z]} rotation={[i, i * 1.3, 0]} scale={[s * 1.3, s, s * 1.1]}>
            <dodecahedronGeometry args={[1, 0]} />
            <meshToonMaterial gradientMap={toonGradient} color={i % 2 ? '#a8a094' : '#b8b0a4'} />
          </mesh>
        ))}
        {/* 몬스터 굴 쪽 울타리 표지판 */}
        <group position={[-12.2, 0, -7.6]} rotation={[0, 0.3, 0]}>
          <mesh position={[0, 0.5, 0]}>
            <boxGeometry args={[0.1, 1.0, 0.1]} />
            <meshToonMaterial gradientMap={toonGradient} color="#7a5232" />
          </mesh>
          <mesh position={[0, 0.95, 0.04]}>
            <boxGeometry args={[0.8, 0.4, 0.06]} />
            <meshToonMaterial gradientMap={toonGradient} color="#c9a46a" />
          </mesh>
          <mesh position={[0, 0.95, 0.08]}>
            <boxGeometry args={[0.5, 0.08, 0.02]} />
            <meshToonMaterial gradientMap={toonGradient} color="#c0433f" />
          </mesh>
        </group>
      </Baked>
      <Instances geo={flowerGeo} items={d.flowers} flat />
      <Instances geo={tuftGeo} items={d.tufts} />
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
        return (
          <group key={i} position={[x, 0, z]} onClick={pick(i)}>
            <BuildPad on={sel?.t === 'spot' && sel.i === i} busy={!!b} color={b ? colorOf(snap?.members ?? [], b) : '#fff'} />
          </group>
        )
      })}
    </group>
  )
}

/* ---------- 탑 ---------- */
function Bar({ pct, y, w = 1.0, color }: { pct: number; y: number; w?: number; color: string }) {
  return (
    <group position={[0, y, 0]} rotation={[-0.95, 0, 0]}>
      <mesh>
        <planeGeometry args={[w + 0.08, 0.17]} />
        <meshBasicMaterial color="#1e2420" transparent opacity={0.7} depthWrite={false} />
      </mesh>
      <mesh position={[(-w * (1 - pct / 100)) / 2, 0, 0.002]}>
        <planeGeometry args={[(w * pct) / 100, 0.11]} />
        <meshBasicMaterial color={color} depthWrite={false} />
      </mesh>
    </group>
  )
}

function Tower({ row, members, selected }: { row: TowerRow; members: string[]; selected: boolean }) {
  const [id, spot, kind, tier, br, owner, hp, spec, perfect] = row
  const g = useRef<THREE.Group>(null)
  const born = useRef(performance.now())
  const [x, z] = SPOTS[spot]
  let anim = towerAnim.get(id)
  if (!anim) {
    anim = { aim: Math.atan2(-x, -z), fireAt: 0 }
    towerAnim.set(id, anim)
  }
  useEffect(() => {
    born.current = performance.now()
  }, [tier, br])
  useEffect(() => () => void towerAnim.delete(id), [id])
  useFrame(() => {
    if (!g.current) return
    const a = Math.min(1, (performance.now() - born.current) / 450)
    const pop = a < 1 ? 1 + Math.sin(a * PI) * 0.25 : 1
    g.current.scale.setScalar((1.12 + tier * 0.06) * pop * (0.4 + 0.6 * Math.min(1, a * 1.5)))
  })
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    if (useDef.getState().myQ) return
    useDef.setState({ sel: { t: 'tower', id } })
  }
  const color = colorOf(members, owner)
  return (
    <group position={[x, 0, z]}>
      <group ref={g}>
        <TowerModel kind={kind} tier={tier} br={br} anim={anim} />
      </group>
      {/* 누르기 쉽게: 보이지 않는 큰 기둥 */}
      <mesh position={[0, 1.2, 0]} onClick={onClick}>
        <cylinderGeometry args={[0.95, 0.95, 2.6, 10]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {/* 주인 깃발 */}
      <group position={[-0.78, 0, 0.45]}>
        <mesh position={[0, 0.75, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 1.5, 6]} />
          <meshToonMaterial gradientMap={toonGradient} color="#6b5a46" />
        </mesh>
        <mesh position={[0.17, 1.35, 0]}>
          <boxGeometry args={[0.32, 0.22, 0.02]} />
          <meshBasicMaterial color={color} />
        </mesh>
        {spec ? (
          <mesh position={[0.17, 1.35, 0.015]}>
            <circleGeometry args={[0.06, 10]} />
            <meshBasicMaterial color="#ffd23c" />
          </mesh>
        ) : null}
      </group>
      {/* 고른 탑 · 전문가 표시 고리 */}
      <mesh position={[0, 0.04, 0]} rotation={[-PI / 2, 0, 0]}>
        <ringGeometry args={[0.98, selected ? 1.18 : 1.06, 32]} />
        <meshBasicMaterial color={selected ? '#ffd23c' : spec ? KIND_COLOR[kind] : color} transparent opacity={selected ? 1 : 0.55} depthWrite={false} />
      </mesh>
      {perfect ? (
        <mesh position={[0.72, 0.3, 0.6]}>
          <octahedronGeometry args={[0.11]} />
          <meshBasicMaterial color="#ffd23c" />
        </mesh>
      ) : null}
      {/* 단계 별 */}
      {[...Array(tier)].map((_, i) => (
        <mesh key={i} position={[-0.36 + i * 0.18, 0.06, 1.0]} rotation={[-PI / 2, 0, 0]}>
          <circleGeometry args={[0.07, 5]} />
          <meshBasicMaterial color={i >= 4 ? '#ff6fae' : i >= 2 ? '#ffd23c' : '#fff3c4'} />
        </mesh>
      ))}
      {hp < 100 && <Bar pct={hp} y={kind === 'staff' ? 3.4 : kind === 'bow' ? 3.2 : 2.7} color={hp > 50 ? '#4cd964' : hp > 25 ? '#ffcc00' : '#ff3b30'} />}
    </group>
  )
}

/* ---------- 몬스터 ---------- */
const SPEED_ANIM: Record<MonKind, number> = { slime: 9, blob: 7, bat: 10, turtle: 5, fox: 16, goblin: 10, bomb: 13, king: 5 }
function Monster({ row }: { row: MonRow }) {
  const [id, kind, , hp, fx] = row
  const g = useRef<THREE.Group>(null)
  const body = useRef<THREE.Group>(null)
  let anim = monAnim.get(id)
  if (!anim) {
    anim = { phase: Math.random() * 6, hitAt: 0 }
    monAnim.set(id, anim)
  }
  const a = anim
  useFrame((_, dt) => {
    const tr = monTrack.get(id)
    if (!tr || !g.current) return
    const now = performance.now()
    const d = tr.d0 + (tr.d1 - tr.d0) * Math.min(1, (now - tr.t0) / 260)
    const [x, z] = pathPos(d)
    const [x2, z2] = pathPos(d + 0.3)
    const moving = Math.abs(tr.d1 - tr.d0) > 0.01 && !(fx & (2 | 16 | 32))
    if (moving) a.phase += dt * SPEED_ANIM[kind]
    g.current.position.set(x, 0, z)
    g.current.rotation.y = Math.atan2(x2 - x, z2 - z)
    if (body.current) {
      const hit = Math.max(0, 1 - (now - a.hitAt) / 180)
      const hop = kind === 'slime' || kind === 'blob' ? Math.abs(Math.sin(a.phase * 0.5)) * 0.18 : moving ? Math.abs(Math.sin(a.phase)) * 0.05 : 0
      body.current.position.y = hop
      const sq = kind === 'slime' || kind === 'blob' ? 1 - Math.abs(Math.sin(a.phase * 0.5)) * 0.12 : 1
      body.current.scale.set(1.45 * (1 + hit * 0.18), 1.45 * sq * (1 - hit * 0.15), 1.45 * (1 + hit * 0.18))
      body.current.rotation.z = fx & 16 ? Math.sin(now / 80) * 0.15 : 0
    }
  })
  const top = kind === 'king' ? 3.0 : kind === 'bat' ? 2.8 : kind === 'blob' ? 1.7 : kind === 'goblin' ? 1.9 : 1.5
  return (
    <group ref={g}>
      <mesh position={[0, 0.03, 0]} rotation={[-PI / 2, 0, 0]}>
        <circleGeometry args={[kind === 'king' ? 1.2 : kind === 'blob' ? 0.75 : 0.52, 14]} />
        <meshBasicMaterial color="#000" transparent opacity={0.18} depthWrite={false} />
      </mesh>
      <group ref={body}>
        <MonModel kind={kind} anim={a} />
      </group>
      {fx & 16 ? (
        <group position={[0, top + 0.15, 0]}>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[Math.cos(i * 2.1) * 0.3, 0, Math.sin(i * 2.1) * 0.3]}>
              <octahedronGeometry args={[0.08]} />
              <meshBasicMaterial color="#ffef5a" />
            </mesh>
          ))}
        </group>
      ) : null}
      {fx & 1 ? (
        <mesh position={[0, 0.05, 0]} rotation={[-PI / 2, 0, 0]}>
          <ringGeometry args={[0.35, 0.6, 16]} />
          <meshBasicMaterial color="#8fdcff" transparent opacity={0.7} depthWrite={false} />
        </mesh>
      ) : null}
      {fx & 2 ? (
        <group>
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} position={[Math.cos(i * 1.57) * 0.45, 0.35, Math.sin(i * 1.57) * 0.45]} rotation={[Math.sin(i * 1.57) * 0.5, 0, -Math.cos(i * 1.57) * 0.5]}>
              <coneGeometry args={[0.05, 0.6, 4]} />
              <meshBasicMaterial color="#e0e4ea" />
            </mesh>
          ))}
        </group>
      ) : null}
      {fx & 4 ? (
        <mesh position={[0, top - 0.3, 0]}>
          <coneGeometry args={[0.14, 0.4, 6]} />
          <meshBasicMaterial color="#ff6a1a" />
        </mesh>
      ) : null}
      {fx & 8 ? (
        <mesh position={[0.2, top - 0.25, 0]}>
          <sphereGeometry args={[0.09, 8, 6]} />
          <meshBasicMaterial color="#9bea5a" />
        </mesh>
      ) : null}
      {hp < 100 && <Bar pct={hp} y={top} w={kind === 'king' ? 2.0 : 0.85} color={fx & 8 ? '#9b59d6' : '#ff4d4d'} />}
    </group>
  )
}

/* ---------- 공격 연출 ---------- */
const tv = new THREE.Vector3()
function Effects() {
  const arrows = useRef<(THREE.Group | null)[]>([])
  const orbs = useRef<(THREE.Group | null)[]>([])
  const rocks = useRef<(THREE.Mesh | null)[]>([])
  const slashes = useRef<(THREE.Mesh | null)[]>([])
  const rings = useRef<(THREE.Mesh | null)[]>([])
  const debris = useRef<(THREE.Mesh | null)[]>([])
  useFrame(() => {
    const now = performance.now()
    const idx = { arrow: 0, orb: 0, rock: 0, slash: 0, boom: 0, deb: 0 }
    for (const f of fxList) {
      const age = (now - f.at) / f.dur
      if (age < 0 || age >= 1) continue
      if (f.k === 'arrow') {
        const m = arrows.current[idx.arrow++]
        if (!m) continue
        tv.lerpVectors(f.from, f.to, age)
        tv.y += Math.sin(age * PI) * 0.4
        m.position.copy(tv)
        m.lookAt(f.to.x, f.to.y + Math.sin(Math.min(1, age + 0.1) * PI) * 0.4, f.to.z)
        m.visible = true
      } else if (f.k === 'orb') {
        const m = orbs.current[idx.orb++]
        if (!m) continue
        tv.lerpVectors(f.from, f.to, age * age)
        m.position.copy(tv)
        m.visible = true
        ;((m.children[0] as THREE.Mesh).material as THREE.MeshBasicMaterial).color.set(f.color)
        ;((m.children[1] as THREE.Mesh).material as THREE.MeshBasicMaterial).color.set(f.color)
      } else if (f.k === 'rock') {
        const m = rocks.current[idx.rock++]
        if (!m) continue
        tv.lerpVectors(f.from, f.to, age)
        tv.y += Math.sin(age * PI) * 2.6
        m.position.copy(tv)
        m.rotation.set(age * 9, age * 6, 0)
        m.visible = true
        ;(m.material as THREE.MeshToonMaterial).color.set(f.color)
      } else if (f.k === 'slash') {
        const m = slashes.current[idx.slash++]
        if (!m) continue
        m.position.set(f.to.x, f.to.y + 0.2, f.to.z)
        m.rotation.set(-PI / 2 + 0.6, 0, age * 3)
        m.scale.setScalar(f.r * (0.7 + age * 0.8))
        m.visible = true
        const mt = m.material as THREE.MeshBasicMaterial
        mt.color.set(f.color)
        mt.opacity = 0.9 * (1 - age)
      } else {
        const m = rings.current[idx.boom++]
        if (m) {
          m.position.set(f.from.x, 0.15, f.from.z)
          m.scale.setScalar(0.3 + age * Math.max(0.8, f.r))
          m.visible = true
          ;(m.material as THREE.MeshBasicMaterial).opacity = 0.75 * (1 - age)
        }
        for (let k = 0; k < 5; k++) {
          const dm = debris.current[idx.deb++]
          if (!dm) continue
          const a = k * 1.26 + f.at * 0.001
          const sp = 1.2 + (k % 3) * 0.5
          dm.position.set(f.from.x + Math.cos(a) * sp * age, 0.2 + Math.sin(age * PI) * (0.9 + (k % 2) * 0.5), f.from.z + Math.sin(a) * sp * age)
          dm.scale.setScalar(1 - age * 0.7)
          dm.visible = true
        }
      }
    }
    const hide = (arr: (THREE.Object3D | null)[], from: number) => {
      for (let i = from; i < arr.length; i++) if (arr[i]) arr[i]!.visible = false
    }
    hide(arrows.current, idx.arrow)
    hide(orbs.current, idx.orb)
    hide(rocks.current, idx.rock)
    hide(slashes.current, idx.slash)
    hide(rings.current, idx.boom)
    hide(debris.current, idx.deb)
  })
  return (
    <group>
      {Array.from({ length: 24 }, (_, i) => (
        <group key={i} ref={(el) => void (arrows.current[i] = el)} visible={false}>
          <ArrowModel feather="#ff6a6a" len={0.9} scale={0.9} />
        </group>
      ))}
      {Array.from({ length: 20 }, (_, i) => (
        <group key={i} ref={(el) => void (orbs.current[i] = el)} visible={false}>
          <mesh>
            <sphereGeometry args={[0.16, 10, 8]} />
            <meshBasicMaterial color="#d8b4ff" />
          </mesh>
          <mesh scale={2}>
            <sphereGeometry args={[0.16, 10, 8]} />
            <meshBasicMaterial color="#d8b4ff" transparent opacity={0.3} depthWrite={false} />
          </mesh>
        </group>
      ))}
      {Array.from({ length: 12 }, (_, i) => (
        <mesh key={i} ref={(el) => void (rocks.current[i] = el)} visible={false}>
          <dodecahedronGeometry args={[0.22, 0]} />
          <meshToonMaterial gradientMap={toonGradient} color="#9a9286" />
        </mesh>
      ))}
      {Array.from({ length: 16 }, (_, i) => (
        <mesh key={i} ref={(el) => void (slashes.current[i] = el)} visible={false}>
          <torusGeometry args={[1, 0.09, 6, 20, PI * 0.9]} />
          <meshBasicMaterial color="#bfe0ff" transparent opacity={0.9} depthWrite={false} />
        </mesh>
      ))}
      {Array.from({ length: 16 }, (_, i) => (
        <mesh key={i} ref={(el) => void (rings.current[i] = el)} rotation={[-PI / 2, 0, 0]} visible={false}>
          <ringGeometry args={[0.75, 1, 28]} />
          <meshBasicMaterial color="#ffd27a" transparent opacity={0.7} depthWrite={false} />
        </mesh>
      ))}
      {Array.from({ length: 60 }, (_, i) => (
        <mesh key={i} ref={(el) => void (debris.current[i] = el)} visible={false}>
          <boxGeometry args={[0.12, 0.12, 0.12]} />
          <meshBasicMaterial color={i % 3 ? '#ffcf6a' : '#c9b48e'} />
        </mesh>
      ))}
    </group>
  )
}

/* ---------- 보급 상자 ---------- */
function SupplyBox() {
  const box = useDef((s) => s.snap?.box ?? -1)
  const g = useRef<THREE.Group>(null)
  useFrame((s) => {
    if (g.current) {
      g.current.position.y = 0.55 + Math.sin(s.clock.elapsedTime * 3) * 0.12
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
          <boxGeometry args={[0.8, 0.65, 0.8]} />
          <Toon color="#e8524a" emissive="#ff6a3a" ei={0.3} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.18, 0.67, 0.82]} />
          <Toon color="#ffd23c" />
        </mesh>
        <mesh>
          <boxGeometry args={[0.82, 0.67, 0.18]} />
          <Toon color="#ffd23c" />
        </mesh>
        <mesh position={[0, 0.42, 0]}>
          <torusGeometry args={[0.15, 0.06, 6, 12]} />
          <Toon color="#ffd23c" />
        </mesh>
      </group>
      <mesh position={[0, 0.05, 0]} rotation={[-PI / 2, 0, 0]}>
        <ringGeometry args={[0.65, 0.9, 24]} />
        <meshBasicMaterial color="#ffd23c" transparent opacity={0.8} depthWrite={false} />
      </mesh>
      <mesh position={[0, 1.2, 0]} scale={[1.6, 2.4, 1.6]}>
        <cylinderGeometry args={[0.3, 0.45, 1, 12, 1, true]} />
        <meshBasicMaterial color="#fff3a8" transparent opacity={0.18} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

function Tree() {
  const tree = useDef((s) => s.snap?.tree ?? TREE_HP)
  return (
    <group position={[TREE_POS[0], 0, TREE_POS[1] + 0.3]}>
      <AcornTree hp={tree / TREE_HP} hitAt={treeHit} />
    </group>
  )
}

export function DefenseArena() {
  useSnapTracking()
  const snap = useDef((s) => s.snap)
  const sel = useDef((s) => s.sel)
  const members = snap?.members ?? []
  return (
    <group>
      <Ground />
      <Decor />
      <group position={[DEN_POS[0], 0, DEN_POS[1]]}>
        <MonsterDen />
      </group>
      <Tree />
      <Spots />
      {snap?.towers.map((t) => <Tower key={t[0]} row={t} members={members} selected={sel?.t === 'tower' && sel.id === t[0]} />)}
      {snap?.mons.map((m) => <Monster key={m[0]} row={m} />)}
      <Effects />
      <SupplyBox />
    </group>
  )
}


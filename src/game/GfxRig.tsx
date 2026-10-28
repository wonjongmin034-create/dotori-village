import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useGfx } from './gfx'
import { playerPos } from './player-state'

// 높음 단계 전용 효과 두 가지.
//  · Sun   : 플레이어를 따라다니는 부드러운 그림자 (그림자 지도는 플레이어 둘레만 그린다)
//  · Rig   : 장면을 훑어 그림자를 드리울 물체를 표시하고, 캐릭터·몬스터·펫·보스에 검은 윤곽선을 둘러 준다
// 훑기는 1초에 한 번뿐이라 프레임에는 거의 부담이 없다.

type Focus = 'player' | 'center'

export function Sun({
  dir,
  intensity,
  color,
  focus,
  shadow,
  range,
}: {
  dir: THREE.Vector3
  intensity: number
  color: string
  focus: Focus
  shadow: boolean
  range: number
}) {
  const light = useRef<THREE.DirectionalLight>(null)
  const target = useMemo(() => new THREE.Object3D(), [])
  useFrame(() => {
    const l = light.current
    if (!l) return
    const fx = focus === 'player' ? playerPos.x : 0
    const fz = focus === 'player' ? playerPos.z : 0
    // 그림자 지도의 칸이 움직일 때 번쩍이지 않게 격자에 맞춘다
    const snap = (range * 2) / 2048
    const sx = Math.round(fx / snap) * snap
    const sz = Math.round(fz / snap) * snap
    target.position.set(sx, 0, sz)
    l.position.set(sx + dir.x * 36, dir.y * 36, sz + dir.z * 36)
    target.updateMatrixWorld()
  })
  const cam = shadow
    ? ({ left: -range, right: range, top: range, bottom: -range, near: 1, far: 90 } as const)
    : null
  return (
    <>
      <directionalLight
        ref={light}
        intensity={intensity}
        color={color}
        target={target}
        castShadow={shadow}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0006}
        shadow-normalBias={0.04}
        shadow-radius={3}
        shadow-camera-left={cam?.left ?? -10}
        shadow-camera-right={cam?.right ?? 10}
        shadow-camera-top={cam?.top ?? 10}
        shadow-camera-bottom={cam?.bottom ?? -10}
        shadow-camera-near={1}
        shadow-camera-far={90}
      />
      <primitive object={target} />
    </>
  )
}

/* ---------- 윤곽선 ---------- */
const OUTLINE_COLOR = '#2a2230'
const OUTLINE_PX = 0.022 // 세계 단위 두께 (몸집이 달라도 비슷하게 보이도록 크기로 나눠 쓴다)
const outlineMats = new Map<number, THREE.MeshBasicMaterial>()

function outlineMat(thick: number) {
  const key = Math.round(thick * 10000)
  let m = outlineMats.get(key)
  if (!m) {
    m = new THREE.MeshBasicMaterial({ color: OUTLINE_COLOR, side: THREE.BackSide })
    const t = key / 10000
    m.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>\n transformed += normalize(normal) * ${t.toFixed(4)};`)
    }
    m.customProgramCacheKey = () => `outline-${key}`
    m.fog = true
    outlineMats.set(key, m)
  }
  return m
}

const _ws = new THREE.Vector3()
function addOutline(mesh: THREE.Mesh) {
  if (mesh.userData.isOutline || mesh.userData.noOutline || mesh.userData._ol != null) return
  mesh.userData._ol = 1
  const mat = mesh.material as THREE.Material | THREE.Material[]
  if (Array.isArray(mat)) return
  if (mat.transparent || mat.opacity < 1 || (mesh as THREE.InstancedMesh).isInstancedMesh) return
  if (!(mat as THREE.MeshToonMaterial).isMeshToonMaterial && !(mat as THREE.MeshStandardMaterial).isMeshStandardMaterial && !(mat as THREE.MeshLambertMaterial).isMeshLambertMaterial) return
  const g = mesh.geometry
  if (!g.boundingSphere) g.computeBoundingSphere()
  mesh.updateWorldMatrix(true, false)
  mesh.getWorldScale(_ws)
  const sc = (_ws.x + _ws.y + _ws.z) / 3
  if (sc <= 0.0001) return
  const r = (g.boundingSphere?.radius ?? 0) * sc
  if (r < 0.05) return // 눈·단추처럼 작은 조각은 윤곽선이 오히려 지저분하다
  const o = new THREE.Mesh(g, outlineMat(OUTLINE_PX / sc))
  o.userData.isOutline = true
  o.raycast = () => {} // 클릭 판정에 끼어들지 않게
  o.renderOrder = mesh.renderOrder
  mesh.add(o)
}

function removeOutlines(scene: THREE.Scene) {
  const dead: THREE.Object3D[] = []
  scene.traverse((o) => {
    if (o.userData.isOutline) dead.push(o)
    else if (o.userData._ol != null) delete o.userData._ol
  })
  dead.forEach((o) => o.parent?.remove(o))
}

function skipShadow(m: THREE.Mesh) {
  const mat = m.material as THREE.Material | THREE.Material[]
  if (Array.isArray(mat)) return false
  return (
    m.userData.noShadow ||
    m.userData.isOutline ||
    mat.transparent ||
    (mat as THREE.ShaderMaterial).isShaderMaterial ||
    (mat as THREE.MeshBasicMaterial).isMeshBasicMaterial
  )
}

export function GfxRig() {
  const scene = useThree((s) => s.scene)
  const level = useGfx((s) => s.level)
  const acc = useRef(0.9)
  const had = useRef(false)

  useEffect(() => {
    acc.current = 0.9 // 단계가 바뀌면 곧바로 한 번 훑는다
    if (level !== 'high' && had.current) {
      removeOutlines(scene)
      scene.traverse((o) => {
        const m = o as THREE.Mesh
        if (m.isMesh && m.userData._sh) {
          m.castShadow = false
          m.receiveShadow = false
          delete m.userData._sh
        }
      })
      had.current = false
    }
  }, [level, scene])

  useFrame((_, dt) => {
    if (level !== 'high') return
    acc.current += dt
    if (acc.current < 1) return
    acc.current = 0
    had.current = true
    scene.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) {
        if (!m.userData._sh) {
          m.userData._sh = 1
          if (!skipShadow(m)) {
            m.castShadow = true
            m.receiveShadow = true
          } else if (!m.userData.noShadow && !m.userData.isOutline) {
            m.receiveShadow = false
          }
        }
      }
      if (o.userData.outline) o.traverse((c) => (c as THREE.Mesh).isMesh && addOutline(c as THREE.Mesh))
    })
  })
  return null
}

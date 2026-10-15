import { useLayoutEffect, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

// 움직이지 않는 장식(나무·꽃밭·벤치 같은 것)을 "같은 색끼리 한 덩어리"로 합쳐서 그린다.
// 물건 하나하나를 따로 그리면 그리기 호출이 수백 번이라 약한 기기에서 렉이 걸린다 → 색깔 수(수십 개)만큼으로 줄인다.
// 모양·색은 그대로. 움직이는 것(useFrame 으로 흔들리는 것)이나 반투명한 것은 넣지 말 것.
// 합칠 수 없는 것(userData.noBake, 반투명, 인스턴스, 톤/기본 재질이 아닌 것)은 그대로 둔다.

type Bucket = { mat: THREE.Material; geos: THREE.BufferGeometry[] }

function signature(m: THREE.Material): string | null {
  if (m.transparent || Array.isArray(m)) return null
  if (m.type === 'MeshToonMaterial') {
    const t = m as THREE.MeshToonMaterial
    return `T|${t.color.getHex()}|${t.emissive.getHex()}|${t.emissiveIntensity}|${t.side}|${t.gradientMap?.uuid ?? ''}`
  }
  if (m.type === 'MeshBasicMaterial') {
    const b = m as THREE.MeshBasicMaterial
    return `B|${b.color.getHex()}|${b.side}`
  }
  return null
}

// position·normal·uv 만 남기고 인덱스 없는 모양으로 통일 (그래야 서로 합칠 수 있다)
function prepared(src: THREE.BufferGeometry, matrix: THREE.Matrix4): THREE.BufferGeometry {
  let g = src.index ? src.toNonIndexed() : src.clone()
  for (const name of Object.keys(g.attributes)) if (name !== 'position' && name !== 'normal' && name !== 'uv') g.deleteAttribute(name)
  if (!g.attributes.normal) g.computeVertexNormals()
  if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2))
  g.clearGroups()
  g.applyMatrix4(matrix)
  if (matrix.determinant() < 0) {
    // 거울처럼 뒤집힌 크기면 면의 방향이 뒤집히므로 바로잡는다
    const p = g.attributes.position as THREE.BufferAttribute
    const n = g.attributes.normal as THREE.BufferAttribute
    const u = g.attributes.uv as THREE.BufferAttribute
    for (let i = 0; i + 2 < p.count; i += 3) {
      for (const a of [p, n, u]) {
        const s = a.itemSize
        for (let k = 0; k < s; k++) {
          const t = a.getComponent(i + 1, k)
          a.setComponent(i + 1, k, a.getComponent(i + 2, k))
          a.setComponent(i + 2, k, t)
        }
      }
    }
  }
  g = g.toNonIndexed()
  return g
}

export function Baked({ children }: { children: ReactNode }) {
  const root = useRef<THREE.Group>(null)

  useLayoutEffect(() => {
    const g = root.current
    if (!g) return
    g.updateWorldMatrix(true, true)
    const inv = new THREE.Matrix4().copy(g.matrixWorld).invert()
    const buckets = new Map<string, Bucket>()
    const hidden: THREE.Mesh[] = []
    const rel = new THREE.Matrix4()

    g.traverse((o) => {
      const m = o as THREE.Mesh
      if (!m.isMesh || (m as THREE.InstancedMesh).isInstancedMesh || (m as THREE.SkinnedMesh).isSkinnedMesh) return
      if (m.userData.noBake || !m.visible) return
      const mat = m.material as THREE.Material
      const key = signature(mat)
      if (!key) return
      rel.multiplyMatrices(inv, m.matrixWorld)
      const geo = prepared(m.geometry, rel)
      const b = buckets.get(key)
      if (b) b.geos.push(geo)
      else buckets.set(key, { mat, geos: [geo] })
      hidden.push(m)
    })

    const made: THREE.Mesh[] = []
    for (const { mat, geos } of buckets.values()) {
      const merged = mergeGeometries(geos, false)
      for (const x of geos) x.dispose()
      if (!merged) continue
      const mesh = new THREE.Mesh(merged, mat)
      mesh.userData.noBake = true
      g.add(mesh)
      made.push(mesh)
    }
    for (const m of hidden) m.visible = false

    return () => {
      for (const m of hidden) m.visible = true
      for (const m of made) {
        g.remove(m)
        m.geometry.dispose()
      }
    }
  }, [])

  return <group ref={root}>{children}</group>
}

import type { RefObject } from 'react'
import type { Group } from 'three'
import { CATALOG_MAP } from './catalog'
import { useVillage } from './store'

// 저장된 물건들을 그린다. itemsRef는 EditorControls가 레이캐스트에 쓴다.
export function PlacedObjects({ itemsRef }: { itemsRef: RefObject<Group | null> }) {
  const items = useVillage((s) => s.items)
  const selected = useVillage((s) => s.selected)
  const editing = useVillage((s) => s.mode === 'edit')

  return (
    <group ref={itemsRef}>
      {items.map((it) => {
        const entry = CATALOG_MAP[it.type]
        if (!entry) return null
        const isSel = editing && selected === it.key
        return (
          <group
            key={it.key}
            position={[it.x, 0, it.z]}
            rotation={[0, it.rot, 0]}
            userData={{ editorKey: it.key }}
          >
            {entry.model}
            {isSel && (
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
                <ringGeometry args={[0.75, 1, 28]} />
                <meshBasicMaterial color="#ffce3a" transparent opacity={0.95} depthWrite={false} />
              </mesh>
            )}
          </group>
        )
      })}
    </group>
  )
}

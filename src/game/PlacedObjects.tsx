import { type RefObject } from 'react'
import type { Group } from 'three'
import { CATALOG_MAP } from './catalog'
import { CARE_COOLDOWN_MS, CROP_MAP, ANIMAL_MAP } from './economy'
import { useVillage, type PlacedItem } from './store'
import { useNow } from './useNow'
import { CropView, AnimalView, Beacon } from './FarmModels'
import { HouseView } from './HouseModels'
import { BoardModel } from './BoardModel'
import { ArcadeModel } from './ArcadeModel'
import { WardrobeModel } from './WardrobeModel'

function beaconColor(it: PlacedItem, now: number): string | null {
  if (it.type === 'plot' && it.crop) {
    const def = CROP_MAP[it.crop.seed]
    if (!def) return null
    const ripe =
      it.crop.waterCount >= def.waterGoal && now - it.crop.plantedAt >= def.minGrowMs
    if (ripe) return '#ffce3a'
    if (now - it.crop.lastCareAt >= CARE_COOLDOWN_MS) return '#54b6e8'
    return null
  }
  if (it.type === 'coop' && it.animal) {
    const def = ANIMAL_MAP[it.animal.species]
    if (!def) return null
    if (now - it.animal.cycleStart >= def.produceMs) return '#ffce3a'
    if (now - it.animal.lastCareAt >= CARE_COOLDOWN_MS) return '#54b6e8'
    return null
  }
  return null
}

export function PlacedObjects({ itemsRef }: { itemsRef: RefObject<Group | null> }) {
  const items = useVillage((s) => s.items)
  const selected = useVillage((s) => s.selected)
  const activeFarm = useVillage((s) => s.activeFarm)
  const editing = useVillage((s) => s.mode === 'edit')
  const now = useNow(4000)

  return (
    <group ref={itemsRef}>
      {items.map((it) => {
        const entry = CATALOG_MAP[it.type]
        const special = it.type === 'house' || it.type === 'board' || it.type === 'arcade' || it.type === 'wardrobe'
        if (!entry && !special) return null
        const highlight = editing ? selected === it.key : activeFarm === it.key
        const bc = beaconColor(it, now)
        return (
          <group
            key={it.key}
            position={[it.x, 0, it.z]}
            rotation={[0, it.rot, 0]}
            userData={{ editorKey: it.key }}
          >
            {it.type === 'house' ? (
              <HouseView level={it.level ?? 1} />
            ) : it.type === 'board' ? (
              <BoardModel />
            ) : it.type === 'arcade' ? (
              <ArcadeModel level={it.enh?.level ?? 0} />
            ) : it.type === 'wardrobe' ? (
              <WardrobeModel />
            ) : (
              entry?.model
            )}
            {it.type === 'plot' && it.crop && <CropView crop={it.crop} now={now} />}
            {it.type === 'coop' && it.animal && <AnimalView animal={it.animal} />}
            {bc && <Beacon color={bc} />}
            {highlight && (
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
                <ringGeometry args={[0.9, 1.15, 28]} />
                <meshBasicMaterial color="#ffce3a" transparent opacity={0.95} depthWrite={false} />
              </mesh>
            )}
          </group>
        )
      })}
    </group>
  )
}

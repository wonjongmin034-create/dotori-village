import { type RefObject } from 'react'
import type { Group } from 'three'
import { CATALOG_MAP } from './catalog'
import { useVillage, viewItems, type PlacedItem } from './store'
import { useNow } from './useNow'
import { CropView, AnimalView, Beacon } from './FarmModels'
import { HouseView } from './HouseModels'
import { BoardModel } from './BoardModel'
import { ArcadeModel } from './ArcadeModel'
import { WardrobeModel } from './WardrobeModel'
import { dateKey, type ClassLunch } from './lunch'
import { animalReady, cropRipe, normAnimal, normCrop, wiltPending } from './farm'

// 머리 위 표시: 노랑 = 거둘 수 있다 · 파랑 = 오늘 돌볼 수 있다 · 갈색 = 시들었다(돌봐 주세요) · 초록 = (친구 마을) 도와줄 수 있다
function beaconColor(it: PlacedItem, today: string, lunch: ClassLunch, friend: boolean): string | null {
  const st = it.type === 'plot' && it.crop ? normCrop(it.crop, today) : it.type === 'coop' && it.animal ? normAnimal(it.animal, today) : null
  if (!st) return null
  if (friend) return st.tryDay !== today && st.helpDay !== today ? '#6fd36f' : null
  if ('seed' in st ? cropRipe(st) : animalReady(st)) return '#ffce3a'
  if (wiltPending(st, today, lunch)) return '#b07a3e'
  if (st.tryDay !== today) return '#54b6e8'
  return null
}

export function PlacedObjects({ itemsRef }: { itemsRef: RefObject<Group | null> }) {
  const items = useVillage(viewItems)
  const selected = useVillage((s) => s.selected)
  const activeFarm = useVillage((s) => s.activeFarm)
  const editing = useVillage((s) => s.mode === 'edit')
  useNow(4000) // 날짜가 바뀌면 다시 그린다
  const today = dateKey()
  const lunch = useVillage((s) => s.classLunch)
  const friend = useVillage((s) => !!s.visiting)

  return (
    <group ref={itemsRef}>
      {items.map((it) => {
        const entry = CATALOG_MAP[it.type]
        const special = it.type === 'house' || it.type === 'board' || it.type === 'arcade' || it.type === 'wardrobe'
        if (!entry && !special) return null
        const highlight = editing ? selected === it.key : activeFarm === it.key
        const bc = beaconColor(it, today, lunch, friend)
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
            {it.type === 'plot' && it.crop && <CropView crop={it.crop} today={today} />}
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

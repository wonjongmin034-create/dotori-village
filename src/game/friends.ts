import { supabase } from './supabase'
import { useVillage, landHalf, type PlacedItem } from './store'
import { resolveFarmOverlaps } from './layout'
import { normalizeAvatar } from './avatar'
import { playerPos, spawnAt } from './player-state'
import { LAND_OLD } from './economy'

export type Friend = {
  name: string
  level: number // 오두막(집) 단계 1~5
  land: number // 땅 반쪽 크기
  things: number // 꾸민 물건 수
  online: boolean // 최근 3분 안에 접속
}

export const HOUSE_EMOJI = ['⛺', '🛖', '🏡', '🏠', '🏰']
export const houseEmoji = (level: number) => HOUSE_EMOJI[Math.max(1, Math.min(5, level)) - 1]

const SYSTEM = new Set(['house', 'board', 'arcade', 'wardrobe'])

const validItems = (raw: unknown): PlacedItem[] =>
  Array.isArray(raw)
    ? (raw.filter(
        (o) => o && typeof o.type === 'string' && typeof o.x === 'number' && typeof o.z === 'number',
      ) as PlacedItem[])
    : []

// 같은 반 친구 목록 (내 이름 제외). 비밀번호·도토리는 가져오지 않는다.
export async function fetchFriends(): Promise<Friend[] | null> {
  const { session } = useVillage.getState()
  if (!session) return null
  try {
    const { data, error } = await supabase
      .from('villages')
      .select('name, items, last_seen')
      .eq('class_code', session.classCode)
      .neq('name', session.name)
    if (error || !data) return null
    const now = Date.now()
    return data
      .map((v) => {
        const items = validItems(v.items)
        const house = items.find((i) => i.type === 'house')
        return {
          name: v.name as string,
          level: house?.level ?? 1,
          land: house?.land ?? LAND_OLD,
          things: items.filter((i) => !SYSTEM.has(i.type)).length,
          online: !!v.last_seen && now - new Date(v.last_seen).getTime() < 3 * 60_000,
        }
      })
      .sort((a, b) => b.level - a.level || a.name.localeCompare(b.name, 'ko'))
  } catch {
    return null
  }
}

// 친구 마을로 놀러 가기 (읽기 전용)
export async function visitFriend(name: string): Promise<boolean> {
  const { session } = useVillage.getState()
  if (!session) return false
  try {
    const { data, error } = await supabase
      .from('villages')
      .select('items')
      .eq('class_code', session.classCode)
      .eq('name', name)
      .maybeSingle()
    if (error || !data) return false
    const raw = validItems(data.items)
    // 친구 마을에 겹친 밭·우리가 있으면 보기만 정리해서 보여 준다 (친구 데이터는 바꾸지 않음)
    const items = resolveFarmOverlaps(raw, landHalf(raw)).items
    const house = items.find((i) => i.type === 'house')
    spawnAt()
    useVillage.getState().setVisiting({ name, items, avatar: normalizeAvatar(house?.avatar) })
    useVillage.getState().flash(`${name}의 마을에 놀러 왔어요! 🏝️`)
    return true
  } catch {
    return false
  }
}

export function endVisit() {
  playerPos.set(0, 0, 3)
  useVillage.getState().setVisiting(null)
}

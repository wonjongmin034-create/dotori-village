// 옷장 카탈로그 — 캐릭터 꾸미기. 기본(cost 0)은 항상 사용 가능, 나머지는 도토리로 구매.

export type Slot = 'hair' | 'hairColor' | 'shirt' | 'pants' | 'shoes' | 'hat'

export type WardrobeItem = {
  id: string // 모양은 스타일 id, 색은 hex
  slot: Slot
  label: string
  cost: number
  swatch?: string // 색 미리보기용 (color 슬롯)
}

const colors = (
  slot: Slot,
  list: [string, string, number][], // [hex, label, cost]
): WardrobeItem[] => list.map(([hex, label, cost]) => ({ id: hex, slot, label, cost, swatch: hex }))

export const WARDROBE: WardrobeItem[] = [
  // ── 머리 모양 ──
  { id: 'short', slot: 'hair', label: '단발', cost: 0 },
  { id: 'bun', slot: 'hair', label: '만두머리', cost: 0 },
  { id: 'none', slot: 'hair', label: '민머리', cost: 0 },
  { id: 'pigtails', slot: 'hair', label: '양갈래', cost: 8 },
  { id: 'long', slot: 'hair', label: '긴머리', cost: 10 },
  { id: 'spiky', slot: 'hair', label: '뾰족머리', cost: 8 },

  // ── 머리 색 ──
  ...colors('hairColor', [
    ['#3f2a1c', '흑갈색', 0],
    ['#6b4a2f', '갈색', 0],
    ['#111111', '검정', 0],
    ['#c99b3f', '금발', 0],
    ['#a8452e', '빨강머리', 0],
    ['#8a8f96', '회색', 0],
    ['#5b8dd6', '파랑', 6],
    ['#e58bbd', '분홍', 6],
    ['#5fc7a8', '민트', 6],
  ]),

  // ── 상의 색 ──
  ...colors('shirt', [
    ['#5cc06b', '초록', 0],
    ['#5b8dd6', '파랑', 0],
    ['#e05252', '빨강', 0],
    ['#f2c14e', '노랑', 0],
    ['#b57ede', '보라', 0],
    ['#f4f4f4', '하양', 0],
    ['#f2955b', '주황', 0],
    ['#4cc0c8', '청록', 0],
    ['#e0b53a', '금색', 12],
    ['#2b2b2b', '검정', 8],
  ]),

  // ── 하의 색 ──
  ...colors('pants', [
    ['#4a6fa5', '청바지', 0],
    ['#6b4a2f', '갈색', 0],
    ['#7c828a', '회색', 0],
    ['#4a7a4a', '초록', 0],
    ['#a84a4a', '빨강', 0],
    ['#2b2b2b', '검정', 0],
    ['#d9c9a3', '베이지', 6],
  ]),

  // ── 신발 색 ──
  ...colors('shoes', [
    ['#5a4636', '갈색', 0],
    ['#2b2b2b', '검정', 0],
    ['#f0f0f0', '하양', 0],
    ['#c14a4a', '빨강', 0],
    ['#4a6fa5', '파랑', 0],
    ['#e0b53a', '금색', 8],
  ]),

  // ── 모자 ──
  { id: 'none', slot: 'hat', label: '없음', cost: 0 },
  { id: 'acorn', slot: 'hat', label: '도토리 모자', cost: 0 },
  { id: 'party', slot: 'hat', label: '고깔모자', cost: 6 },
  { id: 'flower', slot: 'hat', label: '꽃핀', cost: 10 },
  { id: 'cap', slot: 'hat', label: '야구모자', cost: 12 },
  { id: 'straw', slot: 'hat', label: '밀짚모자', cost: 18 },
  { id: 'crown', slot: 'hat', label: '왕관', cost: 40 },
]

export const SLOT_LABEL: Record<Slot, string> = {
  hair: '머리 모양',
  hairColor: '머리 색',
  shirt: '옷 색',
  pants: '바지 색',
  shoes: '신발 색',
  hat: '모자',
}

export const SLOTS: Slot[] = ['hair', 'hairColor', 'shirt', 'pants', 'shoes', 'hat']

export function itemsForSlot(slot: Slot) {
  return WARDROBE.filter((w) => w.slot === slot)
}
export function findItem(slot: Slot, id: string) {
  return WARDROBE.find((w) => w.slot === slot && w.id === id)
}
// 무료거나 이미 산 아이템이면 true
export function ownsItem(item: WardrobeItem, owned: string[]) {
  return item.cost === 0 || owned.includes(`${item.slot}:${item.id}`)
}

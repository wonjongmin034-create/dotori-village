// 옷장 카탈로그 — 캐릭터 꾸미기. 기본(cost 0)은 항상 사용 가능, 나머지는 도토리로 구매.

export type Slot =
  | 'hair'
  | 'hairColor'
  | 'top'
  | 'shirt'
  | 'bottom'
  | 'pants'
  | 'shoeStyle'
  | 'shoes'
  | 'hat'
  | 'acc'
  | 'costume'

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

const styles = (slot: Slot, list: [string, string, number][]): WardrobeItem[] =>
  list.map(([id, label, cost]) => ({ id, slot, label, cost }))

export const WARDROBE: WardrobeItem[] = [
  // ── 머리 모양 ──
  ...styles('hair', [
    ['short', '단발', 0],
    ['bun', '만두머리', 0],
    ['none', '민머리', 0],
    ['pigtails', '양갈래', 8],
    ['long', '긴머리', 10],
    ['spiky', '뾰족머리', 8],
  ]),

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

  // ── 상의 모양 ──
  ...styles('top', [
    ['tee', '반팔티', 0],
    ['stripe', '줄무늬티', 0],
    ['tank', '민소매', 0],
    ['longsleeve', '긴팔티', 0],
    ['knit', '니트', 8],
    ['hoodie', '후드티', 8],
    ['jacket', '재킷', 10],
    ['dress', '원피스', 10],
    ['overalls', '멜빵바지', 12],
    ['sailor', '세일러복', 12],
    ['soccer', '축구유니폼', 14],
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

  // ── 하의 모양 ──
  ...styles('bottom', [
    ['pants', '긴바지', 0],
    ['shorts', '반바지', 0],
    ['capri', '7부바지', 0],
    ['skirt', '치마', 6],
    ['longskirt', '롱스커트', 10],
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

  // ── 신발 모양 ──
  ...styles('shoeStyle', [
    ['sneakers', '운동화', 0],
    ['sandals', '샌들', 4],
    ['boots', '부츠', 6],
    ['maryjane', '구두', 6],
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
  ...styles('hat', [
    ['none', '없음', 0],
    ['acorn', '도토리 모자', 0],
    ['bow', '리본', 6],
    ['party', '고깔모자', 6],
    ['beanie', '비니', 6],
    ['earmuffs', '귀도리', 8],
    ['chef', '요리사모자', 10],
    ['flower', '꽃핀', 10],
    ['bunny', '토끼머리띠', 10],
    ['cap', '야구모자', 12],
    ['headphones', '헤드폰', 12],
    ['horns', '도깨비뿔', 12],
    ['halo', '천사링', 14],
    ['pirate', '해적모자', 16],
    ['wizard', '마법사모자', 16],
    ['straw', '밀짚모자', 18],
    ['crown', '왕관', 40],
  ]),

  // ── 액세서리 ──
  ...styles('acc', [
    ['none', '없음', 0],
    ['glasses', '안경', 6],
    ['scarf', '목도리', 6],
    ['sunglasses', '선글라스', 8],
    ['backpack', '가방', 10],
    ['tail', '여우꼬리', 12],
    ['cape', '망토', 16],
    ['wings', '요정날개', 22],
  ]),

  // ── 전신 코스튬 ──
  ...styles('costume', [
    ['none', '없음', 0],
    ['pumpkin', '호박', 20],
    ['frog', '개구리', 22],
    ['cat', '고양이', 24],
    ['bear', '곰', 24],
    ['shark', '상어', 26],
    ['robot', '로봇', 28],
    ['dino', '공룡', 30],
    ['space', '우주복', 34],
  ]),
]

export const SLOT_LABEL: Record<Slot, string> = {
  hair: '머리',
  hairColor: '머리 색',
  top: '상의',
  shirt: '상의 색',
  bottom: '하의',
  pants: '하의 색',
  shoeStyle: '신발',
  shoes: '신발 색',
  hat: '모자',
  acc: '액세서리',
  costume: '코스튬',
}

export const SLOTS: Slot[] = [
  'hair',
  'hairColor',
  'top',
  'shirt',
  'bottom',
  'pants',
  'shoeStyle',
  'shoes',
  'hat',
  'acc',
  'costume',
]

// 색을 고르는 슬롯 (스와치 그리드로 표시)
export const COLOR_SLOTS: Slot[] = ['hairColor', 'shirt', 'pants', 'shoes']

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

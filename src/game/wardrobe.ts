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
  | 'ride'

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
    ['pigtails', '양갈래', 30],
    ['long', '긴머리', 35],
    ['spiky', '뾰족머리', 30],
    ['ponytail', '포니테일', 40],
    ['twinbuns', '양쪽 만두', 45],
    ['bob', '단정 단발', 45],
    ['braid', '땋은머리', 60],
    ['curly', '곱슬머리', 70],
    ['mohawk', '무지개 모히칸', 90],
    ['afro', '뽀글머리', 100],
  ]),

  // ── 머리 색 ──
  ...colors('hairColor', [
    ['#3f2a1c', '흑갈색', 0],
    ['#6b4a2f', '갈색', 0],
    ['#111111', '검정', 0],
    ['#c99b3f', '금발', 0],
    ['#a8452e', '빨강머리', 0],
    ['#8a8f96', '회색', 0],
    ['#5b8dd6', '파랑', 25],
    ['#e58bbd', '분홍', 25],
    ['#5fc7a8', '민트', 25],
    ['#9b6bd6', '보라', 25],
    ['#e8833a', '주황', 25],
    ['#c9ced6', '은색', 30],
    ['#ff5fa2', '진분홍', 30],
    ['#2fb5b5', '청록', 30],
    ['#9bd650', '연두', 30],
    ['#f2f2f2', '하양', 35],
  ]),

  // ── 상의 모양 ──
  ...styles('top', [
    ['tee', '반팔티', 0],
    ['stripe', '줄무늬티', 0],
    ['tank', '민소매', 0],
    ['longsleeve', '긴팔티', 0],
    ['knit', '니트', 30],
    ['hoodie', '후드티', 35],
    ['jacket', '재킷', 40],
    ['dress', '원피스', 45],
    ['overalls', '멜빵바지', 50],
    ['sailor', '세일러복', 50],
    ['soccer', '축구유니폼', 55],
    ['cardigan', '가디건', 60],
    ['turtleneck', '목폴라', 60],
    ['vest', '조끼', 70],
    ['baseball', '야구유니폼', 75],
    ['raincoat', '우비', 80],
    ['hanbok', '한복 저고리', 100],
    ['uniform', '교복', 110],
    ['labcoat', '과학자 가운', 120],
    ['tuxedo', '턱시도', 140],
    ['puffer', '롱패딩', 150],
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
    ['#2b2b2b', '검정', 30],
    ['#f29ab8', '분홍', 20],
    ['#8ecbff', '하늘', 20],
    ['#a5e07a', '연두', 20],
    ['#ffb38a', '살구', 20],
    ['#223a6b', '남색', 25],
    ['#7a1f2b', '자주', 25],
    ['#e0b53a', '금색', 40],
    ['#ff4fd8', '형광분홍', 40],
    ['#37e0c0', '형광민트', 40],
  ]),

  // ── 하의 모양 ──
  ...styles('bottom', [
    ['pants', '긴바지', 0],
    ['shorts', '반바지', 0],
    ['capri', '7부바지', 0],
    ['skirt', '치마', 25],
    ['longskirt', '롱스커트', 40],
    ['jogger', '조거팬츠', 35],
    ['cargo', '카고바지', 45],
    ['pleated', '주름치마', 50],
    ['tutu', '튀튀 치마', 80],
    ['hanbokskirt', '한복 치마', 100],
  ]),

  // ── 하의 색 ──
  ...colors('pants', [
    ['#4a6fa5', '청바지', 0],
    ['#6b4a2f', '갈색', 0],
    ['#7c828a', '회색', 0],
    ['#4a7a4a', '초록', 0],
    ['#a84a4a', '빨강', 0],
    ['#2b2b2b', '검정', 0],
    ['#d9c9a3', '베이지', 25],
    ['#e8b4c8', '분홍', 20],
    ['#f0e6d2', '아이보리', 20],
    ['#6b4a9e', '보라', 25],
    ['#d99a3a', '겨자', 25],
    ['#2e7d6e', '청록', 25],
    ['#1f2f55', '남색', 25],
  ]),

  // ── 신발 모양 ──
  ...styles('shoeStyle', [
    ['sneakers', '운동화', 0],
    ['sandals', '샌들', 20],
    ['boots', '부츠', 30],
    ['maryjane', '구두', 30],
    ['slippers', '토끼 슬리퍼', 40],
    ['hightops', '하이탑', 50],
    ['rainboots', '장화', 60],
    ['flowershoes', '꽃신', 70],
    ['skates', '롤러스케이트', 120],
  ]),

  // ── 신발 색 ──
  ...colors('shoes', [
    ['#5a4636', '갈색', 0],
    ['#2b2b2b', '검정', 0],
    ['#f0f0f0', '하양', 0],
    ['#c14a4a', '빨강', 0],
    ['#4a6fa5', '파랑', 0],
    ['#e85a8f', '분홍', 20],
    ['#7ecbff', '하늘', 20],
    ['#9be07a', '연두', 20],
    ['#8a5ad6', '보라', 20],
    ['#ff9f3a', '주황', 20],
    ['#e0b53a', '금색', 35],
  ]),

  // ── 모자 ──
  ...styles('hat', [
    ['none', '없음', 0],
    ['acorn', '도토리 모자', 0],
    ['bow', '리본', 25],
    ['party', '고깔모자', 25],
    ['beanie', '비니', 30],
    ['earmuffs', '귀도리', 35],
    ['chef', '요리사모자', 40],
    ['flower', '꽃핀', 40],
    ['bucket', '벙거지', 40],
    ['bunny', '토끼머리띠', 45],
    ['cap', '야구모자', 50],
    ['headphones', '헤드폰', 50],
    ['horns', '도깨비뿔', 50],
    ['sprout', '새싹', 50],
    ['beret', '베레모', 50],
    ['catears', '고양이 귀', 55],
    ['halo', '천사링', 60],
    ['pirate', '해적모자', 70],
    ['wizard', '마법사모자', 70],
    ['straw', '밀짚모자', 70],
    ['flowercrown', '꽃관', 70],
    ['strawberry', '딸기모자', 70],
    ['mushroom', '버섯모자', 80],
    ['graduation', '학사모', 80],
    ['santa', '산타모자', 80],
    ['cowboy', '카우보이모자', 90],
    ['police', '경찰모자', 90],
    ['ninja', '닌자 머리띠', 100],
    ['tophat', '신사모자', 110],
    ['viking', '바이킹 투구', 130],
    ['crown', '왕관', 150],
    ['knight', '기사 투구', 150],
    ['unicorn', '유니콘 뿔', 200],
  ]),

  // ── 액세서리 ──
  ...styles('acc', [
    ['none', '없음', 0],
    ['glasses', '안경', 25],
    ['scarf', '목도리', 25],
    ['bowtie', '나비넥타이', 30],
    ['sunglasses', '선글라스', 35],
    ['eyepatch', '해적 안대', 40],
    ['backpack', '가방', 45],
    ['necklace', '별 목걸이', 45],
    ['tail', '여우꼬리', 50],
    ['heartglasses', '하트 안경', 60],
    ['starglasses', '별 안경', 60],
    ['cape', '망토', 70],
    ['heromask', '영웅 가면', 70],
    ['wings', '요정날개', 100],
    ['headchick', '머리 위 병아리', 120],
    ['guitar', '기타', 140],
    ['batwings', '박쥐날개', 150],
    ['jetpack', '제트팩', 250],
  ]),

  // ── 전신 코스튬 ──
  ...styles('costume', [
    ['none', '없음', 0],
    ['pumpkin', '호박', 120],
    ['frog', '개구리', 130],
    ['cat', '고양이', 150],
    ['bear', '곰', 150],
    ['duck', '오리', 160],
    ['shark', '상어', 170],
    ['bunny', '토끼', 170],
    ['robot', '로봇', 180],
    ['penguin', '펭귄', 180],
    ['panda', '판다', 190],
    ['fox', '여우', 190],
    ['dino', '공룡', 200],
    ['snowman', '눈사람', 200],
    ['ghost', '유령', 210],
    ['space', '우주복', 220],
    ['lion', '사자', 250],
    ['ninja', '닌자', 260],
    ['knight', '기사', 300],
    ['unicorn', '유니콘', 380],
    ['dragon', '용', 450],
  ]),

  // ── 탈 것 (조금 비싸다 — 오래 모아야 살 수 있어요) ──
  ...styles('ride', [
    ['none', '걷기', 0],
    ['kick', '킥보드', 90],
    ['bike', '자전거', 180],
    ['horse', '말', 330],
    ['cloud', '구름', 480],
    ['board', '호버보드', 650],
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
  ride: '탈 것',
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
  'ride',
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

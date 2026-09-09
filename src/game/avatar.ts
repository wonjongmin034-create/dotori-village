// 아바타(캐릭터 외형) 설정. 옷 갈아입히기 시스템의 기반.
export type Avatar = {
  skin: string
  hair: string // 헤어스타일 id
  hairColor: string
  top: string // 상의 모양 id
  shirt: string // 상의 색
  bottom: string // 하의 모양 id
  pants: string // 하의 색
  shoeStyle: string // 신발 모양 id
  shoes: string // 신발 색
  hat: string | null // 모자 id (null = 없음)
  acc: string | null // 액세서리 id (null = 없음)
  costume: string | null // 전신 코스튬 id (있으면 상의·하의 모양 무시)
}

export const DEFAULT_AVATAR: Avatar = {
  skin: '#ffdcb5',
  hair: 'short',
  hairColor: '#3f2a1c',
  top: 'tee',
  shirt: '#5cc06b',
  bottom: 'pants',
  pants: '#4a6fa5',
  shoeStyle: 'sneakers',
  shoes: '#5a4636',
  hat: null,
  acc: null,
  costume: null,
}

export function normalizeAvatar(a: Partial<Avatar> | undefined | null): Avatar {
  return { ...DEFAULT_AVATAR, ...(a && typeof a === 'object' ? a : {}) }
}

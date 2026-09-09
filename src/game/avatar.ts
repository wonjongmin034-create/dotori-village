// 아바타(캐릭터 외형) 설정. 옷 갈아입히기 시스템의 기반.
export type Avatar = {
  skin: string
  hair: string // 헤어스타일 id
  hairColor: string
  shirt: string // 상의 색
  pants: string // 하의 색
  shoes: string
  hat: string | null // 모자 id (null = 없음)
}

export const DEFAULT_AVATAR: Avatar = {
  skin: '#ffdcb5',
  hair: 'short',
  hairColor: '#3f2a1c',
  shirt: '#5cc06b',
  pants: '#4a6fa5',
  shoes: '#5a4636',
  hat: null,
}

export function normalizeAvatar(a: Partial<Avatar> | undefined | null): Avatar {
  return { ...DEFAULT_AVATAR, ...(a && typeof a === 'object' ? a : {}) }
}

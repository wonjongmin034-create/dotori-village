// 펫 시스템 — 한 계정에 한 마리. 알 → 아기 → 아동 → 청소년 → 성체.
// 먹이는 하루 한 번, "오늘의 학습"을 15문제 이상 맞힌 날에만 줄 수 있다.
// 진화는 도토리를 내고 확률로 성공하며, 집 단계가 모자라면 할 수 없다.

export type PetState = {
  sp: string // 종류 id
  st: number // 0 알 · 1 아기 · 2 아동 · 3 청소년 · 4 성체
  fed: number // 이번 단계에서 먹이를 준 횟수
  pity: number // 연속 진화 실패 횟수 (실패할수록 다음 확률이 조금씩 오른다)
}
// 친구들에게 보여 주는 모습 (실시간 접속 정보에 실린다)
export type PetView = { sp: string; st: number }

export type PetSpecies = {
  id: string
  label: string
  emoji: string
  body: string // 몸 색
  belly: string // 배·주둥이 색
  accent: string // 귀 안쪽·꼬리 끝 같은 포인트 색
  egg: string // 알 바탕 색
  spot: string // 알 무늬 색
  blurb: string
}

export const PET_SPECIES: PetSpecies[] = [
  { id: 'dog', label: '강아지', emoji: '🐶', body: '#d9a066', belly: '#fff0d6', accent: '#8a5a2b', egg: '#f6e3c2', spot: '#d9a066', blurb: '충성스럽고 활발해요' },
  { id: 'cat', label: '고양이', emoji: '🐱', body: '#9aa3b0', belly: '#f4f6fa', accent: '#f2a0b0', egg: '#e6e9f0', spot: '#9aa3b0', blurb: '도도하지만 정이 많아요' },
  { id: 'rabbit', label: '토끼', emoji: '🐰', body: '#fbf3f0', belly: '#ffffff', accent: '#f7b3c3', egg: '#fdeef2', spot: '#f7b3c3', blurb: '폴짝폴짝 잘 뛰어요' },
  { id: 'fox', label: '여우', emoji: '🦊', body: '#ee8a3c', belly: '#fff4e4', accent: '#4b3524', egg: '#fbdcbc', spot: '#ee8a3c', blurb: '똑똑하고 재빨라요' },
  { id: 'panda', label: '판다', emoji: '🐼', body: '#fafafa', belly: '#ffffff', accent: '#2d2f33', egg: '#e9efe6', spot: '#2d2f33', blurb: '느긋하고 포근해요' },
  { id: 'dragon', label: '아기용', emoji: '🐲', body: '#5fbf7a', belly: '#f4efb0', accent: '#e9695a', egg: '#cdeedb', spot: '#5fbf7a', blurb: '불꽃을 품은 전설의 펫' },
]
export const SPECIES_MAP: Record<string, PetSpecies> = Object.fromEntries(PET_SPECIES.map((s) => [s.id, s]))

export const STAGE_NAMES = ['알', '아기', '아동', '청소년', '성체']
export const MAX_STAGE = 4

// ── 규칙 값 (여기만 고치면 균형을 바꿀 수 있다) ──
export const FEED_NEED_SCORE = 15 // 오늘의 학습에서 이만큼 이상 맞혀야 먹이를 줄 수 있다
// 다음 단계로 가기 위해 필요한 먹이 횟수 [알→아기, 아기→아동, 아동→청소년, 청소년→성체]
export const FEED_NEED = [1, 3, 5, 7]
// 진화에 드는 도토리 (성공·실패와 상관없이 낸다)
export const EVOLVE_COST_PET = [20, 60, 150, 350]
// 진화 성공 확률 (실패하면 pity 한 번당 +10%p, 최대 100%)
export const EVOLVE_CHANCE = [1, 0.6, 0.45, 0.3]
export const PITY_STEP = 0.1
// 진화하려면 필요한 집 단계 [→아기, →아동, →청소년, →성체]
export const EVOLVE_HOUSE = [1, 2, 3, 4]

export const isPetSpecies = (id: unknown): id is string => typeof id === 'string' && id in SPECIES_MAP

export const stageLabel = (sp: string, st: number) => {
  const s = SPECIES_MAP[sp]
  if (!s) return '펫'
  return st <= 0 ? `${s.label}의 알` : `${STAGE_NAMES[Math.min(MAX_STAGE, st)]} ${s.label}`
}

export const evolveChance = (p: PetState): number =>
  p.st >= MAX_STAGE ? 0 : Math.min(1, EVOLVE_CHANCE[p.st] + PITY_STEP * Math.max(0, p.pity))

// 펫 데이터를 안전하게 읽는다 (서버·이전 버전에서 온 값 보호)
export function normalizePet(raw: unknown): PetState | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Partial<PetState>
  if (!isPetSpecies(r.sp)) return null
  const st = Math.max(0, Math.min(MAX_STAGE, Math.round(Number(r.st) || 0)))
  const fed = Math.max(0, Math.min(99, Math.round(Number(r.fed) || 0)))
  const pity = Math.max(0, Math.min(20, Math.round(Number(r.pity) || 0)))
  return { sp: r.sp, st, fed, pity }
}

export const petView = (p: PetState | null | undefined): PetView | null => (p ? { sp: p.sp, st: p.st } : null)

// 진화 버튼을 눌러도 되는지 — 이유를 같이 돌려준다
export type EvolveCheck = { ok: boolean; why: string }
export function canEvolve(p: PetState, houseLv: number): EvolveCheck {
  if (p.st >= MAX_STAGE) return { ok: false, why: '이미 다 컸어요! 🏆' }
  const need = FEED_NEED[p.st]
  if (p.fed < need) return { ok: false, why: `먹이를 ${need - p.fed}번 더 줘야 해요` }
  if (houseLv < EVOLVE_HOUSE[p.st]) return { ok: false, why: `🔒 집이 ${EVOLVE_HOUSE[p.st]}단계가 되면 진화할 수 있어요` }
  return { ok: true, why: '' }
}

// 한 번 굴려 보기 (테스트에서 rand 를 바꿔 끼울 수 있게)
export const rollEvolve = (p: PetState, rand: () => number = Math.random) => rand() < evolveChance(p)

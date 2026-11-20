import { FAMILY_EMOJI, isFamily, type WeaponFamily } from './weapons'
import { STAGE_NAMES } from './pets'
import { houseLevel } from './economy'

// 1차 전직 — 처음에는 모두 검으로 시작하고, 조건을 채우면 직업을 골라 그 직업의 무기를 얻는다.
//  · 직업마다 쓸 수 있는 무기는 하나. 전직하면 직업 무기를 1단계로 얻고, 그때부터 도토리로 강화한다 (전직 전에는 강화할 수 없다).
//  · 직업은 한 번 고르면 바꿀 수 없다.
//  · 조건 숫자는 아래 JOB_NEED 만 고치면 된다.

export type Job = { f: WeaponFamily; label: string; emoji: string; desc: string; skill: string; boss: string; raid: string }

export const JOBS: Job[] = [
  { f: 'sword', label: '검사', emoji: '🗡️', desc: '검 한 자루로 무엇이든 해내는 균형 잡힌 용사', skill: '⏳ 집중', boss: '내 차례 문제의 제한 시간 +3초 (항상)', raid: '내 문제의 제한 시간 +3초 (항상)' },
  { f: 'axe', label: '광전사', emoji: '🪓', desc: '커다란 도끼를 휘두르는 힘센 전사', skill: '💢 분노의 일격', boss: '내가 맞히면 피해 ×1.5 (항상)', raid: '내가 맞히면 피해 ×1.5 (항상)' },
  { f: 'spear', label: '창기사', emoji: '🔱', desc: '긴 창으로 멀리서 찌르는 기사', skill: '⚡ 선제 돌격', boss: '전투 시작·페이즈가 바뀔 때 보스를 먼저 찔러요 (내 공격력 ×2)', raid: '페이즈가 시작될 때마다 보스를 먼저 찔러요 (피해 8)' },
  { f: 'bow', label: '궁수', emoji: '🏹', desc: '멀리서 정확하게 화살을 쏘는 명사수', skill: '🎯 매의 눈', boss: '내 차례 보기 고르기 문제에서 오답 하나를 지워요 (한 판에 2번)', raid: '보기 고르기 문제에서 오답 하나를 지워요 (페이즈마다 2번)' },
  { f: 'staff', label: '마법사', emoji: '🪄', desc: '지팡이로 마법을 부리는 지혜로운 마법사', skill: '🍀 행운의 주문', boss: '가위바위보·홀짝에서 지거나 비기면 이긴 걸로 바꿔요 (한 판에 1번)', raid: '가위바위보·홀짝에서 지거나 비기면 이긴 걸로 바꿔요 (페이즈마다 1번)' },
  { f: 'hammer', label: '수호자', emoji: '🔨', desc: '묵직한 망치로 친구들을 지키는 수호자', skill: '🛡️ 철벽 방어', boss: '팀 생명이 깎일 때 한 번 막아요 (한 판에 1번)', raid: '내 목숨이 깎일 때 한 번 막아요 (페이즈마다 1번)' },
]
export const JOB_MAP = Object.fromEntries(JOBS.map((j) => [j.f, j])) as Record<WeaponFamily, Job>

// 전직 조건: 보스 단계 클리어 · 집 단계 · 펫 단계 (2 = 아동)
export const JOB_NEED = { boss: 3, house: 3, pet: 2 }

export type JobState = { f: WeaponFamily; at: number } // at = 전직한 시각
export function normalizeJob(raw: unknown): JobState | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (!isFamily(o.f)) return null
  return { f: o.f, at: typeof o.at === 'number' && Number.isFinite(o.at) ? o.at : 0 }
}

export type JobCheck = { label: string; ok: boolean; now: string }
export function jobChecks(bossCleared: number, houseLv: number, petSt: number): JobCheck[] {
  return [
    { label: `보스 ${JOB_NEED.boss}단계 클리어`, ok: bossCleared >= JOB_NEED.boss, now: bossCleared ? `지금 ${bossCleared}단계까지 깸` : '아직 못 깸' },
    { label: `집 ${JOB_NEED.house}단계 (${houseLevel(JOB_NEED.house).label})`, ok: houseLv >= JOB_NEED.house, now: `지금 ${houseLv}단계` },
    { label: `펫 ${STAGE_NAMES[JOB_NEED.pet]}까지 키우기`, ok: petSt >= JOB_NEED.pet, now: petSt > 0 ? `지금 ${STAGE_NAMES[Math.min(4, petSt)]}` : '아직 알이거나 없음' },
  ]
}

// ── 직업 기술 숫자 (보스전·레이드) ──
export const SKILL = {
  swordMs: 3000, // 검사: 제한 시간 +
  axeMult: 1.5, // 광전사: 정답 피해 ×
  spearMult: 2, // 창기사: (보스) 내 공격력 × 이만큼 먼저 찌른다
  spearRaid: 8, // 창기사: (레이드) 페이즈 시작 피해
  bowUses: 2, // 궁수: 오답 지우기 횟수
  staffUses: 1, // 마법사: 운 바꾸기 횟수
  hammerUses: 1, // 수호자: 막기 횟수
}
export const jobOf = (jb: unknown): WeaponFamily | null => (isFamily(jb) ? jb : null)
export const jobIcon = (jb: unknown): string => (isFamily(jb) ? JOB_MAP[jb].emoji + ' ' : '')

// 기술 알림 글에서 어느 직업의 기술인지 찾는다 (글자색·효과용)
export const skillJob = (text: string): WeaponFamily | null => JOBS.find((j) => text.startsWith(j.skill))?.f ?? null

export const jobLabel = (j: JobState | null) => (j ? `${FAMILY_EMOJI[j.f]} ${JOB_MAP[j.f].label}` : '견습 검사')

// 금요일 학급 레이드 — 규칙과 숫자 (다른 파일을 불러오지 않는다)

// 이 인원이 모여야 출발할 수 있다. (개발 중에만 주소 끝에 ?rmin=2 처럼 붙여 시험할 수 있고, 배포본은 항상 8명)
export const RAID_MIN = (() => {
  try {
    const m = new URLSearchParams(location.search).get('rmin')
    return import.meta.env.DEV && m ? Math.max(1, Number(m)) : 8
  } catch {
    return 8
  }
})()
export const RAID_MAX = 30 // 한 반이 한 번에 들어올 수 있는 최대 인원
export const RAID_TRIES = 3 // 한 반이 하루에 도전할 수 있는 횟수 (반 전체 기준)
export const RAID_COUNTDOWN_S = 10 // 대장이 시작을 누른 뒤 출발까지
export const RAID_PHASES = 4 // 보스의 페이즈 수
// 한 사람이 한 페이즈에서 줄 수 있는 피해의 상한 = 그 페이즈 체력의 이 비율
//  → 한 페이즈를 깨려면 (이론상) 최소 8명이 모두 상한을 채워야 한다. 5명으로는 절대 못 이긴다.
// (개발 중에만 주소 끝에 ?rcap=0.5 &rhpm=0.2 를 붙여 시험할 수 있다. 배포본은 항상 이 값)
const devQ = (k: string) => {
  try {
    return import.meta.env.DEV ? new URLSearchParams(location.search).get(k) : null
  } catch {
    return null
  }
}
export const RAID_CAP = devQ('rcap') ? Number(devQ('rcap')) : 0.125
// (개발 중에만) 서버 확인 없이 입장·출발한다 — 개발 화면에서 확인용으로 쓰는 장난감 반 시험 도구
export const raidDevForce = () => devQ('rforce') !== null && devQ('rforce') !== '0'

/* ---------- 전투 규칙 ---------- */
export const RAID_LIVES = 3 // 한 사람의 목숨. 틀리면(시간 초과 포함) 하나씩 줄고, 0이 되면 쓰러진다
export const RAID_HEAL = 2 // 페이즈를 넘길 때 살아 있는 사람이 되찾는 목숨 (최대 RAID_LIVES까지)
export const RAID_RETURN_LIVES = 2 // 쓰러져 있던 사람이 다음 페이즈에 돌아올 때의 목숨
// 페이즈별 보스 체력 (모두 함께 깎는 하나의 체력). 한 사람은 그 페이즈 체력의 RAID_CAP 만큼까지만 줄 수 있다.
const HPM = devQ('rhpm') ? Number(devQ('rhpm')) : 1
// 기본 체력. 12명 반이 평균 정답률 70% 안팎일 때 한 번에 깰 확률이 30~40% 정도가 되도록 시뮬레이션으로 맞췄다.
// 선생님이 "체력 배율"로 반마다 조절할 수 있다 (raidHpFor).
export const RAID_HP = [140, 155, 170, 185].map((h) => Math.max(8, Math.round(h * HPM)))
export const RAID_HP_MULTS = [0.7, 0.85, 1, 1.2, 1.4] // 선생님이 고를 수 있는 배율
export const raidHpFor = (mult: number) => RAID_HP.map((h) => Math.max(8, Math.round(h * (Number.isFinite(mult) && mult > 0 ? Math.min(2, Math.max(0.4, mult)) : 1))))
export const RAID_TIME_LIMIT_S = 20 * 60 // 한 번 도전에 주어지는 시간
export const RAID_INTRO_MS = 3500 // 보스가 눈을 뜨는 연출
export const RAID_BETWEEN_MS = 5500 // 페이즈가 끝나고 다음 모습으로 바뀌는 시간
export const RAID_Q_GAP_MS = 1300 // 문제를 풀고 결과(정답)를 보여 주는 시간
export const RAID_LUCK_EVERY = 3 // 이 번째 문제마다 가위바위보·홀짝 (한 사람이 쉬지 않고 독주하지 못하게)
export const RAID_TIME_MULT = 1.5 // 보스전 문제의 제한 시간에 곱한다 (혼자 읽고 푸니까 조금 넉넉하게)
// 난이도(1 쉬움 · 2 보통 · 3 어려움)는 랜덤으로 나오고, 페이즈가 오를수록 어려운 문제가 많아진다. [쉬움, 보통, 어려움] 비율
export const RAID_TIER_MIX: [number, number, number][] = [
  [0.6, 0.3, 0.1],
  [0.3, 0.45, 0.25],
  [0.15, 0.4, 0.45],
  [0.05, 0.3, 0.65],
]
export const RAID_DMG = [0, 2, 3, 4] // 난이도별로 정답을 맞혔을 때의 피해 (1~3)
export const RAID_LUCK_DMG = 6 // 가위바위보·홀짝에서 이겼을 때의 피해

/* ---------- 보상 ---------- */
export const RAID_REWARD_CLEAR = 150 // 거인을 쓰러뜨리면 함께 싸운 모두가 받는 도토리
export const RAID_REWARD_MVP = 100 // 이번 도전에서 가장 많이 공격한 사람(MVP)이 더 받는 도토리
export const RAID_REWARD_PHASE = 10 // (못 깼을 때) 넘긴 페이즈마다 위로로 받는 도토리
export const RAID_REWARD_PHASE_MAX = 30
// 레이드를 쓰러뜨린 횟수에 따른 칭호 — 이름 옆에 색깔 글자로 붙는다. 가장 높은 것 하나만 보인다.
export const RAID_TITLES: { at: number; text: string; color: string }[] = [
  { at: 1, text: '거인 사냥꾼', color: '#4f9d4b' },
  { at: 2, text: '거인 정복자', color: '#2f7fd1' },
  { at: 4, text: '거인 대영웅', color: '#8a4fd6' },
  { at: 8, text: '전설의 용사', color: '#e0452b' },
]
export const raidTitleOf = (clears: number): { text: string; color: string } | null => {
  let t: { text: string; color: string } | null = null
  for (const x of RAID_TITLES) if (clears >= x.at) t = x
  return t
}
// 한 도전의 MVP = 이번 도전에서 가장 많은 피해를 준 사람 (같으면 이름이 앞서는 사람). 피해를 준 사람이 없으면 없음.
export function raidMvpOf(rows: { n: string; t: number }[]): string | null {
  const best = rows.filter((r) => r.t > 0).sort((a, b) => b.t - a.t || (a.n < b.n ? -1 : 1))[0]
  return best ? best.n : null
}

// 한 사람이 그 페이즈(체력 hp)에서 줄 수 있는 최대 피해
export const raidCapOf = (hp: number) => Math.max(1, Math.floor(hp * RAID_CAP))

export const RAID_OPEN_TEXT ='금요일 오전 8시부터 오후 2시까지 열려요'

// 레이드를 아직 모든 학생에게 열지 않은 동안, 이 계정과 시험용 주소(?raid)에서만 입구가 보인다.
const RAID_TESTERS = ['원종민']
export function raidVisible(name: string | null | undefined): boolean {
  if (name && RAID_TESTERS.includes(name.trim())) return true
  try {
    return location.search.includes('raid') || location.hash.includes('raid')
  } catch {
    return false
  }
}

// 대기실에서 서는 자리 (i번째). 사람이 들어오고 나가도 앞사람은 그대로 서 있게, 한 줄에 10명씩 고정으로 채운다.
export const RAID_BOSS = { x: 0, z: -12 }
export function raidSlot(i: number): [number, number] {
  const row = Math.floor(i / 10)
  const k = (i % 10) - 4.5
  return [k * 1.5, 4 + row * 2.3 + Math.abs(k) * 0.3]
}
export function raidFacing(x: number, z: number): number {
  return Math.atan2(RAID_BOSS.x - x, RAID_BOSS.z - z)
}

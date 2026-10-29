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
export const RAID_CAP = 0.125

export const RAID_OPEN_TEXT = '금요일 오전 8시부터 오후 2시까지 열려요'

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

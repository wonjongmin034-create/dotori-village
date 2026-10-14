// 오목 주간 시상 시계 — 한국 시간 기준. 한 주는 "금요일 오후 3시 ~ 다음 금요일 오후 3시".
// 금요일 오후 3시가 되면 지난 한 주의 승점 1~3등이 정해져서 오목왕 모자를 받고,
// 그 전 주의 모자는 사라진다.

const HOUR = 3600_000
const DAY = 24 * HOUR
const KST = 9 * HOUR
// 기준: 2026-01-02(금) 15:00 KST = 2026-01-02 06:00 UTC
const T0 = Date.UTC(2026, 0, 2, 6, 0, 0)

export const weekIndex = (now = Date.now()) => Math.floor((now - T0) / (7 * DAY))
export const weekStart = (idx: number) => T0 + idx * 7 * DAY
export const weekEnd = (idx: number) => weekStart(idx + 1) // = 다음 시상 시각

const pad = (n: number) => String(n).padStart(2, '0')
// 한국 날짜 YYYY-MM-DD (하루 보상 제한에 쓴다)
export function kstDay(now = Date.now()): string {
  const d = new Date(now + KST)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

// 다음 시상까지 남은 시간 글
export function untilAward(now = Date.now()): string {
  const ms = weekEnd(weekIndex(now)) - now
  const d = Math.floor(ms / DAY)
  const h = Math.floor((ms % DAY) / HOUR)
  const m = Math.floor((ms % HOUR) / 60_000)
  if (d > 0) return `${d}일 ${h}시간`
  if (h > 0) return `${h}시간 ${m}분`
  return `${m}분`
}

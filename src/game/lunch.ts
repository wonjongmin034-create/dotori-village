// 급식 데이터 — 선생님이 한 달치를 여기에 넣습니다.
//
// 형식: 날짜(YYYY-MM-DD) → 메뉴 배열
// 예시 몇 개만 넣어뒀습니다. 실제 급식표를 주시면 이 객체를 통째로 교체합니다.

export const LUNCH: Record<string, string[]> = {
  '2026-09-07': ['찰보리밥', '쇠고기미역국', '제육볶음', '오이무침', '배추김치', '요구르트'],
  '2026-09-08': ['백미밥', '순두부찌개', '닭갈비', '양배추샐러드', '깍두기', '사과'],
  '2026-09-09': ['카레라이스', '팽이버섯국', '치킨너겟', '단무지', '배추김치', '우유'],
  '2026-09-10': ['잡곡밥', '떡국', '고등어구이', '시금치나물', '총각김치', '바나나'],
  '2026-09-11': ['볶음밥', '유부장국', '탕수육', '브로콜리무침', '배추김치', '오렌지주스'],
}

// 그 날 급식 (없으면 null)
export function lunchFor(dateKey: string): string[] | null {
  return LUNCH[dateKey] ?? null
}

// YYYY-MM-DD (로컬 기준)
export function dateKey(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// 표시용 "9월 3일 (수)"
const WD = ['일', '월', '화', '수', '목', '금', '토']
export function dateLabel(d: Date): string {
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WD[d.getDay()]})`
}

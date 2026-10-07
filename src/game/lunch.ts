// 급식 데이터 — 선생님이 한 달치를 여기에 넣습니다.
// 형식: 날짜(YYYY-MM-DD) → 메뉴 배열.  새 달 식단표를 주시면 이 파일을 교체합니다.
// (2026년 9월 식단표 반영)

export const LUNCH: Record<string, string[]> = {
  '2026-09-01': ['쌀밥', '잔치국수', '우리밀케이크', '김치무침', '소떡갈떡꼬치'],
  '2026-09-02': ['혼합잡곡밥', '감자옹심이국', '오삼불고기', '양념깻잎지', '총각김치', '바나나'],
  '2026-09-03': ['차수수밥', '마라탕', '쌀로치즈치킨까스', '배추김치', '그린샐러드&유자레몬D', '친환경쌀과자'],
  '2026-09-04': ['발아현미밥', '대구탕', '가지나물', '부산식돼지갈비강정', '백김치', '파인애플'],
  '2026-09-07': ['홍미밥', '생크림오믈렛', '쇠고기미역국', '돼지불고기', '한식잡채', '배추김치'],
  '2026-09-08': ['혼합잡곡밥', '열무된장국', '치폴레훈제오리', '마늘쫑고추장무침', '무쌈&쌈장', '백김치', '비요뜨(초코링)'],
  '2026-09-09': ['자장밥', '계란국', '단무지무침', '유린기', '깍두기', '구슬아이스크림'],
  '2026-09-10': ['귀리밥', '부대찌개', '돼지갈비찜', '청포묵무침', '석박지', '파인애플'],
  '2026-09-11': ['보리밥', '호박잎된장국', '건파래볶음', '노각생채', '맵달장 문볼락 생선구이', '총각김치', '황치즈파이'],
  '2026-09-14': ['현미밥', '도토리묵채국', '두툼떡갈비조림', '숙주미나리무침', '백김치', '골드키위'],
  '2026-09-15': ['차조밥', '순두부백탕', '오리불고기', '양배추쌈&쌈장', '배추김치', '아이스망고바'],
  '2026-09-16': ['작은김가루밥', '칙필레미니버거', '꼬들오이지무침', '감자튀김&케찹', '깍두기', '애플망고쥬스'],
  '2026-09-17': ['너비아니곤드레밥', '청국장찌개', '골뱅이야채무침', '배추김치', '파인애플(조각)'],
  '2026-09-18': ['강황쌀밥', '김치만두국', '마늘쫑우엉채볶음', '깐쇼새우', '배추김치', '요구르트'],
  '2026-09-21': ['찹쌀밥', '김치어묵국', '블루베리샐러드', '달콘치킨', '총각김치', '멜론'],
  '2026-09-22': ['기장밥', '소고기육개장', '메추리알돈육장조림', '상추겉절이', '배추김치', '씨없는포도'],
  '2026-09-23': ['현미밥', '한우갈비탕', '시금치나물', '계란옷입은동그랑땡&케찹', '김치전', '배추김치', '찹쌀유과'],
  '2026-09-29': ['차수수밥', '북어계란국', '안동찜닭', '도라지배무침', '배추김치', '초코마카롱'],
  '2026-09-30': ['나물비빔밥&달걀후라이', '미소두부된장국', '소고기볶음고추장', '소떡소떡', '배추김치', '골드키위'],
}

// 급식이 없는 날 (사유 표시용). 채식의 날(9/11, 9/18)은 급식이 있으므로 제외.
export const NO_SCHOOL: Record<string, string> = {
  '2026-09-24': '추석 연휴',
  '2026-09-25': '추석',
  '2026-09-28': '재량 휴업일',
}

// 선생님이 대시보드에서 올린 급식표 (반마다 따로, classes.lunch 에 저장)
export type LunchFile = { path: string; title: string; month: string; pages: number }
export type ClassLunch = {
  file?: LunchFile
  menu?: Record<string, string[]>
  off?: Record<string, string> // 급식 없는 날 → 이유 (공휴일·개교기념일 등)
}

const hasCustom = (custom?: Record<string, string[]>) => !!custom && Object.keys(custom).length > 0

// 선생님이 날짜별 메뉴를 하나라도 올렸으면 그 반은 그것만 쓴다 (기본 내장 9월 식단은 무시).
export function lunchFor(dateKey: string, custom?: Record<string, string[]>): string[] | null {
  return (hasCustom(custom) ? custom![dateKey] : LUNCH[dateKey]) ?? null
}

export function noSchoolReason(
  dateKey: string,
  custom?: Record<string, string[]>,
  off?: Record<string, string>,
): string | null {
  if (off?.[dateKey]) return off[dateKey]
  return hasCustom(custom) ? null : (NO_SCHOOL[dateKey] ?? null)
}

// DB(jsonb)에서 온 값을 안전하게 거른다.
export function sanitizeLunch(raw: unknown): ClassLunch {
  const out: ClassLunch = {}
  if (!raw || typeof raw !== 'object') return out
  const o = raw as Record<string, unknown>
  const f = o.file as Record<string, unknown> | undefined
  if (f && typeof f.path === 'string' && f.path) {
    out.file = {
      path: f.path,
      title: typeof f.title === 'string' && f.title ? f.title : '급식표',
      month: typeof f.month === 'string' ? f.month : '',
      pages: typeof f.pages === 'number' ? f.pages : 1,
    }
  }
  if (o.menu && typeof o.menu === 'object') {
    const menu: Record<string, string[]> = {}
    for (const [k, v] of Object.entries(o.menu as Record<string, unknown>)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(k) && Array.isArray(v)) {
        const items = v.map((x) => String(x).trim()).filter(Boolean)
        if (items.length) menu[k] = items
      }
    }
    if (Object.keys(menu).length) out.menu = menu
  }
  if (o.off && typeof o.off === 'object') {
    const off: Record<string, string> = {}
    for (const [k, v] of Object.entries(o.off as Record<string, unknown>)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(k) && typeof v === 'string' && v.trim()) off[k] = v.trim()
    }
    if (Object.keys(off).length) out.off = off
  }
  return out
}

/* ---------- 붙여넣은 급식표 글 → 날짜별 메뉴 ---------- */
// 한 줄에 하루. 예)  10/7 (화) 잡곡밥, 미역국, 불고기, 배추김치
//                  10월 8일 쌀밥 · 콩나물국 · 닭갈비
//                  2026-10-12 현미밥, 어묵국
// 날짜만 있는 줄 다음 줄들은 그 날의 메뉴로 이어 붙인다. 알레르기 번호(1.5.6)는 지운다.
const pad = (n: number) => String(n).padStart(2, '0')

function splitItems(text: string): string[] {
  return text
    .replace(/^\(?[월화수목금토일]\)?(요일)?\s*/, '')
    .split(/[,，、·ㆍ\t]|\s{2,}/)
    .map((x) =>
      x
        .replace(/\(\s*[\d.,\s]+\)/g, '') // (1.5.6)
        .replace(/(?<=[가-힣A-Za-z)&])[\d.]+$/, '') // 미역국1.5.6.
        .trim(),
    )
    .filter(Boolean)
}

export function parseLunchText(
  text: string,
  year: number,
  month: number,
): { menu: Record<string, string[]>; off: Record<string, string>; days: number; errors: number } {
  const menu: Record<string, string[]> = {}
  const off: Record<string, string> = {}
  let cur: string | null = null
  let errors = 0
  const key = (y: number, m: number, d: number) =>
    m >= 1 && m <= 12 && d >= 1 && d <= 31 ? `${y}-${pad(m)}-${pad(d)}` : null

  for (const raw of text.replace(/\r/g, '').split('\n')) {
    const line = raw.trim()
    if (!line) continue
    let k: string | null | undefined
    let rest = line
    let m: RegExpMatchArray | null
    if ((m = line.match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})\.?\s*(.*)$/))) {
      k = key(+m[1], +m[2], +m[3])
      rest = m[4]
    } else if ((m = line.match(/^(\d{1,2})\s*월\s*(\d{1,2})\s*일?\s*(.*)$/))) {
      k = key(year, +m[1], +m[2])
      rest = m[3]
    } else if (
      (m = line.match(/^(\d{1,2})[/.](\d{1,2})\.?\s+(.*)$/)) ||
      (m = line.match(/^(\d{1,2})[/.](\d{1,2})\.?$/))
    ) {
      k = key(year, +m[1], +m[2])
      rest = m[3] ?? ''
    } else if (
      (m = line.match(/^(\d{1,2})\s*일\s*(.*)$/)) ||
      (m = line.match(/^(\d{1,2})\s*[:：]\s*(.*)$/))
    ) {
      k = key(year, month, +m[1])
      rest = m[2]
    }
    if (k === undefined) {
      // 날짜가 없는 줄 → 직전 날짜의 메뉴 이어쓰기
      if (cur) menu[cur] = [...(menu[cur] ?? []), ...splitItems(line)]
      else errors++
      continue
    }
    if (k === null) {
      errors++
      cur = null
      continue
    }
    cur = k
    // "※한글날" → 급식 없는 날
    const hol = rest.replace(/^\(?[월화수목금토일]\)?(요일)?\s*/, '').trim().match(/^※\s*(.+)$/)
    if (hol) {
      off[k] = hol[1].trim()
      delete menu[k]
      cur = null
      continue
    }
    const items = splitItems(rest)
    menu[k] = items.length ? items : (menu[k] ?? [])
  }
  for (const k of Object.keys(menu)) if (!menu[k].length) delete menu[k]
  return { menu, off, days: Object.keys(menu).length + Object.keys(off).length, errors }
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

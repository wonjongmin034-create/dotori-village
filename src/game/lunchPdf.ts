import type { PDFDocumentProxy } from 'pdfjs-dist'

// 학교 월간 식단표 PDF(요일 칸 × 주 단위 표)에서 날짜별 메뉴를 뽑아 낸다.
// 표 모양: 위에 "월요일~금요일" 머리글, 주마다 "10월 7일" 같은 날짜 줄, 그 아래로 메뉴가 세로로 나열,
// 주 끝에 "* 에너지/단백질/…" 줄. 글자 위치(x, y)로 어느 날짜 칸인지 맞춘다.

type It = { s: string; x: number; y: number; cx: number }
type Label = It & { month: number; day: number; col: number }

const WD = ['일', '월', '화', '수', '목', '금', '토']
const pad = (n: number) => String(n).padStart(2, '0')
const keyOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

const LABEL = /^(\d{1,2})\s*월\s*(\d{1,2})\s*일/
const HOLIDAY = /(공휴일|휴업|방학|개교기념|한글날|현충일|추석|설날|어린이날|광복절|개천절|크리스마스|성탄|삼일절|석가탄신|부처님|재량|대체|연휴|시험|방과후|급식\s*없|없음)/

// 메뉴 이름 정리: 알레르기 번호·표시 글자 제거
function cleanName(raw: string): string {
  return raw
    .replace(/^[*※◈★\s]+/, '')
    .replace(/\((서|우|완|판|여|백|자율)\)/g, '') // 표시용 한 글자
    .replace(/\(\s*[\d.,\s]+\)?/g, '') // (1.5.6) / 끊긴 (1.5.
    .replace(/(?<=[가-힣)])[nb]$/, '') // 끝에 붙은 표시용 n, b
    .replace(/(?<=[가-힣])\*(?=[가-힣])/g, '&') // 콩나물밥*양념장 → 콩나물밥&양념장
    .replace(/\s+/g, ' ')
    .trim()
}

async function pageItems(doc: PDFDocumentProxy, n: number): Promise<It[]> {
  const page = await doc.getPage(n)
  const vp = page.getViewport({ scale: 1 })
  const tc = await page.getTextContent()
  const out: It[] = []
  for (const i of tc.items) {
    if (!('str' in i) || !i.str.trim()) continue
    out.push({
      s: i.str.trim(),
      x: i.transform[4],
      y: vp.height - i.transform[5],
      cx: i.transform[4] + i.width / 2,
    })
  }
  return out
}

function columnCenters(items: It[]): number[] | null {
  // ① "월요일…금요일" 머리글
  const heads: number[] = []
  for (let k = 1; k <= 5; k++) {
    const h = items.find((i) => i.s === `${WD[k]}요일`)
    if (h) heads.push(h.cx)
  }
  if (heads.length === 5) return heads
  // ② 머리글이 없으면 날짜 줄의 x 위치를 5묶음으로 나눈다
  const xs = items.filter((i) => LABEL.test(i.s)).map((i) => i.cx).sort((a, b) => a - b)
  const groups: number[][] = []
  for (const x of xs) {
    const g = groups[groups.length - 1]
    if (g && x - g[g.length - 1] < 40) g.push(x)
    else groups.push([x])
  }
  if (groups.length === 5) return groups.map((g) => g.reduce((a, b) => a + b, 0) / g.length)
  return null
}

const nearest = (centers: number[], cx: number) =>
  centers.reduce((best, c, i) => (Math.abs(c - cx) < Math.abs(centers[best] - cx) ? i : best), 0)

export type LunchExtract = {
  menu: Record<string, string[]>
  off: Record<string, string> // 급식 없는 날(공휴일 등) → 이유
}

// year: 날짜 줄에 연도가 없으므로 선생님이 고른 달의 연도를 쓴다.
export async function extractLunch(doc: PDFDocumentProxy, year: number): Promise<LunchExtract | null> {
  const all: { n: number; items: It[] }[] = []
  for (let n = 1; n <= doc.numPages; n++) all.push({ n, items: await pageItems(doc, n) })

  // 머리글은 첫 쪽에만 있을 수 있어서 전체에서 찾는다
  const centers = columnCenters(all.flatMap((p) => p.items))
  if (!centers) return null

  const menu: Record<string, string[]> = {}
  const off: Record<string, string> = {}
  let found = 0

  for (const { items } of all) {
    const labels: Label[] = items
      .filter((i) => LABEL.test(i.s))
      .map((i): Label => {
        const m = i.s.match(LABEL)!
        return { ...i, month: +m[1], day: +m[2], col: nearest(centers, i.cx) }
      })
      .sort((a, b) => a.y - b.y || a.x - b.x)
    if (!labels.length) continue

    // 같은 높이의 날짜 줄끼리 묶기 = 한 주
    const rows: Label[][] = []
    for (const l of labels) {
      const r = rows[rows.length - 1]
      if (r && Math.abs(l.y - r[0].y) < 6) r.push(l)
      else rows.push([l])
    }

    const nutri = items.filter((i) => i.s.startsWith('*') && /에너지|칼슘/.test(i.s))

    rows.forEach((row, ri) => {
      const rowY = row[0].y
      const nextY = rows[ri + 1]?.[0].y ?? Infinity

      // 이 주의 월요일 날짜: 날짜 줄들이 가리키는 월요일 중 가장 많은 것 (표에 오타가 있어도 안전)
      const votes = new Map<string, { d: Date; n: number }>()
      for (const l of row) {
        const d = new Date(year, l.month - 1, l.day - l.col)
        const k = keyOf(d)
        votes.set(k, { d, n: (votes.get(k)?.n ?? 0) + 1 })
      }
      const monday = [...votes.values()].sort((a, b) => b.n - a.n)[0].d

      // 날짜가 있는 칸만 읽는다 (1주차의 빈 칸에 있는 안내문 등은 건너뜀)
      const cols = [...new Set(row.map((l) => l.col))]
      const rowNutri = nutri.filter((i) => i.y > rowY + 3 && i.y < nextY)
      const rowEnd = rowNutri.length ? Math.min(...rowNutri.map((i) => i.y)) : nextY

      for (const col of cols) {
        const colNutri = rowNutri.filter((i) => nearest(centers, i.cx) === col).map((i) => i.y)
        const endY = Math.min(colNutri.length ? Math.min(...colNutri) : rowEnd, nextY) - 2
        const cell = items
          .filter(
            (i) =>
              i.y > rowY + 3 &&
              i.y < endY &&
              nearest(centers, i.cx) === col &&
              !LABEL.test(i.s) &&
              !i.s.startsWith('*') &&
              !/^[\d,]+(\.\d+)?(\/[\d,.]+)+$/.test(i.s),
          )
          .sort((a, b) => a.y - b.y || a.x - b.x)

        // 줄바꿈으로 끊긴 알레르기 번호 이어 붙이기: "…(5.6.10.1" + "5.16.18)"
        const lines: string[] = []
        for (const it of cell) {
          const prev = lines[lines.length - 1]
          const open = prev && (prev.match(/\(/g)?.length ?? 0) > (prev.match(/\)/g)?.length ?? 0)
          if (open && /^[\d.,)]/.test(it.s)) lines[lines.length - 1] = prev + it.s
          else lines.push(it.s)
        }
        const names = lines.map(cleanName).filter((s) => s && !/^[\d.,)\s]+$/.test(s))
        if (!names.length) continue

        const date = new Date(monday)
        date.setDate(monday.getDate() + col)
        const k = keyOf(date)
        // 메뉴가 아니라 휴무 안내만 있는 칸
        if (names.every((s) => HOLIDAY.test(s)) && names.length <= 2) {
          off[k] = names.join(' ')
        } else {
          menu[k] = [...new Set(names)]
        }
        found++
      }
    })
  }
  return found ? { menu, off } : null
}

// 읽어 온 결과를 선생님이 확인·수정할 수 있는 글로 (붙여넣기 칸과 같은 형식)
export function lunchToText(r: LunchExtract): string {
  const keys = [...new Set([...Object.keys(r.menu), ...Object.keys(r.off)])].sort()
  return keys
    .map((k) => {
      const d = new Date(`${k}T00:00:00`)
      const head = `${d.getMonth() + 1}/${d.getDate()} (${WD[d.getDay()]})`
      return r.off[k] ? `${head} ※${r.off[k]}` : `${head} ${r.menu[k].join(', ')}`
    })
    .join('\n')
}

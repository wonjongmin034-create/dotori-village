import type { ReactElement } from 'react'
import type { Figure } from './bossShapes'

// 5단계 보스 문제에 나오는 도형 그림 (SVG). 변의 길이를 표시하고, 거꾸로 구하는 문제는 모르는 길이를 ?로 가린다.
// 모양은 길이에 맞게 비율을 줄여서 그린다 (정확한 축척은 아니다).

const W = 240
const H = 150
const PAD = 26
const FILL = '#bfe4ff'
const STROKE = '#2d5f8f'
const SHADE = '#ffd27a'

type Pt = [number, number]
const poly = (pts: Pt[]) => pts.map((p) => p.join(',')).join(' ')

function Label({ x, y, text, anchor = 'middle' }: { x: number; y: number; text: string; anchor?: 'start' | 'middle' | 'end' }) {
  return (
    <text x={x} y={y} textAnchor={anchor} fontSize="13" fontWeight="800" fill="#1d3b57" stroke="#fff" strokeWidth="3" paintOrder="stroke">
      {text}
    </text>
  )
}

// 가려야 하는 길이면 ? 로
const val = (fig: Figure, key: string, v: number) => (fig.hide?.includes(key) ? '?' : `${v}cm`)

// 그림 영역에 맞게 크기를 줄이는 비율
const fit = (w: number, h: number) => Math.min((W - PAD * 2) / w, (H - PAD * 2) / h)

export function ShapeFig({ fig }: { fig: Figure }) {
  let body: ReactElement

  if (fig.k === 'rect' || fig.k === 'square') {
    const w = fig.k === 'rect' ? fig.w : fig.s
    const h = fig.k === 'rect' ? fig.h : fig.s
    const k = fit(w, h)
    const pw = w * k
    const ph = h * k
    const x0 = (W - pw) / 2
    const y0 = (H - ph) / 2
    body = (
      <>
        <rect x={x0} y={y0} width={pw} height={ph} fill={FILL} stroke={STROKE} strokeWidth="2.5" />
        <Label x={x0 + pw / 2} y={y0 + ph + 16} text={fig.k === 'rect' ? val(fig, 'w', w) : val(fig, 's', w)} />
        <Label x={x0 + pw + 8} y={y0 + ph / 2 + 4} anchor="start" text={fig.k === 'rect' ? val(fig, 'h', h) : val(fig, 's', h)} />
      </>
    )
  } else if (fig.k === 'para') {
    const slant = Math.min(fig.base * 0.45, 7)
    const k = fit(fig.base + slant, fig.h)
    const pb = fig.base * k
    const ps = slant * k
    const ph = fig.h * k
    const x0 = (W - pb - ps) / 2
    const y0 = (H - ph) / 2
    const pts: Pt[] = [
      [x0, y0 + ph],
      [x0 + pb, y0 + ph],
      [x0 + pb + ps, y0],
      [x0 + ps, y0],
    ]
    body = (
      <>
        <polygon points={poly(pts)} fill={FILL} stroke={STROKE} strokeWidth="2.5" />
        <line x1={x0 + ps} y1={y0} x2={x0 + ps} y2={y0 + ph} stroke="#c0392b" strokeWidth="2" strokeDasharray="5 4" />
        <polyline points={poly([[x0 + ps, y0 + ph - 9], [x0 + ps + 9, y0 + ph - 9], [x0 + ps + 9, y0 + ph]])} fill="none" stroke="#c0392b" strokeWidth="1.5" />
        <Label x={x0 + pb / 2} y={y0 + ph + 16} text={val(fig, 'base', fig.base)} />
        <Label x={x0 + ps - 6} y={y0 + ph / 2 + 4} anchor="end" text={val(fig, 'h', fig.h)} />
        {fig.side != null && <Label x={x0 + pb + ps + 6} y={y0 + ph / 2 + 4} anchor="start" text={`${fig.side}cm`} />}
      </>
    )
  } else if (fig.k === 'tri') {
    const apex = Math.min(fig.base * 0.3, 5)
    const k = fit(fig.base, fig.h)
    const pb = fig.base * k
    const ph = fig.h * k
    const x0 = (W - pb) / 2
    const y0 = (H - ph) / 2
    const ax = x0 + apex * k
    const pts: Pt[] = [
      [x0, y0 + ph],
      [x0 + pb, y0 + ph],
      [ax, y0],
    ]
    body = (
      <>
        <polygon points={poly(pts)} fill={FILL} stroke={STROKE} strokeWidth="2.5" />
        <line x1={ax} y1={y0} x2={ax} y2={y0 + ph} stroke="#c0392b" strokeWidth="2" strokeDasharray="5 4" />
        <polyline points={poly([[ax, y0 + ph - 9], [ax + 9, y0 + ph - 9], [ax + 9, y0 + ph]])} fill="none" stroke="#c0392b" strokeWidth="1.5" />
        <Label x={x0 + pb / 2} y={y0 + ph + 16} text={val(fig, 'base', fig.base)} />
        <Label x={ax - 6} y={y0 + ph / 2 + 4} anchor="end" text={val(fig, 'h', fig.h)} />
      </>
    )
  } else if (fig.k === 'trap') {
    const k = fit(Math.max(fig.top, fig.bottom), fig.h)
    const pt = fig.top * k
    const pbt = fig.bottom * k
    const ph = fig.h * k
    const x0 = (W - pbt) / 2
    const y0 = (H - ph) / 2
    const off = (pbt - pt) / 2
    const pts: Pt[] = [
      [x0, y0 + ph],
      [x0 + pbt, y0 + ph],
      [x0 + off + pt, y0],
      [x0 + off, y0],
    ]
    body = (
      <>
        <polygon points={poly(pts)} fill={FILL} stroke={STROKE} strokeWidth="2.5" />
        <line x1={x0 + off} y1={y0} x2={x0 + off} y2={y0 + ph} stroke="#c0392b" strokeWidth="2" strokeDasharray="5 4" />
        <Label x={x0 + off + pt / 2} y={y0 - 6} text={`${fig.top}cm`} />
        <Label x={x0 + pbt / 2} y={y0 + ph + 16} text={`${fig.bottom}cm`} />
        <Label x={x0 + off - 6} y={y0 + ph / 2 + 4} anchor="end" text={val(fig, 'h', fig.h)} />
      </>
    )
  } else if (fig.k === 'rhombus') {
    const k = fit(fig.d1, fig.d2)
    const pw = fig.d1 * k
    const ph = fig.d2 * k
    const cx = W / 2
    const cy = H / 2
    const pts: Pt[] = [
      [cx - pw / 2, cy],
      [cx, cy - ph / 2],
      [cx + pw / 2, cy],
      [cx, cy + ph / 2],
    ]
    body = (
      <>
        <polygon points={poly(pts)} fill={FILL} stroke={STROKE} strokeWidth="2.5" />
        <line x1={cx - pw / 2} y1={cy} x2={cx + pw / 2} y2={cy} stroke="#c0392b" strokeWidth="2" strokeDasharray="5 4" />
        <line x1={cx} y1={cy - ph / 2} x2={cx} y2={cy + ph / 2} stroke="#c0392b" strokeWidth="2" strokeDasharray="5 4" />
        <Label x={cx - pw / 4} y={cy - 6} text={`${fig.d1}cm`} />
        <Label x={cx + 6} y={cy + ph / 4} anchor="start" text={val(fig, 'd2', fig.d2)} />
      </>
    )
  } else if (fig.k === 'L') {
    const k = fit(fig.W, fig.H)
    const pw = fig.W * k
    const ph = fig.H * k
    const cw = fig.w * k
    const ch = fig.h * k
    const x0 = (W - pw) / 2
    const y0 = (H - ph) / 2
    // 오른쪽 위 귀퉁이를 뗀 ㄱ자
    const pts: Pt[] = [
      [x0, y0],
      [x0 + pw - cw, y0],
      [x0 + pw - cw, y0 + ch],
      [x0 + pw, y0 + ch],
      [x0 + pw, y0 + ph],
      [x0, y0 + ph],
    ]
    body = (
      <>
        <polygon points={poly(pts)} fill={SHADE} stroke={STROKE} strokeWidth="2.5" />
        <Label x={x0 + pw / 2} y={y0 + ph + 16} text={`${fig.W}cm`} />
        <Label x={x0 - 6} y={y0 + ph / 2 + 4} anchor="end" text={`${fig.H}cm`} />
        <Label x={x0 + pw - cw / 2} y={y0 + ch - 5} text={`${fig.w}cm`} />
        <Label x={x0 + pw - cw - 6} y={y0 + ch / 2 + 4} anchor="end" text={`${fig.h}cm`} />
      </>
    )
  } else {
    // 가장자리만 색칠한 직사각형
    const k = fit(fig.W, fig.H)
    const pw = fig.W * k
    const ph = fig.H * k
    const pt = fig.t * k
    const x0 = (W - pw) / 2
    const y0 = (H - ph) / 2
    body = (
      <>
        <rect x={x0} y={y0} width={pw} height={ph} fill={SHADE} stroke={STROKE} strokeWidth="2.5" />
        <rect x={x0 + pt} y={y0 + pt} width={pw - pt * 2} height={ph - pt * 2} fill="#fff" stroke={STROKE} strokeWidth="2" />
        <Label x={x0 + pw / 2} y={y0 + ph + 16} text={`${fig.W}cm`} />
        <Label x={x0 + pw + 8} y={y0 + ph / 2 + 4} anchor="start" text={`${fig.H}cm`} />
        <Label x={x0 + pt / 2} y={y0 + ph / 2 + 4} text={`${fig.t}`} />
      </>
    )
  }

  return (
    <svg className="shape-fig" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="도형 그림">
      {body}
    </svg>
  )
}

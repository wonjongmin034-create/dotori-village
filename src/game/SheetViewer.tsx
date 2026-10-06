import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import type { PDFDocumentProxy, PDFPageProxy, RenderTask } from 'pdfjs-dist'
import { openPdf } from './pdf'
import type { Stroke, Strokes } from './sheets'

// PDF 학습지를 보여주고 그 위에 펜으로 쓰게 하는 화면. 학생(쓰기)과 선생님(보기 전용)이 함께 쓴다.

type Tool = 'pen' | 'hl' | 'eraser' | 'pan'
type Action =
  | { kind: 'add'; page: string; stroke: Stroke }
  | { kind: 'erase'; page: string; strokes: Stroke[] }

const COLORS = ['#1c1c1c', '#d93a3a', '#2f6fdd', '#2f9e4f']
const HL_COLOR = '#ffe14a'
const WIDTHS = [0.0016, 0.0032, 0.006] // 쪽 가로 길이 대비 (가늘게/보통/굵게)
const HL_WIDTH = 0.022
const ERASE_R = 0.016
const MIN_STEP = 0.0012
const MAX_PIXELS = 9_000_000 // 크롬북 메모리 보호
const MAX_ZOOM = 3

function drawStroke(ctx: CanvasRenderingContext2D, s: Stroke, W: number) {
  const p = s.p
  if (p.length < 2) return
  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = s.c
  ctx.lineWidth = Math.max(1, s.w * W)
  ctx.globalAlpha = s.t === 'h' ? 0.35 : 1
  ctx.beginPath()
  ctx.moveTo(p[0] * W, p[1] * W)
  if (p.length === 2) {
    ctx.lineTo(p[0] * W + 0.01, p[1] * W)
  } else {
    for (let i = 2; i < p.length - 2; i += 2) {
      ctx.quadraticCurveTo(p[i] * W, p[i + 1] * W, ((p[i] + p[i + 2]) / 2) * W, ((p[i + 1] + p[i + 3]) / 2) * W)
    }
    ctx.lineTo(p[p.length - 2] * W, p[p.length - 1] * W)
  }
  ctx.stroke()
  ctx.restore()
}

function hits(s: Stroke, x: number, y: number, r: number): boolean {
  const p = s.p
  const r2 = (r + s.w / 2) ** 2
  if (p.length === 2) return (p[0] - x) ** 2 + (p[1] - y) ** 2 <= r2
  for (let i = 0; i < p.length - 2; i += 2) {
    const ax = p[i],
      ay = p[i + 1],
      bx = p[i + 2],
      by = p[i + 3]
    const dx = bx - ax,
      dy = by - ay
    const len2 = dx * dx + dy * dy
    const t = len2 ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / len2)) : 0
    const cx = ax + t * dx,
      cy = ay + t * dy
    if ((x - cx) ** 2 + (y - cy) ** 2 <= r2) return true
  }
  return false
}

const round4 = (n: number) => Math.round(n * 10000) / 10000

export function SheetViewer({
  title,
  url,
  initial,
  readOnly = false,
  onChange,
  onClose,
  header,
  footer,
}: {
  title: string
  url: string
  initial: Strokes
  readOnly?: boolean
  onChange?: (s: Strokes) => void
  onClose: () => void
  header?: ReactNode
  footer?: ReactNode
}) {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null)
  const [error, setError] = useState(false)
  const [pageNum, setPageNum] = useState(1)
  const [pageObj, setPageObj] = useState<PDFPageProxy | null>(null)
  const [boxW, setBoxW] = useState(0)
  const [zoom, setZoom] = useState(1) // 화면에 보이는 확대 (손가락 확대 중에도 바로 바뀜)
  const [renderZoom, setRenderZoom] = useState(1) // PDF를 선명하게 다시 그릴 때 쓰는 확대 (잠깐 쉬면 따라감)
  const [tool, setTool] = useState<Tool>(readOnly ? 'pan' : 'pen')
  const [color, setColor] = useState(COLORS[0])
  const [widthIdx, setWidthIdx] = useState(1)
  const [version, setVersion] = useState(0) // 필기가 바뀔 때마다 +1 → 다시 그리기

  const scrollRef = useRef<HTMLDivElement>(null)
  const pdfCanvas = useRef<HTMLCanvasElement>(null)
  const inkCanvas = useRef<HTMLCanvasElement>(null)

  const strokes = useRef<Strokes>(initial)
  const undo = useRef<Action[]>([])
  const cur = useRef<{ stroke: Stroke; id: number } | null>(null)
  const erased = useRef<Stroke[]>([])
  const penSeen = useRef(false)
  const touches = useRef(new Map<number, { x: number; y: number }>())
  const ignored = useRef(new Set<number>())
  const gesture = useRef<{ d0: number; zoom0: number } | null>(null)
  const anchor = useRef<{ fx: number; fy: number; cx: number; cy: number } | null>(null)
  const mousePan = useRef<{ x: number; y: number; sl: number; st: number } | null>(null)
  const zoomRef = useRef(1)
  const renderTask = useRef<RenderTask | null>(null)

  // ── PDF 열기 ──
  useEffect(() => {
    let dead = false
    openPdf(url)
      .then((d) => !dead && setPdf(d))
      .catch(() => !dead && setError(true))
    return () => {
      dead = true
    }
  }, [url])

  useEffect(() => {
    if (!pdf) return
    let dead = false
    void pdf.getPage(pageNum).then((p) => !dead && setPageObj(p))
    return () => {
      dead = true
    }
  }, [pdf, pageNum])

  // ── 화면 폭 재기 ──
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const measure = () => setBoxW(el.clientWidth)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const baseW = Math.max(240, Math.min(boxW - 16, 1000))
  const base = pageObj ? pageObj.getViewport({ scale: 1 }) : null
  const aspect = base ? base.height / base.width : 1.414
  const cssW = baseW * zoom
  const cssH = cssW * aspect
  const curPage = pageObj ? String(pageObj.pageNumber) : null

  // ── 확대를 잠깐 쉬면 PDF를 그 크기로 다시 선명하게 ──
  useEffect(() => {
    zoomRef.current = zoom
    const t = setTimeout(() => setRenderZoom(zoom), 160)
    return () => clearTimeout(t)
  }, [zoom])

  // ── 확대 기준점 맞추기 (손가락 가운데가 제자리에 있도록) ──
  const applyAnchor = useCallback(() => {
    const sc = scrollRef.current
    const a = anchor.current
    if (!sc || !a) return
    sc.scrollLeft = a.fx * sc.scrollWidth - a.cx
    sc.scrollTop = a.fy * sc.scrollHeight - a.cy
  }, [])
  useLayoutEffect(() => {
    applyAnchor()
  }, [zoom, applyAnchor])

  const setAnchorAt = (clientX: number, clientY: number) => {
    const sc = scrollRef.current
    if (!sc) return
    const r = sc.getBoundingClientRect()
    const cx = clientX - r.left
    const cy = clientY - r.top
    anchor.current = {
      fx: (sc.scrollLeft + cx) / Math.max(1, sc.scrollWidth),
      fy: (sc.scrollTop + cy) / Math.max(1, sc.scrollHeight),
      cx,
      cy,
    }
  }
  const zoomTo = (z: number) => {
    const sc = scrollRef.current
    if (sc) {
      const r = sc.getBoundingClientRect()
      setAnchorAt(r.left + r.width / 2, r.top + r.height / 2)
    }
    setZoom(Math.max(1, Math.min(MAX_ZOOM, Math.round(z * 100) / 100)))
  }

  // ── 필기 다시 그리기 ──
  const redrawInk = useCallback(
    (extra?: Stroke) => {
      const c = inkCanvas.current
      if (!c || !curPage) return
      const ctx = c.getContext('2d')
      if (!ctx) return
      ctx.clearRect(0, 0, c.width, c.height)
      for (const s of strokes.current[curPage] ?? []) drawStroke(ctx, s, c.width)
      if (extra) drawStroke(ctx, extra, c.width)
    },
    [curPage],
  )

  // ── PDF 그리기 + 필기 캔버스 크기 맞추기 ──
  useEffect(() => {
    const pc = pdfCanvas.current
    const ic = inkCanvas.current
    if (!pageObj || !pc || !ic || !baseW) return
    const w = baseW * renderZoom
    const h = w * aspect
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const bs = Math.max(0.5, Math.min(dpr, Math.sqrt(MAX_PIXELS / (w * h))))
    const pw = Math.round(w * bs)
    const ph = Math.round(h * bs)
    pc.width = ic.width = pw
    pc.height = ic.height = ph
    redrawInk()

    renderTask.current?.cancel()
    const vp = pageObj.getViewport({ scale: pw / pageObj.getViewport({ scale: 1 }).width })
    const ctx = pc.getContext('2d')
    if (!ctx) return
    const task = pageObj.render({ canvas: pc, canvasContext: ctx, viewport: vp })
    renderTask.current = task
    task.promise.catch(() => {
      /* 취소됨 */
    })
    return () => {
      task.cancel()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageObj, baseW, renderZoom, aspect])

  useEffect(() => {
    redrawInk()
  }, [version, redrawInk, pageObj])

  // ── 필기 변경 ──
  const emit = () => {
    setVersion((v) => v + 1)
    onChange?.(strokes.current)
  }
  const addStroke = (page: string, stroke: Stroke) => {
    strokes.current = { ...strokes.current, [page]: [...(strokes.current[page] ?? []), stroke] }
  }
  const removeStrokes = (page: string, rm: Stroke[]) => {
    const keep = (strokes.current[page] ?? []).filter((s) => !rm.includes(s))
    strokes.current = { ...strokes.current, [page]: keep }
  }

  const doUndo = useCallback(() => {
    const a = undo.current.pop()
    if (!a) return
    if (a.kind === 'add') removeStrokes(a.page, [a.stroke])
    else strokes.current = { ...strokes.current, [a.page]: [...(strokes.current[a.page] ?? []), ...a.strokes] }
    if (String(pageNum) !== a.page) setPageNum(Number(a.page))
    emit()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNum])

  const clearPage = () => {
    if (!curPage) return
    const list = strokes.current[curPage] ?? []
    if (!list.length) return
    if (!window.confirm('이 쪽에 쓴 걸 모두 지울까요?')) return
    undo.current.push({ kind: 'erase', page: curPage, strokes: list })
    strokes.current = { ...strokes.current, [curPage]: [] }
    emit()
  }

  useEffect(() => {
    if (readOnly) return
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        doUndo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [readOnly, doUndo])

  // ── 포인터(펜·손가락·마우스) ──
  const toPage = (e: { clientX: number; clientY: number }) => {
    const r = inkCanvas.current!.getBoundingClientRect()
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.width }
  }

  const eraseAt = (x: number, y: number) => {
    if (!curPage) return
    const hit = (strokes.current[curPage] ?? []).filter((s) => hits(s, x, y, ERASE_R))
    if (!hit.length) return
    erased.current.push(...hit)
    removeStrokes(curPage, hit)
    redrawInk()
  }

  const cancelStroke = () => {
    cur.current = null
    redrawInk()
  }

  // 캔버스 밖으로 나가도 획이 이어지게 (일부 브라우저는 실패할 수 있어 무시)
  const capture = (e: React.PointerEvent<HTMLCanvasElement>) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* noop */
    }
  }

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === 'pen') penSeen.current = true
    if (e.pointerType === 'touch') {
      touches.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (touches.current.size >= 2) {
        // 두 손가락 = 확대/이동 (쓰던 획은 버림)
        cancelStroke()
        for (const id of touches.current.keys()) ignored.current.add(id)
        const [a, b] = [...touches.current.values()]
        const cx = (a.x + b.x) / 2
        const cy = (a.y + b.y) / 2
        gesture.current = { d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, zoom0: zoomRef.current }
        setAnchorAt(cx, cy)
        return
      }
      if (penSeen.current && !readOnly) {
        ignored.current.add(e.pointerId) // 펜을 쓰는 중이면 손바닥은 무시
        return
      }
    }
    if (readOnly || tool === 'pan') {
      if (e.pointerType === 'mouse') {
        const sc = scrollRef.current!
        mousePan.current = { x: e.clientX, y: e.clientY, sl: sc.scrollLeft, st: sc.scrollTop }
        capture(e)
      }
      return
    }
    if (!curPage) return
    capture(e)
    const { x, y } = toPage(e)
    if (tool === 'eraser') {
      cur.current = { stroke: { t: 'p', c: '', w: 0, p: [] }, id: e.pointerId }
      erased.current = []
      eraseAt(x, y)
      return
    }
    const stroke: Stroke =
      tool === 'hl'
        ? { t: 'h', c: HL_COLOR, w: HL_WIDTH, p: [round4(x), round4(y)] }
        : { t: 'p', c: color, w: WIDTHS[widthIdx], p: [round4(x), round4(y)] }
    cur.current = { stroke, id: e.pointerId }
    redrawInk(stroke)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === 'touch' && touches.current.has(e.pointerId)) {
      touches.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (gesture.current && touches.current.size >= 2) {
        const [a, b] = [...touches.current.values()]
        const d = Math.hypot(a.x - b.x, a.y - b.y) || 1
        const sc = scrollRef.current
        if (sc) {
          const r = sc.getBoundingClientRect()
          if (anchor.current) {
            anchor.current.cx = (a.x + b.x) / 2 - r.left
            anchor.current.cy = (a.y + b.y) / 2 - r.top
          }
        }
        const nz = Math.max(1, Math.min(MAX_ZOOM, gesture.current.zoom0 * (d / gesture.current.d0)))
        if (Math.abs(nz - zoomRef.current) > 0.005) setZoom(nz)
        else applyAnchor()
        return
      }
      if (ignored.current.has(e.pointerId)) return
    }
    if (mousePan.current) {
      const sc = scrollRef.current!
      sc.scrollLeft = mousePan.current.sl - (e.clientX - mousePan.current.x)
      sc.scrollTop = mousePan.current.st - (e.clientY - mousePan.current.y)
      return
    }
    const c = cur.current
    if (!c || c.id !== e.pointerId || readOnly) return
    const events = e.nativeEvent.getCoalescedEvents?.() ?? []
    const list = events.length ? events : [e.nativeEvent]
    if (tool === 'eraser') {
      for (const ev of list) {
        const { x, y } = toPage(ev)
        eraseAt(x, y)
      }
      return
    }
    const p = c.stroke.p
    const ctx = inkCanvas.current?.getContext('2d')
    for (const ev of list) {
      const { x, y } = toPage(ev)
      const lx = p[p.length - 2],
        ly = p[p.length - 1]
      if (Math.hypot(x - lx, y - ly) < MIN_STEP) continue
      p.push(round4(x), round4(y))
      if (c.stroke.t === 'p' && ctx) {
        const W = inkCanvas.current!.width
        ctx.save()
        ctx.lineCap = 'round'
        ctx.strokeStyle = c.stroke.c
        ctx.lineWidth = Math.max(1, c.stroke.w * W)
        ctx.beginPath()
        ctx.moveTo(lx * W, ly * W)
        ctx.lineTo(x * W, y * W)
        ctx.stroke()
        ctx.restore()
      }
    }
    if (c.stroke.t === 'h') redrawInk(c.stroke)
  }

  const finish = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === 'touch') {
      touches.current.delete(e.pointerId)
      if (touches.current.size < 2) gesture.current = null
      if (touches.current.size === 0) ignored.current.clear()
      if (ignored.current.has(e.pointerId)) {
        ignored.current.delete(e.pointerId)
        return
      }
    }
    mousePan.current = null
    const c = cur.current
    if (!c || c.id !== e.pointerId || !curPage) return
    cur.current = null
    if (tool === 'eraser') {
      if (erased.current.length) {
        undo.current.push({ kind: 'erase', page: curPage, strokes: erased.current })
        erased.current = []
        emit()
      }
      return
    }
    addStroke(curPage, c.stroke)
    undo.current.push({ kind: 'add', page: curPage, stroke: c.stroke })
    emit()
  }

  const numPages = pdf?.numPages ?? 0
  const canDraw = !readOnly && tool !== 'pan'
  const touchAction = canDraw ? 'none' : 'pan-x pan-y'

  return (
    <div className="sheet-view">
      <div className="sheet-top">
        <button type="button" className="sheet-close" onClick={onClose}>
          ✕ 닫기
        </button>
        <div className="sheet-title">{title}</div>
        {header}
        <div className="sheet-pager">
          <button type="button" disabled={pageNum <= 1} onClick={() => setPageNum((n) => n - 1)}>
            ◀
          </button>
          <span>
            {pageNum} / {numPages || '…'}
          </span>
          <button
            type="button"
            disabled={pageNum >= numPages}
            onClick={() => setPageNum((n) => n + 1)}
          >
            ▶
          </button>
        </div>
        <div className="sheet-zoom">
          <button type="button" onClick={() => zoomTo(zoom - 0.5)} aria-label="축소">
            −
          </button>
          <button type="button" onClick={() => zoomTo(1)} aria-label="화면 맞춤">
            {Math.round(zoom * 100)}%
          </button>
          <button type="button" onClick={() => zoomTo(zoom + 0.5)} aria-label="확대">
            ＋
          </button>
        </div>
      </div>

      {!readOnly && (
        <div className="sheet-tools">
          <div className="sheet-toolset">
            {(
              [
                ['pen', '✏️', '펜'],
                ['hl', '🖍️', '형광펜'],
                ['eraser', '🧽', '지우개'],
                ['pan', '✋', '이동'],
              ] as [Tool, string, string][]
            ).map(([t, ico, label]) => (
              <button
                key={t}
                type="button"
                className={tool === t ? 'on' : ''}
                onClick={() => setTool(t)}
              >
                {ico} {label}
              </button>
            ))}
          </div>
          {tool === 'pen' && (
            <div className="sheet-toolset">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`sheet-color${color === c ? ' on' : ''}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                  aria-label={`색 ${c}`}
                />
              ))}
              {WIDTHS.map((w, i) => (
                <button
                  key={w}
                  type="button"
                  className={`sheet-width${widthIdx === i ? ' on' : ''}`}
                  onClick={() => setWidthIdx(i)}
                  aria-label={`굵기 ${i + 1}`}
                >
                  <span style={{ width: 6 + i * 5, height: 6 + i * 5 }} />
                </button>
              ))}
            </div>
          )}
          <div className="sheet-toolset">
            <button type="button" onClick={doUndo} disabled={undo.current.length === 0}>
              ↶ 되돌리기
            </button>
            <button type="button" onClick={clearPage}>
              🗑 이 쪽 지우기
            </button>
          </div>
        </div>
      )}

      <div className="sheet-scroll" ref={scrollRef}>
        {error ? (
          <p className="sheet-msg">PDF를 열 수 없어요. 인터넷을 확인하고 다시 열어 주세요.</p>
        ) : !pageObj ? (
          <p className="sheet-msg">학습지를 불러오는 중…</p>
        ) : null}
        <div
          className="sheet-page"
          style={{ width: cssW, height: cssH, display: pageObj ? 'block' : 'none' }}
        >
          <canvas ref={pdfCanvas} className="sheet-pdf" />
          <canvas
            ref={inkCanvas}
            className="sheet-ink"
            style={{
              touchAction,
              cursor: canDraw ? (tool === 'eraser' ? 'cell' : 'crosshair') : 'grab',
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={finish}
            onPointerCancel={finish}
            onContextMenu={(e) => e.preventDefault()}
          />
        </div>
      </div>

      {footer && <div className="sheet-foot">{footer}</div>}
    </div>
  )
}

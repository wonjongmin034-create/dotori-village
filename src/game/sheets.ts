import { supabase } from './supabase'
import { useVillage } from './store'

// ───────── 타입 ─────────
// 필기 한 획. 좌표는 "쪽 가로 길이 = 1" 기준(x: 0~1, y: 0~세로/가로)이라 화면 크기와 무관하다.
export type Stroke = {
  t: 'p' | 'h' // p = 펜, h = 형광펜
  c: string // 색
  w: number // 굵기 (쪽 가로 길이 대비)
  p: number[] // [x0, y0, x1, y1, ...]
}
export type Strokes = Record<string, Stroke[]> // 쪽 번호("1","2"…) → 획 목록

export type Worksheet = {
  id: string
  title: string
  path: string // Storage 경로
  url: string // 공개 URL
  pages: number
  createdAt: string
}
export type SubStatus = 'draft' | 'submitted'
export type MySub = { status: SubStatus; submittedAt: string | null }

export type SubSummary = {
  student: string
  status: SubStatus
  submittedAt: string | null
  updatedAt: string
}

const BUCKET = 'worksheets'
export const MAX_PDF_BYTES = 10 * 1024 * 1024

export const pdfUrl = (path: string) => supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
const publicUrl = pdfUrl

type WsRow = { id: string; title: string; file_path: string; pages: number; created_at: string }
const toWorksheet = (r: WsRow): Worksheet => ({
  id: r.id,
  title: r.title,
  path: r.file_path,
  url: publicUrl(r.file_path),
  pages: r.pages ?? 1,
  createdAt: r.created_at,
})

export function sanitizeStrokes(raw: unknown): Strokes {
  const out: Strokes = {}
  if (!raw || typeof raw !== 'object') return out
  for (const [page, list] of Object.entries(raw as Record<string, unknown>)) {
    if (!Array.isArray(list)) continue
    const strokes: Stroke[] = []
    for (const s of list) {
      if (!s || typeof s !== 'object') continue
      const o = s as Record<string, unknown>
      if (
        (o.t !== 'p' && o.t !== 'h') ||
        typeof o.c !== 'string' ||
        typeof o.w !== 'number' ||
        !Array.isArray(o.p) ||
        o.p.length < 2
      )
        continue
      strokes.push({ t: o.t, c: o.c, w: o.w, p: (o.p as unknown[]).map(Number) })
    }
    if (strokes.length) out[page] = strokes
  }
  return out
}

/* ───────── 학생 쪽 ───────── */

let knownIds: Set<string> | null = null

// 학습지 목록 + 내 제출 상태를 받아 store에 넣는다. 테이블이 아직 없으면(schema-4 미실행) 조용히 무시.
export async function refreshSheets() {
  const { session } = useVillage.getState()
  if (!session) return
  try {
    const [{ data: ws, error: e1 }, { data: subs, error: e2 }] = await Promise.all([
      supabase
        .from('worksheets')
        .select('id, title, file_path, pages, created_at')
        .eq('class_code', session.classCode)
        .order('created_at', { ascending: false }),
      supabase
        .from('submissions')
        .select('worksheet_id, status, submitted_at')
        .eq('class_code', session.classCode)
        .eq('student', session.name),
    ])
    if (e1 || e2 || !ws) return
    const worksheets = (ws as WsRow[]).map(toWorksheet)
    const mySubs: Record<string, MySub> = {}
    for (const s of subs ?? []) {
      mySubs[s.worksheet_id] = {
        status: s.status === 'submitted' ? 'submitted' : 'draft',
        submittedAt: s.submitted_at ?? null,
      }
    }
    const st = useVillage.getState()
    if (knownIds && worksheets.some((w) => !knownIds!.has(w.id))) {
      st.flash('📄 새 학습지가 왔어요!')
    }
    knownIds = new Set(worksheets.map((w) => w.id))
    useVillage.setState({ worksheets, mySubs })
  } catch {
    /* noop */
  }
}

export function resetSheets() {
  knownIds = null
  useVillage.setState({ worksheets: [], mySubs: {} })
}

export type Saved = { strokes: Strokes; updatedAt: string }

// 내 필기 불러오기 (없으면 null)
export async function loadMyStrokes(worksheetId: string): Promise<Saved | null> {
  const { session } = useVillage.getState()
  if (!session) return null
  try {
    const { data, error } = await supabase
      .from('submissions')
      .select('strokes, updated_at')
      .eq('worksheet_id', worksheetId)
      .eq('student', session.name)
      .maybeSingle()
    if (error || !data) return null
    return { strokes: sanitizeStrokes(data.strokes), updatedAt: data.updated_at }
  } catch {
    return null
  }
}

// 임시저장(draft) 또는 제출(submitted). 성공하면 true.
export async function saveMyStrokes(
  worksheetId: string,
  strokes: Strokes,
  status: SubStatus,
): Promise<boolean> {
  const { session } = useVillage.getState()
  if (!session) return false
  const now = new Date().toISOString()
  try {
    const row: Record<string, unknown> = {
      worksheet_id: worksheetId,
      class_code: session.classCode,
      student: session.name,
      strokes,
      status,
      updated_at: now,
    }
    if (status === 'submitted') row.submitted_at = now
    const { error } = await supabase
      .from('submissions')
      .upsert(row, { onConflict: 'worksheet_id,student' })
    if (error) return false
    useVillage.setState((s) => ({
      mySubs: {
        ...s.mySubs,
        [worksheetId]: {
          status,
          submittedAt: status === 'submitted' ? now : (s.mySubs[worksheetId]?.submittedAt ?? null),
        },
      },
    }))
    return true
  } catch {
    return false
  }
}

// 기기에도 임시 보관 (인터넷이 끊겨도 필기가 안 날아가게)
const localKey = (worksheetId: string) => {
  const s = useVillage.getState().session
  return `dotori.sheet.${s?.classCode ?? '-'}.${s?.name ?? '-'}.${worksheetId}`
}
export function saveLocalStrokes(worksheetId: string, strokes: Strokes) {
  try {
    localStorage.setItem(
      localKey(worksheetId),
      JSON.stringify({ u: new Date().toISOString(), s: strokes }),
    )
  } catch {
    /* 용량 초과 등 — 무시 */
  }
}
export function loadLocalStrokes(worksheetId: string): Saved | null {
  try {
    const raw = localStorage.getItem(localKey(worksheetId))
    if (!raw) return null
    const o = JSON.parse(raw) as { u?: string; s?: unknown }
    return { strokes: sanitizeStrokes(o.s), updatedAt: typeof o.u === 'string' ? o.u : '' }
  } catch {
    return null
  }
}

/* ───────── 선생님 쪽 ───────── */

export type SheetOverview = Worksheet & { subs: SubSummary[] }

export async function teacherFetchSheets(classCode: string): Promise<SheetOverview[] | 'missing'> {
  try {
    const [{ data: ws, error: e1 }, { data: subs, error: e2 }] = await Promise.all([
      supabase
        .from('worksheets')
        .select('id, title, file_path, pages, created_at')
        .eq('class_code', classCode)
        .order('created_at', { ascending: false }),
      supabase
        .from('submissions')
        .select('worksheet_id, student, status, submitted_at, updated_at')
        .eq('class_code', classCode),
    ])
    if (e1 || e2 || !ws) return 'missing'
    return (ws as WsRow[]).map((r) => ({
      ...toWorksheet(r),
      subs: (subs ?? [])
        .filter((s) => s.worksheet_id === r.id)
        .map((s) => ({
          student: s.student,
          status: s.status === 'submitted' ? ('submitted' as const) : ('draft' as const),
          submittedAt: s.submitted_at ?? null,
          updatedAt: s.updated_at,
        })),
    }))
  } catch {
    return 'missing'
  }
}

export async function teacherFetchStrokes(worksheetId: string, student: string): Promise<Strokes> {
  try {
    const { data } = await supabase
      .from('submissions')
      .select('strokes')
      .eq('worksheet_id', worksheetId)
      .eq('student', student)
      .maybeSingle()
    return sanitizeStrokes(data?.strokes)
  } catch {
    return {}
  }
}

export type UploadResult = { ok: true } | { ok: false; reason: 'size' | 'type' | 'upload' | 'save' }

// PDF 한 개를 보관함에 올리고 경로를 돌려준다. (학습지·급식표 공용)
export async function uploadPdf(file: File, prefix = ''): Promise<UploadResult & { path?: string }> {
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf'))
    return { ok: false, reason: 'type' }
  if (file.size > MAX_PDF_BYTES) return { ok: false, reason: 'size' }
  const path = `${prefix}${crypto.randomUUID()}.pdf`
  try {
    const up = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: 'application/pdf', upsert: false })
    if (up.error) return { ok: false, reason: 'upload' }
    return { ok: true, path }
  } catch {
    return { ok: false, reason: 'upload' }
  }
}
export async function removePdf(path: string) {
  try {
    await supabase.storage.from(BUCKET).remove([path])
  } catch {
    /* noop */
  }
}

export async function teacherUploadWorksheet(
  classCode: string,
  file: File,
  title: string,
  pages: number,
): Promise<UploadResult> {
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf'))
    return { ok: false, reason: 'type' }
  if (file.size > MAX_PDF_BYTES) return { ok: false, reason: 'size' }
  const path = `${crypto.randomUUID()}.pdf`
  try {
    const up = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: 'application/pdf', upsert: false })
    if (up.error) return { ok: false, reason: 'upload' }
    const { error } = await supabase
      .from('worksheets')
      .insert({ class_code: classCode, title, file_path: path, pages })
    if (error) {
      await supabase.storage.from(BUCKET).remove([path])
      return { ok: false, reason: 'save' }
    }
    return { ok: true }
  } catch {
    return { ok: false, reason: 'upload' }
  }
}

export async function teacherDeleteWorksheet(w: Worksheet): Promise<boolean> {
  try {
    const { error } = await supabase.from('worksheets').delete().eq('id', w.id)
    if (error) return false
    await supabase.storage.from(BUCKET).remove([w.path])
    return true
  } catch {
    return false
  }
}

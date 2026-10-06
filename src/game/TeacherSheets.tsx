import { useCallback, useEffect, useRef, useState } from 'react'
import { SheetViewer } from './SheetViewer'
import { readPdfPages } from './pdf'
import { teacherGrant } from './cloud'
import {
  MAX_PDF_BYTES,
  teacherDeleteWorksheet,
  teacherFetchSheets,
  teacherFetchStrokes,
  teacherUploadWorksheet,
  type SheetOverview,
  type Strokes,
} from './sheets'

const fmt = (iso: string | null | undefined) => {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

type Viewing = { sheet: SheetOverview; student: string; strokes: Strokes }

// 선생님 대시보드: 학습지(PDF) 올리기 · 제출 현황 · 학생 필기 보기
export function TeacherSheets({
  classCode,
  students,
  flash,
}: {
  classCode: string
  students: string[]
  flash: (t: string) => void
}) {
  const [sheets, setSheets] = useState<SheetOverview[] | 'missing' | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [pages, setPages] = useState(0)
  const [title, setTitle] = useState('')
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [viewing, setViewing] = useState<Viewing | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setSheets(await teacherFetchSheets(classCode))
  }, [classCode])

  useEffect(() => {
    void load()
    const t = setInterval(load, 30_000)
    return () => clearInterval(t)
  }, [load])

  const pick = async (f: File | null) => {
    setFile(null)
    setPages(0)
    setNote('')
    if (!f) return
    if (f.size > MAX_PDF_BYTES) {
      setNote('파일이 10MB를 넘어요. 용량을 줄여서 올려 주세요.')
      return
    }
    setNote('PDF 확인 중…')
    const n = await readPdfPages(f)
    if (!n) {
      setNote('PDF 파일을 읽을 수 없어요.')
      return
    }
    setFile(f)
    setPages(n)
    setTitle(f.name.replace(/\.pdf$/i, ''))
    setNote('')
  }

  const upload = async () => {
    if (!file || busy) return
    setBusy(true)
    setNote('올리는 중…')
    const r = await teacherUploadWorksheet(classCode, file, title.trim() || file.name, pages)
    setBusy(false)
    if (r.ok) {
      setFile(null)
      setPages(0)
      setTitle('')
      setNote('')
      if (fileInput.current) fileInput.current.value = ''
      flash('학습지를 보냈어요! 학생 화면에 📄 버튼이 떠요')
      void load()
    } else {
      setNote(
        r.reason === 'size'
          ? '파일이 10MB를 넘어요.'
          : r.reason === 'type'
            ? 'PDF 파일만 올릴 수 있어요.'
            : '올리기에 실패했어요. Supabase에서 schema-4-worksheets.sql 을 실행했는지 확인하세요.',
      )
    }
  }

  const remove = async (w: SheetOverview) => {
    if (!window.confirm(`"${w.title}" 학습지와 학생 제출물이 모두 삭제돼요. 삭제할까요?`)) return
    const ok = await teacherDeleteWorksheet(w)
    flash(ok ? '삭제했어요' : '삭제에 실패했어요')
    void load()
  }

  const view = async (sheet: SheetOverview, student: string) => {
    const strokes = await teacherFetchStrokes(sheet.id, student)
    setViewing({ sheet, student, strokes })
  }

  if (viewing) {
    const { sheet, student } = viewing
    // 이 학습지에 낸/풀던 학생들 사이를 오가기
    const names = sheet.subs.map((s) => s.student).sort((a, b) => a.localeCompare(b, 'ko'))
    const i = names.indexOf(student)
    const go = (d: number) => {
      const n = names[i + d]
      if (n) void view(sheet, n)
    }
    const sub = sheet.subs.find((s) => s.student === student)
    const give = async (amt: number) => {
      await teacherGrant(classCode, [student], amt, `학습지: ${sheet.title}`)
      flash(`${student}에게 +${amt} 도토리`)
    }
    return (
      <SheetViewer
        key={`${sheet.id}:${student}`}
        title={sheet.title}
        url={sheet.url}
        initial={viewing.strokes}
        readOnly
        onClose={() => setViewing(null)}
        header={
          <div className="sheet-who">
            <button type="button" disabled={i <= 0} onClick={() => go(-1)}>
              ◀
            </button>
            <b>{student}</b>
            <span>{sub?.status === 'submitted' ? `제출 ${fmt(sub.submittedAt)}` : '풀던 중 (미제출)'}</span>
            <button type="button" disabled={i < 0 || i >= names.length - 1} onClick={() => go(1)}>
              ▶
            </button>
          </div>
        }
        footer={
          <div className="sheet-submit">
            <span className="sheet-status">{student}에게 도토리 주기</span>
            <div className="sheet-grant">
              {[1, 3, 5, 10].map((n) => (
                <button key={n} type="button" onClick={() => void give(n)}>
                  🌰 +{n}
                </button>
              ))}
            </div>
          </div>
        }
      />
    )
  }

  return (
    <section className="dash-card">
      <h3>📄 학습지 보내기</h3>
      <p className="dash-note">
        PDF를 올리면 학생 화면에 📄 버튼이 생겨요. 학생이 펜(또는 손가락)으로 풀어 제출하면 여기서
        풀이를 볼 수 있어요. (10MB 이하)
      </p>

      <div className="ws-upload">
        <input
          ref={fileInput}
          type="file"
          accept="application/pdf,.pdf"
          onChange={(e) => void pick(e.target.files?.[0] ?? null)}
        />
        {file && (
          <>
            <input
              className="ws-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="학습지 이름 (예: 수학 익힘 3단원)"
            />
            <button type="button" className="primary wide" disabled={busy} onClick={upload}>
              {busy ? '올리는 중…' : `📤 학생들에게 보내기 (${pages}쪽)`}
            </button>
          </>
        )}
        {note && <p className="qm-note">{note}</p>}
      </div>

      {sheets === 'missing' && (
        <p className="dash-note">
          학습지 기능을 쓰려면 Supabase에서 <code>schema-4-worksheets.sql</code> 을 한 번 실행해 주세요.
        </p>
      )}
      {sheets === null && <p className="dash-note">불러오는 중…</p>}

      {Array.isArray(sheets) && sheets.length === 0 && (
        <p className="dash-note">아직 보낸 학습지가 없어요.</p>
      )}
      {Array.isArray(sheets) &&
        sheets.map((w) => {
          const done = w.subs.filter((s) => s.status === 'submitted').length
          const open = openId === w.id
          const bySt = new Map(w.subs.map((s) => [s.student, s]))
          return (
            <div key={w.id} className="ws-item">
              <div className="ws-head">
                <button type="button" className="ws-name" onClick={() => setOpenId(open ? null : w.id)}>
                  <b>{w.title}</b>
                  <span>
                    {w.pages}쪽 · {fmt(w.createdAt)} · 제출 {done}/{students.length}명 {open ? '▴' : '▾'}
                  </span>
                </button>
                <button type="button" className="ws-del" onClick={() => void remove(w)} aria-label="삭제">
                  🗑
                </button>
              </div>
              {open && (
                <div className="ws-subs">
                  {students.length === 0 && <p className="dash-note">학생이 없어요.</p>}
                  {students.map((name) => {
                    const s = bySt.get(name)
                    return (
                      <button
                        key={name}
                        type="button"
                        className={`ws-sub ${s?.status ?? 'none'}`}
                        disabled={!s}
                        onClick={() => void view(w, name)}
                      >
                        <span className="ws-sub-name">{name}</span>
                        <span className="ws-sub-st">
                          {s?.status === 'submitted'
                            ? `제출 ${fmt(s.submittedAt)}`
                            : s
                              ? `풀던 중 ${fmt(s.updatedAt)}`
                              : '미제출'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
    </section>
  )
}

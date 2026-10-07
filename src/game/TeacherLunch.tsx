import { useCallback, useEffect, useRef, useState } from 'react'
import { SheetViewer } from './SheetViewer'
import { readPdfPages } from './pdf'
import { teacherFetchLunch, teacherSetLunch } from './cloud'
import { MAX_PDF_BYTES, pdfUrl, removePdf, uploadPdf } from './sheets'
import { parseLunchText, type ClassLunch } from './lunch'
import { openPdf } from './pdf'
import { extractLunch, lunchToText } from './lunchPdf'

const thisMonth = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
const monthLabel = (ym: string) => `${Number(ym.split('-')[1])}월`
const dayLabel = (k: string) => `${Number(k.slice(5, 7))}/${Number(k.slice(8, 10))}`

// 선생님 대시보드: 급식표 올리기 (PDF 첨부 + 날짜별 메뉴 붙여넣기)
export function TeacherLunch({
  classCode,
  flash,
}: {
  classCode: string
  flash: (t: string) => void
}) {
  const [lunch, setLunch] = useState<ClassLunch | 'missing' | null>(null)
  const [month, setMonth] = useState(thisMonth())
  const [file, setFile] = useState<File | null>(null)
  const [pages, setPages] = useState(0)
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  const [noteBad, setNoteBad] = useState(false)
  const [preview, setPreview] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setLunch(await teacherFetchLunch(classCode))
  }, [classCode])
  useEffect(() => {
    void load()
  }, [load])

  const say = (t: string, bad = false) => {
    setNote(t)
    setNoteBad(bad)
  }
  const sqlHint = '저장 실패 — Supabase에서 schema-5-lunch.sql 을 먼저 실행하세요'

  const cur: ClassLunch = lunch && lunch !== 'missing' ? lunch : {}

  const save = async (next: ClassLunch): Promise<boolean> => {
    setBusy(true)
    const ok = await teacherSetLunch(classCode, next)
    setBusy(false)
    if (!ok) {
      say(sqlHint, true)
      return false
    }
    setLunch(next)
    return true
  }

  const pick = async (f: File | null) => {
    setFile(null)
    setPages(0)
    say('')
    if (!f) return
    if (f.size > MAX_PDF_BYTES) return say('파일이 10MB를 넘어요.', true)
    say('PDF 확인 중…')
    const n = await readPdfPages(f)
    if (!n) return say('PDF 파일을 읽을 수 없어요. (한글 파일은 PDF로 저장해서 올려 주세요)', true)
    setFile(f)
    setPages(n)
    setTitle(`${monthLabel(month)} 급식표`)
    say('')
  }

  const uploadFile = async () => {
    if (!file || busy) return
    setBusy(true)
    say('올리는 중…')
    const up = await uploadPdf(file, 'lunch-')
    if (!up.ok || !up.path) {
      setBusy(false)
      return say(
        up.ok === false && up.reason === 'size'
          ? '파일이 10MB를 넘어요.'
          : '올리기에 실패했어요. schema-4-worksheets.sql 을 실행했는지 확인하세요.',
        true,
      )
    }
    const old = cur.file?.path
    const ok = await save({
      ...cur,
      file: { path: up.path, title: title.trim() || `${monthLabel(month)} 급식표`, month, pages },
    })
    if (!ok) {
      await removePdf(up.path)
      return
    }
    if (old) void removePdf(old)
    setFile(null)
    setPages(0)
    if (fileInput.current) fileInput.current.value = ''
    say('')
    flash('급식표를 올렸어요! 학생 게시판 → 급식 탭에 보여요')
  }

  const removeFile = async () => {
    if (!cur.file || !window.confirm('올린 급식표 PDF를 삭제할까요?')) return
    const path = cur.file.path
    const { file: _drop, ...rest } = cur
    void _drop
    if (await save(rest)) {
      void removePdf(path)
      flash('급식표 PDF를 삭제했어요')
    }
  }

  // 올려 둔 급식표 PDF에서 날짜별 메뉴를 읽어 와 ②번 칸에 채운다 (선생님이 확인·수정 후 등록)
  const readFromPdf = async () => {
    if (!cur.file || busy) return
    setBusy(true)
    say('급식표를 읽는 중…')
    try {
      const doc = await openPdf(pdfUrl(cur.file.path))
      const r = await extractLunch(doc, Number(month.split('-')[0]))
      if (!r) {
        say('이 PDF에서는 날짜별 메뉴를 읽지 못했어요. 아래 칸에 직접 붙여넣어 주세요.', true)
      } else {
        setText(lunchToText(r))
        const n = Object.keys(r.menu).length
        const o = Object.keys(r.off).length
        say(
          `${n}일치 메뉴${o ? `, 쉬는 날 ${o}일` : ''}을 읽어 왔어요. 아래 칸에서 맞는지 확인하고 "급식 메뉴 등록"을 눌러 주세요.`,
        )
      }
    } catch {
      say('PDF를 읽지 못했어요. 인터넷을 확인하고 다시 눌러 주세요.', true)
    }
    setBusy(false)
  }

  const registerText = async () => {
    const [y, m] = month.split('-').map(Number)
    const r = parseLunchText(text, y, m)
    if (r.days === 0) return say('날짜가 있는 줄을 찾지 못했어요. 아래 예시처럼 써 주세요.', true)
    const ok = await save({
      ...cur,
      menu: { ...(cur.menu ?? {}), ...r.menu },
      off: { ...(cur.off ?? {}), ...r.off },
    })
    if (!ok) return
    setText('')
    say(`${r.days}일치 메뉴를 등록했어요${r.errors ? ` · 읽지 못한 줄 ${r.errors}개` : ''}`)
    flash('급식 메뉴를 등록했어요! 학생 게시판에 오늘 급식이 나와요')
  }

  const clearMenu = async () => {
    if (!window.confirm('등록한 날짜별 급식 메뉴를 모두 지울까요?')) return
    const { menu: _m, off: _o, ...rest } = cur
    void _m
    void _o
    if (await save(rest)) flash('날짜별 급식 메뉴를 지웠어요')
  }

  if (preview && cur.file) {
    return (
      <SheetViewer
        title={cur.file.title}
        url={pdfUrl(cur.file.path)}
        initial={{}}
        readOnly
        onClose={() => setPreview(false)}
      />
    )
  }

  const menuDays = [...new Set([...Object.keys(cur.menu ?? {}), ...Object.keys(cur.off ?? {})])].sort()

  return (
    <section className="dash-card">
      <h3>🍚 급식표 올리기</h3>
      <p className="dash-note">
        PDF로 올리면 학생 게시판 → 급식 탭에서 크게 볼 수 있어요. 날짜별 메뉴를 글로 붙여넣으면
        &ldquo;오늘 급식&rdquo;이 자동으로 나와요. (한글 파일은 PDF로 저장해서 올려 주세요)
      </p>

      {lunch === 'missing' && (
        <p className="dash-note">
          급식표 기능을 쓰려면 Supabase에서 <code>schema-5-lunch.sql</code> 을 한 번 실행해 주세요.
        </p>
      )}

      <label className="lunch-month">
        대상 달
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value || thisMonth())} />
      </label>

      {/* 1) PDF 첨부 */}
      <div className="lunch-block">
        <b>① 급식표 PDF 첨부</b>
        {cur.file && (
          <div className="lunch-current">
            <span>
              📄 {cur.file.title}
              {cur.file.month && ` · ${monthLabel(cur.file.month)}`}
            </span>
            <button type="button" onClick={() => setPreview(true)}>
              보기
            </button>
            <button type="button" onClick={() => void removeFile()} aria-label="삭제">
              🗑
            </button>
          </div>
        )}
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
                placeholder="이름 (예: 10월 급식표)"
              />
              <button type="button" className="primary wide" disabled={busy} onClick={uploadFile}>
                {busy ? '올리는 중…' : `📤 급식표 올리기 (${pages}쪽)${cur.file ? ' · 기존 파일 교체' : ''}`}
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2) 날짜별 메뉴 글 */}
      <div className="lunch-block">
        <b>② 날짜별 메뉴 (선택) — 있으면 학생 화면에 "오늘 급식"이 자동으로 나와요</b>
        {cur.file && (
          <button type="button" className="lunch-readbtn" disabled={busy} onClick={() => void readFromPdf()}>
            ✨ 올린 PDF에서 메뉴 자동으로 읽어오기
          </button>
        )}
        <textarea
          rows={6}
          className="qm-bulk"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            '10/7 (화) 잡곡밥, 미역국, 불고기, 배추김치\n10/8 (수) 쌀밥, 콩나물국, 닭갈비\n10월 10일 현미밥, 어묵국, 계란말이'
          }
        />
        <p className="qm-help">
          한 줄에 하루 · 날짜(<code>10/7</code>, <code>10월 7일</code>, <code>2026-10-07</code>) 뒤에
          메뉴를 쉼표(,)나 ·로 나눠 적으세요. 알레르기 번호(1.5.6)는 자동으로 지워요. 날짜만 적고
          다음 줄부터 메뉴를 한 줄씩 적어도 돼요.
        </p>
        <button
          type="button"
          className="primary wide"
          disabled={busy || !text.trim()}
          onClick={() => void registerText()}
        >
          급식 메뉴 등록
        </button>
        {menuDays.length > 0 && (
          <details className="lunch-days">
            <summary>등록된 날짜 {menuDays.length}일 보기</summary>
            <ul>
              {menuDays.map((k) => (
                <li key={k}>
                  <b>{dayLabel(k)}</b>{' '}
                  {cur.off?.[k] ? `쉬는 날 · ${cur.off[k]}` : cur.menu![k].join(' · ')}
                </li>
              ))}
            </ul>
            <button type="button" className="danger ghost" onClick={() => void clearMenu()}>
              날짜별 메뉴 모두 지우기
            </button>
            <p className="qm-help">
              날짜별 메뉴를 하나라도 올리면, 이 반에서는 기본으로 들어 있던 9월 식단은 보이지 않아요.
            </p>
          </details>
        )}
      </div>

      {note && <p className={`qm-note${noteBad ? ' bad' : ''}`}>{note}</p>}
    </section>
  )
}

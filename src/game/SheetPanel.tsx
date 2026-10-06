import { useEffect, useRef, useState } from 'react'
import { useVillage } from './store'
import { SheetViewer } from './SheetViewer'
import {
  loadLocalStrokes,
  loadMyStrokes,
  refreshSheets,
  saveLocalStrokes,
  saveMyStrokes,
  type Strokes,
  type Worksheet,
} from './sheets'

const fmt = (iso: string | null | undefined) => {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

type Saving = 'idle' | 'saving' | 'saved' | 'fail'

// 선생님이 보낸 학습지 목록 → 열어서 펜으로 풀고 제출.
export function SheetPanel() {
  const open = useVillage((s) => s.sheetsOpen)
  const close = useVillage((s) => s.closeSheets)
  const worksheets = useVillage((s) => s.worksheets)
  const mySubs = useVillage((s) => s.mySubs)
  const session = useVillage((s) => s.session)
  const flash = useVillage((s) => s.flash)

  const [current, setCurrent] = useState<{ w: Worksheet; initial: Strokes } | null>(null)
  const [opening, setOpening] = useState<string | null>(null)
  const [saving, setSaving] = useState<Saving>('idle')
  const [dirtyAfterSubmit, setDirtyAfterSubmit] = useState(false)
  const [busy, setBusy] = useState(false)

  const latest = useRef<Strokes>({})
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const unsaved = useRef(false)

  useEffect(() => {
    if (open) void refreshSheets()
  }, [open])

  if (!open) return null

  const sub = current ? mySubs[current.w.id] : undefined
  const submitted = sub?.status === 'submitted'

  const openSheet = async (w: Worksheet) => {
    if (!session) {
      flash('로그인해야 학습지를 낼 수 있어요')
      return
    }
    setOpening(w.id)
    const [cloud, local] = await Promise.all([loadMyStrokes(w.id), Promise.resolve(loadLocalStrokes(w.id))])
    setOpening(null)
    // 더 최근에 저장된 쪽을 쓴다 (기기 로컬 vs 클라우드)
    const pick = local && (!cloud || local.updatedAt > cloud.updatedAt) ? local : cloud
    const initial = pick?.strokes ?? {}
    latest.current = initial
    unsaved.current = false
    setSaving('idle')
    setDirtyAfterSubmit(false)
    setCurrent({ w, initial })
  }

  const flush = async (status: 'draft' | 'submitted' = 'draft'): Promise<boolean> => {
    if (!current) return true
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
    setSaving('saving')
    const ok = await saveMyStrokes(current.w.id, latest.current, status)
    if (ok) unsaved.current = false
    setSaving(ok ? 'saved' : 'fail')
    return ok
  }

  const onChange = (s: Strokes) => {
    if (!current) return
    latest.current = s
    unsaved.current = true
    saveLocalStrokes(current.w.id, s) // 바로 기기에 보관
    if (submitted) {
      // 이미 낸 뒤의 수정은 "다시 제출"하기 전까지 기기에만 둔다 (선생님이 보는 제출본 유지)
      setDirtyAfterSubmit(true)
      return
    }
    setSaving('saving')
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => void flush('draft'), 1500)
  }

  const submit = async () => {
    if (!current || busy) return
    const total = Object.values(latest.current).reduce((n, l) => n + l.length, 0)
    const msg =
      total === 0
        ? '아직 아무것도 쓰지 않았어요. 그래도 제출할까요?'
        : submitted
          ? '고친 내용으로 다시 제출할까요?'
          : '선생님께 제출할까요?'
    if (!window.confirm(msg)) return
    setBusy(true)
    saveLocalStrokes(current.w.id, latest.current)
    const ok = await flush('submitted')
    setBusy(false)
    if (ok) {
      setDirtyAfterSubmit(false)
      flash('📤 선생님께 제출했어요!')
    } else {
      flash('제출에 실패했어요. 인터넷을 확인하고 다시 눌러 주세요')
    }
  }

  const closeViewer = async () => {
    if (unsaved.current && !submitted) await flush('draft')
    setCurrent(null)
    void refreshSheets()
  }

  if (current) {
    const status =
      saving === 'saving'
        ? '저장 중…'
        : saving === 'fail'
          ? '⚠️ 클라우드 저장 실패 (이 기기에는 저장됨)'
          : submitted
            ? dirtyAfterSubmit
              ? '고친 내용은 다시 제출해야 선생님께 보여요'
              : `제출 완료 ✓ ${fmt(sub?.submittedAt)}`
            : saving === 'saved'
              ? '임시저장됨 ✓'
              : '쓰는 대로 자동 저장돼요'
    return (
      <SheetViewer
        key={current.w.id}
        title={current.w.title}
        url={current.w.url}
        initial={current.initial}
        onChange={onChange}
        onClose={() => void closeViewer()}
        footer={
          <div className="sheet-submit">
            <span className={`sheet-status${saving === 'fail' ? ' bad' : ''}`}>{status}</span>
            <button
              type="button"
              className="primary"
              disabled={busy || (submitted && !dirtyAfterSubmit)}
              onClick={submit}
            >
              {busy ? '보내는 중…' : submitted ? '📤 다시 제출' : '📤 선생님께 제출'}
            </button>
          </div>
        }
      />
    )
  }

  return (
    <div className="farm-overlay" onPointerDown={(e) => e.target === e.currentTarget && close()}>
      <div className="farm-card sheet-list-card">
        <button type="button" className="farm-x" onClick={close} aria-label="닫기">
          ✕
        </button>
        <h3>📄 학습지</h3>
        <p className="farm-note">선생님이 보낸 학습지예요. 열어서 펜(또는 손가락)으로 풀고 제출해요.</p>
        {worksheets.length === 0 && <p className="hw-empty">아직 받은 학습지가 없어요.</p>}
        <div className="sheet-list">
          {worksheets.map((w) => {
            const st = mySubs[w.id]?.status
            return (
              <button
                key={w.id}
                type="button"
                className={`sheet-item ${st ?? 'new'}`}
                disabled={opening === w.id}
                onClick={() => void openSheet(w)}
              >
                <span className="sheet-item-title">{w.title}</span>
                <span className="sheet-item-meta">
                  {w.pages}쪽 · {fmt(w.createdAt)}
                </span>
                <span className="sheet-item-chip">
                  {opening === w.id
                    ? '여는 중…'
                    : st === 'submitted'
                      ? '제출 완료 ✓'
                      : st === 'draft'
                        ? '풀던 중'
                        : '아직 안 냄'}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

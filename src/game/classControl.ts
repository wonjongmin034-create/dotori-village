import { supabase } from './supabase'
import { useVillage, bossLeftOf } from './store'
import { refreshMyPresence, setMyLeft } from './bossState'
import { useCtl, CLOSED_TEXT } from './control'
import { leavePlaza } from './plaza'
import { endVisit } from './friends'
import { leaveBoss } from './boss'
import { leaveRaid } from './raid'

// 선생님 "수업 제어": 광장·친구 마을 닫기 / 학생 전원 다시 접속시키기.
// classes.control (jsonb) 에 저장 — supabase/schema-8-control.sql 을 실행해야 쓸 수 있다. 없어도 게임은 그대로 돌아간다.
//   { closed?: boolean, kick?: number, bossReset?: number }   kick = 선생님이 "다시 접속"을 누른 시각(ms), bossReset = "보스 도전 횟수 초기화"를 누른 시각(ms)

export type Control = { closed: boolean; kick: number; bossReset: number; raidPractice: boolean }

function sanitize(raw: unknown): Control {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  return {
    closed: o.closed === true,
    kick: typeof o.kick === 'number' && Number.isFinite(o.kick) ? o.kick : 0,
    bossReset: typeof o.bossReset === 'number' && Number.isFinite(o.bossReset) ? o.bossReset : 0,
    raidPractice: o.raidPractice === true,
  }
}

/* ---------- 학생 쪽 ---------- */

const KICK_WINDOW_MS = 5 * 60_000 // 이보다 오래된 "다시 접속" 신호는 무시 (오래 꺼져 있던 기기가 뒤늦게 새로고침하지 않게)

function applyClosed(closed: boolean) {
  if (useCtl.getState().closed === closed) return
  useCtl.setState({ closed })
  const s = useVillage.getState()
  if (closed) {
    // 광장·친구 마을에 있었다면 내 마을로 돌아온다 (실시간 연결은 live.ts 가 알아서 닫는다)
    if (s.plaza != null) leavePlaza()
    if (s.bossRoom != null) leaveBoss()
    if (s.raidRoom) leaveRaid()
    if (s.visiting) endVisit()
    s.setNotice(CLOSED_TEXT)
  } else {
    s.flash('광장과 친구 마을이 다시 열렸어요 🎉')
  }
}

// 선생님이 보스 도전 횟수를 초기화했으면, 그 시각 이전에 센 횟수는 없는 걸로 한다 (같은 값을 여러 번 받아도 그대로)
function applyBossReset(at: number) {
  const s = useVillage.getState()
  if (at <= s.bossResetAt) return
  useVillage.setState({ bossResetAt: at })
  setMyLeft(bossLeftOf(useVillage.getState().bossTry))
  refreshMyPresence() // 보스 방에 있다면 친구들 화면의 남은 횟수도 바꾼다
  if (at > Date.now() - 10 * 60_000) s.flash('선생님이 오늘 보스 도전 횟수를 다시 채워 줬어요 ⚔️')
}

function handleKick(classCode: string, kick: number) {
  const key = `dotori.kick.${classCode}`
  let seen: string | null = null
  try {
    seen = localStorage.getItem(key)
  } catch {
    /* noop */
  }
  if (seen === null) {
    // 처음 보는 값은 기준으로만 삼는다 (지금 막 들어온 학생이 옛 신호에 반응하지 않게)
    try {
      localStorage.setItem(key, String(kick))
    } catch {
      /* noop */
    }
    return
  }
  if (kick <= Number(seen)) return
  try {
    localStorage.setItem(key, String(kick))
  } catch {
    /* noop */
  }
  if (Math.abs(Date.now() - kick) > KICK_WINDOW_MS) return

  // 실시간 방에서 나오고, 저장이 끝날 시간을 준 뒤 다시 접속(새로고침). 한꺼번에 몰리지 않게 몇 초씩 흩뜨린다.
  const s = useVillage.getState()
  if (s.plaza != null) leavePlaza()
  if (s.bossRoom != null) leaveBoss()
  if (s.raidRoom) leaveRaid()
  if (s.visiting) endVisit()
  s.setNotice('선생님이 모두 다시 접속하게 했어요.\n잠깐 뒤에 자동으로 다시 들어가요 🔄')
  try {
    sessionStorage.setItem(REJOIN_KEY, '1') // 새로고침 뒤 로그인 화면에서 비밀번호 없이 바로 다시 들어가게
  } catch {
    /* noop */
  }
  setTimeout(() => location.reload(), 3000 + Math.random() * 6000)
}

const REJOIN_KEY = 'dotori.rejoin'
// "전원 다시 접속"으로 새로고침된 직후인지 (로그인/로그아웃하면 cloud.ts 가 지운다)
export function peekRejoinFlag(): boolean {
  try {
    return sessionStorage.getItem(REJOIN_KEY) === '1'
  } catch {
    return false
  }
}
export function clearRejoinFlag() {
  try {
    sessionStorage.removeItem(REJOIN_KEY)
  } catch {
    /* noop */
  }
}

export async function pollControl() {
  const s = useVillage.getState().session
  if (!s) return
  try {
    const { data, error } = await supabase.from('classes').select('control').eq('code', s.classCode).maybeSingle()
    if (error || !data) return // 컬럼이 없으면(schema-8 미실행) 아무것도 안 한다
    const c = sanitize(data.control)
    applyClosed(c.closed)
    applyBossReset(c.bossReset)
    handleKick(s.classCode, c.kick)
  } catch {
    /* noop */
  }
}

export function resetControl() {
  useCtl.setState({ closed: false })
}

/* ---------- 선생님 쪽 ---------- */

// 컬럼이 없으면 'missing' (schema-8 실행 안내를 띄우기 위해)
export async function teacherFetchControl(classCode: string): Promise<Control | 'missing'> {
  try {
    const { data, error } = await supabase.from('classes').select('control').eq('code', classCode).maybeSingle()
    if (error || !data) return 'missing'
    return sanitize(data.control)
  } catch {
    return 'missing'
  }
}

export async function teacherSetControl(classCode: string, patch: Partial<Control>): Promise<boolean> {
  try {
    const cur = await teacherFetchControl(classCode)
    if (cur === 'missing') return false
    const { error } = await supabase
      .from('classes')
      .update({ control: { ...cur, ...patch }, updated_at: new Date().toISOString() })
      .eq('code', classCode)
    return !error
  } catch {
    return false
  }
}

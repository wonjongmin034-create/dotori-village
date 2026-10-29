import { supabase } from './supabase'

// 서버(supabase/schema-11-raid.sql)에 묻는다 — 열려 있는지, 오늘 몇 번 남았는지는 서버 시계로 판단한다.

export type RaidStatus = { open: boolean; practice: boolean; tries: number; left: number; cleared: boolean; best: number; week: string; mvp: string; lastMvp: string; lastWeek: string }
export type RaidBegin = { ok: true; tries: number } | { ok: false; why: 'closed' | 'cleared' | 'limit' | 'error' }

const num = (v: unknown, d = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : d)

// 서버 함수가 아직 없으면(schema-11 미실행) 'missing'
export async function raidStatus(classCode: string): Promise<RaidStatus | 'missing'> {
  try {
    const { data, error } = await supabase.rpc('raid_status', { p_class: classCode })
    if (error || !data || typeof data !== 'object') return 'missing'
    const o = data as Record<string, unknown>
    return {
      open: o.open === true,
      practice: o.practice === true,
      tries: num(o.tries),
      left: num(o.left),
      cleared: o.cleared === true,
      best: num(o.best),
      week: typeof o.week === 'string' ? o.week : '',
      mvp: typeof o.mvp === 'string' ? o.mvp : '',
      lastMvp: typeof o.last_mvp === 'string' ? o.last_mvp : '',
      lastWeek: typeof o.last_week === 'string' ? o.last_week : '',
    }
  } catch {
    return 'missing'
  }
}

export async function raidBegin(classCode: string): Promise<RaidBegin> {
  try {
    const { data, error } = await supabase.rpc('raid_begin', { p_class: classCode })
    if (error || !data || typeof data !== 'object') return { ok: false, why: 'error' }
    const o = data as Record<string, unknown>
    if (o.ok === true) return { ok: true, tries: num(o.tries, 1) }
    const why = o.why === 'closed' || o.why === 'cleared' || o.why === 'limit' ? o.why : 'error'
    return { ok: false, why }
  } catch {
    return { ok: false, why: 'error' }
  }
}

// 선생님이 정한 "레이드 체력 배율" (없으면 1). 대장이 출발할 때 쓰고, 모두에게 알려 준다.
export async function raidHpMult(classCode: string): Promise<number> {
  try {
    const { data, error } = await supabase.from('classes').select('control').eq('code', classCode).maybeSingle()
    if (error || !data) return 1
    const v = (data.control as Record<string, unknown> | null)?.raidHpMult
    return typeof v === 'number' && Number.isFinite(v) ? Math.min(2, Math.max(0.4, v)) : 1
  } catch {
    return 1
  }
}

// 한 번의 도전이 끝났을 때 서버에 알린다. 이긴 도전이면 MVP(가장 많이 공격한 사람)도 함께 남긴다.
// (schema-12 를 아직 실행하지 않았으면 MVP 없이 옛 방식으로 알린다)
export async function raidFinish(classCode: string, won: boolean, phase: number, mvp: string | null = null, mvpDmg = 0): Promise<void> {
  try {
    const r = await supabase.rpc('raid_finish', { p_class: classCode, p_won: won, p_phase: phase, p_mvp: mvp ?? '', p_mvp_dmg: Math.max(0, Math.round(mvpDmg)) })
    if (r.error) await supabase.rpc('raid_finish', { p_class: classCode, p_won: won, p_phase: phase })
  } catch {
    /* noop */
  }
}

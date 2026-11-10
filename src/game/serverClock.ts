import { supabase } from './supabase'

// 서버 시계 — 작물이 자라는 시간·하루의 기준을 기기 시계가 아니라 서버 시각으로 잰다 (기기 시간을 바꿔도 소용없게).
// 서버 시각을 한 번 받아 두고, 그 뒤로는 기기의 "흐른 시간"(performance.now — 기기 시계를 바꿔도 변하지 않는다)만큼 더한다.
// 서버 함수(schema-13 의 server_now)가 아직 없거나 인터넷이 안 되면 예전처럼 기기 시계를 쓴다.

let base: { server: number; perf: number } | null = null

export function serverNow(): number {
  if (!base) return Date.now()
  return base.server + (performance.now() - base.perf)
}

export async function syncServerClock(): Promise<boolean> {
  try {
    const t0 = performance.now()
    const { data, error } = await supabase.rpc('server_now')
    const t1 = performance.now()
    const ms = typeof data === 'number' ? data : Number(data)
    if (error || !Number.isFinite(ms) || ms <= 0) return false
    // 요청이 오가는 동안의 절반만큼 서버 시각이 흘렀다고 본다
    base = { server: ms + (t1 - t0) / 2, perf: t1 }
    return true
  } catch {
    return false
  }
}

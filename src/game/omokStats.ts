import { create } from 'zustand'
import { supabase } from './supabase'
import { useVillage } from './store'
import { kstDay, weekIndex } from './omokWeek'
import { MIN_MOVES_FOR_REWARD } from './omok'
import type { FinishInfo } from './omokState'

// 오목 보상·승점·주간 시상.
//  - 이기면 도토리 2개, 지면 1개, 비기면 1개
//  - 승점: 이기면 3점, 비기면 1점, 지면 0점
//  - 같은 상대와는 하루에 몇 번이든 둘 수 있지만 보상·승점은 두 판까지만
//  - (추가 안전장치) 하루에 보상·승점이 붙는 판은 10판까지, 10수 미만으로 끝난 판은 없음
//  - 금요일 오후 3시마다 지난 한 주 승점 1~3등이 오목왕 모자를 받고, 그 전 주 모자는 사라진다
// 기록은 Supabase 의 omok_stats 표에 저장한다 (supabase/schema-7-omok.sql). 표가 없어도 게임·보상은 동작한다.

export const REWARD_WIN = 2
export const REWARD_LOSS = 1
export const REWARD_DRAW = 1
export const POINTS_WIN = 3
export const POINTS_DRAW = 1
export const PAIR_LIMIT = 2
export const DAILY_GAME_LIMIT = 10

export type Row = {
  student: string
  week: number
  points: number
  wins: number
  losses: number
  draws: number
  updated_at: string
}

type Daily = { day: string; games: number; pairs: Record<string, number> }

type StatsState = {
  db: 'unknown' | 'ok' | 'missing'
  standings: Row[] // 이번 주
  lastWeek: Row[] // 지난 주 (모자를 받은 사람들)
  titles: Record<string, 1 | 2 | 3> // 이름 → 지금 가진 오목왕 등수
  mine: Row | null // 이번 주 내 기록
  daily: Daily
  loadedAt: number
}

const emptyDaily = (): Daily => ({ day: kstDay(), games: 0, pairs: {} })

export const useOmokStats = create<StatsState>(() => ({
  db: 'unknown',
  standings: [],
  lastWeek: [],
  titles: {},
  mine: null,
  daily: emptyDaily(),
  loadedAt: 0,
}))

const sess = () => useVillage.getState().session

const localKey = () => {
  const s = sess()
  return `dotori.omok.${s?.classCode ?? '-'}.${s?.name ?? '-'}`
}
function loadLocalDaily(): Daily {
  try {
    const raw = localStorage.getItem(localKey())
    if (raw) {
      const d = JSON.parse(raw) as Daily
      if (d && d.day === kstDay()) return { day: d.day, games: d.games ?? 0, pairs: d.pairs ?? {} }
    }
  } catch {
    /* noop */
  }
  return emptyDaily()
}
function saveLocalDaily(d: Daily) {
  try {
    localStorage.setItem(localKey(), JSON.stringify(d))
  } catch {
    /* noop */
  }
}

// 정렬: 승점 높은 순 → 이긴 판 많은 순 → 먼저 그 점수를 만든 순
export const rank = (rows: Row[]) =>
  [...rows].sort(
    (a, b) => b.points - a.points || b.wins - a.wins || (a.updated_at < b.updated_at ? -1 : a.updated_at > b.updated_at ? 1 : 0),
  )

function titlesFrom(rows: Row[]): Record<string, 1 | 2 | 3> {
  const out: Record<string, 1 | 2 | 3> = {}
  rank(rows.filter((r) => r.points > 0))
    .slice(0, 3)
    .forEach((r, i) => {
      out[r.student] = (i + 1) as 1 | 2 | 3
    })
  return out
}

/* ---------- 불러오기 ---------- */

export async function loadMine() {
  const s = sess()
  if (!s) return
  const w = weekIndex()
  const local = loadLocalDaily()
  try {
    const { data, error } = await supabase
      .from('omok_stats')
      .select('student, week, points, wins, losses, draws, pairs, rewarded, updated_at')
      .eq('class_code', s.classCode)
      .eq('student', s.name)
      .in('week', [w, -1])
    if (error) throw error
    const meta = (data ?? []).find((r) => r.week === -1)
    const row = (data ?? []).find((r) => r.week === w)
    const remote: Daily =
      meta && meta.rewarded?.day === kstDay()
        ? { day: kstDay(), games: meta.rewarded.games ?? 0, pairs: meta.pairs ?? {} }
        : emptyDaily()
    // 기기 기록과 서버 기록 중 더 많이 한 쪽을 따른다 (우회 방지)
    const daily: Daily =
      remote.games >= local.games ? remote : local
    useOmokStats.setState({
      db: 'ok',
      daily,
      mine: row ? (row as Row) : null,
    })
  } catch {
    useOmokStats.setState({ db: 'missing', daily: local })
  }
}

export async function fetchStandings(force = false) {
  const s = sess()
  if (!s) return
  const st = useOmokStats.getState()
  if (!force && Date.now() - st.loadedAt < 15_000) return
  const w = weekIndex()
  try {
    const { data, error } = await supabase
      .from('omok_stats')
      .select('student, week, points, wins, losses, draws, updated_at')
      .eq('class_code', s.classCode)
      .in('week', [w, w - 1])
    if (error) throw error
    const rows = (data ?? []) as Row[]
    const cur = rank(rows.filter((r) => r.week === w))
    const last = rank(rows.filter((r) => r.week === w - 1))
    useOmokStats.setState({
      db: 'ok',
      standings: cur,
      lastWeek: last,
      titles: titlesFrom(last),
      mine: cur.find((r) => r.student === s.name) ?? useOmokStats.getState().mine,
      loadedAt: Date.now(),
    })
  } catch {
    useOmokStats.setState({ db: 'missing', loadedAt: Date.now() })
  }
}

/* ---------- 한 판이 끝났을 때 ---------- */

export type RewardResult = {
  gid: number
  opponent: string
  result: FinishInfo['result']
  kind: FinishInfo['kind']
  coins: number
  points: number
  note: string // 보상이 없을 때 이유
}

export async function recordResult(f: FinishInfo): Promise<RewardResult> {
  const s = sess()
  const base = { gid: f.gid, opponent: f.opponent, result: f.result, kind: f.kind }
  if (!s) return { ...base, coins: 0, points: 0, note: '로그인해야 보상을 받아요' }

  // 오늘 기록 (날짜가 바뀌었으면 새로)
  let daily = useOmokStats.getState().daily
  if (daily.day !== kstDay()) daily = emptyDaily()
  const pairCount = daily.pairs[f.opponent] ?? 0

  let note = ''
  if (f.moves < MIN_MOVES_FOR_REWARD) note = '너무 빨리 끝난 판이라 보상이 없어요'
  else if (pairCount >= PAIR_LIMIT) note = `${f.opponent}님과는 하루 ${PAIR_LIMIT}판까지만 보상이 있어요`
  else if (daily.games >= DAILY_GAME_LIMIT) note = `오늘은 보상이 있는 ${DAILY_GAME_LIMIT}판을 다 했어요`

  if (note) {
    useOmokStats.setState({ daily })
    return { ...base, coins: 0, points: 0, note }
  }

  const coins = f.result === 'win' ? REWARD_WIN : f.result === 'loss' ? REWARD_LOSS : REWARD_DRAW
  const points = f.result === 'win' ? POINTS_WIN : f.result === 'draw' ? POINTS_DRAW : 0
  daily = { day: daily.day, games: daily.games + 1, pairs: { ...daily.pairs, [f.opponent]: pairCount + 1 } }
  saveLocalDaily(daily)

  const w = weekIndex()
  const prev = useOmokStats.getState().mine
  const mine: Row = {
    student: s.name,
    week: w,
    points: (prev?.week === w ? prev.points : 0) + points,
    wins: (prev?.week === w ? prev.wins : 0) + (f.result === 'win' ? 1 : 0),
    losses: (prev?.week === w ? prev.losses : 0) + (f.result === 'loss' ? 1 : 0),
    draws: (prev?.week === w ? prev.draws : 0) + (f.result === 'draw' ? 1 : 0),
    updated_at: new Date().toISOString(),
  }
  useOmokStats.setState({ daily, mine })
  useVillage.getState().addCoins(coins, `오목 ${f.result === 'win' ? '승리' : f.result === 'draw' ? '무승부' : '참여'}`)

  // 서버에 기록 (실패해도 게임은 계속)
  // 주의: 두 줄을 한 번에(배열로) 저장하면, 줄마다 열이 달라서 서버가 빈 값으로 채우다 "rewarded 는 비울 수 없다"며 통째로 거절한다.
  //       (예전에 이렇게 보내서 승점·순위가 한 번도 저장되지 않았다) → 줄마다 따로 저장한다.
  try {
    const opt = { onConflict: 'class_code,student,week' }
    const [r1, r2] = await Promise.all([
      supabase
        .from('omok_stats')
        .upsert({ class_code: s.classCode, student: s.name, week: w, points: mine.points, wins: mine.wins, losses: mine.losses, draws: mine.draws, updated_at: mine.updated_at }, opt),
      supabase
        .from('omok_stats')
        .upsert({ class_code: s.classCode, student: s.name, week: -1, rewarded: { day: daily.day, games: daily.games }, pairs: daily.pairs, updated_at: mine.updated_at }, opt),
    ])
    const error = r1.error ?? r2.error
    if (error) console.warn('[omok] 기록 저장 실패:', error.message)
    useOmokStats.setState({ db: error ? 'missing' : 'ok' })
  } catch {
    useOmokStats.setState({ db: 'missing' })
  }
  void fetchStandings(true)
  return { ...base, coins, points, note: '' }
}

/* ---------- 오목왕 모자 ---------- */

export const TITLE_HAT = (tier: number) => `omok${tier}`
export const isTitleHat = (id: string | null | undefined) => !!id && /^omok[123]$/.test(id)

// 남의 모습에서 "지금은 오목왕이 아닌데 모자를 쓰고 있는" 경우 모자를 뺀다
export function cleanTitleHat<T extends { hat: string | null }>(name: string, avatar: T): T {
  if (!isTitleHat(avatar.hat)) return avatar
  const tier = useOmokStats.getState().titles[name]
  return tier && avatar.hat === TITLE_HAT(tier) ? avatar : { ...avatar, hat: null }
}

// 내 모자를 맞춘다: 오목왕이 아니면 벗기고, 새로 오목왕이 되었으면 씌우고 알려 준다.
export function applyMyTitle() {
  const v = useVillage.getState()
  const s = v.session
  if (!s) return
  const tier = useOmokStats.getState().titles[s.name]
  const hat = v.avatar.hat
  if (isTitleHat(hat) && (!tier || hat !== TITLE_HAT(tier))) {
    v.chooseWardrobe('hat', 'none')
  }
  if (!tier) return
  const key = `dotori.omok.award.${s.classCode}.${s.name}`
  const wk = String(weekIndex())
  let seen = ''
  try {
    seen = localStorage.getItem(key) ?? ''
  } catch {
    /* noop */
  }
  if (seen !== wk) {
    v.chooseWardrobe('hat', TITLE_HAT(tier))
    v.setNotice(`🏆 지난주 오목왕 ${tier}등!\n멋진 오목왕 모자를 받았어요.\n다음 금요일 오후 3시까지 쓸 수 있어요 👑`)
    try {
      localStorage.setItem(key, wk)
    } catch {
      /* noop */
    }
  }
}

export async function refreshTitles() {
  await fetchStandings(true)
  applyMyTitle()
}

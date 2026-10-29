import { create } from 'zustand'
import { useVillage, towerLeftOf } from './store'
import { supabase } from './supabase'
import { playerPos } from './player-state'
import { camShake } from './bossFx'
import { isClosed, CLOSED_TEXT } from './control'
import { QUIZ_MS, canEnter, heartsFor, isTowerTester, towerStage, STAGE_COUNT } from './towerData'
import { judgeTower, towerQuiz, type TowerQ } from './towerQuestions'
import { hooks, simStart, simStop } from './towerSim'

// 도토리 탑 진행: 입장 → (잠깐 소개) → 몬스터 사냥 → 보물상자 → 문제 3개 → 클리어 / 실패
//  · 입장하면 입장권 1장을 쓴다 (몬스터에게 지거나, 상자 문제를 틀려도 돌려받지 못한다)
//  · 상자 문제는 하나라도 틀리면 클리어가 아니다 (몬스터부터 다시)
//  · 처음 깬 단계에만 도토리와 칭호를 준다

export type TowerPhase = 'idle' | 'intro' | 'fight' | 'chest' | 'quiz' | 'clear' | 'fail'
export type Standing = { student: string; best: number; updated_at: string }

type Flow = {
  picker: boolean
  phase: TowerPhase
  stage: number
  hearts: number
  maxHearts: number
  hpFrac: number
  left: number // 남은 몬스터 수
  hurtSeq: number
  quiz: TowerQ[]
  qi: number
  qStart: number
  secs: number[]
  failWhy: 'dead' | 'quiz' | 'time' | null
  reveal: { q: TowerQ; pick: number | string | null } | null
  result: { first: boolean; reward: number } | null
  db: 'unknown' | 'ok' | 'missing'
  standings: Standing[]
  loadedAt: number
}

export const useTower = create<Flow>(() => ({
  picker: false,
  phase: 'idle',
  stage: 1,
  hearts: 3,
  maxHearts: 3,
  hpFrac: 1,
  left: 0,
  hurtSeq: 0,
  quiz: [],
  qi: 0,
  qStart: 0,
  secs: [],
  failWhy: null,
  reveal: null,
  result: null,
  db: 'unknown',
  standings: [],
  loadedAt: 0,
}))

let introTimer: ReturnType<typeof setTimeout> | null = null
const houseLv = () => useVillage.getState().items.find((i) => i.type === 'house')?.level ?? 1

export const openTowerPicker = () => {
  useTower.setState({ picker: true })
  void fetchRank(true)
  void syncMyBest()
}
export const closeTowerPicker = () => useTower.setState({ picker: false })

/* ---------- 입장 ---------- */
export function startStage(stage: number): string | null {
  const v = useVillage.getState()
  if (!v.session) return '로그인해야 탑에 갈 수 있어요'
  if (isClosed()) {
    v.setNotice(CLOSED_TEXT)
    return '지금은 들어갈 수 없어요'
  }
  const tester = isTowerTester(v.session.name)
  const chk = canEnter(stage, v.tower.best, houseLv(), towerLeftOf(v.tower), tester)
  if (!chk.ok) return chk.why
  if (!tester) v.spendTowerTry()
  v.setVisiting(null)
  playerPos.set(0, 0, 5)
  const maxHearts = heartsFor(houseLv(), tester)
  useVillage.setState({ towerOn: true, plaza: null, bossRoom: null, raidRoom: false })
  useTower.setState({
    picker: false, phase: 'intro', stage, hearts: maxHearts, maxHearts, hpFrac: 1, left: 0, quiz: [], qi: 0, secs: [], failWhy: null, reveal: null, result: null,
  })
  if (introTimer) clearTimeout(introTimer)
  introTimer = setTimeout(() => {
    if (useTower.getState().phase !== 'intro') return
    useTower.setState({ phase: 'fight' })
    simStart(stage)
  }, 2200)
  return null
}

export function exitTower() {
  if (introTimer) clearTimeout(introTimer)
  introTimer = null
  simStop()
  playerPos.set(0, 0, 3)
  useVillage.setState({ towerOn: false })
  useTower.setState({ phase: 'idle', quiz: [], reveal: null, result: null, failWhy: null })
}

export const inTowerFight = () => {
  const p = useTower.getState().phase
  return p === 'intro' || p === 'fight' || p === 'chest' || p === 'quiz'
}

/* ---------- 전투 중 일어나는 일 ---------- */
hooks.onHurt = () => {
  const s = useTower.getState()
  if (s.phase !== 'fight') return
  const hearts = Math.max(0, s.hearts - 1)
  camShake.amp = Math.max(camShake.amp, 0.5)
  useTower.setState({ hearts, hurtSeq: s.hurtSeq + 1 })
  if (hearts <= 0) {
    simStop()
    useVillage.getState().towerLog({ t: Date.now(), s: s.stage, r: 'dead' })
    useTower.setState({ phase: 'fail', failWhy: 'dead' })
  }
}
hooks.onProgress = (hpFrac, left) => {
  if (useTower.getState().phase === 'fight') useTower.setState({ hpFrac, left })
}
hooks.onCleared = () => {
  if (useTower.getState().phase === 'fight') useTower.setState({ phase: 'chest', hpFrac: 0, left: 0 })
}

/* ---------- 보물상자 문제 ---------- */
export function openChest() {
  const s = useTower.getState()
  if (s.phase !== 'chest') return
  useTower.setState({ phase: 'quiz', quiz: towerQuiz(s.stage), qi: 0, qStart: Date.now(), secs: [] })
}

// pick: 고른 답 (시간이 끝나면 null)
export function answerTower(pick: number | string | null) {
  const s = useTower.getState()
  if (s.phase !== 'quiz') return
  const q = s.quiz[s.qi]
  if (!q) return
  const elapsed = Date.now() - s.qStart
  const timeout = pick == null || elapsed > (q.ms ?? QUIZ_MS) + 2500
  const ok = !timeout && judgeTower(q, pick)
  const secs = [...s.secs, Math.min(99, Math.round(elapsed / 100) / 10)]
  if (!ok) {
    useVillage.getState().towerLog({ t: Date.now(), s: s.stage, r: 'quiz', ok: [...secs.slice(0, -1).map(() => true), false], sec: secs })
    useTower.setState({ phase: 'fail', failWhy: timeout ? 'time' : 'quiz', reveal: { q, pick }, secs })
    return
  }
  if (s.qi + 1 >= s.quiz.length) {
    const res = useVillage.getState().towerClear(s.stage, { t: Date.now(), s: s.stage, r: 'clear', ok: secs.map(() => true), sec: secs })
    if (res.first) {
      void pushMyBest()
      useVillage.getState().flash(`🏆 ${s.stage}단계 클리어! 칭호 「${towerStage(s.stage).title}」`)
    }
    useTower.setState({ phase: 'clear', result: res, secs })
    return
  }
  useTower.setState({ qi: s.qi + 1, qStart: Date.now(), secs })
}

/* ---------- 순위 (같은 반 최고 단계) ---------- */
const sess = () => useVillage.getState().session

export async function fetchRank(force = false) {
  const s = sess()
  if (!s) return
  const st = useTower.getState()
  if (!force && Date.now() - st.loadedAt < 15_000) return
  try {
    const { data, error } = await supabase.from('tower_stats').select('student, best, updated_at').eq('class_code', s.classCode)
    if (error) throw error
    const rows = ((data ?? []) as Standing[]).filter((r) => r.best > 0)
    rows.sort((a, b) => b.best - a.best || (a.updated_at < b.updated_at ? -1 : a.updated_at > b.updated_at ? 1 : 0))
    useTower.setState({ db: 'ok', standings: rows, loadedAt: Date.now() })
  } catch {
    useTower.setState({ db: 'missing', loadedAt: Date.now() })
  }
}

export async function pushMyBest() {
  const s = sess()
  if (!s) return
  const best = Math.min(STAGE_COUNT, useVillage.getState().tower.best)
  if (best <= 0) return
  try {
    const { error } = await supabase
      .from('tower_stats')
      .upsert({ class_code: s.classCode, student: s.name, best, updated_at: new Date().toISOString() }, { onConflict: 'class_code,student' })
    if (error) throw error
    useTower.setState({ db: 'ok' })
    void fetchRank(true)
  } catch {
    useTower.setState({ db: 'missing' })
  }
}

// 기록이 서버에 없거나 낮으면 올린다 (표를 나중에 만든 경우나 다른 기기에서 한 경우)
async function syncMyBest() {
  const s = sess()
  const best = useVillage.getState().tower.best
  if (!s || best <= 0) return
  await fetchRank(true)
  const mine = useTower.getState().standings.find((r) => r.student === s.name)
  if (useTower.getState().db === 'ok' && (!mine || mine.best < best)) void pushMyBest()
}

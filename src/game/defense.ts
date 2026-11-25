import { create } from 'zustand'
import { useVillage, defOf, defLeftOf, defClearedOf } from './store'
import { isClosed, CLOSED_TEXT } from './control'
import { onDefEnd, onDefStart, setDefMe, useDef } from './defState'
import { DEF_DAILY, DEF_MIN, starsFor } from './defData'

// 도토리 나무 수비대 방 들어가고 나오기 (보스방과 같은 방식)

export function enterDefense(room = 1) {
  const s = useVillage.getState()
  if (!s.session) {
    s.flash('로그인해야 수비대에 갈 수 있어요')
    return
  }
  if (isClosed()) {
    s.setNotice(CLOSED_TEXT)
    return
  }
  const d = defOf(s.items)
  const left = defLeftOf(d)
  const dev = import.meta.env.DEV && /[?&]solo(\b|=)/.test(location.search)
  if (left <= 0 && !dev) {
    s.flash(`오늘 수비대 입장 ${DEF_DAILY}번을 모두 썼어요. 내일 또 와요! 🌳`)
    return
  }
  s.setVisiting(null)
  setDefMe(defClearedOf(d), dev ? Math.max(1, left) : left, s.job?.f ?? null, s.job ? (s.weapons[s.job.f] ?? 0) : 0)
  useVillage.setState({ defRoom: room, plaza: null, raidRoom: false, bossRoom: null })
}

export function leaveDefense() {
  useVillage.setState({ defRoom: null })
}

export function nextDefRoom() {
  leaveDefense()
  useVillage.getState().setNotice('이 수비대 방은 이미 4명이 모였어요.\n다른 번호의 방을 골라 주세요! 🙏')
}

export const useDefUi = create<{ picker: boolean }>(() => ({ picker: false }))

// 전투가 시작되면 오늘 입장 1번, 이기면 처음 받은 별만큼 도토리
onDefStart((snap) => {
  useVillage.getState().spendDefTry(snap.gid)
  const s = useVillage.getState()
  setDefMe(defClearedOf(defOf(s.items)), defLeftOf(defOf(s.items)), s.job?.f ?? null, s.job ? (s.weapons[s.job.f] ?? 0) : 0)
})
onDefEnd((snap) => {
  const won = snap.st === 'won'
  const stars = won ? starsFor(snap.tree) : 0
  let coins = 0
  let note = ''
  if (won && snap.members.length < DEF_MIN) note = '혼자 하는 연습이라 별·도토리는 없어요'
  else if (won) {
    const r = useVillage.getState().defReward(snap.gid, snap.stage, stars)
    coins = r.coins
    note = r.newStars > 0 ? `새로 받은 별 ${r.newStars}개! +${coins} 도토리` : '이미 받은 별이라 도토리는 없어요 — 더 많은 별에 도전해요!'
  } else note = snap.st === 'aborted' ? '수비가 멈췄어요' : '도토리 나무가 쓰러졌어요… 다시 도전해요!'
  useDef.setState({ result: { gid: snap.gid, won, stage: snap.stage, stars, coins, note } })
  const s = useVillage.getState()
  setDefMe(defClearedOf(defOf(s.items)), defLeftOf(defOf(s.items)), s.job?.f ?? null, s.job ? (s.weapons[s.job.f] ?? 0) : 0)
})

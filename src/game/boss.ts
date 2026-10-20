import { create } from 'zustand'
import { useVillage } from './store'
import { playerPos } from './player-state'
import { isClosed, CLOSED_TEXT } from './control'
import { LOBBY_SPAWN_Z } from './bossLayout'
import { setMyCleared, setMyHouse, setMyLeft } from './bossState'
import { bossLeftOf } from './store'
import { soloTest } from './bossData'

// 보스 방 들어가고 나오기 (광장의 enterPlaza / leavePlaza 와 같은 방식)

export function enterBoss(room = 1) {
  const s = useVillage.getState()
  if (!s.session) {
    s.flash('로그인해야 보스 방에 갈 수 있어요')
    return
  }
  if (isClosed()) {
    s.setNotice(CLOSED_TEXT)
    return
  }
  const left = bossLeftOf(s.bossTry)
  if (left <= 0 && !soloTest()) {
    s.flash('오늘 보스 도전 기회를 모두 썼어요. 내일 또 도전해요! 💪')
    return
  }
  s.setVisiting(null) // 열려 있던 창·친구 마을 정리
  setMyLeft(left)
  setMyCleared(s.bossCleared)
  setMyHouse(s.items.find((i) => i.type === 'house')?.level ?? 1)
  playerPos.set((Math.random() - 0.5) * 5, 0, LOBBY_SPAWN_Z + Math.random())
  useVillage.setState({ bossRoom: room, plaza: null })
}

export function leaveBoss() {
  playerPos.set(0, 0, 3)
  useVillage.setState({ bossRoom: null })
}

// 이 방이 꽉 찼거나 이미 전투 중이면 돌려보낸다
export function nextBossRoom() {
  leaveBoss()
  useVillage.getState().setNotice('이 보스 방은 이미 4명이 모였어요.\n다른 번호의 방을 골라 주세요! 🙏')
}

// 보스 방 번호 고르는 창
export const useBossUi = create<{ picker: boolean }>(() => ({ picker: false }))

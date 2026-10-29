import { useVillage } from './store'
import { playerPos } from './player-state'
import { isClosed, CLOSED_TEXT } from './control'
import { RAID_OPEN_TEXT, RAID_TRIES, raidFacing, raidSlot } from './raidData'
import { raidStatus } from './raidApi'
import { raidSetStatus, setRaidLateHandler, useRaid } from './raidState'

// 학급 레이드 대기실에 들어가고 나오기 (보스방의 enterBoss / leaveBoss 와 같은 방식)

let entering = false

export async function enterRaid() {
  const s = useVillage.getState()
  if (!s.session) {
    s.flash('로그인해야 레이드에 갈 수 있어요')
    return
  }
  if (isClosed()) {
    s.setNotice(CLOSED_TEXT)
    return
  }
  if (entering) return
  entering = true
  try {
    const st = await raidStatus(s.session.classCode)
    let noServer = false
    if (st === 'missing') {
      // 서버 준비(schema-11-raid.sql)가 안 됐다. 개발 중에만 그냥 들어가서 볼 수 있다.
      if (!import.meta.env.DEV) {
        s.setNotice('레이드 준비 중이에요.\n조금만 기다려 주세요! 🛠️')
        return
      }
      noServer = true
    } else if (!st.open) {
      s.setNotice(`지금은 레이드가 닫혀 있어요.\n${RAID_OPEN_TEXT}! 🐲`)
      return
    } else if (st.cleared) {
      s.setNotice('이번 주 레이드는 이미 깼어요! 🎉\n다음 주 금요일에 또 만나요.')
      return
    } else if (st.left <= 0) {
      s.setNotice(`오늘 도전 기회 ${RAID_TRIES}번을 모두 썼어요.\n다음 주 금요일에 다시 도전해요! 💪`)
      return
    }
    raidSetStatus(st === 'missing' ? null : st, noServer)
    s.setVisiting(null) // 열려 있던 창·친구 마을 정리
    const [x, z] = raidSlot(0)
    playerPos.set(x, 0, z)
    useVillage.setState({ raidRoom: true, plaza: null, bossRoom: null })
  } finally {
    entering = false
  }
}

export function leaveRaid() {
  playerPos.set(0, 0, 3)
  useVillage.setState({ raidRoom: false })
}

// 이미 출발한 뒤에 들어왔거나, 자리가 없을 때
setRaidLateHandler(() => {
  leaveRaid()
  useVillage.getState().setNotice('이미 레이드가 출발했어요.\n다음 도전에 같이 가요! 🙏')
})

export function nextRaidFull() {
  leaveRaid()
  useVillage.getState().setNotice('레이드 대기실이 가득 찼어요.\n잠시 뒤에 다시 들어와 주세요! 🙏')
}

// 내 자리 (대기실에서 서는 곳)
export function myRaidSlot(): { x: number; z: number; f: number } {
  const st = useRaid.getState()
  const me = useVillage.getState().session?.name
  const i = Math.max(0, me ? st.roster.indexOf(me) : 0)
  const [x, z] = raidSlot(i)
  return { x, z, f: raidFacing(x, z) }
}

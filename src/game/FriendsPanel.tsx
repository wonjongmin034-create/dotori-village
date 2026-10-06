import { useEffect, useState } from 'react'
import { houseLevel, landPyeong } from './economy'
import { fetchFriends, houseEmoji, visitFriend, type Friend } from './friends'
import { useVillage } from './store'

// 같은 반 친구 목록 → 놀러가기. 친구 집(오두막) 단계도 함께 보여 준다.
export function FriendsPanel() {
  const open = useVillage((s) => s.friendsOpen)
  const close = useVillage((s) => s.closeFriends)
  const session = useVillage((s) => s.session)
  const flash = useVillage((s) => s.flash)

  const [friends, setFriends] = useState<Friend[] | null>(null)
  const [fail, setFail] = useState(false)
  const [going, setGoing] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !session) return
    setFriends(null)
    setFail(false)
    let dead = false
    void fetchFriends().then((f) => {
      if (dead) return
      if (f) setFriends(f)
      else setFail(true)
    })
    return () => {
      dead = true
    }
  }, [open, session])

  if (!open) return null

  const go = async (name: string) => {
    setGoing(name)
    const ok = await visitFriend(name)
    setGoing(null)
    if (!ok) flash('친구 마을을 불러오지 못했어요. 인터넷을 확인해 주세요')
  }

  return (
    <div className="farm-overlay" onPointerDown={(e) => e.target === e.currentTarget && close()}>
      <div className="farm-card friends-card">
        <button type="button" className="farm-x" onClick={close} aria-label="닫기">
          ✕
        </button>
        <h3>👫 친구 마을 놀러가기</h3>
        <p className="farm-note">같은 반 친구의 마을을 구경해요. 구경만 할 수 있어요.</p>

        {!session && <p className="hw-empty">로그인해야 친구 마을에 갈 수 있어요.</p>}
        {session && !friends && !fail && <p className="hw-empty">친구들을 불러오는 중…</p>}
        {fail && <p className="hw-empty">친구 목록을 불러오지 못했어요. 인터넷을 확인해 주세요.</p>}
        {friends && friends.length === 0 && (
          <p className="hw-empty">아직 같은 반 친구가 없어요. 친구가 들어오면 여기에 나타나요.</p>
        )}

        <div className="friend-list">
          {friends?.map((f) => (
            <button
              key={f.name}
              type="button"
              className="friend-row"
              disabled={going !== null}
              onClick={() => void go(f.name)}
            >
              <span className="friend-ico">{houseEmoji(f.level)}</span>
              <span className="friend-main">
                <span className="friend-name">
                  {f.online && <i className="friend-on" title="접속 중" />}
                  {f.name}
                </span>
                <span className="friend-meta">
                  {houseLevel(f.level).label} · {landPyeong(f.land)}평 · 물건 {f.things}개
                </span>
              </span>
              <span className="friend-lv">Lv.{f.level}</span>
              <span className="friend-go">{going === f.name ? '가는 중…' : '놀러가기 ▶'}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

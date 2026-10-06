import { HOUSE_LEVELS, houseLevel, landPyeong, LAND_OLD } from './economy'
import { houseEmoji } from './friends'
import { useVillage } from './store'

const SYSTEM = new Set(['house', 'board', 'arcade', 'wardrobe'])

// 친구 집을 탭하면 뜨는 카드 — 오두막 레벨 보기.
export function FriendInfoPanel() {
  const visiting = useVillage((s) => s.visiting)
  const open = useVillage((s) => s.friendInfoOpen)
  const close = useVillage((s) => s.closeFriendInfo)

  if (!visiting || !open) return null
  const house = visiting.items.find((i) => i.type === 'house')
  const level = house?.level ?? 1
  const def = houseLevel(level)
  const half = house?.land ?? LAND_OLD
  const things = visiting.items.filter((i) => !SYSTEM.has(i.type)).length

  return (
    <div className="farm-overlay" onPointerDown={(e) => e.target === e.currentTarget && close()}>
      <div className="farm-card friend-info">
        <button type="button" className="farm-x" onClick={close} aria-label="닫기">
          ✕
        </button>
        <div className="friend-info-ico">{houseEmoji(level)}</div>
        <h3>{visiting.name}의 집</h3>
        <div className="friend-info-lv">
          Lv.{level} · {def.label}
        </div>
        <p className="farm-note">{def.desc}</p>

        <ol className="house-track">
          {HOUSE_LEVELS.map((l) => (
            <li key={l.level} className={l.level <= level ? 'done' : ''}>
              <span>{l.level <= level ? '✅' : l.level}</span>
              {l.label}
            </li>
          ))}
        </ol>

        <div className="farm-status">
          <div>
            마을 땅: <b>{landPyeong(half)}평</b> ({half * 2} × {half * 2}칸)
          </div>
          <div>
            꾸민 물건: <b>{things}개</b>
          </div>
        </div>
      </div>
    </div>
  )
}

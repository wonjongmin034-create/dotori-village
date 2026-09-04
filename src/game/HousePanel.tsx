import { HOUSE_LEVELS, houseLevel } from './economy'
import { useVillage } from './store'

export function HousePanel() {
  const item = useVillage((s) => s.items.find((i) => i.key === s.activeFarm))
  const coins = useVillage((s) => s.coins)
  const close = useVillage((s) => s.closeFarm)
  const upgrade = useVillage((s) => s.upgradeHouse)

  if (!item || item.type !== 'house') return null

  const cur = item.level ?? 1
  const curDef = houseLevel(cur)
  const next = HOUSE_LEVELS.find((l) => l.level === cur + 1)

  return (
    <div className="farm-overlay" onPointerDown={(e) => e.target === e.currentTarget && close()}>
      <div className="farm-card">
        <button type="button" className="farm-x" onClick={close} aria-label="닫기">
          ✕
        </button>

        <h3>🏡 우리 집</h3>
        <div className="farm-status">
          <div>
            지금: <b>{curDef.label}</b>
          </div>
          <div>{curDef.desc}</div>
        </div>

        {next ? (
          <>
            <p className="farm-note">코인을 모아 더 좋은 집으로 넓힐 수 있어요.</p>
            <div className="house-next">
              <div className="house-next-head">
                <span>
                  다음: <b>{next.label}</b>
                </span>
                <span className="house-cost">🌰 {next.cost}</span>
              </div>
              <p>{next.desc}</p>
              <button
                type="button"
                className="primary"
                disabled={coins < next.cost}
                onClick={upgrade}
              >
                🔨 {next.label}(으)로 넓히기
              </button>
            </div>
          </>
        ) : (
          <p className="farm-note">이미 마을에서 제일 멋진 집이에요! 🎉</p>
        )}

        <ol className="house-track">
          {HOUSE_LEVELS.map((l) => (
            <li key={l.level} className={l.level <= cur ? 'done' : ''}>
              <span>{l.level <= cur ? '✅' : `${l.cost}`}</span>
              {l.label}
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

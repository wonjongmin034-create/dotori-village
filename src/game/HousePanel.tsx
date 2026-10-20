import { HOUSE_LEVELS, farmLimit, houseLevel, houseNeededForLand, landCapFor, landExpand, landPyeong, LAND_OLD } from './economy'
import { unlockedAt } from './wardrobe'
import { FAMILY_EMOJI, FAMILY_HOUSE, FAMILY_LABEL, WEAPON_FAMILIES } from './weapons'
import { useVillage } from './store'

export function HousePanel() {
  const item = useVillage((s) => s.items.find((i) => i.key === s.activeFarm))
  const coins = useVillage((s) => s.coins)
  const close = useVillage((s) => s.closeFarm)
  const upgrade = useVillage((s) => s.upgradeHouse)
  const expandLand = useVillage((s) => s.expandLand)

  if (!item || item.type !== 'house') return null

  const cur = item.level ?? 1
  const curDef = houseLevel(cur)
  const next = HOUSE_LEVELS.find((l) => l.level === cur + 1)

  const half = item.land ?? LAND_OLD
  const land = landExpand(half)
  const landLocked = !!land && land.next > landCapFor(cur) // 집 단계가 낮아서 더 넓힐 수 없다
  const perks = (lv: number) => {
    const cap = landCapFor(lv) * 2
    const gear = unlockedAt(lv)
    const guns = WEAPON_FAMILIES.filter((f) => FAMILY_HOUSE[f] === lv && lv > 1)
    return { cap, gear, guns, plot: farmLimit('plot', lv) ?? 0, coop: farmLimit('coop', lv) ?? 0 }
  }

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
              <ul className="house-perks">
                <li>
                  🌱 밭 {perks(next.level).plot}개 · 🐔 우리 {perks(next.level).coop}개
                </li>
                <li>🟩 땅을 {perks(next.level).cap} × {perks(next.level).cap}칸까지 넓힐 수 있어요</li>
                {perks(next.level).gear.length > 0 && (
                  <li>
                    👕 새로 살 수 있는 옷·탈것 {perks(next.level).gear.length}종
                    <small> ({perks(next.level).gear.slice(0, 3).map((g) => g.label).join(', ')} 등)</small>
                  </li>
                )}
                {perks(next.level).guns.map((f) => (
                  <li key={f}>
                    {FAMILY_EMOJI[f]} 새 무기 <b>{FAMILY_LABEL[f]}</b> 얻기
                  </li>
                ))}
              </ul>
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

        <h3 className="land-h">🟩 마을 땅</h3>
        <div className="farm-status">
          <div>
            지금: <b>{half * 2} × {half * 2}칸</b> ({landPyeong(half)}평)
          </div>
        </div>
        {land ? (
          <div className="house-next">
            <div className="house-next-head">
              <span>
                +{land.addTiles}평 넓히기 ({half * 2} → {land.next * 2}칸)
              </span>
              <span className="house-cost">🌰 {land.cost}</span>
            </div>
            <p>평당 도토리 1개예요.</p>
            {landLocked && (
              <p className="house-lock">
                🔒 집이 <b>{houseNeededForLand(land.next)}단계</b>({houseLevel(houseNeededForLand(land.next)).label})가 되면 더 넓힐 수 있어요. 지금 집은 땅을 {landCapFor(cur) * 2} × {landCapFor(cur) * 2}칸까지 넓힐 수 있어요.
              </p>
            )}
            <button
              type="button"
              className="primary"
              disabled={landLocked || coins < land.cost}
              onClick={expandLand}
            >
              {landLocked ? '🔒 집을 먼저 키워요' : '🟩 땅 넓히기'}
            </button>
          </div>
        ) : (
          <p className="farm-note">땅이 최대 크기예요.</p>
        )}
      </div>
    </div>
  )
}

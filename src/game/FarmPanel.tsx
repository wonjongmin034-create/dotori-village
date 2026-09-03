import {
  CROPS,
  ANIMALS,
  CROP_MAP,
  ANIMAL_MAP,
  CARE_COOLDOWN_MS,
  FERTILIZER_COST,
  FERTILIZER_BONUS,
} from './economy'
import { useVillage } from './store'
import { useNow } from './useNow'

const secs = (ms: number) => `${Math.max(0, Math.ceil(ms / 1000))}초`

export function FarmPanel() {
  const key = useVillage((s) => s.activeFarm)
  const item = useVillage((s) => s.items.find((i) => i.key === s.activeFarm))
  const coins = useVillage((s) => s.coins)
  const close = useVillage((s) => s.closeFarm)
  const plantCrop = useVillage((s) => s.plantCrop)
  const waterCrop = useVillage((s) => s.waterCrop)
  const fertilizeCrop = useVillage((s) => s.fertilizeCrop)
  const harvestCrop = useVillage((s) => s.harvestCrop)
  const buyAnimal = useVillage((s) => s.buyAnimal)
  const feedAnimal = useVillage((s) => s.feedAnimal)
  const collectProduce = useVillage((s) => s.collectProduce)
  const now = useNow(500)

  if (!key || !item) return null

  return (
    <div className="farm-overlay" onPointerDown={(e) => e.target === e.currentTarget && close()}>
      <div className="farm-card">
        <button type="button" className="farm-x" onClick={close} aria-label="닫기">
          ✕
        </button>

        {item.type === 'plot' && !item.crop && (
          <>
            <h3>🌱 무엇을 심을까요?</h3>
            <p className="farm-note">
              기본 작물은 무료예요. 값이 비싼 작물일수록 수확 보상도 커요.
            </p>
            <div className="farm-grid">
              {CROPS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="farm-opt"
                  disabled={c.cost > coins}
                  onClick={() => plantCrop(key, c.id)}
                >
                  <span className="opt-emoji">{c.emoji}</span>
                  <span className="opt-name">{c.label}</span>
                  <span className="opt-cost">{c.cost === 0 ? '무료' : `🌰 ${c.cost}`}</span>
                  <span className="opt-reward">수확 +{c.reward}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {item.type === 'plot' && item.crop && (() => {
          const def = CROP_MAP[item.crop.seed]
          if (!def) return null
          const cd = CARE_COOLDOWN_MS - (now - item.crop.lastCareAt)
          const canWater = cd <= 0 && item.crop.waterCount < def.waterGoal
          const growLeft = def.minGrowMs - (now - item.crop.plantedAt)
          const ripe =
            item.crop.waterCount >= def.waterGoal && growLeft <= 0
          return (
            <>
              <h3>
                {def.emoji} {def.label}
              </h3>
              <div className="farm-status">
                <div>
                  물주기 <b>{item.crop.waterCount}/{def.waterGoal}</b>
                </div>
                <div>{ripe ? '✅ 수확할 수 있어요' : growLeft > 0 ? `자라는 중 · ${secs(growLeft)}` : '물이 더 필요해요'}</div>
                {item.crop.fertilized && <div className="fert-on">비료 완료 (보상 ×{FERTILIZER_BONUS})</div>}
              </div>
              <div className="farm-actions">
                <button
                  type="button"
                  disabled={!canWater}
                  onClick={() => waterCrop(key)}
                >
                  💧 물주기 {cd > 0 ? `(${secs(cd)})` : '· 문제 풀기'}
                </button>
                {!item.crop.fertilized && (
                  <button
                    type="button"
                    disabled={coins < FERTILIZER_COST}
                    onClick={() => fertilizeCrop(key)}
                  >
                    🧪 비료주기 (🌰 {FERTILIZER_COST})
                  </button>
                )}
                <button
                  type="button"
                  className="primary"
                  disabled={!ripe}
                  onClick={() => harvestCrop(key)}
                >
                  🧺 수확하기 (+{Math.round(def.reward * (item.crop.fertilized ? FERTILIZER_BONUS : 1))})
                </button>
              </div>
            </>
          )
        })()}

        {item.type === 'coop' && !item.animal && (
          <>
            <h3>🐣 어떤 동물을 키울까요?</h3>
            <p className="farm-note">기본 동물은 무료, 큰 동물은 도토리가 들지만 생산물 보상이 커요.</p>
            <div className="farm-grid">
              {ANIMALS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className="farm-opt"
                  disabled={a.cost > coins}
                  onClick={() => buyAnimal(key, a.id)}
                >
                  <span className="opt-emoji">{a.emoji}</span>
                  <span className="opt-name">{a.label}</span>
                  <span className="opt-cost">{a.cost === 0 ? '무료' : `🌰 ${a.cost}`}</span>
                  <span className="opt-reward">
                    {a.produceEmoji} +{a.reward}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {item.type === 'coop' && item.animal && (() => {
          const def = ANIMAL_MAP[item.animal.species]
          if (!def) return null
          const cd = CARE_COOLDOWN_MS - (now - item.animal.lastCareAt)
          const canFeed = cd <= 0
          const produceLeft = def.produceMs - (now - item.animal.cycleStart)
          const ready = produceLeft <= 0
          const wellFed = item.animal.feedCount >= def.feedGoal
          return (
            <>
              <h3>
                {def.emoji} {def.label}
              </h3>
              <div className="farm-status">
                <div>
                  먹이 <b>{item.animal.feedCount}/{def.feedGoal}</b> {wellFed && '· 잘 먹었어요'}
                </div>
                <div>
                  {ready ? `✅ ${def.produceLabel} 거둘 수 있어요` : `${def.produceLabel} 모이는 중 · ${secs(produceLeft)}`}
                </div>
              </div>
              <div className="farm-actions">
                <button type="button" disabled={!canFeed} onClick={() => feedAnimal(key)}>
                  🌾 먹이주기 {cd > 0 ? `(${secs(cd)})` : '· 문제 풀기'}
                </button>
                <button
                  type="button"
                  className="primary"
                  disabled={!ready}
                  onClick={() => collectProduce(key)}
                >
                  {def.produceEmoji} 거두기 (+{Math.round(def.reward * (wellFed ? def.wellFedBonus : 1))})
                </button>
              </div>
            </>
          )
        })()}
      </div>
    </div>
  )
}

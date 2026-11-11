import { useState } from 'react'
import { CROPS, ANIMALS, CROP_MAP, ANIMAL_MAP, cropDays, fertCost, marketMult, sellPrice, WILT_SCHOOL_DAYS } from './economy'
import { useVillage } from './store'
import { useNow } from './useNow'
import { dateKey } from './lunch'
import { animalReady, cropRipe, normAnimal, normCrop, wiltPending } from './farm'

export const starText = (n: number) => '★'.repeat(n) + '☆'.repeat(Math.max(0, 3 - n))

function Days({ done, total }: { done: number; total: number }) {
  return (
    <div className="farm-days" aria-label={`${done}/${total}일`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={i < done ? 'on' : ''} />
      ))}
    </div>
  )
}

export function FarmPanel() {
  const key = useVillage((s) => s.activeFarm)
  const item = useVillage((s) => s.items.find((i) => i.key === s.activeFarm))
  const coins = useVillage((s) => s.coins)
  const lunch = useVillage((s) => s.classLunch)
  const close = useVillage((s) => s.closeFarm)
  const plantCrop = useVillage((s) => s.plantCrop)
  const waterCrop = useVillage((s) => s.waterCrop)
  const harvestCrop = useVillage((s) => s.harvestCrop)
  const buyAnimal = useVillage((s) => s.buyAnimal)
  const feedAnimal = useVillage((s) => s.feedAnimal)
  const collectProduce = useVillage((s) => s.collectProduce)
  const openBarn = useVillage((s) => s.openBarn)
  const [fert, setFert] = useState(false)
  useNow(5000) // 날짜가 바뀌면 다시 그린다
  const today = dateKey()

  if (!key || !item) return null
  if (item.type !== 'plot' && item.type !== 'coop') return null

  const rules = (
    <p className="farm-note">
      📅 하루에 한 번, 문제를 맞히면 돌볼 수 있어요.
      <br />
      ❌ 틀리면 그날 기회가 사라지고 품질이 ★ 하나 줄어요.
      <br />
      🥀 학교 날 {WILT_SCHOOL_DAYS}일 동안 아무도 안 돌보면 시들어서 ★ 하나 줄어요. (친구가 도와주면 괜찮아요)
    </p>
  )
  const barnLink = (
    <button type="button" className="farm-barn-link" onClick={openBarn}>
      🧺 창고 · 시장 · 도감 보기
    </button>
  )

  return (
    <div className="farm-overlay" onPointerDown={(e) => e.target === e.currentTarget && close()}>
      <div className="farm-card">
        <button type="button" className="farm-x" onClick={close} aria-label="닫기">
          ✕
        </button>

        {item.type === 'plot' && !item.crop && (
          <>
            <h3>🌱 무엇을 심을까요?</h3>
            <p className="farm-note">날마다 돌봐야 자라요. 오래 걸리는 작물일수록 비싸게 팔려요.</p>
            <label className="fert-toggle">
              <input type="checkbox" checked={fert} onChange={(e) => setFert(e.target.checked)} />
              <span>🧪 비료도 함께 주기 — 하루 빨리 자라요 (심을 때만 줄 수 있어요)</span>
            </label>
            <div className="farm-grid">
              {CROPS.map((c) => {
                const cost = c.cost + (fert ? fertCost(c) : 0)
                const d = cropDays(c, fert)
                return (
                  <button key={c.id} type="button" className="farm-opt" disabled={cost > coins} onClick={() => plantCrop(key, c.id, fert)}>
                    <span className="opt-emoji">{c.emoji}</span>
                    <span className="opt-name">{c.label}</span>
                    <span className="opt-cost">{cost === 0 ? '무료' : `🌰 ${cost}`}</span>
                    <span className="opt-reward">★★★ 약 🌰{sellPrice(c.base, 3, 1)}</span>
                    <span className="opt-time">{d}일 돌보기</span>
                  </button>
                )
              })}
            </div>
            {barnLink}
          </>
        )}

        {item.type === 'plot' &&
          item.crop &&
          (() => {
            const c = normCrop(item.crop, today)
            const def = CROP_MAP[c.seed]
            if (!def) return null
            const total = cropDays(def, c.fert)
            const ripe = cropRipe(c)
            const done = c.tryDay === today
            const wilt = wiltPending(c, today, lunch)
            const shownStars = wilt ? Math.max(1, c.stars - 1) : c.stars
            const price = sellPrice(def.base, shownStars, marketMult(today, 'c:' + def.id))
            return (
              <>
                <h3>
                  {def.emoji} {def.label} <span className="farm-stars">{starText(shownStars)}</span>
                </h3>
                <div className="farm-status">
                  <div>
                    자란 날 <b>{c.grow}/{total}</b>
                    {c.fert && <span className="fert-on"> · 🧪 비료</span>}
                  </div>
                  <Days done={c.grow} total={total} />
                  <div>
                    {ripe
                      ? '✅ 다 자랐어요! 수확해서 창고에 넣어요'
                      : done
                        ? '🌙 오늘은 돌봤어요. 내일 또 와요'
                        : '💧 오늘 물을 줄 수 있어요'}
                  </div>
                  {wilt && <div className="farm-wilt">🥀 며칠 동안 못 돌봐서 시들었어요 (★ 하나 줄어요)</div>}
                  {c.helpDay === today && <div className="farm-help-on">🤝 오늘 친구가 도와줬어요</div>}
                  <div className="farm-price">오늘 시장에서 약 🌰 {price}</div>
                </div>
                {rules}
                <div className="farm-actions">
                  {!ripe && (
                    <button type="button" disabled={done} onClick={() => waterCrop(key)}>
                      💧 물주기 {done ? '(내일)' : '· 문제 풀기'}
                    </button>
                  )}
                  <button type="button" className="primary" disabled={!ripe} onClick={() => harvestCrop(key)}>
                    🧺 수확하기
                  </button>
                </div>
                {barnLink}
              </>
            )
          })()}

        {item.type === 'coop' && !item.animal && (
          <>
            <h3>🐣 어떤 동물을 키울까요?</h3>
            <p className="farm-note">먹이를 먹은 날이 모이면 생산물이 생겨요. 한 번 데려오면 계속 키울 수 있어요.</p>
            <div className="farm-grid">
              {ANIMALS.map((a) => (
                <button key={a.id} type="button" className="farm-opt" disabled={a.cost > coins} onClick={() => buyAnimal(key, a.id)}>
                  <span className="opt-emoji">{a.emoji}</span>
                  <span className="opt-name">{a.label}</span>
                  <span className="opt-cost">{a.cost === 0 ? '무료' : `🌰 ${a.cost}`}</span>
                  <span className="opt-reward">
                    {a.produceEmoji} ★★★ 약 🌰{sellPrice(a.base, 3, 1)}
                  </span>
                  <span className="opt-time">먹이 {a.need}일마다</span>
                </button>
              ))}
            </div>
            {barnLink}
          </>
        )}

        {item.type === 'coop' &&
          item.animal &&
          (() => {
            const a = normAnimal(item.animal, today)
            const def = ANIMAL_MAP[a.species]
            if (!def) return null
            const ready = animalReady(a)
            const done = a.tryDay === today
            const wilt = wiltPending(a, today, lunch)
            const shownStars = wilt ? Math.max(1, a.stars - 1) : a.stars
            const price = sellPrice(def.base, shownStars, marketMult(today, 'a:' + def.id))
            return (
              <>
                <h3>
                  {def.emoji} {def.label} <span className="farm-stars">{starText(shownStars)}</span>
                </h3>
                <div className="farm-status">
                  <div>
                    {def.produceLabel}까지 먹이 <b>{a.fed}/{def.need}</b>일
                  </div>
                  <Days done={a.fed} total={def.need} />
                  <div>
                    {ready
                      ? `✅ ${def.produceLabel}이(가) 생겼어요! 거둬서 창고에 넣어요`
                      : done
                        ? '🌙 오늘은 먹이를 줬어요. 내일 또 와요'
                        : '🌾 오늘 먹이를 줄 수 있어요'}
                  </div>
                  {wilt && <div className="farm-wilt">😢 며칠 동안 굶어서 기운이 없어요 (★ 하나 줄어요)</div>}
                  {a.helpDay === today && <div className="farm-help-on">🤝 오늘 친구가 도와줬어요</div>}
                  <div className="farm-price">
                    {def.produceEmoji} 오늘 시장에서 약 🌰 {price}
                  </div>
                </div>
                {rules}
                <div className="farm-actions">
                  {!ready && (
                    <button type="button" disabled={done} onClick={() => feedAnimal(key)}>
                      🌾 먹이주기 {done ? '(내일)' : '· 문제 풀기'}
                    </button>
                  )}
                  <button type="button" className="primary" disabled={!ready} onClick={() => collectProduce(key)}>
                    {def.produceEmoji} 거두기
                  </button>
                </div>
                {barnLink}
              </>
            )
          })()}
      </div>
    </div>
  )
}

import { useState } from 'react'
import { ALL_PRODUCTS, DEX_NEW_REWARD, marketMult, productInfo, sellPrice } from './economy'
import { useVillage } from './store'
import { useNow } from './useNow'
import { dateKey } from './lunch'
import { normBarn, normDex } from './farm'
import { starText } from './FarmPanel'

// 창고 · 시장 · 도감
export function BarnPanel() {
  const open = useVillage((s) => s.barnOpen)
  const close = useVillage((s) => s.closeBarn)
  const house = useVillage((s) => s.items.find((i) => i.type === 'house'))
  const sell = useVillage((s) => s.sellProduce)
  const sellAll = useVillage((s) => s.sellAllProduce)
  const [tab, setTab] = useState<'barn' | 'dex'>('barn')
  useNow(10_000)
  if (!open) return null
  const today = dateKey()
  const barn = normBarn(house?.barn)
  const dex = normDex(house?.dex)
  const rows = ALL_PRODUCTS.filter((pid) => barn[pid])
  let total = 0
  for (const pid of rows) {
    const info = productInfo(pid)
    if (info) barn[pid].forEach((n, i) => (total += n * sellPrice(info.base, i + 1, marketMult(today, pid))))
  }
  const dexCount = ALL_PRODUCTS.filter((p) => dex[p]).length
  const dexGold = ALL_PRODUCTS.filter((p) => dex[p] === 3).length

  return (
    <div className="farm-overlay" onPointerDown={(e) => e.target === e.currentTarget && close()}>
      <div className="farm-card barn-card">
        <button type="button" className="farm-x" onClick={close} aria-label="닫기">
          ✕
        </button>
        <h3>🧺 우리 창고</h3>
        <div className="barn-tabs">
          <button type="button" className={tab === 'barn' ? 'on' : ''} onClick={() => setTab('barn')}>
            창고 · 시장
          </button>
          <button type="button" className={tab === 'dex' ? 'on' : ''} onClick={() => setTab('dex')}>
            📖 도감 {dexCount}/{ALL_PRODUCTS.length}
          </button>
        </div>

        {tab === 'barn' && (
          <>
            <p className="farm-note">시장 값은 날마다 바뀌어요. 📈 값이 오른 날 팔면 더 많이 받아요! 별이 많을수록 비싸요.</p>
            {rows.length === 0 && <div className="barn-empty">창고가 비어 있어요. 밭과 우리에서 거두면 여기에 쌓여요.</div>}
            <div className="barn-list">
              {rows.map((pid) => {
                const info = productInfo(pid)
                if (!info) return null
                const m = marketMult(today, pid)
                return (
                  <div key={pid} className="barn-row">
                    <div className="barn-head">
                      <span className="barn-emoji">{info.emoji}</span>
                      <b>{info.label}</b>
                      <span className={`barn-mult ${m >= 1.15 ? 'up' : m <= 0.85 ? 'down' : ''}`}>
                        {m >= 1.15 ? '📈' : m <= 0.85 ? '📉' : '➖'} ×{m.toFixed(2)}
                      </span>
                    </div>
                    <div className="barn-stars">
                      {[3, 2, 1].map((star) => {
                        const n = barn[pid][star - 1]
                        if (!n) return null
                        const price = sellPrice(info.base, star, m)
                        return (
                          <div key={star} className="barn-star">
                            <span className="farm-stars">{starText(star)}</span>
                            <span>
                              {n}개 · 개당 🌰{price}
                            </span>
                            <button type="button" onClick={() => sell(pid, star, 1)}>
                              1개 팔기
                            </button>
                            {n > 1 && (
                              <button type="button" onClick={() => sell(pid, star, n)}>
                                모두 (🌰{price * n})
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
            {rows.length > 0 && (
              <div className="farm-actions">
                <button type="button" className="primary" onClick={sellAll}>
                  💰 전부 팔기 (+{total} 도토리)
                </button>
              </div>
            )}
          </>
        )}

        {tab === 'dex' && (
          <>
            <p className="farm-note">
              처음 거두면 도감에 올라가고 🌰{DEX_NEW_REWARD}, 처음으로 ★★★을 거두면 🌰{DEX_NEW_REWARD}를 더 받아요. (★★★ {dexGold}/
              {ALL_PRODUCTS.length})
            </p>
            <div className="dex-grid">
              {ALL_PRODUCTS.map((pid) => {
                const info = productInfo(pid)
                if (!info) return null
                const best = dex[pid] ?? 0
                return (
                  <div key={pid} className={`dex-cell${best ? ' got' : ''}${best === 3 ? ' gold' : ''}`}>
                    <span className="dex-emoji">{best ? info.emoji : '❔'}</span>
                    <span className="dex-name">{best ? info.label : '???'}</span>
                    <span className="farm-stars">{best ? starText(best) : '☆☆☆'}</span>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

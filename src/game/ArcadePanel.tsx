import { useEffect, useRef, useState } from 'react'
import {
  ENHANCE_DAILY_LIMIT,
  ENHANCE_MAX,
  enhanceStep,
  enhanceSell,
} from './economy'
import { useVillage } from './store'
import { dateKey } from './lunch'
import { sfxSuccess, sfxFail, sfxBig } from './sfx'

const acornEmoji = (lv: number) => (lv >= 9 ? '🌟' : lv >= 6 ? '✨' : lv >= 3 ? '🌰' : '🌰')

export function ArcadePanel() {
  const arc = useVillage((s) => s.items.find((i) => i.key === s.activeFarm && i.type === 'arcade'))
  const coins = useVillage((s) => s.coins)
  const close = useVillage((s) => s.closeFarm)
  const tryOne = useVillage((s) => s.enhanceTry)
  const sell = useVillage((s) => s.enhanceSell)
  const fx = useVillage((s) => s.enhanceFx)

  const [flash, setFlash] = useState<{ ok: boolean; text: string } | null>(null)
  const seen = useRef(0)

  useEffect(() => {
    if (!fx || fx.n === seen.current) return
    seen.current = fx.n
    if (fx.ok) {
      fx.to >= 8 ? sfxBig() : sfxSuccess()
      setFlash({ ok: true, text: `성공!  +${fx.to}` })
    } else {
      sfxFail()
      setFlash({ ok: false, text: fx.to === fx.from ? '실패…' : `실패…  +${fx.to}` })
    }
    const t = setTimeout(() => setFlash(null), 1300)
    return () => clearTimeout(t)
  }, [fx])

  if (!arc?.enh) return null

  const today = dateKey()
  const sameDay = arc.enh.day === today
  const used = sameDay ? arc.enh.used : 0
  const net = sameDay ? arc.enh.net : 0
  const level = arc.enh.level
  const step = enhanceStep(level)
  const sellPrice = enhanceSell(level)
  const outOfTries = used >= ENHANCE_DAILY_LIMIT
  const maxed = level >= ENHANCE_MAX

  return (
    <div className="farm-overlay" onPointerDown={(e) => e.target === e.currentTarget && close()}>
      <div className="farm-card arcade-card">
        <button type="button" className="farm-x" onClick={close} aria-label="닫기">
          ✕
        </button>
        <h3>🎰 도토리 강화</h3>

        <div className="arc-acorn">
          <div className={`arc-orb lv${Math.min(10, level)}`}>{acornEmoji(level)}</div>
          <div className="arc-plus">+{level}</div>
        </div>

        {flash && (
          <div className={`arc-flash ${flash.ok ? 'ok' : 'no'}`}>{flash.text}</div>
        )}

        <div className="arc-info">
          {maxed ? (
            <p>최고 레벨이에요! 팔면 큰 도토리를 받아요.</p>
          ) : step ? (
            <ul>
              <li>
                강화 비용 <b>🌰 {step.cost}</b>
              </li>
              <li>
                성공 확률 <b>{Math.round(step.chance * 100)}%</b>
              </li>
              <li>
                실패 시{' '}
                <b>
                  {step.onFail === 0
                    ? '그대로 유지'
                    : `${-step.onFail}단계 내려가요`}
                </b>
              </li>
            </ul>
          ) : null}
          {sellPrice > 0 && (
            <p className="arc-sellinfo">
              지금 팔면 <b>+{sellPrice} 도토리</b>
            </p>
          )}
        </div>

        <div className="arc-actions">
          <button
            type="button"
            disabled={maxed || outOfTries || !step || coins < (step?.cost ?? 0)}
            onClick={tryOne}
          >
            {maxed ? '더 강화 못해요' : '⚡ 강화하기'}
          </button>
          <button
            type="button"
            className="primary"
            disabled={sellPrice <= 0}
            onClick={sell}
          >
            💰 팔기 {sellPrice > 0 ? `(+${sellPrice})` : ''}
          </button>
        </div>

        <div className={`arc-daily ${outOfTries ? 'done' : ''}`}>
          {outOfTries
            ? '오늘 도전은 끝! 내일 또 해요'
            : `오늘 ${used} / ${ENHANCE_DAILY_LIMIT}회`}
          <span className={net >= 0 ? 'pos' : 'neg'}>
            오늘 손익 {net >= 0 ? '+' : ''}
            {net}
          </span>
        </div>
      </div>
    </div>
  )
}

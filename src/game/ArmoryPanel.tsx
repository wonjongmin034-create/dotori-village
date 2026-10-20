import { useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { useVillage } from './store'
import { PreviewCharacter } from './WardrobePanel'
import { sfxBig, sfxSuccess } from './sfx'
import {
  EVOLVE_COST,
  FAMILY_EMOJI,
  FAMILY_HOUSE,
  FAMILY_LABEL,
  MAX_TIER,
  NEW_WEAPON_COST,
  WEAPON_FAMILIES,
  evolveCost,
  gradeOf,
  tierName,
  totalCostToMax,
  type WeaponFamily,
} from './weapons'

// 무기고: 가진 무기를 고르고, 도토리를 써서 한 단계씩 진화시킨다.

export function ArmoryButton({ className = '' }: { className?: string }) {
  const open = useVillage((s) => s.openArmory)
  const avatar = useVillage((s) => s.avatar)
  const label =
    avatar.weapon && WEAPON_FAMILIES.includes(avatar.weapon as WeaponFamily) ? tierName(avatar.weapon as WeaponFamily, avatar.wt) : '무기'
  return (
    <button type="button" className={`armory-btn ${className}`} onClick={open}>
      ⚔️ {label}
    </button>
  )
}

export function ArmoryPanel() {
  const isOpen = useVillage((s) => s.armoryOpen)
  const close = useVillage((s) => s.closeArmory)
  const weapons = useVillage((s) => s.weapons)
  const avatar = useVillage((s) => s.avatar)
  const coins = useVillage((s) => s.coins)
  const fx = useVillage((s) => s.evolveFx)
  const equip = useVillage((s) => s.equipWeapon)
  const buy = useVillage((s) => s.buyWeapon)
  const evolve = useVillage((s) => s.evolveWeapon)
  const houseLv = useVillage((s) => s.items.find((i) => i.type === 'house')?.level ?? 1)

  const [fam, setFam] = useState<WeaponFamily>('sword')
  const [peek, setPeek] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [flash, setFlash] = useState<{ name: string; tier: number } | null>(null)

  // 처음 열 때는 지금 들고 있는 무기 종류를 보여 준다
  useEffect(() => {
    if (isOpen && avatar.weapon && WEAPON_FAMILIES.includes(avatar.weapon as WeaponFamily)) setFam(avatar.weapon as WeaponFamily)
    setPeek(false)
    setConfirm(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])
  useEffect(() => {
    setPeek(false)
    setConfirm(false)
  }, [fam])

  // 진화하면 화려한 장면 + 소리
  useEffect(() => {
    if (!fx) return
    setFlash({ name: tierName(fx.family as WeaponFamily, fx.tier), tier: fx.tier })
    if (fx.tier >= 4) sfxBig()
    else sfxSuccess()
    setPeek(false)
    setConfirm(false)
    const t = setTimeout(() => setFlash(null), 2600)
    return () => clearTimeout(t)
  }, [fx])

  if (!isOpen) return null

  const tier = weapons[fam] ?? 0
  const owned = tier > 0
  const next = owned ? evolveCost(tier) : null
  const maxed = owned && tier >= MAX_TIER
  const equipped = avatar.weapon === fam
  const shownTier = !owned ? 1 : peek && next != null ? tier + 1 : tier
  const preview = { ...avatar, ride: null, weapon: fam, wt: shownTier }
  const grade = gradeOf(shownTier)

  return (
    <div className="farm-overlay" onPointerDown={(e) => e.target === e.currentTarget && close()}>
      <div className="farm-card armory-card">
        <button type="button" className="farm-x" onClick={close} aria-label="닫기">
          ✕
        </button>
        <h3>⚔️ 무기고</h3>

        <div className="armory-stage">
          <div className="armory-preview" style={{ boxShadow: `inset 0 0 40px ${grade.color}55` }}>
            <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0.9, 4.3], fov: 40 }} gl={{ preserveDrawingBuffer: false }}>
              <ambientLight intensity={0.85} />
              <directionalLight position={[3, 5, 4]} intensity={1.1} color="#fff2da" />
              <directionalLight position={[-3, 2, -2]} intensity={0.3} color="#bcd9ff" />
              <PreviewCharacter avatar={preview} />
            </Canvas>
            {flash && (
              <div className="armory-flash" key={fx?.at}>
                <div className="armory-burst" />
                <b>✨ 진화! ✨</b>
                <span>{flash.name}</span>
                <small style={{ color: gradeOf(flash.tier).color }}>{gradeOf(flash.tier).name} 등급</small>
              </div>
            )}
          </div>
        </div>

        <div className="armory-tabs">
          {WEAPON_FAMILIES.map((f) => (
            <button key={f} type="button" className={`${fam === f ? 'on' : ''}${weapons[f] ? ' has' : ''}`} onClick={() => setFam(f)}>
              <span>{FAMILY_EMOJI[f]}</span>
              <small>{FAMILY_LABEL[f]}</small>
              {weapons[f] ? <i>{weapons[f]}단계</i> : <i className="no">{houseLv < FAMILY_HOUSE[f] ? `🔒집${FAMILY_HOUSE[f]}` : '잠김'}</i>}
            </button>
          ))}
        </div>

        <div className="armory-now">
          <span className="armory-grade" style={{ background: grade.color }}>
            {grade.name}
          </span>
          <b>{tierName(fam, shownTier)}</b>
          {peek && <em>다음 단계 미리보기 👀</em>}
        </div>

        <ol className="armory-ladder">
          {Array.from({ length: MAX_TIER }, (_, i) => {
            const t = i + 1
            const state = !owned ? (t === 1 ? 'next' : 'locked') : t < tier ? 'done' : t === tier ? 'cur' : t === tier + 1 ? 'next' : 'locked'
            const cost = t === 1 ? NEW_WEAPON_COST : EVOLVE_COST[t - 2]
            return (
              <li key={t} className={state}>
                <span className="n">{state === 'done' ? '✓' : t}</span>
                <span className="nm">{tierName(fam, t)}</span>
                <span className="gd" style={{ color: gradeOf(t).color }}>
                  {gradeOf(t).name}
                </span>
                <span className="co">{state === 'done' || state === 'cur' ? '' : `🌰 ${cost.toLocaleString()}`}</span>
              </li>
            )
          })}
        </ol>
        <p className="armory-note">한 종류를 끝까지 키우려면 도토리가 모두 {totalCostToMax().toLocaleString()}개 필요해요. 천천히 모아서 키워 봐요!</p>

        {confirm && owned && next != null && (
          <div className="armory-confirm">
            <div>
              <small>정말 진화시킬까요? 👀 도토리는 돌려받을 수 없어요</small>
              <b>
                ‘{tierName(fam, tier + 1)}’으로 진화 <em>🌰 {next.toLocaleString()}</em>
              </b>
              {coins < next && <small className="poor">도토리가 {(next - coins).toLocaleString()}개 모자라요</small>}
            </div>
            <div className="armory-confirm-btns">
              <button
                type="button"
                className="go"
                disabled={coins < next}
                onClick={() => {
                  evolve(fam)
                }}
              >
                진화!
              </button>
              <button type="button" onClick={() => setConfirm(false)}>
                아직이요
              </button>
            </div>
          </div>
        )}

        <div className="armory-btns">
          {!owned ? (
            <button type="button" className="primary" disabled={houseLv < FAMILY_HOUSE[fam] || coins < NEW_WEAPON_COST} onClick={() => buy(fam)}>
              {houseLv < FAMILY_HOUSE[fam]
                ? `🔒 집이 ${FAMILY_HOUSE[fam]}단계가 되면 얻을 수 있어요`
                : coins < NEW_WEAPON_COST
                  ? `도토리 ${NEW_WEAPON_COST - coins}개 모자라요`
                  : `🌰 ${NEW_WEAPON_COST} 으로 얻기`}
            </button>
          ) : (
            <>
              {next != null && (
                <>
                  <button type="button" onClick={() => setPeek((p) => !p)}>
                    {peek ? '지금 모습' : '다음 단계 보기 👀'}
                  </button>
                  <button type="button" className="primary" onClick={() => setConfirm(true)}>
                    진화시키기 · 🌰 {next.toLocaleString()}
                  </button>
                </>
              )}
              {maxed && <span className="armory-max">🏆 최고 단계예요!</span>}
              <button type="button" onClick={() => equip(equipped ? null : fam)}>
                {equipped ? '내려놓기' : '들기'}
              </button>
            </>
          )}
        </div>
        <p className="armory-coins">내 도토리 🌰 {coins.toLocaleString()}</p>
      </div>
    </div>
  )
}

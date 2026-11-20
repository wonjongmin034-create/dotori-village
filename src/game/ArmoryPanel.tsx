import { useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { useVillage } from './store'
import { serverNow } from './serverClock'
import { PreviewCharacter } from './WardrobePanel'
import { sfxBig, sfxSuccess } from './sfx'
import {
  EVOLVE_COST,
  FAMILY_EMOJI,
  FAMILY_LABEL,
  MAX_TIER,
  WEAPON_FAMILIES,
  evolveCost,
  gradeOf,
  tierName,
  totalCostToMax,
  type WeaponFamily,
} from './weapons'
import { JOBS, JOB_CHANGE_MS, JOB_MAP, carriedTier, jobChecks, jobLabel } from './jobs'

// 무기고: 가진 무기를 고르고, 도토리를 써서 한 단계씩 진화시킨다.
// 처음에는 검으로 시작하고, 조건을 채우면 1차 전직으로 직업 무기를 얻는다 (jobs.ts).

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
  const evolve = useVillage((s) => s.evolveWeapon)
  const chooseJob = useVillage((s) => s.chooseJob)
  const job = useVillage((s) => s.job)
  const bossCleared = useVillage((s) => s.bossCleared)
  const petSt = useVillage((s) => s.pet?.st ?? 0)
  const houseLv = useVillage((s) => s.items.find((i) => i.type === 'house')?.level ?? 1)

  const [fam, setFam] = useState<WeaponFamily>('sword')
  const [jobView, setJobView] = useState(false) // 전직 화면
  const [pickJob, setPickJob] = useState<WeaponFamily | null>(null) // 고르려는 직업 (확인 단계)
  const [peek, setPeek] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [flash, setFlash] = useState<{ name: string; tier: number; job?: boolean } | null>(null)

  // 처음 열 때는 지금 들고 있는 무기 종류를 보여 준다
  useEffect(() => {
    if (isOpen && avatar.weapon && WEAPON_FAMILIES.includes(avatar.weapon as WeaponFamily) && weapons[avatar.weapon]) setFam(avatar.weapon as WeaponFamily)
    else if (isOpen) setFam((WEAPON_FAMILIES.find((f) => weapons[f]) ?? 'sword') as WeaponFamily)
    setPeek(false)
    setConfirm(false)
    setJobView(false)
    setPickJob(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])
  useEffect(() => {
    setPeek(false)
    setConfirm(false)
  }, [fam])

  // 진화하면 화려한 장면 + 소리
  useEffect(() => {
    if (!fx) return
    setFlash({ name: tierName(fx.family as WeaponFamily, fx.tier), tier: fx.tier, job: fx.job })
    if (fx.tier >= 4) sfxBig()
    else sfxSuccess()
    setPeek(false)
    setConfirm(false)
    const t = setTimeout(() => setFlash(null), 2600)
    return () => clearTimeout(t)
  }, [fx])

  if (!isOpen) return null
  const owned_ = WEAPON_FAMILIES.filter((f) => weapons[f])
  const checks = jobChecks(bossCleared, houseLv, petSt)
  const ready = checks.every((c) => c.ok)
  const changeLeft = job ? job.at + JOB_CHANGE_MS - serverNow() : 0
  const carry = carriedTier(weapons)

  const tier = weapons[fam] ?? 0
  const owned = tier > 0
  const next = owned ? evolveCost(tier) : null
  const maxed = owned && tier >= MAX_TIER
  const equipped = avatar.weapon === fam
  const shownTier = !owned ? 1 : peek && next != null ? tier + 1 : tier
  const preview = jobView && pickJob ? { ...avatar, ride: null, weapon: pickJob, wt: carry } : { ...avatar, ride: null, weapon: fam, wt: shownTier }
  const grade = gradeOf(shownTier)

  return (
    <div className="farm-overlay" onPointerDown={(e) => e.target === e.currentTarget && close()}>
      <div className="farm-card armory-card">
        <button type="button" className="farm-x" onClick={close} aria-label="닫기">
          ✕
        </button>
        <h3>
          ⚔️ 무기고 <small className="job-tag">{jobLabel(job)}</small>
        </h3>

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
                <b>{flash.job ? '⭐ 전직! ⭐' : '✨ 진화! ✨'}</b>
                <span>{flash.name}</span>
                <small style={{ color: gradeOf(flash.tier).color }}>{gradeOf(flash.tier).name} 등급</small>
              </div>
            )}
          </div>
        </div>

        {jobView && (
          <div className="job-box">
            <b>{job ? '🔁 직업 바꾸기' : '⭐ 1차 전직'}</b>
            {!job && (
              <>
                <p className="farm-note">
                  조건을 모두 채우면 직업을 골라 그 직업의 무기를 얻어요. 지금까지 키운 무기 중 가장 높은 단계(<b>{carry}단계</b>)로 받아요!
                </p>
                <ul className="job-checks">
                  {checks.map((c) => (
                    <li key={c.label} className={c.ok ? 'ok' : ''}>
                      {c.ok ? '✅' : '⬜'} {c.label} <small>({c.now})</small>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {job && (
              <p className="farm-note">
                직업은 한 달에 한 번 바꿀 수 있어요. 무기 단계(<b>{carry}단계</b>)는 그대로 새 직업 무기로 옮겨 가요.
                {changeLeft > 0 && <b> · {Math.ceil(changeLeft / 86_400_000)}일 뒤에 바꿀 수 있어요</b>}
              </p>
            )}
            <div className="job-grid">
              {JOBS.map((j) => (
                <button
                  key={j.f}
                  type="button"
                  className={`${pickJob === j.f ? 'on' : ''}${job?.f === j.f ? ' cur' : ''}`}
                  disabled={job ? job.f === j.f || changeLeft > 0 : !ready}
                  onClick={() => setPickJob(j.f)}
                >
                  <span>{j.emoji}</span>
                  <b>{j.label}</b>
                  <small>{FAMILY_LABEL[j.f]}</small>
                </button>
              ))}
            </div>
            {pickJob && (
              <div className="armory-confirm">
                <div>
                  <small>{JOB_MAP[pickJob].desc}</small>
                  <b>
                    {JOB_MAP[pickJob].label}(으)로 {job ? '바꿀까요?' : '전직할까요?'} → ‘{tierName(pickJob, carry)}’
                  </b>
                  <small>{job ? '한 달 동안 다시 바꿀 수 없어요' : '전직하면 다른 무기는 사라지고 이 무기 하나만 키워요'}</small>
                </div>
                <div className="armory-confirm-btns">
                  <button
                    type="button"
                    className="go"
                    onClick={() => {
                      chooseJob(pickJob)
                      setFam(pickJob)
                      setPickJob(null)
                      setJobView(false)
                    }}
                  >
                    {job ? '바꾸기' : '전직!'}
                  </button>
                  <button type="button" onClick={() => setPickJob(null)}>
                    아직이요
                  </button>
                </div>
              </div>
            )}
            <button type="button" className="job-back" onClick={() => setJobView(false)}>
              ← 무기로 돌아가기
            </button>
          </div>
        )}

        {!jobView && (
          <>
          <button type="button" className={`job-open${!job && ready ? ' ready' : ''}`} onClick={() => setJobView(true)}>
            {job ? '🔁 직업 바꾸기 (한 달에 한 번)' : ready ? '⭐ 1차 전직할 수 있어요!' : `⭐ 1차 전직 조건 보기 (${checks.filter((c) => c.ok).length}/${checks.length})`}
          </button>

        <div className="armory-tabs">
          {owned_.map((f) => (
            <button key={f} type="button" className={`${fam === f ? 'on' : ''}${weapons[f] ? ' has' : ''}`} onClick={() => setFam(f)}>
              <span>{FAMILY_EMOJI[f]}</span>
              <small>{FAMILY_LABEL[f]}</small>
              <i>{weapons[f]}단계</i>
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
            const cost = t === 1 ? 0 : EVOLVE_COST[t - 2]
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
            <span className="armory-max">⭐ 1차 전직을 하면 직업 무기를 얻어요</span>
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
          </>
        )}
        <p className="armory-coins">내 도토리 🌰 {coins.toLocaleString()}</p>
      </div>
    </div>
  )
}

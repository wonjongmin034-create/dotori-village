import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useVillage } from './store'
import { PetModel } from './PetModel'
import { sfxBig, sfxFail, sfxSuccess } from './sfx'
import { dateKey } from './lunch'
import {
  EVOLVE_CHANCE,
  EVOLVE_COST_PET,
  EVOLVE_HOUSE,
  FEED_NEED,
  FEED_NEED_SCORE,
  MAX_STAGE,
  PET_SPECIES,
  PITY_STEP,
  SPECIES_MAP,
  STAGE_NAMES,
  canEvolve,
  evolveChance,
  stageLabel,
} from './pets'

// 펫 창: 처음에 알을 고르고, 먹이를 주고, 진화시키고, 보내줄 수 있다.

export function PetButton({ className = '' }: { className?: string }) {
  const open = useVillage((s) => s.openPet)
  const pet = useVillage((s) => s.pet)
  const ready = useVillage((s) => {
    const p = s.pet
    if (!p || p.st >= MAX_STAGE) return false
    const house = s.items.find((i) => i.type === 'house')
    return p.fed >= FEED_NEED[p.st] && (house?.level ?? 1) >= EVOLVE_HOUSE[p.st]
  })
  const sp = pet ? SPECIES_MAP[pet.sp] : null
  return (
    <button type="button" className={`pet-btn ${className}${ready ? ' ready' : ''}`} onClick={open}>
      {sp ? (pet!.st === 0 ? '🥚' : sp.emoji) : '🥚'} {pet ? stageLabel(pet.sp, pet.st) : '펫 키우기'}
      {ready && <i>진화!</i>}
    </button>
  )
}

function Spin({ sp, st }: { sp: string; st: number }) {
  const g = useRef<THREE.Group>(null)
  useFrame((s) => {
    if (g.current) {
      g.current.rotation.y = s.clock.elapsedTime * 0.6
      g.current.position.y = st === 0 ? Math.abs(Math.sin(s.clock.elapsedTime * 2.2)) * 0.03 : 0
    }
  })
  // 단계가 달라도 비슷한 크기로 보이게 키운다
  const k = [1.9, 2.5, 2.1, 1.7, 1.5][st] ?? 1.6
  return (
    <group ref={g} position={[0, -0.55, 0]} scale={[k, k, k]}>
      <PetModel sp={sp} st={st} />
    </group>
  )
}

function Stage({ sp, st }: { sp: string; st: number }) {
  return (
    <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0.55, 3.6], fov: 38 }} gl={{ preserveDrawingBuffer: false }}>
      <ambientLight intensity={0.9} />
      <directionalLight position={[3, 5, 4]} intensity={1.1} color="#fff2da" />
      <directionalLight position={[-3, 2, -2]} intensity={0.3} color="#bcd9ff" />
      <Spin sp={sp} st={st} />
    </Canvas>
  )
}

export function PetPanel() {
  const isOpen = useVillage((s) => s.petOpen)
  const close = useVillage((s) => s.closePet)
  const pet = useVillage((s) => s.pet)
  const coins = useVillage((s) => s.coins)
  const fx = useVillage((s) => s.petFx)
  const daily = useVillage((s) => s.daily)
  const fedDay = useVillage((s) => s.items.find((i) => i.type === 'house')?.petFed)
  const houseLv = useVillage((s) => s.items.find((i) => i.type === 'house')?.level ?? 1)
  const choose = useVillage((s) => s.choosePet)
  const feed = useVillage((s) => s.feedPet)
  const evolve = useVillage((s) => s.evolvePet)
  const release = useVillage((s) => s.releasePet)

  const [pick, setPick] = useState('dog')
  const [peek, setPeek] = useState(false)
  const [confirm, setConfirm] = useState<'evolve' | 'release' | null>(null)
  const [flash, setFlash] = useState<{ ok: boolean; text: string; at: number } | null>(null)

  useEffect(() => {
    setPeek(false)
    setConfirm(null)
  }, [isOpen])

  // 진화 결과 장면 + 소리
  useEffect(() => {
    if (!fx || !pet) return
    setFlash({ ok: fx.ok, text: fx.ok ? stageLabel(pet.sp, fx.st) : '진화 실패… 😢', at: fx.at })
    if (fx.ok) {
      if (fx.st >= MAX_STAGE) sfxBig()
      else sfxSuccess()
    } else sfxFail()
    setPeek(false)
    setConfirm(null)
    const t = setTimeout(() => setFlash(null), 2600)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fx])

  if (!isOpen) return null

  const today = dateKey()
  const score = daily && daily.day === today ? daily.score : 0

  // ── 펫이 없을 때: 알 고르기 ──
  if (!pet) {
    const sp = SPECIES_MAP[pick]
    return (
      <div className="farm-overlay" onPointerDown={(e) => e.target === e.currentTarget && close()}>
        <div className="farm-card armory-card">
          <button type="button" className="farm-x" onClick={close} aria-label="닫기">
            ✕
          </button>
          <h3>🥚 어떤 펫을 키울까요?</h3>
          <div className="armory-preview pet-preview">
            <Stage sp={pick} st={0} />
          </div>
          <div className="pet-pick">
            {PET_SPECIES.map((s) => (
              <button key={s.id} type="button" className={pick === s.id ? 'on' : ''} onClick={() => setPick(s.id)}>
                <span>{s.emoji}</span>
                <small>{s.label}</small>
              </button>
            ))}
          </div>
          <p className="pet-blurb">
            <b>{sp.label}</b> — {sp.blurb}
          </p>
          <p className="armory-note">
            펫은 한 마리만 키울 수 있어요. 다른 펫을 키우고 싶으면 키우던 펫을 떠나보내야 하고, 그러면 처음(알)부터 다시 시작해요. 신중하게 골라 봐요!
          </p>
          <div className="armory-btns">
            <button type="button" className="primary" onClick={() => choose(pick)}>
              🥚 {sp.label} 알 키우기
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── 펫이 있을 때 ──
  const sp = SPECIES_MAP[pet.sp]
  const maxed = pet.st >= MAX_STAGE
  const need = maxed ? 0 : FEED_NEED[pet.st]
  const fedToday = fedDay === today
  const enoughScore = score >= FEED_NEED_SCORE
  const full = !maxed && pet.fed >= need
  const canFeed = !maxed && !fedToday && enoughScore && !full
  const chk = canEvolve(pet, houseLv)
  const cost = maxed ? 0 : EVOLVE_COST_PET[pet.st]
  const chance = Math.round(evolveChance(pet) * 100)
  const shownSt = peek && !maxed ? pet.st + 1 : pet.st

  let feedLabel = '🍖 먹이 주기'
  if (maxed) feedLabel = '🏆 다 자랐어요'
  else if (full) feedLabel = '🍖 배가 불러요'
  else if (fedToday) feedLabel = '🍖 오늘은 먹였어요'
  else if (!enoughScore) feedLabel = `🔒 오늘의 학습 ${score}/${FEED_NEED_SCORE}문제`

  return (
    <div className="farm-overlay" onPointerDown={(e) => e.target === e.currentTarget && close()}>
      <div className="farm-card armory-card">
        <button type="button" className="farm-x" onClick={close} aria-label="닫기">
          ✕
        </button>
        <h3>
          {sp.emoji} 내 펫
        </h3>

        <div className="armory-preview pet-preview">
          <Stage sp={pet.sp} st={shownSt} />
          {flash && (
            <div className={`armory-flash${flash.ok ? '' : ' pet-fail'}`} key={flash.at}>
              {flash.ok && <div className="armory-burst" />}
              <b>{flash.ok ? '✨ 진화! ✨' : '앗!'}</b>
              <span>{flash.text}</span>
              {!flash.ok && <small style={{ color: '#6a7a6e' }}>다음엔 성공 확률이 {PITY_STEP * 100}%p 올라가요</small>}
            </div>
          )}
        </div>

        <div className="armory-now">
          <span className="armory-grade" style={{ background: maxed ? '#e0a21a' : '#5aa867' }}>
            {STAGE_NAMES[pet.st]}
          </span>
          <b>{stageLabel(pet.sp, shownSt)}</b>
          {peek && <em>다음 단계 미리보기 👀</em>}
        </div>

        {!maxed && (
          <div className="pet-feed">
            <div className="pet-bar">
              <i style={{ width: `${Math.min(100, (pet.fed / need) * 100)}%` }} />
            </div>
            <small>
              먹이 {pet.fed}/{need}
              {full ? ' · 진화할 준비 완료!' : ''}
            </small>
          </div>
        )}

        <ol className="armory-ladder pet-ladder">
          {Array.from({ length: MAX_STAGE + 1 }, (_, t) => {
            const state = t < pet.st ? 'done' : t === pet.st ? 'cur' : t === pet.st + 1 ? 'next' : 'locked'
            return (
              <li key={t} className={state}>
                <span className="n">{state === 'done' ? '✓' : t + 1}</span>
                <span className="nm">{stageLabel(pet.sp, t)}</span>
                <span className="gd">{t === 0 ? '' : `집 ${EVOLVE_HOUSE[t - 1]}단계`}</span>
                <span className="co">
                  {t === 0 || state === 'done' || state === 'cur' ? '' : `🌰${EVOLVE_COST_PET[t - 1]} · ${Math.round(EVOLVE_CHANCE[t - 1] * 100)}%`}
                </span>
              </li>
            )
          })}
        </ol>
        <p className="armory-note">
          먹이는 하루에 한 번, <b>오늘의 학습을 {FEED_NEED_SCORE}문제 이상 맞힌 날</b>에만 줄 수 있어요. 진화는 도토리를 내고 확률로 성공해요. 실패해도 펫은 그대로고, 다음엔 확률이 조금 올라가요. 🐾 아동부터는 보스를 잡을 때 공격이 조금 세져요 (아동 +5% · 청소년 +10% · 성체 +15%).
        </p>

        {confirm === 'evolve' && !maxed && (
          <div className="armory-confirm">
            <div>
              <small>진화는 실패할 수도 있어요. 도토리는 돌려받지 못해요</small>
              <b>
                ‘{stageLabel(pet.sp, pet.st + 1)}’ 진화 <em>🌰 {cost.toLocaleString()}</em>
              </b>
              <small>
                성공 확률 <b style={{ display: 'inline', fontSize: 'inherit' }}>{chance}%</b>
                {pet.pity > 0 ? ` (실패 ${pet.pity}번 → +${Math.round(PITY_STEP * pet.pity * 100)}%p 보너스)` : ''}
              </small>
              {coins < cost && <small className="poor">도토리가 {(cost - coins).toLocaleString()}개 모자라요</small>}
            </div>
            <div className="armory-confirm-btns">
              <button type="button" className="go" disabled={coins < cost} onClick={() => evolve()}>
                진화!
              </button>
              <button type="button" onClick={() => setConfirm(null)}>
                아직이요
              </button>
            </div>
          </div>
        )}
        {confirm === 'release' && (
          <div className="armory-confirm pet-release">
            <div>
              <small>한 번 보내면 다시 만날 수 없어요 😢</small>
              <b>{stageLabel(pet.sp, pet.st)}을(를) 떠나보낼까요?</b>
              <small>새 알은 처음부터(알) 다시 키워야 해요</small>
            </div>
            <div className="armory-confirm-btns">
              <button type="button" className="go bye" onClick={() => release()}>
                보내기
              </button>
              <button type="button" onClick={() => setConfirm(null)}>
                그만둘래요
              </button>
            </div>
          </div>
        )}

        <div className="armory-btns">
          <button type="button" className={canFeed ? 'primary' : ''} disabled={!canFeed} onClick={() => feed()}>
            {feedLabel}
          </button>
          {!maxed && (
            <>
              <button type="button" onClick={() => setPeek((p) => !p)}>
                {peek ? '지금 모습' : '다음 단계 보기 👀'}
              </button>
              <button
                type="button"
                className={chk.ok ? 'primary evo' : ''}
                disabled={!chk.ok}
                onClick={() => setConfirm('evolve')}
              >
                {chk.ok ? `✨ 진화하기 · 🌰 ${cost.toLocaleString()} · ${chance}%` : chk.why}
              </button>
            </>
          )}
          <button type="button" className="pet-bye" onClick={() => setConfirm('release')}>
            보내기
          </button>
        </div>
        <p className="armory-coins">내 도토리 🌰 {coins.toLocaleString()}</p>
      </div>
    </div>
  )
}

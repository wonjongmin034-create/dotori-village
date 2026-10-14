import { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useVillage } from './store'
import { Character, type CharacterRefs } from './Character'
import {
  WARDROBE,
  SLOTS,
  SLOT_LABEL,
  COLOR_SLOTS,
  itemsForSlot,
  findItem,
  ownsItem,
  type Slot,
} from './wardrobe'
import type { Avatar } from './avatar'
import { RIDES, rideOf, applyRidePose } from './rides'

function PreviewCharacter({ avatar }: { avatar: Avatar }) {
  const spin = useRef<THREE.Group>(null)
  const refs: CharacterRefs = {
    bob: useRef<THREE.Group>(null),
    head: useRef<THREE.Group>(null),
    body: useRef<THREE.Group>(null),
    armL: useRef<THREE.Group>(null),
    armR: useRef<THREE.Group>(null),
    legL: useRef<THREE.Group>(null),
    legR: useRef<THREE.Group>(null),
    eyeL: useRef<THREE.Group>(null),
    eyeR: useRef<THREE.Group>(null),
  }
  const blink = useRef({ t: 2.5, on: 0 })

  useFrame((s, dt) => {
    const el = s.clock.elapsedTime
    if (spin.current) spin.current.rotation.y = el * 0.5
    if (refs.bob.current) refs.bob.current.position.y = Math.sin(el * 2) * 0.02
    if (refs.body.current) refs.body.current.scale.y = 1 + Math.sin(el * 2) * 0.03
    applyRidePose(refs, rideOf(avatar.ride), false, 0)
    blink.current.t -= dt
    if (blink.current.t <= 0 && blink.current.on === 0) {
      blink.current.on = 0.14
      blink.current.t = 2 + Math.random() * 3
    }
    if (blink.current.on > 0) blink.current.on = Math.max(0, blink.current.on - dt)
    const y = blink.current.on > 0 ? 0.08 : 1
    if (refs.eyeL.current) refs.eyeL.current.scale.y += (y - refs.eyeL.current.scale.y) * 0.5
    if (refs.eyeR.current) refs.eyeR.current.scale.y += (y - refs.eyeR.current.scale.y) * 0.5
  })

  return (
    <group ref={spin} position={[0, avatar.ride ? -0.85 : -0.75, 0]} scale={avatar.ride ? 0.8 : 1}>
      <Character avatar={avatar} refs={refs} />
    </group>
  )
}

export function WardrobePanel() {
  const open = useVillage((s) => s.items.find((i) => i.key === s.activeFarm)?.type === 'wardrobe')
  const avatar = useVillage((s) => s.avatar)
  const owned = useVillage((s) => s.wardrobe)
  const coins = useVillage((s) => s.coins)
  const close = useVillage((s) => s.closeFarm)
  const choose = useVillage((s) => s.chooseWardrobe)

  const [slot, setSlot] = useState<Slot>('hair')
  // 아직 안 산 옷은 먼저 입어 보고, 마음에 들면 산다
  const [trial, setTrial] = useState<{ slot: Slot; id: string } | null>(null)

  if (!open) return null

  const trialItem = trial ? findItem(trial.slot, trial.id) : undefined
  const nullable = (sl: Slot) => sl === 'hat' || sl === 'acc' || sl === 'costume' || sl === 'ride'
  const shown: Avatar =
    trial && trialItem
      ? { ...avatar, [trial.slot]: nullable(trial.slot) && trial.id === 'none' ? null : trial.id }
      : avatar
  const canBuy = !!trialItem && coins >= trialItem.cost

  const isColor = COLOR_SLOTS.includes(slot)
  const current = (avatar[slot] as string | null) ?? 'none'

  return (
    <div className="farm-overlay" onPointerDown={(e) => e.target === e.currentTarget && close()}>
      <div className="farm-card wardrobe-card">
        <button type="button" className="farm-x" onClick={close} aria-label="닫기">
          ✕
        </button>
        <h3>👕 옷장</h3>

        <div className="wd-preview">
          <Canvas
            dpr={[1, 1.5]}
            camera={{ position: [0, 0.6, 4.2], fov: 40 }}
            gl={{ preserveDrawingBuffer: false }}
          >
            <ambientLight intensity={0.8} />
            <directionalLight position={[3, 5, 4]} intensity={1.1} color="#fff2da" />
            <directionalLight position={[-3, 2, -2]} intensity={0.3} color="#bcd9ff" />
            <PreviewCharacter avatar={shown} />
          </Canvas>
        </div>

        {trial && trialItem && (
          <div className="wd-trial">
            <span>
              <b>{trialItem.label}</b> 입어 보는 중 · 🌰 {trialItem.cost}
            </span>
            <button
              type="button"
              className="wd-buy"
              disabled={!canBuy}
              onClick={() => {
                choose(trial.slot, trial.id)
                setTrial(null)
              }}
            >
              {canBuy ? '사기' : `도토리 ${trialItem.cost - coins}개 부족`}
            </button>
            <button type="button" className="wd-cancel" onClick={() => setTrial(null)}>
              취소
            </button>
          </div>
        )}

        <div className="wd-tabs">
          {SLOTS.map((sl) => (
            <button
              key={sl}
              type="button"
              className={slot === sl ? 'on' : ''}
              onClick={() => setSlot(sl)}
            >
              {SLOT_LABEL[sl]}
            </button>
          ))}
        </div>

        <div className={isColor ? 'wd-swatches' : 'wd-grid'}>
          {itemsForSlot(slot).map((it) => {
            const has = ownsItem(it, owned)
            const equipped = current === it.id
            const cannotAfford = !has && coins < it.cost
            const trying = trial?.slot === slot && trial.id === it.id
            return (
              <button
                key={it.id}
                type="button"
                className={`wd-opt ${equipped ? 'equipped' : ''} ${cannotAfford ? 'poor' : ''} ${trying ? 'trying' : ''}`}
                onClick={() => {
                  if (has) {
                    choose(slot, it.id)
                    setTrial(null)
                  } else setTrial({ slot, id: it.id })
                }}
              >
                {isColor ? (
                  <span className="wd-color" style={{ background: it.swatch }} />
                ) : (
                  <span className="wd-name">
                    {it.label}
                    {slot === 'ride' && RIDES[it.id] && (
                      <small className="wd-sub">
                        ⚡×{RIDES[it.id].speed}
                        {RIDES[it.id].jump > 1.15 ? ' · 높이뛰기' : ''}
                      </small>
                    )}
                  </span>
                )}
                <span className="wd-tag">
                  {equipped ? '착용중' : trying ? '입어보는 중' : has ? (it.cost === 0 ? '' : '보유') : `🌰${it.cost}`}
                </span>
              </button>
            )
          })}
        </div>

        <p className="wd-hint">
          기본 옷은 무료예요. 특별한 건 눌러서 먼저 입어 보고, 마음에 들면 도토리로 사요. 한 번 사면 계속 쓸 수 있어요. (전체 {WARDROBE.length}종)
        </p>
      </div>
    </div>
  )
}

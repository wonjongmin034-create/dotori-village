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
  ownsItem,
  type Slot,
} from './wardrobe'
import type { Avatar } from './avatar'

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
    <group ref={spin} position={[0, -0.75, 0]}>
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

  if (!open) return null

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
            camera={{ position: [0, 0.5, 3.4], fov: 40 }}
            gl={{ preserveDrawingBuffer: false }}
          >
            <ambientLight intensity={0.8} />
            <directionalLight position={[3, 5, 4]} intensity={1.1} color="#fff2da" />
            <directionalLight position={[-3, 2, -2]} intensity={0.3} color="#bcd9ff" />
            <PreviewCharacter avatar={avatar} />
          </Canvas>
        </div>

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
            return (
              <button
                key={it.id}
                type="button"
                className={`wd-opt ${equipped ? 'equipped' : ''} ${cannotAfford ? 'poor' : ''}`}
                onClick={() => choose(slot, it.id)}
              >
                {isColor ? (
                  <span className="wd-color" style={{ background: it.swatch }} />
                ) : (
                  <span className="wd-name">{it.label}</span>
                )}
                <span className="wd-tag">
                  {equipped ? '착용중' : has ? (it.cost === 0 ? '' : '보유') : `🌰${it.cost}`}
                </span>
              </button>
            )
          })}
        </div>

        <p className="wd-hint">
          기본 옷은 무료예요. 특별한 건 도토리로 사면 계속 쓸 수 있어요. (전체 {WARDROBE.length}종)
        </p>
      </div>
    </div>
  )
}

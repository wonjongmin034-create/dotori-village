import { memo } from 'react'
import { Toon, Glow, Shaped } from './wearKit'
import { MAX_STAGE, SPECIES_MAP, type PetSpecies } from './pets'

// 펫 3D 모델 — +z 방향(앞)을 보고, 발이 y=0 에 닿는다. 어른(성체) 키는 약 0.95.
// 단계가 낮을수록 작고 머리가 크다(아기). 종류마다 귀·꼬리·무늬가 다르다.

type V3 = [number, number, number]

// 타원체 (구를 늘려서)
function Ell({ p, r, c, rot, e, ei = 0.4 }: { p: V3; r: V3; c: string; rot?: V3; e?: string; ei?: number }) {
  return (
    <mesh position={p} scale={r} rotation={rot}>
      <sphereGeometry args={[1, 18, 14]} />
      <Toon color={c} emissive={e} ei={ei} />
    </mesh>
  )
}
function Cone({ p, r, h, c, rot }: { p: V3; r: number; h: number; c: string; rot?: V3 }) {
  return (
    <mesh position={p} rotation={rot}>
      <coneGeometry args={[r, h, 4]} />
      <Toon color={c} />
    </mesh>
  )
}

const SCALE = [1, 0.42, 0.58, 0.78, 1]
const HEAD = [1, 1.28, 1.12, 1.02, 0.96] // 어릴수록 머리가 크다

// ── 알 ──
function Egg({ sp }: { sp: PetSpecies }) {
  const spots: [V3, number][] = [
    [[0.14, 0.2, 0.17], 0.07],
    [[-0.17, 0.32, 0.1], 0.06],
    [[0.05, 0.5, 0.18], 0.055],
    [[-0.08, 0.1, 0.22], 0.05],
    [[0.2, 0.42, -0.05], 0.05],
    [[-0.15, 0.5, -0.1], 0.045],
  ]
  return (
    <group>
      <Ell p={[0, 0.34, 0]} r={[0.26, 0.34, 0.26]} c={sp.egg} />
      {spots.map(([p, r], i) => {
        // 알 표면에 살짝 박힌 얼룩 (바깥쪽으로 납작하게)
        const len = Math.hypot(p[0], (p[1] - 0.34) / 1.3, p[2]) || 1
        const f = 0.255 / len
        return <Ell key={i} p={[p[0] * f, 0.34 + (p[1] - 0.34) * f * 1.3, p[2] * f]} r={[r, r, r * 0.45]} c={sp.spot} rot={[0, Math.atan2(p[0], p[2]), 0]} />
      })}
      <Ell p={[-0.08, 0.5, 0.17]} r={[0.05, 0.07, 0.03]} c="#ffffff" e="#ffffff" ei={0.5} />
    </group>
  )
}

// ── 종류별 귀 (머리 좌표계) ──
function Ears({ sp, st }: { sp: PetSpecies; st: number }) {
  const big = st >= 4 ? 1.15 : 1
  switch (sp.id) {
    case 'dog':
      return (
        <>
          {[-1, 1].map((s) => (
            <Ell key={s} p={[s * 0.205, 0.07, -0.02]} r={[0.07, 0.15 * big, 0.1]} c={sp.accent} rot={[0, 0, s * -0.35]} />
          ))}
        </>
      )
    case 'cat':
      return (
        <>
          {[-1, 1].map((s) => (
            <group key={s} position={[s * 0.14, 0.22, 0]} rotation={[0, 0, s * -0.25]}>
              <Cone p={[0, 0, 0]} r={0.1 * big} h={0.2 * big} c={sp.body} rot={[0, Math.PI / 4, 0]} />
              <Cone p={[0, -0.01, 0.025]} r={0.06 * big} h={0.13 * big} c={sp.accent} rot={[0, Math.PI / 4, 0]} />
            </group>
          ))}
        </>
      )
    case 'rabbit':
      return (
        <>
          {[-1, 1].map((s) => (
            <group key={s} position={[s * 0.1, 0.3, -0.02]} rotation={[0.1, 0, s * -0.12]}>
              <Ell p={[0, 0, 0]} r={[0.065, 0.24 * big, 0.05]} c={sp.body} />
              <Ell p={[0, -0.01, 0.025]} r={[0.035, 0.18 * big, 0.025]} c={sp.accent} />
            </group>
          ))}
        </>
      )
    case 'fox':
      return (
        <>
          {[-1, 1].map((s) => (
            <group key={s} position={[s * 0.15, 0.22, -0.01]} rotation={[0, 0, s * -0.3]}>
              <Cone p={[0, 0, 0]} r={0.1 * big} h={0.24 * big} c={sp.body} rot={[0, Math.PI / 4, 0]} />
              <Cone p={[0, 0.07 * big, 0]} r={0.055 * big} h={0.1 * big} c={sp.accent} rot={[0, Math.PI / 4, 0]} />
            </group>
          ))}
        </>
      )
    case 'panda':
      return (
        <>
          {[-1, 1].map((s) => (
            <Ell key={s} p={[s * 0.17, 0.2, -0.02]} r={[0.09, 0.09, 0.05]} c={sp.accent} />
          ))}
        </>
      )
    default:
      // 용: 뿔 두 개 (자랄수록 길어진다)
      return (
        <>
          {[-1, 1].map((s) => (
            <Cone key={s} p={[s * 0.1, 0.27 + st * 0.012, -0.03]} r={0.04 + st * 0.008} h={0.1 + st * 0.045} c={sp.accent} rot={[-0.25, 0, s * -0.25]} />
          ))}
          {[-1, 1].map((s) => (
            <Ell key={`f${s}`} p={[s * 0.2, 0.05, -0.02]} r={[0.03, 0.07, 0.07]} c={sp.belly} rot={[0, 0, s * -0.3]} />
          ))}
        </>
      )
  }
}

// ── 종류별 꼬리 (몸 좌표계, 엉덩이 쪽) ──
function Tail({ sp, st }: { sp: PetSpecies; st: number }) {
  switch (sp.id) {
    case 'dog':
      return <Ell p={[0, 0.06, -0.08]} r={[0.06, 0.13, 0.06]} c={sp.body} rot={[0.9, 0, 0]} />
    case 'cat':
      return (
        <>
          <Ell p={[0, 0.12, -0.1]} r={[0.045, 0.2, 0.045]} c={sp.body} rot={[0.5, 0, 0]} />
          <Ell p={[0, 0.3, -0.19]} r={[0.05, 0.05, 0.05]} c={sp.accent} />
        </>
      )
    case 'rabbit':
      return <Ell p={[0, 0.02, -0.06]} r={[0.09, 0.09, 0.09]} c="#ffffff" />
    case 'fox': {
      const tails = st >= 4 ? [-0.5, 0, 0.5] : [0]
      return (
        <>
          {tails.map((a, i) => (
            <group key={i} rotation={[0, a, 0]}>
              <Ell p={[0, 0.07, -0.18]} r={[0.1, 0.1, 0.22]} c={sp.body} rot={[-0.5, 0, 0]} />
              <Ell p={[0, 0.2, -0.36]} r={[0.08, 0.08, 0.09]} c="#ffffff" />
            </group>
          ))}
        </>
      )
    }
    case 'panda':
      return <Ell p={[0, 0.02, -0.06]} r={[0.07, 0.07, 0.07]} c={sp.accent} />
    default:
      // 용: 길고 뾰족한 꼬리 + 끝의 불꽃
      return (
        <>
          <Ell p={[0, 0.0, -0.14]} r={[0.07, 0.07, 0.2]} c={sp.body} rot={[-0.35, 0, 0]} />
          <Cone p={[0, 0.09, -0.34]} r={0.06} h={0.16} c={sp.accent} rot={[-Math.PI / 2 - 0.4, 0, 0]} />
          {st >= 3 && (
            <mesh position={[0, 0.2, -0.43]} scale={st >= 4 ? 1.3 : 1}>
              <coneGeometry args={[0.05, 0.14, 8]} />
              <Glow color="#ffb347" />
            </mesh>
          )}
        </>
      )
  }
}

function Wings({ st, sp }: { st: number; sp: PetSpecies }) {
  if (st < 2) return null
  const k = [0, 0, 0.55, 0.8, 1.0][st]
  return (
    <>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.2, 0.42, -0.08]} rotation={[0, s * 0.7, s * 0.35]}>
          <Shaped kind="wing" size={0.42 * k} depth={0.025} color={sp.accent} position={[s * 0.14 * k, 0.05, 0]} scale={[s, 1, 1]} />
        </group>
      ))}
    </>
  )
}

function Creature({ sp, st }: { sp: PetSpecies; st: number }) {
  const hs = HEAD[st]
  const panda = sp.id === 'panda'
  const limb = panda ? sp.accent : sp.body
  return (
    <group>
      {/* 몸통과 배 */}
      <Ell p={[0, 0.29, -0.02]} r={[0.26, 0.24, 0.31]} c={sp.body} />
      <Ell p={[0, 0.26, 0.08]} r={[0.19, 0.18, 0.25]} c={sp.belly} />
      {/* 다리 */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <Ell p={[s * 0.14, 0.09, 0.17]} r={[0.075, 0.1, 0.085]} c={limb} />
          <Ell p={[s * 0.14, 0.09, -0.19]} r={[0.08, 0.1, 0.09]} c={limb} />
        </group>
      ))}
      <group position={[0, 0.3, -0.3]}>
        <Tail sp={sp} st={st} />
      </group>
      {sp.id === 'dragon' && <Wings st={st} sp={sp} />}
      {sp.id === 'dragon' && st >= 3 && (
        <>
          {[0.06, -0.08, -0.22].map((z, i) => (
            <Cone key={i} p={[0, 0.54 - i * 0.03, z]} r={0.045} h={0.1} c={sp.accent} rot={[0, Math.PI / 4, 0]} />
          ))}
        </>
      )}
      {st >= 3 && <Ell p={[0, 0.5, 0.1]} r={[0.2, 0.06, 0.2]} c={sp.accent} />}

      {/* 머리 */}
      <group position={[0, 0.62, 0.15]} scale={[hs, hs, hs]}>
        <Ell p={[0, 0, 0]} r={[0.25, 0.22, 0.23]} c={sp.body} />
        {panda &&
          [-1, 1].map((s) => (
            <Ell key={s} p={[s * 0.09, 0.03, 0.17]} r={[0.06, 0.075, 0.05]} c={sp.accent} rot={[0, 0, s * 0.45]} />
          ))}
        <Ears sp={sp} st={st} />
        {/* 주둥이 */}
        <Ell p={[0, -0.07, 0.17]} r={[sp.id === 'dragon' ? 0.1 : 0.11, 0.075, 0.085]} c={sp.belly} />
        <Ell p={[0, -0.035, 0.245]} r={[0.035, 0.026, 0.026]} c={sp.id === 'cat' || sp.id === 'rabbit' ? '#e7869a' : '#2b2323'} />
        {/* 눈 */}
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.09, 0.03, 0.195]}>
            <Ell p={[0, 0, 0]} r={[0.036, 0.044, 0.03]} c="#26211f" />
            <Ell p={[0.012 * s, 0.017, 0.022]} r={[0.013, 0.013, 0.01]} c="#ffffff" e="#ffffff" ei={0.6} />
          </group>
        ))}
        {/* 볼터치 */}
        {[-1, 1].map((s) => (
          <Ell key={s} p={[s * 0.15, -0.045, 0.16]} r={[0.04, 0.026, 0.02]} c="#ff9fb0" />
        ))}
      </group>

      {/* 성체: 머리 위 별 + 발밑 빛 고리 */}
      {st >= MAX_STAGE && (
        <>
          <Shaped kind="star" size={0.13} depth={0.04} color="#ffd34d" glow position={[0, 1.08, 0.1]} />
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
            <ringGeometry args={[0.42, 0.5, 28]} />
            <meshBasicMaterial color="#ffe58a" transparent opacity={0.65} depthWrite={false} />
          </mesh>
        </>
      )}
    </group>
  )
}

// 펫 하나 (종류 id + 단계). 알 단계는 어느 종류인지 색·무늬로만 구분한다.
export const PetModel = memo(function PetModel({ sp, st }: { sp: string; st: number }) {
  const def = SPECIES_MAP[sp]
  if (!def) return null
  const stage = Math.max(0, Math.min(MAX_STAGE, Math.round(st) || 0))
  const k = SCALE[stage]
  return (
    <group scale={[k, k, k]}>{stage === 0 ? <Egg sp={def} /> : <Creature sp={def} st={stage} />}</group>
  )
})

import type { RefObject } from 'react'
import * as THREE from 'three'
import { toonGradient } from './toon'
import type { Avatar } from './avatar'

export type CharacterRefs = {
  bob: RefObject<THREE.Group | null>
  head: RefObject<THREE.Group | null>
  body: RefObject<THREE.Group | null>
  armL: RefObject<THREE.Group | null>
  armR: RefObject<THREE.Group | null>
  legL: RefObject<THREE.Group | null>
  legR: RefObject<THREE.Group | null>
  eyeL: RefObject<THREE.Group | null>
  eyeR: RefObject<THREE.Group | null>
}

function Toon({ color }: { color: string }) {
  return <meshToonMaterial gradientMap={toonGradient} color={color} />
}

const WHITE = '#f4f4f4'
const LONG_SLEEVE = new Set(['longsleeve', 'knit', 'hoodie', 'jacket', 'dress', 'sailor', 'soccer'])

type Pal = { body: string; belly: string; paw: string }
const COSTUME: Record<string, Pal> = {
  dino: { body: '#6cbf5b', belly: '#c8e6a8', paw: '#4f9c43' },
  cat: { body: '#8a8f96', belly: '#e9e9ec', paw: '#6f747b' },
  bear: { body: '#a9764e', belly: '#e4c9a5', paw: '#8a5d3c' },
  robot: { body: '#b6bcc4', belly: '#8f97a1', paw: '#7c828b' },
  pumpkin: { body: '#e8842d', belly: '#f2a24e', paw: '#c96a1e' },
  space: { body: '#eef1f4', belly: '#d6dde3', paw: '#c2cad1' },
  frog: { body: '#5fb84f', belly: '#dff0c2', paw: '#4a9c3d' },
  shark: { body: '#7f96a8', belly: '#e6ecf0', paw: '#68808f' },
}

// ─────────────────────────── 머리 ───────────────────────────

function ShortBase({ color }: { color: string }) {
  return (
    <>
      <mesh position={[0, 0.14, -0.06]} scale={[1.05, 0.9, 1.05]}>
        <sphereGeometry args={[0.5, 22, 16, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
        <Toon color={color} />
      </mesh>
      <mesh position={[0, 0.02, -0.1]} scale={[1.05, 1, 0.9]}>
        <sphereGeometry args={[0.5, 22, 16, Math.PI * 0.35, Math.PI * 1.3, 0, Math.PI * 0.72]} />
        <Toon color={color} />
      </mesh>
    </>
  )
}

function Hair({ style, color }: { style: string; color: string }) {
  if (style === 'none') return null
  if (style === 'pigtails') {
    return (
      <group>
        <ShortBase color={color} />
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.5, -0.05, -0.05]}>
            <mesh>
              <sphereGeometry args={[0.14, 12, 10]} />
              <Toon color={color} />
            </mesh>
            <mesh position={[s * 0.02, -0.22, 0]} scale={[1, 1.6, 1]}>
              <capsuleGeometry args={[0.08, 0.2, 4, 8]} />
              <Toon color={color} />
            </mesh>
          </group>
        ))}
      </group>
    )
  }
  if (style === 'long') {
    return (
      <group>
        <ShortBase color={color} />
        <mesh position={[0, -0.18, -0.16]} scale={[0.9, 1.5, 0.55]}>
          <sphereGeometry args={[0.42, 16, 14]} />
          <Toon color={color} />
        </mesh>
      </group>
    )
  }
  if (style === 'spiky') {
    return (
      <group>
        <mesh position={[0, 0.1, -0.04]} scale={[1.02, 0.75, 1.02]}>
          <sphereGeometry args={[0.5, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          <Toon color={color} />
        </mesh>
        {[
          [0, 0.42, 0],
          [0.28, 0.3, 0.1],
          [-0.28, 0.3, 0.1],
          [0.12, 0.36, -0.24],
          [-0.14, 0.34, -0.22],
        ].map(([x, y, z], i) => (
          <mesh key={i} position={[x, y, z]} rotation={[z * 2, 0, -x * 2]}>
            <coneGeometry args={[0.1, 0.28, 5]} />
            <Toon color={color} />
          </mesh>
        ))}
      </group>
    )
  }
  if (style === 'bun') {
    return (
      <group>
        <mesh position={[0, 0.16, -0.04]} scale={[1.06, 0.9, 1.06]}>
          <sphereGeometry args={[0.52, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
          <Toon color={color} />
        </mesh>
        <mesh position={[0, 0.5, -0.18]}>
          <sphereGeometry args={[0.2, 14, 12]} />
          <Toon color={color} />
        </mesh>
      </group>
    )
  }
  // short (기본)
  return (
    <group>
      <ShortBase color={color} />
      <mesh position={[0, 0.44, 0]}>
        <sphereGeometry args={[0.08, 10, 8]} />
        <Toon color={color} />
      </mesh>
    </group>
  )
}

function Hat({ id }: { id: string }) {
  if (id === 'acorn') {
    return (
      <group position={[0, 0.44, 0]}>
        <mesh>
          <sphereGeometry args={[0.36, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          <Toon color="#a56b2b" />
        </mesh>
        <mesh position={[0, 0.24, 0]}>
          <coneGeometry args={[0.06, 0.15, 8]} />
          <Toon color="#7c4e1e" />
        </mesh>
      </group>
    )
  }
  if (id === 'cap') {
    return (
      <group position={[0, 0.42, 0]}>
        <mesh scale={[1, 0.7, 1]}>
          <sphereGeometry args={[0.42, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          <Toon color="#e05252" />
        </mesh>
        <mesh position={[0, -0.02, 0.34]} rotation={[0.15, 0, 0]}>
          <boxGeometry args={[0.4, 0.05, 0.28]} />
          <Toon color="#c53f3f" />
        </mesh>
      </group>
    )
  }
  if (id === 'flower') {
    return (
      <group position={[0.32, 0.36, 0.06]}>
        {[0, 1, 2, 3, 4].map((i) => {
          const a = (i / 5) * Math.PI * 2
          return (
            <mesh key={i} position={[Math.cos(a) * 0.09, 0, Math.sin(a) * 0.09]}>
              <sphereGeometry args={[0.06, 8, 6]} />
              <Toon color="#f2a4c8" />
            </mesh>
          )
        })}
        <mesh>
          <sphereGeometry args={[0.05, 8, 6]} />
          <Toon color="#f2c14e" />
        </mesh>
      </group>
    )
  }
  if (id === 'party') {
    return (
      <group position={[0, 0.5, 0]}>
        <mesh position={[0, 0.18, 0]}>
          <coneGeometry args={[0.26, 0.6, 16]} />
          <Toon color="#f2955b" />
        </mesh>
        <mesh position={[0, 0.5, 0]}>
          <sphereGeometry args={[0.08, 10, 8]} />
          <Toon color={WHITE} />
        </mesh>
      </group>
    )
  }
  if (id === 'straw') {
    return (
      <group position={[0, 0.42, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.6, 0.6, 0.04, 20]} />
          <Toon color="#e6c878" />
        </mesh>
        <mesh position={[0, 0.12, 0]} scale={[1, 0.8, 1]}>
          <sphereGeometry args={[0.34, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          <Toon color="#d9b45f" />
        </mesh>
        <mesh position={[0, 0.06, 0.34]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.35, 0.03, 8, 20, Math.PI]} />
          <Toon color="#c14a4a" />
        </mesh>
      </group>
    )
  }
  if (id === 'crown') {
    return (
      <group position={[0, 0.46, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.42, 0.42, 0.12, 12, 1, true]} />
          <Toon color="#f2c94e" />
        </mesh>
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const a = (i / 6) * Math.PI * 2
          return (
            <mesh key={i} position={[Math.cos(a) * 0.42, 0.12, Math.sin(a) * 0.42]}>
              <coneGeometry args={[0.06, 0.18, 4]} />
              <Toon color="#f2c94e" />
            </mesh>
          )
        })}
        <mesh position={[0, 0.02, 0.42]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <Toon color="#e0526b" />
        </mesh>
      </group>
    )
  }
  if (id === 'bow') {
    return (
      <group position={[0.26, 0.4, 0.12]} rotation={[0, 0, 0.2]}>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.13, 0, 0]} scale={[1, 0.7, 0.5]}>
            <sphereGeometry args={[0.13, 10, 8]} />
            <Toon color="#e86a9c" />
          </mesh>
        ))}
        <mesh>
          <sphereGeometry args={[0.06, 8, 8]} />
          <Toon color="#c94e80" />
        </mesh>
      </group>
    )
  }
  if (id === 'beanie') {
    return (
      <group position={[0, 0.36, 0]}>
        <mesh scale={[1.04, 0.9, 1.04]}>
          <sphereGeometry args={[0.44, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
          <Toon color="#4c7bd6" />
        </mesh>
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.42, 0.07, 10, 22]} />
          <Toon color="#3a63b0" />
        </mesh>
        <mesh position={[0, 0.42, 0]}>
          <sphereGeometry args={[0.1, 12, 10]} />
          <Toon color={WHITE} />
        </mesh>
      </group>
    )
  }
  if (id === 'earmuffs') {
    return (
      <group position={[0, 0.3, 0]}>
        <mesh position={[0, 0.16, -0.02]} rotation={[0, 0, 0]}>
          <torusGeometry args={[0.44, 0.04, 8, 20, Math.PI]} />
          <Toon color="#8a5230" />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.44, 0.02, 0]} scale={[0.7, 1, 1]}>
            <sphereGeometry args={[0.14, 12, 10]} />
            <Toon color="#d98f5b" />
          </mesh>
        ))}
      </group>
    )
  }
  if (id === 'chef') {
    return (
      <group position={[0, 0.42, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.34, 0.34, 0.16, 18]} />
          <Toon color={WHITE} />
        </mesh>
        <mesh position={[0, 0.22, 0]} scale={[1, 0.8, 1]}>
          <sphereGeometry args={[0.36, 18, 14]} />
          <Toon color={WHITE} />
        </mesh>
      </group>
    )
  }
  if (id === 'bunny') {
    return (
      <group position={[0, 0.4, -0.02]}>
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.42, 0.04, 8, 20, Math.PI]} />
          <Toon color="#f2a4c8" />
        </mesh>
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.16, 0.24, 0]} rotation={[0, 0, s * 0.2]}>
            <mesh scale={[0.5, 1.5, 0.4]}>
              <sphereGeometry args={[0.14, 10, 10]} />
              <Toon color={WHITE} />
            </mesh>
            <mesh position={[0, 0, 0.05]} scale={[0.35, 1.2, 0.3]}>
              <sphereGeometry args={[0.13, 10, 10]} />
              <Toon color="#f7c4d9" />
            </mesh>
          </group>
        ))}
      </group>
    )
  }
  if (id === 'headphones') {
    return (
      <group position={[0, 0.12, 0]}>
        <mesh position={[0, 0.4, -0.02]}>
          <torusGeometry args={[0.5, 0.045, 10, 24, Math.PI]} />
          <Toon color="#2b2b2b" />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.5, 0.08, 0]} scale={[0.6, 1, 1]}>
            <sphereGeometry args={[0.15, 14, 12]} />
            <Toon color="#e05252" />
          </mesh>
        ))}
      </group>
    )
  }
  if (id === 'horns') {
    return (
      <group position={[0, 0.34, -0.02]}>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.24, 0.14, 0]} rotation={[-0.3, 0, s * 0.4]}>
            <coneGeometry args={[0.09, 0.32, 8]} />
            <Toon color="#d8a24a" />
          </mesh>
        ))}
      </group>
    )
  }
  if (id === 'halo') {
    return (
      <group position={[0, 0.62, 0]} rotation={[-Math.PI / 2 + 0.35, 0, 0]}>
        <mesh>
          <torusGeometry args={[0.26, 0.035, 10, 24]} />
          <meshToonMaterial gradientMap={toonGradient} color="#ffe98a" />
        </mesh>
      </group>
    )
  }
  if (id === 'pirate') {
    return (
      <group position={[0, 0.4, 0]}>
        <mesh scale={[1.04, 0.7, 1.04]}>
          <sphereGeometry args={[0.44, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          <Toon color="#2b2b2b" />
        </mesh>
        <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.56, 0.56, 0.04, 6]} />
          <Toon color="#2b2b2b" />
        </mesh>
        <mesh position={[0, 0.16, 0.4]}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <Toon color={WHITE} />
        </mesh>
      </group>
    )
  }
  if (id === 'wizard') {
    return (
      <group position={[0, 0.44, 0]}>
        <mesh position={[0, 0.42, 0]} scale={[1, 1, 1]}>
          <coneGeometry args={[0.34, 0.95, 18]} />
          <Toon color="#5a48b0" />
        </mesh>
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.52, 0.52, 0.04, 20]} />
          <Toon color="#5a48b0" />
        </mesh>
        <mesh position={[0.14, 0.5, 0.22]}>
          <coneGeometry args={[0.05, 0.14, 5]} />
          <meshToonMaterial gradientMap={toonGradient} color="#ffe98a" />
        </mesh>
        <mesh position={[-0.1, 0.72, -0.12]}>
          <coneGeometry args={[0.04, 0.12, 5]} />
          <meshToonMaterial gradientMap={toonGradient} color="#ffe98a" />
        </mesh>
      </group>
    )
  }
  return null
}

// ─────────────────────────── 상의 ───────────────────────────

function Torso({ avatar }: { avatar: Avatar }) {
  const cos = avatar.costume
  if (cos) {
    const p = COSTUME[cos] ?? COSTUME.bear
    if (cos === 'robot') {
      return (
        <>
          <mesh>
            <boxGeometry args={[0.52, 0.5, 0.38]} />
            <Toon color={p.body} />
          </mesh>
          <mesh position={[0, 0, 0.2]}>
            <boxGeometry args={[0.3, 0.22, 0.04]} />
            <Toon color={p.belly} />
          </mesh>
          {[-0.08, 0, 0.08].map((x, i) => (
            <mesh key={i} position={[x, -0.14, 0.22]}>
              <sphereGeometry args={[0.03, 8, 8]} />
              <Toon color={['#e05252', '#f2c14e', '#5cc06b'][i]} />
            </mesh>
          ))}
        </>
      )
    }
    if (cos === 'pumpkin') {
      return (
        <>
          <mesh scale={[1.2, 1, 1.15]}>
            <sphereGeometry args={[0.36, 20, 16]} />
            <Toon color={p.body} />
          </mesh>
          {[-0.28, -0.12, 0.12, 0.28].map((x, i) => (
            <mesh key={i} position={[x, 0, 0.02]} scale={[0.12, 1, 1.2]}>
              <sphereGeometry args={[0.36, 8, 14]} />
              <Toon color={p.paw} />
            </mesh>
          ))}
        </>
      )
    }
    return (
      <>
        <mesh>
          <capsuleGeometry args={[0.31, 0.18, 8, 16]} />
          <Toon color={p.body} />
        </mesh>
        <mesh position={[0, -0.04, 0.17]} scale={[0.8, 0.95, 0.5]}>
          <sphereGeometry args={[0.24, 14, 12]} />
          <Toon color={p.belly} />
        </mesh>
      </>
    )
  }

  const top = avatar.top
  const c = avatar.shirt
  const base = top === 'overalls' ? WHITE : c
  return (
    <>
      <mesh>
        <capsuleGeometry args={[0.29, 0.16, 8, 16]} />
        <Toon color={base} />
      </mesh>
      <mesh position={[0, -0.06, 0.13]} scale={[0.9, 0.7, 0.7]}>
        <sphereGeometry args={[0.22, 14, 12]} />
        <Toon color={base} />
      </mesh>

      {top === 'stripe' &&
        [0.04, -0.04, -0.12].map((y, i) => (
          <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.29, 0.028, 8, 20]} />
            <Toon color={WHITE} />
          </mesh>
        ))}

      {top === 'tank' && (
        <mesh position={[0, 0.14, 0.06]} scale={[1.5, 0.7, 0.7]}>
          <sphereGeometry args={[0.12, 12, 10]} />
          <Toon color={avatar.skin} />
        </mesh>
      )}

      {(top === 'longsleeve' || top === 'knit') && (
        <mesh position={[0, 0.15, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.17, 0.05, 10, 20]} />
          <Toon color={c} />
        </mesh>
      )}
      {top === 'knit' &&
        [-0.07, 0.07].map((x, i) => (
          <mesh key={i} position={[x, -0.02, 0.27]}>
            <boxGeometry args={[0.03, 0.3, 0.03]} />
            <Toon color={c} />
          </mesh>
        ))}

      {top === 'hoodie' && (
        <>
          <mesh position={[0, 0.16, -0.13]} scale={[1.25, 1, 0.85]}>
            <sphereGeometry args={[0.24, 16, 12, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5]} />
            <Toon color={c} />
          </mesh>
          <mesh position={[0, -0.13, 0.21]}>
            <boxGeometry args={[0.3, 0.13, 0.06]} />
            <Toon color={c} />
          </mesh>
          {[-0.05, 0.05].map((x, i) => (
            <mesh key={i} position={[x, 0.04, 0.25]}>
              <cylinderGeometry args={[0.012, 0.012, 0.16, 6]} />
              <Toon color={WHITE} />
            </mesh>
          ))}
        </>
      )}

      {top === 'jacket' && (
        <>
          <mesh position={[0, -0.02, 0.27]}>
            <boxGeometry args={[0.035, 0.36, 0.02]} />
            <Toon color="#d9d9d9" />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.1, 0.13, 0.22]} rotation={[0, 0, s * 0.6]}>
              <boxGeometry args={[0.16, 0.09, 0.04]} />
              <Toon color={c} />
            </mesh>
          ))}
        </>
      )}

      {top === 'dress' && (
        <mesh position={[0, -0.14, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.28, 0.028, 8, 20]} />
          <Toon color={WHITE} />
        </mesh>
      )}

      {top === 'overalls' && (
        <>
          <mesh position={[0, -0.16, 0]}>
            <capsuleGeometry args={[0.295, 0.1, 8, 16]} />
            <Toon color={avatar.pants} />
          </mesh>
          <mesh position={[0, 0.0, 0.24]}>
            <boxGeometry args={[0.32, 0.28, 0.08]} />
            <Toon color={avatar.pants} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.14, 0.18, 0.02]} rotation={[0.15, 0, 0]}>
              <boxGeometry args={[0.07, 0.36, 0.06]} />
              <Toon color={avatar.pants} />
            </mesh>
          ))}
          {[-1, 1].map((s) => (
            <mesh key={`btn${s}`} position={[s * 0.11, 0.06, 0.29]}>
              <sphereGeometry args={[0.032, 8, 8]} />
              <Toon color="#e0b53a" />
            </mesh>
          ))}
        </>
      )}

      {top === 'sailor' && (
        <>
          <mesh position={[0, 0.13, -0.05]} rotation={[-0.35, 0, 0]}>
            <boxGeometry args={[0.42, 0.03, 0.3]} />
            <Toon color={WHITE} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.06, 0.04, 0.27]} rotation={[0, 0, s * 0.5]}>
              <boxGeometry args={[0.05, 0.2, 0.02]} />
              <Toon color={WHITE} />
            </mesh>
          ))}
          <mesh position={[0, -0.02, 0.29]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.07, 0.07, 0.05]} />
            <Toon color="#e05252" />
          </mesh>
        </>
      )}

      {top === 'soccer' &&
        [-0.1, 0.1].map((x, i) => (
          <mesh key={i} position={[x, -0.02, 0.27]}>
            <boxGeometry args={[0.06, 0.34, 0.02]} />
            <Toon color={WHITE} />
          </mesh>
        ))}
    </>
  )
}

// 허리에 붙는 치마/원피스 자락 (body 그룹 자식)
function HipPiece({ avatar }: { avatar: Avatar }) {
  if (avatar.costume) return null
  if (avatar.top === 'dress') {
    return (
      <mesh position={[0, -0.3, 0]}>
        <cylinderGeometry args={[0.24, 0.48, 0.42, 20]} />
        <Toon color={avatar.shirt} />
      </mesh>
    )
  }
  if (avatar.bottom === 'skirt') {
    return (
      <mesh position={[0, -0.24, 0]}>
        <cylinderGeometry args={[0.22, 0.44, 0.26, 20]} />
        <Toon color={avatar.pants} />
      </mesh>
    )
  }
  if (avatar.bottom === 'longskirt') {
    return (
      <mesh position={[0, -0.42, 0]}>
        <cylinderGeometry args={[0.2, 0.52, 0.62, 20]} />
        <Toon color={avatar.pants} />
      </mesh>
    )
  }
  return null
}

// ─────────────────────────── 팔·다리 ───────────────────────────

function Arm({ avatar }: { avatar: Avatar }) {
  const cos = avatar.costume
  const p = cos ? (COSTUME[cos] ?? COSTUME.bear) : null
  const long = !!cos || LONG_SLEEVE.has(avatar.top)
  const sleeve = p
    ? p.body
    : avatar.top === 'overalls'
      ? WHITE
      : avatar.top === 'tank'
        ? avatar.skin
        : avatar.shirt
  const hand = p ? p.paw : avatar.skin
  return (
    <>
      <mesh position={[0, -0.16, 0]}>
        <capsuleGeometry args={[0.085, 0.16, 4, 8]} />
        <Toon color={sleeve} />
      </mesh>
      {long && (
        <mesh position={[0, -0.3, 0]}>
          <capsuleGeometry args={[0.078, 0.1, 4, 8]} />
          <Toon color={sleeve} />
        </mesh>
      )}
      <mesh position={[0, long ? -0.4 : -0.3, 0]}>
        <sphereGeometry args={[0.1, 10, 8]} />
        <Toon color={hand} />
      </mesh>
    </>
  )
}

function Leg({ avatar }: { avatar: Avatar }) {
  const cos = avatar.costume
  if (cos) {
    const p = COSTUME[cos] ?? COSTUME.bear
    return (
      <>
        <mesh position={[0, -0.11, 0]}>
          <capsuleGeometry args={[0.1, 0.12, 4, 8]} />
          <Toon color={p.body} />
        </mesh>
        <mesh position={[0, -0.25, 0.05]} scale={[1, 0.8, 1.35]}>
          <sphereGeometry args={[0.12, 12, 10]} />
          <Toon color={p.paw} />
        </mesh>
      </>
    )
  }

  const bare =
    avatar.top === 'dress' || avatar.bottom === 'skirt' || avatar.bottom === 'longskirt'
  const hidden = avatar.bottom === 'longskirt'
  const pc = avatar.pants

  return (
    <>
      {!hidden && bare && (
        <mesh position={[0, -0.12, 0]}>
          <capsuleGeometry args={[0.085, 0.12, 4, 8]} />
          <Toon color={avatar.skin} />
        </mesh>
      )}
      {!bare && avatar.bottom === 'pants' && (
        <mesh position={[0, -0.11, 0]}>
          <capsuleGeometry args={[0.1, 0.1, 4, 8]} />
          <Toon color={pc} />
        </mesh>
      )}
      {!bare && avatar.bottom === 'capri' && (
        <mesh position={[0, -0.14, 0]}>
          <capsuleGeometry args={[0.1, 0.17, 4, 8]} />
          <Toon color={pc} />
        </mesh>
      )}
      {!bare && avatar.bottom === 'shorts' && (
        <>
          <mesh position={[0, -0.04, 0]}>
            <capsuleGeometry args={[0.11, 0.02, 4, 8]} />
            <Toon color={pc} />
          </mesh>
          <mesh position={[0, -0.16, 0]}>
            <capsuleGeometry args={[0.085, 0.08, 4, 8]} />
            <Toon color={avatar.skin} />
          </mesh>
        </>
      )}
      {!hidden && <Shoe avatar={avatar} />}
    </>
  )
}

function Shoe({ avatar }: { avatar: Avatar }) {
  const c = avatar.shoes
  const s = avatar.shoeStyle
  if (s === 'boots') {
    return (
      <group>
        <mesh position={[0, -0.16, 0.01]}>
          <capsuleGeometry args={[0.11, 0.12, 4, 8]} />
          <Toon color={c} />
        </mesh>
        <mesh position={[0, -0.25, 0.06]} scale={[1, 0.7, 1.3]}>
          <sphereGeometry args={[0.12, 12, 10]} />
          <Toon color={c} />
        </mesh>
      </group>
    )
  }
  if (s === 'sandals') {
    return (
      <group>
        <mesh position={[0, -0.26, 0.04]} scale={[1.05, 0.32, 1.3]}>
          <sphereGeometry args={[0.12, 12, 10]} />
          <Toon color={c} />
        </mesh>
        <mesh position={[0, -0.2, 0.04]}>
          <boxGeometry args={[0.2, 0.035, 0.12]} />
          <Toon color={c} />
        </mesh>
      </group>
    )
  }
  if (s === 'maryjane') {
    return (
      <group>
        <mesh position={[0, -0.23, 0.05]} scale={[1, 0.72, 1.25]}>
          <sphereGeometry args={[0.12, 12, 10]} />
          <Toon color={c} />
        </mesh>
        <mesh position={[0, -0.18, 0.03]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.1, 0.018, 6, 14, Math.PI]} />
          <Toon color={c} />
        </mesh>
        <mesh position={[0, -0.29, -0.05]}>
          <boxGeometry args={[0.07, 0.06, 0.07]} />
          <Toon color={c} />
        </mesh>
      </group>
    )
  }
  // sneakers (기본)
  return (
    <group>
      <mesh position={[0, -0.22, 0.05]} scale={[1, 0.7, 1.35]}>
        <sphereGeometry args={[0.12, 12, 10]} />
        <Toon color={c} />
      </mesh>
      <mesh position={[0, -0.26, 0.06]} scale={[1.08, 0.32, 1.42]}>
        <sphereGeometry args={[0.12, 12, 10]} />
        <Toon color={WHITE} />
      </mesh>
    </group>
  )
}

// ─────────────────────────── 액세서리 ───────────────────────────

function FaceAcc({ id }: { id: string }) {
  if (id === 'glasses') {
    return (
      <group position={[0, 0.03, 0.44]}>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.17, 0, 0.02]}>
            <torusGeometry args={[0.085, 0.016, 8, 18]} />
            <Toon color="#3a3a3a" />
          </mesh>
        ))}
        <mesh>
          <boxGeometry args={[0.1, 0.02, 0.02]} />
          <Toon color="#3a3a3a" />
        </mesh>
      </group>
    )
  }
  if (id === 'sunglasses') {
    return (
      <group position={[0, 0.03, 0.44]}>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.16, 0, 0.02]} rotation={[0, 0, s * -0.05]}>
            <boxGeometry args={[0.16, 0.11, 0.03]} />
            <Toon color="#1c1c1c" />
          </mesh>
        ))}
        <mesh>
          <boxGeometry args={[0.1, 0.03, 0.02]} />
          <Toon color="#1c1c1c" />
        </mesh>
      </group>
    )
  }
  return null
}

// body 그룹 자식으로 등/목 액세서리 + 코스튬 꼬리
function BackStuff({ avatar }: { avatar: Avatar }) {
  const acc = avatar.acc
  const cos = avatar.costume
  return (
    <>
      {acc === 'backpack' && (
        <group>
          <mesh position={[0, -0.05, -0.24]}>
            <boxGeometry args={[0.36, 0.4, 0.18]} />
            <Toon color="#c56f3c" />
          </mesh>
          <mesh position={[0, 0.12, -0.3]}>
            <boxGeometry args={[0.36, 0.14, 0.06]} />
            <Toon color="#a85a2c" />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.16, 0.02, 0.14]} rotation={[0.1, 0, 0]}>
              <boxGeometry args={[0.06, 0.42, 0.04]} />
              <Toon color="#a85a2c" />
            </mesh>
          ))}
        </group>
      )}
      {acc === 'wings' &&
        [-1, 1].map((s) => (
          <group key={s} position={[s * 0.16, 0.04, -0.16]} rotation={[0.2, s * 0.5, s * 0.3]}>
            <mesh position={[s * 0.1, 0.08, 0]} scale={[0.55, 1, 0.2]}>
              <sphereGeometry args={[0.24, 12, 10]} />
              <meshToonMaterial gradientMap={toonGradient} color="#eaf4ff" transparent opacity={0.75} />
            </mesh>
            <mesh position={[s * 0.08, -0.12, 0]} scale={[0.45, 0.8, 0.2]}>
              <sphereGeometry args={[0.18, 12, 10]} />
              <meshToonMaterial gradientMap={toonGradient} color="#eaf4ff" transparent opacity={0.75} />
            </mesh>
          </group>
        ))}
      {acc === 'cape' && (
        <group>
          <mesh position={[0, -0.16, -0.18]} rotation={[0.16, 0, 0]}>
            <boxGeometry args={[0.5, 0.62, 0.04]} />
            <Toon color="#c0433f" />
          </mesh>
          <mesh position={[0, 0.2, -0.06]}>
            <boxGeometry args={[0.42, 0.08, 0.14]} />
            <Toon color="#9c332f" />
          </mesh>
        </group>
      )}
      {acc === 'scarf' && (
        <group>
          <mesh position={[0, 0.24, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.2, 0.06, 8, 20]} />
            <Toon color="#d1584f" />
          </mesh>
          <mesh position={[0.1, 0.02, 0.16]} rotation={[0, 0, 0.15]}>
            <boxGeometry args={[0.1, 0.3, 0.06]} />
            <Toon color="#d1584f" />
          </mesh>
        </group>
      )}
      {acc === 'tail' && (
        <group>
          {[
            [0, -0.16, -0.22, 0.13],
            [0.02, -0.04, -0.36, 0.11],
            [0.04, 0.08, -0.48, 0.085],
          ].map(([x, y, z, r], i) => (
            <mesh key={i} position={[x, y, z]}>
              <sphereGeometry args={[r as number, 10, 8]} />
              <Toon color="#c8722e" />
            </mesh>
          ))}
          <mesh position={[0.05, 0.16, -0.56]}>
            <sphereGeometry args={[0.07, 10, 8]} />
            <Toon color={WHITE} />
          </mesh>
        </group>
      )}

      {cos === 'dino' && (
        <>
          {[0.12, -0.04, -0.2].map((y, i) => (
            <mesh key={i} position={[0, y, -0.3]} rotation={[-0.4, 0, 0]}>
              <coneGeometry args={[0.08, 0.2, 6]} />
              <Toon color={COSTUME.dino.paw} />
            </mesh>
          ))}
          {[
            [0, -0.22, -0.28, 0.12],
            [0, -0.12, -0.42, 0.1],
            [0.02, 0.0, -0.54, 0.07],
          ].map(([x, y, z, r], i) => (
            <mesh key={`t${i}`} position={[x, y, z]}>
              <sphereGeometry args={[r as number, 10, 8]} />
              <Toon color={COSTUME.dino.body} />
            </mesh>
          ))}
        </>
      )}
      {cos === 'cat' && (
        <mesh position={[0, -0.05, -0.28]} rotation={[0.7, 0, 0]}>
          <capsuleGeometry args={[0.045, 0.42, 4, 8]} />
          <Toon color={COSTUME.cat.body} />
        </mesh>
      )}
      {cos === 'shark' && (
        <>
          <mesh position={[0, 0.12, -0.26]} rotation={[-0.5, 0, 0]}>
            <coneGeometry args={[0.13, 0.34, 4]} />
            <Toon color={COSTUME.shark.paw} />
          </mesh>
          <mesh position={[0, -0.1, -0.46]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.16, 0.3, 4]} />
            <Toon color={COSTUME.shark.paw} />
          </mesh>
        </>
      )}
    </>
  )
}

// head 그룹 자식으로 코스튬 귀·헬멧 등
// 코스튬용 두건(머리 덮개) — 머리 위·뒤를 코스튬 색으로 덮는다
function Hood({ color }: { color: string }) {
  return (
    <mesh position={[0, 0.08, -0.04]} scale={[1.08, 1.02, 1.06]}>
      <sphereGeometry args={[0.5, 22, 16, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
      <Toon color={color} />
    </mesh>
  )
}

function CostumeHead({ id }: { id: string }) {
  const p = COSTUME[id] ?? COSTUME.bear
  if (id === 'cat') {
    return (
      <>
        <Hood color={p.body} />
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.26, 0.46, 0]} rotation={[0, 0, s * 0.2]}>
            <mesh>
              <coneGeometry args={[0.14, 0.28, 8]} />
              <Toon color={p.body} />
            </mesh>
            <mesh position={[0, -0.01, 0.05]} scale={[0.55, 0.7, 0.4]}>
              <coneGeometry args={[0.13, 0.22, 8]} />
              <Toon color="#f4b8c4" />
            </mesh>
          </group>
        ))}
      </>
    )
  }
  if (id === 'bear') {
    return (
      <>
        <Hood color={p.body} />
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.32, 0.44, -0.02]}>
            <sphereGeometry args={[0.16, 12, 10]} />
            <Toon color={p.body} />
          </mesh>
        ))}
        <mesh position={[0, -0.06, 0.46]} scale={[1, 0.8, 0.7]}>
          <sphereGeometry args={[0.14, 12, 10]} />
          <Toon color={p.belly} />
        </mesh>
      </>
    )
  }
  if (id === 'frog') {
    return (
      <>
        <Hood color={p.body} />
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.24, 0.5, 0.02]}>
            <mesh>
              <sphereGeometry args={[0.16, 12, 10]} />
              <Toon color={p.body} />
            </mesh>
            <mesh position={[0, 0.03, 0.13]}>
              <sphereGeometry args={[0.07, 10, 8]} />
              <meshToonMaterial gradientMap={toonGradient} color="#1c1c1c" />
            </mesh>
          </group>
        ))}
      </>
    )
  }
  if (id === 'dino') {
    return (
      <>
        <Hood color={p.body} />
        {[0.54, 0.42, 0.28].map((y, i) => (
          <mesh key={i} position={[0, y, -0.06 - i * 0.14]} rotation={[-0.35, 0, 0]}>
            <coneGeometry args={[0.08, 0.2, 6]} />
            <Toon color={p.paw} />
          </mesh>
        ))}
      </>
    )
  }
  if (id === 'shark') {
    return (
      <>
        <Hood color={p.body} />
        <mesh position={[0, 0.5, -0.08]} rotation={[-0.3, 0, 0]}>
          <coneGeometry args={[0.15, 0.36, 4]} />
          <Toon color={p.paw} />
        </mesh>
        {[-0.16, 0, 0.16].map((x, i) => (
          <mesh key={i} position={[x, -0.34, 0.42]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.04, 0.1, 4]} />
            <Toon color={WHITE} />
          </mesh>
        ))}
      </>
    )
  }
  if (id === 'robot') {
    return (
      <>
        <mesh position={[0, 0.52, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.2, 6]} />
          <Toon color={p.paw} />
        </mesh>
        <mesh position={[0, 0.64, 0]}>
          <sphereGeometry args={[0.055, 10, 8]} />
          <meshToonMaterial gradientMap={toonGradient} color="#e05252" />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.48, -0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.11, 0.11, 0.06, 14]} />
            <Toon color={p.paw} />
          </mesh>
        ))}
        {[-1, 1].map((s) => (
          <mesh key={`b${s}`} position={[s * 0.13, 0.32, 0.4]}>
            <sphereGeometry args={[0.03, 8, 8]} />
            <Toon color={p.paw} />
          </mesh>
        ))}
      </>
    )
  }
  if (id === 'pumpkin') {
    return (
      <>
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.05, 0.07, 0.14, 8]} />
          <Toon color="#6b4a2f" />
        </mesh>
        <mesh position={[0.12, 0.52, 0]} scale={[1.7, 0.3, 1]} rotation={[0, 0, 0.3]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <Toon color="#5ca047" />
        </mesh>
      </>
    )
  }
  if (id === 'space') {
    return (
      <>
        <mesh>
          <sphereGeometry args={[0.62, 20, 16]} />
          <meshToonMaterial gradientMap={toonGradient} color="#cfe6f2" transparent opacity={0.22} />
        </mesh>
        <mesh position={[0, -0.34, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.5, 0.07, 10, 24]} />
          <Toon color={COSTUME.space.paw} />
        </mesh>
      </>
    )
  }
  return null
}

// ─────────────────────────── 캐릭터 ───────────────────────────

// 통통한 치비 캐릭터. refs를 통해 Player가 애니메이션한다.
export function Character({ avatar, refs }: { avatar: Avatar; refs: CharacterRefs }) {
  return (
    <group ref={refs.bob}>
      {/* 다리 */}
      <group ref={refs.legL} position={[0.14, 0.3, 0]}>
        <Leg avatar={avatar} />
      </group>
      <group ref={refs.legR} position={[-0.14, 0.3, 0]}>
        <Leg avatar={avatar} />
      </group>

      {/* 몸통 (상의) */}
      <group ref={refs.body} position={[0, 0.52, 0]}>
        <Torso avatar={avatar} />
        <HipPiece avatar={avatar} />
        <BackStuff avatar={avatar} />
      </group>

      {/* 팔 */}
      <group ref={refs.armL} position={[0.34, 0.66, 0]}>
        <Arm avatar={avatar} />
      </group>
      <group ref={refs.armR} position={[-0.34, 0.66, 0]}>
        <Arm avatar={avatar} />
      </group>

      {/* 머리 */}
      <group ref={refs.head} position={[0, 1.12, 0]}>
        <mesh scale={[1, 0.94, 0.96]}>
          <sphereGeometry args={[0.5, 24, 20]} />
          <Toon color={avatar.skin} />
        </mesh>

        {/* 눈 */}
        <group ref={refs.eyeL} position={[0.17, 0.03, 0.44]}>
          <mesh scale={[0.7, 1, 0.5]}>
            <sphereGeometry args={[0.075, 12, 10]} />
            <meshToonMaterial gradientMap={toonGradient} color="#2b2b2b" />
          </mesh>
          <mesh position={[0.02, 0.03, 0.05]}>
            <sphereGeometry args={[0.022, 6, 6]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
        <group ref={refs.eyeR} position={[-0.17, 0.03, 0.44]}>
          <mesh scale={[0.7, 1, 0.5]}>
            <sphereGeometry args={[0.075, 12, 10]} />
            <meshToonMaterial gradientMap={toonGradient} color="#2b2b2b" />
          </mesh>
          <mesh position={[0.02, 0.03, 0.05]}>
            <sphereGeometry args={[0.022, 6, 6]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>

        {/* 볼 */}
        <mesh position={[0.28, -0.08, 0.38]} scale={[1, 0.7, 0.4]}>
          <sphereGeometry args={[0.07, 10, 8]} />
          <meshToonMaterial gradientMap={toonGradient} color="#ffb0b0" transparent opacity={0.8} />
        </mesh>
        <mesh position={[-0.28, -0.08, 0.38]} scale={[1, 0.7, 0.4]}>
          <sphereGeometry args={[0.07, 10, 8]} />
          <meshToonMaterial gradientMap={toonGradient} color="#ffb0b0" transparent opacity={0.8} />
        </mesh>

        {/* 입 */}
        <mesh position={[0, -0.14, 0.45]}>
          <boxGeometry args={[0.08, 0.03, 0.02]} />
          <meshToonMaterial gradientMap={toonGradient} color="#b5665a" />
        </mesh>

        {(!avatar.costume || avatar.costume === 'pumpkin' || avatar.costume === 'space') && (
          <Hair style={avatar.hair} color={avatar.hairColor} />
        )}
        {avatar.acc && <FaceAcc id={avatar.acc} />}
        {avatar.costume && <CostumeHead id={avatar.costume} />}
        {avatar.hat && <Hat id={avatar.hat} />}
      </group>
    </group>
  )
}

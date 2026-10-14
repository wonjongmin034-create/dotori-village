import { Toon, Glow, WHITE, Shaped } from './wearKit'
import type { Avatar } from './avatar'

// 새 상의·하의·신발. 몸통(body) 그룹과 다리(leg) 그룹의 자식으로 그린다.

export const NEW_TOPS = new Set([
  'cardigan', 'turtleneck', 'hanbok', 'labcoat', 'uniform', 'raincoat', 'puffer', 'baseball', 'vest', 'tuxedo',
])
// 긴소매로 그릴 상의 (옛 것 + 새 것)
export const NEW_LONG_TOPS = new Set(['cardigan', 'turtleneck', 'hanbok', 'labcoat', 'uniform', 'raincoat', 'puffer', 'tuxedo'])
// 팔(소매)이 하양인 상의
export const WHITE_SLEEVE_TOPS = new Set(['overalls', 'labcoat', 'vest'])
// 몸통 바탕이 하양인 상의 (색 선택이 다른 부분에 쓰임)
export const WHITE_BASE_TOPS = new Set(['overalls', 'labcoat'])

export const NEW_BOTTOMS = new Set(['cargo', 'jogger', 'pleated', 'tutu', 'hanbokskirt'])
export const NEW_SKIRTS = new Set(['pleated', 'tutu', 'hanbokskirt'])
export const NEW_SHOES = new Set(['rainboots', 'hightops', 'slippers', 'skates', 'flowershoes'])

// 몸통 앞면의 깊이 (높이 y에 따라 둥글게 들어간다)
const surf = (y: number) => {
  const dy = Math.max(0, Math.abs(y) - 0.08)
  return Math.sqrt(Math.max(0.01, 0.0841 - dy * dy))
}

export function TopMore({ top, avatar }: { top: string; avatar: Avatar }) {
  const c = avatar.shirt
  switch (top) {
    case 'cardigan':
      return (
        <>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.05, 0.15, surf(0.15) + 0.005]} rotation={[0, 0, s * -0.5]}>
              <boxGeometry args={[0.045, 0.2, 0.02]} />
              <Toon color={WHITE} />
            </mesh>
          ))}
          <mesh position={[0, -0.04, surf(-0.04) + 0.006]}>
            <boxGeometry args={[0.014, 0.42, 0.016]} />
            <Toon color="#000000" opacity={0.22} />
          </mesh>
          {[0.08, -0.02, -0.12, -0.22].map((y, i) => (
            <mesh key={i} position={[0.045, y, surf(y) + 0.012]}>
              <sphereGeometry args={[0.025, 8, 8]} />
              <Toon color="#f1e3c0" />
            </mesh>
          ))}
          {[-1, 1].map((s) => (
            <mesh key={`p${s}`} position={[s * 0.15, -0.14, surf(-0.14) - 0.005]} rotation={[0, s * 0.45, 0]}>
              <boxGeometry args={[0.1, 0.09, 0.018]} />
              <Toon color={c} emissive="#000000" />
            </mesh>
          ))}
          <mesh position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.2, 0.04, 8, 22]} />
            <Toon color={c} />
          </mesh>
        </>
      )
    case 'turtleneck':
      return (
        <>
          {[0.17, 0.23, 0.29].map((y, i) => (
            <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.18 - i * 0.012, 0.045, 8, 22]} />
              <Toon color={c} />
            </mesh>
          ))}
          {[-0.12, -0.03, 0.06].map((y, i) => (
            <mesh key={`r${i}`} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.285, 0.012, 6, 24]} />
              <Toon color="#000000" opacity={0.16} />
            </mesh>
          ))}
        </>
      )
    case 'hanbok':
      return (
        <>
          {/* 깃: 하얀 V자 */}
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.07, 0.12, surf(0.12) + 0.01]} rotation={[0, 0, s * -0.6]}>
              <boxGeometry args={[0.06, 0.32, 0.025]} />
              <Toon color="#fbf6ea" />
            </mesh>
          ))}
          {/* 고름 */}
          <mesh position={[0.0, 0.04, surf(0.04) + 0.03]} rotation={[0, 0, 0.3]}>
            <boxGeometry args={[0.18, 0.045, 0.02]} />
            <Toon color="#d94f6b" />
          </mesh>
          <mesh position={[0.07, -0.08, surf(-0.08) + 0.02]} rotation={[0, 0, 0.06]}>
            <boxGeometry args={[0.055, 0.3, 0.015]} />
            <Toon color="#d94f6b" />
          </mesh>
          <mesh position={[-0.02, -0.1, surf(-0.1) + 0.02]} rotation={[0, 0, -0.06]}>
            <boxGeometry args={[0.055, 0.26, 0.015]} />
            <Toon color="#d94f6b" />
          </mesh>
          {/* 소매 끝동 */}
          <mesh position={[0, 0.24, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.2, 0.035, 8, 22]} />
            <Toon color="#fbf6ea" />
          </mesh>
        </>
      )
    case 'labcoat':
      return (
        <>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.08, 0.15, surf(0.15) + 0.01]} rotation={[0, 0, s * -0.55]}>
              <boxGeometry args={[0.07, 0.2, 0.025]} />
              <Toon color="#e3e8ee" />
            </mesh>
          ))}
          <mesh position={[0, -0.05, surf(-0.05) + 0.006]}>
            <boxGeometry args={[0.014, 0.44, 0.016]} />
            <Toon color="#000000" opacity={0.2} />
          </mesh>
          {[0.0, -0.1, -0.2].map((y, i) => (
            <mesh key={i} position={[0.04, y, surf(y) + 0.012]}>
              <sphereGeometry args={[0.02, 8, 8]} />
              <Toon color="#9fb0c4" />
            </mesh>
          ))}
          <mesh position={[0.15, -0.14, surf(-0.14) - 0.003]} rotation={[0, -0.5, 0]}>
            <boxGeometry args={[0.1, 0.1, 0.018]} />
            <Toon color="#e3e8ee" />
          </mesh>
          <mesh position={[0.16, -0.06, surf(-0.06) + 0.003]} rotation={[0, -0.5, 0.1]}>
            <cylinderGeometry args={[0.009, 0.009, 0.1, 6]} />
            <Toon color="#3a6fd8" />
          </mesh>
          <mesh position={[-0.13, 0.04, surf(0.04) + 0.012]}>
            <boxGeometry args={[0.09, 0.05, 0.012]} />
            <Toon color="#7fb6ff" />
          </mesh>
        </>
      )
    case 'uniform':
      return (
        <>
          {/* 하얀 셔츠 깃 + 넥타이 */}
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.07, 0.17, surf(0.17) + 0.012]} rotation={[0, 0, s * -0.6]}>
              <boxGeometry args={[0.07, 0.15, 0.025]} />
              <Toon color={WHITE} />
            </mesh>
          ))}
          <mesh position={[0, 0.1, surf(0.1) + 0.02]}>
            <boxGeometry args={[0.07, 0.07, 0.02]} />
            <Toon color="#d94040" />
          </mesh>
          <mesh position={[0, -0.04, surf(-0.04) + 0.02]}>
            <boxGeometry args={[0.055, 0.22, 0.016]} />
            <Toon color="#d94040" />
          </mesh>
          {[0.0, -0.12, -0.24].map((y, i) => (
            <mesh key={i} position={[0.11, y, surf(y) + 0.008]}>
              <sphereGeometry args={[0.02, 8, 8]} />
              <Toon color="#f2c94e" />
            </mesh>
          ))}
          <Shaped kind="star" size={0.04} color="#f2c94e" position={[-0.13, 0.02, surf(0.02) + 0.008]} depth={0.012} />
        </>
      )
    case 'raincoat':
      return (
        <>
          {/* 후드 */}
          <mesh position={[0, 0.17, -0.12]} scale={[1.25, 1, 0.9]}>
            <sphereGeometry args={[0.24, 16, 12, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5]} />
            <Toon color={c} />
          </mesh>
          <mesh position={[0, -0.02, surf(-0.02) + 0.01]}>
            <boxGeometry args={[0.03, 0.46, 0.018]} />
            <Toon color="#000000" opacity={0.25} />
          </mesh>
          {[0.1, -0.02, -0.14, -0.26].map((y, i) => (
            <mesh key={i} position={[0.065, y, surf(y) + 0.012]}>
              <cylinderGeometry args={[0.018, 0.018, 0.07, 8]} />
              <Toon color="#f4f4f4" />
            </mesh>
          ))}
          {[-1, 1].map((s) => (
            <mesh key={`h${s}`} position={[s * 0.16, 0.2, surf(0.2) + 0.012]}>
              <sphereGeometry args={[0.026, 8, 8]} />
              <Toon color="#f4f4f4" />
            </mesh>
          ))}
        </>
      )
    case 'puffer':
      return (
        <>
          {[0.1, 0.0, -0.1, -0.2, -0.3].map((y, i) => (
            <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.285 + (i === 0 ? 0 : 0.005), 0.03, 8, 26]} />
              <Toon color={c} />
            </mesh>
          ))}
          <mesh position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.2, 0.06, 8, 22]} />
            <Toon color={c} />
          </mesh>
          <mesh position={[0, -0.04, surf(-0.04) + 0.03]}>
            <boxGeometry args={[0.025, 0.5, 0.02]} />
            <Toon color="#e8e8ee" />
          </mesh>
        </>
      )
    case 'baseball':
      return (
        <>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.07, 0.17, surf(0.17) + 0.008]} rotation={[0, 0, s * -0.6]}>
              <boxGeometry args={[0.03, 0.18, 0.015]} />
              <Toon color={WHITE} />
            </mesh>
          ))}
          {/* 등번호 느낌의 큰 숫자 7 */}
          <mesh position={[0, 0.0, surf(0) + 0.008]}>
            <boxGeometry args={[0.15, 0.035, 0.012]} />
            <Toon color={WHITE} />
          </mesh>
          <mesh position={[0.025, -0.07, surf(-0.07) + 0.008]} rotation={[0, 0, 0.35]}>
            <boxGeometry args={[0.035, 0.17, 0.012]} />
            <Toon color={WHITE} />
          </mesh>
          {[0.0, -0.1, -0.2].map((y, i) => (
            <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.292, 0.008, 6, 26]} />
              <Toon color={WHITE} />
            </mesh>
          ))}
        </>
      )
    case 'vest':
      return (
        <>
          {/* 안에 입은 하얀 셔츠 */}
          <mesh position={[0, 0.0, surf(0) + 0.002]}>
            <boxGeometry args={[0.2, 0.5, 0.012]} />
            <Toon color={WHITE} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.15, 0.0, surf(0) + 0.01]} rotation={[0, s * 0.35, s * 0.06]}>
              <boxGeometry args={[0.14, 0.5, 0.02]} />
              <Toon color={avatar.shirt} />
            </mesh>
          ))}
          {[-1, 1].map((s) => (
            <mesh key={`v${s}`} position={[s * 0.065, 0.14, surf(0.14) + 0.014]} rotation={[0, 0, s * -0.55]}>
              <boxGeometry args={[0.04, 0.2, 0.02]} />
              <Toon color={avatar.shirt} />
            </mesh>
          ))}
          {[0.04, -0.06, -0.16].map((y, i) => (
            <mesh key={i} position={[0.04, y, surf(y) + 0.018]}>
              <sphereGeometry args={[0.02, 8, 8]} />
              <Toon color="#f1e3c0" />
            </mesh>
          ))}
        </>
      )
    case 'tuxedo':
      return (
        <>
          <mesh position={[0, -0.02, surf(-0.02) + 0.003]}>
            <boxGeometry args={[0.2, 0.46, 0.012]} />
            <Toon color={WHITE} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.08, 0.1, surf(0.1) + 0.012]} rotation={[0, 0, s * -0.4]}>
              <boxGeometry args={[0.055, 0.3, 0.025]} />
              <Toon color="#1f2025" />
            </mesh>
          ))}
          {[-1, 1].map((s) => (
            <mesh key={`b${s}`} position={[s * 0.05, 0.13, surf(0.13) + 0.022]} rotation={[0, 0, s * -Math.PI / 2]} scale={[1, 1, 0.6]}>
              <coneGeometry args={[0.05, 0.1, 3]} />
              <Toon color="#d94040" />
            </mesh>
          ))}
          <mesh position={[0, 0.13, surf(0.13) + 0.026]}>
            <sphereGeometry args={[0.025, 8, 8]} />
            <Toon color="#a82f2f" />
          </mesh>
          {[0.0, -0.1, -0.2].map((y, i) => (
            <mesh key={i} position={[0, y, surf(y) + 0.012]}>
              <sphereGeometry args={[0.016, 8, 8]} />
              <Toon color="#c9d2dc" />
            </mesh>
          ))}
        </>
      )
  }
  return null
}

// 새 치마·하의의 허리 아래 부분 (body 그룹의 자식)
export function HipMore({ bottom, color }: { bottom: string; color: string }) {
  if (bottom === 'pleated') {
    return (
      <group position={[0, -0.24, 0]}>
        <mesh>
          <cylinderGeometry args={[0.22, 0.43, 0.26, 16]} />
          <Toon color={color} />
        </mesh>
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2
          return (
            <mesh key={i} position={[Math.sin(a) * 0.33, 0, Math.cos(a) * 0.33]} rotation={[0, a, 0]}>
              <boxGeometry args={[0.012, 0.26, 0.05]} />
              <Toon color="#000000" opacity={0.15} />
            </mesh>
          )
        })}
        <mesh position={[0, 0.14, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.225, 0.025, 6, 20]} />
          <Toon color="#f4f4f4" />
        </mesh>
      </group>
    )
  }
  if (bottom === 'tutu') {
    const tiers: [number, number, string][] = [
      [-0.2, 0.3, '#ffd9ec'],
      [-0.27, 0.38, '#ffc6e2'],
      [-0.34, 0.46, '#ffb3d8'],
    ]
    return (
      <group>
        {tiers.map(([y, r, c], i) => (
          <group key={i} position={[0, y, 0]}>
            <mesh>
              <cylinderGeometry args={[r - 0.1, r, 0.1, 22]} />
              <Toon color={c} />
            </mesh>
            {Array.from({ length: 14 }, (_, k) => {
              const ang = (k / 14) * Math.PI * 2
              return (
                <mesh key={k} position={[Math.sin(ang) * r, -0.05, Math.cos(ang) * r]}>
                  <sphereGeometry args={[0.055, 8, 6]} />
                  <Toon color={c} />
                </mesh>
              )
            })}
          </group>
        ))}
        <mesh position={[0, -0.12, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.235, 0.03, 6, 20]} />
          <Toon color={color} />
        </mesh>
      </group>
    )
  }
  if (bottom === 'hanbokskirt') {
    return (
      <group>
        <mesh position={[0, -0.04, 0]}>
          <cylinderGeometry args={[0.28, 0.3, 0.08, 18]} />
          <Toon color="#fbf6ea" />
        </mesh>
        <mesh position={[0, -0.4, 0]}>
          <cylinderGeometry args={[0.28, 0.58, 0.68, 22]} />
          <Toon color={color} />
        </mesh>
        <mesh position={[0, -0.7, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.575, 0.025, 6, 26]} />
          <Toon color="#fbf6ea" />
        </mesh>
      </group>
    )
  }
  return null
}

// 바지 종류(카고·조거)의 한쪽 다리
export function PantsLeg({ bottom, color }: { bottom: string; color: string }) {
  return (
    <>
      <mesh position={[0, -0.12, 0]}>
        <capsuleGeometry args={[0.1, bottom === 'jogger' ? 0.1 : 0.12, 4, 8]} />
        <Toon color={color} />
      </mesh>
      {bottom === 'cargo' && (
        <>
          <mesh position={[0.105, -0.1, 0.02]}>
            <boxGeometry args={[0.04, 0.09, 0.09]} />
            <Toon color={color} />
          </mesh>
          <mesh position={[0.125, -0.06, 0.02]}>
            <boxGeometry args={[0.018, 0.02, 0.09]} />
            <Toon color="#000000" opacity={0.22} />
          </mesh>
        </>
      )}
      {bottom === 'jogger' && (
        <mesh position={[0, -0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.085, 0.03, 6, 14]} />
          <Toon color="#f4f4f4" />
        </mesh>
      )}
    </>
  )
}

export function ShoeMore({ style, color }: { style: string; color: string }) {
  switch (style) {
    case 'rainboots':
      return (
        <group>
          <mesh position={[0, -0.14, 0]}>
            <cylinderGeometry args={[0.105, 0.115, 0.22, 12]} />
            <Toon color={color} />
          </mesh>
          <mesh position={[0, -0.04, 0]}>
            <cylinderGeometry args={[0.118, 0.118, 0.04, 12]} />
            <Toon color="#f4f4f4" />
          </mesh>
          <mesh position={[0, -0.25, 0.06]} scale={[1, 0.7, 1.35]}>
            <sphereGeometry args={[0.12, 12, 10]} />
            <Toon color={color} />
          </mesh>
          <mesh position={[0, -0.29, 0.06]} scale={[1.06, 0.25, 1.42]}>
            <sphereGeometry args={[0.12, 12, 10]} />
            <Toon color="#f2c94e" />
          </mesh>
        </group>
      )
    case 'hightops':
      return (
        <group>
          <mesh position={[0, -0.16, 0.01]}>
            <capsuleGeometry args={[0.105, 0.1, 4, 8]} />
            <Toon color={color} />
          </mesh>
          <mesh position={[0, -0.23, 0.06]} scale={[1, 0.72, 1.35]}>
            <sphereGeometry args={[0.12, 12, 10]} />
            <Toon color={color} />
          </mesh>
          <mesh position={[0, -0.27, 0.06]} scale={[1.08, 0.3, 1.42]}>
            <sphereGeometry args={[0.12, 12, 10]} />
            <Toon color={WHITE} />
          </mesh>
          <mesh position={[0, -0.12, 0.1]}>
            <boxGeometry args={[0.16, 0.02, 0.03]} />
            <Toon color="#f4f4f4" />
          </mesh>
          <Shaped kind="star" size={0.04} color="#f4f4f4" position={[0.108, -0.14, 0.0]} rotation={[0, Math.PI / 2, 0]} depth={0.01} />
        </group>
      )
    case 'slippers':
      return (
        <group>
          <mesh position={[0, -0.23, 0.05]} scale={[1.1, 0.75, 1.45]}>
            <sphereGeometry args={[0.13, 14, 10]} />
            <Toon color={color} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.06, -0.15, 0.1]} rotation={[0.2, 0, s * 0.2]} scale={[0.6, 1.8, 0.5]}>
              <sphereGeometry args={[0.05, 8, 8]} />
              <Toon color={color} />
            </mesh>
          ))}
          <mesh position={[0, -0.22, 0.17]}>
            <sphereGeometry args={[0.03, 8, 8]} />
            <Toon color="#3a2a2a" />
          </mesh>
        </group>
      )
    case 'skates':
      return (
        <group>
          <mesh position={[0, -0.2, 0.04]} scale={[1, 0.75, 1.3]}>
            <sphereGeometry args={[0.12, 12, 10]} />
            <Toon color={color} />
          </mesh>
          <mesh position={[0, -0.28, 0.04]}>
            <boxGeometry args={[0.14, 0.03, 0.3]} />
            <Toon color="#2b2d33" />
          </mesh>
          {[-0.1, 0.11].map((z, i) => (
            <group key={i} position={[0, -0.32, 0.04 + z]}>
              {[-1, 1].map((s) => (
                <mesh key={s} position={[s * 0.07, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.035, 0.035, 0.025, 10]} />
                  <Toon color="#f2c94e" />
                </mesh>
              ))}
            </group>
          ))}
        </group>
      )
    case 'flowershoes':
      return (
        <group>
          <mesh position={[0, -0.24, 0.05]} scale={[0.95, 0.6, 1.3]}>
            <sphereGeometry args={[0.12, 12, 10]} />
            <Toon color={color} />
          </mesh>
          <mesh position={[0, -0.22, 0.2]} rotation={[-0.9, 0, 0]}>
            <coneGeometry args={[0.055, 0.15, 8]} />
            <Toon color={color} />
          </mesh>
          <mesh position={[0, -0.18, 0.1]}>
            <sphereGeometry args={[0.03, 8, 8]} />
            <Glow color="#fff1a8" />
          </mesh>
          <mesh position={[0, -0.28, 0.05]} scale={[1, 0.2, 1.3]}>
            <sphereGeometry args={[0.12, 10, 8]} />
            <Toon color="#fbf6ea" />
          </mesh>
        </group>
      )
  }
  return null
}

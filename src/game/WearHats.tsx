import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Toon, Glow, WHITE, Dome, HairBase, Shaped } from './wearKit'
import { OmokCrown } from './OmokCrown'

// 새 모자·머리 모양. 머리(head) 그룹의 자식으로 그린다 (머리 반지름 0.5, 정수리 y≈0.47).

export const NEW_HATS = new Set([
  'cowboy', 'santa', 'ninja', 'bucket', 'beret', 'tophat', 'knight', 'viking', 'mushroom', 'sprout',
  'unicorn', 'police', 'catears', 'flowercrown', 'strawberry', 'graduation',
  // 예전 모자를 새로 그린 것
  'omok1', 'omok2', 'omok3', 'pirate', 'wizard', 'crown', 'headphones', 'horns', 'halo', 'straw', 'party', 'chef', 'beanie', 'cap', 'bunny',
])
export const NEW_HAIR = new Set(['ponytail', 'twinbuns', 'afro', 'mohawk', 'bob', 'curly', 'braid'])

function Sprout() {
  const g = useRef<THREE.Group>(null)
  useFrame((s) => {
    if (g.current) g.current.rotation.z = Math.sin(s.clock.elapsedTime * 2.2) * 0.12
  })
  return (
    <group ref={g} position={[0, 0.46, 0]}>
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.025, 0.035, 0.22, 8]} />
        <Toon color="#4f9a3f" />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.12, 0.24, 0]} rotation={[0, 0, s * -0.7]} scale={[1.5, 0.55, 0.5]}>
          <sphereGeometry args={[0.1, 12, 10]} />
          <Toon color={s > 0 ? '#79c85a' : '#5fb44a'} />
        </mesh>
      ))}
    </group>
  )
}

export function HatMore({ id }: { id: string }) {
  switch (id) {
    case 'pirate':
      return (
        <group position={[0, 0.5, 0]}>
          <mesh position={[0, 0.08, 0]} scale={[1, 0.8, 1]}>
            <sphereGeometry args={[0.38, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
            <Toon color="#1f2025" />
          </mesh>
          {/* 세 갈래로 접어 올린 챙 */}
          <mesh position={[0, 0.0, 0]} rotation={[0, Math.PI / 6, 0]}>
            <cylinderGeometry args={[0.66, 0.66, 0.05, 3]} />
            <Toon color="#1f2025" />
          </mesh>
          <mesh position={[0, 0.03, 0]} rotation={[0, Math.PI / 6, 0]}>
            <cylinderGeometry args={[0.68, 0.68, 0.015, 3]} />
            <Toon color="#e3b93a" />
          </mesh>
          <mesh position={[0, 0.07, 0]} rotation={[0, Math.PI / 6, 0]}>
            <cylinderGeometry args={[0.62, 0.62, 0.05, 3]} />
            <Toon color="#2b2c33" />
          </mesh>
          {/* 해골 표시 */}
          <mesh position={[0, 0.12, 0.38]} scale={[1, 0.9, 0.5]}>
            <sphereGeometry args={[0.08, 12, 10]} />
            <Toon color="#f6f1e4" />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.03, 0.13, 0.42]}>
              <sphereGeometry args={[0.014, 6, 6]} />
              <Glow color="#15161a" />
            </mesh>
          ))}
          {[-1, 1].map((s) => (
            <mesh key={`b${s}`} position={[0, 0.06, 0.4]} rotation={[0, 0, s * 0.7]}>
              <boxGeometry args={[0.2, 0.025, 0.02]} />
              <Toon color="#f6f1e4" />
            </mesh>
          ))}
        </group>
      )
    case 'wizard':
      return (
        <group position={[0, 0.46, 0]}>
          <mesh>
            <cylinderGeometry args={[0.66, 0.66, 0.04, 28]} />
            <Toon color="#4b3a9e" />
          </mesh>
          <mesh position={[0, 0.3, 0]}>
            <coneGeometry args={[0.36, 0.6, 20]} />
            <Toon color="#5a48b8" />
          </mesh>
          <mesh position={[0.06, 0.68, -0.02]} rotation={[0, 0, -0.25]}>
            <coneGeometry args={[0.22, 0.46, 18]} />
            <Toon color="#5a48b8" />
          </mesh>
          <mesh position={[0.2, 0.98, -0.06]} rotation={[0, 0, -0.75]}>
            <coneGeometry args={[0.12, 0.3, 14]} />
            <Toon color="#5a48b8" />
          </mesh>
          <mesh position={[0, 0.04, 0]}>
            <cylinderGeometry args={[0.37, 0.4, 0.1, 22]} />
            <Toon color="#f2c94e" />
          </mesh>
          <Shaped kind="star" size={0.07} color="#ffe27a" glow position={[0.0, 0.34, 0.33]} depth={0.02} />
          <Shaped kind="star" size={0.045} color="#ffe27a" glow position={[0.16, 0.5, 0.26]} depth={0.02} />
          <Shaped kind="star" size={0.04} color="#ffe27a" glow position={[-0.14, 0.22, 0.34]} depth={0.02} />
        </group>
      )
    case 'crown':
      return (
        <group position={[0, 0.5, 0]}>
          <mesh>
            <cylinderGeometry args={[0.4, 0.37, 0.16, 20]} />
            <Toon color="#f2c94e" emissive="#f2c94e" ei={0.15} />
          </mesh>
          <mesh position={[0, -0.05, 0]}>
            <cylinderGeometry args={[0.405, 0.405, 0.03, 20]} />
            <Toon color="#c9992b" />
          </mesh>
          {[0, 1, 2, 3, 4].map((i) => {
            const a = (i / 5) * Math.PI * 2
            const gem = ['#e0405a', '#4a90e2', '#52c27a', '#e0405a', '#4a90e2'][i]
            return (
              <group key={i} position={[Math.sin(a) * 0.38, 0.08, Math.cos(a) * 0.38]}>
                <mesh position={[0, 0.1, 0]}>
                  <coneGeometry args={[0.085, 0.24, 8]} />
                  <Toon color="#f2c94e" emissive="#f2c94e" ei={0.15} />
                </mesh>
                <mesh position={[0, 0.25, 0]}>
                  <sphereGeometry args={[0.04, 8, 8]} />
                  <Toon color={gem} emissive={gem} ei={0.4} />
                </mesh>
              </group>
            )
          })}
          {[0, 1, 2, 3, 4].map((i) => {
            const a = ((i + 0.5) / 5) * Math.PI * 2
            return (
              <mesh key={`g${i}`} position={[Math.sin(a) * 0.4, 0.0, Math.cos(a) * 0.4]}>
                <sphereGeometry args={[0.035, 8, 8]} />
                <Toon color="#e0405a" emissive="#e0405a" ei={0.4} />
              </mesh>
            )
          })}
        </group>
      )
    case 'headphones':
      return (
        <group position={[0, 0.12, 0]}>
          <mesh position={[0, 0.34, -0.02]} scale={[1.02, 1, 1]}>
            <torusGeometry args={[0.55, 0.055, 10, 28, Math.PI]} />
            <Toon color="#2b2b30" />
          </mesh>
          {[-1, 1].map((s) => (
            <group key={s} position={[s * 0.53, 0.02, 0]}>
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.19, 0.19, 0.12, 20]} />
                <Toon color="#e05252" />
              </mesh>
              <mesh position={[s * -0.07, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.16, 0.16, 0.05, 20]} />
                <Toon color="#3a3a42" />
              </mesh>
              <mesh position={[s * 0.066, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.1, 0.1, 0.02, 16]} />
                <Toon color="#f4f4f4" />
              </mesh>
            </group>
          ))}
        </group>
      )
    case 'horns':
      return (
        <group position={[0, 0.34, -0.02]}>
          {[-1, 1].map((s) => (
            <group key={s} position={[s * 0.27, 0.12, 0]} rotation={[0, 0, s * -0.45]} scale={1.5}>
              <mesh position={[0, 0.1, 0]}>
                <coneGeometry args={[0.1, 0.26, 10]} />
                <Toon color="#e3a33f" />
              </mesh>
              <mesh position={[s * 0.06, 0.28, 0]} rotation={[0, 0, s * -0.5]}>
                <coneGeometry args={[0.07, 0.24, 10]} />
                <Toon color="#f1c050" />
              </mesh>
              {[0.04, 0.12].map((y, i) => (
                <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
                  <torusGeometry args={[0.095 - i * 0.012, 0.012, 6, 14]} />
                  <Toon color="#c9852c" />
                </mesh>
              ))}
            </group>
          ))}
        </group>
      )
    case 'halo':
      return (
        <group position={[0, 0.78, -0.02]} rotation={[-Math.PI / 2 + 0.25, 0, 0]}>
          <mesh>
            <torusGeometry args={[0.28, 0.05, 12, 30]} />
            <Toon color="#fff0a0" emissive="#ffe27a" ei={1.2} />
          </mesh>
          <mesh>
            <torusGeometry args={[0.28, 0.085, 8, 30]} />
            <Toon color="#fff3b0" opacity={0.5} />
          </mesh>
        </group>
      )
    case 'straw':
      return (
        <group position={[0, 0.44, 0]}>
          <mesh>
            <cylinderGeometry args={[0.7, 0.58, 0.06, 28]} />
            <Toon color="#e9cc7a" />
          </mesh>
          {[0.45, 0.55, 0.65].map((r, i) => (
            <mesh key={i} position={[0, 0.032, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[r, 0.008, 4, 36]} />
              <Toon color="#c9a85a" />
            </mesh>
          ))}
          <mesh position={[0, 0.14, 0]} scale={[1, 0.85, 1]}>
            <sphereGeometry args={[0.36, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
            <Toon color="#dcbc66" />
          </mesh>
          <mesh position={[0, 0.07, 0]}>
            <cylinderGeometry args={[0.365, 0.38, 0.09, 22]} />
            <Toon color="#d94a4a" />
          </mesh>
          <mesh position={[0.26, 0.09, 0.26]} scale={[1, 1, 0.5]}>
            <sphereGeometry args={[0.07, 8, 8]} />
            <Toon color="#fdf1fa" />
          </mesh>
        </group>
      )
    case 'party':
      return (
        <group position={[0, 0.5, 0]}>
          <mesh position={[0, 0.3, 0]}>
            <coneGeometry args={[0.27, 0.66, 18]} />
            <Toon color="#f2955b" />
          </mesh>
          {[0.14, 0.3, 0.46].map((y, i) => (
            <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.22 - i * 0.07, 0.022, 6, 22]} />
              <Toon color={['#5b8dd6', '#f2c94e', '#e86a9c'][i]} />
            </mesh>
          ))}
          {(
            [
              [0.15, 0.18, 0.18], [-0.17, 0.2, 0.12], [0.02, 0.4, 0.14], [-0.1, 0.1, 0.24], [0.2, 0.08, -0.14], [-0.12, 0.3, -0.12],
            ] as [number, number, number][]
          ).map(([x, y, z], i) => (
            <mesh key={`d${i}`} position={[x, y, z]}>
              <sphereGeometry args={[0.022, 6, 6]} />
              <Toon color={['#ffffff', '#7fd6ff', '#fff6a8'][i % 3]} />
            </mesh>
          ))}
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i / 8) * Math.PI * 2
            return (
              <mesh key={`p${i}`} position={[Math.cos(a) * 0.045, 0.66 + Math.sin(a) * 0.045, 0]}>
                <sphereGeometry args={[0.04, 6, 6]} />
                <Toon color={['#ff7aa8', '#ffd36e', '#7fd6ff', '#9be07a'][i % 4]} />
              </mesh>
            )
          })}
        </group>
      )
    case 'chef':
      return (
        <group position={[0, 0.44, 0]}>
          <mesh>
            <cylinderGeometry args={[0.36, 0.38, 0.2, 22]} />
            <Toon color={WHITE} />
          </mesh>
          {Array.from({ length: 9 }, (_, i) => {
            const a = (i / 9) * Math.PI * 2
            return (
              <mesh key={i} position={[Math.sin(a) * 0.35, 0.0, Math.cos(a) * 0.35]}>
                <boxGeometry args={[0.012, 0.2, 0.02]} />
                <Toon color="#000000" opacity={0.1} />
              </mesh>
            )
          })}
          {Array.from({ length: 6 }, (_, i) => {
            const a = (i / 6) * Math.PI * 2
            return (
              <mesh key={`p${i}`} position={[Math.sin(a) * 0.22, 0.2, Math.cos(a) * 0.22]}>
                <sphereGeometry args={[0.2, 14, 12]} />
                <Toon color={WHITE} />
              </mesh>
            )
          })}
          <mesh position={[0, 0.3, 0]}>
            <sphereGeometry args={[0.26, 14, 12]} />
            <Toon color={WHITE} />
          </mesh>
        </group>
      )
    case 'beanie':
      return (
        <group position={[0, 0.34, 0]}>
          <mesh scale={[1.04, 0.95, 1.04]}>
            <sphereGeometry args={[0.45, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
            <Toon color="#4c7bd6" />
          </mesh>
          <mesh position={[0, -0.02, 0]}>
            <cylinderGeometry args={[0.45, 0.46, 0.15, 24]} />
            <Toon color="#3a63b0" />
          </mesh>
          {Array.from({ length: 16 }, (_, i) => {
            const a = (i / 16) * Math.PI * 2
            return (
              <mesh key={i} position={[Math.sin(a) * 0.455, -0.02, Math.cos(a) * 0.455]}>
                <boxGeometry args={[0.014, 0.15, 0.02]} />
                <Toon color="#000000" opacity={0.18} />
              </mesh>
            )
          })}
          <mesh position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.43, 0.025, 6, 24]} />
            <Toon color="#f4f4f4" />
          </mesh>
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const a = (i / 6) * Math.PI * 2
            return (
              <mesh key={`f${i}`} position={[Math.sin(a) * 0.06, 0.5 + Math.cos(a) * 0.04, Math.cos(a) * 0.05]}>
                <sphereGeometry args={[0.07, 8, 8]} />
                <Toon color={WHITE} />
              </mesh>
            )
          })}
          <mesh position={[0, 0.5, 0]}>
            <sphereGeometry args={[0.09, 10, 8]} />
            <Toon color={WHITE} />
          </mesh>
        </group>
      )
    case 'cap':
      return (
        <group position={[0, 0.4, 0]}>
          <mesh scale={[1.02, 0.78, 1.02]}>
            <sphereGeometry args={[0.46, 22, 14, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
            <Toon color="#e05252" />
          </mesh>
          <mesh position={[0, -0.01, 0.0]}>
            <cylinderGeometry args={[0.465, 0.465, 0.05, 24]} />
            <Toon color="#c53f3f" />
          </mesh>
          {/* 앞 챙: 둥글게 휜 모양 */}
          <mesh position={[0, -0.02, 0.38]} rotation={[0.12, 0, 0]} scale={[1, 0.18, 1]}>
            <sphereGeometry args={[0.3, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <Toon color="#c53f3f" />
          </mesh>
          <mesh position={[0, 0.17, 0]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <Toon color="#c53f3f" />
          </mesh>
          <Shaped kind="star" size={0.075} color="#fff6d5" position={[0, 0.1, 0.43]} rotation={[0.25, 0, 0]} depth={0.015} />
        </group>
      )
    case 'bunny':
      return (
        <group position={[0, 0.4, -0.02]}>
          <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.44, 0.04, 8, 22, Math.PI]} />
            <Toon color="#f2a4c8" />
          </mesh>
          {[-1, 1].map((s) => (
            <group key={s} position={[s * 0.17, 0.12, 0]} rotation={[0, 0, s * 0.22]}>
              <mesh position={[0, 0.2, 0]} scale={[0.5, 1.5, 0.38]}>
                <sphereGeometry args={[0.15, 12, 12]} />
                <Toon color={WHITE} />
              </mesh>
              <mesh position={[0, 0.21, 0.04]} scale={[0.3, 1.2, 0.3]}>
                <sphereGeometry args={[0.15, 10, 10]} />
                <Toon color="#f7c4d9" />
              </mesh>
              <group position={[0, 0.42, 0]} rotation={[0, 0, s * 0.6]}>
                <mesh position={[0, 0.1, 0]} scale={[0.5, 1.2, 0.38]}>
                  <sphereGeometry args={[0.13, 12, 12]} />
                  <Toon color={WHITE} />
                </mesh>
              </group>
            </group>
          ))}
        </group>
      )
    case 'omok1':
      return <OmokCrown tier={1} />
    case 'omok2':
      return <OmokCrown tier={2} />
    case 'omok3':
      return <OmokCrown tier={3} />
    case 'cowboy':
      return (
        <group position={[0, 0.4, 0]}>
          <mesh>
            <cylinderGeometry args={[0.64, 0.64, 0.04, 24]} />
            <Toon color="#b97a3f" />
          </mesh>
          {/* 챙 양옆을 위로 말아 올린 느낌 */}
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.6, 0.06, 0]} rotation={[0, 0, s * -0.5]} scale={[0.3, 0.05, 0.9]}>
              <sphereGeometry args={[0.3, 10, 8]} />
              <Toon color="#b97a3f" />
            </mesh>
          ))}
          <mesh position={[0, 0.17, 0]}>
            <cylinderGeometry args={[0.27, 0.34, 0.3, 18]} />
            <Toon color="#a66b3a" />
          </mesh>
          <mesh position={[0, 0.34, 0]} scale={[1, 0.35, 1]}>
            <sphereGeometry args={[0.27, 16, 10]} />
            <Toon color="#a66b3a" />
          </mesh>
          <mesh position={[0, 0.07, 0]}>
            <cylinderGeometry args={[0.345, 0.355, 0.07, 18]} />
            <Toon color="#5a3a1e" />
          </mesh>
          <Shaped kind="star" size={0.07} color="#f2c94e" position={[0, 0.09, 0.36]} />
        </group>
      )
    case 'santa':
      return (
        <group position={[0, 0.3, 0]}>
          <mesh scale={[1.04, 0.9, 1.04]}>
            <sphereGeometry args={[0.45, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
            <Toon color="#d93a3a" />
          </mesh>
          <mesh position={[0, 0.38, -0.2]} rotation={[-0.75, 0, 0]}>
            <coneGeometry args={[0.28, 0.62, 16]} />
            <Toon color="#d93a3a" />
          </mesh>
          <mesh position={[0, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.43, 0.09, 10, 24]} />
            <Toon color={WHITE} />
          </mesh>
          <mesh position={[0, 0.5, -0.56]}>
            <sphereGeometry args={[0.1, 12, 10]} />
            <Toon color={WHITE} />
          </mesh>
        </group>
      )
    case 'ninja':
      return (
        <group position={[0, 0.2, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1.02, 1.02, 1]}>
            <torusGeometry args={[0.49, 0.08, 10, 28]} />
            <Toon color="#2b3a5a" />
          </mesh>
          <mesh position={[0, 0, 0.55]}>
            <boxGeometry args={[0.26, 0.15, 0.03]} />
            <Toon color="#c9d2dc" />
          </mesh>
          <Shaped kind="star" size={0.05} color="#7a8896" position={[0, 0, 0.575]} depth={0.01} />
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.1, -0.06, -0.62]} rotation={[0.5, 0, s * 0.35]}>
              <boxGeometry args={[0.1, 0.4, 0.03]} />
              <Toon color="#2b3a5a" />
            </mesh>
          ))}
        </group>
      )
    case 'bucket':
      return (
        <group position={[0, 0.34, 0]}>
          <mesh position={[0, 0.14, 0]}>
            <cylinderGeometry args={[0.38, 0.45, 0.28, 22]} />
            <Toon color="#c9b98a" />
          </mesh>
          <mesh position={[0, 0.28, 0]}>
            <cylinderGeometry args={[0.36, 0.38, 0.03, 22]} />
            <Toon color="#b8a878" />
          </mesh>
          <mesh position={[0, 0.0, 0]}>
            <cylinderGeometry args={[0.6, 0.5, 0.045, 24]} />
            <Toon color="#c9b98a" />
          </mesh>
          <mesh position={[0, 0.04, 0]}>
            <cylinderGeometry args={[0.455, 0.47, 0.05, 22]} />
            <Toon color="#6d8fbf" />
          </mesh>
        </group>
      )
    case 'beret':
      return (
        <group position={[0.06, 0.42, 0.02]} rotation={[0.08, 0, -0.22]}>
          <mesh scale={[1.18, 0.5, 1.12]}>
            <sphereGeometry args={[0.42, 20, 12]} />
            <Toon color="#b8323a" />
          </mesh>
          <mesh position={[0, 0.22, 0]}>
            <cylinderGeometry args={[0.025, 0.04, 0.1, 8]} />
            <Toon color="#7a1f26" />
          </mesh>
        </group>
      )
    case 'tophat':
      return (
        <group position={[0, 0.44, 0]}>
          <mesh>
            <cylinderGeometry args={[0.52, 0.52, 0.04, 24]} />
            <Toon color="#25262b" />
          </mesh>
          <mesh position={[0, 0.25, 0]}>
            <cylinderGeometry args={[0.31, 0.33, 0.46, 22]} />
            <Toon color="#2f3036" />
          </mesh>
          <mesh position={[0, 0.07, 0]}>
            <cylinderGeometry args={[0.335, 0.34, 0.1, 22]} />
            <Toon color="#9b3cc8" />
          </mesh>
          <Shaped kind="star" size={0.055} color="#f2c94e" position={[0, 0.07, 0.345]} depth={0.015} />
        </group>
      )
    case 'knight':
      return (
        <group position={[0, 0.0, 0]}>
          <Dome color="#b9c2cc" r={0.54} y={0.14} z={-0.04} cover={0.5} scale={[1.02, 0.95, 1.04]} />
          <mesh position={[0, 0.2, 0.5]} scale={[1, 1, 1]}>
            <boxGeometry args={[0.07, 0.34, 0.05]} />
            <Toon color="#a3adb8" />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.5, -0.1, 0.02]} rotation={[0, 0, s * 0.05]}>
              <boxGeometry args={[0.07, 0.4, 0.34]} />
              <Toon color="#a3adb8" />
            </mesh>
          ))}
          <mesh position={[0, 0.56, -0.02]} scale={[0.4, 0.7, 1.3]}>
            <sphereGeometry args={[0.16, 12, 10]} />
            <Toon color="#d93a3a" />
          </mesh>
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.05, 0.07, 0.1, 8]} />
            <Toon color="#8f99a4" />
          </mesh>
        </group>
      )
    case 'viking':
      return (
        <group position={[0, 0.34, 0]}>
          <mesh scale={[1.02, 0.85, 1.02]}>
            <sphereGeometry args={[0.45, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
            <Toon color="#9aa3ad" />
          </mesh>
          <mesh position={[0, 0.0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.44, 0.05, 8, 24]} />
            <Toon color="#7a5532" />
          </mesh>
          {[-1, 1].map((s) => (
            <group key={s} position={[s * 0.44, 0.08, 0]} rotation={[0, 0, s * -0.9]}>
              <mesh position={[0, 0.16, 0]}>
                <coneGeometry args={[0.09, 0.4, 10]} />
                <Toon color="#f1e7cf" />
              </mesh>
            </group>
          ))}
        </group>
      )
    case 'mushroom':
      return (
        <group position={[0, 0.36, 0]}>
          <mesh scale={[1.3, 0.85, 1.3]}>
            <sphereGeometry args={[0.46, 22, 14, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
            <Toon color="#d9443c" />
          </mesh>
          {(
            [
              [0, 0.36, 0, 0.09],
              [0.28, 0.27, 0.22, 0.075],
              [-0.3, 0.26, 0.2, 0.08],
              [0.12, 0.22, 0.45, 0.07],
              [-0.2, 0.2, -0.42, 0.075],
              [0.34, 0.2, -0.28, 0.065],
            ] as [number, number, number, number][]
          ).map(([x, y, z, r], i) => (
            <mesh key={i} position={[x, y, z]} scale={[1, 0.5, 1]}>
              <sphereGeometry args={[r, 10, 8]} />
              <Toon color={WHITE} />
            </mesh>
          ))}
        </group>
      )
    case 'sprout':
      return <Sprout />
    case 'unicorn':
      return (
        <group position={[0, 0.38, 0.02]}>
          <mesh position={[0, 0.02, -0.02]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.43, 0.035, 8, 22, Math.PI]} />
            <Toon color="#f7b6d8" />
          </mesh>
          <group position={[0, 0.22, 0.22]} rotation={[0.3, 0, 0]}>
            <mesh position={[0, 0.2, 0]}>
              <coneGeometry args={[0.075, 0.42, 12]} />
              <Toon color="#ffe27a" emissive="#ffe27a" ei={0.3} />
            </mesh>
            {[0.06, 0.15, 0.24].map((y, i) => (
              <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.065 - i * 0.016, 0.012, 6, 14]} />
                <Toon color="#e0b53a" />
              </mesh>
            ))}
          </group>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.2, 0.14, -0.02]} rotation={[0, 0, s * -0.3]}>
              <coneGeometry args={[0.07, 0.2, 8]} />
              <Toon color="#fdf1fa" />
            </mesh>
          ))}
          {(['#ff8fb1', '#ffd36e', '#7fd6a4', '#8ec5ff'] as string[]).map((c, i) => (
            <mesh key={c} position={[-0.3 + i * 0.2, 0.08, -0.08]}>
              <sphereGeometry args={[0.05, 8, 8]} />
              <Toon color={c} />
            </mesh>
          ))}
        </group>
      )
    case 'police':
      return (
        <group position={[0, 0.38, 0]}>
          <mesh position={[0, 0.1, 0]}>
            <cylinderGeometry args={[0.36, 0.42, 0.24, 20]} />
            <Toon color="#27406e" />
          </mesh>
          <mesh position={[0, 0.23, 0]}>
            <cylinderGeometry args={[0.46, 0.4, 0.05, 20]} />
            <Toon color="#27406e" />
          </mesh>
          <mesh position={[0, 0.0, 0.4]} rotation={[0.25, 0, 0]} scale={[1, 0.2, 1]}>
            <sphereGeometry args={[0.28, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <Toon color="#15161a" />
          </mesh>
          <Shaped kind="star" size={0.07} color="#f2c94e" position={[0, 0.12, 0.43]} depth={0.02} />
        </group>
      )
    case 'catears':
      return (
        <group position={[0, 0.36, -0.02]}>
          <mesh position={[0, 0.0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.43, 0.04, 8, 22, Math.PI]} />
            <Toon color="#2b2b30" />
          </mesh>
          {[-1, 1].map((s) => (
            <group key={s} position={[s * 0.27, 0.22, 0]} rotation={[0, 0, s * -0.25]}>
              <mesh>
                <coneGeometry args={[0.14, 0.3, 4]} />
                <Toon color="#2b2b30" />
              </mesh>
              <mesh position={[0, -0.02, 0.05]} scale={[0.55, 0.7, 0.4]}>
                <coneGeometry args={[0.13, 0.24, 4]} />
                <Toon color="#f4a6bd" />
              </mesh>
            </group>
          ))}
        </group>
      )
    case 'flowercrown': {
      const cols = ['#ff8fb1', '#ffd36e', '#fdf1fa', '#b39df0', '#ff8fb1', '#ffd36e', '#fdf1fa', '#b39df0', '#ff8fb1']
      return (
        <group position={[0, 0.3, -0.02]} rotation={[0.18, 0, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.47, 0.035, 8, 28]} />
            <Toon color="#5aa44a" />
          </mesh>
          {cols.map((c, i) => {
            const a = (i / cols.length) * Math.PI * 2
            return (
              <group key={i} position={[Math.cos(a) * 0.47, 0.03, Math.sin(a) * 0.47]}>
                {[0, 1, 2, 3, 4].map((k) => {
                  const b = (k / 5) * Math.PI * 2
                  return (
                    <mesh key={k} position={[Math.cos(b) * 0.045, 0.01, Math.sin(b) * 0.045]}>
                      <sphereGeometry args={[0.036, 6, 6]} />
                      <Toon color={c} />
                    </mesh>
                  )
                })}
                <mesh position={[0, 0.02, 0]}>
                  <sphereGeometry args={[0.028, 6, 6]} />
                  <Toon color="#f2c14e" />
                </mesh>
              </group>
            )
          })}
        </group>
      )
    }
    case 'strawberry':
      return (
        <group position={[0, 0.5, 0]}>
          <mesh scale={[0.95, 1.05, 0.95]}>
            <sphereGeometry args={[0.36, 18, 14]} />
            <Toon color="#e23b52" />
          </mesh>
          {(
            [
              [0.18, 0.1, 0.28], [-0.2, 0.05, 0.27], [0.0, 0.2, 0.31], [0.3, -0.05, 0.16], [-0.3, -0.08, 0.14],
              [0.1, -0.1, 0.34], [-0.1, -0.12, 0.33], [0.28, 0.12, -0.2], [-0.28, 0.1, -0.2],
            ] as [number, number, number][]
          ).map(([x, y, z], i) => (
            <mesh key={i} position={[x, y, z]} scale={[0.7, 1.2, 0.5]}>
              <sphereGeometry args={[0.022, 6, 6]} />
              <Toon color="#ffe27a" />
            </mesh>
          ))}
          {[0, 1, 2, 3, 4].map((i) => {
            const a = (i / 5) * Math.PI * 2
            return (
              <mesh
                key={i}
                position={[Math.cos(a) * 0.17, 0.36, Math.sin(a) * 0.17]}
                rotation={[Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9]}
                scale={[1, 0.4, 1]}
              >
                <coneGeometry args={[0.09, 0.22, 4]} />
                <Toon color="#58a845" />
              </mesh>
            )
          })}
        </group>
      )
    case 'graduation':
      return (
        <group position={[0, 0.46, 0]}>
          <mesh position={[0, 0.0, 0]}>
            <cylinderGeometry args={[0.3, 0.34, 0.14, 18]} />
            <Toon color="#25262b" />
          </mesh>
          <mesh position={[0, 0.1, 0]} rotation={[0, Math.PI / 4, 0]}>
            <boxGeometry args={[0.92, 0.045, 0.92]} />
            <Toon color="#2f3036" />
          </mesh>
          <mesh position={[0, 0.125, 0]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <Toon color="#f2c94e" />
          </mesh>
          <mesh position={[0.2, 0.1, 0.2]} rotation={[0, 0, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 0.02, 4]} />
            <Toon color="#f2c94e" />
          </mesh>
          <mesh position={[0.46, 0.0, 0.04]} rotation={[0.15, 0, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.3, 6]} />
            <Toon color="#f2c94e" />
          </mesh>
          <mesh position={[0.46, -0.18, 0.05]}>
            <coneGeometry args={[0.04, 0.1, 8]} />
            <Toon color="#f2c94e" />
          </mesh>
          <mesh position={[0.2, 0.1, 0.0]} rotation={[0, 0, -1.4]}>
            <cylinderGeometry args={[0.008, 0.008, 0.5, 4]} />
            <Toon color="#f2c94e" />
          </mesh>
        </group>
      )
  }
  return null
}

export function HairMore({ style, color }: { style: string; color: string }) {
  switch (style) {
    case 'ponytail':
      return (
        <group>
          <HairBase color={color} />
          <mesh position={[0, 0.16, -0.5]}>
            <sphereGeometry args={[0.1, 10, 8]} />
            <Toon color="#e86a9c" />
          </mesh>
          <mesh position={[0, -0.04, -0.58]} rotation={[0.22, 0, 0]} scale={[1, 1.9, 1]}>
            <capsuleGeometry args={[0.1, 0.2, 4, 10]} />
            <Toon color={color} />
          </mesh>
        </group>
      )
    case 'twinbuns':
      return (
        <group>
          <HairBase color={color} />
          {[-1, 1].map((s) => (
            <group key={s}>
              <mesh position={[s * 0.3, 0.46, -0.06]}>
                <sphereGeometry args={[0.18, 14, 12]} />
                <Toon color={color} />
              </mesh>
              <mesh position={[s * 0.3, 0.34, -0.06]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.11, 0.025, 6, 14]} />
                <Toon color="#e86a9c" />
              </mesh>
            </group>
          ))}
        </group>
      )
    case 'afro':
      return (
        <group>
          <mesh position={[0, 0.16, -0.1]} scale={[1.14, 1.0, 1.04]}>
            <sphereGeometry args={[0.6, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.56]} />
            <Toon color={color} />
          </mesh>
          <mesh position={[0, -0.02, -0.22]} scale={[1.12, 1.0, 0.8]}>
            <sphereGeometry args={[0.55, 20, 16]} />
            <Toon color={color} />
          </mesh>
        </group>
      )
    case 'mohawk':
      return (
        <group>
          <Dome color={color} cover={0.4} y={0.1} scale={[1.02, 0.7, 1.02]} />
          {[0.38, 0.28, 0.16, 0.02, -0.14, -0.28].map((z, i) => (
            <mesh key={i} position={[0, 0.5 - Math.abs(z) * 0.2 - i * 0.015, z]} rotation={[0.05 * i, 0, 0]}>
              <coneGeometry args={[0.085, 0.36 - i * 0.015, 6]} />
              <Toon color={['#ff6f91', '#ff9671', '#ffc75f', '#f9f871', '#8fe3a1', '#6fc2ff'][i]} />
            </mesh>
          ))}
        </group>
      )
    case 'bob':
      return (
        <group>
          <HairBase color={color} />
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.42, -0.14, -0.02]} scale={[0.5, 1, 0.9]}>
              <sphereGeometry args={[0.3, 14, 12]} />
              <Toon color={color} />
            </mesh>
          ))}
          <mesh position={[0, -0.18, -0.34]} scale={[1.0, 0.8, 0.6]}>
            <sphereGeometry args={[0.42, 16, 12]} />
            <Toon color={color} />
          </mesh>
          <mesh position={[0, 0.28, 0.4]} scale={[1.2, 0.35, 0.5]}>
            <sphereGeometry args={[0.3, 14, 10]} />
            <Toon color={color} />
          </mesh>
        </group>
      )
    case 'curly': {
      const pts: [number, number, number][] = []
      for (let i = 0; i < 16; i++) {
        const a = i * 2.399
        const t = Math.sqrt((i + 0.5) / 16)
        const polar = t * Math.PI * 0.42
        pts.push([Math.sin(polar) * Math.cos(a) * 0.52, 0.16 + Math.cos(polar) * 0.5, Math.sin(polar) * Math.sin(a) * 0.52 - 0.1])
      }
      return (
        <group>
          <Dome color={color} cover={0.5} y={0.1} />
          {pts.map(([x, y, z], i) => (
            <mesh key={i} position={[x, y, z]}>
              <sphereGeometry args={[0.15, 10, 8]} />
              <Toon color={color} />
            </mesh>
          ))}
        </group>
      )
    }
    case 'braid':
      return (
        <group>
          <HairBase color={color} />
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh key={i} position={[0.0, 0.0 - i * 0.14, -0.5 - i * 0.015]} scale={[1 - i * 0.06, 0.85, 0.9]}>
              <sphereGeometry args={[0.12, 10, 8]} />
              <Toon color={color} />
            </mesh>
          ))}
          <mesh position={[0, -0.68, -0.58]}>
            <sphereGeometry args={[0.055, 8, 8]} />
            <Glow color="#e86a9c" />
          </mesh>
        </group>
      )
  }
  return null
}

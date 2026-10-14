import { COSTUME_COLORS } from './Character'
import { Toon } from './wearKit'
import { rideOf } from './rides'
import type { Avatar } from './avatar'

// 멀리 있는 친구를 그리는 단순한 모습 — 도형 몇 개만 써서 여러 명이 있어도 가볍다.
// (몸 색·머리 색·피부색만 살려서 누구인지 대충 알아볼 수 있게)
export function SimpleFigure({ avatar }: { avatar: Avatar }) {
  const cos = avatar.costume ? COSTUME_COLORS[avatar.costume] : null
  const body = cos ? cos.body : avatar.shirt
  const legs = cos ? (cos.limb ?? cos.body) : avatar.pants
  const head = cos ? cos.body : avatar.skin
  const ride = rideOf(avatar.ride)
  const lift = ride ? ride.seat : 0
  return (
    <group position={[0, lift, 0]}>
      {ride && (
        <mesh position={[0, 0.1 - lift, 0]}>
          <boxGeometry args={[0.5, 0.12, 1.0]} />
          <Toon color="#7a86a0" />
        </mesh>
      )}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.14, 0.16, 0]}>
          <capsuleGeometry args={[0.09, 0.12, 2, 6]} />
          <Toon color={legs} />
        </mesh>
      ))}
      <mesh position={[0, 0.58, 0]}>
        <capsuleGeometry args={[0.29, 0.16, 3, 8]} />
        <Toon color={body} />
      </mesh>
      <mesh position={[0, 1.12, 0]} scale={[1, 0.94, 0.96]}>
        <sphereGeometry args={[0.5, 12, 10]} />
        <Toon color={head} />
      </mesh>
      {!cos && (
        <mesh position={[0, 1.26, -0.06]} scale={[1.05, 0.9, 1.05]}>
          <sphereGeometry args={[0.5, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
          <Toon color={avatar.hairColor} />
        </mesh>
      )}
      {[-1, 1].map((s) => (
        <mesh key={`e${s}`} position={[s * 0.17, 1.15, 0.44]}>
          <sphereGeometry args={[0.06, 6, 6]} />
          <meshBasicMaterial color="#2b2b2b" />
        </mesh>
      ))}
    </group>
  )
}

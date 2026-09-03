import { Sky, PerformanceMonitor } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { Island } from './Island'
import { Player } from './Player'

// fps가 떨어지면 렌더 해상도를 낮춘다 (기획서 성능 예산).
function AdaptiveDpr() {
  const setDpr = useThree((st) => st.setDpr)
  return (
    <PerformanceMonitor
      bounds={() => [45, 60]}
      flipflops={3}
      onDecline={() => setDpr(1)}
      onIncline={() => setDpr(1.5)}
      onFallback={() => setDpr(1)}
    />
  )
}

export function Scene() {
  return (
    <>
      <AdaptiveDpr />
      <color attach="background" args={['#cfeef3']} />
      <fog attach="fog" args={['#d7edf0', 34, 95]} />

      <hemisphereLight args={['#ffffff', '#6f9a58', 0.85]} />
      <directionalLight position={[10, 14, 6]} intensity={1.15} />
      <Sky sunPosition={[10, 14, 6]} turbidity={5} rayleigh={0.9} />

      <Island />
      <Player />
    </>
  )
}

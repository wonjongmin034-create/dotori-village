import { useRef } from 'react'
import { Sky, PerformanceMonitor, Grid } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import type { Group } from 'three'
import { Island } from './Island'
import { Player } from './Player'
import { CameraRig } from './CameraRig'
import { PlacedObjects } from './PlacedObjects'
import { EditorControls } from './EditorControls'
import { BrowseInteract } from './BrowseInteract'
import { useVillage } from './store'

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
  const itemsRef = useRef<Group>(null)
  const editing = useVillage((s) => s.mode === 'edit')

  return (
    <>
      <AdaptiveDpr />
      <color attach="background" args={['#cfeef3']} />
      <fog attach="fog" args={['#d7edf0', 34, 95]} />

      <hemisphereLight args={['#ffffff', '#6f9a58', 0.85]} />
      <directionalLight position={[10, 14, 6]} intensity={1.15} />
      <Sky sunPosition={[10, 14, 6]} turbidity={5} rayleigh={0.9} />

      {editing && (
        <Grid
          position={[0, 0.03, 0]}
          args={[40, 40]}
          cellSize={1}
          cellThickness={0.6}
          cellColor="#8fae74"
          sectionSize={5}
          sectionThickness={1}
          sectionColor="#5f8a49"
          fadeDistance={38}
          fadeStrength={1.5}
          followCamera={false}
          infiniteGrid
        />
      )}

      <Island />
      <PlacedObjects itemsRef={itemsRef} />
      <Player />
      <CameraRig />
      <EditorControls itemsRef={itemsRef} />
      <BrowseInteract itemsRef={itemsRef} />
    </>
  )
}

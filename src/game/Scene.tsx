import { useRef, useState } from 'react'
import { Sky, PerformanceMonitor, Grid, Cloud, Clouds, Environment, Lightformer, ContactShadows } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { Group } from 'three'
import { Island } from './Island'
import { Player } from './Player'
import { CameraRig } from './CameraRig'
import { PlacedObjects } from './PlacedObjects'
import { EditorControls } from './EditorControls'
import { BrowseInteract } from './BrowseInteract'
import { useVillage } from './store'

// fps가 떨어지면 렌더 해상도·효과를 낮춘다 (크롬북 성능 예산).
function AdaptiveDpr({ onLow }: { onLow: () => void }) {
  const setDpr = useThree((st) => st.setDpr)
  return (
    <PerformanceMonitor
      bounds={() => [40, 60]}
      flipflops={3}
      onDecline={() => {
        setDpr(1)
        onLow()
      }}
      onIncline={() => setDpr(1.4)}
      onFallback={() => {
        setDpr(1)
        onLow()
      }}
    />
  )
}

export function Scene() {
  const itemsRef = useRef<Group>(null)
  const editing = useVillage((s) => s.mode === 'edit')
  const itemCount = useVillage((s) => s.items.length)
  const [lite, setLite] = useState(false) // 저사양: 구름·환경광·그림자 끔

  return (
    <>
      <AdaptiveDpr onLow={() => setLite(true)} />
      <color attach="background" args={['#bfe6ef']} />
      <fog attach="fog" args={['#cdeaf0', 30, 110]} />

      {/* 조명 — 따뜻한 키 + 시원한 하늘/땅 */}
      <hemisphereLight args={['#eaf4ff', '#8fb877', 0.65]} />
      <directionalLight position={[8, 12, 5]} intensity={1.15} color="#fff2da" />
      <directionalLight position={[-6, 4, -6]} intensity={0.28} color="#bcd9ff" />

      {!lite && (
        <Environment resolution={64} frames={1}>
          <Lightformer intensity={1.4} position={[0, 5, -4]} scale={[10, 6, 1]} color="#fff6e6" />
          <Lightformer intensity={0.7} position={[4, 2, 4]} scale={[6, 6, 1]} color="#cfe6ff" />
          <Lightformer intensity={0.5} position={[-5, 1, 3]} scale={[5, 5, 1]} color="#e7ffe0" />
        </Environment>
      )}

      <Sky sunPosition={[8, 12, 5]} turbidity={4} rayleigh={0.7} mieCoefficient={0.006} />

      {!editing && !lite && (
        <Clouds material={THREE.MeshBasicMaterial} limit={40}>
          <Cloud seed={2} segments={20} bounds={[14, 2, 14]} volume={7} position={[-10, 16, -12]} opacity={0.5} speed={0.12} color="#ffffff" />
          <Cloud seed={7} segments={16} bounds={[12, 2, 12]} volume={6} position={[14, 18, 8]} opacity={0.42} speed={0.1} color="#f2f8ff" />
        </Clouds>
      )}

      {editing && (
        <Grid
          position={[0, 0.03, 0]}
          args={[40, 40]}
          cellSize={1}
          cellThickness={0.55}
          cellColor="#93b47a"
          sectionSize={5}
          sectionThickness={1}
          sectionColor="#5f8a49"
          fadeDistance={40}
          fadeStrength={1.5}
          followCamera={false}
          infiniteGrid
        />
      )}

      {!lite && (
        <ContactShadows
          key={itemCount}
          position={[0, 0.02, 0]}
          scale={44}
          resolution={512}
          blur={2.5}
          opacity={0.42}
          far={9}
          frames={1}
          color="#2e5030"
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

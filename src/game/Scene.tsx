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
import { FriendStage } from './FriendStage'
import { RemotePlayers } from './RemotePlayers'
import { MyPet, RemotePets } from './PetFollower'
import { Plaza } from './PlazaScene'
import { useVillage, viewItems } from './store'
import { useGfx } from './gfx'
import { useOmok } from './omokState'
import { OmokThrottle } from './OmokThrottle'
import { BossArena } from './BossArena'
import { useBoss } from './bossState'
import { stageOf } from './bossData'

// fps가 떨어지면 렌더 해상도·효과를 낮춘다 (크롬북 성능 예산).
function AdaptiveDpr({ onLow }: { onLow: () => void }) {
  const setDpr = useThree((st) => st.setDpr)
  return (
    <PerformanceMonitor
      bounds={() => [40, 60]}
      flipflops={3}
      onDecline={() => {
        setDpr(1)
        useGfx.setState({ lite: true })
        onLow()
      }}
      onIncline={() => setDpr(1.4)}
      onFallback={() => {
        setDpr(1)
        useGfx.setState({ lite: true })
        onLow()
      }}
    />
  )
}

export function Scene() {
  const itemsRef = useRef<Group>(null)
  const editing = useVillage((s) => s.mode === 'edit')
  const inPlaza = useVillage((s) => s.plaza != null)
  const itemCount = useVillage((s) => viewItems(s).length)
  const [lite, setLite] = useState(false) // 저사양: 구름·환경광·그림자 끔
  const omokSeated = useOmok((s) => s.me != null) // 오목 중엔 뒤 화면을 천천히 그리므로 fps 측정(저사양 판단)을 쉰다
  const inBoss = useVillage((s) => s.bossRoom != null)
  const bossTheme = useBoss((s) => stageOf(s.game?.stage ?? s.lobbyStage).theme)

  return (
    <>
      {!omokSeated && <AdaptiveDpr onLow={() => setLite(true)} />}
      <OmokThrottle />
      <color attach="background" args={[inBoss ? bossTheme.sky : '#bfe6ef']} />
      <fog attach="fog" args={[inBoss ? bossTheme.fog : '#cdeaf0', 30, 110]} />

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

      {!inBoss && <Sky sunPosition={[8, 12, 5]} turbidity={4} rayleigh={0.7} mieCoefficient={0.006} />}

      {!editing && !lite && !inBoss && (
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

      {!lite && !inBoss && (
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

      {inBoss ? (
        <BossArena />
      ) : inPlaza ? (
        <Plaza />
      ) : (
        <>
          <Island />
          <PlacedObjects itemsRef={itemsRef} />
          <FriendStage />
        </>
      )}
      <RemotePlayers />
      <RemotePets />
      <Player />
      <MyPet />
      <CameraRig />
      <EditorControls itemsRef={itemsRef} />
      <BrowseInteract itemsRef={itemsRef} />
    </>
  )
}

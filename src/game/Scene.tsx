import { useEffect, useMemo, useRef, useState } from 'react'
import { PerformanceMonitor, Grid, Environment, Lightformer, ContactShadows } from '@react-three/drei'
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
import { downgradeGfx, useGfx } from './gfx'
import { Clouds, SkyDome, nowHour, skyAt, skyLive, sunDirAt } from './SkyDome'
import { GfxRig, Sun } from './GfxRig'
import { useOmok } from './omokState'
import { OmokThrottle } from './OmokThrottle'
import { BossArena } from './BossArena'
import { TowerArena } from './TowerArena'
import { useTower } from './towerState'
import { towerStage } from './towerData'
import { useBoss } from './bossState'
import { stageOf } from './bossData'

// fps가 계속 떨어지면 화면 품질을 한 단계 낮춘다 (자동 모드일 때만 — 직접 고른 단계는 그대로 둔다).
function AdaptiveQuality() {
  return <PerformanceMonitor bounds={() => [40, 60]} flipflops={3} onDecline={downgradeGfx} onFallback={downgradeGfx} />
}

const FIXED_SUN = new THREE.Vector3(8, 12, 5).normalize()

export function Scene() {
  const itemsRef = useRef<Group>(null)
  const editing = useVillage((s) => s.mode === 'edit')
  const inPlaza = useVillage((s) => s.plaza != null)
  const itemCount = useVillage((s) => viewItems(s).length)
  const level = useGfx((s) => s.level)
  const omokSeated = useOmok((s) => s.me != null) // 오목 중엔 뒤 화면을 천천히 그리므로 fps 측정(저사양 판단)을 쉰다
  const inBoss = useVillage((s) => s.bossRoom != null)
  const inTower = useVillage((s) => s.towerOn)
  const towerTheme = useTower((s) => towerStage(s.stage).theme)
  const bossTheme = useBoss((s) => stageOf(s.game?.stage ?? s.lobbyStage).theme)

  // 마을·광장의 하늘은 지금 시각을 따라간다 (1분마다 갱신)
  const [hour, setHour] = useState(nowHour)
  useEffect(() => {
    const t = setInterval(() => setHour(nowHour()), 60_000)
    return () => clearInterval(t)
  }, [])
  const sky = useMemo(() => skyAt(hour), [hour])
  const sunDir = useMemo(() => sunDirAt(sky), [sky])
  useEffect(() => {
    skyLive.fog.copy(sky.fog)
    skyLive.light = 1 - sky.night * 0.45
    skyLive.night = sky.night
  }, [sky])

  const open = !inBoss && !inTower // 하늘이 보이는 장면
  const lite = level === 'low'
  const hemiSky = useMemo(() => sky.mid.clone().lerp(new THREE.Color('#ffffff'), 0.65), [sky])

  return (
    <>
      {!omokSeated && <AdaptiveQuality />}
      <OmokThrottle />
      <GfxRig />
      <color attach="background" args={[inTower ? towerTheme.sky : inBoss ? bossTheme.sky : '#' + sky.hor.getHexString()]} />
      <fog attach="fog" args={[inTower ? towerTheme.fog : inBoss ? bossTheme.fog : '#' + sky.fog.getHexString(), 30, 110]} />

      {/* 조명 — 마을은 시각에 따라 해 방향·색이 바뀌고, 보스방·탑은 고정 */}
      <hemisphereLight args={[open ? hemiSky : '#eaf4ff', '#8fb877', open ? sky.hemi : 0.65]} />
      <Sun
        dir={open ? sunDir : FIXED_SUN}
        intensity={open ? sky.key : 1.15}
        color={open ? '#' + sky.sun.clone().lerp(new THREE.Color('#ffffff'), 0.4).getHexString() : '#fff2da'}
        focus={inBoss || editing ? 'center' : 'player'}
        shadow={level === 'high'}
        range={editing ? 26 : inBoss ? 20 : 16}
      />
      <directionalLight position={[-6, 4, -6]} intensity={0.28} color="#bcd9ff" />

      {!lite && (
        <Environment resolution={64} frames={1}>
          <Lightformer intensity={1.4} position={[0, 5, -4]} scale={[10, 6, 1]} color="#fff6e6" />
          <Lightformer intensity={0.7} position={[4, 2, 4]} scale={[6, 6, 1]} color="#cfe6ff" />
          <Lightformer intensity={0.5} position={[-5, 1, 3]} scale={[5, 5, 1]} color="#e7ffe0" />
        </Environment>
      )}

      {open && <SkyDome sky={sky} />}
      {open && !editing && !lite && <Clouds night={sky.night} />}

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

      {level === 'medium' && open && (
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

      {inTower ? (
        <TowerArena />
      ) : inBoss ? (
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

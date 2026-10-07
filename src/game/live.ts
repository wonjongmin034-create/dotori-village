import { create } from 'zustand'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { useVillage } from './store'
import { normalizeAvatar, type Avatar } from './avatar'
import { playerPos, playerMotion } from './player-state'

// 같이 걷기 — 같은 마을(섬)에 있는 친구들을 실시간으로 보여 준다. (Supabase Realtime)
// 방 = 섬 주인의 마을. 내 마을에 있으면 내 마을 방, 친구 마을에 놀러 가면 그 친구 방.
// 위치는 broadcast(가벼움), 누가 있는지·옷차림은 presence.

export type Peer = {
  name: string
  avatar: Avatar
  x: number
  z: number
  vx: number
  vz: number
  facing: number
  at: number // 마지막 위치를 받은 시각 (performance.now). 0 = 아직 못 받음
}

// 자주 바뀌는 값이라 zustand 밖에 둔다 (RemotePlayers가 매 프레임 읽음)
export const peers = new Map<string, Peer>()

export const EMOTES = ['👋', '😊', '❤️', '👍', '🎉']
const EMOTE_MS = 3500

type LiveState = {
  names: string[] // 지금 같은 방에 있는 다른 친구들
  room: string | null // 지금 들어가 있는 방 주인 이름
  emotes: Record<string, string> // 이름 → 말풍선 이모티콘 (내 것은 '__me')
}
export const useLive = create<LiveState>(() => ({ names: [], room: null, emotes: {} }))

let channel: RealtimeChannel | null = null
let roomKey = ''
let ready = false
let timer: ReturnType<typeof setInterval> | null = null
let quietUntil = 0 // 방에 막 들어왔을 때 "OO가 와 있어요" 알림 억제
let last = { x: 1e9, z: 1e9, moving: false, t: 0 }
const emoteTimers = new Map<string, ReturnType<typeof setTimeout>>()

const r2 = (n: number) => Math.round(n * 100) / 100

function setEmote(key: string, e: string) {
  useLive.setState((s) => ({ emotes: { ...s.emotes, [key]: e } }))
  const old = emoteTimers.get(key)
  if (old) clearTimeout(old)
  emoteTimers.set(
    key,
    setTimeout(() => {
      useLive.setState((s) => {
        const { [key]: _gone, ...rest } = s.emotes
        void _gone
        return { emotes: rest }
      })
    }, EMOTE_MS),
  )
}

function send() {
  const s = useVillage.getState()
  if (!ready || !channel || !s.session) return
  const moving = Math.hypot(playerMotion.vx, playerMotion.vz) > 0.05
  void channel.send({
    type: 'broadcast',
    event: 'pos',
    payload: {
      n: s.session.name,
      x: r2(playerPos.x),
      z: r2(playerPos.z),
      vx: r2(playerMotion.vx),
      vz: r2(playerMotion.vz),
      f: r2(playerMotion.facing),
    },
  })
  last = { x: playerPos.x, z: playerPos.z, moving, t: performance.now() }
}

// 150ms마다: 움직이고 있거나 멈춘 순간이거나 3초 넘게 조용했으면 위치를 보낸다.
function tick() {
  if (!ready) return
  const moving = Math.hypot(playerMotion.vx, playerMotion.vz) > 0.05
  const moved = Math.hypot(playerPos.x - last.x, playerPos.z - last.z) > 0.04
  if (moving || moved || moving !== last.moving || performance.now() - last.t > 3000) send()
}

function leave() {
  if (timer) clearInterval(timer)
  timer = null
  if (channel) void supabase.removeChannel(channel)
  channel = null
  roomKey = ''
  ready = false
  peers.clear()
  for (const t of emoteTimers.values()) clearTimeout(t)
  emoteTimers.clear()
  useLive.setState({ names: [], room: null, emotes: {} })
}

function join(owner: string, key: string, me: string) {
  leave()
  roomKey = key
  quietUntil = performance.now() + 1800
  last = { x: 1e9, z: 1e9, moving: false, t: 0 }
  const ch = supabase.channel(key, {
    config: { broadcast: { self: false }, presence: { key: me } },
  })
  channel = ch

  ch.on('presence', { event: 'sync' }, () => {
    const state = ch.presenceState() as Record<string, { avatar?: Avatar }[]>
    const names = Object.keys(state).filter((k) => k !== me)
    for (const k of names) {
      const avatar = normalizeAvatar(state[k]?.[0]?.avatar)
      const p = peers.get(k)
      if (p) p.avatar = avatar
      else peers.set(k, { name: k, avatar, x: 0, z: 0, vx: 0, vz: 0, facing: 0, at: 0 })
    }
    for (const k of [...peers.keys()]) if (!names.includes(k)) peers.delete(k)
    useLive.setState({ names, room: owner })
  })
    .on('presence', { event: 'join' }, ({ key: who }) => {
      if (who === me) return
      send() // 새로 온 친구가 내 위치를 알 수 있게
      if (performance.now() < quietUntil) return
      useVillage
        .getState()
        .flash(owner === me ? `${who}님이 놀러 왔어요! 👋` : `${who}님도 여기 왔어요 👋`)
    })
    .on('presence', { event: 'leave' }, ({ key: who }) => {
      if (who === me) return
      useVillage.getState().flash(`${who}님이 돌아갔어요`)
    })
    .on('broadcast', { event: 'pos' }, ({ payload }) => {
      const m = payload as { n: string; x: number; z: number; vx: number; vz: number; f: number }
      if (!m || typeof m.n !== 'string' || m.n === me) return
      let p = peers.get(m.n)
      if (!p) {
        p = { name: m.n, avatar: normalizeAvatar(null), x: 0, z: 0, vx: 0, vz: 0, facing: 0, at: 0 }
        peers.set(m.n, p)
      }
      p.x = m.x
      p.z = m.z
      p.vx = m.vx
      p.vz = m.vz
      p.facing = m.f
      p.at = performance.now()
    })
    .on('broadcast', { event: 'emote' }, ({ payload }) => {
      const m = payload as { n: string; e: string }
      if (m && m.n !== me && EMOTES.includes(m.e)) setEmote(m.n, m.e)
    })
    .subscribe((status) => {
      if (status !== 'SUBSCRIBED' || channel !== ch) return
      ready = true
      void ch.track({ avatar: useVillage.getState().avatar })
      timer = setInterval(tick, 150)
      setTimeout(send, 400)
    })
}

// 지금 있어야 할 방으로 맞춘다 (로그인/로그아웃/놀러 가기/돌아오기 때마다)
function syncRoom() {
  const s = useVillage.getState()
  if (!s.session) {
    if (channel) leave()
    return
  }
  const owner = s.visiting ? s.visiting.name : s.session.name
  const key = `island:${s.session.classCode}:${owner}`
  if (key !== roomKey) join(owner, key, s.session.name)
}

export function sendEmote(e: string) {
  if (!EMOTES.includes(e)) return
  setEmote('__me', e)
  const s = useVillage.getState()
  if (ready && channel && s.session) {
    void channel.send({ type: 'broadcast', event: 'emote', payload: { n: s.session.name, e } })
  }
}

useVillage.subscribe((s, prev) => {
  if (s.session !== prev.session || s.visiting !== prev.visiting) syncRoom()
  else if (s.avatar !== prev.avatar && ready && channel) void channel.track({ avatar: s.avatar })
})

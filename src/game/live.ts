import { create } from 'zustand'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { useVillage } from './store'
import { normalizeAvatar, viewAvatar, type Avatar } from './avatar'
import { playerPos, playerMotion } from './player-state'
import { endVisit } from './friends'
import { nextPlazaRoom } from './plaza'
import { bindOmokIO, omokOnEvent, omokResend, omokOnPresence, omokPresence, omokReset, type OmokPayload, type SeatMeta, type GameState } from './omokState'
import { cleanTitleHat, useOmokStats } from './omokStats'

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
  y: number // 점프 높이
  vy: number
  facing: number
  at: number // 마지막 위치를 받은 시각 (performance.now). 0 = 아직 못 받음
}

// 자주 바뀌는 값이라 zustand 밖에 둔다 (RemotePlayers가 매 프레임 읽음)
export const peers = new Map<string, Peer>()

export const EMOTES = ['👋', '😊', '❤️', '👍', '🎉']
// 한 마을에 동시에 있을 수 있는 사람 수 (섬 주인 포함). 넘으면 늦게 온 사람은 돌려보낸다.
export const MAX_IN_ROOM = 10
const EMOTE_MS = 3500

type LiveState = {
  names: string[] // 지금 같은 방에 있는 다른 친구들
  room: string | null // 지금 들어가 있는 방 주인 이름
  emotes: Record<string, string> // 이름 → 말풍선 이모티콘 (내 것은 '__me')
}
export const useLive = create<LiveState>(() => ({ names: [], room: null, emotes: {} }))

// 서버 메시지 사용량 (선생님이 주소 끝에 ?stats 를 붙이면 광장 화면 위쪽에 보인다)
//  한 사람이 보낸 메시지는 방의 다른 사람 수만큼 전달된 것으로 세어진다 → 방 전체 합계 ≈ (보낸 수 + 받은 수) 를 사람 수로 곱해 어림한다.
export const useNet = create<{ n: number; sent: number; recv: number; est: number }>(() => ({ n: 0, sent: 0, recv: 0, est: 0 }))
let cntSent = 0
let cntRecv = 0
export function statsOn(): boolean {
  try {
    if (location.search.includes('stats=0')) localStorage.removeItem('dotori.stats')
    else if (location.search.includes('stats')) localStorage.setItem('dotori.stats', '1')
    return localStorage.getItem('dotori.stats') === '1'
  } catch {
    return location.search.includes('stats') && !location.search.includes('stats=0')
  }
}
setInterval(() => {
  const sent = cntSent / 2
  const recv = cntRecv / 2
  cntSent = 0
  cntRecv = 0
  if (!roomKey || !statsOn()) return
  const n = lastNames.length + 1
  const est = Math.round((sent + recv) * n)
  if (est > 80) console.warn('[live] 서버 메시지가 많아요: 약', est, '/초 (무료 한도 100)')
  useNet.setState({ n, sent: Math.round(sent * 10) / 10, recv: Math.round(recv * 10) / 10, est })
}, 2000)

let channel: RealtimeChannel | null = null
let roomKey = ''
let ready = false
let timer: ReturnType<typeof setInterval> | null = null
let quietUntil = 0 // 방에 막 들어왔을 때 "OO가 와 있어요" 알림 억제
let last = { x: 1e9, z: 1e9, moving: false, air: false, t: 0 }
const emoteTimers = new Map<string, ReturnType<typeof setTimeout>>()
let lastNames: string[] = []
let kicked = false
let joinedAt = 0 // 이 방에 들어온 시각 (입장 순서 판단용)

type Meta = { avatar?: Avatar; t?: number; seat?: SeatMeta; game?: GameState }

// 들어갈 수 있는 사람들: 섬 주인이 제일 먼저, 그다음 먼저 온 순서. 모두가 같은 데이터로 계산하므로 결과가 같다.
function allowedOf(state: Record<string, Meta[]>, owner: string): string[] {
  return Object.keys(state)
    .map((k) => ({ k, t: state[k]?.[0]?.t ?? 0 }))
    .sort((a, b) =>
      a.k === owner ? -1 : b.k === owner ? 1 : a.t - b.t || (a.k < b.k ? -1 : 1),
    )
    .slice(0, MAX_IN_ROOM)
    .map((o) => o.k)
}

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
  if (!ready || !channel || channel.state !== 'joined' || !s.session) return
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
      y: r2(playerPos.y),
      vy: r2(playerMotion.vy),
      f: r2(playerMotion.facing),
    },
  })
  cntSent++
  last = { x: playerPos.x, z: playerPos.z, moving, air: playerPos.y > 0.01, t: performance.now() }
}

// 0.25초마다 확인하되, 서버 메시지를 아끼려고 "꼭 필요할 때만" 위치를 보낸다.
//  - 같은 방에 아무도 없으면 안 보낸다.
//  - 받는 쪽이 속도로 위치를 이어 그리니까, 같은 방향으로 계속 걸을 때는 가끔만 보내도 된다 (인원수에 따라 아래 moveGapMs).
//  - 방향을 바꾸거나 멈추거나 점프할 때는 바로 보낸다.
// 서버(무료)는 "초당 메시지 100개"가 한도이고, 한 사람이 보낸 위치는 방의 모든 사람에게 전달되어 세어진다.
// → 방 하나가 쓰는 양 ≈ 사람수 × (사람수-1) ÷ 전송간격. 이 값이 BUDGET 을 안 넘도록 사람이 많을수록 전송 간격을 늘린다.
//   (2명: 0.6초, 5명: 0.6초, 7명: 약 1초, 10명: 약 2.3초. 받는 쪽은 속도로 이어 그려서 크게 티가 안 난다.)
const BUDGET = 40
const moveGapMs = () => {
  const n = lastNames.length + 1
  return Math.min(2500, Math.max(600, ((n * (n - 1)) / BUDGET) * 1000))
}
let lastV = { vx: 0, vz: 0 }
function tick() {
  if (!ready || lastNames.length === 0) return
  const moving = Math.hypot(playerMotion.vx, playerMotion.vz) > 0.05
  const air = playerPos.y > 0.01
  const now = performance.now()
  const gap = moveGapMs()
  const turned = Math.hypot(playerMotion.vx - lastV.vx, playerMotion.vz - lastV.vz) > 1.2 && now - last.t > Math.max(350, gap / 2)
  const stateChanged = air !== last.air || moving !== last.moving
  const due = now - last.t > (air ? 400 : moving ? gap : Math.max(3000, gap))
  if (stateChanged || turned || due) {
    lastV = { vx: playerMotion.vx, vz: playerMotion.vz }
    send()
  }
}

// ── 연결이 끊겼을 때 스스로 복구 ──
// 서버가 연결을 닫거나(요청이 너무 많을 때 등) 인터넷이 잠깐 끊기면 방에 다시 들어간다.
let retryTimer: ReturnType<typeof setTimeout> | null = null
let retries = 0
function recover(why: string) {
  if (!roomKey || retryTimer) return
  console.warn('[live] 연결 복구 시도:', why)
  const delay = Math.min(30_000, 1500 * 2 ** Math.min(retries, 5)) + Math.random() * 600
  retries++
  retryTimer = setTimeout(() => {
    retryTimer = null
    leave()
    syncRoom()
  }, delay)
}
// 10초마다 연결이 살아 있는지 본다
setInterval(() => {
  if (!roomKey || !channel) return
  if (channel.state !== 'joined' && channel.state !== 'joining') recover('channel ' + channel.state)
}, 10_000)

// 내 presence(누구인지·옷차림·오목 자리)를 방에 알린다
function pushPresence() {
  if (!channel || !ready) return
  void channel.track({ avatar: liveAvatar(useVillage.getState()), t: joinedAt, ...omokPresence() })
}

let removal: Promise<unknown> = Promise.resolve()
let removedAt = 0
function leave() {
  omokReset()
  if (timer) clearInterval(timer)
  timer = null
  // 먼저 비운 다음에 닫는다: 닫는 순간 "CLOSED"가 동기로 오는데, 그때 내가 스스로 나간 것을 "끊겼다"로 착각하면 안 된다
  const old = channel
  channel = null
  roomKey = ''
  ready = false
  if (old) {
    // 닫는 데 오래 걸려도 3초 넘게는 기다리지 않는다
    removal = Promise.race([supabase.removeChannel(old).catch(() => undefined), new Promise((r) => setTimeout(r, 3000))])
    removedAt = performance.now()
  }
  lastNames = []
  peers.clear()
  for (const t of emoteTimers.values()) clearTimeout(t)
  emoteTimers.clear()
  useLive.setState({ names: [], room: null, emotes: {} })
}

function join(owner: string, key: string, me: string) {
  leave()
  roomKey = key
  quietUntil = performance.now() + 1800
  kicked = false
  joinedAt = 0
  last = { x: 1e9, z: 1e9, moving: false, air: false, t: 0 }
  // 같은 이름의 옛 연결이 아직 닫히는 중이면, 그 "닫힘"이 새 연결까지 닫아 버린다 (라이브러리가 이름으로 지움)
  // → 옛 연결이 완전히 닫힌 뒤에 새로 연다
  void removal
    .then(() => new Promise<void>((r) => setTimeout(r, Math.max(0, removedAt + 600 - performance.now()))))
    .then(() => {
      if (roomKey === key && !channel) open(owner, key, me)
    })
}

function open(owner: string, key: string, me: string) {
  const ch = supabase.channel(key, {
    config: { broadcast: { self: false }, presence: { key: me } },
  })
  channel = ch

  ch.on('presence', { event: 'sync' }, () => {
    const state = ch.presenceState() as Record<string, Meta[]>
    // 내 입장 기록이 아직 안 올라온 첫 sync는 건너뛴다 (그때 판단하면 멀쩡한 나를 내보내게 됨)
    if (!(me in state)) return
    const allowed = allowedOf(state, owner)
    if (!allowed.includes(me)) {
      // 자리가 없다 → 내 마을로 돌아가고 안내
      if (!kicked) {
        kicked = true
        if (key.startsWith('plaza:')) nextPlazaRoom() // 광장이 꽉 찼으면 다음 번호 광장으로
        else {
          endVisit()
          useVillage
            .getState()
            .setNotice(`${owner}의 마을은 지금 ${MAX_IN_ROOM}명이 다 모였어요.
다음 기회에 방문해 주세요! 🙏`)
        }
      }
      return
    }
    const names = allowed.filter((k) => k !== me)
    for (const k of names) {
      const avatar = cleanTitleHat(k, normalizeAvatar(state[k]?.[0]?.avatar))
      const p = peers.get(k)
      if (p) p.avatar = avatar
      else peers.set(k, { name: k, avatar, x: 0, z: 0, vx: 0, vz: 0, y: 0, vy: 0, facing: 0, at: 0 })
    }
    for (const k of [...peers.keys()]) if (!names.includes(k)) peers.delete(k)
    lastNames = names
    useLive.setState({ names, room: owner })
    if (key.startsWith('plaza:')) omokOnPresence(state, allowed)
  })
    .on('presence', { event: 'join' }, ({ key: who }) => {
      if (who === me) return
      const st = ch.presenceState() as Record<string, Meta[]>
      if (who in st && !allowedOf(st, owner).includes(who)) return // 자리가 없어 곧 돌아갈 사람
      send() // 새로 온 친구가 내 위치를 알 수 있게
      if (key.startsWith('plaza:')) setTimeout(omokResend, 600) // 오목 판도 알려 준다
      if (performance.now() < quietUntil) return
      useVillage
        .getState()
        .flash(
          key.startsWith('plaza:')
            ? `${who}님이 광장에 왔어요 👋`
            : owner === me
              ? `${who}님이 놀러 왔어요! 👋`
              : `${who}님도 여기 왔어요 👋`,
        )
    })
    .on('presence', { event: 'leave' }, ({ key: who }) => {
      if (who === me || !lastNames.includes(who)) return
      useVillage.getState().flash(`${who}님이 돌아갔어요`)
    })
    .on('broadcast', { event: 'pos' }, ({ payload }) => {
      const m = payload as { n: string; x: number; z: number; vx: number; vz: number; y?: number; vy?: number; f: number }
      if (!m || typeof m.n !== 'string' || m.n === me) return
      let p = peers.get(m.n)
      if (!p) {
        p = { name: m.n, avatar: normalizeAvatar(null), x: 0, z: 0, vx: 0, vz: 0, y: 0, vy: 0, facing: 0, at: 0 }
        peers.set(m.n, p)
      }
      p.x = m.x
      p.z = m.z
      p.vx = m.vx
      p.vz = m.vz
      p.y = m.y ?? 0
      p.vy = m.vy ?? 0
      p.facing = m.f
      p.at = performance.now()
      cntRecv++
    })
    .on('broadcast', { event: 'omok' }, ({ payload }) => {
      cntRecv++
      if (key.startsWith('plaza:')) omokOnEvent(payload as OmokPayload)
    })
    .on('broadcast', { event: 'emote' }, ({ payload }) => {
      const m = payload as { n: string; e: string }
      if (m && m.n !== me && EMOTES.includes(m.e)) setEmote(m.n, m.e)
    })
    .subscribe((status) => {
      if (channel !== ch) return
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        ready = false
        recover(status)
        return
      }
      if (status !== 'SUBSCRIBED') return
      retries = 0
      ready = true
      if (!joinedAt) joinedAt = Date.now()
      if (timer) clearInterval(timer)
      void ch.track({ avatar: liveAvatar(useVillage.getState()), t: joinedAt })
      if (key.startsWith('plaza:')) {
        bindOmokIO(
          {
            send: (p) => {
              cntSent++
              void ch.send({ type: 'broadcast', event: 'omok', payload: p })
            },
            track: pushPresence,
          },
          me,
        )
      }
      timer = setInterval(tick, 250)
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
  const owner = s.plaza != null ? '' : s.visiting ? s.visiting.name : s.session.name
  const key = s.plaza != null ? `plaza:${s.session.classCode}:${s.plaza}` : `island:${s.session.classCode}:${owner}`
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

// 친구들에게 보여 주는 내 모습 (탈 것에서 내렸으면 탈 것 없이)
const liveAvatar = (s: { avatar: Avatar; rideOn: boolean }) => viewAvatar(s.avatar, s.rideOn)

// 지난주 오목왕 명단이 갱신되면, 방에 있는 친구들의 오목왕 모자를 다시 확인한다
useOmokStats.subscribe((s, prev) => {
  if (s.titles === prev.titles || !channel) return
  const state = channel.presenceState() as Record<string, Meta[]>
  for (const [k, p] of peers) p.avatar = cleanTitleHat(k, normalizeAvatar(state[k]?.[0]?.avatar))
})

useVillage.subscribe((s, prev) => {
  if (s.session !== prev.session || s.visiting !== prev.visiting || s.plaza !== prev.plaza) syncRoom()
  else if ((s.avatar !== prev.avatar || s.rideOn !== prev.rideOn) && ready && channel)
    pushPresence()
})

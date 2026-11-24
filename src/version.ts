// 새 버전 강제 적용 — 학교 태블릿이 옛 화면에 머무르는 일을 막는다.
//  · 배포할 때마다 version.json 에 새 번호가 적힌다 (vite.config.ts).
//  · 앱이 켜질 때 · 화면으로 돌아올 때 · 90초마다 그 번호를 확인해서, 다르면
//    서비스 워커와 저장된 파일을 지우고 주소를 바꿔(?v=번호) 새로 불러온다 (브라우저 캐시도 건너뛴다).
//  · 보스·레이드·탑·수비대 중에는 기다렸다가 끝나면 바꾼다.
import { useVillage } from './game/store'

declare const __BUILD_ID__: string
export const BUILD_ID: string = typeof __BUILD_ID__ === 'string' ? __BUILD_ID__ : 'dev'

const KEY = 'dotori.forceUpd'

// 싹 비우고 최신으로 다시 불러오기
export async function hardReload(id = Date.now().toString(36)) {
  try {
    const regs = (await navigator.serviceWorker?.getRegistrations()) ?? []
    await Promise.all(regs.map((r) => r.unregister()))
  } catch {
    /* noop */
  }
  try {
    const keys = await caches.keys()
    await Promise.all(keys.map((k) => caches.delete(k)))
  } catch {
    /* noop */
  }
  const u = new URL(location.href)
  u.searchParams.set('v', id)
  location.replace(u.toString())
}

const busy = () => {
  const s = useVillage.getState()
  return s.bossRoom != null || s.raidRoom || s.towerOn || s.defRoom != null
}

let checking = false
async function checkVersion() {
  if (import.meta.env.DEV || checking) return
  checking = true
  try {
    const r = await fetch(`${import.meta.env.BASE_URL}version.json?t=${Date.now()}`, { cache: 'no-store' })
    if (!r.ok) return
    const { id } = (await r.json()) as { id?: string }
    if (!id || id === BUILD_ID || busy()) return
    // 같은 번호로 이미 한 번 바꿨는데도 그대로면 더 하지 않는다 (무한 새로고침 방지)
    try {
      if (sessionStorage.getItem(KEY) === id) return
      sessionStorage.setItem(KEY, id)
    } catch {
      return
    }
    await hardReload(id)
  } catch {
    /* 인터넷이 끊겼을 때 등 — 다음에 다시 */
  } finally {
    checking = false
  }
}

export function watchVersion() {
  // 주소에 붙인 ?v= 는 지워서 깔끔하게
  try {
    const u = new URL(location.href)
    if (u.searchParams.has('v')) {
      u.searchParams.delete('v')
      history.replaceState(history.state, '', u.toString())
    }
  } catch {
    /* noop */
  }
  void checkVersion()
  setInterval(() => void checkVersion(), 90_000)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void checkVersion()
  })
}

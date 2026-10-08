import { useEffect, useState } from 'react'

// 홈 화면에 추가(앱처럼 설치) 안내. 이미 앱으로 열었으면 아무것도 안 보인다.
type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

let deferred: InstallEvent | null = null
const listeners = new Set<() => void>()
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred = e as InstallEvent
    listeners.forEach((f) => f())
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    listeners.forEach((f) => f())
  })
}

function isStandalone(): boolean {
  try {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true
    )
  } catch {
    return false
  }
}

type Kind = 'ios' | 'samsung' | 'android' | 'other'
function kindOf(): Kind {
  const ua = navigator.userAgent
  // iPadOS는 데스크톱 Safari처럼 위장하므로 터치 지원으로 구분
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios'
  if (/SamsungBrowser/.test(ua)) return 'samsung'
  if (/Android/.test(ua)) return 'android'
  return 'other'
}

const STEPS: Record<Kind, { title: string; steps: string[] }> = {
  samsung: {
    title: '갤럭시 (삼성 인터넷)',
    steps: [
      '화면 아래(또는 위) 오른쪽의 메뉴 ≡ 를 눌러요',
      '"현재 페이지 추가" → "홈 화면"을 눌러요',
      '"추가"를 누르면 바탕화면에 🌰 도토리 마을 아이콘이 생겨요',
    ],
  },
  android: {
    title: '안드로이드 (크롬)',
    steps: [
      '주소창 오른쪽 위의 ⋮ 메뉴를 눌러요',
      '"홈 화면에 추가" 또는 "앱 설치"를 눌러요',
      '"설치"(추가)를 누르면 바탕화면에 🌰 도토리 마을 아이콘이 생겨요',
    ],
  },
  ios: {
    title: '아이패드·아이폰 (사파리)',
    steps: [
      '사파리로 열고, 공유 버튼(□에 ↑ 모양)을 눌러요',
      '"홈 화면에 추가"를 눌러요',
      '오른쪽 위 "추가"를 누르면 홈 화면에 🌰 도토리 마을 아이콘이 생겨요',
    ],
  },
  other: {
    title: '크롬북·컴퓨터 (크롬·엣지)',
    steps: [
      '주소창 오른쪽 끝의 설치 아이콘(⊕ 또는 모니터 모양)을 눌러요',
      '"설치"를 누르면 앱 창으로 열려요',
      '안 보이면 ⋮ 메뉴 → "저장 및 공유" → "앱으로 설치"',
    ],
  },
}

export function InstallGuide() {
  const [, bump] = useState(0)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const f = () => bump((n) => n + 1)
    listeners.add(f)
    return () => {
      listeners.delete(f)
    }
  }, [])

  if (isStandalone()) return null

  const install = async () => {
    if (deferred) {
      const ev = deferred
      deferred = null
      try {
        await ev.prompt()
        await ev.userChoice
      } catch {
        /* 사용자가 닫음 */
      }
      bump((n) => n + 1)
      return
    }
    setOpen(true)
  }

  const kind = kindOf()
  const info = STEPS[kind]
  return (
    <>
      <button type="button" className="install-btn" onClick={install}>
        📲 홈 화면에 추가 (앱처럼 쓰기)
      </button>
      {open && (
        <div className="install-back" onClick={() => setOpen(false)}>
          <div className="install-card" onClick={(e) => e.stopPropagation()}>
            <h3>📲 홈 화면에 추가하기</h3>
            <p className="install-kind">{info.title}</p>
            <ol>
              {info.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
            {kind !== 'ios' && (
              <p className="install-note">
                버튼이 안 보이면 크롬이나 삼성 인터넷으로 열었는지 확인해 주세요.
              </p>
            )}
            <button type="button" className="install-close" onClick={() => setOpen(false)}>
              알겠어요
            </button>
          </div>
        </div>
      )}
    </>
  )
}

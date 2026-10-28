import { create } from 'zustand'

// 화면 품질 3단계. 기기에 따라 자동으로 고르고(자동), 학생이 직접 바꿀 수도 있다.
//  높음 : 부드러운 그림자 · 캐릭터·몬스터 윤곽선 · 풍성한 풀과 나무 · 물결 반짝임 (데스크톱·성능 좋은 기기)
//  보통 : 윤곽선과 그림자 없이 풀·나무·구름은 그대로 (태블릿·크롬북)
//  낮음 : 장식을 크게 줄인 절약 모드 (오래된 기기, 느려질 때)
export type GfxLevel = 'high' | 'medium' | 'low'
export type GfxPref = 'auto' | GfxLevel

const PREF_KEY = 'dotori.gfx.pref'
const AUTO_KEY = 'dotori.gfx.auto'
const ORDER: GfxLevel[] = ['high', 'medium', 'low']

function detect(): GfxLevel {
  try {
    const nav = navigator as Navigator & { deviceMemory?: number }
    const cores = nav.hardwareConcurrency ?? 4
    const mem = nav.deviceMemory ?? 4
    const touch = (typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches) || navigator.maxTouchPoints > 1
    const small = Math.min(screen.width, screen.height) < 700
    if (mem <= 2 || cores <= 2) return 'low'
    if (touch || small || cores <= 4) return 'medium'
    return 'high'
  } catch {
    return 'medium'
  }
}

const read = (k: string) => {
  try {
    return localStorage.getItem(k)
  } catch {
    return null
  }
}
const write = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v)
  } catch {
    /* noop */
  }
}

const isLevel = (v: unknown): v is GfxLevel => v === 'high' || v === 'medium' || v === 'low'
const lowerOf = (a: GfxLevel, b: GfxLevel) => (ORDER.indexOf(a) >= ORDER.indexOf(b) ? a : b)

const savedPref = read(PREF_KEY)
const pref0: GfxPref = savedPref === 'high' || savedPref === 'medium' || savedPref === 'low' ? savedPref : 'auto'
// 자동일 때의 기준: 기기 판별 결과, 그리고 예전에 느려져서 내려간 기록이 있으면 그중 낮은 쪽
const savedAuto = read(AUTO_KEY)
const auto0: GfxLevel = isLevel(savedAuto) ? lowerOf(detect(), savedAuto) : detect()

type GfxState = {
  pref: GfxPref
  auto: GfxLevel // 자동 모드에서의 현재 단계
  level: GfxLevel // 지금 실제로 쓰는 단계
  lite: boolean // level === 'low' (예전 코드와의 호환)
}

const compute = (pref: GfxPref, auto: GfxLevel) => {
  const level = pref === 'auto' ? auto : pref
  return { level, lite: level === 'low' }
}

export const useGfx = create<GfxState>(() => ({ pref: pref0, auto: auto0, ...compute(pref0, auto0) }))

export function setGfxPref(pref: GfxPref) {
  write(PREF_KEY, pref)
  const s = useGfx.getState()
  // 자동으로 돌아올 때는 기기 판별부터 다시 시작
  const auto = pref === 'auto' ? detect() : s.auto
  if (pref === 'auto') write(AUTO_KEY, auto)
  useGfx.setState({ pref, auto, ...compute(pref, auto) })
}

// 화면이 느리면 한 단계 낮춘다 (자동 모드일 때만). 낮췄다는 기록은 다음 접속에도 남긴다.
export function downgradeGfx() {
  const s = useGfx.getState()
  if (s.pref !== 'auto') return
  const i = ORDER.indexOf(s.auto)
  if (i >= ORDER.length - 1) return
  const auto = ORDER[i + 1]
  write(AUTO_KEY, auto)
  useGfx.setState({ auto, ...compute('auto', auto) })
}

export const DPR: Record<GfxLevel, [number, number]> = { high: [1, 2], medium: [1, 1.5], low: [1, 1] }
export const GFX_LABEL: Record<GfxLevel, string> = { high: '높음', medium: '보통', low: '낮음' }

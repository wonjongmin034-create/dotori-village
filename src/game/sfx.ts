// 아주 가벼운 효과음 (WebAudio, 파일 없음).
let ctx: AudioContext | null = null
function ac(): AudioContext | null {
  try {
    if (!ctx) {
      const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      ctx = new C()
    }
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType, gain = 0.15) {
  const a = ac()
  if (!a) return
  const t0 = a.currentTime + start
  const osc = a.createOscillator()
  const g = a.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  g.gain.setValueAtTime(0, t0)
  g.gain.linearRampToValueAtTime(gain, t0 + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(g).connect(a.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}

export function sfxSuccess() {
  // 밝은 상승 아르페지오
  tone(523, 0, 0.16, 'triangle')
  tone(659, 0.08, 0.16, 'triangle')
  tone(784, 0.16, 0.22, 'triangle')
  tone(1047, 0.26, 0.3, 'sine', 0.12)
}

export function sfxFail() {
  // 부드러운 하강 (너무 무섭지 않게)
  tone(300, 0, 0.18, 'sine', 0.12)
  tone(220, 0.12, 0.28, 'sine', 0.12)
}

export function sfxBig() {
  // 고레벨 성공 팡파레
  tone(523, 0, 0.14, 'square', 0.1)
  tone(659, 0.1, 0.14, 'square', 0.1)
  tone(784, 0.2, 0.14, 'square', 0.1)
  tone(1047, 0.3, 0.5, 'sawtooth', 0.09)
  tone(1319, 0.34, 0.5, 'sine', 0.08)
}

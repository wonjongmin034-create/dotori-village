import { useEffect, useState } from 'react'
import { serverNow } from './serverClock'

// 1초마다 갱신되는 현재 시각 — 성장·생산 타이머를 화면에 반영할 때 쓴다.
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => serverNow())
  useEffect(() => {
    const id = setInterval(() => setNow(serverNow()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

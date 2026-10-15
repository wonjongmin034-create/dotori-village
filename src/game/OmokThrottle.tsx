import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { useOmok } from './omokState'

// 오목 창이 열려 있는 동안은 뒤의 3D 광장을 천천히(약 12번/초) 그린다.
// 오목판이 화면을 거의 덮고 앉아 있는 동안은 걸어 다니지도 않아서, 풀 속도로 그릴 필요가 없다 → 기기가 숨 돌릴 틈이 생겨 오목판 반응이 빨라진다.
export function OmokThrottle() {
  const seated = useOmok((s) => s.me != null)
  const setFrameloop = useThree((s) => s.setFrameloop)
  const invalidate = useThree((s) => s.invalidate)

  useEffect(() => {
    if (!seated) return
    setFrameloop('demand')
    const t = setInterval(() => invalidate(), 80)
    return () => {
      clearInterval(t)
      setFrameloop('always')
    }
  }, [seated, setFrameloop, invalidate])

  return null
}

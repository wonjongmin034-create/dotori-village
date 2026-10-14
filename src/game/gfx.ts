import { create } from 'zustand'

// 화면이 느려지면(fps 하락) 켜지는 "절약 모드". 무기의 반짝이·불꽃·빛무리 같은 장식 애니메이션을 끈다.
export const useGfx = create<{ lite: boolean }>(() => ({ lite: false }))

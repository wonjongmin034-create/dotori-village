import { create } from 'zustand'

// 선생님이 반 전체에 거는 "수업 제어" 상태 (학생 화면 쪽).
//  closed = true 면 광장·친구 마을 놀러 가기·오목(= 실시간 서버 연결)이 닫힌다. 내 마을 꾸미기·학습은 그대로.
export const useCtl = create<{ closed: boolean }>(() => ({ closed: false }))

export const isClosed = () => useCtl.getState().closed

export const CLOSED_TEXT = '선생님이 지금은 광장과 친구 마을을 닫았어요.\n나중에 다시 열리면 놀러 가요! 🔒'

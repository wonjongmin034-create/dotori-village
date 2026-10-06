import { createClient } from '@supabase/supabase-js'

// 도토리 마을 클라우드 저장 (Supabase).
// anon 키는 브라우저에 넣는 용도의 공개 키입니다. (RLS 정책으로 접근 제어)
// 로컬에서 가짜 서버로 시험할 때만 VITE_SUPABASE_URL 로 바꾼다. 평소엔 아래 주소.
const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) || 'https://qrhppnyvkquekenthzpd.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyaHBwbnl2a3F1ZWtlbnRoenBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4MDczMTUsImV4cCI6MjEwNDM4MzMxNX0.gvaonBYFCl-vooO9nTZqxg5U1BoDOuoIMbrZSlzZG5g'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
})

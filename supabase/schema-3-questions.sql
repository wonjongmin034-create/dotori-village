-- 선생님이 반마다 추가하는 "오늘의 학습" 문제
-- (schema.sql, schema-2-teacher.sql 실행한 뒤 이어서 실행)
-- Supabase 대시보드 → SQL Editor → 붙여넣고 RUN

alter table public.classes
  add column if not exists questions jsonb not null default '[]'::jsonb;

-- questions 예시 한 줄:
-- { "id": "c1a2b3", "subject": "수학", "q": "3 + 4 = ?",
--   "choices": ["5","6","7","8"], "answer": 2, "explain": "3 더하기 4는 7" }

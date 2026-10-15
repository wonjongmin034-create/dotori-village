-- 선생님 "수업 제어": 광장·친구 마을(실시간) 닫기 / 학생 전원 다시 접속시키기
-- (schema.sql, schema-2-teacher.sql 실행한 뒤 이어서 실행)
-- Supabase 대시보드 → SQL Editor → 붙여넣고 RUN

alter table public.classes
  add column if not exists control jsonb not null default '{}'::jsonb;

-- control 예시:
-- { "closed": true,  "kick": 1760512345678 }
--   closed : true 면 광장·친구 마을 놀러 가기·오목이 닫힌다 (내 마을 꾸미기·학습은 그대로)
--   kick   : 선생님이 "모두 다시 접속"을 누른 시각(ms). 학생 화면이 이 값이 새로워진 걸 보면 다시 접속한다.

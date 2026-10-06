-- 반마다 선생님이 올리는 급식표 (PDF 첨부 + 날짜별 메뉴 글)
-- (schema.sql, schema-2-teacher.sql 실행한 뒤 이어서 실행. PDF 첨부는 schema-4-worksheets.sql 도 필요)
-- Supabase 대시보드 → SQL Editor → 붙여넣고 RUN

alter table public.classes
  add column if not exists lunch jsonb not null default '{}'::jsonb;

-- lunch 예시:
-- { "file": { "path": "lunch-ab12.pdf", "title": "10월 급식표", "month": "2026-10", "pages": 1 },
--   "menu": { "2026-10-07": ["잡곡밥", "미역국", "불고기"] } }

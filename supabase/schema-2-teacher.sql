-- 선생님 대시보드용 추가 (schema.sql 실행한 뒤 이어서 실행)
-- Supabase 대시보드 → SQL Editor → 붙여넣고 RUN

-- 반 설정: 강화게임 on/off, 학급 공동 미션
alter table public.classes add column if not exists arcade_enabled boolean not null default true;
alter table public.classes add column if not exists mission jsonb not null default '{}'::jsonb;

-- 학생별 학습 기록 + 마지막 접속
alter table public.villages add column if not exists quiz_correct int not null default 0;
alter table public.villages add column if not exists quiz_wrong int not null default 0;
alter table public.villages add column if not exists last_seen timestamptz;

-- 도토리 지급 (선생님 → 학생). 학생 앱이 폴링해서 받아간다 (덮어쓰기 경쟁 방지)
create table if not exists public.grants (
  id uuid primary key default gen_random_uuid(),
  class_code text not null,
  student text not null default '*', -- '*' = 반 전체
  amount int not null,
  reason text not null default '',
  created_at timestamptz not null default now(),
  consumed_by text[] not null default '{}'
);
create index if not exists grants_class_idx on public.grants (class_code, created_at desc);

alter table public.grants enable row level security;
drop policy if exists "grants open" on public.grants;
create policy "grants open" on public.grants for all to anon using (true) with check (true);

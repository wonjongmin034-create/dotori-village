-- 광장 오목: 주간 승점 기록 + 하루 보상 횟수
-- (schema.sql 을 실행한 뒤 이어서 실행)
-- Supabase 대시보드 → SQL Editor → 붙여넣고 RUN  (한 번만 하면 됩니다)

create table if not exists public.omok_stats (
  class_code text not null,
  student    text not null,
  -- week >= 0 : 그 주의 승점 기록 (금요일 오후 3시마다 새 주)
  -- week = -1 : 오늘 보상 받은 판 수·상대별 횟수 (하루 제한용)
  week       int  not null,
  points     int  not null default 0,
  wins       int  not null default 0,
  losses     int  not null default 0,
  draws      int  not null default 0,
  rewarded   jsonb not null default '{}'::jsonb,
  pairs      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (class_code, student, week)
);

alter table public.omok_stats enable row level security;
create policy "omok_stats open" on public.omok_stats for all to anon using (true) with check (true);

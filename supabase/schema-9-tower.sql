-- 도토리 탑: 같은 반 최고 단계 순위
-- (schema.sql 을 실행한 뒤 이어서 실행)
-- Supabase 대시보드 → SQL Editor → 붙여넣고 RUN  (한 번만 하면 됩니다)
-- 이 표가 없어도 탑은 동작합니다. 순위 화면만 "준비 중"으로 보입니다.

create table if not exists public.tower_stats (
  class_code text not null,
  student    text not null,
  best       int  not null default 0,
  updated_at timestamptz not null default now(),
  primary key (class_code, student)
);

alter table public.tower_stats enable row level security;
create policy "tower_stats open" on public.tower_stats for all to anon using (true) with check (true);

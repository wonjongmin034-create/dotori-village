-- 농장 개편: 친구 농장 돕기 (여러 번 실행해도 안전하다)
-- Supabase 대시보드 → SQL Editor → 붙여넣고 RUN
--
-- 친구 마을에서 친구의 밭·우리를 눌러 문제를 맞히면 여기에 한 줄이 남는다.
-- 친구(owner)의 앱이 이 줄을 읽어서 그날 돌본 것으로 치고(시들지 않게) 도토리 1개를 받는다.
-- 같은 사람이 같은 친구를 하루에 두 번 도울 수 없다 (unique).

create table if not exists public.farm_help (
  id bigserial primary key,
  class_code text not null,
  owner text not null,
  helper text not null,
  item_key text not null,
  day text not null,
  created_at timestamptz not null default now(),
  unique (class_code, helper, owner, day)
);

create index if not exists farm_help_owner_idx on public.farm_help (class_code, owner, id);

alter table public.farm_help enable row level security;
drop policy if exists "farm_help open" on public.farm_help;
create policy "farm_help open" on public.farm_help for all to anon using (true) with check (true);

-- 오래된 기록 정리 (30일 지난 것) — 원할 때 따로 실행
-- delete from public.farm_help where created_at < now() - interval '30 days';

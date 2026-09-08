-- 도토리 마을 클라우드 저장 스키마
-- Supabase 대시보드 → SQL Editor → 새 쿼리에 붙여넣고 RUN

-- 반 (한 반에 한 줄): 숙제와 선생님 비밀번호를 담는다
create table if not exists public.classes (
  code text primary key,
  homework text not null default '',
  teacher_pin text not null default '1234',
  updated_at timestamptz not null default now()
);

-- 마을 (학생 한 명에 한 줄)
create table if not exists public.villages (
  id uuid primary key default gen_random_uuid(),
  class_code text not null references public.classes(code) on delete cascade,
  name text not null,
  pin text not null default '',
  coins int not null default 30,
  items jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  unique (class_code, name)
);

-- RLS 켜기
alter table public.classes enable row level security;
alter table public.villages enable row level security;

-- 정책: anon 키로 읽고 쓰기 허용
-- (학급용 게임, 민감정보 없음. 나중에 제대로 된 로그인을 붙이면 좁힐 수 있음)
drop policy if exists "classes open" on public.classes;
drop policy if exists "villages open" on public.villages;
create policy "classes open" on public.classes for all to anon using (true) with check (true);
create policy "villages open" on public.villages for all to anon using (true) with check (true);

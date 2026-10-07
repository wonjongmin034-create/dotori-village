-- 앱 입장 코드 (선생님만 아는 코드가 있어야 앱이 열립니다)
-- Supabase 대시보드 → SQL Editor → 붙여넣고 RUN
--
-- 코드는 이 파일이 아니라 Supabase DB에만 저장됩니다. (공개 저장소에 코드가 올라가지 않게)
-- 아래 ★ 줄의 '여기에코드'를 원하는 코드로 바꿔서 실행하세요. 코드를 바꾸고 싶으면 그 줄만 다시 실행하면 됩니다.
-- 코드를 설정하지 않으면(행이 없으면) 누구나 들어올 수 있습니다.

create table if not exists public.app_config (
  key text primary key,
  value text not null
);

-- 정책을 일부러 만들지 않음 = 앱(anon)은 이 표를 읽거나 쓸 수 없고, 아래 함수로 "맞는지"만 물어볼 수 있다.
alter table public.app_config enable row level security;

create or replace function public.check_app_code(input text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select not exists (select 1 from public.app_config where key = 'code')
      or exists (select 1 from public.app_config where key = 'code' and value = input);
$$;

revoke all on function public.check_app_code(text) from public;
grant execute on function public.check_app_code(text) to anon, authenticated;

-- ★ 입장 코드 설정 (아래 줄의 '여기에코드'를 바꿔서 실행)
insert into public.app_config (key, value) values ('code', '여기에코드')
on conflict (key) do update set value = excluded.value;

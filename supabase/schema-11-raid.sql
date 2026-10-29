-- 금요일 학급 레이드: 반 전체가 하루에 최대 3번 도전한다.
-- (schema.sql, schema-2-teacher.sql, schema-8-control.sql 을 실행한 뒤 이어서 실행)
-- Supabase 대시보드 → SQL Editor → 붙여넣고 RUN
--
-- 열리는 시간: 한국 시간 금요일 08:00 ~ 14:00
-- 도전 횟수·열림 여부는 "서버 시계"로 판단한다 → 학생 기기 시간을 바꿔도 소용없다.
-- 선생님이 "연습 열기"를 켜면(classes.control.raidPractice) 아무 요일·시간에나 연습할 수 있다. 연습은 진짜 기록과 따로 센다.

create table if not exists public.raid_runs (
  class_code text not null,
  week text not null,                 -- 'YYYY-MM-DD'(그 금요일 날짜) / 연습은 'P-YYYY-MM-DD'
  tries int not null default 0,       -- 오늘 쓴 도전 횟수 (최대 3)
  cleared boolean not null default false,
  best_phase int not null default 0,  -- 가장 멀리 간 페이즈 (1~4)
  updated_at timestamptz not null default now(),
  primary key (class_code, week)
);

-- 정책을 만들지 않는다 = 앱이 표를 직접 읽고 쓸 수 없고, 아래 함수로만 다룰 수 있다.
alter table public.raid_runs enable row level security;

-- 지금(한국 시간) 이 반의 레이드 상태
create or replace function public.raid_status(p_class text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  kst timestamp := (now() at time zone 'Asia/Seoul');
  is_fri boolean := extract(dow from kst) = 5;
  in_time boolean := extract(hour from kst) >= 8 and extract(hour from kst) < 14;
  practice boolean := coalesce((select (control->>'raidPractice')::boolean from public.classes where code = p_class), false);
  wk text;
  r public.raid_runs;
begin
  wk := case when practice and not (is_fri and in_time) then 'P-' || kst::date::text else kst::date::text end;
  select * into r from public.raid_runs where class_code = p_class and week = wk;
  return jsonb_build_object(
    'open', (is_fri and in_time) or practice,
    'practice', practice and not (is_fri and in_time),
    'tries', coalesce(r.tries, 0),
    'left', greatest(0, 3 - coalesce(r.tries, 0)),
    'cleared', coalesce(r.cleared, false),
    'best', coalesce(r.best_phase, 0),
    'week', wk
  );
end;
$$;

-- 레이드를 시작하면서 도전 횟수를 하나 쓴다 (열려 있고, 횟수가 남았고, 아직 못 깼을 때만)
create or replace function public.raid_begin(p_class text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  st jsonb := public.raid_status(p_class);
  wk text := st->>'week';
  t int;
begin
  if not (st->>'open')::boolean then return jsonb_build_object('ok', false, 'why', 'closed'); end if;
  if (st->>'cleared')::boolean then return jsonb_build_object('ok', false, 'why', 'cleared'); end if;
  insert into public.raid_runs(class_code, week) values (p_class, wk) on conflict do nothing;
  update public.raid_runs
     set tries = tries + 1, updated_at = now()
   where class_code = p_class and week = wk and tries < 3 and cleared = false
  returning tries into t;
  if t is null then return jsonb_build_object('ok', false, 'why', 'limit'); end if;
  return jsonb_build_object('ok', true, 'tries', t, 'week', wk);
end;
$$;

-- 한 번의 도전이 끝났을 때: 이겼는지, 가장 멀리 간 페이즈
create or replace function public.raid_finish(p_class text, p_won boolean, p_phase int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  st jsonb := public.raid_status(p_class);
begin
  update public.raid_runs
     set cleared = cleared or p_won,
         best_phase = greatest(best_phase, least(4, greatest(0, p_phase))),
         updated_at = now()
   where class_code = p_class and week = st->>'week';
end;
$$;

grant execute on function public.raid_status(text) to anon;
grant execute on function public.raid_begin(text) to anon;
grant execute on function public.raid_finish(text, boolean, int) to anon;

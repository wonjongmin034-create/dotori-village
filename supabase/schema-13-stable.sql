-- 안정화 + 레이드 수요일 공개 (schema-11-raid.sql 을 실행한 뒤 이어서 실행. schema-12 를 실행하지 않았어도 괜찮다 — 그 내용도 여기에 들어 있다)
-- Supabase 대시보드 → SQL Editor → 붙여넣고 RUN  (여러 번 실행해도 안전하다)
--
-- 1) 저장 충돌 막기: 마을(villages)에 "판 번호(rev)"를 둔다. 도토리나 마을이 바뀔 때마다 서버가 1씩 올린다.
--    앱은 내가 마지막으로 본 번호와 같을 때만 저장하므로, 여러 기기·창에서 같은 학생으로 들어와도 서로 덮어쓰지 않는다.
-- 2) 서버 시각: 작물이 자라는 시간·하루의 기준을 기기 시계가 아니라 서버 시각으로 잰다 (기기 시간을 바꿔도 소용없게).
-- 3) 학급 레이드: 수요일과 금요일 08:00~14:00 (한국 시간)에 열린다. 날마다 3번씩 도전할 수 있다.
--    + 이번 주 MVP 기록 (schema-12 내용)

/* ---------- 1) 판 번호 ---------- */
alter table public.villages add column if not exists rev bigint not null default 0;

create or replace function public.villages_bump_rev()
returns trigger
language plpgsql
as $$
begin
  -- 도토리나 마을(items)이 바뀔 때만 올린다 (접속 시각·비밀번호·퀴즈 통계는 올리지 않는다)
  if new.coins is distinct from old.coins or new.items is distinct from old.items then
    new.rev := old.rev + 1;
  else
    new.rev := old.rev;
  end if;
  return new;
end;
$$;

drop trigger if exists villages_bump_rev on public.villages;
create trigger villages_bump_rev
  before update on public.villages
  for each row execute function public.villages_bump_rev();

/* ---------- 2) 서버 시각 (밀리초) ---------- */
create or replace function public.server_now()
returns double precision
language sql
stable
as $$
  select extract(epoch from now()) * 1000
$$;

grant execute on function public.server_now() to anon;

/* ---------- 3) 학급 레이드: 수·금요일 + MVP ---------- */
alter table public.raid_runs add column if not exists mvp text not null default '';
alter table public.raid_runs add column if not exists mvp_dmg int not null default 0;

create or replace function public.raid_status(p_class text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  kst timestamp := (now() at time zone 'Asia/Seoul');
  is_day boolean := extract(dow from kst) in (3, 5); -- 3 = 수요일, 5 = 금요일
  in_time boolean := extract(hour from kst) >= 8 and extract(hour from kst) < 14;
  practice boolean := coalesce((select (control->>'raidPractice')::boolean from public.classes where code = p_class), false);
  wk text;
  r public.raid_runs;
  lm record;
begin
  wk := case when practice and not (is_day and in_time) then 'P-' || kst::date::text else kst::date::text end;
  select * into r from public.raid_runs where class_code = p_class and week = wk;
  -- 지난 진짜(연습이 아닌) 레이드에서 MVP가 있었던 가장 최근 날
  select week, mvp into lm
    from public.raid_runs
   where class_code = p_class and week not like 'P-%' and week < kst::date::text and mvp <> ''
   order by week desc
   limit 1;
  return jsonb_build_object(
    'open', (is_day and in_time) or practice,
    'practice', practice and not (is_day and in_time),
    'tries', coalesce(r.tries, 0),
    'left', greatest(0, 3 - coalesce(r.tries, 0)),
    'cleared', coalesce(r.cleared, false),
    'best', coalesce(r.best_phase, 0),
    'week', wk,
    'mvp', coalesce(r.mvp, ''),
    'last_mvp', coalesce(lm.mvp, ''),
    'last_week', coalesce(lm.week, '')
  );
end;
$$;

create or replace function public.raid_finish(p_class text, p_won boolean, p_phase int, p_mvp text, p_mvp_dmg int)
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
         mvp = case when p_won and coalesce(p_mvp, '') <> '' then p_mvp else mvp end,
         mvp_dmg = case when p_won and coalesce(p_mvp, '') <> '' then greatest(0, p_mvp_dmg) else mvp_dmg end,
         updated_at = now()
   where class_code = p_class and week = st->>'week';
end;
$$;

grant execute on function public.raid_status(text) to anon;
grant execute on function public.raid_finish(text, boolean, int, text, int) to anon;

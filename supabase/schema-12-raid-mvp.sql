-- 학급 레이드: "이번 주 MVP" 기록 (schema-11-raid.sql 을 실행한 뒤 이어서 실행)
-- Supabase 대시보드 → SQL Editor → 붙여넣고 RUN
--
-- 거인을 쓰러뜨린 도전에서 가장 많이 공격한 학생을 그 주의 MVP로 남긴다. (연습 기록은 따로 센다)
-- 학생 화면에는 "이번 주 MVP", "지난 MVP" 로 보인다.

alter table public.raid_runs add column if not exists mvp text not null default '';
alter table public.raid_runs add column if not exists mvp_dmg int not null default 0;

-- 지금 상태 (MVP 정보가 더해졌다)
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
  lm record;
begin
  wk := case when practice and not (is_fri and in_time) then 'P-' || kst::date::text else kst::date::text end;
  select * into r from public.raid_runs where class_code = p_class and week = wk;
  -- 지난 진짜(연습이 아닌) 레이드에서 MVP가 있었던 가장 최근 주
  select week, mvp into lm
    from public.raid_runs
   where class_code = p_class and week not like 'P-%' and week < kst::date::text and mvp <> ''
   order by week desc
   limit 1;
  return jsonb_build_object(
    'open', (is_fri and in_time) or practice,
    'practice', practice and not (is_fri and in_time),
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

-- 한 번의 도전이 끝났을 때 (이긴 도전이면 MVP도 함께 남긴다)
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

-- 매일 자동 백업 (서버 안에 비공개로 보관)
-- (schema.sql 을 실행한 뒤 이어서 실행. schema-2·7·9 를 실행하지 않았어도 괜찮아요 — 없는 표는 건너뜁니다)
-- Supabase 대시보드 → SQL Editor → 붙여넣고 RUN  (한 번만 하면 됩니다)
--
-- 하는 일
--  · 매일 새벽 4시(한국 시간)에 마을·반·도토리 지급 기록·오목 승점·탑 기록을 "그날 상태"로 저장한다.
--  · 14일치를 보관하고 더 오래된 것은 지운다.
--  · 백업 표는 학생(anon 키)이 읽거나 쓸 수 없다. 선생님이 SQL Editor 에서만 볼 수 있다.
--  · 그날 첫 백업만 남긴다 (망가진 뒤에 다시 돌려도 깨끗한 백업을 덮어쓰지 않는다).
--
-- ※ 같은 Supabase 안에 두는 백업이라, 학생이 마을을 망치거나 실수로 지웠을 때 되돌리는 용도입니다.
--   프로젝트 자체가 사라지는 일까지 막으려면 가끔 Table Editor 에서 villages 를 CSV 로 내려받아 두세요.

create table if not exists public.backup_rows (
  snap_date date not null,
  tbl       text not null,
  key       text not null,
  data      jsonb not null,
  taken_at  timestamptz not null default now(),
  primary key (snap_date, tbl, key)
);

-- 켜 두기만 하고 정책을 만들지 않는다 = anon(학생) 은 아무것도 못 한다
alter table public.backup_rows enable row level security;
revoke all on public.backup_rows from anon, authenticated;

create or replace function public.dotori_backup() returns int
language plpgsql security definer set search_path = public as $$
declare
  today date := (now() at time zone 'Asia/Seoul')::date;
  n int := 0;
  c int;
begin
  begin
    insert into backup_rows (snap_date, tbl, key, data)
      select today, 'villages', v.class_code || '|' || v.name, to_jsonb(v) from villages v
      on conflict do nothing;
    get diagnostics c = row_count; n := n + c;
  exception when undefined_table then null; end;

  begin
    insert into backup_rows (snap_date, tbl, key, data)
      select today, 'classes', k.code, to_jsonb(k) from classes k
      on conflict do nothing;
    get diagnostics c = row_count; n := n + c;
  exception when undefined_table then null; end;

  begin
    insert into backup_rows (snap_date, tbl, key, data)
      select today, 'grants', g.id::text, to_jsonb(g) from grants g
      on conflict do nothing;
    get diagnostics c = row_count; n := n + c;
  exception when undefined_table then null; end;

  begin
    insert into backup_rows (snap_date, tbl, key, data)
      select today, 'omok_stats', o.class_code || '|' || o.student || '|' || o.week, to_jsonb(o) from omok_stats o
      on conflict do nothing;
    get diagnostics c = row_count; n := n + c;
  exception when undefined_table then null; end;

  begin
    insert into backup_rows (snap_date, tbl, key, data)
      select today, 'tower_stats', t.class_code || '|' || t.student, to_jsonb(t) from tower_stats t
      on conflict do nothing;
    get diagnostics c = row_count; n := n + c;
  exception when undefined_table then null; end;

  delete from backup_rows where snap_date < today - 14;
  return n;
end $$;

-- 학생이 함수를 부르지 못하게 막는다
revoke all on function public.dotori_backup() from public, anon, authenticated;

-- 되돌리기 (선생님이 SQL Editor 에서만 부른다)
--  한 학생:  select public.dotori_restore_village('2026-10-21', '반코드', '학생이름');
--  반 전체:  select public.dotori_restore_class('2026-10-21', '반코드');
--  → 그날 백업의 도토리·마을(items)로 되돌린다. 비밀번호·퀴즈 기록은 건드리지 않는다.
--  되돌린 뒤 그 학생은 새로고침해서 다시 들어와야 한다 (열려 있던 화면이 옛 값을 다시 올리지 않게).
create or replace function public.dotori_restore_village(p_date date, p_class text, p_name text) returns text
language plpgsql security definer set search_path = public as $$
declare d jsonb;
begin
  select data into d from backup_rows where snap_date = p_date and tbl = 'villages' and key = p_class || '|' || p_name;
  if d is null then return '그 날짜에 이 학생의 백업이 없어요 (반 코드·이름·날짜를 확인해 주세요)'; end if;
  update villages set coins = (d->>'coins')::int, items = d->'items', updated_at = now()
    where class_code = p_class and name = p_name;
  if not found then return '지금 이 학생의 마을이 없어요 (이름이 바뀌었거나 지워졌어요)'; end if;
  return p_name || ' 마을을 ' || p_date || ' 상태로 되돌렸어요';
end $$;
revoke all on function public.dotori_restore_village(date, text, text) from public, anon, authenticated;

create or replace function public.dotori_restore_class(p_date date, p_class text) returns text
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  with b as (
    select (data->>'name') as name, (data->>'coins')::int as coins, data->'items' as items
    from backup_rows where snap_date = p_date and tbl = 'villages' and data->>'class_code' = p_class
  )
  update villages v set coins = b.coins, items = b.items, updated_at = now()
    from b where v.class_code = p_class and v.name = b.name;
  get diagnostics n = row_count;
  return n || '명의 마을을 ' || p_date || ' 상태로 되돌렸어요';
end $$;
revoke all on function public.dotori_restore_class(date, text) from public, anon, authenticated;

-- 어떤 날짜의 백업이 있는지 보기:
--   select snap_date, tbl, count(*) from public.backup_rows group by 1, 2 order by 1 desc, 2;

-- 매일 새벽 4시(한국) = UTC 19시에 자동으로 돌린다
create extension if not exists pg_cron with schema pg_catalog;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'dotori-backup') then
    perform cron.unschedule('dotori-backup');
  end if;
  perform cron.schedule('dotori-backup', '0 19 * * *', 'select public.dotori_backup()');
end $$;

-- 지금 바로 한 번 백업해 둔다 (몇 건이 저장됐는지 숫자가 나온다)
select public.dotori_backup() as 저장한_줄_수;

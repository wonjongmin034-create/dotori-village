-- 학습지(PDF) 보내기 · 펜으로 풀어 제출하기
-- (schema.sql → schema-2-teacher.sql → schema-3-questions.sql 실행한 뒤 이어서 실행)
-- Supabase 대시보드 → SQL Editor → 붙여넣고 RUN

-- 1) 학습지 (선생님이 올린 PDF 한 건당 한 줄)
create table if not exists public.worksheets (
  id uuid primary key default gen_random_uuid(),
  class_code text not null references public.classes(code) on delete cascade,
  title text not null,
  file_path text not null,          -- Storage 'worksheets' 버킷 안의 경로
  pages int not null default 1,
  created_at timestamptz not null default now()
);
create index if not exists worksheets_class_idx on public.worksheets (class_code, created_at desc);

-- 2) 제출물 (학생 한 명 × 학습지 한 건 = 한 줄). strokes = 쪽별 펜 필기(벡터)
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  worksheet_id uuid not null references public.worksheets(id) on delete cascade,
  class_code text not null,
  student text not null,
  strokes jsonb not null default '{}'::jsonb,
  status text not null default 'draft',   -- draft(작성중) | submitted(제출함)
  submitted_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (worksheet_id, student)
);
create index if not exists submissions_class_idx on public.submissions (class_code, worksheet_id);

alter table public.worksheets enable row level security;
alter table public.submissions enable row level security;
drop policy if exists "worksheets open" on public.worksheets;
drop policy if exists "submissions open" on public.submissions;
create policy "worksheets open" on public.worksheets for all to anon using (true) with check (true);
create policy "submissions open" on public.submissions for all to anon using (true) with check (true);

-- 3) PDF 파일 보관함 (Storage). 10MB 이하 PDF만 허용.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('worksheets', 'worksheets', true, 10485760, array['application/pdf'])
on conflict (id) do update
  set public = true, file_size_limit = 10485760, allowed_mime_types = array['application/pdf'];

drop policy if exists "worksheets read" on storage.objects;
drop policy if exists "worksheets insert" on storage.objects;
drop policy if exists "worksheets delete" on storage.objects;
create policy "worksheets read" on storage.objects for select to anon
  using (bucket_id = 'worksheets');
create policy "worksheets insert" on storage.objects for insert to anon
  with check (bucket_id = 'worksheets');
create policy "worksheets delete" on storage.objects for delete to anon
  using (bucket_id = 'worksheets');

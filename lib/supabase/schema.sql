-- FreePeriod Database Schema
-- Run this in Supabase SQL editor after creating the project

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- users table (extends auth.users)
-- ============================================================
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null default '',
  default_subject text,
  default_grade text,
  default_curriculum text,
  plan text not null default 'free',
  generation_count int not null default 0,
  generation_count_reset_at timestamptz,
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "Users can view own row"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own row"
  on public.users for update
  using (auth.uid() = id);

create policy "Users can insert own row"
  on public.users for insert
  with check (auth.uid() = id);

-- ============================================================
-- lesson_plans table
-- ============================================================
create table public.lesson_plans (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  subject text not null,
  grade text not null,
  curriculum text,
  duration_minutes int not null,
  content jsonb not null default '{}'::jsonb,
  model_used text not null,
  token_count int not null default 0,
  template_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.lesson_plans enable row level security;

create policy "Users can view own lesson plans"
  on public.lesson_plans for select
  using (auth.uid() = user_id);

create policy "Users can insert own lesson plans"
  on public.lesson_plans for insert
  with check (auth.uid() = user_id);

create policy "Users can update own lesson plans"
  on public.lesson_plans for update
  using (auth.uid() = user_id);

create policy "Users can delete own lesson plans"
  on public.lesson_plans for delete
  using (auth.uid() = user_id);

-- ============================================================
-- upload_type enum
-- ============================================================
create type public.upload_type as enum ('curriculum_doc', 'template');

-- ============================================================
-- uploads table
-- ============================================================
create table public.uploads (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  lesson_id uuid references public.lesson_plans(id) on delete set null,
  type public.upload_type not null,
  file_name text not null,
  storage_path text not null,
  parsed_content jsonb,
  created_at timestamptz not null default now()
);

alter table public.uploads enable row level security;

create policy "Users can view own uploads"
  on public.uploads for select
  using (auth.uid() = user_id);

create policy "Users can insert own uploads"
  on public.uploads for insert
  with check (auth.uid() = user_id);

create policy "Users can update own uploads"
  on public.uploads for update
  using (auth.uid() = user_id);

create policy "Users can delete own uploads"
  on public.uploads for delete
  using (auth.uid() = user_id);

-- ============================================================
-- export_format enum
-- ============================================================
create type public.export_format as enum ('docx', 'pdf', 'xlsx');

-- ============================================================
-- exports table
-- ============================================================
create table public.exports (
  id uuid primary key default uuid_generate_v4(),
  lesson_id uuid not null references public.lesson_plans(id) on delete cascade,
  format public.export_format not null,
  storage_path text not null,
  created_at timestamptz not null default now()
);

alter table public.exports enable row level security;

-- exports accessed via lesson ownership
create policy "Users can view own exports"
  on public.exports for select
  using (
    exists (
      select 1 from public.lesson_plans lp
      where lp.id = lesson_id and lp.user_id = auth.uid()
    )
  );

create policy "Users can insert own exports"
  on public.exports for insert
  with check (
    exists (
      select 1 from public.lesson_plans lp
      where lp.id = lesson_id and lp.user_id = auth.uid()
    )
  );

create policy "Users can delete own exports"
  on public.exports for delete
  using (
    exists (
      select 1 from public.lesson_plans lp
      where lp.id = lesson_id and lp.user_id = auth.uid()
    )
  );

-- ============================================================
-- Auto-create user row on sign-up
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Updated_at trigger for lesson_plans
-- ============================================================
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger lesson_plans_updated_at
  before update on public.lesson_plans
  for each row execute function public.update_updated_at();

-- ============================================================
-- Storage bucket
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit)
values ('uploads', 'uploads', false, 10485760);

-- Storage policies
create policy "Users can upload own files"
  on storage.objects for insert
  with check (
    bucket_id = 'uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can view own files"
  on storage.objects for select
  using (
    bucket_id = 'uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own files"
  on storage.objects for delete
  using (
    bucket_id = 'uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

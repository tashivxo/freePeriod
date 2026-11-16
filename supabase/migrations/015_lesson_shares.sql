-- Public share links: frozen lesson snapshot + downloadable file (service role only).

create table public.lesson_shares (
  id uuid primary key default uuid_generate_v4(),
  lesson_id uuid not null unique references public.lesson_plans(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  token text not null unique,
  snapshot jsonb not null,
  file_path text not null,
  file_name text not null,
  content_type text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.lesson_shares enable row level security;

create index lesson_shares_token_idx on public.lesson_shares (token);

grant all on table public.lesson_shares to service_role;
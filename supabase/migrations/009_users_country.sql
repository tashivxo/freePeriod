-- Self-reported teaching country (ISO 3166-1 alpha-2). Null until onboarding or Settings.

alter table public.users
  add column if not exists country text;

alter table public.users
  drop constraint if exists users_country_check;

alter table public.users
  add constraint users_country_check
  check (country is null or country ~ '^[A-Z]{2}$');

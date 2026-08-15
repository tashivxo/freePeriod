alter table public.users
  drop constraint if exists users_preferred_locale_check;

alter table public.users
  add constraint users_preferred_locale_check
  check (preferred_locale in ('en', 'ar', 'es', 'fr', 'zh-Hans'));

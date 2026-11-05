-- Account-wide default lesson plan template (path + display name).

alter table public.users
  add column if not exists default_template_path text;

alter table public.users
  add column if not exists default_template_file_name text;

alter table public.users
  drop constraint if exists users_default_template_pair_check;

alter table public.users
  add constraint users_default_template_pair_check
  check (
    (default_template_path is null) = (default_template_file_name is null)
    and (
      default_template_path is null
      or length(trim(default_template_path)) > 0
    )
    and (
      default_template_file_name is null
      or length(trim(default_template_file_name)) > 0
    )
  );

grant update (default_template_path, default_template_file_name)
  on table public.users to authenticated;

create or replace function public.protect_users_default_template_path()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  path text;
  prefix text;
begin
  path := new.default_template_path;
  if path is null then
    return new;
  end if;

  if path like '%..%' or path like '%\\%' or path like '/%' then
    raise exception 'invalid default_template_path';
  end if;

  prefix := new.id::text || '/template/';
  if left(path, length(prefix)) <> prefix then
    raise exception 'invalid default_template_path prefix';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_users_default_template_path on public.users;

create trigger protect_users_default_template_path
  before update on public.users
  for each row
  when (new.default_template_path is distinct from old.default_template_path)
  execute function public.protect_users_default_template_path();

-- Snapshot of generated lesson JSON. Set once on insert (server-side persist
-- and/or the trigger below). Never overwritten by teacher edits.
-- Nullable so existing rows stay unset; no restore UI yet.

alter table public.lesson_plans
  add column if not exists original_content jsonb;

-- Column-level revoke is the durable restriction once table-level UPDATE is
-- removed (a separate security PR). Harmless no-op if that has not landed, and
-- still correct if it already has. Never grant update on this column.
REVOKE UPDATE (original_content) ON public.lesson_plans FROM authenticated, anon;

create or replace function public.protect_lesson_plans_original_content()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.original_content is null then
      new.original_content := new.content;
    end if;
    return new;
  end if;

  -- Once written, original_content is immutable (including service_role updates).
  new.original_content := old.original_content;
  return new;
end;
$$;

drop trigger if exists protect_lesson_plans_original_content on public.lesson_plans;

create trigger protect_lesson_plans_original_content
  before insert or update on public.lesson_plans
  for each row
  execute function public.protect_lesson_plans_original_content();

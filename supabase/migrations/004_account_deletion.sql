-- Account deletion grace period (Option C: 30-day soft delete before purge)

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS deletion_scheduled_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS users_deletion_scheduled_at_idx
  ON public.users (deletion_scheduled_at)
  WHERE deletion_scheduled_at IS NOT NULL;

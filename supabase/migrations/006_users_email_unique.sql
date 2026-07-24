-- Case-insensitive unique email on public.users (synced from auth via handle_new_user)
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_uidx
  ON public.users (lower(email));

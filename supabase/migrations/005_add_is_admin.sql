-- Migration 005: Admin flag for comped Pro+ access

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- Seed initial admin accounts (re-run after signup if 0 rows affected)
UPDATE public.users
SET is_admin = true
WHERE lower(email) IN ('tashivxo@gmail.com', 'janiestribe@gmail.com');

-- Prevent authenticated/anon clients from self-granting is_admin
CREATE OR REPLACE FUNCTION public.protect_users_is_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF coalesce(auth.jwt() ->> 'role', '') IN ('service_role')
     OR current_user IN ('postgres', 'supabase_admin') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.is_admin := false;
  ELSIF TG_OP = 'UPDATE' AND NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
    NEW.is_admin := OLD.is_admin;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_users_is_admin ON public.users;
CREATE TRIGGER protect_users_is_admin
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_users_is_admin();

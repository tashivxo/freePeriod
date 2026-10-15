-- Fix protect_users_is_admin: SECURITY DEFINER makes current_user the function
-- owner (postgres), so `current_user IN ('postgres', 'supabase_admin')` always
-- skips the is_admin lock. Use the JWT role and session_user instead.

CREATE OR REPLACE FUNCTION public.protect_users_is_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF coalesce(auth.jwt() ->> 'role', '') = 'service_role'
     OR coalesce(auth.role(), '') = 'service_role'
     OR session_user IN ('postgres', 'supabase_admin') THEN
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

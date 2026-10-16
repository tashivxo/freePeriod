-- Lock privileged columns on INSERT into public.users. Authenticated clients
-- could INSERT their own row with plan='pro' and a chosen generation_count
-- because table INSERT was still granted on every column. Restrict INSERT to
-- the profile fields the app writes (callback, middleware, onboarding, sign-in,
-- sign-up, settings) and force billing/quota/deletion defaults in the
-- existing SECURITY DEFINER trigger for non-service-role writes.

REVOKE INSERT ON TABLE public.users FROM anon;
REVOKE INSERT ON TABLE public.users FROM authenticated;

GRANT INSERT (
  id,
  email,
  name,
  default_subject,
  default_grade,
  default_curriculum,
  country,
  preferred_locale,
  onboarding_complete
) ON TABLE public.users TO authenticated;

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
    NEW.plan := 'free';
    NEW.generation_count := 0;
    NEW.generation_count_reset_at := NULL;
    NEW.deletion_scheduled_at := NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.is_admin := OLD.is_admin;
    NEW.plan := OLD.plan;
    NEW.generation_count := OLD.generation_count;
    NEW.generation_count_reset_at := OLD.generation_count_reset_at;
    NEW.deletion_scheduled_at := OLD.deletion_scheduled_at;
  END IF;

  RETURN NEW;
END;
$$;

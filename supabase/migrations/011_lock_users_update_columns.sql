-- Lock privileged columns on public.users. Authenticated clients may only
-- UPDATE profile fields they legitimately write from the app. Plan, quota,
-- is_admin, id, email, and created_at stay service-role (or trigger) only.
-- Also add WITH CHECK so an UPDATE cannot change the row's id.

REVOKE UPDATE ON TABLE public.users FROM anon;
REVOKE UPDATE ON TABLE public.users FROM authenticated;

GRANT UPDATE (
  name,
  country,
  default_curriculum,
  default_grade,
  default_subject,
  onboarding_complete,
  preferred_locale
) ON TABLE public.users TO authenticated;

DROP POLICY IF EXISTS "Users can update own row" ON public.users;
CREATE POLICY "Users can update own row"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

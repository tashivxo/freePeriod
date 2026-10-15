-- Lock privileged columns on public.lesson_plans. Authenticated clients may
-- only UPDATE content (lesson editor) and updated_at (BEFORE UPDATE trigger).
-- template_path, user_id, id, created_at, model_used, and token_count are
-- written by service-role server code. WITH CHECK stops user_id reassignment.

REVOKE UPDATE ON TABLE public.lesson_plans FROM anon;
REVOKE UPDATE ON TABLE public.lesson_plans FROM authenticated;

GRANT UPDATE (
  content,
  updated_at
) ON TABLE public.lesson_plans TO authenticated;

DROP POLICY IF EXISTS "Users can update own lesson plans" ON public.lesson_plans;
CREATE POLICY "Users can update own lesson plans"
  ON public.lesson_plans FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

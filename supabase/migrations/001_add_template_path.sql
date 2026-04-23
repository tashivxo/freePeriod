-- Add template_path to lesson_plans for tracking which template was used
ALTER TABLE public.lesson_plans
  ADD COLUMN IF NOT EXISTS template_path TEXT;

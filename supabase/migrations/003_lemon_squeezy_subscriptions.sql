-- Migration 003: Replace Stripe columns with Lemon Squeezy columns in subscriptions table

ALTER TABLE public.subscriptions
  DROP COLUMN IF EXISTS stripe_customer_id,
  DROP COLUMN IF EXISTS stripe_subscription_id,
  DROP COLUMN IF EXISTS stripe_price_id,
  DROP COLUMN IF EXISTS cancel_at_period_end,
  ADD COLUMN IF NOT EXISTS ls_subscription_id  TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS ls_customer_id       TEXT,
  ADD COLUMN IF NOT EXISTS ls_order_id          TEXT,
  ADD COLUMN IF NOT EXISTS ls_product_id        TEXT,
  ADD COLUMN IF NOT EXISTS ls_variant_id        TEXT,
  ADD COLUMN IF NOT EXISTS billing_interval     TEXT,
  ADD COLUMN IF NOT EXISTS renews_at            TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ends_at              TIMESTAMPTZ;

-- Migrate data from current_period_end → renews_at (if column still exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subscriptions'
    AND column_name = 'current_period_end'
  ) THEN
    ALTER TABLE public.subscriptions
      RENAME COLUMN current_period_end TO _cpe_old;
    UPDATE public.subscriptions
      SET renews_at = _cpe_old
      WHERE renews_at IS NULL;
    ALTER TABLE public.subscriptions
      DROP COLUMN _cpe_old;
  END IF;
END $$;

-- Add plan value for pro_plus (extend CHECK constraint if one exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public' AND table_name = 'subscriptions'
    AND constraint_type = 'CHECK'
    AND constraint_name LIKE '%plan%'
  ) THEN
    -- Drop and recreate to add pro_plus
    ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;
    ALTER TABLE public.subscriptions
      ADD CONSTRAINT subscriptions_plan_check
        CHECK (plan IN ('free', 'pro', 'pro_plus'));
  END IF;
END $$;

-- Indexes for fast webhook lookups
CREATE INDEX IF NOT EXISTS subscriptions_ls_subscription_id_idx
  ON public.subscriptions (ls_subscription_id);
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx
  ON public.subscriptions (user_id);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

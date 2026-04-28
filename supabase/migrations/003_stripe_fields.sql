-- Add Stripe-specific fields to the subscriptions table (created in migration 002)
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS stripe_price_id         TEXT,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end     BOOLEAN NOT NULL DEFAULT false;

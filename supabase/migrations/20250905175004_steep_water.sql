/*
  # Create stripe_subscriptions table

  1. New Tables
    - `stripe_subscriptions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `stripe_subscription_id` (text, unique)
      - `stripe_customer_id` (text)
      - `status` (text)
      - `price_id` (text)
      - `quantity` (integer)
      - `current_period_start` (timestamp)
      - `current_period_end` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `stripe_subscriptions` table
    - Add policy for users to view their own subscriptions

  3. Indexes
    - Add performance indexes for user_id, stripe_subscription_id, and stripe_customer_id

  4. Triggers
    - Add trigger to automatically update updated_at column
*/

CREATE TABLE IF NOT EXISTS public.stripe_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_subscription_id text UNIQUE NOT NULL,
  stripe_customer_id text NOT NULL,
  status text NOT NULL,
  price_id text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  current_period_start timestamp with time zone NOT NULL,
  current_period_end timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.stripe_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions"
  ON public.stripe_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_user_id ON public.stripe_subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_stripe_subscription_id ON public.stripe_subscriptions (stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_stripe_customer_id ON public.stripe_subscriptions (stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_status ON public.stripe_subscriptions (status);

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_stripe_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
DROP TRIGGER IF EXISTS update_stripe_subscriptions_updated_at ON public.stripe_subscriptions;
CREATE TRIGGER update_stripe_subscriptions_updated_at
  BEFORE UPDATE ON public.stripe_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_stripe_subscriptions_updated_at();
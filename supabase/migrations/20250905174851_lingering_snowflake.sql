/*
  # Create stripe_orders table

  1. New Tables
    - `stripe_orders`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `stripe_session_id` (text, unique)
      - `stripe_customer_id` (text)
      - `status` (text)
      - `amount_total` (integer)
      - `currency` (text)
      - `payment_status` (text)
      - `metadata` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `stripe_orders` table
    - Add policies for users to manage their own orders
*/

CREATE TABLE IF NOT EXISTS public.stripe_orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    stripe_session_id text UNIQUE NOT NULL,
    stripe_customer_id text NOT NULL,
    status text NOT NULL,
    amount_total integer NOT NULL,
    currency text NOT NULL DEFAULT 'brl',
    payment_status text NOT NULL,
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.stripe_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own stripe_orders"
ON public.stripe_orders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stripe_orders"
ON public.stripe_orders FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stripe_orders"
ON public.stripe_orders FOR UPDATE
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stripe_orders_user_id ON public.stripe_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_orders_stripe_session_id ON public.stripe_orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_stripe_orders_created_at ON public.stripe_orders(created_at DESC);
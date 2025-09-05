/*
  # Add payment status to campaigns

  1. New Columns
    - `is_paid` (boolean) - Whether the publication fee has been paid
    - Remove automatic expiration for paid campaigns
  
  2. New Table
    - `payments` table to track Stripe transactions
    
  3. Security
    - Enable RLS on `payments` table
    - Add policies for payment management
*/

-- Add is_paid column to campaigns table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'is_paid'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN is_paid boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- Create payments table for Stripe transactions
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  stripe_payment_intent_id text UNIQUE NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('pix', 'card')),
  amount numeric(10,2) NOT NULL,
  currency text DEFAULT 'brl' NOT NULL,
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'canceled')),
  qr_code_data text,
  qr_code_image_url text,
  client_secret text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on payments table
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create policies for payments table
CREATE POLICY "Users can view their own payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaigns 
      WHERE campaigns.id = payments.campaign_id 
      AND campaigns.user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage payments"
  ON payments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_campaign_id ON payments(campaign_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_intent_id ON payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_is_paid ON campaigns(is_paid);

-- Create trigger to update updated_at on payments
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_payments_updated_at();
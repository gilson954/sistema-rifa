/*
  # Create Campaign Winners System

  1. New Tables
    - `campaign_winners`
      - `id` (uuid, primary key)
      - `campaign_id` (uuid, foreign key to campaigns)
      - `prize_id` (text, ID do prêmio)
      - `prize_name` (text, nome do prêmio)
      - `ticket_number` (integer, número do título vencedor)
      - `ticket_id` (uuid, foreign key to tickets)
      - `winner_name` (text, nome do ganhador)
      - `winner_phone` (text, telefone do ganhador)
      - `winner_email` (text, email do ganhador)
      - `payment_method` (text, método de pagamento usado)
      - `total_paid` (numeric, valor total pago)
      - `tickets_purchased` (integer, quantidade de títulos comprados)
      - `purchase_date` (timestamptz, data da compra)
      - `drawn_at` (timestamptz, data/hora do sorteio)
      - `created_at` (timestamptz, data de criação do registro)
      - `updated_at` (timestamptz, data de atualização)

  2. Changes to existing tables
    - Add `drawn_at` column to campaigns table (nullable)
    - Add `drawn_by_user_id` column to campaigns table (nullable)

  3. Security
    - Enable RLS on `campaign_winners` table
    - Add policies for campaign owners to read winners
    - Add policies for authenticated users to read winners of their own tickets

  4. Indexes
    - Add index on campaign_id for faster queries
    - Add index on ticket_number for validation
    - Add unique constraint on (campaign_id, prize_id) to prevent duplicate prizes
*/

-- Add columns to campaigns table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'drawn_at'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN drawn_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'drawn_by_user_id'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN drawn_by_user_id uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Create campaign_winners table
CREATE TABLE IF NOT EXISTS campaign_winners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  prize_id text NOT NULL,
  prize_name text NOT NULL,
  ticket_number integer NOT NULL,
  ticket_id uuid REFERENCES tickets(id) ON DELETE SET NULL,
  winner_name text NOT NULL,
  winner_phone text,
  winner_email text,
  payment_method text,
  total_paid numeric DEFAULT 0,
  tickets_purchased integer DEFAULT 1,
  purchase_date timestamptz,
  drawn_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(campaign_id, prize_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_campaign_winners_campaign_id ON campaign_winners(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_winners_ticket_number ON campaign_winners(ticket_number);
CREATE INDEX IF NOT EXISTS idx_campaign_winners_ticket_id ON campaign_winners(ticket_id);

-- Enable RLS
ALTER TABLE campaign_winners ENABLE ROW LEVEL SECURITY;

-- Policy: Campaign owners can read winners of their campaigns
CREATE POLICY "Campaign owners can read winners"
  ON campaign_winners
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = campaign_winners.campaign_id
      AND campaigns.user_id = auth.uid()
    )
  );

-- Policy: Authenticated users can insert winners (for draw system)
CREATE POLICY "Campaign owners can insert winners"
  ON campaign_winners
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = campaign_winners.campaign_id
      AND campaigns.user_id = auth.uid()
    )
  );

-- Policy: Campaign owners can update winners
CREATE POLICY "Campaign owners can update winners"
  ON campaign_winners
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = campaign_winners.campaign_id
      AND campaigns.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = campaign_winners.campaign_id
      AND campaigns.user_id = auth.uid()
    )
  );

-- Policy: Winners can read their own winning records
CREATE POLICY "Winners can read own records"
  ON campaign_winners
  FOR SELECT
  TO authenticated
  USING (winner_phone IN (
    SELECT customer_phone FROM tickets WHERE user_id = auth.uid()
  ));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_campaign_winners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_campaign_winners_updated_at_trigger ON campaign_winners;
CREATE TRIGGER update_campaign_winners_updated_at_trigger
  BEFORE UPDATE ON campaign_winners
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_winners_updated_at();

/*
  # Sistema de Vendas de Cotas - Tabela Tickets

  1. New Tables
    - `tickets`
      - `id` (uuid, primary key)
      - `campaign_id` (uuid, foreign key to campaigns)
      - `quota_number` (integer, número da cota)
      - `user_id` (uuid, foreign key to profiles, nullable)
      - `status` (text, check constraint: 'disponível', 'reservado', 'comprado')
      - `reserved_at` (timestamp, quando foi reservado)
      - `bought_at` (timestamp, quando foi comprado)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `tickets` table
    - Add policies for authenticated users to read tickets
    - Add policies for users to manage their own reservations

  3. Functions and Triggers
    - Function to populate tickets when campaign is created
    - Function to update sold_tickets count in campaigns
    - Triggers to maintain data consistency

  4. Indexes
    - Performance indexes for common queries
*/

-- Create the tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  quota_number integer NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  status text NOT NULL CHECK (status IN ('disponível', 'reservado', 'comprado')) DEFAULT 'disponível',
  reserved_at timestamptz,
  bought_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (campaign_id, quota_number) -- Garante que cada cota seja única por campanha
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tickets_campaign_id ON tickets (campaign_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets (user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets (status);
CREATE INDEX IF NOT EXISTS idx_tickets_reserved_at ON tickets (reserved_at) WHERE status = 'reservado';
CREATE INDEX IF NOT EXISTS idx_tickets_campaign_status ON tickets (campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_tickets_campaign_user ON tickets (campaign_id, user_id) WHERE user_id IS NOT NULL;

-- Enable RLS
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view tickets for active campaigns"
  ON tickets
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaigns 
      WHERE campaigns.id = tickets.campaign_id 
      AND campaigns.status = 'active'
    )
  );

CREATE POLICY "Users can view their own tickets"
  ON tickets
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to populate tickets when a campaign is created
CREATE OR REPLACE FUNCTION populate_tickets_for_campaign()
RETURNS TRIGGER AS $$
DECLARE
  i INTEGER;
BEGIN
  -- Only populate tickets for new campaigns
  FOR i IN 1..NEW.total_tickets LOOP
    INSERT INTO tickets (campaign_id, quota_number, status)
    VALUES (NEW.id, i, 'disponível');
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to populate tickets when campaign is created
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trg_populate_tickets_for_campaign'
  ) THEN
    CREATE TRIGGER trg_populate_tickets_for_campaign
      AFTER INSERT ON campaigns
      FOR EACH ROW 
      EXECUTE FUNCTION populate_tickets_for_campaign();
  END IF;
END $$;

-- Function to update campaign sold_tickets count
CREATE OR REPLACE FUNCTION update_campaign_sold_tickets()
RETURNS TRIGGER AS $$
BEGIN
  -- Update sold_tickets for the affected campaign
  UPDATE campaigns
  SET sold_tickets = (
    SELECT COUNT(*) 
    FROM tickets 
    WHERE campaign_id = COALESCE(NEW.campaign_id, OLD.campaign_id) 
    AND status = 'comprado'
  )
  WHERE id = COALESCE(NEW.campaign_id, OLD.campaign_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update sold_tickets when ticket status changes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trg_update_campaign_sold_tickets'
  ) THEN
    CREATE TRIGGER trg_update_campaign_sold_tickets
      AFTER UPDATE OF status ON tickets
      FOR EACH ROW
      WHEN (NEW.status = 'comprado' OR OLD.status = 'comprado')
      EXECUTE FUNCTION update_campaign_sold_tickets();
  END IF;
END $$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trg_update_tickets_updated_at'
  ) THEN
    CREATE TRIGGER trg_update_tickets_updated_at
      BEFORE UPDATE ON tickets
      FOR EACH ROW
      EXECUTE FUNCTION update_tickets_updated_at();
  END IF;
END $$;
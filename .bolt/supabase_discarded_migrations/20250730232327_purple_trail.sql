/*
  # Create tickets table and sales system

  1. New Tables
    - `tickets`
      - `id` (uuid, primary key)
      - `campaign_id` (uuid, foreign key to campaigns)
      - `quota_number` (integer, the ticket number)
      - `user_id` (uuid, foreign key to profiles, nullable)
      - `status` (text, check constraint: 'disponível', 'reservado', 'comprado')
      - `reserved_at` (timestamp, when ticket was reserved)
      - `bought_at` (timestamp, when ticket was purchased)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `tickets` table
    - Add policies for authenticated users to view tickets for active campaigns
    - Add policies for users to view their own tickets

  3. Functions and Triggers
    - Function to populate tickets when campaign is created
    - Function to update campaign sold_tickets count
    - Function to update tickets updated_at timestamp
    - Triggers to execute these functions automatically

  4. Indexes
    - Optimized indexes for common queries
    - Composite indexes for campaign_id + status combinations
*/

-- Create tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL,
  quota_number integer NOT NULL,
  user_id uuid DEFAULT NULL,
  status text NOT NULL DEFAULT 'disponível',
  reserved_at timestamptz DEFAULT NULL,
  bought_at timestamptz DEFAULT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT tickets_status_check CHECK (status IN ('disponível', 'reservado', 'comprado')),
  CONSTRAINT tickets_campaign_id_quota_number_key UNIQUE (campaign_id, quota_number),
  
  -- Foreign keys
  CONSTRAINT tickets_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  CONSTRAINT tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tickets_campaign_id ON tickets (campaign_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets (user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets (status);
CREATE INDEX IF NOT EXISTS idx_tickets_campaign_status ON tickets (campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_tickets_campaign_user ON tickets (campaign_id, user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tickets_reserved_at ON tickets (reserved_at) WHERE status = 'reservado';

-- Enable Row Level Security
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tickets table
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

-- Function to update tickets updated_at timestamp
CREATE OR REPLACE FUNCTION update_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update tickets updated_at
CREATE TRIGGER trg_update_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_tickets_updated_at();

-- Function to populate tickets when a campaign is created
CREATE OR REPLACE FUNCTION populate_tickets_for_campaign()
RETURNS TRIGGER AS $$
DECLARE
  i INTEGER;
BEGIN
  -- Generate tickets for the new campaign
  FOR i IN 0..(NEW.total_tickets - 1) LOOP
    INSERT INTO tickets (campaign_id, quota_number, status)
    VALUES (NEW.id, i, 'disponível');
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to populate tickets after campaign creation
CREATE TRIGGER trg_populate_tickets_for_campaign
  AFTER INSERT ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION populate_tickets_for_campaign();

-- Function to update campaign sold_tickets count
CREATE OR REPLACE FUNCTION update_campaign_sold_tickets()
RETURNS TRIGGER AS $$
BEGIN
  -- Update sold_tickets count for the affected campaign
  UPDATE campaigns
  SET sold_tickets = (
    SELECT COUNT(*) 
    FROM tickets 
    WHERE campaign_id = NEW.campaign_id 
    AND status = 'comprado'
  )
  WHERE id = NEW.campaign_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update campaign sold_tickets when ticket status changes
CREATE TRIGGER trg_update_campaign_sold_tickets
  AFTER UPDATE OF status ON tickets
  FOR EACH ROW
  WHEN (NEW.status = 'comprado' OR OLD.status = 'comprado')
  EXECUTE FUNCTION update_campaign_sold_tickets();
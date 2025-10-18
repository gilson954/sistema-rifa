/*
  # Fix Campaign Winners Table Access for Public Users

  1. Problem
    - Frontend receives 404 error when trying to access campaign_winners table
    - Anonymous users need to view winners on public campaign pages
    - Existing RLS policies may not cover all access scenarios

  2. Solution
    - Ensure campaign_winners table exists with proper structure
    - Add comprehensive RLS policies for both authenticated and anonymous users
    - Grant proper table permissions to anon role
    - Add policy for public access to winners regardless of campaign status

  3. Changes
    - Verify table exists and create if missing
    - Drop and recreate RLS policies with proper permissions
    - Grant SELECT permission to anon role
    - Add policy allowing all users to read campaign winners

  4. Security
    - RLS remains enabled to control access
    - Winners data is public information once draw is complete
    - Phone numbers should be masked in application layer for privacy
*/

-- Ensure the campaign_winners table exists
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

-- Ensure indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_campaign_winners_campaign_id ON campaign_winners(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_winners_ticket_number ON campaign_winners(ticket_number);
CREATE INDEX IF NOT EXISTS idx_campaign_winners_ticket_id ON campaign_winners(ticket_id);

-- Enable RLS if not already enabled
ALTER TABLE campaign_winners ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Campaign owners can read winners" ON campaign_winners;
DROP POLICY IF EXISTS "Campaign owners can insert winners" ON campaign_winners;
DROP POLICY IF EXISTS "Campaign owners can update winners" ON campaign_winners;
DROP POLICY IF EXISTS "Winners can read own records" ON campaign_winners;
DROP POLICY IF EXISTS "Public can read winners of completed campaigns" ON campaign_winners;
DROP POLICY IF EXISTS "Public can read all campaign winners" ON campaign_winners;

-- Grant SELECT permission to anonymous users
GRANT SELECT ON campaign_winners TO anon;
GRANT SELECT ON campaign_winners TO authenticated;

-- Policy: Anyone (authenticated or anonymous) can read all winners
-- This allows the public campaign page to display winners without authentication
CREATE POLICY "Public can read all campaign winners"
  ON campaign_winners
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Policy: Campaign owners can insert winners (for draw system)
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

-- Policy: Campaign owners can delete winners (in case of error correction)
CREATE POLICY "Campaign owners can delete winners"
  ON campaign_winners
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = campaign_winners.campaign_id
      AND campaigns.user_id = auth.uid()
    )
  );

-- Ensure the trigger function exists
CREATE OR REPLACE FUNCTION update_campaign_winners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger if needed
DROP TRIGGER IF EXISTS update_campaign_winners_updated_at_trigger ON campaign_winners;
CREATE TRIGGER update_campaign_winners_updated_at_trigger
  BEFORE UPDATE ON campaign_winners
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_winners_updated_at();

-- Add helpful comment
COMMENT ON TABLE campaign_winners IS
'Stores winners for each campaign. Publicly readable to allow displaying winners on campaign pages. Phone numbers should be masked in the application layer.';

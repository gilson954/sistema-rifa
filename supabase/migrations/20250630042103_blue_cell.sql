/*
  # Create campaigns table

  1. New Tables
    - `campaigns`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `title` (text, campaign title)
      - `description` (text, campaign description)
      - `prize_description` (text, prize details)
      - `prize_image_url` (text, optional prize image)
      - `ticket_price` (decimal, price per ticket)
      - `total_tickets` (integer, total number of tickets)
      - `sold_tickets` (integer, number of sold tickets, default 0)
      - `start_date` (timestamptz, campaign start date)
      - `end_date` (timestamptz, campaign end date)
      - `status` (text, campaign status: draft, active, completed, cancelled)
      - `winner_ticket_number` (integer, optional winning ticket)
      - `winner_user_id` (uuid, optional winner user)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `campaigns` table
    - Add policies for users to manage their own campaigns
    - Add policy for public to view active campaigns

  3. Indexes
    - Add index on user_id for faster queries
    - Add index on status for filtering
*/

CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  prize_description text NOT NULL,
  prize_image_url text,
  ticket_price decimal(10,2) NOT NULL CHECK (ticket_price > 0),
  total_tickets integer NOT NULL CHECK (total_tickets > 0),
  sold_tickets integer DEFAULT 0 CHECK (sold_tickets >= 0),
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  winner_ticket_number integer,
  winner_user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add constraint to ensure end_date is after start_date
ALTER TABLE campaigns ADD CONSTRAINT campaigns_date_check CHECK (end_date > start_date);

-- Add constraint to ensure sold_tickets doesn't exceed total_tickets
ALTER TABLE campaigns ADD CONSTRAINT campaigns_tickets_check CHECK (sold_tickets <= total_tickets);

-- Enable RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Policies for campaign management
CREATE POLICY "Users can create their own campaigns"
  ON campaigns
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own campaigns"
  ON campaigns
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaigns"
  ON campaigns
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own campaigns"
  ON campaigns
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for public to view active campaigns (for future public campaign pages)
CREATE POLICY "Anyone can view active campaigns"
  ON campaigns
  FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS campaigns_user_id_idx ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS campaigns_status_idx ON campaigns(status);
CREATE INDEX IF NOT EXISTS campaigns_created_at_idx ON campaigns(created_at DESC);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_campaigns_updated_at();
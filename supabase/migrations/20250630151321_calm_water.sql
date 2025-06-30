/*
  # Create campaigns table with proper constraint handling

  1. New Tables
    - `campaigns`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `title` (text, required)
      - `description` (text, optional)
      - `prize_description` (text, required)
      - `prize_image_url` (text, optional)
      - `ticket_price` (decimal, required, > 0)
      - `total_tickets` (integer, required, > 0)
      - `sold_tickets` (integer, default 0, >= 0)
      - `start_date` (timestamptz, required)
      - `end_date` (timestamptz, required)
      - `status` (text, default 'draft')
      - `winner_ticket_number` (integer, optional)
      - `winner_user_id` (uuid, optional foreign key)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `campaigns` table
    - Add policies for authenticated users to manage their own campaigns
    - Add policy for public to view active campaigns

  3. Constraints
    - Ensure end_date > start_date
    - Ensure sold_tickets <= total_tickets
    - Validate status values
    - Validate positive ticket_price and total_tickets

  4. Indexes
    - Index on user_id for performance
    - Index on status for filtering
    - Index on created_at for sorting
*/

-- Create campaigns table only if it doesn't exist
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

-- Add constraints only if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'campaigns_date_check'
  ) THEN
    ALTER TABLE campaigns ADD CONSTRAINT campaigns_date_check CHECK (end_date > start_date);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'campaigns_tickets_check'
  ) THEN
    ALTER TABLE campaigns ADD CONSTRAINT campaigns_tickets_check CHECK (sold_tickets <= total_tickets);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Create policies only if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'campaigns' AND policyname = 'Users can create their own campaigns'
  ) THEN
    CREATE POLICY "Users can create their own campaigns"
      ON campaigns
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'campaigns' AND policyname = 'Users can view their own campaigns'
  ) THEN
    CREATE POLICY "Users can view their own campaigns"
      ON campaigns
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'campaigns' AND policyname = 'Users can update their own campaigns'
  ) THEN
    CREATE POLICY "Users can update their own campaigns"
      ON campaigns
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'campaigns' AND policyname = 'Users can delete their own campaigns'
  ) THEN
    CREATE POLICY "Users can delete their own campaigns"
      ON campaigns
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'campaigns' AND policyname = 'Anyone can view active campaigns'
  ) THEN
    CREATE POLICY "Anyone can view active campaigns"
      ON campaigns
      FOR SELECT
      TO anon, authenticated
      USING (status = 'active');
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS campaigns_user_id_idx ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS campaigns_status_idx ON campaigns(status);
CREATE INDEX IF NOT EXISTS campaigns_created_at_idx ON campaigns(created_at DESC);

-- Create function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger only if it doesn't exist
DROP TRIGGER IF EXISTS update_campaigns_updated_at ON campaigns;
CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_campaigns_updated_at();
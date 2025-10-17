/*
  # Create Prize Quotas (Cotas Premiadas) System

  1. New Tables
    - `cotas_premiadas`
      - `id` (uuid, primary key)
      - `campaign_id` (uuid, foreign key to campaigns)
      - `numero_cota` (integer, the prize quota number)
      - `premio` (text, prize description)
      - `status` (text, values: 'disponivel', 'comprada', 'encontrada')
      - `winner_name` (text, nullable, winner's name when found)
      - `winner_phone` (text, nullable, winner's phone when found)
      - `created_at` (timestamptz, creation timestamp)
      - `updated_at` (timestamptz, last update timestamp)

  2. Campaign Updates
    - Add `cotas_premiadas_visiveis` column to campaigns table for global visibility toggle

  3. Security
    - Enable RLS on `cotas_premiadas` table
    - Public can read when campaign visibility is enabled
    - Campaign organizers can manage their prize quotas
    - Automatic updates via trigger when tickets are purchased

  4. Triggers
    - Auto-update winner information when prize quota ticket is purchased
    - Only applies to automatic mode campaigns
*/

-- Create cotas_premiadas table
CREATE TABLE IF NOT EXISTS cotas_premiadas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  numero_cota integer NOT NULL,
  premio text NOT NULL,
  status text NOT NULL DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'comprada', 'encontrada')),
  winner_name text,
  winner_phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_campaign_quota UNIQUE (campaign_id, numero_cota)
);

-- Add cotas_premiadas_visiveis column to campaigns table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'cotas_premiadas_visiveis'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN cotas_premiadas_visiveis boolean DEFAULT true;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cotas_premiadas_campaign_id ON cotas_premiadas(campaign_id);
CREATE INDEX IF NOT EXISTS idx_cotas_premiadas_status ON cotas_premiadas(status);
CREATE INDEX IF NOT EXISTS idx_cotas_premiadas_campaign_status ON cotas_premiadas(campaign_id, status);

-- Enable Row Level Security
ALTER TABLE cotas_premiadas ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view prize quotas when campaign visibility is enabled
CREATE POLICY "Public can view visible prize quotas"
  ON cotas_premiadas
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = cotas_premiadas.campaign_id
      AND campaigns.cotas_premiadas_visiveis = true
      AND campaigns.status = 'active'
    )
  );

-- Policy: Authenticated users can view their own campaign's prize quotas
CREATE POLICY "Organizers can view own prize quotas"
  ON cotas_premiadas
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = cotas_premiadas.campaign_id
      AND campaigns.user_id = auth.uid()
    )
  );

-- Policy: Campaign organizers can insert prize quotas
CREATE POLICY "Organizers can insert prize quotas"
  ON cotas_premiadas
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = cotas_premiadas.campaign_id
      AND campaigns.user_id = auth.uid()
      AND campaigns.campaign_model = 'automatic'
    )
  );

-- Policy: Campaign organizers can update their prize quotas
CREATE POLICY "Organizers can update own prize quotas"
  ON cotas_premiadas
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = cotas_premiadas.campaign_id
      AND campaigns.user_id = auth.uid()
    )
  );

-- Policy: Campaign organizers can delete their prize quotas
CREATE POLICY "Organizers can delete own prize quotas"
  ON cotas_premiadas
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = cotas_premiadas.campaign_id
      AND campaigns.user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_cotas_premiadas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_cotas_premiadas_updated_at ON cotas_premiadas;
CREATE TRIGGER trigger_update_cotas_premiadas_updated_at
  BEFORE UPDATE ON cotas_premiadas
  FOR EACH ROW
  EXECUTE FUNCTION update_cotas_premiadas_updated_at();

-- Function to automatically mark prize quota as found when ticket is purchased
CREATE OR REPLACE FUNCTION process_cota_premiada_winner()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if ticket status changed to 'comprado' and campaign is automatic mode
  IF NEW.status = 'comprado' AND (OLD.status IS NULL OR OLD.status != 'comprado') THEN
    -- Check if this ticket number is a prize quota for an automatic campaign
    UPDATE cotas_premiadas
    SET
      status = 'encontrada',
      winner_name = NEW.customer_name,
      winner_phone = NEW.customer_phone,
      updated_at = now()
    WHERE
      campaign_id = NEW.campaign_id
      AND numero_cota = NEW.quota_number
      AND status = 'disponivel'
      AND EXISTS (
        SELECT 1 FROM campaigns
        WHERE campaigns.id = NEW.campaign_id
        AND campaigns.campaign_model = 'automatic'
      );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on tickets table to auto-process prize quota winners
DROP TRIGGER IF EXISTS trigger_process_cota_premiada_winner ON tickets;
CREATE TRIGGER trigger_process_cota_premiada_winner
  AFTER INSERT OR UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION process_cota_premiada_winner();

-- Function to check if quota number is within valid range
CREATE OR REPLACE FUNCTION validate_quota_number()
RETURNS TRIGGER AS $$
DECLARE
  total_tickets integer;
BEGIN
  -- Get total tickets for the campaign
  SELECT c.total_tickets INTO total_tickets
  FROM campaigns c
  WHERE c.id = NEW.campaign_id;

  -- Validate quota number is within range
  IF NEW.numero_cota < 0 OR NEW.numero_cota >= total_tickets THEN
    RAISE EXCEPTION 'Numero da cota deve estar entre 0 e %', total_tickets - 1;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to validate quota number range
DROP TRIGGER IF EXISTS trigger_validate_quota_number ON cotas_premiadas;
CREATE TRIGGER trigger_validate_quota_number
  BEFORE INSERT OR UPDATE ON cotas_premiadas
  FOR EACH ROW
  EXECUTE FUNCTION validate_quota_number();

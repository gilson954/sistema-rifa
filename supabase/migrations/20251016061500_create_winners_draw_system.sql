/*
  # Create Winners and Draw System

  1. New Tables
    - `winners`
      - `id` (uuid, primary key)
      - `campaign_id` (uuid, foreign key to campaigns)
      - `prize_id` (text, identifier for prize from campaign prizes array)
      - `prize_name` (text, name of the prize won)
      - `prize_position` (integer, position/ranking of prize, e.g., 1 for 1st prize)
      - `ticket_number` (integer, winning ticket number)
      - `customer_name` (text, winner's name)
      - `customer_phone` (text, winner's phone)
      - `customer_email` (text, winner's email)
      - `customer_id` (uuid, nullable, reference to user if authenticated)
      - `drawn_at` (timestamptz, when draw was performed)
      - `drawn_by` (uuid, user who performed the draw)
      - `created_at` (timestamptz, default now())

  2. Campaign Table Changes
    - Add `draw_completed_at` (timestamptz, nullable)
    - Add `draw_performed_by` (uuid, nullable)

  3. Security
    - Enable RLS on `winners` table
    - Add policies for campaign owners to manage winners
    - Add policy for public to view winners of completed campaigns

  4. Functions
    - `validate_draw_tickets` - Validates ticket numbers are sold
    - `perform_campaign_draw` - Registers all winners atomically
    - `get_campaign_winners` - Retrieves winners for a campaign
    - `get_winner_details` - Gets detailed winner information
*/

-- Create winners table
CREATE TABLE IF NOT EXISTS winners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL,
  prize_id text NOT NULL,
  prize_name text NOT NULL,
  prize_position integer NOT NULL,
  ticket_number integer NOT NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  customer_id uuid,
  drawn_at timestamptz DEFAULT now(),
  drawn_by uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add foreign key constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'winners_campaign_id_fkey'
  ) THEN
    ALTER TABLE winners ADD CONSTRAINT winners_campaign_id_fkey
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'winners_drawn_by_fkey'
  ) THEN
    ALTER TABLE winners ADD CONSTRAINT winners_drawn_by_fkey
    FOREIGN KEY (drawn_by) REFERENCES auth.users(id);
  END IF;
END $$;

-- Add unique constraint to prevent duplicate winners for same prize
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'winners_campaign_prize_unique'
  ) THEN
    ALTER TABLE winners ADD CONSTRAINT winners_campaign_prize_unique
    UNIQUE (campaign_id, prize_id);
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS winners_campaign_id_idx ON winners(campaign_id);
CREATE INDEX IF NOT EXISTS winners_ticket_number_idx ON winners(ticket_number);

-- Add columns to campaigns table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'draw_completed_at'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN draw_completed_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'draw_performed_by'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN draw_performed_by uuid;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE winners ENABLE ROW LEVEL SECURITY;

-- RLS Policies for winners table
DO $$
BEGIN
  -- Policy for campaign owners to view their campaign winners
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'winners' AND policyname = 'Campaign owners can view their winners'
  ) THEN
    CREATE POLICY "Campaign owners can view their winners"
      ON winners
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM campaigns
          WHERE campaigns.id = winners.campaign_id
          AND campaigns.user_id = auth.uid()
        )
      );
  END IF;

  -- Policy for campaign owners to insert winners
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'winners' AND policyname = 'Campaign owners can create winners'
  ) THEN
    CREATE POLICY "Campaign owners can create winners"
      ON winners
      FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM campaigns
          WHERE campaigns.id = winners.campaign_id
          AND campaigns.user_id = auth.uid()
        )
      );
  END IF;

  -- Policy for public to view winners of completed campaigns
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'winners' AND policyname = 'Public can view winners of completed campaigns'
  ) THEN
    CREATE POLICY "Public can view winners of completed campaigns"
      ON winners
      FOR SELECT
      TO anon, authenticated
      USING (
        EXISTS (
          SELECT 1 FROM campaigns
          WHERE campaigns.id = winners.campaign_id
          AND campaigns.status = 'completed'
        )
      );
  END IF;
END $$;

-- Function to validate draw tickets
CREATE OR REPLACE FUNCTION validate_draw_tickets(
  p_campaign_id uuid,
  p_ticket_numbers integer[]
)
RETURNS TABLE (
  ticket_number integer,
  is_sold boolean,
  customer_name text,
  customer_phone text,
  customer_email text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.quota_number as ticket_number,
    (t.status = 'comprado') as is_sold,
    t.customer_name,
    t.customer_phone,
    t.customer_email
  FROM tickets t
  WHERE t.campaign_id = p_campaign_id
  AND t.quota_number = ANY(p_ticket_numbers)
  ORDER BY t.quota_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to perform campaign draw
CREATE OR REPLACE FUNCTION perform_campaign_draw(
  p_campaign_id uuid,
  p_user_id uuid,
  p_winners jsonb
)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
  v_winner jsonb;
  v_ticket_status text;
  v_campaign_status text;
  v_draw_completed boolean;
BEGIN
  -- Check if campaign exists and belongs to user
  SELECT status, (draw_completed_at IS NOT NULL) INTO v_campaign_status, v_draw_completed
  FROM campaigns
  WHERE id = p_campaign_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Campanha não encontrada ou você não tem permissão');
  END IF;

  IF v_draw_completed THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sorteio já foi realizado para esta campanha');
  END IF;

  -- Validate all tickets are sold before proceeding
  FOR v_winner IN SELECT * FROM jsonb_array_elements(p_winners)
  LOOP
    SELECT status INTO v_ticket_status
    FROM tickets
    WHERE campaign_id = p_campaign_id
    AND quota_number = (v_winner->>'ticketNumber')::integer;

    IF v_ticket_status IS NULL THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Título ' || (v_winner->>'ticketNumber') || ' não existe'
      );
    END IF;

    IF v_ticket_status != 'comprado' THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Título ' || (v_winner->>'ticketNumber') || ' não foi vendido'
      );
    END IF;
  END LOOP;

  -- Insert all winners
  FOR v_winner IN SELECT * FROM jsonb_array_elements(p_winners)
  LOOP
    INSERT INTO winners (
      campaign_id,
      prize_id,
      prize_name,
      prize_position,
      ticket_number,
      customer_name,
      customer_phone,
      customer_email,
      drawn_by
    )
    SELECT
      p_campaign_id,
      v_winner->>'prizeId',
      v_winner->>'prizeName',
      (v_winner->>'prizePosition')::integer,
      (v_winner->>'ticketNumber')::integer,
      t.customer_name,
      t.customer_phone,
      t.customer_email,
      p_user_id
    FROM tickets t
    WHERE t.campaign_id = p_campaign_id
    AND t.quota_number = (v_winner->>'ticketNumber')::integer;
  END LOOP;

  -- Update campaign status to completed
  UPDATE campaigns
  SET
    status = 'completed',
    draw_completed_at = now(),
    draw_performed_by = p_user_id
  WHERE id = p_campaign_id;

  RETURN jsonb_build_object('success', true, 'message', 'Sorteio realizado com sucesso');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get campaign winners
CREATE OR REPLACE FUNCTION get_campaign_winners(p_campaign_id uuid)
RETURNS TABLE (
  id uuid,
  prize_id text,
  prize_name text,
  prize_position integer,
  ticket_number integer,
  customer_name text,
  customer_phone text,
  customer_email text,
  drawn_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    w.id,
    w.prize_id,
    w.prize_name,
    w.prize_position,
    w.ticket_number,
    w.customer_name,
    w.customer_phone,
    w.customer_email,
    w.drawn_at
  FROM winners w
  WHERE w.campaign_id = p_campaign_id
  ORDER BY w.prize_position ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get winner details including all their tickets
CREATE OR REPLACE FUNCTION get_winner_details(p_winner_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
  v_winner winners%ROWTYPE;
  v_all_tickets jsonb;
  v_payment_info jsonb;
BEGIN
  -- Get winner info
  SELECT * INTO v_winner FROM winners WHERE id = p_winner_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ganhador não encontrado');
  END IF;

  -- Get all tickets purchased by this winner
  SELECT jsonb_agg(
    jsonb_build_object(
      'ticketNumber', t.quota_number,
      'isWinning', t.quota_number = v_winner.ticket_number,
      'status', t.status,
      'boughtAt', t.bought_at
    )
  ) INTO v_all_tickets
  FROM tickets t
  WHERE t.campaign_id = v_winner.campaign_id
  AND t.customer_phone = v_winner.customer_phone
  AND t.status = 'comprado'
  ORDER BY t.quota_number;

  -- Get payment information
  SELECT jsonb_build_object(
    'paymentMethod', p.payment_method,
    'totalAmount', p.amount,
    'paidAt', p.created_at
  ) INTO v_payment_info
  FROM payments p
  WHERE p.campaign_id = v_winner.campaign_id
  AND p.customer_phone = v_winner.customer_phone
  AND p.status = 'approved'
  ORDER BY p.created_at DESC
  LIMIT 1;

  -- Build result
  RETURN jsonb_build_object(
    'success', true,
    'winner', jsonb_build_object(
      'id', v_winner.id,
      'prizeName', v_winner.prize_name,
      'prizePosition', v_winner.prize_position,
      'ticketNumber', v_winner.ticket_number,
      'customerName', v_winner.customer_name,
      'customerPhone', v_winner.customer_phone,
      'customerEmail', v_winner.customer_email,
      'drawnAt', v_winner.drawn_at
    ),
    'allTickets', COALESCE(v_all_tickets, '[]'::jsonb),
    'paymentInfo', COALESCE(v_payment_info, '{}'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

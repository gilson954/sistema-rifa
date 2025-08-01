/*
  # Add customer details to tickets table

  1. New Columns
    - `customer_name` (text) - Nome do cliente que comprou a cota
    - `customer_email` (text) - Email do cliente que comprou a cota  
    - `customer_phone` (text) - Telefone do cliente que comprou a cota

  2. Security
    - Update RLS policies to allow public read access for customer data lookup
    - Add policy for customers to view their own tickets using phone number

  3. Functions
    - Create function to get tickets by phone number for customer lookup
*/

-- Add customer details columns to tickets table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tickets' AND column_name = 'customer_name'
  ) THEN
    ALTER TABLE tickets ADD COLUMN customer_name text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tickets' AND column_name = 'customer_email'
  ) THEN
    ALTER TABLE tickets ADD COLUMN customer_email text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tickets' AND column_name = 'customer_phone'
  ) THEN
    ALTER TABLE tickets ADD COLUMN customer_phone text;
  END IF;
END $$;

-- Create function to get tickets by phone number
CREATE OR REPLACE FUNCTION get_tickets_by_phone(p_phone_number text)
RETURNS TABLE (
  ticket_id uuid,
  campaign_id uuid,
  campaign_title text,
  campaign_slug text,
  prize_image_urls text[],
  quota_number integer,
  status text,
  bought_at timestamptz,
  customer_name text,
  customer_email text,
  customer_phone text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id as ticket_id,
    t.campaign_id,
    c.title as campaign_title,
    c.slug as campaign_slug,
    c.prize_image_urls,
    t.quota_number,
    t.status,
    t.bought_at,
    t.customer_name,
    t.customer_email,
    t.customer_phone
  FROM tickets t
  INNER JOIN campaigns c ON t.campaign_id = c.id
  WHERE t.customer_phone = p_phone_number
    AND t.status = 'comprado'
    AND c.status = 'active'
  ORDER BY t.bought_at DESC, c.title, t.quota_number;
END;
$$;

-- Add RLS policy for customers to view their tickets by phone
CREATE POLICY "Customers can view their tickets by phone"
  ON tickets
  FOR SELECT
  TO anon, authenticated
  USING (customer_phone IS NOT NULL);

-- Add index for phone number lookups
CREATE INDEX IF NOT EXISTS idx_tickets_customer_phone 
  ON tickets(customer_phone) 
  WHERE customer_phone IS NOT NULL AND status = 'comprado';
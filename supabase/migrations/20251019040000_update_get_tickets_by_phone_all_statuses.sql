/*
  # Update get_tickets_by_phone to include all ticket statuses

  1. Changes
    - Modify get_tickets_by_phone function to return tickets with ANY status
    - Include reserved, purchased (comprado), and expired tickets
    - Add campaign public_id to response for navigation
    - Remove status and campaign status filters
    - Update to show complete ticket history for customer

  2. Function Updates
    - Return tickets regardless of status (reservado, comprado, disponível)
    - Return tickets regardless of campaign status (active, finished, etc)
    - Add campaign public_id field for easier navigation
    - Sort by most recent activity first
*/

-- Update function to return all tickets by phone (any status)
CREATE OR REPLACE FUNCTION get_tickets_by_phone(p_phone_number text)
RETURNS TABLE (
  ticket_id uuid,
  campaign_id uuid,
  campaign_title text,
  campaign_public_id text,
  prize_image_urls text[],
  quota_number integer,
  status text,
  bought_at timestamptz,
  reserved_at timestamptz,
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
    c.public_id as campaign_public_id,
    c.prize_image_urls,
    t.quota_number,
    t.status,
    t.bought_at,
    t.reserved_at,
    t.customer_name,
    t.customer_email,
    t.customer_phone
  FROM tickets t
  INNER JOIN campaigns c ON t.campaign_id = c.id
  WHERE t.customer_phone = p_phone_number
    AND t.customer_phone IS NOT NULL
  ORDER BY
    COALESCE(t.bought_at, t.reserved_at, t.created_at) DESC,
    c.title,
    t.quota_number;
END;
$$;

-- Update index to support all statuses
DROP INDEX IF EXISTS idx_tickets_customer_phone;
CREATE INDEX IF NOT EXISTS idx_tickets_customer_phone
  ON tickets(customer_phone)
  WHERE customer_phone IS NOT NULL;

-- Add comment explaining the function behavior
COMMENT ON FUNCTION get_tickets_by_phone(text) IS
'Returns all tickets (reserved, purchased, expired) for a given phone number across all campaigns and statuses';

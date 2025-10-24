/*
  # Increase Tickets Pagination Limit to 20,000

  1. Problem
    - Current limit of 10,000 tickets per request is insufficient for large campaigns
    - Users cannot reserve tickets in campaigns with 10,000+ tickets available
    - Error: "Apenas 10000 disponíveis" appears even when more tickets exist

  2. Solution
    - Increase default limit from 10,000 to 20,000
    - Increase maximum allowed limit from 10,000 to 20,000
    - This allows campaigns with up to 20,000 tickets to work correctly

  3. Changes
    - Updated `get_campaign_tickets_status` default limit: 10000 → 20000
    - Updated maximum validation: 10000 → 20000
    - Maintains backward compatibility with existing pagination logic
*/

-- Drop existing function
DROP FUNCTION IF EXISTS get_campaign_tickets_status(uuid, uuid, integer, integer);

-- Recreate function with increased pagination limits
CREATE OR REPLACE FUNCTION get_campaign_tickets_status(
  p_campaign_id uuid,
  p_user_id uuid DEFAULT NULL,
  p_offset integer DEFAULT 0,
  p_limit integer DEFAULT 20000
)
RETURNS TABLE (
  quota_number integer,
  status text,
  user_id uuid,
  is_mine boolean,
  reserved_at timestamptz,
  bought_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reservation_timeout_minutes integer := 15;
BEGIN
  -- Validate campaign exists
  IF NOT EXISTS (SELECT 1 FROM campaigns WHERE id = p_campaign_id) THEN
    RAISE EXCEPTION 'Campaign not found';
  END IF;

  -- Validate pagination parameters
  IF p_offset < 0 THEN
    RAISE EXCEPTION 'Offset must be non-negative';
  END IF;

  IF p_limit <= 0 OR p_limit > 20000 THEN
    RAISE EXCEPTION 'Limit must be between 1 and 20000';
  END IF;

  RETURN QUERY
  SELECT
    t.quota_number,
    CASE
      -- Check if reservation expired and auto-release
      WHEN t.status = 'reservado'
           AND t.reserved_at IS NOT NULL
           AND t.reserved_at + (v_reservation_timeout_minutes || ' minutes')::interval < now()
      THEN 'disponível'::text
      ELSE t.status
    END as status,
    CASE
      -- Clear user_id for expired reservations
      WHEN t.status = 'reservado'
           AND t.reserved_at IS NOT NULL
           AND t.reserved_at + (v_reservation_timeout_minutes || ' minutes')::interval < now()
      THEN NULL::uuid
      ELSE t.user_id
    END as user_id,
    CASE
      WHEN p_user_id IS NOT NULL AND t.user_id = p_user_id
           AND NOT (t.status = 'reservado'
                   AND t.reserved_at IS NOT NULL
                   AND t.reserved_at + (v_reservation_timeout_minutes || ' minutes')::interval < now())
      THEN true
      ELSE false
    END as is_mine,
    t.reserved_at,
    t.bought_at
  FROM tickets t
  WHERE t.campaign_id = p_campaign_id
  ORDER BY t.quota_number
  OFFSET p_offset
  LIMIT p_limit;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_campaign_tickets_status(uuid, uuid, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_campaign_tickets_status(uuid, uuid, integer, integer) TO anon;

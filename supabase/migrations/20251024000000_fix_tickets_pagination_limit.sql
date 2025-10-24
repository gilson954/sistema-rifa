/*
  # Fix Tickets Pagination Limit Issue

  1. Problem
    - The `get_campaign_tickets_status` function returns all tickets but Supabase RPC has a 1000-row limit
    - This causes campaigns with more than 1000 tickets to show incorrect availability
    - Users see "Apenas 1000 disponíveis" even when the campaign has more tickets

  2. Solution
    - Add pagination support to `get_campaign_tickets_status` function
    - Add offset and limit parameters for efficient chunked loading
    - Frontend will automatically paginate to load all tickets
    - Maintains backward compatibility with existing code

  3. Changes
    - Updated `get_campaign_tickets_status` to accept `p_offset` and `p_limit` parameters
    - Default limit is 10000 (to handle large campaigns in fewer requests)
    - Function now supports efficient pagination for campaigns of any size
*/

-- Drop existing function
DROP FUNCTION IF EXISTS get_campaign_tickets_status(uuid, uuid);

-- Recreate function with pagination support
CREATE OR REPLACE FUNCTION get_campaign_tickets_status(
  p_campaign_id uuid,
  p_user_id uuid DEFAULT NULL,
  p_offset integer DEFAULT 0,
  p_limit integer DEFAULT 10000
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

  IF p_limit <= 0 OR p_limit > 10000 THEN
    RAISE EXCEPTION 'Limit must be between 1 and 10000';
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

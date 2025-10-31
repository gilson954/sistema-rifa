/*
  # Fix get_orders_by_phone function - resolve ambiguous column reference

  ## Problem
  The get_orders_by_phone function has an ambiguous column reference error.
  Line 89: campaign_id could refer to either the tickets table or campaigns table.

  ## Solution
  - Use explicit table aliases (nt.campaign_id instead of just campaign_id)
  - Implement same flexible phone matching as get_tickets_by_phone for consistency
  - Add debug logging with RAISE NOTICE

  ## Changes
  - Fix all ambiguous column references
  - Add flexible phone number matching (5 strategies)
  - Improve code readability with explicit aliases
*/

CREATE OR REPLACE FUNCTION get_orders_by_phone(p_phone_number text)
RETURNS TABLE (
  order_id text,
  campaign_id uuid,
  campaign_title text,
  campaign_public_id text,
  prize_image_urls text[],
  ticket_count integer,
  total_value numeric,
  status text,
  created_at timestamptz,
  reserved_at timestamptz,
  bought_at timestamptz,
  reservation_expires_at timestamptz,
  customer_name text,
  customer_email text,
  customer_phone text,
  ticket_numbers integer[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  normalized_search text;
  search_last_11 text;
  search_last_10 text;
BEGIN
  -- Normalize search phone number
  normalized_search := regexp_replace(p_phone_number, '[^0-9]', '', 'g');

  -- Extract suffixes for flexible matching
  search_last_11 := CASE
    WHEN length(normalized_search) >= 11 THEN right(normalized_search, 11)
    ELSE normalized_search
  END;

  search_last_10 := CASE
    WHEN length(normalized_search) >= 10 THEN right(normalized_search, 10)
    ELSE normalized_search
  END;

  RAISE NOTICE 'Phone search - Input: %, Normalized: %, Last11: %, Last10: %',
    p_phone_number, normalized_search, search_last_11, search_last_10;

  RETURN QUERY
  WITH normalized_tickets AS (
    SELECT
      t.id,
      t.campaign_id,
      t.quota_number,
      t.status,
      t.customer_name,
      t.customer_email,
      t.customer_phone,
      t.reserved_at,
      t.bought_at,
      t.reservation_expires_at,
      t.created_at,
      c.title as campaign_title,
      c.public_id as campaign_public_id,
      c.prize_image_urls,
      c.ticket_price
    FROM tickets t
    INNER JOIN campaigns c ON t.campaign_id = c.id
    WHERE
      t.customer_phone IS NOT NULL
      AND t.customer_phone <> ''
      AND (
        -- Use same flexible matching as get_tickets_by_phone
        regexp_replace(COALESCE(t.customer_phone, ''), '[^0-9]', '', 'g') = normalized_search
        OR
        right(regexp_replace(COALESCE(t.customer_phone, ''), '[^0-9]', '', 'g'), 11) = search_last_11
        OR
        right(regexp_replace(COALESCE(t.customer_phone, ''), '[^0-9]', '', 'g'), 10) = search_last_10
        OR
        regexp_replace(COALESCE(t.customer_phone, ''), '[^0-9]', '', 'g') LIKE '%' || normalized_search || '%'
        OR
        normalized_search LIKE '%' || regexp_replace(COALESCE(t.customer_phone, ''), '[^0-9]', '', 'g') || '%'
      )
  ),
  grouped_orders AS (
    SELECT
      -- Create order_id from campaign_id + reserved_at timestamp (using explicit alias)
      nt.campaign_id::text || '_' || EXTRACT(EPOCH FROM COALESCE(nt.reserved_at, nt.created_at))::text as order_id,
      nt.campaign_id,
      nt.campaign_title,
      nt.campaign_public_id,
      nt.prize_image_urls,
      COUNT(*)::integer as ticket_count,
      (COUNT(*) * MAX(nt.ticket_price))::numeric as total_value,
      -- Determine order status based on tickets
      CASE
        WHEN bool_and(nt.status = 'comprado') THEN 'purchased'
        WHEN bool_or(nt.status = 'reservado') AND
             MAX(nt.reservation_expires_at) > NOW() THEN 'reserved'
        ELSE 'expired'
      END as status,
      MIN(nt.created_at) as created_at,
      MIN(nt.reserved_at) as reserved_at,
      MAX(nt.bought_at) as bought_at,
      MAX(nt.reservation_expires_at) as reservation_expires_at,
      MAX(nt.customer_name) as customer_name,
      MAX(nt.customer_email) as customer_email,
      MAX(nt.customer_phone) as customer_phone,
      array_agg(nt.quota_number ORDER BY nt.quota_number) as ticket_numbers
    FROM normalized_tickets nt
    GROUP BY
      nt.campaign_id,
      nt.campaign_title,
      nt.campaign_public_id,
      nt.prize_image_urls,
      -- Group by reservation time (rounded to second to group same transaction)
      EXTRACT(EPOCH FROM COALESCE(nt.reserved_at, nt.created_at))::bigint
  )
  SELECT
    go.order_id,
    go.campaign_id,
    go.campaign_title,
    go.campaign_public_id,
    go.prize_image_urls,
    go.ticket_count,
    go.total_value,
    go.status,
    go.created_at,
    go.reserved_at,
    go.bought_at,
    go.reservation_expires_at,
    go.customer_name,
    go.customer_email,
    go.customer_phone,
    go.ticket_numbers
  FROM grouped_orders go
  ORDER BY
    -- Show pending orders first, then recent purchases, then expired
    CASE
      WHEN go.status = 'reserved' THEN 1
      WHEN go.status = 'purchased' THEN 2
      ELSE 3
    END,
    COALESCE(go.bought_at, go.reserved_at, go.created_at) DESC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_orders_by_phone(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_orders_by_phone(text) TO anon;

-- Add helpful comment
COMMENT ON FUNCTION get_orders_by_phone(text) IS
'Fetches customer orders (grouped reservations) by phone number. Uses flexible phone matching to find orders regardless of format. Returns order-level data with ticket count and status.';

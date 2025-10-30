/*
  # Fix Phone Search in get_orders_by_phone Function

  Updates the get_orders_by_phone function to use the same flexible phone matching
  logic as get_tickets_by_phone for consistency.

  ## Changes
  - Add support for multiple phone formats (with/without country code)
  - Match on last 11 digits for Brazilian numbers
  - Maintain all existing functionality
*/

-- Drop and recreate with improved phone matching
DROP FUNCTION IF EXISTS get_orders_by_phone(text);

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
  search_suffix text;
BEGIN
  -- Normalize the search phone number (digits only)
  normalized_search := regexp_replace(p_phone_number, '[^0-9]', '', 'g');

  -- Extract last 11 digits for Brazilian format matching
  IF length(normalized_search) >= 11 THEN
    search_suffix := right(normalized_search, 11);
  ELSE
    search_suffix := normalized_search;
  END IF;

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
      AND (
        -- Match 1: Exact match on normalized numbers (full number)
        regexp_replace(COALESCE(t.customer_phone, ''), '[^0-9]', '', 'g') = normalized_search
        OR
        -- Match 2: Match on last 11 digits (Brazilian format without country code)
        right(regexp_replace(COALESCE(t.customer_phone, ''), '[^0-9]', '', 'g'), 11) = search_suffix
        OR
        -- Match 3: Search number's last 11 digits matches stored number's last 11 digits
        right(regexp_replace(COALESCE(t.customer_phone, ''), '[^0-9]', '', 'g'), 11) =
        right(normalized_search, 11)
      )
  ),
  grouped_orders AS (
    SELECT
      campaign_id::text || '_' || EXTRACT(EPOCH FROM COALESCE(reserved_at, created_at))::text as order_id,
      campaign_id,
      campaign_title,
      campaign_public_id,
      prize_image_urls,
      COUNT(*)::integer as ticket_count,
      (COUNT(*) * MAX(ticket_price))::numeric as total_value,
      CASE
        WHEN bool_and(status = 'comprado') THEN 'purchased'
        WHEN bool_or(status = 'reservado') AND
             MAX(reservation_expires_at) > NOW() THEN 'reserved'
        ELSE 'expired'
      END as status,
      MIN(created_at) as created_at,
      MIN(reserved_at) as reserved_at,
      MAX(bought_at) as bought_at,
      MAX(reservation_expires_at) as reservation_expires_at,
      MAX(customer_name) as customer_name,
      MAX(customer_email) as customer_email,
      MAX(customer_phone) as customer_phone,
      array_agg(quota_number ORDER BY quota_number) as ticket_numbers
    FROM normalized_tickets
    GROUP BY
      campaign_id,
      campaign_title,
      campaign_public_id,
      prize_image_urls,
      EXTRACT(EPOCH FROM COALESCE(reserved_at, created_at))::bigint
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
    CASE
      WHEN go.status = 'reserved' THEN 1
      WHEN go.status = 'purchased' THEN 2
      ELSE 3
    END,
    COALESCE(go.bought_at, go.reserved_at, go.created_at) DESC;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_orders_by_phone(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_orders_by_phone(text) TO anon;

COMMENT ON FUNCTION get_orders_by_phone(text) IS
'Returns customer orders grouped by transaction with flexible phone matching. Supports multiple formats: +5562981127960, 5562981127960, 62981127960.';

/*
  # Fix Orders Grouping - Separate Individual Purchases

  1. Problem
    - Current get_orders_by_phone function groups ALL tickets from same campaign into one order
    - This is incorrect - each purchase transaction should be a separate order

  2. Solution
    - Group by campaign_id + reserved_at timestamp
    - Each unique combination of (campaign_id, reserved_at) is a separate order
    - This ensures multiple purchases from same campaign appear as separate orders

  3. Changes
    - Updated GROUP BY to include reserved_at rounded to the second
    - Each transaction (identified by unique reserved_at time) becomes a separate order
*/

-- Drop existing function
DROP FUNCTION IF EXISTS get_orders_by_phone(text);

-- Recreate function with proper grouping logic
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
BEGIN
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
      c.ticket_price,
      -- Create a grouping key based on the transaction time (rounded to second)
      -- Tickets reserved/bought at the same time belong to the same order
      date_trunc('second', COALESCE(t.reserved_at, t.created_at)) as transaction_time
    FROM tickets t
    INNER JOIN campaigns c ON t.campaign_id = c.id
    WHERE
      -- Normalize phone numbers for comparison
      regexp_replace(COALESCE(t.customer_phone, ''), '[^0-9]', '', 'g') =
      regexp_replace(p_phone_number, '[^0-9]', '', 'g')
      AND t.customer_phone IS NOT NULL
      AND regexp_replace(p_phone_number, '[^0-9]', '', 'g') <> ''
  ),
  grouped_orders AS (
    SELECT
      -- Create order_id from campaign_id + transaction_time
      nt.campaign_id::text || '_' || EXTRACT(EPOCH FROM nt.transaction_time)::text as order_id,
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
      array_agg(nt.quota_number ORDER BY nt.quota_number) as ticket_numbers,
      nt.transaction_time
    FROM normalized_tickets nt
    GROUP BY
      nt.campaign_id,
      nt.campaign_title,
      nt.campaign_public_id,
      nt.prize_image_urls,
      nt.transaction_time  -- This is the key: group by transaction time
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

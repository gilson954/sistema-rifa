/*
  # Update get_orders_by_phone to Use Physical order_id

  1. Purpose
    - Modify get_orders_by_phone to use the physical order_id column instead of generating it dynamically
    - This ensures correct order grouping and prevents order_id collision
    - Maintains backward compatibility with tickets that don't have order_id yet

  2. Problem Being Solved
    - Previous implementation generated order_id as: campaign_id + '_' + EPOCH(reserved_at)
    - When reservations expired and reserved_at was updated, the same order_id was generated
    - This caused multiple independent purchases to be grouped as one order
    - Using physical order_id ensures each reservation gets a unique, persistent identifier

  3. Changes
    - Use tickets.order_id column when available (new tickets)
    - Fall back to generated order_id for legacy tickets (tickets without order_id)
    - Group by physical order_id to ensure correct order separation
    - Maintain transaction_time for backward compatibility

  4. Backward Compatibility
    - COALESCE ensures legacy tickets (order_id IS NULL) still work
    - Generated order_id format unchanged for legacy tickets
    - New tickets always use physical order_id
    - Gradual migration as users make new reservations

  5. Impact
    - Each reservation action creates a distinct order in MyTicketsPage
    - Expired reservations cannot cause order_id reuse
    - Multiple purchases from same campaign appear as separate orders
    - Correct order counting and display in user interface
*/

-- Drop existing function
DROP FUNCTION IF EXISTS get_orders_by_phone(text);

-- Recreate function with physical order_id support
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
      -- ✅ CRITICAL FIX: Use physical order_id when available
      t.order_id as physical_order_id,
      c.title as campaign_title,
      c.public_id as campaign_public_id,
      c.prize_image_urls,
      c.ticket_price,
      -- Keep transaction_time for legacy ticket grouping
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
      -- ✅ CRITICAL FIX: Use physical order_id when available, fall back to generated for legacy
      COALESCE(
        nt.physical_order_id,
        nt.campaign_id::text || '_' || EXTRACT(EPOCH FROM nt.transaction_time)::text
      ) as order_id,
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
      nt.transaction_time,
      -- ✅ ADDED: Keep physical_order_id for grouping
      nt.physical_order_id
    FROM normalized_tickets nt
    GROUP BY
      nt.campaign_id,
      nt.campaign_title,
      nt.campaign_public_id,
      nt.prize_image_urls,
      nt.transaction_time,
      -- ✅ CRITICAL FIX: Group by physical order_id to ensure correct separation
      nt.physical_order_id
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

-- Update comment
COMMENT ON FUNCTION get_orders_by_phone(text) IS
'Fetches customer orders grouped by order_id. Uses physical order_id column when available (new tickets) and falls back to generated order_id for legacy tickets. Each unique order_id represents a distinct purchase transaction, ensuring correct order separation in MyTicketsPage even after reservation expiration.';

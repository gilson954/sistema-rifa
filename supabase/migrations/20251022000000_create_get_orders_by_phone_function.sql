/*
  # Create function to get orders (reservations) by phone number

  1. Purpose
    - Fetch customer orders grouped by reservation/transaction
    - Each order represents a single purchase attempt with multiple tickets
    - Returns order-level data instead of individual ticket data

  2. Returns
    - order_id: Unique identifier for the order
    - campaign_id: Campaign UUID
    - campaign_title: Campaign name
    - campaign_public_id: Public campaign identifier
    - prize_image_urls: Array of prize images
    - ticket_count: Number of tickets in this order
    - total_value: Total amount for this order
    - status: Order status (reserved, purchased, expired)
    - created_at: When the order was created
    - reserved_at: When tickets were reserved
    - bought_at: When the order was paid
    - reservation_expires_at: When the reservation expires
    - customer_name: Customer name
    - customer_email: Customer email
    - customer_phone: Customer phone
    - ticket_numbers: Array of ticket numbers in this order

  3. Security
    - Available to authenticated and anonymous users
    - Uses SECURITY DEFINER for consistent access
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_orders_by_phone(text);

-- Create function to get orders by phone number
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
      c.ticket_price
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
      -- Create order_id from campaign_id + reserved_at timestamp
      campaign_id::text || '_' || EXTRACT(EPOCH FROM COALESCE(reserved_at, created_at))::text as order_id,
      campaign_id,
      campaign_title,
      campaign_public_id,
      prize_image_urls,
      COUNT(*)::integer as ticket_count,
      (COUNT(*) * MAX(ticket_price))::numeric as total_value,
      -- Determine order status based on tickets
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
      -- Group by reservation time (rounded to second to group same transaction)
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

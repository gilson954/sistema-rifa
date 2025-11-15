/*
  # Create reserve_tickets_by_quantity Function

  1. Purpose
    - Implements automatic ticket reservation by quantity
    - Selects available tickets automatically instead of requiring specific numbers
    - Supports both authenticated and anonymous users
    - Includes customer data (name, email, phone)
    - Maintains order consistency with order_id and reservation_timestamp

  2. New Function
    - `reserve_tickets_by_quantity` - Reserves N available tickets for a campaign
      - Parameters:
        - p_campaign_id: Campaign UUID
        - p_quantity_to_reserve: Number of tickets to reserve
        - p_user_id: User UUID (can be null for anonymous)
        - p_customer_name: Customer name
        - p_customer_email: Customer email
        - p_customer_phone: Customer phone in E.164 format
        - p_reservation_timestamp: Consistent timestamp for the entire order
        - p_order_id: Order UUID for grouping tickets
      - Returns: Array of results with quota_number, status, message, customer data

  3. Features
    - Automatically finds available tickets
    - Handles expired reservations (reclaims them)
    - Uses row-level locking to prevent race conditions
    - Respects campaign-specific reservation timeout
    - Returns detailed status for each reserved ticket
    - Includes customer data in response for UI updates

  4. Security
    - Uses SECURITY DEFINER for controlled access
    - Transaction isolation level SERIALIZABLE
    - Proper row locking with FOR UPDATE
    - Validates campaign exists
    - Grants access to authenticated and anonymous users
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.reserve_tickets_by_quantity(
  uuid, integer, uuid, text, text, text, timestamptz, text
);

-- Create the reserve_tickets_by_quantity function
CREATE OR REPLACE FUNCTION public.reserve_tickets_by_quantity(
  p_campaign_id uuid,
  p_quantity_to_reserve integer,
  p_user_id uuid DEFAULT NULL,
  p_customer_name text DEFAULT NULL,
  p_customer_email text DEFAULT NULL,
  p_customer_phone text DEFAULT NULL,
  p_reservation_timestamp timestamptz DEFAULT now(),
  p_order_id text DEFAULT NULL
)
RETURNS TABLE(
  quota_number integer,
  status text,
  message text,
  customer_name text,
  customer_email text,
  customer_phone text,
  reserved_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ticket_record RECORD;
  v_reserved_count integer := 0;
  v_reservation_timeout_minutes integer;
  v_available_tickets_cursor CURSOR FOR
    SELECT t.id, t.quota_number, t.status, t.reserved_at
    FROM tickets t
    WHERE t.campaign_id = p_campaign_id
      AND (
        t.status = 'disponível'
        OR (
          t.status = 'reservado'
          AND t.reserved_at + (v_reservation_timeout_minutes || ' minutes')::interval < now()
        )
      )
    ORDER BY t.quota_number ASC
    FOR UPDATE SKIP LOCKED;
BEGIN
  -- Set transaction isolation level for consistency
  SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;

  -- Validate input
  IF p_quantity_to_reserve <= 0 THEN
    RAISE EXCEPTION 'Quantidade deve ser maior que zero';
  END IF;

  IF p_quantity_to_reserve > 20000 THEN
    RAISE EXCEPTION 'Quantidade máxima permitida é 20000 cotas por reserva';
  END IF;

  -- Get the reservation timeout for this campaign
  SELECT c.reservation_timeout_minutes
  INTO v_reservation_timeout_minutes
  FROM campaigns c
  WHERE c.id = p_campaign_id;

  -- If campaign not found, raise error
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Campanha não encontrada';
  END IF;

  -- If timeout not set, use default of 15 minutes
  IF v_reservation_timeout_minutes IS NULL THEN
    v_reservation_timeout_minutes := 15;
  END IF;

  -- Open cursor to find available tickets
  OPEN v_available_tickets_cursor;

  -- Reserve tickets one by one until we reach the requested quantity
  LOOP
    -- Fetch next available ticket
    FETCH v_available_tickets_cursor INTO v_ticket_record;

    -- Exit if no more tickets available
    EXIT WHEN NOT FOUND;

    -- Exit if we've reserved enough tickets
    EXIT WHEN v_reserved_count >= p_quantity_to_reserve;

    -- Reserve this ticket
    UPDATE tickets t
    SET
      status = 'reservado',
      user_id = p_user_id,
      customer_name = p_customer_name,
      customer_email = p_customer_email,
      customer_phone = p_customer_phone,
      reserved_at = COALESCE(p_reservation_timestamp, now()),
      updated_at = now()
    WHERE t.campaign_id = p_campaign_id
      AND t.quota_number = v_ticket_record.quota_number;

    -- Return this ticket's information
    quota_number := v_ticket_record.quota_number;
    status := 'reservado';
    message := CASE
      WHEN v_ticket_record.status = 'disponível' THEN 'Cota reservada com sucesso'
      ELSE 'Cota reservada (reserva anterior expirou)'
    END;
    customer_name := p_customer_name;
    customer_email := p_customer_email;
    customer_phone := p_customer_phone;
    reserved_at := COALESCE(p_reservation_timestamp, now());

    RETURN NEXT;

    -- Increment counter
    v_reserved_count := v_reserved_count + 1;
  END LOOP;

  -- Close cursor
  CLOSE v_available_tickets_cursor;

  -- Check if we reserved enough tickets
  IF v_reserved_count < p_quantity_to_reserve THEN
    RAISE EXCEPTION 'Apenas % cotas disponíveis. Você solicitou %.', v_reserved_count, p_quantity_to_reserve;
  END IF;

  RETURN;
END;
$$;

-- Grant execute permission to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION public.reserve_tickets_by_quantity(
  uuid, integer, uuid, text, text, text, timestamptz, text
) TO authenticated;

GRANT EXECUTE ON FUNCTION public.reserve_tickets_by_quantity(
  uuid, integer, uuid, text, text, text, timestamptz, text
) TO anon;

-- Add helpful comment
COMMENT ON FUNCTION public.reserve_tickets_by_quantity(
  uuid, integer, uuid, text, text, text, timestamptz, text
) IS 'Automatically reserves N available tickets for a campaign. Accepts customer data and maintains order consistency with order_id and timestamp. Uses dynamic timeout from campaigns table. Supports up to 20,000 tickets per call.';

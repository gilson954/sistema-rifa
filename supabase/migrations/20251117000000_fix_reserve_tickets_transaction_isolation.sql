/*
  # Fix Transaction Isolation Level in reserve_tickets_by_quantity

  1. Problem
    - SQL error: "SET TRANSACTION ISOLATION LEVEL must be called before any query"
    - The function was setting transaction isolation AFTER declaring the cursor
    - The cursor declaration references v_reservation_timeout_minutes which hadn't been initialized yet
    - This caused PostgreSQL to reject the transaction isolation statement

  2. Solution
    - Move SET TRANSACTION ISOLATION LEVEL to the very first line of the function body
    - Fetch v_reservation_timeout_minutes immediately after setting isolation level
    - Declare cursor AFTER all variables are properly initialized
    - Maintain all existing functionality including order_id persistence

  3. Changes
    - Reorganized function execution order for proper PostgreSQL transaction handling
    - No functional changes to reservation logic
    - All features preserved: batching, order_id, customer data, timeout handling

  4. Impact
    - Fixes the 500 error when making new ticket reservations
    - Allows reservations to process successfully
    - No breaking changes to existing code
*/

-- Drop existing function
DROP FUNCTION IF EXISTS public.reserve_tickets_by_quantity(
  uuid, integer, uuid, text, text, text, timestamptz, text
);

-- Recreate function with proper transaction isolation handling
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
  reserved_at timestamptz,
  order_id text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ticket_record RECORD;
  v_reserved_count integer := 0;
  v_reservation_timeout_minutes integer;
BEGIN
  -- CRITICAL FIX: Set transaction isolation level FIRST, before any queries
  SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;

  -- Validate input
  IF p_quantity_to_reserve <= 0 THEN
    RAISE EXCEPTION 'Quantidade deve ser maior que zero';
  END IF;

  IF p_quantity_to_reserve > 20000 THEN
    RAISE EXCEPTION 'Quantidade máxima permitida é 20000 cotas por reserva';
  END IF;

  -- Get the reservation timeout for this campaign (AFTER setting isolation level)
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

  -- Reserve tickets one by one until we reach the requested quantity
  -- Using FOR loop instead of cursor for cleaner code
  FOR v_ticket_record IN
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
    FOR UPDATE SKIP LOCKED
    LIMIT p_quantity_to_reserve
  LOOP
    -- Exit if we've reserved enough tickets
    EXIT WHEN v_reserved_count >= p_quantity_to_reserve;

    -- Reserve this ticket WITH order_id
    UPDATE tickets t
    SET
      status = 'reservado',
      user_id = p_user_id,
      customer_name = p_customer_name,
      customer_email = p_customer_email,
      customer_phone = p_customer_phone,
      reserved_at = COALESCE(p_reservation_timestamp, now()),
      order_id = p_order_id,
      updated_at = now()
    WHERE t.campaign_id = p_campaign_id
      AND t.quota_number = v_ticket_record.quota_number;

    -- Return this ticket's information with order_id
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
    order_id := p_order_id;

    RETURN NEXT;

    -- Increment counter
    v_reserved_count := v_reserved_count + 1;
  END LOOP;

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

-- Update comment
COMMENT ON FUNCTION public.reserve_tickets_by_quantity(
  uuid, integer, uuid, text, text, text, timestamptz, text
) IS 'Automatically reserves N available tickets for a campaign. Accepts customer data and maintains order consistency with order_id and timestamp. Stores order_id persistently in tickets table to prevent order_id reuse. Uses dynamic timeout from campaigns table. Supports up to 20,000 tickets per call. Fixed transaction isolation level ordering.';

/*
  # Fix reserve_tickets Function Signature Conflicts

  1. Problem
    - Multiple migrations created different versions of reserve_tickets function
    - Migration 20250825070230 drops function with 3 parameters (uuid, integer[], uuid)
    - Migration 20251018040000 creates function with 6 parameters (uuid, integer[], uuid, text, text, text)
    - This causes ambiguous column reference errors and function not found errors
    - Frontend expects 6 parameters but database may have wrong version

  2. Solution
    - Drop ALL possible versions of reserve_tickets function
    - Recreate with definitive 6-parameter signature including customer data
    - Fix "quota_number is ambiguous" error by qualifying all column references
    - Ensure proper transaction isolation and error handling

  3. Changes
    - Drop all reserve_tickets function signatures
    - Create final version with customer data parameters (name, email, phone)
    - Properly qualify all column references with table aliases
    - Maintain dynamic timeout from campaigns table
    - Support both authenticated and anonymous users

  4. Security
    - Function uses SECURITY DEFINER for controlled access
    - Proper row-level locking to prevent race conditions
    - Transaction isolation level SERIALIZABLE for consistency
*/

-- Drop all possible versions of reserve_tickets function
DROP FUNCTION IF EXISTS public.reserve_tickets(uuid, integer[], uuid);
DROP FUNCTION IF EXISTS public.reserve_tickets(uuid, integer[], uuid, text, text, text);

-- Create the definitive reserve_tickets function with customer data support
CREATE OR REPLACE FUNCTION public.reserve_tickets(
  p_campaign_id uuid,
  p_quota_numbers integer[],
  p_user_id uuid,
  p_customer_name text DEFAULT NULL,
  p_customer_email text DEFAULT NULL,
  p_customer_phone text DEFAULT NULL
)
RETURNS TABLE(
  quota_number integer,
  status text,
  message text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quota_number integer;
  v_current_status text;
  v_current_user_id uuid;
  v_reserved_at timestamptz;
  v_reservation_timeout_minutes integer;
BEGIN
  -- Set transaction isolation level for consistency
  SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;

  -- Get the reservation timeout for this campaign
  SELECT c.reservation_timeout_minutes
  INTO v_reservation_timeout_minutes
  FROM campaigns c
  WHERE c.id = p_campaign_id;

  -- If campaign not found or timeout not set, use default of 15 minutes
  IF v_reservation_timeout_minutes IS NULL THEN
    v_reservation_timeout_minutes := 15;
  END IF;

  -- Process each quota number
  FOREACH v_quota_number IN ARRAY p_quota_numbers LOOP
    -- Lock the row and get current status (qualify all columns with table alias)
    SELECT t.status, t.user_id, t.reserved_at
    INTO v_current_status, v_current_user_id, v_reserved_at
    FROM tickets t
    WHERE t.campaign_id = p_campaign_id
    AND t.quota_number = v_quota_number
    FOR UPDATE;

    IF NOT FOUND THEN
      -- Return with proper casting to avoid ambiguity
      quota_number := v_quota_number;
      status := 'error';
      message := 'Cota não encontrada';
      RETURN NEXT;
      CONTINUE;
    END IF;

    -- Check current status and handle accordingly
    CASE v_current_status
      WHEN 'disponível' THEN
        -- Available - reserve it
        UPDATE tickets t
        SET
          status = 'reservado',
          user_id = p_user_id,
          customer_name = p_customer_name,
          customer_email = p_customer_email,
          customer_phone = p_customer_phone,
          reserved_at = now(),
          updated_at = now()
        WHERE t.campaign_id = p_campaign_id
        AND t.quota_number = v_quota_number;

        quota_number := v_quota_number;
        status := 'reservado';
        message := 'Cota reservada com sucesso';
        RETURN NEXT;

      WHEN 'reservado' THEN
        -- Check if reservation expired using dynamic timeout
        IF v_reserved_at + (v_reservation_timeout_minutes || ' minutes')::interval < now() THEN
          -- Expired reservation - take it over
          UPDATE tickets t
          SET
            status = 'reservado',
            user_id = p_user_id,
            customer_name = p_customer_name,
            customer_email = p_customer_email,
            customer_phone = p_customer_phone,
            reserved_at = now(),
            updated_at = now()
          WHERE t.campaign_id = p_campaign_id
          AND t.quota_number = v_quota_number;

          quota_number := v_quota_number;
          status := 'reservado';
          message := 'Cota reservada (reserva anterior expirou)';
          RETURN NEXT;
        ELSE
          -- Still reserved by someone else
          quota_number := v_quota_number;
          status := 'reservado';
          message := 'Cota já reservada por outro usuário';
          RETURN NEXT;
        END IF;

      WHEN 'comprado' THEN
        -- Already purchased
        quota_number := v_quota_number;
        status := 'comprado';
        message := 'Cota já foi comprada';
        RETURN NEXT;

      ELSE
        quota_number := v_quota_number;
        status := 'error';
        message := 'Status inválido';
        RETURN NEXT;
    END CASE;
  END LOOP;

  RETURN;
END;
$$;

-- Grant execute permission to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION public.reserve_tickets(uuid, integer[], uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_tickets(uuid, integer[], uuid, text, text, text) TO anon;

-- Add helpful comment
COMMENT ON FUNCTION public.reserve_tickets(uuid, integer[], uuid, text, text, text) IS
'Reserves tickets for a campaign. Accepts customer data (name, email, phone) for both authenticated and anonymous users. Uses dynamic timeout from campaigns table.';

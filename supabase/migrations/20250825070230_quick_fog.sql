/*
  # Fix quota_number column ambiguity in reserve_tickets function

  1. Problem
    - The reserve_tickets function has ambiguous column reference for 'quota_number'
    - PostgreSQL cannot determine which quota_number to use when multiple sources exist

  2. Solution
    - Drop and recreate the reserve_tickets function
    - Explicitly qualify all column references with table names/aliases
    - Ensure proper transaction isolation level handling

  3. Changes
    - Fix ambiguous quota_number references by using tickets.quota_number
    - Maintain all existing functionality
    - Proper error handling and transaction management
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS reserve_tickets(uuid, integer[], uuid);

-- Create the corrected reserve_tickets function
CREATE OR REPLACE FUNCTION reserve_tickets(
  p_campaign_id uuid,
  p_quota_numbers integer[],
  p_user_id uuid
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
  v_reservation_timeout integer;
  v_current_time timestamptz;
  v_expiry_time timestamptz;
  v_result_quota integer;
  v_result_status text;
  v_result_message text;
BEGIN
  -- Set transaction isolation level as first statement
  SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
  
  -- Get current time
  v_current_time := now();
  
  -- Get reservation timeout for this campaign
  SELECT COALESCE(c.reservation_timeout_minutes, 15) 
  INTO v_reservation_timeout
  FROM campaigns c 
  WHERE c.id = p_campaign_id;
  
  -- Calculate expiry time
  v_expiry_time := v_current_time + (v_reservation_timeout || ' minutes')::interval;
  
  -- Process each quota number
  FOREACH v_quota_number IN ARRAY p_quota_numbers
  LOOP
    BEGIN
      -- Try to reserve the ticket
      UPDATE tickets 
      SET 
        status = 'reservado',
        user_id = p_user_id,
        reserved_at = v_current_time
      WHERE 
        tickets.campaign_id = p_campaign_id 
        AND tickets.quota_number = v_quota_number 
        AND tickets.status = 'disponível';
      
      -- Check if the update was successful
      IF FOUND THEN
        v_result_quota := v_quota_number;
        v_result_status := 'success';
        v_result_message := 'Cota reservada com sucesso';
      ELSE
        -- Check if ticket exists and get its current status
        SELECT tickets.status INTO v_result_status
        FROM tickets 
        WHERE tickets.campaign_id = p_campaign_id 
          AND tickets.quota_number = v_quota_number;
        
        IF v_result_status IS NULL THEN
          v_result_quota := v_quota_number;
          v_result_status := 'error';
          v_result_message := 'Cota não encontrada';
        ELSIF v_result_status = 'reservado' THEN
          v_result_quota := v_quota_number;
          v_result_status := 'error';
          v_result_message := 'Cota já está reservada';
        ELSIF v_result_status = 'comprado' THEN
          v_result_quota := v_quota_number;
          v_result_status := 'error';
          v_result_message := 'Cota já foi comprada';
        ELSE
          v_result_quota := v_quota_number;
          v_result_status := 'error';
          v_result_message := 'Cota não disponível';
        END IF;
      END IF;
      
      -- Return result for this quota
      quota_number := v_result_quota;
      status := v_result_status;
      message := v_result_message;
      RETURN NEXT;
      
    EXCEPTION WHEN OTHERS THEN
      -- Handle any unexpected errors
      quota_number := v_quota_number;
      status := 'error';
      message := 'Erro interno: ' || SQLERRM;
      RETURN NEXT;
    END;
  END LOOP;
  
  RETURN;
END;
$$;

-- Also fix the finalize_purchase function if it has the same issue
DROP FUNCTION IF EXISTS finalize_purchase(uuid, integer[], uuid);

CREATE OR REPLACE FUNCTION finalize_purchase(
  p_campaign_id uuid,
  p_quota_numbers integer[],
  p_user_id uuid
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
  v_current_time timestamptz;
  v_result_quota integer;
  v_result_status text;
  v_result_message text;
BEGIN
  -- Set transaction isolation level as first statement
  SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
  
  -- Get current time
  v_current_time := now();
  
  -- Process each quota number
  FOREACH v_quota_number IN ARRAY p_quota_numbers
  LOOP
    BEGIN
      -- Try to finalize the purchase
      UPDATE tickets 
      SET 
        status = 'comprado',
        bought_at = v_current_time
      WHERE 
        tickets.campaign_id = p_campaign_id 
        AND tickets.quota_number = v_quota_number 
        AND tickets.status = 'reservado'
        AND tickets.user_id = p_user_id;
      
      -- Check if the update was successful
      IF FOUND THEN
        v_result_quota := v_quota_number;
        v_result_status := 'success';
        v_result_message := 'Compra finalizada com sucesso';
      ELSE
        -- Check current status
        SELECT tickets.status INTO v_result_status
        FROM tickets 
        WHERE tickets.campaign_id = p_campaign_id 
          AND tickets.quota_number = v_quota_number;
        
        IF v_result_status IS NULL THEN
          v_result_quota := v_quota_number;
          v_result_status := 'error';
          v_result_message := 'Cota não encontrada';
        ELSIF v_result_status = 'comprado' THEN
          v_result_quota := v_quota_number;
          v_result_status := 'error';
          v_result_message := 'Cota já foi comprada';
        ELSIF v_result_status = 'disponível' THEN
          v_result_quota := v_quota_number;
          v_result_status := 'error';
          v_result_message := 'Cota não estava reservada';
        ELSE
          v_result_quota := v_quota_number;
          v_result_status := 'error';
          v_result_message := 'Cota não pode ser finalizada';
        END IF;
      END IF;
      
      -- Return result for this quota
      quota_number := v_result_quota;
      status := v_result_status;
      message := v_result_message;
      RETURN NEXT;
      
    EXCEPTION WHEN OTHERS THEN
      -- Handle any unexpected errors
      quota_number := v_quota_number;
      status := 'error';
      message := 'Erro interno: ' || SQLERRM;
      RETURN NEXT;
    END;
  END LOOP;
  
  RETURN;
END;
$$;
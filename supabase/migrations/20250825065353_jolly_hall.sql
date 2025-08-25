/*
  # Fix reserve_tickets function transaction isolation

  1. Function Updates
    - Fix `reserve_tickets` function to properly handle transaction isolation level
    - Ensure SET TRANSACTION ISOLATION LEVEL is the first statement
    - Maintain all existing functionality for ticket reservation

  2. Security
    - Maintain existing RLS policies
    - Keep function security definer permissions
*/

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
  v_quota integer;
  v_reservation_timeout integer;
  v_result_quota integer;
  v_result_status text;
  v_result_message text;
BEGIN
  -- Set transaction isolation level as the very first statement
  SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
  
  -- Get reservation timeout for the campaign
  SELECT reservation_timeout_minutes INTO v_reservation_timeout
  FROM campaigns 
  WHERE id = p_campaign_id;
  
  -- Default to 15 minutes if not set
  IF v_reservation_timeout IS NULL THEN
    v_reservation_timeout := 15;
  END IF;
  
  -- Process each quota number
  FOREACH v_quota IN ARRAY p_quota_numbers
  LOOP
    BEGIN
      -- Try to reserve the ticket
      UPDATE tickets 
      SET 
        status = 'reservado',
        user_id = p_user_id,
        reserved_at = now(),
        updated_at = now()
      WHERE 
        campaign_id = p_campaign_id 
        AND quota_number = v_quota 
        AND status = 'disponível';
      
      -- Check if the update was successful
      IF FOUND THEN
        v_result_quota := v_quota;
        v_result_status := 'reservado';
        v_result_message := 'Cota reservada com sucesso';
      ELSE
        -- Check if ticket exists but is not available
        IF EXISTS (
          SELECT 1 FROM tickets 
          WHERE campaign_id = p_campaign_id AND quota_number = v_quota
        ) THEN
          v_result_quota := v_quota;
          v_result_status := 'error';
          v_result_message := 'Cota não está disponível';
        ELSE
          v_result_quota := v_quota;
          v_result_status := 'error';
          v_result_message := 'Cota não encontrada';
        END IF;
      END IF;
      
      -- Return the result for this quota
      quota_number := v_result_quota;
      status := v_result_status;
      message := v_result_message;
      RETURN NEXT;
      
    EXCEPTION WHEN OTHERS THEN
      -- Handle any errors for this specific quota
      quota_number := v_quota;
      status := 'error';
      message := 'Erro interno: ' || SQLERRM;
      RETURN NEXT;
    END;
  END LOOP;
  
  RETURN;
END;
$$;
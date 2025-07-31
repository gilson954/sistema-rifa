/*
  # Update reserve_tickets function to use dynamic reservation timeout

  1. Changes
    - Modify reserve_tickets function to fetch reservation_timeout_minutes from campaigns table
    - Replace hardcoded 15-minute timeout with dynamic value per campaign
    - Improve error handling for missing campaigns
  
  2. Function Updates
    - Add campaign lookup to get reservation timeout
    - Use dynamic timeout in reservation expiration logic
    - Maintain backward compatibility with existing reservations
*/

CREATE OR REPLACE FUNCTION public.reserve_tickets(
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
  v_current_status text;
  v_current_user_id uuid;
  v_reserved_at timestamptz;
  v_reservation_timeout_minutes integer;
BEGIN
  -- Set transaction isolation level for consistency
  SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
  
  -- Get the reservation timeout for this campaign
  SELECT reservation_timeout_minutes 
  INTO v_reservation_timeout_minutes
  FROM campaigns
  WHERE id = p_campaign_id;
  
  -- If campaign not found or timeout not set, use default of 15 minutes
  IF v_reservation_timeout_minutes IS NULL THEN
    v_reservation_timeout_minutes := 15;
  END IF;
  
  FOREACH v_quota_number IN ARRAY p_quota_numbers LOOP
    -- Lock the row and get current status
    SELECT t.status, t.user_id, t.reserved_at 
    INTO v_current_status, v_current_user_id, v_reserved_at
    FROM tickets t
    WHERE t.campaign_id = p_campaign_id 
    AND t.quota_number = v_quota_number
    FOR UPDATE;
    
    IF NOT FOUND THEN
      RETURN QUERY SELECT v_quota_number, 'error'::text, 'Cota não encontrada'::text;
      CONTINUE;
    END IF;
    
    -- Check current status and handle accordingly
    CASE v_current_status
      WHEN 'disponível' THEN
        -- Available - reserve it
        UPDATE tickets
        SET 
          status = 'reservado',
          user_id = p_user_id,
          reserved_at = now(),
          updated_at = now()
        WHERE campaign_id = p_campaign_id 
        AND quota_number = v_quota_number;
        
        RETURN QUERY SELECT v_quota_number, 'reservado'::text, 'Cota reservada com sucesso'::text;
        
      WHEN 'reservado' THEN
        -- Check if reservation expired using dynamic timeout
        IF v_reserved_at + (v_reservation_timeout_minutes || ' minutes')::interval < now() THEN
          -- Expired reservation - take it over
          UPDATE tickets
          SET 
            status = 'reservado',
            user_id = p_user_id,
            reserved_at = now(),
            updated_at = now()
          WHERE campaign_id = p_campaign_id 
          AND quota_number = v_quota_number;
          
          RETURN QUERY SELECT v_quota_number, 'reservado'::text, 'Cota reservada (reserva anterior expirou)'::text;
        ELSE
          -- Still reserved by someone else
          RETURN QUERY SELECT v_quota_number, 'reservado'::text, 'Cota já reservada por outro usuário'::text;
        END IF;
        
      WHEN 'comprado' THEN
        -- Already purchased
        RETURN QUERY SELECT v_quota_number, 'comprado'::text, 'Cota já foi comprada'::text;
        
      ELSE
        RETURN QUERY SELECT v_quota_number, 'error'::text, 'Status inválido'::text;
    END CASE;
  END LOOP;
  
  RETURN;
END;
$$;
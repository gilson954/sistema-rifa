/*
  # Create RPC functions for ticket operations

  1. Functions
    - `reserve_tickets` - Reserve tickets for a user
    - `finalize_purchase` - Finalize purchase of reserved tickets
    - `release_expired_reservations` - Release expired reservations
    - `get_campaign_tickets_status` - Get optimized ticket status for frontend

  2. Security
    - All functions use SECURITY DEFINER for controlled access
    - Proper transaction handling and error management
    - Concurrency control with row-level locking
*/

-- Function to reserve tickets for a user
CREATE OR REPLACE FUNCTION reserve_tickets(
  p_campaign_id uuid,
  p_quota_numbers integer[],
  p_user_id uuid
)
RETURNS TABLE (
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
  v_reservation_timeout_minutes integer := 15; -- 15 minutes timeout
BEGIN
  -- Set transaction isolation level for consistency
  SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
  
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
        -- Check if reservation expired
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

-- Function to finalize purchase of reserved tickets
CREATE OR REPLACE FUNCTION finalize_purchase(
  p_campaign_id uuid,
  p_quota_numbers integer[],
  p_user_id uuid
)
RETURNS TABLE (
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
BEGIN
  -- Set transaction isolation level for consistency
  SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
  
  FOREACH v_quota_number IN ARRAY p_quota_numbers LOOP
    -- Lock the row and get current status
    SELECT t.status, t.user_id 
    INTO v_current_status, v_current_user_id
    FROM tickets t
    WHERE t.campaign_id = p_campaign_id 
    AND t.quota_number = v_quota_number
    FOR UPDATE;
    
    IF NOT FOUND THEN
      RETURN QUERY SELECT v_quota_number, 'error'::text, 'Cota não encontrada'::text;
      CONTINUE;
    END IF;
    
    -- Check if ticket is reserved by the same user
    IF v_current_status = 'reservado' AND v_current_user_id = p_user_id THEN
      -- Finalize the purchase
      UPDATE tickets
      SET 
        status = 'comprado',
        bought_at = now(),
        updated_at = now()
      WHERE campaign_id = p_campaign_id 
      AND quota_number = v_quota_number;
      
      RETURN QUERY SELECT v_quota_number, 'comprado'::text, 'Compra finalizada com sucesso'::text;
      
    ELSIF v_current_status = 'comprado' THEN
      RETURN QUERY SELECT v_quota_number, 'comprado'::text, 'Cota já foi comprada'::text;
      
    ELSIF v_current_status = 'reservado' AND v_current_user_id != p_user_id THEN
      RETURN QUERY SELECT v_quota_number, 'error'::text, 'Cota reservada por outro usuário'::text;
      
    ELSE
      RETURN QUERY SELECT v_quota_number, 'error'::text, 'Cota não está reservada para você'::text;
    END IF;
  END LOOP;
  
  RETURN;
END;
$$;

-- Function to release expired reservations
CREATE OR REPLACE FUNCTION release_expired_reservations(
  p_reservation_timeout_minutes integer DEFAULT 15
)
RETURNS TABLE (
  campaign_id uuid,
  quota_number integer,
  old_status text,
  new_status text,
  message text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  UPDATE tickets
  SET
    status = 'disponível',
    user_id = NULL,
    reserved_at = NULL,
    updated_at = now()
  WHERE
    status = 'reservado'
    AND reserved_at IS NOT NULL
    AND reserved_at + (p_reservation_timeout_minutes || ' minutes')::interval < now()
  RETURNING
    tickets.campaign_id,
    tickets.quota_number,
    'reservado'::text AS old_status,
    'disponível'::text AS new_status,
    'Reserva expirada e liberada'::text AS message;
END;
$$;

-- Optimized function to get campaign tickets status for frontend
CREATE OR REPLACE FUNCTION get_campaign_tickets_status(
  p_campaign_id uuid,
  p_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  quota_number integer,
  status text,
  user_id uuid,
  is_mine boolean,
  reserved_at timestamptz,
  bought_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reservation_timeout_minutes integer := 15;
BEGIN
  RETURN QUERY
  SELECT 
    t.quota_number,
    CASE 
      -- Check if reservation expired and auto-release
      WHEN t.status = 'reservado' 
           AND t.reserved_at IS NOT NULL 
           AND t.reserved_at + (v_reservation_timeout_minutes || ' minutes')::interval < now() 
      THEN 'disponível'::text
      ELSE t.status
    END as status,
    CASE 
      -- Clear user_id for expired reservations
      WHEN t.status = 'reservado' 
           AND t.reserved_at IS NOT NULL 
           AND t.reserved_at + (v_reservation_timeout_minutes || ' minutes')::interval < now() 
      THEN NULL::uuid
      ELSE t.user_id
    END as user_id,
    CASE 
      WHEN p_user_id IS NOT NULL AND t.user_id = p_user_id 
           AND NOT (t.status = 'reservado' 
                   AND t.reserved_at IS NOT NULL 
                   AND t.reserved_at + (v_reservation_timeout_minutes || ' minutes')::interval < now())
      THEN true
      ELSE false
    END as is_mine,
    t.reserved_at,
    t.bought_at
  FROM tickets t
  WHERE t.campaign_id = p_campaign_id
  ORDER BY t.quota_number;
END;
$$;
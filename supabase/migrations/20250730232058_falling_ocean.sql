/*
  # Funções RPC para Sistema de Vendas de Cotas

  1. Functions
    - `reserve_tickets`: Reserva cotas para um usuário
    - `finalize_purchase`: Finaliza a compra de cotas reservadas
    - `release_expired_reservations`: Libera reservas expiradas
    - `get_campaign_tickets_status`: Busca status de todas as cotas de uma campanha

  2. Security
    - All functions use SECURITY DEFINER for proper permissions
    - Input validation and error handling
    - Atomic transactions to prevent race conditions
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
  v_reservation_timeout_minutes integer := 15; -- Tempo de expiração da reserva
  v_now timestamptz := now();
BEGIN
  -- Validate inputs
  IF p_campaign_id IS NULL THEN
    RAISE EXCEPTION 'Campaign ID is required';
  END IF;
  
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'User ID is required';
  END IF;
  
  IF array_length(p_quota_numbers, 1) IS NULL OR array_length(p_quota_numbers, 1) = 0 THEN
    RAISE EXCEPTION 'At least one quota number is required';
  END IF;

  -- Check if campaign exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM campaigns 
    WHERE id = p_campaign_id AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Campaign not found or not active';
  END IF;

  -- Process each quota number
  FOREACH v_quota_number IN ARRAY p_quota_numbers LOOP
    -- Get current status with row lock
    SELECT t.status, t.user_id, t.reserved_at 
    INTO v_current_status, v_current_user_id, v_reserved_at
    FROM tickets t
    WHERE t.campaign_id = p_campaign_id AND t.quota_number = v_quota_number
    FOR UPDATE;

    IF NOT FOUND THEN
      RETURN QUERY SELECT v_quota_number, 'erro'::text, 'Cota não encontrada.'::text;
      CONTINUE;
    END IF;

    -- Check status and handle accordingly
    IF v_current_status = 'disponível' THEN
      -- Available, reserve it
      UPDATE tickets
      SET
        status = 'reservado',
        user_id = p_user_id,
        reserved_at = v_now,
        updated_at = v_now
      WHERE campaign_id = p_campaign_id AND quota_number = v_quota_number;
      
      RETURN QUERY SELECT v_quota_number, 'reservado'::text, 'Cota reservada com sucesso.'::text;
      
    ELSIF v_current_status = 'reservado' THEN
      -- Check if reservation expired
      IF v_reserved_at + (v_reservation_timeout_minutes || ' minutes')::interval < v_now THEN
        -- Expired reservation, reserve for new user
        UPDATE tickets
        SET
          status = 'reservado',
          user_id = p_user_id,
          reserved_at = v_now,
          updated_at = v_now
        WHERE campaign_id = p_campaign_id AND quota_number = v_quota_number;
        
        RETURN QUERY SELECT v_quota_number, 'reservado'::text, 'Cota reservada (reserva anterior expirada).'::text;
      ELSIF v_current_user_id = p_user_id THEN
        -- Already reserved by same user, extend reservation
        UPDATE tickets
        SET
          reserved_at = v_now,
          updated_at = v_now
        WHERE campaign_id = p_campaign_id AND quota_number = v_quota_number;
        
        RETURN QUERY SELECT v_quota_number, 'reservado'::text, 'Reserva renovada.'::text;
      ELSE
        -- Reserved by another user
        RETURN QUERY SELECT v_quota_number, 'reservado'::text, 'Cota já reservada por outro usuário.'::text;
      END IF;
      
    ELSIF v_current_status = 'comprado' THEN
      -- Already purchased
      RETURN QUERY SELECT v_quota_number, 'comprado'::text, 'Cota já comprada.'::text;
    END IF;
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
  v_now timestamptz := now();
BEGIN
  -- Validate inputs
  IF p_campaign_id IS NULL THEN
    RAISE EXCEPTION 'Campaign ID is required';
  END IF;
  
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'User ID is required';
  END IF;
  
  IF array_length(p_quota_numbers, 1) IS NULL OR array_length(p_quota_numbers, 1) = 0 THEN
    RAISE EXCEPTION 'At least one quota number is required';
  END IF;

  -- Process each quota number
  FOREACH v_quota_number IN ARRAY p_quota_numbers LOOP
    -- Get current status with row lock
    SELECT t.status, t.user_id 
    INTO v_current_status, v_current_user_id
    FROM tickets t
    WHERE t.campaign_id = p_campaign_id AND t.quota_number = v_quota_number
    FOR UPDATE;

    IF NOT FOUND THEN
      RETURN QUERY SELECT v_quota_number, 'erro'::text, 'Cota não encontrada.'::text;
      CONTINUE;
    END IF;

    -- Check if ticket is reserved by the same user
    IF v_current_status = 'reservado' AND v_current_user_id = p_user_id THEN
      -- Finalize purchase
      UPDATE tickets
      SET
        status = 'comprado',
        bought_at = v_now,
        updated_at = v_now
      WHERE campaign_id = p_campaign_id AND quota_number = v_quota_number;
      
      RETURN QUERY SELECT v_quota_number, 'comprado'::text, 'Cota comprada com sucesso.'::text;
      
    ELSIF v_current_status = 'comprado' THEN
      RETURN QUERY SELECT v_quota_number, 'comprado'::text, 'Cota já comprada.'::text;
    ELSE
      RETURN QUERY SELECT v_quota_number, 'erro'::text, 'Cota não reservada ou reservada por outro usuário.'::text;
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
DECLARE
  v_now timestamptz := now();
  v_expired_count integer;
BEGIN
  -- Release expired reservations
  UPDATE tickets
  SET
    status = 'disponível',
    user_id = NULL,
    reserved_at = NULL,
    updated_at = v_now
  WHERE
    status = 'reservado'
    AND reserved_at IS NOT NULL
    AND reserved_at + (p_reservation_timeout_minutes || ' minutes')::interval < v_now;
    
  GET DIAGNOSTICS v_expired_count = ROW_COUNT;
  
  -- Return summary
  RETURN QUERY
  SELECT 
    NULL::uuid as campaign_id,
    0 as quota_number,
    'summary'::text as old_status,
    'released'::text as new_status,
    format('Released %s expired reservations', v_expired_count)::text as message;
    
  RETURN;
END;
$$;

-- Function to get campaign tickets status (optimized for frontend)
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
  v_now timestamptz := now();
BEGIN
  -- Validate campaign exists
  IF NOT EXISTS (SELECT 1 FROM campaigns WHERE id = p_campaign_id) THEN
    RAISE EXCEPTION 'Campaign not found';
  END IF;

  RETURN QUERY
  SELECT 
    t.quota_number,
    CASE 
      -- Check if reservation is expired
      WHEN t.status = 'reservado' 
           AND t.reserved_at IS NOT NULL 
           AND t.reserved_at + (v_reservation_timeout_minutes || ' minutes')::interval < v_now 
      THEN 'disponível'::text
      ELSE t.status
    END as status,
    CASE 
      -- Clear user_id for expired reservations
      WHEN t.status = 'reservado' 
           AND t.reserved_at IS NOT NULL 
           AND t.reserved_at + (v_reservation_timeout_minutes || ' minutes')::interval < v_now 
      THEN NULL::uuid
      ELSE t.user_id
    END as user_id,
    CASE 
      WHEN p_user_id IS NOT NULL AND t.user_id = p_user_id 
           AND NOT (t.status = 'reservado' 
                   AND t.reserved_at IS NOT NULL 
                   AND t.reserved_at + (v_reservation_timeout_minutes || ' minutes')::interval < v_now)
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
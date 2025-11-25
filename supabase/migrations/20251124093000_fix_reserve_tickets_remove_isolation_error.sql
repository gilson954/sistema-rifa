/*
  # Fix reserve_tickets function isolation error

  1. Context
    - Frontend now envia cotas explícitas para manual/automático.
    - Função reserve_tickets ainda executa `SET TRANSACTION ISOLATION LEVEL` e o PostgREST rejeita
      porque já executou consultas antes da chamada, disparando o erro
      "SET TRANSACTION ISOLATION LEVEL must be called before any query".

  2. Solução
    - Recriar reserve_tickets removendo o comando `SET TRANSACTION ...` e mantendo toda lógica
      existente (timeout dinâmico, reaproveitamento de reservas expiradas e atualização de dados
      do cliente).
    - Mantém-se SECURITY DEFINER e permissões para anon/authenticated.
*/

DROP FUNCTION IF EXISTS public.reserve_tickets(uuid, integer[], uuid, text, text, text);

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
  -- Buscar timeout da campanha
  SELECT c.reservation_timeout_minutes
  INTO v_reservation_timeout_minutes
  FROM campaigns c
  WHERE c.id = p_campaign_id;

  IF v_reservation_timeout_minutes IS NULL THEN
    v_reservation_timeout_minutes := 15;
  END IF;

  FOREACH v_quota_number IN ARRAY p_quota_numbers LOOP
    SELECT t.status, t.user_id, t.reserved_at
    INTO v_current_status, v_current_user_id, v_reserved_at
    FROM tickets t
    WHERE t.campaign_id = p_campaign_id
      AND t.quota_number = v_quota_number
    FOR UPDATE;

    IF NOT FOUND THEN
      quota_number := v_quota_number;
      status := 'error';
      message := 'Cota não encontrada';
      RETURN NEXT;
      CONTINUE;
    END IF;

    CASE v_current_status
      WHEN 'disponível' THEN
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
        IF v_reserved_at + (v_reservation_timeout_minutes || ' minutes')::interval < now() THEN
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
          quota_number := v_quota_number;
          status := 'reservado';
          message := 'Cota já reservada por outro usuário';
          RETURN NEXT;
        END IF;

      WHEN 'comprado' THEN
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

GRANT EXECUTE ON FUNCTION public.reserve_tickets(uuid, integer[], uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_tickets(uuid, integer[], uuid, text, text, text) TO anon;

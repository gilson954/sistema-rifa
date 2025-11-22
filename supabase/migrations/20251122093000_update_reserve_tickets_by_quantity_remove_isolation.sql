DROP FUNCTION IF EXISTS public.reserve_tickets_by_quantity(
  uuid, integer, uuid, text, text, text, timestamptz, text
);

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
  IF p_quantity_to_reserve <= 0 THEN
    RAISE EXCEPTION 'Quantidade deve ser maior que zero';
  END IF;

  IF p_quantity_to_reserve > 20000 THEN
    RAISE EXCEPTION 'Quantidade máxima permitida é 20000 cotas por reserva';
  END IF;

  SELECT c.reservation_timeout_minutes
  INTO v_reservation_timeout_minutes
  FROM campaigns c
  WHERE c.id = p_campaign_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Campanha não encontrada';
  END IF;

  IF v_reservation_timeout_minutes IS NULL THEN
    v_reservation_timeout_minutes := 15;
  END IF;

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
    EXIT WHEN v_reserved_count >= p_quantity_to_reserve;

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

    v_reserved_count := v_reserved_count + 1;
  END LOOP;

  IF v_reserved_count < p_quantity_to_reserve THEN
    RAISE EXCEPTION 'Apenas % cotas disponíveis. Você solicitou %.', v_reserved_count, p_quantity_to_reserve;
  END IF;

  RETURN;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reserve_tickets_by_quantity(
  uuid, integer, uuid, text, text, text, timestamptz, text
) TO authenticated;

GRANT EXECUTE ON FUNCTION public.reserve_tickets_by_quantity(
  uuid, integer, uuid, text, text, text, timestamptz, text
) TO anon;
CREATE TABLE IF NOT EXISTS public.customer_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  order_id text NOT NULL,
  customer_email text,
  customer_phone text,
  customer_name text,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_customer_notifications_campaign_order ON public.customer_notifications (campaign_id, order_id);

ALTER TABLE public.customer_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Organizer can manage notifications" ON public.customer_notifications;
CREATE POLICY "Organizer can manage notifications"
  ON public.customer_notifications
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = customer_notifications.campaign_id
      AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = customer_notifications.campaign_id
      AND c.user_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.approve_manual_payment(p_order_id text, p_campaign_id uuid)
RETURNS TABLE(quota_number int, updated boolean) AS $$
DECLARE
  v_updated_count integer := 0;
  v_pending_after integer := 0;
  v_customer_email text;
  v_customer_phone text;
  v_customer_name text;
  v_has_notifications boolean := false;
BEGIN
  PERFORM set_config('search_path', 'public', true);

  SELECT t.customer_email, t.customer_phone, t.customer_name
  INTO v_customer_email, v_customer_phone, v_customer_name
  FROM public.tickets t
  WHERE t.campaign_id = p_campaign_id AND t.order_id = p_order_id
  LIMIT 1;

  WITH updated_rows AS (
    UPDATE public.tickets t
    SET status = 'comprado', bought_at = now(), updated_at = now()
    WHERE t.campaign_id = p_campaign_id AND t.status = 'reservado' AND t.order_id = p_order_id
    RETURNING t.quota_number
  )
  SELECT COUNT(*) INTO v_updated_count FROM updated_rows;

  IF v_updated_count = 0 THEN
    RAISE EXCEPTION 'No reserved tickets updated for order % in campaign %', p_order_id, p_campaign_id;
  END IF;

  SELECT COUNT(*) INTO v_pending_after
  FROM public.tickets t
  WHERE t.campaign_id = p_campaign_id AND t.order_id = p_order_id AND t.status = 'reservado';

  IF v_pending_after > 0 THEN
    RAISE EXCEPTION 'Integrity check failed: % tickets still reserved after approval for order %', v_pending_after, p_order_id;
  END IF;

  UPDATE public.manual_payment_proofs
  SET status = 'approved', updated_at = now()
  WHERE order_id = p_order_id AND campaign_id = p_campaign_id;

  PERFORM public.log_cleanup_operation(
    p_operation_type := 'manual_payment_approved',
    p_campaign_id := p_campaign_id,
    p_status := 'success',
    p_message := format('Manual PIX approval for order %s', p_order_id),
    p_details := jsonb_build_object(
      'order_id', p_order_id,
      'quota_numbers', (
        SELECT jsonb_agg(t.quota_number)
        FROM public.tickets t
        WHERE t.campaign_id = p_campaign_id AND t.order_id = p_order_id AND t.status = 'comprado'
      ),
      'customer_email', v_customer_email,
      'customer_phone', v_customer_phone,
      'customer_name', v_customer_name,
      'approved_by', auth.uid(),
      'approved_at', now()
    )
  );

  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'customer_notifications'
  ) INTO v_has_notifications;

  IF v_has_notifications THEN
    INSERT INTO public.customer_notifications (
      campaign_id, order_id, customer_email, customer_phone, customer_name, message, status
    ) VALUES (
      p_campaign_id, p_order_id, v_customer_email, v_customer_phone, v_customer_name,
      'Pagamento confirmado: suas cotas foram liberadas com sucesso.', 'pending'
    );
  END IF;

  RETURN QUERY
  SELECT t.quota_number, true
  FROM public.tickets t
  WHERE t.campaign_id = p_campaign_id AND t.order_id = p_order_id AND t.status = 'comprado'
  ORDER BY t.quota_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.approve_manual_payment(text, uuid) TO authenticated;

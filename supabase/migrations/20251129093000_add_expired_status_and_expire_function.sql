-- Add 'expired' status to manual_payment_proofs and implement expiration guard

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'manual_payment_proofs'
  ) THEN
    RAISE NOTICE 'manual_payment_proofs table does not exist';
  END IF;
END $$;

-- Relax and update CHECK constraint to include 'expired'
ALTER TABLE public.manual_payment_proofs
  DROP CONSTRAINT IF EXISTS manual_payment_proofs_status_check;

ALTER TABLE public.manual_payment_proofs
  ADD CONSTRAINT manual_payment_proofs_status_check
  CHECK (status IN ('pending','approved','rejected','expired'));

-- Function to mark manual payment proof as expired if reservation has expired
CREATE OR REPLACE FUNCTION public.expire_manual_payment_if_needed(p_order_id text, p_campaign_id uuid)
RETURNS boolean AS $$
DECLARE
  v_has_reserved boolean := false;
  v_max_expires timestamptz := null;
  v_marked boolean := false;
BEGIN
  -- Detect any reserved tickets for this order
  SELECT COUNT(*) > 0, MAX(t.reservation_expires_at)
  INTO v_has_reserved, v_max_expires
  FROM public.tickets t
  WHERE t.campaign_id = p_campaign_id
    AND t.order_id = p_order_id
    AND t.status = 'reservado';

  -- If there are reserved tickets and they are expired, mark proof as expired
  IF v_has_reserved AND v_max_expires IS NOT NULL AND v_max_expires < now() THEN
    UPDATE public.manual_payment_proofs
    SET status = 'expired', updated_at = now()
    WHERE campaign_id = p_campaign_id AND order_id = p_order_id AND status = 'pending';
    v_marked := true;
  END IF;

  -- If there are no reserved tickets remaining, and order isn't purchased, mark as expired
  IF NOT v_has_reserved THEN
    IF EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.campaign_id = p_campaign_id AND t.order_id = p_order_id AND t.status = 'comprado'
    ) THEN
      -- Already purchased: do not mark expired
      RETURN v_marked;
    ELSE
      UPDATE public.manual_payment_proofs
      SET status = 'expired', updated_at = now()
      WHERE campaign_id = p_campaign_id AND order_id = p_order_id AND status = 'pending';
      v_marked := true;
    END IF;
  END IF;

  RETURN v_marked;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.expire_manual_payment_if_needed(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.expire_manual_payment_if_needed(text, uuid) TO anon;

-- Update approval function to block approval when expired
CREATE OR REPLACE FUNCTION public.approve_manual_payment(p_order_id text, p_campaign_id uuid)
RETURNS TABLE(quota_number int, updated boolean) AS $$
DECLARE
  v_updated_count integer := 0;
  v_pending_after integer := 0;
  v_customer_email text;
  v_customer_phone text;
  v_customer_name text;
  v_has_reserved boolean := false;
  v_max_expires timestamptz := null;
BEGIN
  PERFORM set_config('search_path', 'public', true);

  -- Guard: prevent approval if reservation expired
  SELECT COUNT(*) > 0, MAX(t.reservation_expires_at)
  INTO v_has_reserved, v_max_expires
  FROM public.tickets t
  WHERE t.campaign_id = p_campaign_id AND t.order_id = p_order_id AND t.status = 'reservado';

  IF v_has_reserved AND v_max_expires IS NOT NULL AND v_max_expires < now() THEN
    UPDATE public.manual_payment_proofs
    SET status = 'expired', updated_at = now()
    WHERE order_id = p_order_id AND campaign_id = p_campaign_id AND status = 'pending';
    RAISE EXCEPTION 'Order % expired for campaign %', p_order_id, p_campaign_id;
  END IF;

  -- Continue with approval when not expired
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
    IF EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.campaign_id = p_campaign_id AND t.order_id = p_order_id AND t.status = 'comprado'
    ) THEN
      UPDATE public.manual_payment_proofs
      SET status = 'approved', updated_at = now()
      WHERE order_id = p_order_id AND campaign_id = p_campaign_id;
    ELSE
      RAISE EXCEPTION 'No reserved tickets updated for order % in campaign %', p_order_id, p_campaign_id;
    END IF;
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

  RETURN QUERY
  SELECT t.quota_number, true
  FROM public.tickets t
  WHERE t.campaign_id = p_campaign_id AND t.order_id = p_order_id AND t.status = 'comprado'
  ORDER BY t.quota_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.approve_manual_payment(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_manual_payment(text, uuid) TO anon;


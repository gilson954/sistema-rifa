-- Harden expire_manual_payment_if_needed to never expire approved/paid orders

CREATE OR REPLACE FUNCTION public.expire_manual_payment_if_needed(p_order_id text, p_campaign_id uuid)
RETURNS boolean AS $$
DECLARE
  v_has_reserved boolean := false;
  v_max_expires timestamptz := null;
  v_marked boolean := false;
  v_is_approved boolean := false;
  v_has_purchased boolean := false;
BEGIN
  PERFORM set_config('search_path', 'public', true);

  -- Guard: if proof already approved, never mark expired
  SELECT EXISTS (
    SELECT 1 FROM public.manual_payment_proofs m
    WHERE m.campaign_id = p_campaign_id AND m.order_id = p_order_id AND m.status = 'approved'
  ) INTO v_is_approved;

  IF v_is_approved THEN
    RETURN false;
  END IF;

  -- Check if any tickets are already purchased
  SELECT EXISTS (
    SELECT 1 FROM public.tickets t
    WHERE t.campaign_id = p_campaign_id AND t.order_id = p_order_id AND t.status = 'comprado'
  ) INTO v_has_purchased;

  -- Detect any reserved tickets for this order and latest expiration
  SELECT COUNT(*) > 0, MAX(t.reservation_expires_at)
  INTO v_has_reserved, v_max_expires
  FROM public.tickets t
  WHERE t.campaign_id = p_campaign_id
    AND t.order_id = p_order_id
    AND t.status = 'reservado';

  -- If there are reserved tickets and they are expired, mark proof as expired
  IF v_has_reserved AND v_max_expires IS NOT NULL AND v_max_expires < now() THEN
    IF NOT v_has_purchased THEN
      UPDATE public.manual_payment_proofs
      SET status = 'expired', updated_at = now()
      WHERE campaign_id = p_campaign_id AND order_id = p_order_id AND status = 'pending';
      v_marked := true;
    END IF;
  END IF;

  -- If there are no reserved tickets remaining
  IF NOT v_has_reserved THEN
    -- If order already purchased, do not mark expired
    IF v_has_purchased THEN
      RETURN v_marked;
    END IF;

    -- Otherwise, mark any pending proof as expired
    UPDATE public.manual_payment_proofs
    SET status = 'expired', updated_at = now()
    WHERE campaign_id = p_campaign_id AND order_id = p_order_id AND status = 'pending';
    v_marked := true;
  END IF;

  RETURN v_marked;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


@@ .. @@
 CREATE OR REPLACE FUNCTION public.reserve_tickets(
   p_campaign_id UUID,
   p_quota_numbers INTEGER[],
   p_user_id UUID
 )
 RETURNS TABLE (
   quota_number INTEGER,
   status TEXT,
   message TEXT
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 AS $$
 DECLARE
   v_quota_number INTEGER;
   v_current_status TEXT;
   v_reserved_at TIMESTAMP WITH TIME ZONE := now();
   v_reservation_timeout_minutes INTEGER := 15;
 BEGIN
-  -- Inicia uma transação com isolamento serializable
-  PERFORM set_config('transaction_isolation', 'serializable', true);
-
   FOREACH v_quota_number IN ARRAY p_quota_numbers LOOP
     SELECT t.status INTO v_current_status
     FROM public.tickets t
     WHERE t.campaign_id = p_campaign_id AND t.quota_number = v_quota_number
     FOR UPDATE;

@@ .. @@
 CREATE OR REPLACE FUNCTION public.finalize_purchase(
   p_campaign_id UUID,
   p_quota_numbers INTEGER[],
   p_user_id UUID
 )
 RETURNS TABLE (
   quota_number INTEGER,
   status TEXT,
   message TEXT
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 AS $$
 DECLARE
   v_quota_number INTEGER;
   v_current_status TEXT;
   v_current_user_id UUID;
 BEGIN
-  -- Inicia uma transação com isolamento serializable
-  PERFORM set_config('transaction_isolation', 'serializable', true);
-
   FOREACH v_quota_number IN ARRAY p_quota_numbers LOOP
     SELECT t.status, t.user_id INTO v_current_status, v_current_user_id
     FROM public.tickets t
     WHERE t.campaign_id = p_campaign_id AND t.quota_number = v_quota_number
     FOR UPDATE;
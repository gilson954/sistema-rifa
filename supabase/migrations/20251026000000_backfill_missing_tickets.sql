/*
  # Backfill Missing Tickets for Existing Campaigns

  1. Problem
    - Some campaigns were created without tickets being generated
    - The populate_tickets_for_campaign trigger may have failed or not fired
    - Campaign with 100,000 total_tickets has 0 tickets in database

  2. Solution
    - Create a function to backfill tickets for campaigns missing them
    - Run the function for all campaigns with missing tickets
    - This only creates tickets for campaigns where ticket count < total_tickets

  3. Changes
    - New function: backfill_campaign_tickets() - fills in missing tickets
    - Execute backfill for all existing campaigns
    - Function can be called manually if needed in the future

  4. Security
    - Function uses SECURITY DEFINER for controlled access
    - Only creates missing tickets, never deletes existing ones
    - Uses ON CONFLICT DO NOTHING to prevent duplicates
*/

-- Function to backfill missing tickets for a specific campaign
CREATE OR REPLACE FUNCTION backfill_campaign_tickets(p_campaign_id uuid)
RETURNS TABLE(
  campaign_id uuid,
  campaign_title text,
  total_tickets_needed integer,
  existing_tickets integer,
  tickets_created integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_campaign_title text;
  v_total_tickets integer;
  v_existing_count integer;
  v_created_count integer := 0;
  i integer;
BEGIN
  -- Get campaign details
  SELECT c.title, c.total_tickets
  INTO v_campaign_title, v_total_tickets
  FROM campaigns c
  WHERE c.id = p_campaign_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Campaign not found: %', p_campaign_id;
  END IF;

  -- Count existing tickets
  SELECT COUNT(*) INTO v_existing_count
  FROM tickets t
  WHERE t.campaign_id = p_campaign_id;

  RAISE NOTICE 'Campaign: % - Total needed: %, Existing: %',
    v_campaign_title, v_total_tickets, v_existing_count;

  -- Create missing tickets
  IF v_existing_count < v_total_tickets THEN
    FOR i IN (v_existing_count + 1)..v_total_tickets LOOP
      BEGIN
        INSERT INTO tickets (campaign_id, quota_number, status)
        VALUES (p_campaign_id, i, 'disponível')
        ON CONFLICT (campaign_id, quota_number) DO NOTHING;

        v_created_count := v_created_count + 1;

        -- Log progress for large campaigns (every 10000 tickets)
        IF v_created_count % 10000 = 0 THEN
          RAISE NOTICE 'Progress: % tickets created...', v_created_count;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error creating ticket %: %', i, SQLERRM;
      END;
    END LOOP;

    RAISE NOTICE '✅ Created % tickets for campaign %', v_created_count, v_campaign_title;
  ELSE
    RAISE NOTICE 'ℹ️ Campaign % already has all tickets', v_campaign_title;
  END IF;

  -- Return summary
  campaign_id := p_campaign_id;
  campaign_title := v_campaign_title;
  total_tickets_needed := v_total_tickets;
  existing_tickets := v_existing_count;
  tickets_created := v_created_count;
  RETURN NEXT;
END;
$$;

-- Function to backfill ALL campaigns with missing tickets
CREATE OR REPLACE FUNCTION backfill_all_campaigns_tickets()
RETURNS TABLE(
  campaign_id uuid,
  campaign_title text,
  total_tickets_needed integer,
  existing_tickets integer,
  tickets_created integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_campaign_record RECORD;
  v_result RECORD;
BEGIN
  RAISE NOTICE '🚀 Starting backfill for all campaigns...';

  FOR v_campaign_record IN
    SELECT c.id, c.title, c.total_tickets,
           COALESCE((SELECT COUNT(*) FROM tickets t WHERE t.campaign_id = c.id), 0) as ticket_count
    FROM campaigns c
    WHERE c.total_tickets > 0
    ORDER BY c.created_at DESC
  LOOP
    -- Only process campaigns with missing tickets
    IF v_campaign_record.ticket_count < v_campaign_record.total_tickets THEN
      RAISE NOTICE '📋 Processing campaign: % (ID: %)', v_campaign_record.title, v_campaign_record.id;

      FOR v_result IN
        SELECT * FROM backfill_campaign_tickets(v_campaign_record.id)
      LOOP
        campaign_id := v_result.campaign_id;
        campaign_title := v_result.campaign_title;
        total_tickets_needed := v_result.total_tickets_needed;
        existing_tickets := v_result.existing_tickets;
        tickets_created := v_result.tickets_created;
        RETURN NEXT;
      END LOOP;
    ELSE
      RAISE NOTICE '✓ Campaign % already has all tickets', v_campaign_record.title;
    END IF;
  END LOOP;

  RAISE NOTICE '✅ Backfill complete!';
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION backfill_campaign_tickets(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION backfill_all_campaigns_tickets() TO authenticated;

-- Execute backfill for all campaigns
DO $$
DECLARE
  v_result RECORD;
  v_total_campaigns integer := 0;
  v_total_created integer := 0;
BEGIN
  RAISE NOTICE '🎯 Executing backfill for all existing campaigns...';

  FOR v_result IN SELECT * FROM backfill_all_campaigns_tickets()
  LOOP
    v_total_campaigns := v_total_campaigns + 1;
    v_total_created := v_total_created + v_result.tickets_created;

    RAISE NOTICE 'Campaign: %, Created: % tickets',
      v_result.campaign_title, v_result.tickets_created;
  END LOOP;

  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ BACKFILL COMPLETE';
  RAISE NOTICE 'Total campaigns processed: %', v_total_campaigns;
  RAISE NOTICE 'Total tickets created: %', v_total_created;
  RAISE NOTICE '====================================';
END;
$$;

-- Add helpful comments
COMMENT ON FUNCTION backfill_campaign_tickets(uuid) IS
'Backfills missing tickets for a specific campaign. Creates tickets from existing count + 1 to total_tickets.';

COMMENT ON FUNCTION backfill_all_campaigns_tickets() IS
'Backfills missing tickets for ALL campaigns. Useful for fixing campaigns that were created without tickets.';

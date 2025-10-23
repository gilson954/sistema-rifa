/*
  # Add Missing Tickets When total_tickets is Increased

  1. Problem
    - When a campaign is created, tickets are auto-generated
    - But if total_tickets is increased later, new tickets are NOT created
    - This causes "Only X tickets available" errors when user tries to buy more

  2. Solution
    - Create a trigger that runs on UPDATE of campaigns table
    - When total_tickets increases, create the missing tickets
    - Only creates new tickets, never deletes existing ones

  3. Changes
    - New function: add_missing_tickets_on_campaign_update()
    - New trigger: trg_add_missing_tickets_on_update
    - Runs AFTER UPDATE on campaigns table
*/

-- Function to add missing tickets when total_tickets is increased
CREATE OR REPLACE FUNCTION add_missing_tickets_on_campaign_update()
RETURNS TRIGGER AS $$
DECLARE
  v_current_ticket_count INTEGER;
  v_new_total INTEGER;
  v_tickets_to_add INTEGER;
  i INTEGER;
BEGIN
  -- Only proceed if total_tickets was actually changed and increased
  IF NEW.total_tickets IS NULL OR NEW.total_tickets <= OLD.total_tickets THEN
    RETURN NEW;
  END IF;

  -- Count existing tickets for this campaign
  SELECT COUNT(*) INTO v_current_ticket_count
  FROM tickets
  WHERE campaign_id = NEW.id;

  v_new_total := NEW.total_tickets;

  -- Calculate how many tickets we need to add
  v_tickets_to_add := v_new_total - v_current_ticket_count;

  -- Only add tickets if we need more
  IF v_tickets_to_add > 0 THEN
    -- Add the missing tickets starting from current_count + 1
    FOR i IN (v_current_ticket_count + 1)..v_new_total LOOP
      INSERT INTO tickets (campaign_id, quota_number, status)
      VALUES (NEW.id, i, 'disponível')
      ON CONFLICT (campaign_id, quota_number) DO NOTHING; -- Skip if already exists
    END LOOP;

    RAISE NOTICE 'Added % tickets to campaign %', v_tickets_to_add, NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trg_add_missing_tickets_on_update ON campaigns;

-- Create trigger to add missing tickets when campaign is updated
CREATE TRIGGER trg_add_missing_tickets_on_update
  AFTER UPDATE ON campaigns
  FOR EACH ROW
  WHEN (NEW.total_tickets > OLD.total_tickets)
  EXECUTE FUNCTION add_missing_tickets_on_campaign_update();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION add_missing_tickets_on_campaign_update() TO authenticated;
GRANT EXECUTE ON FUNCTION add_missing_tickets_on_campaign_update() TO anon;

-- Test message
SELECT 'Trigger criado! Agora quando total_tickets for aumentado, os tickets faltantes serão criados automaticamente.' as status;

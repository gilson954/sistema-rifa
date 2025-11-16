/*
  # Backfill order_id for Existing Tickets

  1. Purpose
    - Populate order_id for tickets that were created before the order_id column existed
    - Group existing tickets by campaign_id and reserved_at to recreate historical orders
    - Ensure backward compatibility and smooth transition to new order_id system

  2. Strategy
    - Find all tickets without order_id (WHERE order_id IS NULL)
    - Group them by campaign_id and transaction time (rounded to second)
    - Generate unique order_id for each group using gen_random_uuid()
    - Update tickets in each group with their respective order_id

  3. Grouping Logic
    - Tickets with same campaign_id and same reserved_at (to the second) = same order
    - This matches the previous dynamic order_id generation logic
    - Preserves historical order grouping in MyTicketsPage

  4. Safety
    - Only updates tickets where order_id IS NULL
    - Uses CTE to ensure atomic grouping and updating
    - Idempotent - can be run multiple times safely
    - Does not affect tickets that already have order_id

  5. Impact
    - All existing tickets will have order_id after this migration
    - Historical orders will appear correctly grouped in MyTicketsPage
    - No data loss or order corruption
    - Smooth transition to new order_id system
*/

-- Backfill order_id for existing tickets
-- This ensures all tickets have order_id for consistent behavior

DO $$
DECLARE
  v_group_record RECORD;
  v_new_order_id text;
  v_updated_count integer := 0;
  v_total_groups integer := 0;
BEGIN
  -- Log start of backfill
  RAISE NOTICE '🔵 Starting order_id backfill for existing tickets...';

  -- Count tickets without order_id
  SELECT COUNT(*) INTO v_updated_count
  FROM tickets
  WHERE order_id IS NULL;

  RAISE NOTICE '📊 Found % tickets without order_id', v_updated_count;

  -- If no tickets need backfill, exit early
  IF v_updated_count = 0 THEN
    RAISE NOTICE '✅ All tickets already have order_id. Nothing to backfill.';
    RETURN;
  END IF;

  -- Group tickets by campaign_id and transaction time
  -- Each group represents a historical order that should share the same order_id
  FOR v_group_record IN
    SELECT
      campaign_id,
      date_trunc('second', COALESCE(reserved_at, created_at)) as transaction_time,
      COUNT(*) as ticket_count,
      array_agg(id) as ticket_ids
    FROM tickets
    WHERE order_id IS NULL
    GROUP BY
      campaign_id,
      date_trunc('second', COALESCE(reserved_at, created_at))
    ORDER BY transaction_time DESC
  LOOP
    -- Generate new UUID for this order group
    v_new_order_id := gen_random_uuid()::text;
    v_total_groups := v_total_groups + 1;

    -- Update all tickets in this group with the same order_id
    UPDATE tickets
    SET order_id = v_new_order_id
    WHERE id = ANY(v_group_record.ticket_ids);

    -- Log progress every 100 groups
    IF v_total_groups % 100 = 0 THEN
      RAISE NOTICE '⏳ Processed % order groups...', v_total_groups;
    END IF;
  END LOOP;

  -- Log completion
  RAISE NOTICE '✅ Backfill complete!';
  RAISE NOTICE '📊 Total order groups created: %', v_total_groups;
  RAISE NOTICE '📊 Total tickets updated: %', v_updated_count;

  -- Verify backfill
  SELECT COUNT(*) INTO v_updated_count
  FROM tickets
  WHERE order_id IS NULL;

  IF v_updated_count = 0 THEN
    RAISE NOTICE '✅ Verification passed: All tickets now have order_id';
  ELSE
    RAISE WARNING '⚠️ Verification failed: % tickets still without order_id', v_updated_count;
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION '❌ Backfill failed: %', SQLERRM;
END;
$$;

-- Create helpful view to check order_id distribution
CREATE OR REPLACE VIEW order_id_stats AS
SELECT
  COUNT(DISTINCT order_id) as total_unique_orders,
  COUNT(*) as total_tickets,
  COUNT(*) FILTER (WHERE order_id IS NULL) as tickets_without_order_id,
  COUNT(*) FILTER (WHERE order_id IS NOT NULL) as tickets_with_order_id,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE order_id IS NOT NULL) / NULLIF(COUNT(*), 0),
    2
  ) as percentage_with_order_id
FROM tickets;

-- Grant access to view
GRANT SELECT ON order_id_stats TO authenticated;

COMMENT ON VIEW order_id_stats IS
'Statistics view showing order_id distribution across tickets. Useful for monitoring backfill progress and data quality.';

-- Log final statistics
DO $$
DECLARE
  v_stats RECORD;
BEGIN
  SELECT * INTO v_stats FROM order_id_stats;

  RAISE NOTICE '═══════════════════════════════════════════';
  RAISE NOTICE '📊 Order ID Statistics:';
  RAISE NOTICE '   - Total unique orders: %', v_stats.total_unique_orders;
  RAISE NOTICE '   - Total tickets: %', v_stats.total_tickets;
  RAISE NOTICE '   - Tickets with order_id: %', v_stats.tickets_with_order_id;
  RAISE NOTICE '   - Tickets without order_id: %', v_stats.tickets_without_order_id;
  RAISE NOTICE '   - Coverage: %%%', v_stats.percentage_with_order_id;
  RAISE NOTICE '═══════════════════════════════════════════';
END;
$$;

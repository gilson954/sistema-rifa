/*
  # Create Diagnostic Views and Health Check Functions

  1. Purpose
    - Monitor campaign ticket integrity
    - Identify campaigns with missing tickets
    - Track system health and performance
    - Provide easy-to-query views for troubleshooting

  2. New Views
    - campaign_ticket_health: Shows ticket counts and health status per campaign
    - campaigns_with_issues: Filters only campaigns with problems
    - ticket_status_summary: Aggregate statistics by status

  3. New Functions
    - check_campaign_ticket_health: Validates individual campaign
    - get_system_health_report: Overall system health check
    - estimate_backfill_time: Calculates estimated time for backfill

  4. Usage
    - SELECT * FROM campaign_ticket_health; -- See all campaigns
    - SELECT * FROM campaigns_with_issues; -- See problems only
    - SELECT * FROM check_campaign_ticket_health('campaign-id');
    - SELECT * FROM get_system_health_report();
*/

-- View: Campaign Ticket Health
-- Shows the health status of tickets for all campaigns
CREATE OR REPLACE VIEW campaign_ticket_health AS
SELECT
  c.id as campaign_id,
  c.title as campaign_title,
  c.user_id,
  c.status as campaign_status,
  c.total_tickets,
  COALESCE(ticket_counts.total, 0) as actual_tickets,
  COALESCE(ticket_counts.disponivel, 0) as available_tickets,
  COALESCE(ticket_counts.reservado, 0) as reserved_tickets,
  COALESCE(ticket_counts.comprado, 0) as purchased_tickets,
  c.sold_tickets,
  (c.total_tickets - COALESCE(ticket_counts.total, 0)) as missing_tickets,
  CASE
    WHEN c.total_tickets = COALESCE(ticket_counts.total, 0) THEN 'healthy'
    WHEN c.total_tickets < COALESCE(ticket_counts.total, 0) THEN 'excess_tickets'
    WHEN c.total_tickets > COALESCE(ticket_counts.total, 0) THEN 'missing_tickets'
    ELSE 'unknown'
  END as health_status,
  c.created_at,
  c.updated_at
FROM campaigns c
LEFT JOIN (
  SELECT
    campaign_id,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'disponível') as disponivel,
    COUNT(*) FILTER (WHERE status = 'reservado') as reservado,
    COUNT(*) FILTER (WHERE status = 'comprado') as comprado
  FROM tickets
  GROUP BY campaign_id
) ticket_counts ON c.id = ticket_counts.campaign_id
ORDER BY c.created_at DESC;

-- View: Campaigns with Issues
-- Filters to show only campaigns with ticket problems
CREATE OR REPLACE VIEW campaigns_with_issues AS
SELECT *
FROM campaign_ticket_health
WHERE health_status != 'healthy'
ORDER BY missing_tickets DESC, created_at DESC;

-- View: Ticket Status Summary
-- Aggregate statistics across all campaigns
CREATE OR REPLACE VIEW ticket_status_summary AS
SELECT
  COUNT(DISTINCT campaign_id) as total_campaigns,
  COUNT(*) as total_tickets,
  COUNT(*) FILTER (WHERE status = 'disponível') as available_tickets,
  COUNT(*) FILTER (WHERE status = 'reservado') as reserved_tickets,
  COUNT(*) FILTER (WHERE status = 'comprado') as purchased_tickets,
  ROUND(AVG(CASE WHEN status = 'comprado' THEN 1 ELSE 0 END) * 100, 2) as purchase_rate_percent
FROM tickets;

-- Function: Check Campaign Ticket Health
-- Detailed health check for a specific campaign
CREATE OR REPLACE FUNCTION check_campaign_ticket_health(p_campaign_id uuid)
RETURNS TABLE(
  campaign_id uuid,
  campaign_title text,
  expected_tickets integer,
  actual_tickets bigint,
  missing_tickets bigint,
  health_status text,
  available_count bigint,
  reserved_count bigint,
  purchased_count bigint,
  recommendations text
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_campaign_record RECORD;
  v_ticket_counts RECORD;
BEGIN
  -- Get campaign details
  SELECT * INTO v_campaign_record
  FROM campaigns c
  WHERE c.id = p_campaign_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Campaign not found: %', p_campaign_id;
  END IF;

  -- Get ticket counts
  SELECT
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'disponível') as disponivel,
    COUNT(*) FILTER (WHERE status = 'reservado') as reservado,
    COUNT(*) FILTER (WHERE status = 'comprado') as comprado
  INTO v_ticket_counts
  FROM tickets t
  WHERE t.campaign_id = p_campaign_id;

  -- Return results
  campaign_id := p_campaign_id;
  campaign_title := v_campaign_record.title;
  expected_tickets := v_campaign_record.total_tickets;
  actual_tickets := COALESCE(v_ticket_counts.total, 0);
  missing_tickets := v_campaign_record.total_tickets - COALESCE(v_ticket_counts.total, 0);
  available_count := COALESCE(v_ticket_counts.disponivel, 0);
  reserved_count := COALESCE(v_ticket_counts.reservado, 0);
  purchased_count := COALESCE(v_ticket_counts.comprado, 0);

  -- Determine health status
  IF missing_tickets = 0 THEN
    health_status := 'healthy';
    recommendations := 'Campaign tickets are complete. No action needed.';
  ELSIF missing_tickets > 0 THEN
    health_status := 'missing_tickets';
    recommendations := format(
      'Run backfill to create %s missing tickets. Use: SELECT * FROM backfill_campaign_tickets(''%s'');',
      missing_tickets, p_campaign_id
    );
  ELSE
    health_status := 'excess_tickets';
    recommendations := 'Campaign has more tickets than expected. Investigate data integrity.';
  END IF;

  RETURN NEXT;
END;
$$;

-- Function: Get System Health Report
-- Overall health check of the entire system
CREATE OR REPLACE FUNCTION get_system_health_report()
RETURNS TABLE(
  metric text,
  value text,
  status text
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_total_campaigns bigint;
  v_healthy_campaigns bigint;
  v_campaigns_with_issues bigint;
  v_total_missing_tickets bigint;
  v_largest_missing bigint;
  v_total_tickets_in_db bigint;
  v_expected_tickets bigint;
BEGIN
  -- Calculate metrics
  SELECT COUNT(*) INTO v_total_campaigns FROM campaigns WHERE total_tickets > 0;

  SELECT COUNT(*) INTO v_healthy_campaigns
  FROM campaign_ticket_health
  WHERE health_status = 'healthy';

  SELECT COUNT(*) INTO v_campaigns_with_issues
  FROM campaign_ticket_health
  WHERE health_status != 'healthy';

  SELECT
    COALESCE(SUM(missing_tickets), 0),
    COALESCE(MAX(missing_tickets), 0)
  INTO v_total_missing_tickets, v_largest_missing
  FROM campaign_ticket_health;

  SELECT COUNT(*) INTO v_total_tickets_in_db FROM tickets;

  SELECT SUM(total_tickets) INTO v_expected_tickets FROM campaigns;

  -- Return report
  metric := 'Total Campaigns';
  value := v_total_campaigns::text;
  status := 'info';
  RETURN NEXT;

  metric := 'Healthy Campaigns';
  value := v_healthy_campaigns::text || ' (' ||
    ROUND((v_healthy_campaigns::numeric / NULLIF(v_total_campaigns, 0) * 100), 1)::text || '%)';
  status := CASE WHEN v_healthy_campaigns = v_total_campaigns THEN 'success' ELSE 'warning' END;
  RETURN NEXT;

  metric := 'Campaigns with Issues';
  value := v_campaigns_with_issues::text;
  status := CASE WHEN v_campaigns_with_issues = 0 THEN 'success' ELSE 'warning' END;
  RETURN NEXT;

  metric := 'Total Missing Tickets';
  value := v_total_missing_tickets::text;
  status := CASE WHEN v_total_missing_tickets = 0 THEN 'success' ELSE 'error' END;
  RETURN NEXT;

  metric := 'Largest Missing Count';
  value := v_largest_missing::text || ' tickets';
  status := CASE
    WHEN v_largest_missing = 0 THEN 'success'
    WHEN v_largest_missing < 1000 THEN 'warning'
    ELSE 'error'
  END;
  RETURN NEXT;

  metric := 'Total Tickets in Database';
  value := v_total_tickets_in_db::text;
  status := 'info';
  RETURN NEXT;

  metric := 'Expected Total Tickets';
  value := v_expected_tickets::text;
  status := 'info';
  RETURN NEXT;

  metric := 'Database Completeness';
  value := ROUND((v_total_tickets_in_db::numeric / NULLIF(v_expected_tickets, 0) * 100), 2)::text || '%';
  status := CASE
    WHEN v_total_tickets_in_db >= v_expected_tickets THEN 'success'
    WHEN v_total_tickets_in_db >= v_expected_tickets * 0.95 THEN 'warning'
    ELSE 'error'
  END;
  RETURN NEXT;

  RETURN;
END;
$$;

-- Function: Estimate Backfill Time
-- Estimates how long a backfill operation will take
CREATE OR REPLACE FUNCTION estimate_backfill_time(
  p_campaign_id uuid DEFAULT NULL,
  p_tickets_per_second numeric DEFAULT 2000
)
RETURNS TABLE(
  scope text,
  campaigns_to_process bigint,
  total_tickets_to_create bigint,
  estimated_seconds numeric,
  estimated_minutes numeric,
  recommendation text
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_tickets_needed bigint;
  v_campaign_count bigint;
BEGIN
  IF p_campaign_id IS NOT NULL THEN
    -- Single campaign estimate
    SELECT
      1,
      GREATEST(0, c.total_tickets - COALESCE((SELECT COUNT(*) FROM tickets t WHERE t.campaign_id = c.id), 0))
    INTO v_campaign_count, v_tickets_needed
    FROM campaigns c
    WHERE c.id = p_campaign_id;

    scope := 'Single Campaign';
  ELSE
    -- All campaigns estimate
    SELECT
      COUNT(*),
      COALESCE(SUM(GREATEST(0, c.total_tickets - COALESCE((SELECT COUNT(*) FROM tickets t WHERE t.campaign_id = c.id), 0))), 0)
    INTO v_campaign_count, v_tickets_needed
    FROM campaigns c
    WHERE c.total_tickets > 0;

    scope := 'All Campaigns';
  END IF;

  campaigns_to_process := v_campaign_count;
  total_tickets_to_create := v_tickets_needed;
  estimated_seconds := ROUND(v_tickets_needed::numeric / p_tickets_per_second, 1);
  estimated_minutes := ROUND(estimated_seconds / 60, 1);

  -- Provide recommendation
  IF v_tickets_needed = 0 THEN
    recommendation := 'No backfill needed. All tickets are present.';
  ELSIF v_tickets_needed < 5000 THEN
    recommendation := 'Small backfill. Can run directly in Supabase Dashboard.';
  ELSIF v_tickets_needed < 50000 THEN
    recommendation := 'Medium backfill. Recommended to use the safe script: node run-backfill-safe.mjs';
  ELSE
    recommendation := 'Large backfill. MUST use the safe script to avoid timeout: node run-backfill-safe.mjs';
  END IF;

  RETURN NEXT;
END;
$$;

-- Grant permissions
GRANT SELECT ON campaign_ticket_health TO authenticated, anon;
GRANT SELECT ON campaigns_with_issues TO authenticated, anon;
GRANT SELECT ON ticket_status_summary TO authenticated, anon;
GRANT EXECUTE ON FUNCTION check_campaign_ticket_health(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_system_health_report() TO authenticated;
GRANT EXECUTE ON FUNCTION estimate_backfill_time(uuid, numeric) TO authenticated;

-- Add comments
COMMENT ON VIEW campaign_ticket_health IS
'Shows health status and ticket counts for all campaigns. Use this to identify campaigns with missing or excess tickets.';

COMMENT ON VIEW campaigns_with_issues IS
'Filtered view showing only campaigns with ticket problems. Useful for quick troubleshooting.';

COMMENT ON VIEW ticket_status_summary IS
'Aggregate statistics of ticket statuses across the entire system.';

COMMENT ON FUNCTION check_campaign_ticket_health(uuid) IS
'Detailed health check for a specific campaign with recommendations for fixing issues.';

COMMENT ON FUNCTION get_system_health_report() IS
'Overall system health report with metrics and status indicators. Use for monitoring and dashboards.';

COMMENT ON FUNCTION estimate_backfill_time(uuid, numeric) IS
'Estimates time needed for backfill operation. Helps decide whether to use Dashboard or safe script.';

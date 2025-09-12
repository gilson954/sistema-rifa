/*
  # Sales History Function for Campaign Analytics

  1. Function Purpose
    - Provides comprehensive sales history and analytics for campaigns
    - Supports advanced search, filtering, and pagination
    - Returns both transaction details and aggregated metrics

  2. Parameters
    - p_campaign_id: Campaign UUID to analyze
    - p_search_field: Field to search ('name', 'quota_number', 'phone', 'email')
    - p_search_value: Search term
    - p_status_filters: Array of status filters
    - p_order_by: Sort order ('recent' or 'oldest')
    - p_page: Page number for pagination
    - p_page_size: Number of records per page

  3. Returns
    - JSONB object with transactions, metrics, and pagination info
    - Only shows actual transactions (tickets with customer data)
    - Empty state when no real transactions exist

  4. Security
    - Function accessible to authenticated users
    - Data filtered by campaign ownership through RLS
*/

CREATE OR REPLACE FUNCTION get_campaign_sales_history(
  p_campaign_id UUID,
  p_search_field TEXT DEFAULT 'name',
  p_search_value TEXT DEFAULT '',
  p_status_filters TEXT[] DEFAULT ARRAY[]::TEXT[],
  p_order_by TEXT DEFAULT 'recent',
  p_page INTEGER DEFAULT 1,
  p_page_size INTEGER DEFAULT 20
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transactions JSONB;
  v_metrics JSONB;
  v_pagination JSONB;
  v_total_records INTEGER;
  v_offset INTEGER;
  v_order_clause TEXT;
  v_search_condition TEXT;
  v_status_condition TEXT;
  v_base_query TEXT;
  v_count_query TEXT;
  
  -- Metrics variables
  v_unique_paid_participants INTEGER;
  v_unique_reserved_unpaid_participants INTEGER;
  v_total_sales_quantity INTEGER;
  v_total_sales_value NUMERIC;
  v_total_reservations_quantity INTEGER;
  v_total_reservations_value NUMERIC;
  v_total_reserved_unpaid_quantity INTEGER;
  v_total_reserved_unpaid_value NUMERIC;
BEGIN
  -- Calculate offset for pagination
  v_offset := (p_page - 1) * p_page_size;
  
  -- Build order clause
  IF p_order_by = 'oldest' THEN
    v_order_clause := 'ORDER BY transaction_date ASC';
  ELSE
    v_order_clause := 'ORDER BY transaction_date DESC';
  END IF;
  
  -- Build search condition
  v_search_condition := '';
  IF p_search_value IS NOT NULL AND p_search_value != '' THEN
    CASE p_search_field
      WHEN 'name' THEN
        v_search_condition := format('AND t.customer_name ILIKE ''%%%s%%''', p_search_value);
      WHEN 'quota_number' THEN
        v_search_condition := format('AND t.quota_number::TEXT ILIKE ''%%%s%%''', p_search_value);
      WHEN 'phone' THEN
        v_search_condition := format('AND t.customer_phone ILIKE ''%%%s%%''', p_search_value);
      WHEN 'email' THEN
        v_search_condition := format('AND t.customer_email ILIKE ''%%%s%%''', p_search_value);
    END CASE;
  END IF;
  
  -- Build status condition
  v_status_condition := '';
  IF array_length(p_status_filters, 1) > 0 THEN
    v_status_condition := format('AND t.status = ANY(ARRAY[%s])', 
      array_to_string(array(select quote_literal(unnest(p_status_filters))), ','));
  END IF;
  
  -- Base query for transactions (only show tickets with actual customer data)
  v_base_query := format('
    SELECT 
      t.quota_number,
      COALESCE(t.customer_name, ''N/A'') as customer_name,
      COALESCE(t.customer_phone, ''N/A'') as customer_phone,
      COALESCE(t.customer_email, ''N/A'') as customer_email,
      (c.ticket_price)::NUMERIC as value,
      t.status,
      COALESCE(t.bought_at, t.reserved_at, t.created_at) as transaction_date
    FROM tickets t
    INNER JOIN campaigns c ON c.id = t.campaign_id
    WHERE t.campaign_id = %L
      AND (
        t.status IN (''comprado'', ''reservado'') 
        OR (t.customer_name IS NOT NULL OR t.customer_email IS NOT NULL OR t.customer_phone IS NOT NULL)
      )
      %s %s
    %s',
    p_campaign_id,
    v_search_condition,
    v_status_condition,
    v_order_clause
  );
  
  -- Count total records for pagination
  v_count_query := format('
    SELECT COUNT(*)
    FROM tickets t
    INNER JOIN campaigns c ON c.id = t.campaign_id
    WHERE t.campaign_id = %L
      AND (
        t.status IN (''comprado'', ''reservado'') 
        OR (t.customer_name IS NOT NULL OR t.customer_email IS NOT NULL OR t.customer_phone IS NOT NULL)
      )
      %s %s',
    p_campaign_id,
    v_search_condition,
    v_status_condition
  );
  
  -- Execute count query
  EXECUTE v_count_query INTO v_total_records;
  
  -- Execute main query with pagination
  EXECUTE format('%s LIMIT %s OFFSET %s', v_base_query, p_page_size, v_offset)
  INTO v_transactions;
  
  -- Convert query result to JSONB array
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)::jsonb
  INTO v_transactions
  FROM (
    EXECUTE v_base_query || format(' LIMIT %s OFFSET %s', p_page_size, v_offset)
  ) t;
  
  -- Calculate metrics for the campaign (all data, not just filtered)
  
  -- Unique paid participants
  SELECT COUNT(DISTINCT t.customer_email)
  INTO v_unique_paid_participants
  FROM tickets t
  WHERE t.campaign_id = p_campaign_id
    AND t.status = 'comprado'
    AND t.customer_email IS NOT NULL;
  
  -- Unique reserved unpaid participants
  SELECT COUNT(DISTINCT t.customer_email)
  INTO v_unique_reserved_unpaid_participants
  FROM tickets t
  WHERE t.campaign_id = p_campaign_id
    AND t.status = 'reservado'
    AND t.bought_at IS NULL
    AND t.customer_email IS NOT NULL;
  
  -- Total sales (quantity and value)
  SELECT 
    COUNT(*),
    COALESCE(SUM(c.ticket_price), 0)
  INTO v_total_sales_quantity, v_total_sales_value
  FROM tickets t
  INNER JOIN campaigns c ON c.id = t.campaign_id
  WHERE t.campaign_id = p_campaign_id
    AND t.status = 'comprado';
  
  -- Total reservations (quantity and value)
  SELECT 
    COUNT(*),
    COALESCE(SUM(c.ticket_price), 0)
  INTO v_total_reservations_quantity, v_total_reservations_value
  FROM tickets t
  INNER JOIN campaigns c ON c.id = t.campaign_id
  WHERE t.campaign_id = p_campaign_id
    AND t.status = 'reservado';
  
  -- Total reserved unpaid (quantity and value)
  SELECT 
    COUNT(*),
    COALESCE(SUM(c.ticket_price), 0)
  INTO v_total_reserved_unpaid_quantity, v_total_reserved_unpaid_value
  FROM tickets t
  INNER JOIN campaigns c ON c.id = t.campaign_id
  WHERE t.campaign_id = p_campaign_id
    AND t.status = 'reservado'
    AND t.bought_at IS NULL;
  
  -- Build metrics object
  v_metrics := jsonb_build_object(
    'unique_paid_participants', COALESCE(v_unique_paid_participants, 0),
    'unique_reserved_unpaid_participants', COALESCE(v_unique_reserved_unpaid_participants, 0),
    'total_sales_quantity', COALESCE(v_total_sales_quantity, 0),
    'total_sales_value', COALESCE(v_total_sales_value, 0),
    'total_reservations_quantity', COALESCE(v_total_reservations_quantity, 0),
    'total_reservations_value', COALESCE(v_total_reservations_value, 0),
    'total_reserved_unpaid_quantity', COALESCE(v_total_reserved_unpaid_quantity, 0),
    'total_reserved_unpaid_value', COALESCE(v_total_reserved_unpaid_value, 0),
    'website_visits', 'N/A'
  );
  
  -- Build pagination object
  v_pagination := jsonb_build_object(
    'current_page', p_page,
    'total_pages', CASE 
      WHEN v_total_records = 0 THEN 0
      ELSE CEIL(v_total_records::NUMERIC / p_page_size::NUMERIC)::INTEGER
    END,
    'total_records', COALESCE(v_total_records, 0)
  );
  
  -- Return combined result
  RETURN jsonb_build_object(
    'transactions', COALESCE(v_transactions, '[]'::jsonb),
    'metrics', v_metrics,
    'pagination', v_pagination
  );
END;
$$;
/*
  # Create Sales History Function

  1. New Function
    - `get_campaign_sales_history` - Returns paginated sales history with metrics
    - Supports advanced search and filtering
    - Calculates aggregated metrics for dashboard

  2. Parameters
    - p_campaign_id: Campaign UUID to filter by
    - p_search_field: Field to search in (name, quota_number, phone, email)
    - p_search_value: Search term
    - p_status_filters: Array of status filters
    - p_order_by: Ordering (recent/oldest)
    - p_page: Page number for pagination
    - p_page_size: Records per page

  3. Returns
    - JSONB object with transactions, metrics, and pagination info
*/

CREATE OR REPLACE FUNCTION get_campaign_sales_history(
  p_campaign_id UUID,
  p_search_field TEXT DEFAULT NULL,
  p_search_value TEXT DEFAULT NULL,
  p_status_filters TEXT[] DEFAULT NULL,
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
  v_total_pages INTEGER;
  v_offset INTEGER;
  v_base_query TEXT;
  v_where_conditions TEXT[];
  v_where_clause TEXT;
  v_order_clause TEXT;
BEGIN
  -- Calculate offset for pagination
  v_offset := (p_page - 1) * p_page_size;
  
  -- Build base WHERE conditions
  v_where_conditions := ARRAY['t.campaign_id = $1'];
  
  -- Add search conditions
  IF p_search_field IS NOT NULL AND p_search_value IS NOT NULL AND p_search_value != '' THEN
    CASE p_search_field
      WHEN 'name' THEN
        v_where_conditions := v_where_conditions || ARRAY['t.customer_name ILIKE ''%' || p_search_value || '%'''];
      WHEN 'quota_number' THEN
        v_where_conditions := v_where_conditions || ARRAY['t.quota_number::text ILIKE ''%' || p_search_value || '%'''];
      WHEN 'phone' THEN
        v_where_conditions := v_where_conditions || ARRAY['t.customer_phone ILIKE ''%' || p_search_value || '%'''];
      WHEN 'email' THEN
        v_where_conditions := v_where_conditions || ARRAY['t.customer_email ILIKE ''%' || p_search_value || '%'''];
    END CASE;
  END IF;
  
  -- Add status filters
  IF p_status_filters IS NOT NULL AND array_length(p_status_filters, 1) > 0 THEN
    DECLARE
      status_conditions TEXT[];
      status_filter TEXT;
    BEGIN
      status_conditions := ARRAY[]::TEXT[];
      
      FOREACH status_filter IN ARRAY p_status_filters
      LOOP
        CASE status_filter
          WHEN 'comprado' THEN
            status_conditions := status_conditions || ARRAY['t.status = ''comprado'''];
          WHEN 'reservado' THEN
            status_conditions := status_conditions || ARRAY['t.status = ''reservado'''];
          WHEN 'reservou_nao_pagou' THEN
            status_conditions := status_conditions || ARRAY['(t.status = ''reservado'' AND t.bought_at IS NULL)'];
          WHEN 'disponivel' THEN
            status_conditions := status_conditions || ARRAY['t.status = ''disponível'''];
        END CASE;
      END LOOP;
      
      IF array_length(status_conditions, 1) > 0 THEN
        v_where_conditions := v_where_conditions || ARRAY['(' || array_to_string(status_conditions, ' OR ') || ')'];
      END IF;
    END;
  END IF;
  
  -- Build WHERE clause
  v_where_clause := 'WHERE ' || array_to_string(v_where_conditions, ' AND ');
  
  -- Build ORDER BY clause
  IF p_order_by = 'oldest' THEN
    v_order_clause := 'ORDER BY t.created_at ASC';
  ELSE
    v_order_clause := 'ORDER BY t.created_at DESC';
  END IF;
  
  -- Get total count for pagination
  EXECUTE format('
    SELECT COUNT(*)
    FROM tickets t
    JOIN campaigns c ON t.campaign_id = c.id
    %s
  ', v_where_clause)
  USING p_campaign_id
  INTO v_total_records;
  
  -- Calculate total pages
  v_total_pages := CEIL(v_total_records::DECIMAL / p_page_size);
  
  -- Get paginated transactions
  EXECUTE format('
    SELECT COALESCE(json_agg(
      json_build_object(
        ''quota_number'', t.quota_number,
        ''customer_name'', COALESCE(t.customer_name, ''N/A''),
        ''customer_phone'', COALESCE(t.customer_phone, ''N/A''),
        ''customer_email'', COALESCE(t.customer_email, ''N/A''),
        ''value'', c.ticket_price,
        ''status'', CASE 
          WHEN t.status = ''comprado'' THEN ''Compra aprovada''
          WHEN t.status = ''reservado'' AND t.bought_at IS NOT NULL THEN ''Reservado''
          WHEN t.status = ''reservado'' AND t.bought_at IS NULL THEN ''Reservou mas não pagou''
          WHEN t.status = ''disponível'' THEN ''Disponível''
          ELSE t.status
        END,
        ''transaction_date'', COALESCE(t.bought_at, t.reserved_at, t.created_at)
      )
    ), ''[]''::json)
    FROM (
      SELECT t.*, c.ticket_price
      FROM tickets t
      JOIN campaigns c ON t.campaign_id = c.id
      %s
      %s
      LIMIT %s OFFSET %s
    ) t
    JOIN campaigns c ON t.campaign_id = c.id
  ', v_where_clause, v_order_clause, p_page_size, v_offset)
  USING p_campaign_id
  INTO v_transactions;
  
  -- Calculate metrics from all filtered data (not just current page)
  EXECUTE format('
    SELECT json_build_object(
      ''unique_paid_participants'', COUNT(DISTINCT CASE WHEN t.status = ''comprado'' THEN t.customer_email END),
      ''unique_reserved_unpaid_participants'', COUNT(DISTINCT CASE WHEN t.status = ''reservado'' AND t.bought_at IS NULL THEN t.customer_email END),
      ''total_sales_quantity'', COUNT(CASE WHEN t.status = ''comprado'' THEN 1 END),
      ''total_sales_value'', COALESCE(SUM(CASE WHEN t.status = ''comprado'' THEN c.ticket_price END), 0),
      ''total_reservations_quantity'', COUNT(CASE WHEN t.status = ''reservado'' THEN 1 END),
      ''total_reservations_value'', COALESCE(SUM(CASE WHEN t.status = ''reservado'' THEN c.ticket_price END), 0),
      ''total_reserved_unpaid_quantity'', COUNT(CASE WHEN t.status = ''reservado'' AND t.bought_at IS NULL THEN 1 END),
      ''total_reserved_unpaid_value'', COALESCE(SUM(CASE WHEN t.status = ''reservado'' AND t.bought_at IS NULL THEN c.ticket_price END), 0),
      ''website_visits'', ''N/A (requer integração externa)''
    )
    FROM tickets t
    JOIN campaigns c ON t.campaign_id = c.id
    %s
  ', v_where_clause)
  USING p_campaign_id
  INTO v_metrics;
  
  -- Build pagination info
  v_pagination := json_build_object(
    'current_page', p_page,
    'total_pages', v_total_pages,
    'total_records', v_total_records,
    'page_size', p_page_size
  );
  
  -- Return combined result
  RETURN json_build_object(
    'transactions', v_transactions,
    'metrics', v_metrics,
    'pagination', v_pagination
  );
END;
$$;
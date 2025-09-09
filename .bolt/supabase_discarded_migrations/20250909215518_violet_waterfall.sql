@@ .. @@
     -- Calculate metrics for the filtered dataset (not paginated)
     SELECT 
       COUNT(DISTINCT CASE WHEN t.status = 'comprado' THEN t.customer_email END) as unique_paid_participants,
+      COUNT(DISTINCT CASE WHEN t.status = 'reservado' AND t.bought_at IS NULL THEN t.customer_email END) as unique_reserved_unpaid_participants,
       COUNT(CASE WHEN t.status = 'comprado' THEN 1 END) as total_sales_quantity,
       COALESCE(SUM(CASE WHEN t.status = 'comprado' THEN c.ticket_price END), 0) as total_sales_value,
       COUNT(CASE WHEN t.status = 'reservado' THEN 1 END) as total_reservations_quantity,
       COALESCE(SUM(CASE WHEN t.status = 'reservado' THEN c.ticket_price END), 0) as total_reservations_value,
       COUNT(CASE WHEN t.status = 'reservado' AND t.bought_at IS NULL THEN 1 END) as total_reserved_unpaid_quantity,
-      COALESCE(SUM(CASE WHEN t.status = 'reservado' AND t.bought_at IS NULL THEN c.ticket_price END), 0) as total_reserved_unpaid_value
+      COALESCE(SUM(CASE WHEN t.status = 'reservado' AND t.bought_at IS NULL THEN c.ticket_price END), 0) as total_reserved_unpaid_value,
+      'N/A (requer integração externa)' as website_visits
     INTO 
       unique_paid_participants,
+      unique_reserved_unpaid_participants,
       total_sales_quantity,
       total_sales_value,
       total_reservations_quantity,
       total_reservations_value,
       total_reserved_unpaid_quantity,
-      total_reserved_unpaid_value
+      total_reserved_unpaid_value,
+      website_visits
     FROM tickets t
     JOIN campaigns c ON c.id = t.campaign_id
     WHERE t.campaign_id = p_campaign_id
@@ .. @@
       'metrics', json_build_object(
         'unique_paid_participants', unique_paid_participants,
+        'unique_reserved_unpaid_participants', unique_reserved_unpaid_participants,
         'total_sales_quantity', total_sales_quantity,
         'total_sales_value', total_sales_value,
         'total_reservations_quantity', total_reservations_quantity,
         'total_reservations_value', total_reservations_value,
         'total_reserved_unpaid_quantity', total_reserved_unpaid_quantity,
-        'total_reserved_unpaid_value', total_reserved_unpaid_value
+        'total_reserved_unpaid_value', total_reserved_unpaid_value,
+        'website_visits', website_visits
       ),
       'pagination', json_build_object(
/*
  # Create Function to Get Available Quotas (Bypass 1000 Limit)

  1. Problem
    - Supabase/PostgREST has a default limit of 1000 rows per query
    - Even using .range(), the limit is enforced
    - This prevents users from buying more than 1000 tickets at once

  2. Solution
    - Create a database function that returns quota_numbers directly
    - Functions don't have the 1000 row limit
    - Can return any number of rows efficiently

  3. Usage
    - Call from frontend: supabase.rpc('get_available_quotas', { ... })
    - Returns array of quota_numbers that are available
    - Much faster than individual queries

  4. Performance
    - Single query execution
    - Returns only quota_numbers (lightweight)
    - Handles 20,000+ tickets easily
*/

-- Function to get available quota numbers for a campaign
CREATE OR REPLACE FUNCTION get_available_quotas(
  p_campaign_id uuid,
  p_limit integer DEFAULT 1000
)
RETURNS TABLE(quota_number integer)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT t.quota_number
  FROM tickets t
  WHERE t.campaign_id = p_campaign_id
    AND t.status = 'disponível'
  ORDER BY t.quota_number ASC
  LIMIT p_limit;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_available_quotas(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_quotas(uuid, integer) TO anon;

-- Add helpful comment
COMMENT ON FUNCTION get_available_quotas(uuid, integer) IS
'Returns available quota numbers for a campaign. Bypasses PostgREST row limit. Can return more than 1000 rows.';

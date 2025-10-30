/*
  # Ultra Flexible Phone Matching - Emergency Fix

  ## Problem
  Users cannot login because phone numbers stored in different formats aren't being matched.

  ## Solution
  Add 5 matching strategies to handle ALL possible phone number variations:
  1. Exact normalized match (13 digits with country code)
  2. Match last 11 digits (Brazilian mobile without country code)
  3. Match last 10 digits (for older format)
  4. Match if search is contained in stored (handles partial matches)
  5. Match if stored is contained in search (reverse partial match)

  ## Examples Covered
  - Stored: "62981127960" (11 digits) → Found by strategies 2, 4, 5
  - Stored: "+5562981127960" (with +55) → Found by strategies 1, 2, 3, 4, 5
  - Stored: "5562981127960" (without +) → Found by all strategies
  - Stored: "+55 (62) 98112-7960" (formatted) → Found after normalization
*/

-- Drop and recreate with ultra-flexible matching
DROP FUNCTION IF EXISTS get_tickets_by_phone(text);

CREATE OR REPLACE FUNCTION get_tickets_by_phone(p_phone_number text)
RETURNS TABLE (
  ticket_id uuid,
  campaign_id uuid,
  campaign_title text,
  campaign_public_id text,
  prize_image_urls text[],
  quota_number integer,
  status text,
  bought_at timestamptz,
  reserved_at timestamptz,
  customer_name text,
  customer_email text,
  customer_phone text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  normalized_search text;
  search_last_11 text;
  search_last_10 text;
BEGIN
  -- Normalize input (digits only)
  normalized_search := regexp_replace(p_phone_number, '[^0-9]', '', 'g');

  -- Extract suffixes
  search_last_11 := CASE
    WHEN length(normalized_search) >= 11 THEN right(normalized_search, 11)
    ELSE normalized_search
  END;

  search_last_10 := CASE
    WHEN length(normalized_search) >= 10 THEN right(normalized_search, 10)
    ELSE normalized_search
  END;

  -- Log for debugging (visible in Supabase logs)
  RAISE NOTICE 'Phone search - Input: %, Normalized: %, Last11: %, Last10: %',
    p_phone_number, normalized_search, search_last_11, search_last_10;

  RETURN QUERY
  SELECT
    t.id as ticket_id,
    t.campaign_id,
    c.title as campaign_title,
    c.public_id as campaign_public_id,
    c.prize_image_urls,
    t.quota_number,
    t.status,
    t.bought_at,
    t.reserved_at,
    t.customer_name,
    t.customer_email,
    t.customer_phone
  FROM tickets t
  INNER JOIN campaigns c ON t.campaign_id = c.id
  WHERE
    t.customer_phone IS NOT NULL
    AND t.customer_phone <> ''
    AND (
      -- Strategy 1: Exact normalized match (full number)
      regexp_replace(COALESCE(t.customer_phone, ''), '[^0-9]', '', 'g') = normalized_search
      OR
      -- Strategy 2: Match last 11 digits (Brazilian mobile standard)
      right(regexp_replace(COALESCE(t.customer_phone, ''), '[^0-9]', '', 'g'), 11) = search_last_11
      OR
      -- Strategy 3: Match last 10 digits (older format or without area code)
      right(regexp_replace(COALESCE(t.customer_phone, ''), '[^0-9]', '', 'g'), 10) = search_last_10
      OR
      -- Strategy 4: Stored contains search (handles cases where stored has more digits)
      regexp_replace(COALESCE(t.customer_phone, ''), '[^0-9]', '', 'g') LIKE '%' || normalized_search || '%'
      OR
      -- Strategy 5: Search contains stored (handles cases where search has more digits)
      normalized_search LIKE '%' || regexp_replace(COALESCE(t.customer_phone, ''), '[^0-9]', '', 'g') || '%'
    )
  ORDER BY
    -- Prefer exact matches first
    CASE
      WHEN regexp_replace(COALESCE(t.customer_phone, ''), '[^0-9]', '', 'g') = normalized_search THEN 1
      WHEN right(regexp_replace(COALESCE(t.customer_phone, ''), '[^0-9]', '', 'g'), 11) = search_last_11 THEN 2
      ELSE 3
    END,
    COALESCE(t.bought_at, t.reserved_at, t.created_at) DESC,
    c.title,
    t.quota_number;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_tickets_by_phone(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_tickets_by_phone(text) TO anon;

-- Add comment
COMMENT ON FUNCTION get_tickets_by_phone(text) IS
'Ultra-flexible phone matching with 5 strategies. Handles all Brazilian phone formats: +5562981127960, 5562981127960, 62981127960, (62) 98112-7960, etc. Prioritizes exact matches.';

-- Create compound index for better performance
CREATE INDEX IF NOT EXISTS idx_tickets_customer_phone_ops
  ON tickets USING btree (customer_phone)
  WHERE customer_phone IS NOT NULL AND customer_phone <> '';

-- Create expression index for normalized phone
CREATE INDEX IF NOT EXISTS idx_tickets_phone_normalized_full
  ON tickets ((regexp_replace(COALESCE(customer_phone, ''), '[^0-9]', '', 'g')))
  WHERE customer_phone IS NOT NULL;

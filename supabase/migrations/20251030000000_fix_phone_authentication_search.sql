/*
  # Fix Phone Authentication Search - Comprehensive Solution

  This migration fixes the phone number authentication issue where users cannot log in
  via the "Ver Minhas Cotas" button because phone numbers are not being matched correctly.

  ## Problem Analysis

  The console logs show:
  - Phone stored during registration: `+5562981127960`
  - Phone searched during login: `+5562981127960`
  - Result: No tickets found

  This indicates the database function is using exact string matching instead of normalized matching.

  ## Solution

  1. Update `get_tickets_by_phone` function to use flexible phone number matching
  2. Strip all non-numeric characters from both stored and search phone numbers
  3. Support multiple phone formats:
     - With country code: +5562981127960
     - Without plus: 5562981127960
     - Without country code: 62981127960
     - With formatting: +55 (62) 98112-7960

  ## Technical Approach

  - Use `regexp_replace` to normalize phone numbers to digits only
  - Match if either the full number matches OR the last 10-11 digits match (Brazilian format)
  - This ensures backward compatibility with existing data in any format
*/

-- Drop existing function to recreate with improved logic
DROP FUNCTION IF EXISTS get_tickets_by_phone(text);

-- Create comprehensive phone matching function
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
  search_suffix text;
BEGIN
  -- Normalize the search phone number (digits only)
  normalized_search := regexp_replace(p_phone_number, '[^0-9]', '', 'g');

  -- Extract last 11 digits for Brazilian format matching (handles with/without country code)
  IF length(normalized_search) >= 11 THEN
    search_suffix := right(normalized_search, 11);
  ELSE
    search_suffix := normalized_search;
  END IF;

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
    AND (
      -- Match 1: Exact match on normalized numbers (full number)
      regexp_replace(COALESCE(t.customer_phone, ''), '[^0-9]', '', 'g') = normalized_search
      OR
      -- Match 2: Match on last 11 digits (Brazilian format without country code)
      right(regexp_replace(COALESCE(t.customer_phone, ''), '[^0-9]', '', 'g'), 11) = search_suffix
      OR
      -- Match 3: Search number's last 11 digits matches stored number's last 11 digits
      right(regexp_replace(COALESCE(t.customer_phone, ''), '[^0-9]', '', 'g'), 11) =
      right(normalized_search, 11)
    )
  ORDER BY
    COALESCE(t.bought_at, t.reserved_at, t.created_at) DESC,
    c.title,
    t.quota_number;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_tickets_by_phone(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_tickets_by_phone(text) TO anon;

-- Ensure the index exists for performance
CREATE INDEX IF NOT EXISTS idx_tickets_customer_phone_normalized
  ON tickets(regexp_replace(COALESCE(customer_phone, ''), '[^0-9]', '', 'g'))
  WHERE customer_phone IS NOT NULL;

-- Add helpful comment
COMMENT ON FUNCTION get_tickets_by_phone(text) IS
'Searches for tickets by phone number with flexible matching. Supports multiple formats: +5562981127960, 5562981127960, 62981127960, +55 (62) 98112-7960. Uses normalized digit-only comparison for maximum compatibility.';

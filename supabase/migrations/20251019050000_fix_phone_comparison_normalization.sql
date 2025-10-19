/*
  # Fix Phone Number Comparison in get_tickets_by_phone Function

  1. Changes
    - Updates `get_tickets_by_phone` function to normalize phone numbers before comparison
    - Removes all non-numeric characters (parentheses, spaces, hyphens) before comparing
    - This allows the function to find tickets regardless of phone number formatting

  2. Examples of Matching Formats
    - `+55(62) 98112-7960` (saved in database)
    - `+55 62 981127960` (sent from frontend)
    - `62981127960` (without country code)
    - `5562981127960` (concatenated format)

  3. Technical Details
    - Uses `regexp_replace` to strip non-numeric characters
    - Compares only the numeric digits
    - Maintains original function signature and return type
    - Security level: SECURITY DEFINER
*/

-- Drop existing function
DROP FUNCTION IF EXISTS get_tickets_by_phone(text);

-- Create updated function with normalized phone comparison
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
BEGIN
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
    -- Normalize both phone numbers by removing all non-numeric characters
    -- This allows matching regardless of formatting: +55(62) 98112-7960 = +55 62 981127960 = 62981127960
    regexp_replace(COALESCE(t.customer_phone, ''), '[^0-9]', '', 'g') = regexp_replace(p_phone_number, '[^0-9]', '', 'g')
    AND t.customer_phone IS NOT NULL
    AND regexp_replace(p_phone_number, '[^0-9]', '', 'g') <> '' -- Ensure input has digits
  ORDER BY
    COALESCE(t.bought_at, t.reserved_at, t.created_at) DESC,
    c.title,
    t.quota_number;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_tickets_by_phone(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_tickets_by_phone(text) TO anon;

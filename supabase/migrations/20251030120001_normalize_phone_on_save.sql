/*
  # Normalize Phone Numbers on Save

  ## Problem
  Phone numbers are being saved in inconsistent formats, making searches fail.

  ## Solution
  1. Create a normalization function
  2. Create a trigger to auto-normalize on INSERT/UPDATE
  3. Backfill existing data

  ## Format Standard
  All phones will be stored as: +[country_code][area_code][number]
  Example: +5562981127960
*/

-- Step 1: Create normalization function
CREATE OR REPLACE FUNCTION normalize_phone_number(phone text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  digits text;
  result text;
BEGIN
  -- Return NULL for NULL input
  IF phone IS NULL OR phone = '' THEN
    RETURN NULL;
  END IF;

  -- Extract only digits
  digits := regexp_replace(phone, '[^0-9]', '', 'g');

  -- If empty after cleaning, return NULL
  IF digits = '' THEN
    RETURN NULL;
  END IF;

  -- Brazilian phone number logic
  CASE
    -- Already has country code (13 digits: 55 + 11 digits)
    WHEN length(digits) = 13 AND left(digits, 2) = '55' THEN
      result := '+' || digits;

    -- Missing country code but has area code (11 digits)
    WHEN length(digits) = 11 THEN
      result := '+55' || digits;

    -- Has country code but missing + sign (13 digits starting with 55)
    WHEN length(digits) = 13 THEN
      result := '+' || digits;

    -- Other lengths - just add + if not present
    WHEN length(digits) >= 10 THEN
      -- Assume it needs +55 if starts with typical Brazilian area codes
      IF left(digits, 2) IN ('11', '12', '13', '14', '15', '16', '17', '18', '19', '21', '22', '24', '27', '28',
                             '31', '32', '33', '34', '35', '37', '38', '41', '42', '43', '44', '45', '46', '47',
                             '48', '49', '51', '53', '54', '55', '61', '62', '63', '64', '65', '66', '67', '68',
                             '69', '71', '73', '74', '75', '77', '79', '81', '82', '83', '84', '85', '86', '87',
                             '88', '89', '91', '92', '93', '94', '95', '96', '97', '98', '99') THEN
        result := '+55' || digits;
      ELSE
        result := '+' || digits;
      END IF;

    -- Too short, keep as-is with +
    ELSE
      result := '+' || digits;
  END CASE;

  RETURN result;
END;
$$;

-- Step 2: Create trigger function to auto-normalize
CREATE OR REPLACE FUNCTION trigger_normalize_customer_phone()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Normalize customer_phone if provided
  IF NEW.customer_phone IS NOT NULL AND NEW.customer_phone <> '' THEN
    NEW.customer_phone := normalize_phone_number(NEW.customer_phone);
  END IF;

  RETURN NEW;
END;
$$;

-- Step 3: Drop existing trigger if exists
DROP TRIGGER IF EXISTS normalize_phone_before_insert_update ON tickets;

-- Step 4: Create trigger for tickets table
CREATE TRIGGER normalize_phone_before_insert_update
  BEFORE INSERT OR UPDATE OF customer_phone
  ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION trigger_normalize_customer_phone();

-- Step 5: Backfill existing data (normalize all existing phones)
UPDATE tickets
SET customer_phone = normalize_phone_number(customer_phone)
WHERE customer_phone IS NOT NULL
  AND customer_phone <> ''
  AND customer_phone <> normalize_phone_number(customer_phone);

-- Step 6: Add helpful comments
COMMENT ON FUNCTION normalize_phone_number(text) IS
'Normalizes phone numbers to standard format: +5562981127960. Handles Brazilian phones with/without country code.';

COMMENT ON FUNCTION trigger_normalize_customer_phone() IS
'Trigger function that auto-normalizes customer_phone before INSERT/UPDATE on tickets table.';

-- Step 7: Log results
DO $$
DECLARE
  updated_count integer;
BEGIN
  SELECT COUNT(*) INTO updated_count
  FROM tickets
  WHERE customer_phone IS NOT NULL
    AND customer_phone LIKE '+55%';

  RAISE NOTICE 'Phone normalization complete. Total normalized phones: %', updated_count;
END $$;

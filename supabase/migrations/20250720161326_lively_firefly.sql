/*
  # Remove prize_description field from campaigns table

  1. Database Changes
    - Remove `prize_description` column from `campaigns` table
    - Update any constraints that reference this field
    - This field is redundant as we already have description field in step 2

  2. Security
    - No RLS changes needed as we're only removing a field
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'prize_description'
  ) THEN
    ALTER TABLE campaigns DROP COLUMN prize_description;
  END IF;
END $$;
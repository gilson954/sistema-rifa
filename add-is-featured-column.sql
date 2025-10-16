-- ============================================
-- MIGRATION: Add is_featured column to campaigns
-- ============================================
-- Copy and paste this entire SQL into Supabase SQL Editor
-- Dashboard: https://supabase.com/dashboard/project/byymchepurnfawqlrcxh/sql

-- Step 1: Add is_featured column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'is_featured'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN is_featured boolean DEFAULT false NOT NULL;
    RAISE NOTICE 'Column is_featured added successfully';
  ELSE
    RAISE NOTICE 'Column is_featured already exists';
  END IF;
END $$;

-- Step 2: Create index for performance
CREATE INDEX IF NOT EXISTS campaigns_user_featured_idx
ON campaigns(user_id, is_featured)
WHERE is_featured = true;

-- Step 3: Create function to ensure only one featured campaign per user
CREATE OR REPLACE FUNCTION ensure_single_featured_campaign()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_featured = true THEN
    UPDATE campaigns
    SET is_featured = false
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_featured = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create trigger
DROP TRIGGER IF EXISTS ensure_single_featured_campaign_trigger ON campaigns;
CREATE TRIGGER ensure_single_featured_campaign_trigger
  BEFORE INSERT OR UPDATE OF is_featured ON campaigns
  FOR EACH ROW
  WHEN (NEW.is_featured = true)
  EXECUTE FUNCTION ensure_single_featured_campaign();

-- Step 5: Add column comment
COMMENT ON COLUMN campaigns.is_featured IS 'Indicates if this campaign is featured on the organizer home page. Only one campaign per user can be featured at a time.';

-- Verification: Check if column exists
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'campaigns' AND column_name = 'is_featured';

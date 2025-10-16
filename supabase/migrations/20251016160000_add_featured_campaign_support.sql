/*
  # Add Featured Campaign Support

  ## Overview
  This migration adds support for organizers to feature one campaign on their public home page.
  The featured campaign will be displayed prominently as a banner on the organizer's home page.

  ## Changes

  1. New Column
    - `campaigns.is_featured` (boolean)
      - Default value: false
      - Indicates if the campaign is featured on the organizer's home page
      - Only one campaign per user can be featured at a time

  2. Database Function
    - `ensure_single_featured_campaign()` - Trigger function to ensure only one campaign per user is featured

  3. Trigger
    - Automatically unfeatured other campaigns when a new one is featured for the same user

  4. Index
    - Index on (user_id, is_featured) for efficient featured campaign queries

  ## Important Notes
  - Only one campaign per organizer can be featured at any time
  - When a campaign is marked as featured, any previously featured campaign by the same user is automatically unfeatured
  - All existing campaigns will have is_featured set to false by default
*/

-- Add is_featured column to campaigns table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'is_featured'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN is_featured boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- Create index for efficient featured campaign lookups
CREATE INDEX IF NOT EXISTS campaigns_user_featured_idx ON campaigns(user_id, is_featured) WHERE is_featured = true;

-- Create function to ensure only one featured campaign per user
CREATE OR REPLACE FUNCTION ensure_single_featured_campaign()
RETURNS TRIGGER AS $$
BEGIN
  -- If the new/updated campaign is being marked as featured
  IF NEW.is_featured = true THEN
    -- Unfeature all other campaigns by the same user
    UPDATE campaigns
    SET is_featured = false
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_featured = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to maintain single featured campaign constraint
DROP TRIGGER IF EXISTS ensure_single_featured_campaign_trigger ON campaigns;
CREATE TRIGGER ensure_single_featured_campaign_trigger
  BEFORE INSERT OR UPDATE OF is_featured ON campaigns
  FOR EACH ROW
  WHEN (NEW.is_featured = true)
  EXECUTE FUNCTION ensure_single_featured_campaign();

-- Add helpful comment
COMMENT ON COLUMN campaigns.is_featured IS 'Indicates if this campaign is featured on the organizer''s home page. Only one campaign per user can be featured at a time.';

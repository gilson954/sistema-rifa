/*
  # Add Campaign Expiration and Image Support

  1. Schema Changes
    - Add `expires_at` column to campaigns table for automatic expiration
    - Add `prize_image_urls` column to store multiple prize images
    - Update existing campaigns to have default expiration (2 days from creation)

  2. Storage
    - Create storage bucket for prize images
    - Set up RLS policies for secure image access

  3. Functions
    - Create function to automatically delete expired campaigns
    - Create trigger to set expiration on campaign creation
*/

-- Add new columns to campaigns table
DO $$
BEGIN
  -- Add expires_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN expires_at timestamptz;
  END IF;

  -- Add prize_image_urls column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'prize_image_urls'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN prize_image_urls text[];
  END IF;
END $$;

-- Update existing campaigns to have expiration date (2 days from creation)
UPDATE campaigns 
SET expires_at = created_at + INTERVAL '2 days'
WHERE expires_at IS NULL;

-- Create storage bucket for prize images
INSERT INTO storage.buckets (id, name, public)
VALUES ('prize-images', 'prize-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for prize images bucket
CREATE POLICY "Users can upload prize images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'prize-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view prize images" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'prize-images');

CREATE POLICY "Users can update their prize images" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'prize-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their prize images" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'prize-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Function to delete expired campaigns
CREATE OR REPLACE FUNCTION delete_expired_campaigns()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete campaigns that have expired
  DELETE FROM campaigns
  WHERE expires_at IS NOT NULL 
    AND expires_at < NOW()
    AND status = 'draft';
    
  -- Log the deletion (you might want to create an audit table)
  RAISE NOTICE 'Deleted expired campaigns at %', NOW();
END;
$$;

-- Function to set expiration on campaign creation
CREATE OR REPLACE FUNCTION set_campaign_expiration()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Set expiration to 2 days from creation for draft campaigns
  IF NEW.status = 'draft' AND NEW.expires_at IS NULL THEN
    NEW.expires_at := NEW.created_at + INTERVAL '2 days';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for setting expiration on insert
DROP TRIGGER IF EXISTS set_campaign_expiration_trigger ON campaigns;
CREATE TRIGGER set_campaign_expiration_trigger
  BEFORE INSERT ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION set_campaign_expiration();

-- Create index for efficient expiration queries
CREATE INDEX IF NOT EXISTS campaigns_expires_at_idx ON campaigns(expires_at) WHERE expires_at IS NOT NULL;
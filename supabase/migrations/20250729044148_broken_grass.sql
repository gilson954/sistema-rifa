/*
  # Add social media links to profiles

  1. New Columns
    - `social_media_links` (jsonb) - Stores social media links in JSON format
  
  2. Security
    - Users can update their own social media links
    - RLS policies updated to allow social media links management

  3. Changes
    - Added social_media_links column to profiles table
    - Updated RLS policies for social media links access
*/

-- Add social_media_links column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'social_media_links'
  ) THEN
    ALTER TABLE profiles ADD COLUMN social_media_links jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Create index for social media links
CREATE INDEX IF NOT EXISTS idx_profiles_social_media_links ON profiles USING gin (social_media_links);

-- Add RLS policy for social media links
CREATE POLICY IF NOT EXISTS "Users can update their own social media links"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (uid() = id)
  WITH CHECK (uid() = id);
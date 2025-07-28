/*
  # Add logo_url column to profiles table

  1. Changes
    - Add `logo_url` column to `profiles` table
    - Column is nullable to allow users without logos
    - Column stores the public URL of the user's logo image

  2. Security
    - No additional RLS policies needed as existing profile policies cover this column
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'logo_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN logo_url TEXT;
  END IF;
END $$;
/*
  # Fix profiles table RLS policy for logo updates

  1. Security
    - Add specific policy for users to update their own logo_url
    - Ensure authenticated users can modify their profile data
    - Keep existing security constraints intact

  2. Changes
    - Add UPDATE policy for logo_url field specifically
    - Allow users to update their own profile data
*/

-- Enable RLS on profiles table (if not already enabled)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing conflicting policies if they exist
DROP POLICY IF EXISTS "Users can update their own logo_url" ON profiles;

-- Create policy to allow users to update their own logo_url
CREATE POLICY "Users can update their own logo_url"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Ensure users can also update other profile fields (if policy doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can update their own profile'
  ) THEN
    CREATE POLICY "Users can update their own profile"
      ON profiles
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;
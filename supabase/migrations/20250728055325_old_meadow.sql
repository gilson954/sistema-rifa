/*
  # Fix Storage RLS Policies for Logo Upload

  1. Storage Policies
    - Drop existing policies to avoid conflicts
    - Create proper INSERT policy for authenticated users to upload logos
    - Create SELECT policy for public access to view logos
    - Create UPDATE/DELETE policies for users to manage their own logos

  2. Profiles Table Policy
    - Ensure users can update their own logo_url field
*/

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Users can upload their own logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view all logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own logos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view logos" ON storage.objects;

-- Create storage policies with correct syntax
CREATE POLICY "Users can upload their own logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'logos' AND
  (storage.foldername(name))[1] = 'logos' AND
  auth.uid()::text = split_part((storage.filename(name)), '-', 1)
);

CREATE POLICY "Public can view logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'logos');

CREATE POLICY "Users can update their own logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'logos' AND
  auth.uid()::text = split_part((storage.filename(name)), '-', 1)
)
WITH CHECK (
  bucket_id = 'logos' AND
  auth.uid()::text = split_part((storage.filename(name)), '-', 1)
);

CREATE POLICY "Users can delete their own logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'logos' AND
  auth.uid()::text = split_part((storage.filename(name)), '-', 1)
);

-- Ensure profiles table has proper UPDATE policy for logo_url
DO $$
BEGIN
  -- Check if the policy exists, if not create it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can update their own logo_url'
  ) THEN
    CREATE POLICY "Users can update their own logo_url"
    ON profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
  END IF;
END $$;
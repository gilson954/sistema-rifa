/*
  # Fix Storage RLS Policies for Logo Upload

  1. Storage Policies
    - Enable authenticated users to insert (upload) their own logos
    - Enable authenticated users to update their own logos  
    - Enable authenticated users to delete their own logos
    - Enable public read access for displaying logos

  2. Security
    - Users can only manage files with their own user ID in the filename
    - Public can read all logos for display purposes
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload their own logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own logos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view logos" ON storage.objects;

-- Create storage policies for the logos bucket
CREATE POLICY "Users can upload their own logos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'logos' AND
    (storage.foldername(name))[1] = 'logos' AND
    auth.uid()::text = split_part((storage.filename(name)), '-', 1)
  );

CREATE POLICY "Users can update their own logos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'logos' AND
    (storage.foldername(name))[1] = 'logos' AND
    auth.uid()::text = split_part((storage.filename(name)), '-', 1)
  )
  WITH CHECK (
    bucket_id = 'logos' AND
    (storage.foldername(name))[1] = 'logos' AND
    auth.uid()::text = split_part((storage.filename(name)), '-', 1)
  );

CREATE POLICY "Users can delete their own logos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'logos' AND
    (storage.foldername(name))[1] = 'logos' AND
    auth.uid()::text = split_part((storage.filename(name)), '-', 1)
  );

CREATE POLICY "Public can view logos"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'logos');
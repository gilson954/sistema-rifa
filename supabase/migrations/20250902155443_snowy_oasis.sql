/*
  # Fix Storage RLS Policies for User Folders

  1. Storage Configuration
    - Configure logos bucket as public for reading
    - Set up proper RLS policies for user folders

  2. Security Policies
    - Users can only upload to their own folder: {user_id}/
    - Users can only manage files in their own folder
    - Public read access for displaying logos
*/

-- Create logos bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can upload logos to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own logos" ON storage.objects;

-- Create new policies for user folder structure
CREATE POLICY "Users can upload logos to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'logos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Public read access for logos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'logos');

CREATE POLICY "Users can update own logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'logos' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'logos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'logos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
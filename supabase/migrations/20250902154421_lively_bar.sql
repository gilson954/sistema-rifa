/*
  # Fix storage policies for logos bucket

  1. Storage Policies
    - Create bucket 'logos' if it doesn't exist
    - Set bucket as public for reading
    - Create policies for authenticated users to upload, read, update and delete their own logos
    
  2. Security
    - Users can only upload files with their user ID in the filename
    - Public read access for displaying logos
    - Users can manage only their own logo files
*/

-- Create logos bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users to upload their own logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own logos" ON storage.objects;

-- Policy for uploading logos (INSERT)
CREATE POLICY "Allow authenticated users to upload their own logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'logos' AND
  auth.uid()::text = split_part(split_part(name, '/', 2), '-', 1)::text
);

-- Policy for reading logos (SELECT) - public access
CREATE POLICY "Allow public read access to logos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'logos');

-- Policy for updating logos (UPDATE)
CREATE POLICY "Allow users to update their own logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'logos' AND
  auth.uid()::text = split_part(split_part(name, '/', 2), '-', 1)::text
)
WITH CHECK (
  bucket_id = 'logos' AND
  auth.uid()::text = split_part(split_part(name, '/', 2), '-', 1)::text
);

-- Policy for deleting logos (DELETE)
CREATE POLICY "Allow users to delete their own logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'logos' AND
  auth.uid()::text = split_part(split_part(name, '/', 2), '-', 1)::text
);
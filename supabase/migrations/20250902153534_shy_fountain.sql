/*
  # Fix logo storage RLS policies

  1. Storage Policies
    - Create policy for authenticated users to insert logos
    - Create policy for authenticated users to select/view logos
    - Create policy for authenticated users to update their own logos
    - Create policy for authenticated users to delete their own logos

  2. Security
    - Users can only manage files in their own folder (logos/user_id/*)
    - Public read access for logo files to display on campaign pages
*/

-- Create storage policies for logos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'logos',
  'logos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Policy for authenticated users to upload logos to their own folder
CREATE POLICY "Users can upload logos to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'logos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy for public read access to logo files
CREATE POLICY "Public read access for logos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'logos');

-- Policy for authenticated users to update their own logos
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

-- Policy for authenticated users to delete their own logos
CREATE POLICY "Users can delete own logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'logos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
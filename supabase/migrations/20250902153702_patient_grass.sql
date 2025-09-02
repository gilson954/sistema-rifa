/*
  # Fix profiles table RLS policy for logo_url updates

  1. Security Updates
    - Drop existing restrictive UPDATE policies on profiles table
    - Create new comprehensive UPDATE policy allowing users to update their own profiles
    - Ensure logo_url field can be updated by profile owners
    
  2. Storage Policies
    - Ensure logos bucket has proper RLS policies for authenticated users
    - Allow users to upload, read, update and delete their own logo files
*/

-- Drop existing UPDATE policies that might be too restrictive
DROP POLICY IF EXISTS "Enable update access for users on own profile" ON profiles;
DROP POLICY IF EXISTS "Enable update access for admins" ON profiles;
DROP POLICY IF EXISTS "Update own social media links" ON profiles;
DROP POLICY IF EXISTS "Users can update their own logo_url" ON profiles;
DROP POLICY IF EXISTS "Users can update their own payment integrations" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Create a comprehensive UPDATE policy for profiles
CREATE POLICY "Users can update own profile data"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create admin UPDATE policy
CREATE POLICY "Admins can update any profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin')::text = 'true'
  )
  WITH CHECK (
    ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin')::text = 'true'
  );

-- Ensure storage bucket exists and has proper policies
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing storage policies to avoid conflicts
DROP POLICY IF EXISTS "Users can upload their own logos" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own logos" ON storage.objects;

-- Create storage policies for logos bucket
CREATE POLICY "Users can upload their own logos"
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

CREATE POLICY "Users can update their own logos"
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

CREATE POLICY "Users can delete their own logos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'logos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
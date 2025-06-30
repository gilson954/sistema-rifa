/*
  # Fix RLS policies for profiles table

  1. Security Updates
    - Drop existing problematic policies that reference users table
    - Create new simplified policies that work with auth.uid()
    - Ensure authenticated users can read and update their own profiles
    - Allow profile creation for new users

  2. Changes
    - Remove policies that depend on users table access
    - Add direct auth.uid() based policies
    - Maintain admin access through user metadata
*/

-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Create new simplified policies using auth.uid() directly
CREATE POLICY "Enable read access for users on own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Enable insert access for users on own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update access for users on own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admin policies using user metadata instead of users table
CREATE POLICY "Enable read access for admins"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin' = 'true'
    OR auth.uid() = id
  );

CREATE POLICY "Enable update access for admins"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin' = 'true'
    OR auth.uid() = id
  )
  WITH CHECK (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin' = 'true'
    OR auth.uid() = id
  );
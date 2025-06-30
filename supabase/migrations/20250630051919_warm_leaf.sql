/*
  # Fix infinite recursion in profiles RLS policies

  1. Security Changes
    - Drop all existing conflicting policies on profiles table
    - Create clean, non-recursive policies for profiles table
    - Ensure policies don't create circular dependencies

  2. Policy Structure
    - Users can view their own profile
    - Users can update their own profile  
    - Users can insert their own profile
    - Admins can view and update all profiles
*/

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios perfis" ON profiles;
DROP POLICY IF EXISTS "Usuários podem inserir seus próprios perfis" ON profiles;
DROP POLICY IF EXISTS "Usuários podem ver seus próprios perfis" ON profiles;

-- Create clean, non-recursive policies
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admin policies (separate from user policies to avoid recursion)
CREATE POLICY "Admins can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'is_admin' = 'true'
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'is_admin' = 'true'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'is_admin' = 'true'
    )
  );
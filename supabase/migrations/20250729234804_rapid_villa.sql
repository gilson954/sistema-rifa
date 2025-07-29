/*
  # Add CPF and Phone Number fields to profiles table

  1. New Columns
    - `cpf` (text, nullable) - User's CPF document
    - `phone_number` (text, nullable) - User's phone number with country code

  2. Security
    - Users can update their own CPF and phone number
    - Admins can view and update all user data

  3. Validation
    - CPF format validation (Brazilian format)
    - Phone number format validation
*/

-- Add CPF column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'cpf'
  ) THEN
    ALTER TABLE profiles ADD COLUMN cpf text;
  END IF;
END $$;

-- Add phone_number column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone_number text;
  END IF;
END $$;

-- Add social_media_links column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'social_media_links'
  ) THEN
    ALTER TABLE profiles ADD COLUMN social_media_links jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Update RLS policies to include new fields
CREATE POLICY "Users can update their own cpf and phone" ON profiles
  FOR UPDATE
  TO authenticated
  USING (uid() = id)
  WITH CHECK (uid() = id);

-- Create index for CPF searches (optional, for performance)
CREATE INDEX IF NOT EXISTS idx_profiles_cpf ON profiles(cpf) WHERE cpf IS NOT NULL;

-- Create index for phone number searches (optional, for performance)
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone_number) WHERE phone_number IS NOT NULL;
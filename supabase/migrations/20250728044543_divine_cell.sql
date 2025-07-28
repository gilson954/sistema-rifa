/*
  # Add theme column to profiles table

  1. New Column
    - `theme` (text) - User's preferred theme for their campaigns
    - Default value: 'claro' (light theme)
    - Allowed values: 'claro', 'escuro', 'escuro-preto'

  2. Security
    - Column is added safely with IF NOT EXISTS check
    - Default value ensures backward compatibility
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'theme'
  ) THEN
    ALTER TABLE profiles ADD COLUMN theme text DEFAULT 'claro';
  END IF;
END $$;

-- Add check constraint for valid theme values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'profiles_theme_check'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_theme_check 
    CHECK (theme IN ('claro', 'escuro', 'escuro-preto'));
  END IF;
END $$;
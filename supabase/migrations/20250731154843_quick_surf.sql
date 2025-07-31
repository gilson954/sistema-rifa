/*
  # Add payment integrations configuration to profiles

  1. New Columns
    - `payment_integrations_config` (jsonb) - Stores payment gateway credentials and webhook configurations
  
  2. Security
    - Add RLS policy for users to update their own payment integrations
  
  3. Changes
    - Modify profiles table to support payment gateway configurations
*/

-- Add payment_integrations_config column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'payment_integrations_config'
  ) THEN
    ALTER TABLE profiles ADD COLUMN payment_integrations_config jsonb DEFAULT '{}';
  END IF;
END $$;

-- Create index for payment integrations config
CREATE INDEX IF NOT EXISTS idx_profiles_payment_integrations 
ON profiles USING gin (payment_integrations_config);

-- Add RLS policy for users to update their own payment integrations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can update their own payment integrations'
  ) THEN
    CREATE POLICY "Users can update their own payment integrations"
      ON profiles
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;
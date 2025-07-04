/*
  # Sync admin status between profiles and auth.users

  1. Function Creation
    - Create function to sync is_admin from profiles to auth.users.raw_user_meta_data
    - Function updates user_metadata when is_admin changes in profiles table
    - Uses SECURITY DEFINER to allow access to auth schema

  2. Trigger Creation
    - Create trigger that fires after UPDATE on profiles table
    - Only triggers when is_admin column is actually changed
    - Calls sync function to update auth.users metadata

  3. Initial Sync
    - Update existing users' metadata to match current profiles.is_admin values
    - Ensures all existing admin users have proper metadata set
*/

-- Create function to sync admin status from profiles to auth.users
CREATE OR REPLACE FUNCTION sync_profile_admin_status()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only proceed if is_admin column has actually changed
  IF OLD.is_admin IS DISTINCT FROM NEW.is_admin THEN
    -- Update the user_metadata in auth.users table
    UPDATE auth.users
    SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
        jsonb_build_object('is_admin', NEW.is_admin)
    WHERE id = NEW.id;
    
    -- Log the change for debugging (optional)
    RAISE NOTICE 'Updated admin status for user % to %', NEW.id, NEW.is_admin;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically sync admin status
DROP TRIGGER IF EXISTS on_profile_admin_change ON profiles;
CREATE TRIGGER on_profile_admin_change
  AFTER UPDATE OF is_admin ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_admin_status();

-- Initial sync: Update all existing users' metadata to match their current profile admin status
DO $$
DECLARE
  profile_record RECORD;
BEGIN
  -- Loop through all profiles and sync their admin status
  FOR profile_record IN 
    SELECT id, is_admin FROM profiles 
  LOOP
    UPDATE auth.users
    SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
        jsonb_build_object('is_admin', profile_record.is_admin)
    WHERE id = profile_record.id;
  END LOOP;
  
  RAISE NOTICE 'Initial sync completed for all existing users';
END;
$$;

-- Create function to manually sync a specific user (useful for troubleshooting)
CREATE OR REPLACE FUNCTION sync_user_admin_status(user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
DECLARE
  user_is_admin BOOLEAN;
BEGIN
  -- Get the current admin status from profiles
  SELECT is_admin INTO user_is_admin
  FROM profiles
  WHERE id = user_id;
  
  -- If user profile exists, update auth.users metadata
  IF FOUND THEN
    UPDATE auth.users
    SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
        jsonb_build_object('is_admin', user_is_admin)
    WHERE id = user_id;
    
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION sync_profile_admin_status() TO authenticated;
GRANT EXECUTE ON FUNCTION sync_user_admin_status(UUID) TO authenticated;
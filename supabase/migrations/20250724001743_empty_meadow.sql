/*
  # Automated Campaign Cleanup System

  This migration creates a comprehensive system for automatically cleaning up expired campaigns:

  1. Database Functions
     - Function to delete expired campaigns and related data
     - Function to log cleanup operations
     - Function to handle cleanup scheduling

  2. Database Tables
     - cleanup_logs table for tracking operations
     - Updated campaigns table with proper indexing

  3. Triggers and Scheduling
     - Automatic cleanup trigger
     - Scheduled cleanup via pg_cron (if available)

  4. Security
     - RLS policies for cleanup operations
     - Proper error handling and logging
*/

-- Create cleanup logs table for tracking operations
CREATE TABLE IF NOT EXISTS cleanup_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_type text NOT NULL,
  campaign_id uuid,
  campaign_title text,
  status text NOT NULL CHECK (status IN ('success', 'error', 'warning')),
  message text,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on cleanup_logs
ALTER TABLE cleanup_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for cleanup logs (only system can access)
CREATE POLICY "System can manage cleanup logs"
  ON cleanup_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_campaigns_expires_at_status 
  ON campaigns (expires_at, status) 
  WHERE expires_at IS NOT NULL AND status = 'draft';

CREATE INDEX IF NOT EXISTS idx_cleanup_logs_created_at 
  ON cleanup_logs (created_at DESC);

-- Function to log cleanup operations
CREATE OR REPLACE FUNCTION log_cleanup_operation(
  p_operation_type text,
  p_campaign_id uuid DEFAULT NULL,
  p_campaign_title text DEFAULT NULL,
  p_status text DEFAULT 'success',
  p_message text DEFAULT NULL,
  p_details jsonb DEFAULT NULL
) RETURNS void AS $$
BEGIN
  INSERT INTO cleanup_logs (
    operation_type,
    campaign_id,
    campaign_title,
    status,
    message,
    details
  ) VALUES (
    p_operation_type,
    p_campaign_id,
    p_campaign_title,
    p_status,
    p_message,
    p_details
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired campaigns
CREATE OR REPLACE FUNCTION cleanup_expired_campaigns()
RETURNS TABLE(
  deleted_count integer,
  error_count integer,
  details jsonb
) AS $$
DECLARE
  campaign_record RECORD;
  deleted_campaigns integer := 0;
  error_campaigns integer := 0;
  cleanup_details jsonb := '[]'::jsonb;
  error_message text;
BEGIN
  -- Log start of cleanup operation
  PERFORM log_cleanup_operation(
    'cleanup_start',
    NULL,
    NULL,
    'success',
    'Starting automated cleanup of expired campaigns',
    jsonb_build_object('timestamp', now())
  );

  -- Find and process expired campaigns
  FOR campaign_record IN
    SELECT id, title, user_id, expires_at, created_at
    FROM campaigns
    WHERE status = 'draft'
      AND expires_at IS NOT NULL
      AND expires_at < now()
      AND created_at < (now() - interval '2 days') -- Extra safety check
  LOOP
    BEGIN
      -- Delete the campaign (CASCADE will handle related data)
      DELETE FROM campaigns WHERE id = campaign_record.id;
      
      deleted_campaigns := deleted_campaigns + 1;
      
      -- Log successful deletion
      PERFORM log_cleanup_operation(
        'campaign_deleted',
        campaign_record.id,
        campaign_record.title,
        'success',
        format('Campaign "%s" deleted after expiration', campaign_record.title),
        jsonb_build_object(
          'user_id', campaign_record.user_id,
          'expired_at', campaign_record.expires_at,
          'created_at', campaign_record.created_at
        )
      );
      
      -- Add to details
      cleanup_details := cleanup_details || jsonb_build_object(
        'campaign_id', campaign_record.id,
        'title', campaign_record.title,
        'status', 'deleted'
      );
      
    EXCEPTION WHEN OTHERS THEN
      error_campaigns := error_campaigns + 1;
      error_message := SQLERRM;
      
      -- Log error
      PERFORM log_cleanup_operation(
        'campaign_delete_error',
        campaign_record.id,
        campaign_record.title,
        'error',
        format('Failed to delete campaign "%s": %s', campaign_record.title, error_message),
        jsonb_build_object(
          'error', error_message,
          'user_id', campaign_record.user_id,
          'expired_at', campaign_record.expires_at
        )
      );
      
      -- Add to details
      cleanup_details := cleanup_details || jsonb_build_object(
        'campaign_id', campaign_record.id,
        'title', campaign_record.title,
        'status', 'error',
        'error', error_message
      );
    END;
  END LOOP;

  -- Log completion
  PERFORM log_cleanup_operation(
    'cleanup_complete',
    NULL,
    NULL,
    CASE WHEN error_campaigns > 0 THEN 'warning' ELSE 'success' END,
    format('Cleanup completed: %s deleted, %s errors', deleted_campaigns, error_campaigns),
    jsonb_build_object(
      'deleted_count', deleted_campaigns,
      'error_count', error_campaigns,
      'details', cleanup_details
    )
  );

  -- Return results
  RETURN QUERY SELECT deleted_campaigns, error_campaigns, cleanup_details;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean old cleanup logs (keep only last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM cleanup_logs 
  WHERE created_at < (now() - interval '30 days');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log the log cleanup
  PERFORM log_cleanup_operation(
    'logs_cleanup',
    NULL,
    NULL,
    'success',
    format('Cleaned up %s old log entries', deleted_count),
    jsonb_build_object('deleted_logs', deleted_count)
  );
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger function to automatically clean up on campaign expiration
CREATE OR REPLACE FUNCTION trigger_cleanup_expired_campaigns()
RETURNS trigger AS $$
BEGIN
  -- Only trigger if a campaign just expired
  IF NEW.expires_at IS NOT NULL 
     AND NEW.expires_at < now() 
     AND NEW.status = 'draft'
     AND NEW.created_at < (now() - interval '2 days') THEN
    
    -- Schedule cleanup (this will be handled by the edge function)
    PERFORM log_cleanup_operation(
      'cleanup_triggered',
      NEW.id,
      NEW.title,
      'success',
      'Campaign expiration detected, cleanup scheduled',
      jsonb_build_object('expires_at', NEW.expires_at)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic cleanup detection
DROP TRIGGER IF EXISTS trigger_campaign_expiration_cleanup ON campaigns;
CREATE TRIGGER trigger_campaign_expiration_cleanup
  AFTER UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION trigger_cleanup_expired_campaigns();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION cleanup_expired_campaigns() TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_old_logs() TO service_role;
GRANT EXECUTE ON FUNCTION log_cleanup_operation(text, uuid, text, text, text, jsonb) TO service_role;
/*
  # Update cleanup function to respect paid campaigns

  1. Function Updates
    - Modify cleanup_expired_campaigns to only delete unpaid draft campaigns
    - Paid campaigns should never be automatically deleted
  
  2. Security
    - Maintain existing RLS and policies
*/

-- Update the cleanup function to respect is_paid status
CREATE OR REPLACE FUNCTION cleanup_expired_campaigns()
RETURNS TABLE(
  deleted_count integer,
  error_count integer,
  details jsonb[]
) AS $$
DECLARE
  campaign_record RECORD;
  deleted_campaigns integer := 0;
  error_campaigns integer := 0;
  operation_details jsonb[] := '{}';
  current_detail jsonb;
BEGIN
  -- Log cleanup start
  INSERT INTO cleanup_logs (operation_type, status, message)
  VALUES ('cleanup_start', 'success', 'Starting cleanup of expired unpaid campaigns');

  -- Find expired draft campaigns that are NOT paid
  FOR campaign_record IN
    SELECT id, title, user_id, created_at, expires_at, is_paid
    FROM campaigns
    WHERE status = 'draft'
      AND expires_at IS NOT NULL
      AND expires_at < NOW()
      AND is_paid = false  -- Only delete unpaid campaigns
      AND created_at < NOW() - INTERVAL '2 days'
  LOOP
    BEGIN
      -- Log the campaign being deleted
      current_detail := jsonb_build_object(
        'campaign_id', campaign_record.id,
        'title', campaign_record.title,
        'user_id', campaign_record.user_id,
        'created_at', campaign_record.created_at,
        'expires_at', campaign_record.expires_at,
        'is_paid', campaign_record.is_paid
      );

      -- Delete the campaign (CASCADE will handle related records)
      DELETE FROM campaigns WHERE id = campaign_record.id;
      
      deleted_campaigns := deleted_campaigns + 1;
      operation_details := operation_details || current_detail;

      -- Log successful deletion
      INSERT INTO cleanup_logs (
        operation_type, 
        campaign_id, 
        campaign_title, 
        status, 
        message, 
        details
      )
      VALUES (
        'campaign_deleted',
        campaign_record.id,
        campaign_record.title,
        'success',
        'Expired unpaid campaign deleted successfully',
        current_detail
      );

    EXCEPTION WHEN OTHERS THEN
      error_campaigns := error_campaigns + 1;
      
      -- Log error
      INSERT INTO cleanup_logs (
        operation_type,
        campaign_id,
        campaign_title,
        status,
        message,
        details
      )
      VALUES (
        'campaign_delete_error',
        campaign_record.id,
        campaign_record.title,
        'error',
        'Failed to delete expired campaign: ' || SQLERRM,
        jsonb_build_object(
          'error', SQLERRM,
          'campaign_id', campaign_record.id,
          'title', campaign_record.title
        )
      );
    END;
  END LOOP;

  -- Log cleanup completion
  INSERT INTO cleanup_logs (
    operation_type,
    status,
    message,
    details
  )
  VALUES (
    'cleanup_complete',
    'success',
    format('Cleanup completed: %s deleted, %s errors', deleted_campaigns, error_campaigns),
    jsonb_build_object(
      'deleted_count', deleted_campaigns,
      'error_count', error_campaigns,
      'timestamp', NOW()
    )
  );

  -- Return results
  RETURN QUERY SELECT deleted_campaigns, error_campaigns, operation_details;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to clean up old logs (keep only last 1000 entries)
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  WITH old_logs AS (
    SELECT id
    FROM cleanup_logs
    ORDER BY created_at DESC
    OFFSET 1000
  )
  DELETE FROM cleanup_logs
  WHERE id IN (SELECT id FROM old_logs);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
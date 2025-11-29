import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { translateAuthError } from '../utils/errorTranslators'; // ✅ Importe a função

interface CleanupResult {
  deleted_count: number;
  error_count: number;
  details: unknown[];
}

interface CleanupLog {
  id: string;
  operation_type: string;
  campaign_id?: string;
  campaign_title?: string;
  status: 'success' | 'error' | 'warning';
  message?: string;
  details?: unknown;
  created_at: string;
}

export const useCampaignCleanup = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [lastCleanup, setLastCleanup] = useState<Date | null>(null);
  const [cleanupLogs, setCleanupLogs] = useState<CleanupLog[]>([]);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch recent cleanup logs
   */
  const fetchCleanupLogs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('cleanup_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching cleanup logs:', error);
        return;
      }

      setCleanupLogs(data || []);
      
      // Find the last successful cleanup
      const lastSuccessfulCleanup = data?.find(
        log => log.operation_type === 'cleanup_complete' && log.status === 'success'
      );
      
      if (lastSuccessfulCleanup) {
        setLastCleanup(new Date(lastSuccessfulCleanup.created_at));
      }
    } catch (err) {
      console.error('Error in fetchCleanupLogs:', err);
    }
  }, []);

  /**
   * Run manual cleanup
   */
  const runCleanup = useCallback(async (): Promise<CleanupResult | null> => {
    if (isRunning) {
      console.warn('Cleanup already running');
      return null;
    }

    setIsRunning(true);
    setError(null);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/campaign-cleanup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        // ✅ Traduza a mensagem de erro
        throw new Error(translateAuthError(result.error || 'Cleanup failed'));
      }

      // Refresh logs after cleanup
      await fetchCleanupLogs();

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(translateAuthError(errorMessage)); // ✅ Traduza a mensagem de erro
      console.error('Cleanup error:', err);
      return null;
    } finally {
      setIsRunning(false);
    }
  }, [isRunning, fetchCleanupLogs]);

  /**
   * Check if campaigns need cleanup (client-side check)
   */
  const checkExpiredCampaigns = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('id, title, expires_at, created_at')
        .eq('status', 'draft')
        .not('expires_at', 'is', null)
        .lt('expires_at', new Date().toISOString())
        .lt('created_at', new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString());

      if (error) {
        console.error('Error checking expired campaigns:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Error in checkExpiredCampaigns:', err);
      return [];
    }
  }, []);

  /**
   * Set up automatic cleanup check
   */
  useEffect(() => {
    // Initial fetch of logs
    fetchCleanupLogs();

    // Set up periodic check for expired campaigns (every 30 minutes)
    const checkInterval = setInterval(async () => {
      const expiredCampaigns = await checkExpiredCampaigns();
      
      if (expiredCampaigns.length > 0) {
        console.log(`Found ${expiredCampaigns.length} expired campaigns, triggering cleanup...`);
        await runCleanup();
      }
    }, 30 * 60 * 1000); // 30 minutes

    // Cleanup interval on unmount
    return () => clearInterval(checkInterval);
  }, [fetchCleanupLogs, checkExpiredCampaigns, runCleanup]);

  /**
   * Set up real-time subscription for cleanup logs
   */
  useEffect(() => {
    const subscription = supabase
      .channel('cleanup_logs_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'cleanup_logs'
        },
        (payload) => {
          console.log('New cleanup log:', payload.new);
          setCleanupLogs(prev => [payload.new as CleanupLog, ...prev.slice(0, 49)]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    isRunning,
    lastCleanup,
    cleanupLogs,
    error,
    runCleanup,
    fetchCleanupLogs,
    checkExpiredCampaigns
  };
};

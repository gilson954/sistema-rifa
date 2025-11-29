import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

interface CleanupResult {
  deleted_count: number
  error_count: number
  details: unknown[]
}

interface CleanupResponse {
  success: boolean
  message: string
  data?: CleanupResult
  error?: string
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role key for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('🧹 Starting campaign cleanup process...')

    // Call the database function to clean up expired campaigns
    const { data: cleanupResult, error: cleanupError } = await supabase
      .rpc('cleanup_expired_campaigns')

    if (cleanupError) {
      console.error('❌ Cleanup function error:', cleanupError)
      
      // Log the error to our cleanup logs
      await supabase.rpc('log_cleanup_operation', {
        p_operation_type: 'cleanup_function_error',
        p_status: 'error',
        p_message: `Cleanup function failed: ${cleanupError.message}`,
        p_details: { error: cleanupError }
      })

      return new Response(
        JSON.stringify({
          success: false,
          message: 'Cleanup function failed',
          error: cleanupError.message
        } as CleanupResponse),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const result = cleanupResult?.[0] as CleanupResult
    
    if (!result) {
      console.log('⚠️ No cleanup result returned')
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No cleanup result returned',
          error: 'Empty result from cleanup function'
        } as CleanupResponse),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`✅ Cleanup completed: ${result.deleted_count} deleted, ${result.error_count} errors`)

    // Also clean up old logs to prevent table bloat
    const { data: logCleanupResult, error: logCleanupError } = await supabase
      .rpc('cleanup_old_logs')

    if (logCleanupError) {
      console.warn('⚠️ Log cleanup failed:', logCleanupError)
    } else {
      console.log(`🗑️ Cleaned up ${logCleanupResult} old log entries`)
    }

    // Determine response status based on results
    const hasErrors = result.error_count > 0
    const statusCode = hasErrors ? 207 : 200 // 207 Multi-Status for partial success

    return new Response(
      JSON.stringify({
        success: true,
        message: `Cleanup completed: ${result.deleted_count} campaigns deleted${hasErrors ? ` with ${result.error_count} errors` : ''}`,
        data: result
      } as CleanupResponse),
      {
        status: statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error: unknown) {
    console.error('💥 Unexpected error in cleanup function:', error)
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Unexpected error during cleanup',
        error: errMsg
      } as CleanupResponse),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get current timestamp
    const now = new Date().toISOString()

    // Find expired draft campaigns
    const { data: expiredCampaigns, error: fetchError } = await supabase
      .from('campaigns')
      .select('id, title, user_id')
      .eq('status', 'draft')
      .lt('expires_at', now)

    if (fetchError) {
      throw fetchError
    }

    if (!expiredCampaigns || expiredCampaigns.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No expired campaigns found',
          deleted_count: 0 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Delete expired campaigns
    const { error: deleteError } = await supabase
      .from('campaigns')
      .delete()
      .eq('status', 'draft')
      .lt('expires_at', now)

    if (deleteError) {
      throw deleteError
    }

    // Log the cleanup operation
    console.log(`Cleaned up ${expiredCampaigns.length} expired campaigns:`, 
      expiredCampaigns.map(c => ({ id: c.id, title: c.title })))

    return new Response(
      JSON.stringify({ 
        message: 'Expired campaigns cleaned up successfully',
        deleted_count: expiredCampaigns.length,
        deleted_campaigns: expiredCampaigns.map(c => ({ id: c.id, title: c.title }))
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error cleaning up expired campaigns:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to cleanup expired campaigns',
        details: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
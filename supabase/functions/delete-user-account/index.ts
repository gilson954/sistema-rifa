import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
}

interface DeleteAccountRequest {
  user_id: string
}

interface DeleteAccountResponse {
  success: boolean
  message: string
  error?: string
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Method not allowed',
        error: 'Only POST method is allowed'
      } as DeleteAccountResponse),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
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

    // Parse request body
    const { user_id }: DeleteAccountRequest = await req.json()

    if (!user_id) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'User ID is required',
          error: 'Missing user_id parameter'
        } as DeleteAccountResponse),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('🗑️ Starting account deletion process for user:', user_id)

    // Check if user has any active campaigns
    const { data: activeCampaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('id, title, status')
      .eq('user_id', user_id)
      .eq('status', 'active')

    if (campaignsError) {
      console.error('❌ Error checking active campaigns:', campaignsError)
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Error checking active campaigns',
          error: campaignsError.message
        } as DeleteAccountResponse),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Prevent deletion if user has active campaigns
    if (activeCampaigns && activeCampaigns.length > 0) {
      console.log('⚠️ User has active campaigns, preventing deletion')
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Não é possível excluir a conta pois você possui campanhas ativas. Finalize ou cancele suas campanhas antes de excluir a conta.',
          error: 'User has active campaigns'
        } as DeleteAccountResponse),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Delete user from Supabase Auth (this will cascade delete the profile due to foreign key)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user_id)

    if (deleteError) {
      console.error('❌ Error deleting user from auth:', deleteError)
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Erro ao excluir conta. Tente novamente.',
          error: deleteError.message
        } as DeleteAccountResponse),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('✅ User account deleted successfully')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Conta excluída com sucesso'
      } as DeleteAccountResponse),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('💥 Unexpected error in delete account function:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      } as DeleteAccountResponse),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
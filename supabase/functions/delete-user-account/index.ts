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
      .in('status', ['active', 'draft'])

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
          message: 'Não é possível excluir conta com campanhas ativas ou em rascunho',
          error: 'User has active campaigns'
        } as DeleteAccountResponse),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // First delete profile data
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', user_id)

    if (profileError) {
      console.error('Error deleting profile:', profileError)
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Erro ao excluir dados do perfil',
          error: profileError.message
        } as DeleteAccountResponse),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Then delete user from auth
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user_id)

    if (deleteError && deleteError.message !== 'User not found') {
      console.error('Error deleting user:', deleteError)
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Erro ao excluir conta de autenticação',
          error: deleteError.message
        } as DeleteAccountResponse),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (deleteError && deleteError.message === 'User not found') {
      console.log('⚠️ User already removed from auth system')
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

  } catch (error: unknown) {
    console.error('💥 Unexpected error in delete account function:', error)
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Erro interno do servidor',
        error: errMsg
      } as DeleteAccountResponse),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

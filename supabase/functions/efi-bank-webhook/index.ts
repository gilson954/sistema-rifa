import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface EfiBankWebhookPayload {
  evento: string
  data_criacao: string
  pix: {
    endToEndId: string
    txid: string
    valor: string
    chave: string
    horario: string
    infoPagador?: {
      nome?: string
      cpf?: string
    }
  }
}

interface EfiBankWebhookResponse {
  success: boolean
  message: string
  txid?: string
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
        error: 'Method not allowed' 
      } as EfiBankWebhookResponse),
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

    // Parse webhook payload
    const webhookPayload: EfiBankWebhookPayload = await req.json()
    
    console.log('🔔 Efi Bank webhook received:', webhookPayload)

    // Only process PIX payment events
    if (webhookPayload.evento !== 'pix') {
      console.log('ℹ️ Ignoring non-PIX webhook event:', webhookPayload.evento)
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Webhook received but not processed (not a PIX event)' 
        } as EfiBankWebhookResponse),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const pixData = webhookPayload.pix
    console.log('💳 Processing Efi Bank PIX data:', pixData)

    // Parse txid to extract campaign and ticket information
    if (!pixData.txid) {
      console.error('❌ No txid found in PIX data')
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'No txid found' 
        } as EfiBankWebhookResponse),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse txid format: campaign_{id}_tickets_{quota_numbers}
    const txidMatch = pixData.txid.match(/^campaign_([^_]+)_tickets_(.+)$/)
    if (!txidMatch) {
      console.error('❌ Invalid txid format:', pixData.txid)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid txid format' 
        } as EfiBankWebhookResponse),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const campaignId = txidMatch[1]
    const quotaNumbers = txidMatch[2].split(',').map(num => parseInt(num.trim()))

    console.log('🎯 Extracted data:', { campaignId, quotaNumbers, valor: pixData.valor })

    // PIX payments are automatically approved when webhook is received
    console.log('✅ PIX payment received, finalizing purchase...')
    
    // Update tickets status to 'comprado'
    const { data: updateResult, error: updateError } = await supabase
      .from('tickets')
      .update({
        status: 'comprado',
        bought_at: new Date().toISOString()
      })
      .eq('campaign_id', campaignId)
      .in('quota_number', quotaNumbers)
      .eq('status', 'reservado') // Only update reserved tickets
      .select()

    if (updateError) {
      console.error('❌ Error updating tickets:', updateError)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Failed to update tickets' 
        } as EfiBankWebhookResponse),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('🎫 Tickets updated:', updateResult)

    // Log successful payment processing
    await supabase.rpc('log_cleanup_operation', {
      p_operation_type: 'payment_processed',
      p_campaign_id: campaignId,
      p_status: 'success',
      p_message: `Efi Bank PIX ${pixData.txid} processed successfully`,
      p_details: {
        txid: pixData.txid,
        endToEndId: pixData.endToEndId,
        quota_numbers: quotaNumbers,
        valor: pixData.valor,
        payer_info: pixData.infoPagador,
        horario: pixData.horario
      }
    })

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'PIX webhook processed successfully',
        txid: pixData.txid
      } as EfiBankWebhookResponse),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error: unknown) {
    console.error('💥 Error processing Efi Bank webhook:', error)
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Internal server error',
        message: errMsg 
      } as EfiBankWebhookResponse),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

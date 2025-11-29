import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface MercadoPagoWebhookPayload {
  id: number
  live_mode: boolean
  type: string
  date_created: string
  application_id: number
  user_id: number
  version: number
  api_version: string
  action: string
  data: {
    id: string
  }
}

interface PaymentData {
  id: number
  status: string
  status_detail: string
  external_reference: string
  transaction_amount: number
  currency_id: string
  date_created: string
  date_approved?: string
  payer: {
    id: string
    email: string
    identification?: {
      type: string
      number: string
    }
  }
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Parse webhook payload
    const webhookPayload: MercadoPagoWebhookPayload = await req.json()
    
    console.log('🔔 Mercado Pago webhook received:', webhookPayload)

    // Only process payment notifications
    if (webhookPayload.type !== 'payment') {
      console.log('ℹ️ Ignoring non-payment webhook type:', webhookPayload.type)
      return new Response(
        JSON.stringify({ message: 'Webhook received but not processed (not a payment)' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get payment details from Mercado Pago API
    const paymentId = webhookPayload.data.id
    
    // Note: In production, you would need to make an API call to Mercado Pago
    // to get the full payment details using the payment ID
    // For now, we'll simulate this with a mock response
    
    // Mock payment data - in production, fetch from Mercado Pago API
    const paymentData: PaymentData = {
      id: parseInt(paymentId),
      status: 'approved', // approved, pending, rejected, cancelled
      status_detail: 'accredited',
      external_reference: 'campaign_123_tickets_1,2,3', // Format: campaign_{id}_tickets_{quota_numbers}
      transaction_amount: 15.00,
      currency_id: 'BRL',
      date_created: new Date().toISOString(),
      date_approved: new Date().toISOString(),
      payer: {
        id: 'payer_123',
        email: 'buyer@example.com'
      }
    }

    console.log('💳 Processing payment data:', paymentData)

    // Parse external reference to extract campaign and ticket information
    if (!paymentData.external_reference) {
      console.error('❌ No external reference found in payment')
      return new Response(
        JSON.stringify({ error: 'No external reference found' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse external reference format: campaign_{id}_tickets_{quota_numbers}
    const referenceMatch = paymentData.external_reference.match(/^campaign_([^_]+)_tickets_(.+)$/)
    if (!referenceMatch) {
      console.error('❌ Invalid external reference format:', paymentData.external_reference)
      return new Response(
        JSON.stringify({ error: 'Invalid external reference format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const campaignId = referenceMatch[1]
    const quotaNumbers = referenceMatch[2].split(',').map(num => parseInt(num.trim()))

    console.log('🎯 Extracted data:', { campaignId, quotaNumbers, status: paymentData.status })

    // Process payment based on status
    if (paymentData.status === 'approved') {
      // Payment approved - finalize purchase
      console.log('✅ Payment approved, finalizing purchase...')
      
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
          JSON.stringify({ error: 'Failed to update tickets' }),
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
        p_message: `Mercado Pago payment ${paymentId} processed successfully`,
        p_details: {
          payment_id: paymentId,
          quota_numbers: quotaNumbers,
          amount: paymentData.transaction_amount,
          payer_email: paymentData.payer.email
        }
      })

    } else if (paymentData.status === 'rejected' || paymentData.status === 'cancelled') {
      // Payment failed - release reserved tickets
      console.log('❌ Payment failed, releasing reserved tickets...')
      
      const { data: releaseResult, error: releaseError } = await supabase
        .from('tickets')
        .update({
          status: 'disponível',
          user_id: null,
          reserved_at: null
        })
        .eq('campaign_id', campaignId)
        .in('quota_number', quotaNumbers)
        .eq('status', 'reservado')
        .select()

      if (releaseError) {
        console.error('❌ Error releasing tickets:', releaseError)
        return new Response(
          JSON.stringify({ error: 'Failed to release tickets' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      console.log('🔓 Tickets released:', releaseResult)

      // Log failed payment processing
      await supabase.rpc('log_cleanup_operation', {
        p_operation_type: 'payment_failed',
        p_campaign_id: campaignId,
        p_status: 'warning',
        p_message: `Mercado Pago payment ${paymentId} failed, tickets released`,
        p_details: {
          payment_id: paymentId,
          quota_numbers: quotaNumbers,
          status: paymentData.status,
          status_detail: paymentData.status_detail
        }
      })

    } else {
      // Payment pending - no action needed, tickets remain reserved
      console.log('⏳ Payment pending, keeping tickets reserved')
      
      await supabase.rpc('log_cleanup_operation', {
        p_operation_type: 'payment_pending',
        p_campaign_id: campaignId,
        p_status: 'success',
        p_message: `Mercado Pago payment ${paymentId} is pending`,
        p_details: {
          payment_id: paymentId,
          quota_numbers: quotaNumbers,
          status: paymentData.status
        }
      })
    }

    return new Response(
      JSON.stringify({ 
        message: 'Webhook processed successfully',
        payment_id: paymentId,
        status: paymentData.status
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error: unknown) {
    console.error('💥 Error processing Mercado Pago webhook:', error)
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: errMsg 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

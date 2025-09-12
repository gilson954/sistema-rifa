import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface FluxsisWebhookPayload {
  id: string
  event: string
  data: {
    id: string
    status: string
    amount: number
    currency: string
    external_reference: string
    payment_method: string
    created_at: string
    updated_at: string
    payer: {
      email: string
      name?: string
      document?: string
    }
  }
}

interface FluxsisWebhookResponse {
  success: boolean
  message: string
  payment_id?: string
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
      } as FluxsisWebhookResponse),
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
    const webhookPayload: FluxsisWebhookPayload = await req.json()
    
    console.log('🔔 Fluxsis webhook received:', webhookPayload)

    // Only process payment events
    if (webhookPayload.event !== 'payment.status_changed' && webhookPayload.event !== 'payment.created') {
      console.log('ℹ️ Ignoring non-payment webhook event:', webhookPayload.event)
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Webhook received but not processed (not a payment event)' 
        } as FluxsisWebhookResponse),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const paymentData = webhookPayload.data
    console.log('💳 Processing Fluxsis payment data:', paymentData)

    // Parse external reference to extract campaign and ticket information
    if (!paymentData.external_reference) {
      console.error('❌ No external reference found in payment')
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'No external reference found' 
        } as FluxsisWebhookResponse),
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
        JSON.stringify({ 
          success: false,
          error: 'Invalid external reference format' 
        } as FluxsisWebhookResponse),
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
    if (paymentData.status === 'paid' || paymentData.status === 'approved') {
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
          JSON.stringify({ 
            success: false,
            error: 'Failed to update tickets' 
          } as FluxsisWebhookResponse),
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
        p_message: `Fluxsis payment ${paymentData.id} processed successfully`,
        p_details: {
          payment_id: paymentData.id,
          quota_numbers: quotaNumbers,
          amount: paymentData.amount,
          payer_email: paymentData.payer.email,
          payment_method: paymentData.payment_method
        }
      })

    } else if (paymentData.status === 'failed' || paymentData.status === 'cancelled' || paymentData.status === 'rejected') {
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
          JSON.stringify({ 
            success: false,
            error: 'Failed to release tickets' 
          } as FluxsisWebhookResponse),
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
        p_message: `Fluxsis payment ${paymentData.id} failed, tickets released`,
        p_details: {
          payment_id: paymentData.id,
          quota_numbers: quotaNumbers,
          status: paymentData.status,
          payment_method: paymentData.payment_method
        }
      })

    } else {
      // Payment pending - no action needed, tickets remain reserved
      console.log('⏳ Payment pending, keeping tickets reserved')
      
      await supabase.rpc('log_cleanup_operation', {
        p_operation_type: 'payment_pending',
        p_campaign_id: campaignId,
        p_status: 'success',
        p_message: `Fluxsis payment ${paymentData.id} is pending`,
        p_details: {
          payment_id: paymentData.id,
          quota_numbers: quotaNumbers,
          status: paymentData.status
        }
      })
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Webhook processed successfully',
        payment_id: paymentData.id
      } as FluxsisWebhookResponse),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('💥 Error processing Fluxsis webhook:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Internal server error',
        message: error.message 
      } as FluxsisWebhookResponse),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
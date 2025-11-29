import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface Pay2mWebhookPayload {
  id: string
  event_type: string
  transaction: {
    id: string
    status: string
    amount: number
    currency: string
    reference: string
    payment_method: string
    created_at: string
    updated_at: string
    customer: {
      email: string
      name?: string
      document?: string
    }
  }
  signature?: string
}

interface Pay2mWebhookResponse {
  success: boolean
  message: string
  transaction_id?: string
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
      } as Pay2mWebhookResponse),
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
    const webhookPayload: Pay2mWebhookPayload = await req.json()
    
    console.log('🔔 Pay2m webhook received:', webhookPayload)

    // Only process transaction events
    if (webhookPayload.event_type !== 'transaction.status_changed' && webhookPayload.event_type !== 'transaction.completed') {
      console.log('ℹ️ Ignoring non-transaction webhook event:', webhookPayload.event_type)
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Webhook received but not processed (not a transaction event)' 
        } as Pay2mWebhookResponse),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const transactionData = webhookPayload.transaction
    console.log('💳 Processing Pay2m transaction data:', transactionData)

    // Parse reference to extract campaign and ticket information
    if (!transactionData.reference) {
      console.error('❌ No reference found in transaction')
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'No reference found' 
        } as Pay2mWebhookResponse),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse reference format: campaign_{id}_tickets_{quota_numbers}
    const referenceMatch = transactionData.reference.match(/^campaign_([^_]+)_tickets_(.+)$/)
    if (!referenceMatch) {
      console.error('❌ Invalid reference format:', transactionData.reference)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid reference format' 
        } as Pay2mWebhookResponse),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const campaignId = referenceMatch[1]
    const quotaNumbers = referenceMatch[2].split(',').map(num => parseInt(num.trim()))

    console.log('🎯 Extracted data:', { campaignId, quotaNumbers, status: transactionData.status })

    // Process payment based on status
    if (transactionData.status === 'completed' || transactionData.status === 'approved' || transactionData.status === 'paid') {
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
          } as Pay2mWebhookResponse),
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
        p_message: `Pay2m transaction ${transactionData.id} processed successfully`,
        p_details: {
          transaction_id: transactionData.id,
          quota_numbers: quotaNumbers,
          amount: transactionData.amount,
          customer_email: transactionData.customer.email,
          payment_method: transactionData.payment_method
        }
      })

    } else if (transactionData.status === 'failed' || transactionData.status === 'cancelled' || transactionData.status === 'rejected' || transactionData.status === 'expired') {
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
          } as Pay2mWebhookResponse),
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
        p_message: `Pay2m transaction ${transactionData.id} failed, tickets released`,
        p_details: {
          transaction_id: transactionData.id,
          quota_numbers: quotaNumbers,
          status: transactionData.status,
          payment_method: transactionData.payment_method
        }
      })

    } else {
      // Payment pending - no action needed, tickets remain reserved
      console.log('⏳ Payment pending, keeping tickets reserved')
      
      await supabase.rpc('log_cleanup_operation', {
        p_operation_type: 'payment_pending',
        p_campaign_id: campaignId,
        p_status: 'success',
        p_message: `Pay2m transaction ${transactionData.id} is pending`,
        p_details: {
          transaction_id: transactionData.id,
          quota_numbers: quotaNumbers,
          status: transactionData.status
        }
      })
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Webhook processed successfully',
        transaction_id: transactionData.id
      } as Pay2mWebhookResponse),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error: unknown) {
    console.error('💥 Error processing Pay2m webhook:', error)
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Internal server error',
        message: errMsg 
      } as Pay2mWebhookResponse),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

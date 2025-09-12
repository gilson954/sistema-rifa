import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface StripeWebhookEvent {
  id: string
  type: string
  data: {
    object: {
      id: string
      status: string
      amount: number
      currency: string
      metadata: {
        campaign_id: string
        campaign_title?: string
        type?: string
      }
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
    const webhookEvent: StripeWebhookEvent = await req.json()
    
    console.log('🔔 Stripe webhook received:', webhookEvent.type, webhookEvent.id)

    // Only process payment intent events
    if (!webhookEvent.type.startsWith('payment_intent.')) {
      console.log('ℹ️ Ignoring non-payment_intent webhook event:', webhookEvent.type)
      return new Response(
        JSON.stringify({ message: 'Webhook received but not processed' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const paymentIntent = webhookEvent.data.object
    const campaignId = paymentIntent.metadata.campaign_id

    if (!campaignId) {
      console.error('❌ No campaign_id found in payment intent metadata')
      return new Response(
        JSON.stringify({ error: 'No campaign_id in metadata' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('💳 Processing payment intent:', paymentIntent.id, 'for campaign:', campaignId)

    // Update payment record in database
    const { error: paymentUpdateError } = await supabase
      .from('payments')
      .update({
        status: paymentIntent.status === 'succeeded' ? 'succeeded' : 
               paymentIntent.status === 'canceled' ? 'canceled' : 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_payment_intent_id', paymentIntent.id)

    if (paymentUpdateError) {
      console.error('❌ Error updating payment record:', paymentUpdateError)
    }

    // Process based on payment status
    if (webhookEvent.type === 'payment_intent.succeeded') {
      console.log('✅ Payment succeeded, activating campaign...')
      
      // Update campaign: set as paid, active, and remove expiration
      const { data: updatedCampaign, error: campaignUpdateError } = await supabase
        .from('campaigns')
        .update({
          is_paid: true,
          status: 'active',
          expires_at: null, // Remove expiration for paid campaigns
          start_date: new Date().toISOString()
        })
        .eq('id', campaignId)
        .select()
        .single()

      if (campaignUpdateError) {
        console.error('❌ Error updating campaign:', campaignUpdateError)
        return new Response(
          JSON.stringify({ error: 'Failed to activate campaign' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      console.log('🎉 Campaign activated successfully:', updatedCampaign.id)

      // Log successful payment processing
      await supabase.rpc('log_cleanup_operation', {
        p_operation_type: 'publication_fee_paid',
        p_campaign_id: campaignId,
        p_campaign_title: paymentIntent.metadata.campaign_title,
        p_status: 'success',
        p_message: `Publication fee paid via ${paymentIntent.metadata.payment_method || 'stripe'}`,
        p_details: {
          stripe_payment_intent_id: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency
        }
      })

    } else if (webhookEvent.type === 'payment_intent.payment_failed' || webhookEvent.type === 'payment_intent.canceled') {
      console.log('❌ Payment failed or canceled')
      
      // Log failed payment
      await supabase.rpc('log_cleanup_operation', {
        p_operation_type: 'publication_fee_failed',
        p_campaign_id: campaignId,
        p_campaign_title: paymentIntent.metadata.campaign_title,
        p_status: 'warning',
        p_message: `Publication fee payment failed: ${webhookEvent.type}`,
        p_details: {
          stripe_payment_intent_id: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          status: paymentIntent.status
        }
      })
    }

    return new Response(
      JSON.stringify({ 
        message: 'Webhook processed successfully',
        event_type: webhookEvent.type,
        payment_intent_id: paymentIntent.id
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('💥 Error processing Stripe webhook:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
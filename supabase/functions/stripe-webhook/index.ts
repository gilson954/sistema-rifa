import { createClient } from 'npm:@supabase/supabase-js@2'
import Stripe from 'npm:stripe@^14.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface StripeWebhookEvent {
  id: string
  type: string
  data: {
    object: Stripe.PaymentIntent | Stripe.Checkout.Session
  }
}

interface WebhookResponse {
  success: boolean
  message: string
  event_type?: string
  payment_intent_id?: string
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
      } as WebhookResponse),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  try {
    // Initialize environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')!
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

    console.log('🔧 Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      hasStripeKey: !!stripeSecretKey,
      hasWebhookSecret: !!webhookSecret
    })

    if (!stripeSecretKey) {
      console.error('❌ STRIPE_SECRET_KEY not configured')
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Stripe secret key not configured' 
        } as WebhookResponse),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize clients
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-06-20',
    })

    // Get raw body and signature for webhook verification
    const rawBody = await req.text()
    const signature = req.headers.get('stripe-signature')

    console.log('📨 Webhook received:', {
      hasSignature: !!signature,
      bodyLength: rawBody.length,
      timestamp: new Date().toISOString()
    })

    let event: Stripe.Event

    try {
      if (webhookSecret && signature) {
        // Verify webhook signature (recommended for production)
        event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
        console.log('✅ Webhook signature verified')
      } else {
        // Parse directly without verification (for testing only)
        event = JSON.parse(rawBody)
        console.log('⚠️ Webhook processed without signature verification')
      }
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err.message)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Webhook signature verification failed',
          details: err.message 
        } as WebhookResponse),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('🔔 Processing Stripe event:', event.type, event.id)

    // Only process relevant payment events
    const relevantEvents = [
      'payment_intent.succeeded',
      'payment_intent.payment_failed',
      'payment_intent.canceled',
      'checkout.session.completed'
    ]

    if (!relevantEvents.includes(event.type)) {
      console.log('ℹ️ Ignoring non-payment webhook event:', event.type)
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Webhook received but not processed (not a payment event)' 
        } as WebhookResponse),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    let paymentIntent: Stripe.PaymentIntent
    let campaignId: string

    // Extract payment intent and campaign ID based on event type
    if (event.type.startsWith('payment_intent.')) {
      paymentIntent = event.data.object as Stripe.PaymentIntent
      campaignId = paymentIntent.metadata?.campaign_id || ''
    } else if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      campaignId = session.metadata?.campaign_id || ''
      
      // Get payment intent from session
      if (session.payment_intent) {
        const pi = await stripe.paymentIntents.retrieve(session.payment_intent as string)
        paymentIntent = pi
      } else {
        console.error('❌ No payment intent found in checkout session')
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'No payment intent in checkout session' 
          } as WebhookResponse),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    } else {
      console.error('❌ Unexpected event type:', event.type)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Unexpected event type' 
        } as WebhookResponse),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!campaignId) {
      console.error('❌ No campaign_id found in metadata for event:', event.id)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'No campaign_id in metadata' 
        } as WebhookResponse),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('💳 Processing payment:', {
      paymentIntentId: paymentIntent.id,
      campaignId: campaignId,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      eventType: event.type
    })

    // Upsert payment record for audit trail
    try {
      const { error: paymentUpsertError } = await supabase
        .from('payments')
        .upsert({
          stripe_payment_intent_id: paymentIntent.id,
          campaign_id: campaignId,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          status: paymentIntent.status === 'succeeded' ? 'succeeded' : 
                 paymentIntent.status === 'canceled' ? 'canceled' : 'failed',
          payment_method: paymentIntent.payment_method_types?.[0] || 'card',
          metadata: paymentIntent.metadata || {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'stripe_payment_intent_id',
          ignoreDuplicates: false 
        })

      if (paymentUpsertError) {
        console.error('❌ Error upserting payment record:', paymentUpsertError)
        // Don't return error here, continue processing
      } else {
        console.log('💾 Payment record upserted successfully')
      }
    } catch (paymentError) {
      console.error('❌ Exception during payment upsert:', paymentError)
      // Continue processing even if payment record fails
    }

    // Process based on payment status
    if (event.type === 'payment_intent.succeeded' || event.type === 'checkout.session.completed') {
      console.log('✅ Payment succeeded, activating campaign...')
      
      try {
        // First, verify campaign exists and get current status
        const { data: existingCampaign, error: fetchError } = await supabase
          .from('campaigns')
          .select('id, title, status, is_paid, user_id')
          .eq('id', campaignId)
          .single()

        if (fetchError || !existingCampaign) {
          console.error('❌ Campaign not found:', campaignId, fetchError)
          return new Response(
            JSON.stringify({ 
              success: false,
              error: 'Campaign not found' 
            } as WebhookResponse),
            { 
              status: 404, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        console.log('📋 Campaign found:', {
          id: existingCampaign.id,
          title: existingCampaign.title,
          currentStatus: existingCampaign.status,
          isPaid: existingCampaign.is_paid
        })

        // Check if already processed to prevent duplicate processing
        if (existingCampaign.is_paid && existingCampaign.status === 'active') {
          console.log('ℹ️ Campaign already processed and active, skipping update')
          return new Response(
            JSON.stringify({ 
              success: true,
              message: 'Campaign already processed' 
            } as WebhookResponse),
            { 
              status: 200, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        // Update campaign: set as paid, active, and remove expiration
        const { data: updatedCampaign, error: campaignUpdateError } = await supabase
          .from('campaigns')
          .update({
            is_paid: true,
            status: 'active',
            expires_at: null, // Remove expiration for paid campaigns
            start_date: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', campaignId)
          .select()
          .single()

        if (campaignUpdateError) {
          console.error('❌ Error updating campaign:', campaignUpdateError)
          
          // Log the failed operation
          await supabase.rpc('log_cleanup_operation', {
            p_operation_type: 'campaign_activation_failed',
            p_campaign_id: campaignId,
            p_campaign_title: existingCampaign.title,
            p_status: 'error',
            p_message: `Failed to activate campaign after payment: ${campaignUpdateError.message}`,
            p_details: {
              payment_intent_id: paymentIntent.id,
              error: campaignUpdateError
            }
          })

          return new Response(
            JSON.stringify({ 
              success: false,
              error: 'Failed to activate campaign',
              details: campaignUpdateError.message 
            } as WebhookResponse),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        console.log('🎉 Campaign activated successfully:', {
          id: updatedCampaign.id,
          title: updatedCampaign.title,
          status: updatedCampaign.status,
          isPaid: updatedCampaign.is_paid
        })

        // Update stripe_orders table if exists
        try {
          const { error: orderUpdateError } = await supabase
            .from('stripe_orders')
            .update({
              status: 'complete',
              payment_status: 'paid',
              updated_at: new Date().toISOString()
            })
            .eq('stripe_session_id', paymentIntent.id) // This might need adjustment based on your data structure

          if (orderUpdateError) {
            console.warn('⚠️ Could not update stripe_orders (might not exist):', orderUpdateError.message)
          }
        } catch (orderError) {
          console.warn('⚠️ Exception updating stripe_orders:', orderError)
        }

        // Log successful payment processing
        await supabase.rpc('log_cleanup_operation', {
          p_operation_type: 'publication_fee_paid',
          p_campaign_id: campaignId,
          p_campaign_title: existingCampaign.title,
          p_status: 'success',
          p_message: `Publication fee paid successfully for campaign "${existingCampaign.title}"`,
          p_details: {
            payment_intent_id: paymentIntent.id,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency,
            event_type: event.type
          }
        })

      } catch (processingError) {
        console.error('💥 Exception during campaign activation:', processingError)
        
        // Log the error
        await supabase.rpc('log_cleanup_operation', {
          p_operation_type: 'webhook_processing_error',
          p_campaign_id: campaignId,
          p_status: 'error',
          p_message: `Exception during webhook processing: ${processingError.message}`,
          p_details: {
            payment_intent_id: paymentIntent.id,
            error: processingError.message,
            stack: processingError.stack
          }
        })

        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Exception during processing',
            details: processingError.message 
          } as WebhookResponse),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

    } else if (event.type === 'payment_intent.payment_failed' || event.type === 'payment_intent.canceled') {
      console.log('❌ Payment failed or canceled:', {
        paymentIntentId: paymentIntent.id,
        campaignId: campaignId,
        status: paymentIntent.status
      })
      
      // Log failed payment
      await supabase.rpc('log_cleanup_operation', {
        p_operation_type: 'publication_fee_failed',
        p_campaign_id: campaignId,
        p_status: 'warning',
        p_message: `Publication fee payment failed: ${event.type}`,
        p_details: {
          payment_intent_id: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          status: paymentIntent.status,
          event_type: event.type
        }
      })
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Webhook processed successfully',
        event_type: event.type,
        payment_intent_id: paymentIntent.id
      } as WebhookResponse),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('💥 Unexpected error processing Stripe webhook:', error)
    
    // Try to log the error if possible
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
          auth: { autoRefreshToken: false, persistSession: false }
        })

        await supabase.rpc('log_cleanup_operation', {
          p_operation_type: 'webhook_error',
          p_status: 'error',
          p_message: `Webhook processing failed: ${error.message}`,
          p_details: {
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
          }
        })
      }
    } catch (logError) {
      console.error('💥 Could not log error to database:', logError)
    }
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Internal server error',
        message: error.message 
      } as WebhookResponse),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
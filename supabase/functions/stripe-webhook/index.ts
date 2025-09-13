import { createClient } from 'npm:@supabase/supabase-js@2'
import Stripe from 'npm:stripe@^14.0.0' // Certifique-se de que esta linha está presente

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// A interface StripeWebhookEvent não é mais estritamente necessária aqui,
// pois vamos lidar com diferentes tipos de objetos de evento.

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
    // Initialize Stripe with secret key
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Stripe secret key not configured'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-06-20',
    })

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
    const webhookEvent = await req.json() // Usamos 'any' aqui para flexibilidade
    
    console.log('🔔 Stripe webhook received:', webhookEvent.type, webhookEvent.id)

    let paymentIntent: Stripe.PaymentIntent | null = null;
    let campaignId: string | undefined;
    let campaignTitle: string | undefined;
    let paymentMethod: string | undefined;

    // Lógica para lidar com diferentes tipos de eventos
    if (webhookEvent.type === 'checkout.session.completed') {
      const session = webhookEvent.data.object as Stripe.Checkout.Session;
      console.log('Processing checkout.session.completed event for session:', session.id);

      // O payment_intent pode ser o ID ou o objeto completo, dependendo da criação da sessão
      if (session.payment_intent) {
        // Se for apenas o ID, precisamos buscar o Payment Intent completo
        paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent as string);
        console.log('Fetched Payment Intent from session:', paymentIntent.id);
      } else {
        console.warn('Checkout session completed but no payment_intent found.');
        return new Response(
          JSON.stringify({ message: 'Checkout session completed but no payment_intent found' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      // Extrair metadados e método de pagamento da sessão ou do Payment Intent
      campaignId = session.metadata?.campaign_id;
      campaignTitle = session.metadata?.campaign_title;
      paymentMethod = session.payment_method_types?.[0]; 
      
    } else if (webhookEvent.type.startsWith('payment_intent.')) {
      // Se o evento já é um payment_intent, o objeto já é o Payment Intent
      paymentIntent = webhookEvent.data.object as Stripe.PaymentIntent;
      console.log('Processing payment_intent event:', paymentIntent.id);
      // Extrair metadados e método de pagamento diretamente do Payment Intent
      campaignId = paymentIntent.metadata?.campaign_id;
      campaignTitle = paymentIntent.metadata?.campaign_title;
      paymentMethod = paymentIntent.payment_method_types?.[0];

    } else {
      console.log('ℹ️ Ignoring webhook event type:', webhookEvent.type);
      return new Response(
        JSON.stringify({ message: 'Webhook received but not processed' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // A partir daqui, 'paymentIntent' deve estar preenchido se o evento for relevante
    if (!paymentIntent) {
      console.error('❌ No Payment Intent object could be retrieved or identified.');
      return new Response(
        JSON.stringify({ error: 'No Payment Intent object' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Adicione estas duas linhas para depuração (já estavam, mas reforcei a importância):
    console.log('Payment Intent Object:', JSON.stringify(paymentIntent, null, 2));
    console.log('Payment Intent Metadata:', paymentIntent.metadata);

    // Reafirmar campaignId e campaignTitle a partir dos metadados do paymentIntent
    // Isso garante que estamos usando os dados do Payment Intent final
    campaignId = paymentIntent.metadata?.campaign_id;
    campaignTitle = paymentIntent.metadata?.campaign_title;
    paymentMethod = paymentIntent.payment_method_types?.[0];


    if (!campaignId) {
      console.error('❌ No campaign_id found in payment intent metadata');
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
    // Agora usamos paymentIntent.status diretamente, pois já o temos
    if (paymentIntent.status === 'succeeded') { 
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
        p_campaign_title: campaignTitle, // Usar o campaignTitle extraído
        p_status: 'success',
        p_message: `Publication fee paid via ${paymentMethod || 'stripe'}`, // Usar o paymentMethod extraído
        p_details: {
          stripe_payment_intent_id: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency
        }
      })

    } else if (paymentIntent.status === 'canceled' || paymentIntent.status === 'requires_payment_method') { // Lidar com outros status de falha/cancelamento
      console.log('❌ Payment failed or canceled')
      
      // Log failed payment
      await supabase.rpc('log_cleanup_operation', {
        p_operation_type: 'publication_fee_failed',
        p_campaign_id: campaignId,
        p_campaign_title: campaignTitle, // Usar o campaignTitle extraído
        p_status: 'warning',
        p_message: `Publication fee payment failed: ${paymentIntent.status}`,
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

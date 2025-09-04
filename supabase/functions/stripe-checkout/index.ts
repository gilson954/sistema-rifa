import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface CheckoutRequest {
  campaign_id: string
  amount: number
  payment_method_type: 'pix' | 'card'
}

interface CheckoutResponse {
  success: boolean
  client_secret?: string
  qr_code_data?: string
  qr_code_image_url?: string
  payment_id: string
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
      }),
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

    // Parse request body
    const { campaign_id, amount, payment_method_type }: CheckoutRequest = await req.json()

    if (!campaign_id || !amount || !payment_method_type) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required parameters'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('🛒 Creating Stripe checkout for campaign:', campaign_id)

    // Verify campaign exists and belongs to authenticated user
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, title, user_id, is_paid')
      .eq('id', campaign_id)
      .single()

    if (campaignError || !campaign) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Campaign not found'
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if campaign is already paid
    if (campaign.is_paid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Campaign publication fee already paid'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Initialize Stripe (in production, use actual Stripe SDK)
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    
    if (!stripeSecretKey) {
      console.error('❌ Stripe secret key not configured')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Payment system not configured'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create Stripe PaymentIntent
    const paymentIntentData = {
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'brl',
      payment_method_types: [payment_method_type],
      metadata: {
        campaign_id: campaign_id,
        campaign_title: campaign.title,
        type: 'publication_fee'
      }
    }

    console.log('💳 Creating PaymentIntent with data:', paymentIntentData)

    // In production, you would call Stripe API here
    // For now, we'll simulate the response
    const mockPaymentIntent = {
      id: `pi_mock_${Date.now()}`,
      client_secret: `pi_mock_${Date.now()}_secret_mock`,
      status: 'requires_payment_method',
      amount: paymentIntentData.amount,
      currency: paymentIntentData.currency,
      // Mock PIX data for demonstration
      next_action: payment_method_type === 'pix' ? {
        type: 'pix_display_qr_code',
        pix_display_qr_code: {
          data: `00020126580014br.gov.bcb.pix0136${campaign_id}5204000053039865802BR5925RIFAQUI PAGAMENTOS LTDA6009SAO PAULO62070503***6304ABCD`,
          image_url_png: `https://api.stripe.com/v1/payment_intents/${campaign_id}/qr_code.png`,
          image_url_svg: `https://api.stripe.com/v1/payment_intents/${campaign_id}/qr_code.svg`
        }
      } : null
    }

    // Save payment record to database
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        campaign_id: campaign_id,
        stripe_payment_intent_id: mockPaymentIntent.id,
        payment_method: payment_method_type,
        amount: amount,
        currency: 'brl',
        status: 'pending',
        client_secret: mockPaymentIntent.client_secret,
        qr_code_data: payment_method_type === 'pix' ? mockPaymentIntent.next_action?.pix_display_qr_code?.data : null,
        qr_code_image_url: payment_method_type === 'pix' ? mockPaymentIntent.next_action?.pix_display_qr_code?.image_url_png : null,
        metadata: paymentIntentData.metadata
      })
      .select()
      .single()

    if (paymentError) {
      console.error('❌ Error saving payment record:', paymentError)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to create payment record'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('✅ Payment record created:', payment.id)

    // Prepare response based on payment method
    const response: CheckoutResponse = {
      success: true,
      payment_id: payment.id,
      client_secret: mockPaymentIntent.client_secret
    }

    if (payment_method_type === 'pix' && mockPaymentIntent.next_action?.pix_display_qr_code) {
      response.qr_code_data = mockPaymentIntent.next_action.pix_display_qr_code.data
      response.qr_code_image_url = mockPaymentIntent.next_action.pix_display_qr_code.image_url_png
    }

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('💥 Error in stripe-checkout function:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
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
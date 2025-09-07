import { createClient } from 'npm:@supabase/supabase-js@2'

// Import Stripe products configuration
const STRIPE_PRODUCTS = [
  {
    id: 'prod_Rifaqui_7',
    priceId: 'price_1S3AwiPYLlPdMwZvznZO3bEZ',
    name: 'Rifaqui - Taxa de Publicação (R$ 0-100)',
    description: 'Taxa de publicação para ativar sua campanha na plataforma Rifaqui',
    price: 7.00,
    currency: 'BRL',
    mode: 'payment',
    minRevenue: 0,
    maxRevenue: 100
  },
  {
    id: 'prod_Rifaqui_17',
    priceId: 'price_1S3nhFPYLlPdMwZv4p3CafZN',
    name: 'Rifaqui - Taxa de Publicação (R$ 100-200)',
    description: 'Taxa de publicação para ativar sua campanha na plataforma Rifaqui',
    price: 17.00,
    currency: 'BRL',
    mode: 'payment',
    minRevenue: 100.01,
    maxRevenue: 200
  },
  {
    id: 'prod_Rifaqui_27',
    priceId: 'price_1S3sFlPYLlPdMwZvrFuyetkG',
    name: 'Rifaqui - Taxa de Publicação (R$ 200-400)',
    description: 'Taxa de publicação para ativar sua campanha na plataforma Rifaqui',
    price: 27.00,
    currency: 'BRL',
    mode: 'payment',
    minRevenue: 200.01,
    maxRevenue: 400
  },
  {
    id: 'prod_Rifaqui_37',
    priceId: 'price_1S3sG8PYLlPdMwZvw7DLj5yc',
    name: 'Rifaqui - Taxa de Publicação (R$ 400-701)',
    description: 'Taxa de publicação para ativar sua campanha na plataforma Rifaqui',
    price: 37.00,
    currency: 'BRL',
    mode: 'payment',
    minRevenue: 400.01,
    maxRevenue: 701
  },
  {
    id: 'prod_Rifaqui_47',
    priceId: 'price_PLACEHOLDER_47',
    name: 'Rifaqui - Taxa de Publicação (R$ 701-1.000)',
    description: 'Taxa de publicação para ativar sua campanha na plataforma Rifaqui',
    price: 47.00,
    currency: 'BRL',
    mode: 'payment',
    minRevenue: 701.01,
    maxRevenue: 1000
  },
  {
    id: 'prod_Rifaqui_67',
    priceId: 'price_1S3sGVPYLlPdMwZvOFJgsJ70',
    name: 'Rifaqui - Taxa de Publicação (R$ 1.000-2.000)',
    description: 'Taxa de publicação para ativar sua campanha na plataforma Rifaqui',
    price: 67.00,
    currency: 'BRL',
    mode: 'payment',
    minRevenue: 1000.01,
    maxRevenue: 2000
  },
  {
    id: 'prod_Rifaqui_77',
    priceId: 'price_1S3sGfPYLlPdMwZv5PPGuyfa',
    name: 'Rifaqui - Taxa de Publicação (R$ 2.000-4.000)',
    description: 'Taxa de publicação para ativar sua campanha na plataforma Rifaqui',
    price: 77.00,
    currency: 'BRL',
    mode: 'payment',
    minRevenue: 2000.01,
    maxRevenue: 4000
  },
  {
    id: 'prod_Rifaqui_127',
    priceId: 'price_1S3sGqPYLlPdMwZvfHwHorbm',
    name: 'Rifaqui - Taxa de Publicação (R$ 4.000-7.100)',
    description: 'Taxa de publicação para ativar sua campanha na plataforma Rifaqui',
    price: 127.00,
    currency: 'BRL',
    mode: 'payment',
    minRevenue: 4000.01,
    maxRevenue: 7100
  },
  {
    id: 'prod_Rifaqui_197',
    priceId: 'price_1S3sGyPYLlPdMwZvRaZ6GPdM',
    name: 'Rifaqui - Taxa de Publicação (R$ 7.100-10.000)',
    description: 'Taxa de publicação para ativar sua campanha na plataforma Rifaqui',
    price: 197.00,
    currency: 'BRL',
    mode: 'payment',
    minRevenue: 7100.01,
    maxRevenue: 10000
  },
  {
    id: 'prod_Rifaqui_247',
    priceId: 'price_1S3sHBPYLlPdMwZvmdYwtV9r',
    name: 'Rifaqui - Taxa de Publicação (R$ 10.000-20.000)',
    description: 'Taxa de publicação para ativar sua campanha na plataforma Rifaqui',
    price: 247.00,
    currency: 'BRL',
    mode: 'payment',
    minRevenue: 10000.01,
    maxRevenue: 20000
  },
  {
    id: 'prod_Rifaqui_497',
    priceId: 'price_1S3sHKPYLlPdMwZvMv75xOns',
    name: 'Rifaqui - Taxa de Publicação (R$ 20.000-30.000)',
    description: 'Taxa de publicação para ativar sua campanha na plataforma Rifaqui',
    price: 497.00,
    currency: 'BRL',
    mode: 'payment',
    minRevenue: 20000.01,
    maxRevenue: 30000
  },
  {
    id: 'prod_Rifaqui_997',
    priceId: 'price_1S3sHSPYLlPdMwZv9w4Ieuec',
    name: 'Rifaqui - Taxa de Publicação (R$ 30.000-50.000)',
    description: 'Taxa de publicação para ativar sua campanha na plataforma Rifaqui',
    price: 997.00,
    currency: 'BRL',
    mode: 'payment',
    minRevenue: 30000.01,
    maxRevenue: 50000
  },
  {
    id: 'prod_Rifaqui_1497',
    priceId: 'price_PLACEHOLDER_1497',
    name: 'Rifaqui - Taxa de Publicação (R$ 50.000-70.000)',
    description: 'Taxa de publicação para ativar sua campanha na plataforma Rifaqui',
    price: 1497.00,
    currency: 'BRL',
    mode: 'payment',
    minRevenue: 50000.01,
    maxRevenue: 70000
  },
  {
    id: 'prod_Rifaqui_1997',
    priceId: 'price_1S3sHnPYLlPdMwZvvNESi00P',
    name: 'Rifaqui - Taxa de Publicação (R$ 70.000-100.000)',
    description: 'Taxa de publicação para ativar sua campanha na plataforma Rifaqui',
    price: 1997.00,
    currency: 'BRL',
    mode: 'payment',
    minRevenue: 70000.01,
    maxRevenue: 100000
  },
  {
    id: 'prod_Rifaqui_2997',
    priceId: 'price_1S3sI4PYLlPdMwZvhhe0gN2N',
    name: 'Rifaqui - Taxa de Publicação (R$ 100.000-150.000)',
    description: 'Taxa de publicação para ativar sua campanha na plataforma Rifaqui',
    price: 2997.00,
    currency: 'BRL',
    mode: 'payment',
    minRevenue: 100000.01,
    maxRevenue: 150000
  },
  {
    id: 'prod_Rifaqui_3997',
    priceId: 'price_1S3sI4PYLlPdMwZvhhe0gN2N',
    name: 'Rifaqui - Taxa de Publicação (Acima de R$ 150.000)',
    description: 'Taxa de publicação para ativar sua campanha na plataforma Rifaqui',
    price: 3997.00,
    currency: 'BRL',
    mode: 'payment',
    minRevenue: 150000.01,
    maxRevenue: Infinity
  }
];

const getProductByPriceId = (priceId: string) => {
  return STRIPE_PRODUCTS.find(product => product.priceId === priceId);
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface CheckoutRequest {
  priceId: string
  campaignId?: string
  successUrl?: string
  cancelUrl?: string
}

interface CheckoutResponse {
  success: boolean
  checkout_url?: string
  session_id?: string
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
      } as CheckoutResponse),
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
    const { priceId, campaignId, successUrl, cancelUrl }: CheckoutRequest = await req.json()

    if (!priceId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing priceId parameter'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('🛒 Creating Stripe checkout with priceId:', priceId)

    // Get product details from priceId
    const product = getProductByPriceId(priceId)
    
    if (!product) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Product not found for the provided priceId'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Verify campaign exists if campaignId is provided
    if (campaignId) {
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('id, title, user_id, is_paid')
        .eq('id', campaignId)
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

      // Save checkout session record to database
      const { error: orderError } = await supabase
        .from('stripe_orders')
        .insert({
          user_id: campaign.user_id, // Use the campaign owner's user_id
          stripe_session_id: mockCheckoutSession.id,
          stripe_customer_id: 'cus_mock_customer',
          status: 'open',
          amount_total: Math.round(product.price * 100), // Convert to cents
          currency: 'brl',
          payment_status: 'unpaid',
          metadata: checkoutSessionData.metadata
        })

      if (orderError) {
        console.error('❌ Error saving order record:', orderError)
        // Continue anyway, as the checkout session was created
      }
    }

    // Create Stripe Checkout Session (mock implementation)
    const checkoutSessionData = {
      mode: 'payment',
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      currency: 'brl',
      success_url: successUrl || `${req.headers.get('origin')}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${req.headers.get('origin')}/payment-cancelled`,
      metadata: {
        campaign_id: campaignId || '',
        type: 'publication_fee',
        price_id: priceId
      }
    }

    console.log('💳 Creating Checkout Session with data:', checkoutSessionData)

    // In production, you would call Stripe API to create checkout session here
    // For now, we'll simulate the response
    const mockCheckoutSession = {
      id: `cs_mock_${Date.now()}`,
      url: `https://checkout.stripe.com/pay/cs_mock_${Date.now()}#mock_checkout_url`
    }

    // Save checkout session record to database if campaignId is provided
    if (campaignId) {
    // Prepare response
    const response: CheckoutResponse = {
      success: true,
      checkout_url: mockCheckoutSession.url,
      session_id: mockCheckoutSession.id
    }

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('💥 Error creating Stripe checkout:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        message: error.message
      } as CheckoutResponse),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface CreatePixRequest {
  campaign_id: string
  quota_numbers: number[]
  user_id: string
  payer_email: string
  payment_method: 'pix' | 'credit_card'
  total_amount: number
  request_number?: string
  payer_name?: string
  payer_phone?: string
}

interface PaymentResponse {
  payment_id: string
  status: 'pending' | 'approved' | 'rejected'
  payment_url?: string
  qr_code?: string
  qr_code_base64?: string
  external_reference: string
}

function generateExternalReference(campaignId: string, quotas: number[]): string {
  return `campaign_${campaignId}_tickets_${quotas.join(',')}`
}

function buildMockBrCode(reservationId: string): string {
  const cleanId = reservationId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 32)
  const emv = `00020126580014br.gov.bcb.pix0136${cleanId}5204000053039865802BR5925RIFAQUI PAGAMENTOS LTDA6009SAO PAULO61080145200062070503***`
  const crc = '6304ABCD'
  return `${emv}${crc}`
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const payload: CreatePixRequest = await req.json()

    if (!payload.campaign_id || !payload.user_id || !payload.quota_numbers?.length) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: organizerProfile, error: profileError } = await supabase
      .from('profiles')
      .select('payment_integrations_config')
      .eq('id', payload.user_id)
      .maybeSingle()

    if (profileError) {
      console.error('Error fetching organizer profile:', profileError)
    }

    const cfg = organizerProfile?.payment_integrations_config || {}
    const suit = cfg?.suitpay

    const externalReference = generateExternalReference(payload.campaign_id, payload.quota_numbers)

    const host = Deno.env.get('SUITPAY_HOST') || 'https://ws.suitpay.app'
    const ci = suit?.client_id
    const cs = suit?.client_secret
    let responseData: PaymentResponse | null = null

    if (ci && cs) {
      try {
        const requestNumber = payload.request_number || externalReference
        const body = {
          value: Number(payload.total_amount?.toFixed(2) || 0),
          requestNumber,
          callbackUrl: suit?.webhook_url || '',
          customer: {
            name: payload.payer_name || 'Cliente Rifaqui',
            email: payload.payer_email || '',
            taxId: payload.payer_phone || ''
          }
        }
        const url = `${host}/pix/cashin/create`
        const spRes = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ci, cs },
          body: JSON.stringify(body)
        })

        const spJson = await spRes.json()
        if (!spRes.ok) {
          console.error('SuitPay create error:', spJson)
          responseData = null
        } else {
          const brCode = spJson?.paymentCode || spJson?.copyPasteKey || spJson?.emv || ''
          responseData = {
            payment_id: spJson?.idTransaction || `suitpay_${Date.now()}`,
            status: 'pending',
            external_reference: externalReference,
            qr_code: brCode,
            qr_code_base64: spJson?.qrCode || undefined,
            payment_url: spJson?.paymentUrl || undefined
          }
        }
      } catch (err) {
        console.error('Error calling SuitPay API:', err)
      }
    }

    if (!responseData) {
      const brCode = buildMockBrCode(externalReference)
      responseData = {
        payment_id: `suitpay_${Date.now()}`,
        status: 'pending',
        external_reference: externalReference,
        qr_code: brCode
      }
    }

    return new Response(
      JSON.stringify(responseData),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error creating SuitPay PIX:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

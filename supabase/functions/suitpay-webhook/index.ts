import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface SuitPayWebhookPayload {
  idTransaction: string
  typeTransaction: string
  statusTransaction: 'PAID_OUT' | 'CHARGEBACK'
  value: number
  payerName: string
  payerTaxId: string
  paymentDate: string
  paymentCode: string
  requestNumber: string
  hash: string
}

function concatValuesForHash(p: SuitPayWebhookPayload): string {
  return [
    p.idTransaction,
    p.typeTransaction,
    p.statusTransaction,
    String(p.value),
    p.payerName,
    p.payerTaxId,
    p.paymentDate,
    p.paymentCode,
    p.requestNumber
  ].join('')
}

async function validateHash(payload: SuitPayWebhookPayload, supabase: SupabaseClient, campaignId: string): Promise<boolean> {
  const { data: campaign, error: campErr } = await supabase
    .from('campaigns')
    .select('user_id')
    .eq('id', campaignId)
    .maybeSingle()

  if (campErr || !campaign?.user_id) return false

  const { data: profile, error: profErr } = await supabase
    .from('profiles')
    .select('payment_integrations_config')
    .eq('id', campaign.user_id)
    .maybeSingle()

  if (profErr) return false
  const cs = profile?.payment_integrations_config?.suitpay?.client_secret
  if (!cs) return false

  const baseString = concatValuesForHash(payload) + cs
  const encoder = new TextEncoder()
  const data = encoder.encode(baseString)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  return hashHex === payload.hash
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

    const payload: SuitPayWebhookPayload = await req.json()
    console.log('🔔 SuitPay webhook received:', {
      idTransaction: payload.idTransaction,
      statusTransaction: payload.statusTransaction,
      requestNumber: payload.requestNumber
    })

    const refMatch = payload.requestNumber?.match(/^campaign_([^_]+)_tickets_(.+)$/)
    if (!refMatch) {
      console.error('Invalid requestNumber format:', payload.requestNumber)
      return new Response(
        JSON.stringify({ error: 'Invalid requestNumber format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const campaignId = refMatch[1]
    const quotaNumbers = refMatch[2].split(',').map((n) => parseInt(n.trim()))

    const valid = await validateHash(payload, supabase, campaignId)
    if (!valid) {
      console.error('Invalid webhook hash')
      return new Response(
        JSON.stringify({ error: 'Invalid webhook hash' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (payload.statusTransaction === 'PAID_OUT') {
      const { error: updateError } = await supabase
        .from('tickets')
        .update({ status: 'comprado', bought_at: new Date().toISOString() })
        .eq('campaign_id', campaignId)
        .in('quota_number', quotaNumbers)
        .eq('status', 'reservado')
        .select()

      if (updateError) {
        console.error('Error updating tickets:', updateError)
        return new Response(
          JSON.stringify({ error: 'Failed to update tickets' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      await supabase.rpc('log_cleanup_operation', {
        p_operation_type: 'payment_processed',
        p_campaign_id: campaignId,
        p_status: 'success',
        p_message: `SuitPay transaction ${payload.idTransaction} processed successfully`,
        p_details: {
          idTransaction: payload.idTransaction,
          quota_numbers: quotaNumbers,
          value: payload.value,
          payerName: payload.payerName
        }
      })
    } else if (payload.statusTransaction === 'CHARGEBACK') {
      const { error: releaseError } = await supabase
        .from('tickets')
        .update({ status: 'disponível', user_id: null, reserved_at: null })
        .eq('campaign_id', campaignId)
        .in('quota_number', quotaNumbers)
        .eq('status', 'reservado')
        .select()

      if (releaseError) {
        console.error('Error releasing tickets:', releaseError)
        return new Response(
          JSON.stringify({ error: 'Failed to release tickets' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      await supabase.rpc('log_cleanup_operation', {
        p_operation_type: 'payment_failed',
        p_campaign_id: campaignId,
        p_status: 'warning',
        p_message: `SuitPay transaction ${payload.idTransaction} chargeback; tickets released`,
        p_details: {
          idTransaction: payload.idTransaction,
          quota_numbers: quotaNumbers,
          status: payload.statusTransaction
        }
      })
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error processing SuitPay webhook:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

import { supabase } from '../supabase';

export type PixKeyType = 'telefone' | 'cpf' | 'cnpj' | 'email' | 'aleatoria';

export interface ManualPixKey {
  id: string;
  user_id: string;
  key_type: PixKeyType;
  key_value: string;
  holder_name: string;
  created_at: string;
  updated_at: string;
}

export const ManualPixAPI = {
  async listKeys(userId: string) {
    const { data, error } = await supabase
      .from('manual_pix_keys')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data: data as ManualPixKey[] | null, error };
  },

  async createKey(payload: Omit<ManualPixKey, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('manual_pix_keys')
      .insert(payload)
      .select('*')
      .single();
    return { data: data as ManualPixKey | null, error };
  },

  async updateKey(id: string, payload: Partial<Omit<ManualPixKey, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) {
    const { data, error } = await supabase
      .from('manual_pix_keys')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();
    return { data: data as ManualPixKey | null, error };
  },

  async deleteKey(id: string) {
    const { error } = await supabase
      .from('manual_pix_keys')
      .delete()
      .eq('id', id);
    return { error };
  },

  async uploadProof(file: File, orderId: string, campaignId: string, organizerId: string, customerName?: string, customerPhone?: string) {
    const path = `${(await supabase.auth.getUser()).data.user?.id}/${orderId}-${Date.now()}.${(file.type?.split('/')?.[1] || 'png')}`;
    const { error: uploadError } = await supabase.storage.from('manual-payment-proofs').upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'image/png'
    });
    if (uploadError) return { data: null, error: uploadError };
    const { data, error } = await supabase
      .from('manual_payment_proofs')
      .insert({
        order_id: orderId,
        campaign_id: campaignId,
        organizer_id: organizerId,
        customer_name: customerName || null,
        customer_phone: customerPhone || null,
        image_url: path,
        status: 'pending'
      })
      .select('*')
      .single();
    return { data, error };
  },

  async listPendingProofs(organizerId: string) {
    const { data, error } = await supabase
      .from('manual_payment_proofs')
      .select('*')
      .eq('organizer_id', organizerId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) return { data, error };
    const proofs = (data || []) as any[];
    const withSigned = await Promise.all(proofs.map(async (p) => {
      const { data: signed } = await supabase.storage.from('manual-payment-proofs').createSignedUrl(p.image_url, 60 * 60);
      return { ...p, signed_url: signed?.signedUrl || null };
    }));
    return { data: withSigned, error: null };
  },

  async listOrdersByCampaign(campaignId: string) {
    const { data, error } = await supabase
      .from('manual_payment_proofs')
      .select('*')
      .eq('campaign_id', campaignId)
      .in('status', ['pending','approved','rejected','expired'])
      .order('created_at', { ascending: false });
    if (error) return { data: null, error };

    const { data: campaign } = await supabase
      .from('campaigns')
      .select('ticket_price')
      .eq('id', campaignId)
      .maybeSingle();

    const ticketPrice = Number(campaign?.ticket_price || 0);

    const enriched = await Promise.all((data || []).map(async (p: any) => {
      // Attempt to mark as expired when applicable before enrichment
      try {
        if (p.status === 'pending') {
          await supabase.rpc('expire_manual_payment_if_needed', { p_order_id: p.order_id, p_campaign_id: campaignId });
        }
      } catch (e) { void e }

      const { data: tickets } = await supabase
        .from('tickets')
        .select('quota_number,status,customer_email,reserved_at,reservation_expires_at')
        .eq('campaign_id', campaignId)
        .eq('order_id', p.order_id);
      const quotasCount = (tickets || []).length;
      const totalValue = quotasCount * ticketPrice;
      const customerEmail = tickets?.[0]?.customer_email || null;
      const reservedAt = tickets?.[0]?.reserved_at || p.created_at;
      const expiresAt = (tickets || []).reduce((acc:any, t:any) => acc ? acc : t.reservation_expires_at, null);
      const hasPurchased = (tickets || []).some((t:any) => t.status === 'comprado');
      const isExpired = p.status === 'pending' && expiresAt ? (new Date(expiresAt).getTime() < Date.now() && !hasPurchased) : false;
      const nextStatus = isExpired ? 'expired' : p.status;
      const { data: signed } = await supabase.storage.from('manual-payment-proofs').createSignedUrl(p.image_url, 60 * 60);
      return {
        ...p,
        status: nextStatus,
        quotas_count: quotasCount,
        total_value: totalValue,
        customer_email: customerEmail,
        reserved_at: reservedAt,
        payment_method: 'PIX Manual',
        whatsapp_url: p.customer_phone ? `https://wa.me/${String(p.customer_phone).replace(/\D/g,'')}` : null,
        signed_url: signed?.signedUrl || null
      };
    }));

    return { data: enriched, error: null };
  },

  async getOrderDetails(campaignId: string, orderId: string) {
    const { data, error } = await supabase
      .from('manual_payment_proofs')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('order_id', orderId)
      .maybeSingle();
    if (error) return { data: null, error };
    if (!data) return { data: null, error: { message: 'Pedido não encontrado' } };

    const { data: campaign } = await supabase
      .from('campaigns')
      .select('ticket_price')
      .eq('id', campaignId)
      .maybeSingle();
    const ticketPrice = Number(campaign?.ticket_price || 0);

    // Try to mark as expired if needed before fetch
    try { await supabase.rpc('expire_manual_payment_if_needed', { p_order_id: orderId, p_campaign_id: campaignId }); } catch (e) { void e }

    const { data: tickets } = await supabase
      .from('tickets')
      .select('quota_number,status,customer_email,reserved_at,reservation_expires_at')
      .eq('campaign_id', campaignId)
      .eq('order_id', orderId)
      .order('quota_number');

    const quotasCount = (tickets || []).length;
    const totalValue = quotasCount * ticketPrice;
    const customerEmail = tickets?.[0]?.customer_email || null;
    const reservedAt = tickets?.[0]?.reserved_at || data.created_at;
    const { data: signed } = await supabase.storage.from('manual-payment-proofs').createSignedUrl(data.image_url, 60 * 60);
    const expiresAt = (tickets || []).reduce((acc:any, t:any) => acc ? acc : t.reservation_expires_at, null);
    const hasPurchased = (tickets || []).some((t:any) => t.status === 'comprado');
    const isExpired = data.status === 'pending' && expiresAt ? (new Date(expiresAt).getTime() < Date.now() && !hasPurchased) : false;
    const nextStatus = isExpired ? 'expired' : data.status;

    return {
      data: {
        ...data,
        status: nextStatus,
        quotas_count: quotasCount,
        total_value: totalValue,
        customer_email: customerEmail,
        reserved_at: reservedAt,
        payment_method: 'PIX Manual',
        whatsapp_url: data.customer_phone ? `https://wa.me/${String(data.customer_phone).replace(/\D/g,'')}` : null,
        signed_url: signed?.signedUrl || null
      },
      error: null
    };
  },

  async updateOrderContact(
    campaignId: string,
    orderId: string,
    payload: { name: string; phone: string; email: string; payment_method: string }
  ) {
    const normalizedPhone = String(payload.phone || '').replace(/\D/g, '');

    const { error: proofError } = await supabase
      .from('manual_payment_proofs')
      .update({ customer_name: payload.name, customer_phone: normalizedPhone })
      .eq('campaign_id', campaignId)
      .eq('order_id', orderId);

    const { error: ticketsError } = await supabase
      .from('tickets')
      .update({ customer_name: payload.name, customer_email: payload.email, customer_phone: normalizedPhone })
      .eq('campaign_id', campaignId)
      .eq('order_id', orderId);

    return { error: proofError || ticketsError || null };
  },

  async approveProof(_proofId: string, orderId: string, campaignId: string) {
    const { data: updatedTickets, error } = await supabase.rpc('approve_manual_payment', {
      p_order_id: orderId,
      p_campaign_id: campaignId
    });
    return { data: updatedTickets, error };
  },

  async rejectProof(proofId: string) {
    const { error: rpcError } = await supabase.rpc('reject_manual_payment', { p_proof_id: proofId });
    try {
      await supabase.rpc('log_cleanup_operation', {
        p_operation_type: 'manual_payment_rejected',
        p_status: 'warning',
        p_message: `Manual PIX proof ${proofId} rejected`,
        p_details: { proof_id: proofId }
      });
    } catch (e) { void e }
    return { error: rpcError };
  }
};

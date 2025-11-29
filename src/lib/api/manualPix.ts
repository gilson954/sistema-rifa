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

export type ManualProofStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export interface ManualPaymentProof {
  id: string;
  order_id: string;
  campaign_id: string;
  organizer_id: string;
  customer_phone: string | null;
  customer_name: string | null;
  image_url: string;
  status: ManualProofStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ManualPaymentProofWithSigned extends ManualPaymentProof {
  signed_url: string | null;
}

export interface TicketSummary {
  quota_number: number;
  status: string;
  customer_email: string | null;
  reserved_at: string | null;
  reservation_expires_at: string | null;
}

export interface ManualPaymentOrderEnriched extends ManualPaymentProof {
  quotas_count: number;
  total_value: number;
  customer_email: string | null;
  reserved_at: string | null;
  payment_method: string;
  whatsapp_url: string | null;
  signed_url: string | null;
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

  async listPendingProofs(organizerId: string): Promise<{ data: ManualPaymentProofWithSigned[] | null; error: unknown }> {
    const { data, error } = await supabase
      .from('manual_payment_proofs')
      .select('*')
      .eq('organizer_id', organizerId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) return { data: null, error };
    const proofs = (data || []) as ManualPaymentProof[];
    const withSigned = await Promise.all(proofs.map(async (p) => {
      const { data: signed } = await supabase.storage.from('manual-payment-proofs').createSignedUrl(p.image_url, 60 * 60);
      return { ...p, signed_url: signed?.signedUrl || null };
    }));
    return { data: withSigned, error: null };
  },

  async listOrdersByCampaign(campaignId: string): Promise<{ data: ManualPaymentOrderEnriched[] | null; error: unknown }> {
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

    const enriched = await Promise.all(((data || []) as ManualPaymentProof[]).map(async (p) => {
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
      const ticketRows = (tickets || []) as TicketSummary[];
      const quotasCount = ticketRows.length;
      const totalValue = quotasCount * ticketPrice;
      const customerEmail = ticketRows?.[0]?.customer_email || null;
      const reservedAt = ticketRows?.[0]?.reserved_at || p.created_at;
      const expiresAt = ticketRows.reduce<string | null>((acc, t) => acc ?? (t.reservation_expires_at ?? null), null);
      const hasPurchased = ticketRows.some((t) => t.status === 'comprado');
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

  async getOrderDetails(campaignId: string, orderId: string): Promise<{ data: ManualPaymentOrderEnriched | null; error: unknown }> {
    const { data, error } = await supabase
      .from('manual_payment_proofs')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('order_id', orderId)
      .maybeSingle();
    if (error) return { data: null, error };
    if (!data) return { data: null, error: new Error('Pedido não encontrado') };

    const { data: campaign } = await supabase
      .from('campaigns')
      .select('ticket_price')
      .eq('id', campaignId)
      .maybeSingle();
    const ticketPrice = Number(campaign?.ticket_price || 0);

    try { await supabase.rpc('expire_manual_payment_if_needed', { p_order_id: orderId, p_campaign_id: campaignId }); } catch (e) { void e }

    const { data: tickets } = await supabase
      .from('tickets')
      .select('quota_number,status,customer_email,reserved_at,reservation_expires_at')
      .eq('campaign_id', campaignId)
      .eq('order_id', orderId)
      .order('quota_number');

    const ticketRows = (tickets || []) as TicketSummary[];
    const quotasCount = ticketRows.length;
    const totalValue = quotasCount * ticketPrice;
    const customerEmail = ticketRows?.[0]?.customer_email || null;
    const reservedAt = ticketRows?.[0]?.reserved_at || data.created_at;
    const { data: signed } = await supabase.storage.from('manual-payment-proofs').createSignedUrl(data.image_url, 60 * 60);
    const expiresAt = ticketRows.reduce<string | null>((acc, t) => acc ?? (t.reservation_expires_at ?? null), null);
    const hasPurchased = ticketRows.some((t) => t.status === 'comprado');
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

  async approveProof(_proofId: string, orderId: string, campaignId: string): Promise<{ data: { quota_number: number; updated: boolean }[] | null; error: unknown }> {
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

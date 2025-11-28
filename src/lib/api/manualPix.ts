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

  async listPendingByCampaign(campaignId: string) {
    const { data, error } = await supabase
      .from('manual_payment_proofs')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) return { data: null, error };

    const { data: campaign } = await supabase
      .from('campaigns')
      .select('ticket_price')
      .eq('id', campaignId)
      .maybeSingle();

    const ticketPrice = Number(campaign?.ticket_price || 0);

    const enriched = await Promise.all((data || []).map(async (p: any) => {
      const { data: tickets } = await supabase
        .from('tickets')
        .select('quota_number,status')
        .eq('campaign_id', campaignId)
        .eq('order_id', p.order_id)
        .order('quota_number');
      const quotas = (tickets || []).map(t => t.quota_number);
      const totalValue = quotas.length * ticketPrice;
      const { data: signed } = await supabase.storage.from('manual-payment-proofs').createSignedUrl(p.image_url, 60 * 60);
      return { ...p, quotas, total_value: totalValue, signed_url: signed?.signedUrl || null };
    }));

    return { data: enriched, error: null };
  },

  async approveProof(proofId: string, orderId: string, campaignId: string) {
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
    } catch {}
    return { error: rpcError };
  }
};

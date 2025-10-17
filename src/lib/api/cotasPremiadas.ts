import { supabase } from '../supabase';
import {
  CotaPremiada,
  CreateCotaPremiadaData,
  UpdateCotaPremiadaData,
  CotaPremiadaStatus,
} from '../../types/cotasPremiadas';

export class CotasPremiadasAPI {
  static async getCotasPremiadasByCampaign(
    campaignId: string,
    statusFilter?: CotaPremiadaStatus
  ): Promise<{ data: CotaPremiada[] | null; error: any }> {
    try {
      let query = supabase
        .from('cotas_premiadas')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('numero_cota', { ascending: true });

      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching cotas premiadas:', error);
        return { data: null, error };
      }

      return { data: data as CotaPremiada[], error: null };
    } catch (error) {
      console.error('Exception fetching cotas premiadas:', error);
      return { data: null, error };
    }
  }

  static async createCotaPremiada(
    data: CreateCotaPremiadaData
  ): Promise<{ data: CotaPremiada | null; error: any }> {
    try {
      const isDuplicate = await this.checkDuplicate(
        data.campaign_id,
        data.numero_cota
      );

      if (isDuplicate) {
        return {
          data: null,
          error: { message: 'Esta cota já está cadastrada como premiada. Escolha outra.' },
        };
      }

      const isValidRange = await this.validateQuotaNumber(
        data.campaign_id,
        data.numero_cota
      );

      if (!isValidRange.valid) {
        return {
          data: null,
          error: { message: isValidRange.message },
        };
      }

      const { data: cotaPremiada, error } = await supabase
        .from('cotas_premiadas')
        .insert({
          campaign_id: data.campaign_id,
          numero_cota: data.numero_cota,
          premio: data.premio,
          status: 'disponivel',
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating cota premiada:', error);
        return { data: null, error };
      }

      return { data: cotaPremiada as CotaPremiada, error: null };
    } catch (error) {
      console.error('Exception creating cota premiada:', error);
      return { data: null, error };
    }
  }

  static async updateCotaPremiada(
    updates: UpdateCotaPremiadaData
  ): Promise<{ data: CotaPremiada | null; error: any }> {
    try {
      const { id, ...updateData } = updates;

      const { data, error } = await supabase
        .from('cotas_premiadas')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating cota premiada:', error);
        return { data: null, error };
      }

      return { data: data as CotaPremiada, error: null };
    } catch (error) {
      console.error('Exception updating cota premiada:', error);
      return { data: null, error };
    }
  }

  static async deleteCotaPremiada(
    id: string,
    campaignId: string
  ): Promise<{ success: boolean; error: any }> {
    try {
      const { error } = await supabase
        .from('cotas_premiadas')
        .delete()
        .eq('id', id)
        .eq('campaign_id', campaignId);

      if (error) {
        console.error('Error deleting cota premiada:', error);
        return { success: false, error };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Exception deleting cota premiada:', error);
      return { success: false, error };
    }
  }

  static async toggleVisibilidade(
    campaignId: string,
    visible: boolean
  ): Promise<{ success: boolean; error: any }> {
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ cotas_premiadas_visiveis: visible })
        .eq('id', campaignId);

      if (error) {
        console.error('Error toggling cotas premiadas visibility:', error);
        return { success: false, error };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Exception toggling visibility:', error);
      return { success: false, error };
    }
  }

  static async checkDuplicate(
    campaignId: string,
    numeroCota: number
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('cotas_premiadas')
        .select('id')
        .eq('campaign_id', campaignId)
        .eq('numero_cota', numeroCota)
        .maybeSingle();

      if (error) {
        console.error('Error checking duplicate:', error);
        return false;
      }

      return data !== null;
    } catch (error) {
      console.error('Exception checking duplicate:', error);
      return false;
    }
  }

  static async validateQuotaNumber(
    campaignId: string,
    numeroCota: number
  ): Promise<{ valid: boolean; message?: string }> {
    try {
      const { data: campaign, error } = await supabase
        .from('campaigns')
        .select('total_tickets, campaign_model')
        .eq('id', campaignId)
        .maybeSingle();

      if (error || !campaign) {
        console.error('Error fetching campaign for validation:', error);
        return { valid: false, message: 'Erro ao validar número da cota.' };
      }

      if (campaign.campaign_model !== 'automatic') {
        return {
          valid: false,
          message: 'Cotas premiadas só podem ser criadas em campanhas no modo automático.',
        };
      }

      if (numeroCota < 0 || numeroCota >= campaign.total_tickets) {
        return {
          valid: false,
          message: `Número da cota deve estar entre 0 e ${campaign.total_tickets - 1}.`,
        };
      }

      return { valid: true };
    } catch (error) {
      console.error('Exception validating quota number:', error);
      return { valid: false, message: 'Erro ao validar número da cota.' };
    }
  }

  static async getCotasPremiadasCount(campaignId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('cotas_premiadas')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaignId);

      if (error) {
        console.error('Error counting cotas premiadas:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Exception counting cotas premiadas:', error);
      return 0;
    }
  }

  static subscribeToCotasPremiadas(
    campaignId: string,
    callback: (payload: any) => void
  ) {
    const channel = supabase
      .channel(`cotas_premiadas_${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cotas_premiadas',
          filter: `campaign_id=eq.${campaignId}`,
        },
        callback
      )
      .subscribe();

    return channel;
  }
}

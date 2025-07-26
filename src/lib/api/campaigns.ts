import { supabase } from '../supabase';
import { CreateCampaignInput, UpdateCampaignInput } from '../validations/campaign';
import { Campaign, CampaignStatus } from '../../types/campaign';

export class CampaignAPI {
  /**
   * Cria uma nova campanha
   */
  static async createCampaign(data: CreateCampaignInput, userId: string): Promise<{ data: Campaign | null; error: any }> {
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days from now
      
      const campaignData = {
        ...data,
        user_id: userId,
        sold_tickets: 0,
        status: 'draft' as CampaignStatus,
        start_date: now.toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
        expires_at: expiresAt.toISOString()
      };

      const { data: campaign, error } = await supabase
        .from('campaigns')
        .insert(campaignData)
        .select()
        .single();

      return { data: campaign, error };
    } catch (error) {
      console.error('Error creating campaign:', error);
      return { data: null, error };
    }
  }

  /**
   * Atualiza uma campanha existente
   */
  static async updateCampaign(data: UpdateCampaignInput): Promise<{ data: Campaign | null; error: any }> {
    try {
      const { id, ...updateData } = data;
      
      console.log('Atualizando campanha com dados:', updateData);
      
      const { data: campaign, error } = await supabase
        .from('campaigns')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      console.log('Resposta do Supabase:', { campaign, error });
      return { data: campaign, error };
    } catch (error) {
      console.error('Error updating campaign:', error);
      return { data: null, error };
    }
  }

  /**
   * Busca campanhas do usuário
   */
  static async getUserCampaigns(userId: string, status?: CampaignStatus): Promise<{ data: Campaign[] | null; error: any }> {
    try {
      // Filter out expired campaigns that should be cleaned up
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
      
      let query = supabase
        .from('campaigns')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        // Exclude expired draft campaigns older than 2 days
        .or(`status.neq.draft,expires_at.is.null,expires_at.gte.${new Date().toISOString()},created_at.gte.${twoDaysAgo}`);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      return { data, error };
    } catch (error) {
      console.error('Error fetching user campaigns:', error);
      return { data: null, error };
    }
  }

  /**
   * Busca uma campanha por ID
   */
  static async getCampaignById(id: string): Promise<{ data: Campaign | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error fetching campaign:', error);
      return { data: null, error };
    }
  }

  /**
   * Deleta uma campanha
   */
  static async deleteCampaign(id: string, userId: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      return { error };
    } catch (error) {
      console.error('Error deleting campaign:', error);
      return { error };
    }
  }

  /**
   * Publica uma campanha (muda status para 'active')
   */
  static async publishCampaign(id: string, userId: string): Promise<{ data: Campaign | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .update({ 
          status: 'active' as CampaignStatus,
          start_date: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error publishing campaign:', error);
      return { data: null, error };
    }
  }

  /**
   * Busca campanhas ativas (públicas)
   */
  static async getActiveCampaigns(limit = 10): Promise<{ data: Campaign[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(limit);

      return { data, error };
    } catch (error) {
      console.error('Error fetching active campaigns:', error);
      return { data: null, error };
    }
  }

  /**
   * Calcula a taxa de publicação baseada na arrecadação estimada
   */
  static calculatePublicationTax(totalTickets: number, ticketPrice: number): number {
    const revenue = totalTickets * ticketPrice;
    
    if (revenue <= 100) return 7.00;
    if (revenue <= 200) return 17.00;
    if (revenue <= 400) return 27.00;
    if (revenue <= 701) return 37.00;
    if (revenue <= 1000) return 47.00;
    if (revenue <= 2000) return 67.00;
    if (revenue <= 4000) return 77.00;
    if (revenue <= 7100) return 127.00;
    if (revenue <= 10000) return 197.00;
    if (revenue <= 20000) return 247.00;
    if (revenue <= 30000) return 497.00;
    if (revenue <= 50000) return 997.00;
    if (revenue <= 70000) return 1497.00;
    if (revenue <= 100000) return 1997.00;
    if (revenue <= 150000) return 2997.00;
    
    return 3997.00;
  }
}
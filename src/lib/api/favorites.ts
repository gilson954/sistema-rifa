import { supabase } from '../supabase';
import { Campaign } from '../../types/campaign';

export interface FavoriteCampaign {
  id: string;
  customer_phone: string;
  campaign_id: string;
  created_at: string;
}

export interface FavoriteCampaignWithDetails extends FavoriteCampaign {
  campaign: Campaign;
}

export const FavoritesAPI = {
  /**
   * Adiciona uma campanha aos favoritos
   */
  async addFavorite(customerPhone: string, campaignId: string): Promise<{ data: FavoriteCampaign | null; error: unknown }> {
    try {
      const { data, error } = await supabase
        .from('favorite_campaigns')
        .insert({
          customer_phone: customerPhone,
          campaign_id: campaignId
        })
        .select()
        .single();

      if (error) {
        // Se for erro de duplicata, retornar sucesso
        if (error.code === '23505') {
          return { data: null, error: null };
        }
        console.error('Error adding favorite:', error);
      }

      return { data, error };
    } catch (error) {
      console.error('Exception adding favorite:', error);
      return { data: null, error };
    }
  },

  /**
   * Remove uma campanha dos favoritos
   */
  async removeFavorite(customerPhone: string, campaignId: string): Promise<{ error: unknown }> {
    try {
      const { error } = await supabase
        .from('favorite_campaigns')
        .delete()
        .eq('customer_phone', customerPhone)
        .eq('campaign_id', campaignId);

      if (error) {
        console.error('Error removing favorite:', error);
      }

      return { error };
    } catch (error) {
      console.error('Exception removing favorite:', error);
      return { error };
    }
  },

  /**
   * Verifica se uma campanha está nos favoritos
   */
  async isFavorite(customerPhone: string, campaignId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('favorite_campaigns')
        .select('id')
        .eq('customer_phone', customerPhone)
        .eq('campaign_id', campaignId)
        .maybeSingle();

      if (error) {
        console.error('Error checking favorite:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Exception checking favorite:', error);
      return false;
    }
  },

  /**
   * Busca todas as campanhas favoritas de um usuário
   */
  async getFavorites(customerPhone: string): Promise<{ data: Campaign[] | null; error: unknown }> {
    try {
      const { data, error } = await supabase
        .from('favorite_campaigns')
        .select(`
          id,
          campaign_id,
          created_at,
          campaigns (
            id,
            title,
            description,
            ticket_price,
            total_tickets,
            sold_tickets,
            status,
            campaign_model,
            draw_date,
            draw_method,
            prize_image_urls,
            prizes,
            promotions,
            public_id,
            user_id,
            created_at,
            updated_at,
            show_percentage,
            show_draw_date,
            min_tickets_per_purchase,
            max_tickets_per_purchase,
            reservation_timeout_minutes
          )
        `)
        .eq('customer_phone', customerPhone)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching favorites:', error);
        return { data: null, error };
      }

      // Extrair apenas os dados da campanha
      type FavoriteRow = { campaigns: Campaign | null };
      const campaigns = (data as FavoriteRow[] | null)
        ?.map((item) => item.campaigns)
        .filter((campaign): campaign is Campaign => campaign !== null) as Campaign[];

      return { data: campaigns || [], error: null };
    } catch (error) {
      console.error('Exception fetching favorites:', error);
      return { data: null, error };
    }
  },

  /**
   * Toggle favorite status (adiciona se não existir, remove se existir)
   */
  async toggleFavorite(customerPhone: string, campaignId: string): Promise<{ isFavorite: boolean; error: unknown }> {
    try {
      const isFav = await this.isFavorite(customerPhone, campaignId);

      if (isFav) {
        const { error } = await this.removeFavorite(customerPhone, campaignId);
        return { isFavorite: false, error };
      } else {
        const { error } = await this.addFavorite(customerPhone, campaignId);
        return { isFavorite: true, error };
      }
    } catch (error) {
      console.error('Exception toggling favorite:', error);
      return { isFavorite: false, error };
    }
  },

  /**
   * Conta quantas campanhas favoritas um usuário tem
   */
  async getFavoritesCount(customerPhone: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('favorite_campaigns')
        .select('*', { count: 'exact', head: true })
        .eq('customer_phone', customerPhone);

      if (error) {
        console.error('Error counting favorites:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Exception counting favorites:', error);
      return 0;
    }
  }
};

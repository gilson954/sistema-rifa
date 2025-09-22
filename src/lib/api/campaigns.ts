import { supabase } from '../supabase';
import { CreateCampaignInput, UpdateCampaignInput, createCampaignSchema, updateCampaignSchema } from '../validations/campaign';
import { Campaign, CampaignStatus } from '../../types/campaign';
import { generateUniqueSlug } from '../../utils/slugGenerator';
import { ZodError } from 'zod';
import { STRIPE_PRODUCTS, getPublicationProductByRevenue } from '../../stripe-config';

export class CampaignAPI {
  /**
   * Cria uma nova campanha
   */
  static async createCampaign(data: CreateCampaignInput, userId: string): Promise<{ data: Campaign | null; error: any }> {
    try {
      // Validate input data against schema before processing
      try {
        createCampaignSchema.parse(data);
      } catch (validationError) {
        if (validationError instanceof ZodError) {
          const errorMessage = (validationError.errors || []).map(err => err.message).join(', ');
          console.error('❌ [API VALIDATION] Campaign creation validation failed:', errorMessage);
          return { 
            data: null, 
            error: { 
              message: errorMessage,
              code: 'VALIDATION_ERROR',
              details: validationError.errors || []
            }
          };
        }
        throw validationError;
      }

      // Gera slug único para a campanha
      const slug = await generateUniqueSlug(data.title);
      
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days from now
      
      const campaignData = {
        ...data,
        user_id: userId,
        slug,
        sold_tickets: 0,
        status: 'draft' as CampaignStatus,
        is_paid: false,
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
      // Validate input data against schema before processing
      try {
        console.log('🔧 [API DEBUG] Data being validated:', JSON.stringify(data, null, 2));
        updateCampaignSchema.parse(data);
      } catch (validationError) {
        if (validationError instanceof ZodError) {
          const errorMessage = (validationError.errors || []).map(err => `${err.path.join('.')}: ${err.message}`).join(', ') || 'Erro de validação nos dados da campanha - nenhum erro específico reportado pelo Zod';
          console.error('❌ [API VALIDATION] Campaign update validation failed:', errorMessage);
          console.error('❌ [API VALIDATION] Full validation errors:', validationError.errors);
          return { 
            data: null, 
            error: { 
              message: errorMessage,
              code: 'VALIDATION_ERROR',
              details: validationError.errors || []
            }
          };
        }
        throw validationError;
      }

      const { id, ...updateData } = data;
      
      // Se o título foi alterado, regenera o slug
      if (updateData.title) {
        const newSlug = await generateUniqueSlug(updateData.title, id);
        updateData.slug = newSlug;
      }
      
      // DEBUG: Log reservation timeout value received by API
      console.log('🔧 [API DEBUG] Received reservation_timeout_minutes:', updateData.reservation_timeout_minutes);
      console.log('🔧 [API DEBUG] Full updateData received:', updateData);
      
      console.log('🔧 [API DEBUG] Updating campaign with data:', updateData);
      
      const { data: campaign, error } = await supabase
        .from('campaigns')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ [API DEBUG] Update error:', error);
      } else {
        console.log('✅ [API DEBUG] Campaign updated successfully:', campaign);
      }

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
        .eq('id', id);

      if (error) {
        return { data: null, error };
      }

      // Return the first campaign if found, otherwise null
      const campaign = data && data.length > 0 ? data[0] : null;
      return { data: campaign, error: null };
    } catch (error) {
      console.error('Error fetching campaign:', error);
      return { data: null, error };
    }
  }

  /**
   * Busca uma campanha pelo public_id
   */
  static async getCampaignByPublicId(publicId: string): Promise<{ data: Campaign | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('public_id', publicId);

      if (error) {
        return { data: null, error };
      }

      // Return the first campaign if found, otherwise null
      const campaign = data && data.length > 0 ? data[0] : null;
      return { data: campaign, error: null };
    } catch (error) {
      console.error('Error fetching campaign by public_id:', error);
      return { data: null, error };
    }
  }

  /**
   * Busca uma campanha por domínio personalizado
   */
  static async getCampaignByCustomDomain(domain: string): Promise<{ data: Campaign | null; error: any }> {
    try {
      // Primeiro busca o domínio personalizado
      const { data: customDomainData, error: domainError } = await supabase
        .from('custom_domains')
        .select('campaign_id')
        .eq('domain_name', domain)
        .eq('is_verified', true);

      if (domainError) {
        return { data: null, error: domainError };
      }

      const customDomain = customDomainData && customDomainData.length > 0 ? customDomainData[0] : null;
      if (!customDomain) {
        return { data: null, error: domainError || new Error('Domínio personalizado não encontrado') };
      }

      // Depois busca a campanha associada
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', customDomain.campaign_id);

      if (campaignError) {
        return { data: null, error: campaignError };
      }

      const campaign = campaignData && campaignData.length > 0 ? campaignData[0] : null;
      return { data: campaign, error: null };
    } catch (error) {
      console.error('Error fetching campaign by custom domain:', error);
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
   * Retorna a taxa de publicação fixa do produto Rifaqui
   */
  static getPublicationTax(estimatedRevenue: number): StripeProduct | undefined {
    // Returns the StripeProduct object for the publication fee based on estimated revenue
    return getPublicationProductByRevenue(estimatedRevenue);
  }
}
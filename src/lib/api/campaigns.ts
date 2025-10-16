// src/lib/api/campaigns.ts
import { supabase } from '../supabase';
import { CreateCampaignInput, UpdateCampaignInput, createCampaignSchema, updateCampaignSchema } from '../validations/campaign';
import { Campaign, CampaignStatus } from '../../types/campaign';
import { generateUniqueSlugAndPublicId } from '../../utils/slugGenerator';
import { ZodError } from 'zod';
import { STRIPE_PRODUCTS, getPublicationProductByRevenue } from '../../stripe-config';
import { translateAuthError } from '../../utils/errorTranslators'; // ✅ Importado

export class CampaignAPI {
  /**
   * Cria uma nova campanha
   */
  static async createCampaign(data: CreateCampaignInput, userId: string): Promise<{ data: Campaign | null; error: any }> {
    try {
      try {
        createCampaignSchema.parse(data);
      } catch (validationError) {
        if (validationError instanceof ZodError) {
          const errorMessage = (validationError.issues || []).map(err => err.message).join(', ');
          console.error('❌ [API VALIDATION] Campaign creation validation failed:', errorMessage);
          return { 
            data: null, 
            error: { 
              message: errorMessage,
              code: 'VALIDATION_ERROR',
              details: validationError.issues || []
            }
          };
        }
        throw validationError;
      }

      const { slug, publicId } = await generateUniqueSlugAndPublicId(data.title);
      const now = new Date();
      console.log('Generated publicId:', publicId);
      const expiresAt = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

      const campaignData = {
        ...data,
        user_id: userId,
        slug,
        public_id: publicId,
        sold_tickets: 0,
        status: 'draft' as CampaignStatus,
        is_paid: false,
        start_date: now.toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
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
      try {
        console.log('🔧 [API DEBUG] Data being validated:', JSON.stringify(data, null, 2));
        updateCampaignSchema.parse(data);
      } catch (validationError) {
        if (validationError instanceof ZodError) {
          const errorMessage = (validationError.issues || []).map(err => `${err.path.join('.')}: ${err.message}`).join(', ') || 'Erro de validação nos dados da campanha - nenhum erro específico reportado pelo Zod';
          console.error('❌ [API VALIDATION] Campaign update validation failed:', errorMessage);
          console.error('❌ [API VALIDATION] Full validation errors:', validationError.issues);
          return { 
            data: null, 
            error: { 
              message: errorMessage,
              code: 'VALIDATION_ERROR',
              details: validationError.issues || []
            }
          };
        }
        throw validationError;
      }

      const { id, ...updateData } = data;
      if (updateData.title) {
        const { slug: newSlug } = await generateUniqueSlugAndPublicId(updateData.title, id);
        updateData.slug = newSlug;
      }

      console.log('🔧 [API DEBUG] Updating campaign with data:', updateData);
      const { data: campaign, error } = await supabase
        .from('campaigns')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) console.error('❌ [API DEBUG] Update error:', error);
      else console.log('✅ [API DEBUG] Campaign updated successfully:', campaign);

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
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
      let query = supabase
        .from('campaigns')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .or(`status.neq.draft,expires_at.is.null,expires_at.gte.${new Date().toISOString()},created_at.gte.${twoDaysAgo}`);

      if (status) query = query.eq('status', status);

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
      console.log('Fetching campaign by ID:', id);
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id);

      if (error) {
        console.error('Error fetching campaign by ID:', error);
        return { data: null, error };
      }

      const campaign = data && data.length > 0 ? data[0] : null;
      if (!campaign) {
        return { data: null, error: new Error(translateAuthError('Campaign not found')) }; // ✅ traduzido
      }
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
      console.log('Fetching campaign by public_id:', publicId);
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('public_id', publicId);

      if (error) {
        console.error('Error fetching campaign by public_id:', error);
        return { data: null, error };
      }

      const campaign = data && data.length > 0 ? data[0] : null;
      if (!campaign) {
        return { data: null, error: new Error(translateAuthError('Campaign not found')) }; // ✅ traduzido
      }
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
        return { data: null, error: domainError || new Error(translateAuthError('Domínio personalizado não encontrado')) }; // ✅ traduzido
      }

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
   * Publica uma campanha
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
   * Busca campanhas ativas
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
    return getPublicationProductByRevenue(estimatedRevenue);
  }

  /**
   * Busca a campanha em destaque de um organizador
   */
  static async getFeaturedCampaign(userId: string): Promise<{ data: Campaign | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('user_id', userId)
        .eq('is_featured', true)
        .in('status', ['active', 'completed'])
        .maybeSingle();

      return { data, error };
    } catch (error) {
      console.error('Error fetching featured campaign:', error);
      return { data: null, error };
    }
  }

  /**
   * Busca todas as campanhas ativas e concluídas de um organizador (exceto a em destaque)
   */
  static async getOrganizerPublicCampaigns(userId: string, excludeFeatured = true): Promise<{ data: Campaign[] | null; error: any }> {
    try {
      let query = supabase
        .from('campaigns')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['active', 'completed'])
        .eq('is_paid', true)
        .order('created_at', { ascending: false });

      if (excludeFeatured) {
        query = query.eq('is_featured', false);
      }

      const { data, error } = await query;
      return { data, error };
    } catch (error) {
      console.error('Error fetching organizer public campaigns:', error);
      return { data: null, error };
    }
  }

  /**
   * Alterna o status de destaque de uma campanha
   */
  static async toggleFeaturedCampaign(campaignId: string, userId: string, isFeatured: boolean): Promise<{ data: Campaign | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .update({ is_featured: isFeatured })
        .eq('id', campaignId)
        .eq('user_id', userId)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error toggling featured campaign:', error);
      return { data: null, error };
    }
  }
}

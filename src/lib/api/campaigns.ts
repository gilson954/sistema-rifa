import { supabase } from '../supabase';
import { Campaign } from '../../types/campaign';

export interface CampaignFilters {
  status?: 'draft' | 'active' | 'completed' | 'cancelled';
  userId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export class CampaignAPI {
  static async getCampaigns(filters: CampaignFilters = {}) {
    let query = supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }

    if (filters.search) {
      query = query.ilike('title', `%${filters.search}%`);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch campaigns: ${error.message}`);
    }

    return data as Campaign[];
  }

  static async getCampaignById(id: string) {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch campaign: ${error.message}`);
    }

    return data as Campaign;
  }

  static async getCampaignByPublicId(publicId: string) {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('public_id', publicId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch campaign: ${error.message}`);
    }

    return data as Campaign;
  }

  static async getCampaignBySlug(slug: string) {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      throw new Error(`Failed to fetch campaign: ${error.message}`);
    }

    return data as Campaign;
  }

  static async createCampaign(campaign: Partial<Campaign>) {
    const { data, error } = await supabase
      .from('campaigns')
      .insert([campaign])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create campaign: ${error.message}`);
    }

    return data as Campaign;
  }

  static async updateCampaign(id: string, updates: Partial<Campaign>) {
    const { data, error } = await supabase
      .from('campaigns')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update campaign: ${error.message}`);
    }

    return data as Campaign;
  }

  static async deleteCampaign(id: string) {
    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete campaign: ${error.message}`);
    }

    return true;
  }

  static async getActiveCampaigns() {
    return this.getCampaigns({ status: 'active' });
  }

  static async getUserCampaigns(userId: string) {
    return this.getCampaigns({ userId });
  }
}

export default CampaignAPI;
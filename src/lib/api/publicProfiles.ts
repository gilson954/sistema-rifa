import { supabase } from '../supabase';

export interface PublicProfile {
  id: string;
  avatar_url: string | null;
  primary_color: string | null;
  theme: string | null;
  logo_url: string | null;
  social_media_links: any | null;
  payment_integrations_config: any | null;
  color_mode: string | null;
  gradient_classes: string | null;
  custom_gradient_colors: string | null;
}

export class PublicProfilesAPI {
  /**
   * Get public profile data for campaign customization
   * Uses the public_profiles_view which only exposes safe columns
   */
  static async getPublicProfile(userId: string): Promise<{ data: PublicProfile | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('public_profiles_view')
        .select('*')
        .eq('id', userId)
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error fetching public profile:', error);
      return { data: null, error };
    }
  }

  /**
   * Get multiple public profiles by user IDs
   */
  static async getPublicProfiles(userIds: string[]): Promise<{ data: PublicProfile[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('public_profiles_view')
        .select('*')
        .in('id', userIds);

      return { data, error };
    } catch (error) {
      console.error('Error fetching public profiles:', error);
      return { data: null, error };
    }
  }

  /**
   * Check if a user has customization settings configured
   */
  static async hasCustomization(userId: string): Promise<boolean> {
    try {
      const { data, error } = await this.getPublicProfile(userId);
      
      if (error || !data) {
        return false;
      }

      // Check if user has any customization settings
      return !!(
        data.primary_color ||
        data.theme !== 'claro' ||
        data.logo_url ||
        data.social_media_links ||
        data.color_mode ||
        data.gradient_classes ||
        data.custom_gradient_colors
      );
    } catch (error) {
      console.error('Error checking customization:', error);
      return false;
    }
  }
}
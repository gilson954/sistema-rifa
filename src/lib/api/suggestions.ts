import { supabase } from '../supabase';
import { translateAuthError } from '../../utils/errorTranslators';

export interface Suggestion {
  id: string;
  user_id: string | null;
  user_name: string;
  user_email: string;
  subject: string;
  type: 'bug_report' | 'feature_request' | 'improvement' | 'other';
  priority: 'low' | 'medium' | 'high';
  message: string;
  status: 'new' | 'in_progress' | 'resolved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface CreateSuggestionInput {
  user_name: string;
  user_email: string;
  subject: string;
  type: 'bug_report' | 'feature_request' | 'improvement' | 'other';
  priority: 'low' | 'medium' | 'high';
  message: string;
}

export interface UpdateSuggestionInput {
  id: string;
  status?: 'new' | 'in_progress' | 'resolved' | 'rejected';
}

export class SuggestionsAPI {
  /**
   * Cria uma nova sugestão
   */
  static async createSuggestion(
    data: CreateSuggestionInput,
    userId?: string
  ): Promise<{ data: Suggestion | null; error: any }> {
    try {
      const suggestionData = {
        ...data,
        user_id: userId || null,
        status: 'new' as const
      };

      const { data: suggestion, error } = await supabase
        .from('suggestions')
        .insert(suggestionData)
        .select()
        .single();

      if (error) {
        throw new Error(translateAuthError(error.message));
      }

      return { data: suggestion, error: null };
    } catch (error) {
      console.error('Error creating suggestion:', error);
      return { data: null, error };
    }
  }

  /**
   * Busca sugestões do usuário atual
   */
  static async getUserSuggestions(userId: string): Promise<{ data: Suggestion[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('suggestions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(translateAuthError(error.message));
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching user suggestions:', error);
      return { data: null, error };
    }
  }

  /**
   * Busca todas as sugestões (apenas para administradores)
   */
  static async getAllSuggestions(): Promise<{ data: Suggestion[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('suggestions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(translateAuthError(error.message));
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching all suggestions:', error);
      return { data: null, error };
    }
  }

  /**
   * Atualiza o status de uma sugestão (apenas para administradores)
   */
  static async updateSuggestionStatus(
    data: UpdateSuggestionInput
  ): Promise<{ data: Suggestion | null; error: any }> {
    try {
      const { id, ...updateData } = data;

      const { data: suggestion, error } = await supabase
        .from('suggestions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(translateAuthError(error.message));
      }

      return { data: suggestion, error: null };
    } catch (error) {
      console.error('Error updating suggestion:', error);
      return { data: null, error };
    }
  }

  /**
   * Deleta uma sugestão (apenas para administradores)
   */
  static async deleteSuggestion(id: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('suggestions')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(translateAuthError(error.message));
      }

      return { error: null };
    } catch (error) {
      console.error('Error deleting suggestion:', error);
      return { error };
    }
  }

  /**
   * Busca estatísticas das sugestões (para dashboard admin)
   */
  static async getSuggestionsStats(): Promise<{ 
    data: { 
      total: number; 
      new: number; 
      in_progress: number; 
      resolved: number; 
      rejected: number; 
    } | null; 
    error: any 
  }> {
    try {
      const { data, error } = await supabase
        .from('suggestions')
        .select('status');

      if (error) {
        throw new Error(translateAuthError(error.message));
      }

      const stats = {
        total: data?.length || 0,
        new: data?.filter(s => s.status === 'new').length || 0,
        in_progress: data?.filter(s => s.status === 'in_progress').length || 0,
        resolved: data?.filter(s => s.status === 'resolved').length || 0,
        rejected: data?.filter(s => s.status === 'rejected').length || 0,
      };

      return { data: stats, error: null };
    } catch (error) {
      console.error('Error fetching suggestions stats:', error);
      return { data: null, error };
    }
  }
}
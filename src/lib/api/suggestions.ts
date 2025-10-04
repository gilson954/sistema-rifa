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
  attachment_url: string | null;
  attachment_name: string | null;
  attachment_size: number | null;
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
  attachment?: File | null;
}

export interface UpdateSuggestionInput {
  id: string;
  status?: 'new' | 'in_progress' | 'resolved' | 'rejected';
}

export class SuggestionsAPI {
  /**
   * Valida o arquivo de anexo
   */
  static validateAttachment(file: File): { valid: boolean; error?: string } {
    const MAX_SIZE = 10 * 1024 * 1024;
    const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'application/pdf'];

    if (file.size > MAX_SIZE) {
      return { valid: false, error: 'O arquivo deve ter no máximo 10MB' };
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return { valid: false, error: 'Tipo de arquivo não permitido. Use PNG, JPG, GIF ou PDF' };
    }

    return { valid: true };
  }

  /**
   * Faz upload do arquivo para o Supabase Storage
   */
  static async uploadAttachment(
    file: File,
    userId: string,
    suggestionId: string
  ): Promise<{ url: string | null; error: any }> {
    try {
      const validation = this.validateAttachment(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${userId}/${suggestionId}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('suggestion-attachments')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw error;
      }

      const { data: publicUrlData } = supabase.storage
        .from('suggestion-attachments')
        .getPublicUrl(filePath);

      return { url: publicUrlData.publicUrl, error: null };
    } catch (error) {
      console.error('Error uploading attachment:', error);
      return { url: null, error };
    }
  }

  /**
   * Remove um arquivo do Supabase Storage
   */
  static async deleteAttachment(attachmentUrl: string): Promise<{ error: any }> {
    try {
      const url = new URL(attachmentUrl);
      const pathParts = url.pathname.split('/suggestion-attachments/');
      if (pathParts.length < 2) {
        throw new Error('URL de anexo inválida');
      }

      const filePath = pathParts[1];

      const { error } = await supabase.storage
        .from('suggestion-attachments')
        .remove([filePath]);

      if (error) {
        throw error;
      }

      return { error: null };
    } catch (error) {
      console.error('Error deleting attachment:', error);
      return { error };
    }
  }

  /**
   * Cria uma nova sugestão
   */
  static async createSuggestion(
    data: CreateSuggestionInput,
    userId?: string
  ): Promise<{ data: Suggestion | null; error: any }> {
    try {
      const { attachment, ...suggestionInput } = data;

      const suggestionData: any = {
        ...suggestionInput,
        user_id: userId || null,
        status: 'new' as const
      };

      const { data: suggestion, error: insertError } = await supabase
        .from('suggestions')
        .insert(suggestionData)
        .select()
        .single();

      if (insertError) {
        throw new Error(translateAuthError(insertError.message));
      }

      if (attachment && userId && suggestion) {
        const { url, error: uploadError } = await this.uploadAttachment(
          attachment,
          userId,
          suggestion.id
        );

        if (uploadError) {
          await supabase.from('suggestions').delete().eq('id', suggestion.id);
          throw new Error('Erro ao fazer upload do arquivo. Sugestão cancelada.');
        }

        const { data: updatedSuggestion, error: updateError } = await supabase
          .from('suggestions')
          .update({
            attachment_url: url,
            attachment_name: attachment.name,
            attachment_size: attachment.size
          })
          .eq('id', suggestion.id)
          .select()
          .single();

        if (updateError) {
          await this.deleteAttachment(url!);
          await supabase.from('suggestions').delete().eq('id', suggestion.id);
          throw new Error(translateAuthError(updateError.message));
        }

        return { data: updatedSuggestion, error: null };
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
      const { data: suggestion } = await supabase
        .from('suggestions')
        .select('attachment_url')
        .eq('id', id)
        .maybeSingle();

      if (suggestion?.attachment_url) {
        await this.deleteAttachment(suggestion.attachment_url);
      }

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
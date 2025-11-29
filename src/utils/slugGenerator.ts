import { supabase } from '../lib/supabase';
import { translateAuthError } from './errorTranslators'; // ✅ Importe a função

/**
 * Gera um slug base a partir de uma string (título da campanha)
 * Remove acentos, caracteres especiais e converte para formato URL-friendly
 */
function generateBaseSlug(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  let slug = text.toString().toLowerCase().trim();

  // Remove acentos e diacríticos
  slug = slug.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Remove caracteres especiais, mantém apenas letras, números, espaços e hífens
  slug = slug.replace(/[^a-z0-9\s-]/g, '');

  // Substitui múltiplos espaços por um único espaço
  slug = slug.replace(/\s+/g, ' ');

  // Substitui espaços por hífens
  slug = slug.replace(/\s/g, '-');

  // Remove múltiplos hífens consecutivos
  slug = slug.replace(/-+/g, '-');

  // Remove hífens do início e fim
  slug = slug.replace(/^-+|-+$/g, '');

  // Limita o tamanho do slug para evitar URLs muito longas
  if (slug.length > 50) {
    slug = slug.substring(0, 50).replace(/-[^-]*$/, ''); // Remove palavra parcial no final
  }

  // Adiciona um sufixo aleatório curto para reduzir colisões
  const randomSuffix = Math.random().toString(36).substring(2, 10); // 8 caracteres aleatórios
  const baseSlug = slug || 'campanha';
  
  return `${baseSlug}-${randomSuffix}`;
}

/**
 * Verifica se um slug já existe no banco de dados
 */
async function slugExists(slug: string, excludeCampaignId?: string): Promise<boolean> {
  try {
    let query = supabase
      .from('campaigns')
      .select('id')
      .eq('slug', slug)
      .limit(1);

    if (excludeCampaignId) {
      query = query.neq('id', excludeCampaignId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao verificar existência do slug:', error);
      // ✅ Traduza a mensagem de erro
      throw new Error(translateAuthError('Falha ao verificar unicidade do slug'));
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('Erro na verificação de slug:', error);
    throw error;
  }
}

/**
 * Gera um slug único para uma campanha
 * Se o slug base já existir, adiciona um contador até encontrar um único
 */
export async function generateUniqueSlug(
  title: string, 
  excludeCampaignId?: string
): Promise<string> {
  const baseSlug = generateBaseSlug(title);
  
  if (!baseSlug) {
    // ✅ Traduza a mensagem de erro
    throw new Error(translateAuthError('Não foi possível gerar um slug válido a partir do título'));
  }

  let uniqueSlug = baseSlug;
  let counter = 0;
  const maxAttempts = 10;
  let delay = 50;

  while (counter < maxAttempts) {
    try {
      const exists = await slugExists(uniqueSlug, excludeCampaignId);
      
      if (!exists) {
        return uniqueSlug;
      }

      counter++;
      uniqueSlug = `${baseSlug}-${counter}`;
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    } catch (error) {
      console.warn(`Attempt ${counter + 1} to generate unique slug failed:`, error);
      counter++;
      uniqueSlug = `${baseSlug}-${counter}`;
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }

  // ✅ Traduza a mensagem de erro
  throw new Error(translateAuthError('Não foi possível gerar um slug único após múltiplas tentativas'));
}

/**
 * Gera um ID público curto e único (11 caracteres)
 */
function generateShortUniquePublicId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 11; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Verifica se um public_id já existe no banco de dados
 */
async function publicIdExists(publicId: string, excludeCampaignId?: string): Promise<boolean> {
  try {
    let query = supabase
      .from('campaigns')
      .select('id')
      .eq('public_id', publicId)
      .limit(1);

    if (excludeCampaignId) {
      query = query.neq('id', excludeCampaignId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao verificar existência do public_id:', error);
      // ✅ Traduza a mensagem de erro
      throw new Error(translateAuthError('Falha ao verificar unicidade do public_id'));
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('Erro na verificação de public_id:', error);
    throw error;
  }
}

/**
 * Gera um public_id único para uma campanha
 */
async function generateUniquePublicId(excludeCampaignId?: string): Promise<string> {
  let uniquePublicId = generateShortUniquePublicId();
  let counter = 0;
  const maxAttempts = 10;
  let delay = 50;

  while (counter < maxAttempts) {
    try {
      const exists = await publicIdExists(uniquePublicId, excludeCampaignId);
      
      if (!exists) {
        return uniquePublicId;
      }

      counter++;
      uniquePublicId = generateShortUniquePublicId();
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    } catch (error) {
      console.warn(`Attempt ${counter + 1} to generate unique public_id failed:`, error);
      counter++;
      uniquePublicId = generateShortUniquePublicId();
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }

  // ✅ Traduza a mensagem de erro
  throw new Error(translateAuthError('Não foi possível gerar um public_id único após múltiplas tentativas'));
}

/**
 * Gera tanto um slug único quanto um public_id único para uma campanha
 */
export async function generateUniqueSlugAndPublicId(
  title: string, 
  excludeCampaignId?: string
): Promise<{ slug: string; publicId: string }> {
  const [slug, publicId] = await Promise.all([
    generateUniqueSlug(title, excludeCampaignId),
    generateUniquePublicId(excludeCampaignId)
  ]);

  return { slug, publicId };
}

 

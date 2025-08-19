import { supabase } from '../lib/supabase';

/**
 * Gera um slug base a partir de uma string (título da campanha)
 * Remove acentos, caracteres especiais e converte para formato URL-friendly
 */
export function generateBaseSlug(text: string): string {
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

  return slug || 'campanha'; // Fallback se o slug ficar vazio
}

/**
 * Verifica se um slug já existe no banco de dados
 */
export async function slugExists(slug: string, excludeCampaignId?: string): Promise<boolean> {
  try {
    let query = supabase
      .from('campaigns')
      .select('id')
      .eq('slug', slug)
      .limit(1);

    // Se estamos atualizando uma campanha existente, excluí-la da verificação
    if (excludeCampaignId) {
      query = query.neq('id', excludeCampaignId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao verificar existência do slug:', error);
      throw new Error('Falha ao verificar unicidade do slug');
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('Erro na verificação de slug:', error);
    throw error;
  }
}

/**
 * Gera um slug único para uma campanha
 * Se o slug base já existir, adiciona um sufixo aleatório para evitar múltiplas consultas
 */
export async function generateUniqueSlug(
  title: string, 
  excludeCampaignId?: string
): Promise<string> {
  const baseSlug = generateBaseSlug(title);
  
  if (!baseSlug) {
    throw new Error('Não foi possível gerar um slug válido a partir do título');
  }

  // Verifica se o slug base está disponível
  const baseExists = await slugExists(baseSlug, excludeCampaignId);
  if (!baseExists) {
    return baseSlug;
  }

  // Se o slug base existe, gera imediatamente um slug com sufixo aleatório
  // Isso evita múltiplas consultas ao banco e reduz o risco de timeout
  try {
    // Gera um sufixo único combinando timestamp e caracteres aleatórios
    const timestamp = Date.now().toString().slice(-6);
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const uniqueSlug = `${baseSlug}-${timestamp}${randomSuffix}`;
    
    // Verifica se este slug único está disponível
    const uniqueExists = await slugExists(uniqueSlug, excludeCampaignId);
    if (!uniqueExists) {
      return uniqueSlug;
    }

    // Fallback final com sufixo ainda mais único (muito improvável de ser necessário)
    const finalSuffix = Math.random().toString(36).substring(2, 10);
    return `${baseSlug}-${Date.now()}-${finalSuffix}`;

  } catch (error) {
    console.error('Erro na geração de slug único:', error);
    // Fallback em caso de erro: usa timestamp + sufixo aleatório
    const timestamp = Date.now().toString().slice(-8);
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `${baseSlug}-${timestamp}-${randomSuffix}`;
  }
}

/**
 * Valida se um slug tem formato válido
 */
export function isValidSlug(slug: string): boolean {
  if (!slug || typeof slug !== 'string') {
    return false;
  }

  // Slug deve ter entre 3 e 50 caracteres
  if (slug.length < 3 || slug.length > 50) {
    return false;
  }

  // Deve conter apenas letras minúsculas, números e hífens
  const slugRegex = /^[a-z0-9-]+$/;
  if (!slugRegex.test(slug)) {
    return false;
  }

  // Não deve começar ou terminar com hífen
  if (slug.startsWith('-') || slug.endsWith('-')) {
    return false;
  }

  // Não deve ter hífens consecutivos
  if (slug.includes('--')) {
    return false;
  }

  return true;
}

/**
 * Sanitiza um slug fornecido pelo usuário
 */
export function sanitizeSlug(slug: string): string {
  if (!slug || typeof slug !== 'string') {
    return '';
  }

  return generateBaseSlug(slug);
}
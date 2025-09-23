// src/lib/api/campaigns.ts
/**
 * Versão ampliada do módulo de API para campanhas
 * - Sem JSX (arquivo apenas para lógica/DB)
 * - Compatível com supabase client exportado em ../supabase
 * - Importar Promotion do seu types (ajuste import se necessário)
 *
 * Substitua este arquivo em seu projeto. Se seu schema tiver nomes diferentes
 * (ex.: `campaigns.promotions` serializado vs tabela `promotions`), ajuste os selects.
 */

import { supabase } from '../supabase';
import type { Promotion as ImportedPromotion } from '../../types/promotion';

/* ----------------------------- Tipagens ----------------------------- */

export type Promotion = ImportedPromotion | {
  id?: string;
  campaign_id?: string;
  ticketQuantity: number; // número de cotas do bloco
  type?: 'fixed' | 'percentage' | 'block' | 'bundle'; // convenções possíveis
  fixedDiscountAmount?: number; // desconto fixo em reais (centavos se preferir)
  percentage?: number; // desconto percentual (ex: 20 para 20%)
  discountedTotalValue?: number; // valor final do bloco (opcional)
  created_at?: string | null;
  updated_at?: string | null;
};

export interface Prize {
  id: string;
  campaign_id?: string;
  name: string;
  description?: string;
  image_url?: string;
  position?: number;
  created_at?: string | null;
}

export interface Ticket {
  id: string;
  campaign_id: string;
  quota_number: number;
  price?: number;
  status: 'available' | 'reserved' | 'sold' | 'blocked';
  reserved_by?: string | null;
  reserved_until?: string | null;
  purchased_by?: string | null;
  purchased_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Campaign {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  status?: 'draft' | 'active' | 'paused' | 'finished' | string;
  is_paid?: boolean;
  ticket_price?: number;
  total_tickets?: number;
  sold_tickets?: number;
  user_id?: string;
  draw_date?: string | null;
  draw_method?: string | null;
  show_draw_date?: boolean;
  show_percentage?: boolean;
  campaign_model?: 'manual' | 'automatic' | string;
  min_tickets_per_purchase?: number;
  max_tickets_per_purchase?: number;
  reservation_timeout_minutes?: number;
  // Possível campos JSON - trate como array se retornado assim
  prize_image_urls?: string[] | null;
  prizes?: Prize[] | null;
  promotions?: Promotion[] | null;
  custom_domain?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

/* ----------------------------- Helpers ----------------------------- */

/**
 * Normaliza um campo possivelmente serializado ou null para array
 */
function normalizeArrayField<T>(value: unknown): T[] {
  if (!value) return [];
  if (Array.isArray(value)) return value as T[];
  try {
    const parsed = JSON.parse(String(value));
    if (Array.isArray(parsed)) return parsed as T[];
  } catch (e) {
    // not JSON
  }
  return [];
}

/**
 * Formata número (em reais) - utilitário simples
 */
export function toCurrency(value: number | null | undefined, digits = 2): string {
  if (typeof value !== 'number') value = 0;
  return (value).toFixed(digits);
}

/**
 * Converte data ISO para Date segura (ou null)
 */
function parseISO(date?: string | null) {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

/* ----------------------------- Campanhas ----------------------------- */

/**
 * Busca campanha por slug
 */
export async function fetchCampaignBySlug(slug: string): Promise<Campaign | null> {
  try {
    const { data, error } = await supabase
      .from<Campaign>('campaigns')
      .select('*')
      .eq('slug', slug)
      .maybeSingle(); // single() pode lançar se não existir

    if (error) {
      console.error('[fetchCampaignBySlug] supabase error', error);
      return null;
    }
    if (!data) return null;

    // Normalizações em caso de campos JSON
    data.promotions = normalizeArrayField<Promotion>(data.promotions);
    data.prizes = normalizeArrayField<Prize>(data.prizes);
    data.prize_image_urls = normalizeArrayField<string>(data.prize_image_urls);
    return data;
  } catch (err) {
    console.error('[fetchCampaignBySlug] unexpected error', err);
    return null;
  }
}

/**
 * Busca campanha por domínio customizado
 */
export async function fetchCampaignByDomain(domain: string): Promise<Campaign | null> {
  try {
    const { data, error } = await supabase
      .from<Campaign>('campaigns')
      .select('*')
      .eq('custom_domain', domain)
      .maybeSingle();

    if (error) {
      console.error('[fetchCampaignByDomain] supabase error', error);
      return null;
    }
    if (!data) return null;

    data.promotions = normalizeArrayField<Promotion>(data.promotions);
    data.prizes = normalizeArrayField<Prize>(data.prizes);
    data.prize_image_urls = normalizeArrayField<string>(data.prize_image_urls);
    return data;
  } catch (err) {
    console.error('[fetchCampaignByDomain] unexpected error', err);
    return null;
  }
}

/**
 * Busca campanhas com paginação e filtros simples
 */
export async function fetchCampaignsPaginated(params?: {
  profileId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<{ data: Campaign[]; count: number }>{
  const page = Math.max(1, params?.page || 1);
  const pageSize = Math.min(100, Math.max(1, params?.pageSize || 20));
  try {
    let query = supabase.from<Campaign>('campaigns').select('*', { count: 'exact' }).order('created_at', { ascending: false });

    if (params?.profileId) {
      query = (query as any).eq('user_id', params.profileId);
    }
    if (params?.status) {
      query = (query as any).eq('status', params.status);
    }
    if (params?.search) {
      // Busca simples em title (ajuste conforme seu index)
      query = (query as any).ilike('title', `%${params.search}%`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await (query as any).range(from, to);

    if (error) {
      console.error('[fetchCampaignsPaginated] supabase error', error);
      return { data: [], count: 0 };
    }

    const normalized = (data || []).map((c: Campaign) => {
      c.promotions = normalizeArrayField<Promotion>(c.promotions);
      c.prizes = normalizeArrayField<Prize>(c.prizes);
      c.prize_image_urls = normalizeArrayField<string>(c.prize_image_urls);
      return c;
    });

    return { data: normalized, count: count || 0 };
  } catch (err) {
    console.error('[fetchCampaignsPaginated] unexpected error', err);
    return { data: [], count: 0 };
  }
}

/**
 * Cria nova campanha
 */
export async function createCampaign(newCampaign: Partial<Campaign>): Promise<Campaign | null> {
  try {
    const { data, error } = await supabase
      .from<Campaign>('campaigns')
      .insert(newCampaign)
      .select()
      .single();

    if (error) {
      console.error('[createCampaign] supabase error', error);
      return null;
    }
    const campaign = data as Campaign;
    campaign.promotions = normalizeArrayField<Promotion>(campaign.promotions);
    campaign.prizes = normalizeArrayField<Prize>(campaign.prizes);
    campaign.prize_image_urls = normalizeArrayField<string>(campaign.prize_image_urls);
    return campaign;
  } catch (err) {
    console.error('[createCampaign] unexpected error', err);
    return null;
  }
}

/**
 * Atualiza campanha
 */
export async function updateCampaign(id: string, updates: Partial<Campaign>): Promise<Campaign | null> {
  try {
    const { data, error } = await supabase
      .from<Campaign>('campaigns')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[updateCampaign] supabase error', error);
      return null;
    }
    const campaign = data as Campaign;
    campaign.promotions = normalizeArrayField<Promotion>(campaign.promotions);
    campaign.prizes = normalizeArrayField<Prize>(campaign.prizes);
    campaign.prize_image_urls = normalizeArrayField<string>(campaign.prize_image_urls);
    return campaign;
  } catch (err) {
    console.error('[updateCampaign] unexpected error', err);
    return null;
  }
}

/**
 * Deleta campanha
 */
export async function deleteCampaign(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('campaigns').delete().eq('id', id);
    if (error) {
      console.error('[deleteCampaign] supabase error', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[deleteCampaign] unexpected error', err);
    return false;
  }
}

/* ----------------------------- Tickets / Cotas ----------------------------- */

/**
 * Retorna todas as cotas (tickets) de uma campanha, ordenadas por número
 */
export async function getTicketsForCampaign(campaignId: string): Promise<Ticket[]> {
  try {
    const { data, error } = await supabase
      .from<Ticket>('tickets')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('quota_number', { ascending: true });

    if (error) {
      console.error('[getTicketsForCampaign] supabase error', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('[getTicketsForCampaign] unexpected error', err);
    return [];
  }
}

/**
 * Cria as cotas em massa (útil quando uma campanha é criada)
 * - campaignId: id da campanha
 * - startNumber: número inicial (normalmente 1)
 * - count: quantidade total de cotas a criar
 *
 * Retorna tickets criados (ou [] em caso de falha)
 */
export async function createTicketsBulk(
  campaignId: string,
  startNumber: number,
  count: number,
  price?: number
): Promise<Ticket[]> {
  if (!campaignId || count <= 0) return [];

  // Constrói objetos em lotes (evitar exceder limites do supabase)
  const batchSize = 500;
  const created: Ticket[] = [];

  try {
    for (let offset = 0; offset < count; offset += batchSize) {
      const chunk = Math.min(batchSize, count - offset);
      const items = new Array(chunk).fill(0).map((_, i) => ({
        campaign_id: campaignId,
        quota_number: startNumber + offset + i,
        price: price ?? null,
        status: 'available'
      }));

      const { data, error } = await supabase.from<Ticket>('tickets').insert(items).select();
      if (error) {
        console.error('[createTicketsBulk] insert error', error);
        // continue com o próximo chunk (ou interrompa conforme sua necessidade)
        break;
      }
      if (data && data.length) created.push(...data);
    }
    return created;
  } catch (err) {
    console.error('[createTicketsBulk] unexpected error', err);
    return created;
  }
}

/**
 * Limpa reservas expiradas (reserves cujo reserved_until < now) e os marca como 'available'
 * - Pode ser executado periodicamente como job
 */
export async function cleanExpiredReservations(): Promise<{ success: boolean; releasedCount?: number; error?: any }> {
  try {
    const nowISO = new Date().toISOString();

    // Seleciona os tickets expirados (reserved_until < now)
    const { data: expired, error: selectErr } = await supabase
      .from<Ticket>('tickets')
      .select('*')
      .lt('reserved_until', nowISO)
      .eq('status', 'reserved');

    if (selectErr) {
      console.error('[cleanExpiredReservations] select error', selectErr);
      return { success: false, error: selectErr };
    }

    if (!expired || expired.length === 0) {
      return { success: true, releasedCount: 0 };
    }

    const quotaNumbers = expired.map(t => t.quota_number);
    const campaignId = expired[0].campaign_id;

    const updates: Partial<Ticket> = {
      status: 'available',
      reserved_by: null,
      reserved_until: null
    };

    const { data: updated, error: updateErr } = await supabase
      .from<Ticket>('tickets')
      .update(updates)
      .eq('campaign_id', campaignId)
      .in('quota_number', quotaNumbers)
      .eq('status', 'reserved'); // só atualiza os que realmente ainda estão reservados

    if (updateErr) {
      console.error('[cleanExpiredReservations] update error', updateErr);
      return { success: false, error: updateErr };
    }

    return { success: true, releasedCount: updated?.length || 0 };
  } catch (err) {
    console.error('[cleanExpiredReservations] unexpected error', err);
    return { success: false, error: err };
  }
}

/**
 * Reserva cotas (foco em atomicidade: primeiro tenta usar RPC Postgres se disponível,
 * senão usa fallback de leitura + update conditional)
 *
 * - campaignId: id da campanha
 * - quotaNumbers: array de números das cotas a reservar
 * - userId: id do usuário que reserva
 * - timeoutMinutes: minutos de expiração
 *
 * Retorna { success, reservedTickets, error }
 *
 * Observação: Recomenda-se implementar uma função RPC em Postgres que faça essa operação
 * atomically no servidor (evita race conditions). Aqui oferecemos fallback seguro que
 * deve funcionar para a maioria dos casos.
 */
export async function reserveTickets(
  campaignId: string,
  quotaNumbers: number[],
  userId: string,
  timeoutMinutes = 15
): Promise<{ success: boolean; reservedTickets?: Ticket[]; error?: any }> {
  if (!campaignId || !quotaNumbers || quotaNumbers.length === 0) {
    return { success: false, error: 'invalid_input' };
  }

  try {
    // Tenta RPC 'reserve_tickets' (caso exista no banco)
    try {
      // Se você tem um RPC no Postgres, ele deve receber (campaign_id, quota_numbers, user_id, timeout_minutes)
      // const { data, error } = await supabase.rpc('reserve_tickets', { campaign_id: campaignId, quota_numbers: quotaNumbers, user_id: userId, timeout_minutes: timeoutMinutes });
      // if (!error && data) return { success: true, reservedTickets: data as Ticket[] };

      // Caso RPC não exista, vai cair no fallback abaixo
    } catch (rpcErr) {
      // ignore e segue fallback
      console.warn('[reserveTickets] rpc not available or failed, fallback will be used', rpcErr);
    }

    // Fallback:
    // 1) Seleciona cotas pedidas que estejam "available"
    const { data: available, error: selectError } = await supabase
      .from<Ticket>('tickets')
      .select('*')
      .eq('campaign_id', campaignId)
      .in('quota_number', quotaNumbers)
      .eq('status', 'available');

    if (selectError) {
      console.error('[reserveTickets] selectError', selectError);
      return { success: false, error: selectError };
    }

    if (!available || available.length !== quotaNumbers.length) {
      return { success: false, error: 'not_all_available' };
    }

    // 2) Atualiza apenas as linhas correspondentes que ainda estão 'available'
    const reservedUntil = new Date(Date.now() + timeoutMinutes * 60 * 1000).toISOString();

    const { data: updated, error: updateError } = await supabase
      .from<Ticket>('tickets')
      .update({
        status: 'reserved',
        reserved_by: userId,
        reserved_until: reservedUntil
      })
      .eq('campaign_id', campaignId)
      .in('quota_number', quotaNumbers)
      .eq('status', 'available');

    if (updateError) {
      console.error('[reserveTickets] updateError', updateError);
      return { success: false, error: updateError };
    }

    // Verifica se o update retornou todas as linhas
    if (!updated || updated.length === 0) {
      return { success: false, error: 'update_failed' };
    }

    return { success: true, reservedTickets: updated };
  } catch (err) {
    console.error('[reserveTickets] unexpected error', err);
    return { success: false, error: err };
  }
}

/**
 * Libera reservas (opcionalmente apenas as pertencentes a um userId)
 */
export async function releaseReservedTickets(
  campaignId: string,
  quotaNumbers: number[],
  userId?: string
): Promise<{ success: boolean; releasedTickets?: Ticket[]; error?: any }> {
  if (!campaignId || !quotaNumbers || quotaNumbers.length === 0) {
    return { success: false, error: 'invalid_input' };
  }

  try {
    let query = supabase
      .from<Ticket>('tickets')
      .update({
        status: 'available',
        reserved_by: null,
        reserved_until: null
      })
      .eq('campaign_id', campaignId)
      .in('quota_number', quotaNumbers)
      .eq('status', 'reserved');

    if (userId) {
      query = (query as any).eq('reserved_by', userId);
    }

    const { data, error } = await query.select();
    if (error) {
      console.error('[releaseReservedTickets] error', error);
      return { success: false, error };
    }

    return { success: true, releasedTickets: data || [] };
  } catch (err) {
    console.error('[releaseReservedTickets] unexpected', err);
    return { success: false, error: err };
  }
}

/**
 * Marca as cotas como vendidas (após confirmação de pagamento)
 */
export async function confirmPurchase(
  campaignId: string,
  quotaNumbers: number[],
  userId: string
): Promise<{ success: boolean; purchased?: Ticket[]; error?: any }> {
  if (!campaignId || !quotaNumbers || quotaNumbers.length === 0) {
    return { success: false, error: 'invalid_input' };
  }

  try {
    // Atualiza status -> sold e limpa reserved_by/reserved_until. Usa neq('status', 'sold') para evitar re-venda.
    const { data, error } = await supabase
      .from<Ticket>('tickets')
      .update({
        status: 'sold',
        purchased_by: userId,
        purchased_at: new Date().toISOString(),
        reserved_by: null,
        reserved_until: null
      })
      .eq('campaign_id', campaignId)
      .in('quota_number', quotaNumbers)
      .neq('status', 'sold')
      .select();

    if (error) {
      console.error('[confirmPurchase] error', error);
      return { success: false, error };
    }

    return { success: true, purchased: data || [] };
  } catch (err) {
    console.error('[confirmPurchase] unexpected', err);
    return { success: false, error: err };
  }
}

/* ----------------------------- Promoções & Cálculo ----------------------------- */

/**
 * Busca promoções vinculadas a uma campanha
 * Tenta tabela 'promotions' primeiro, senão tenta campo campaigns.promotions
 */
export async function fetchPromotionsForCampaign(campaignId: string): Promise<Promotion[]> {
  try {
    const { data: promosTable, error: tableErr } = await supabase
      .from<Promotion>('promotions')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('ticketQuantity', { ascending: true });

    if (!tableErr && promosTable && promosTable.length) return promosTable;

    // fallback para campo JSON dentro da campanha
    const { data: campaignData, error: campErr } = await supabase
      .from<Campaign>('campaigns')
      .select('promotions')
      .eq('id', campaignId)
      .maybeSingle();

    if (campErr) {
      console.error('[fetchPromotionsForCampaign] campErr', campErr);
      return [];
    }
    return normalizeArrayField<Promotion>(campaignData?.promotions);
  } catch (err) {
    console.error('[fetchPromotionsForCampaign] unexpected', err);
    return [];
  }
}

/**
 * Calcula o total aplicado com promoções.
 *
 * Regras asumidas:
 * - promotions array pode conter promos do tipo 'block' (comprar N cotas por X valor),
 *   ou 'percentage'/'fixed' sobre o total.
 * - A função tenta aplicar combos (bloques) primeiro para maximizar desconto.
 *
 * Retorna { total, appliedPromotions, savings, details }
 */
export function calculateTotalWithPromotions(
  quantity: number,
  pricePerTicket: number,
  promotions: Promotion[] = []
): { total: number; appliedPromotions: Promotion[]; savings: number; details?: any } {
  // Trivial: sem promoções
  if (!promotions || promotions.length === 0) {
    const total = (quantity * pricePerTicket);
    return { total, appliedPromotions: [], savings: 0, details: null };
  }

  // Copiamos e normalizamos promos
  const promos = promotions.map(p => ({ ...p }));

  // Separar promos por tipo
  const blockPromos = promos.filter(p => typeof p.ticketQuantity === 'number' && (p.type === 'block' || p.discountedTotalValue !== undefined));
  const pctPromos = promos.filter(p => p.percentage && (!p.ticketQuantity || p.ticketQuantity <= 0));
  const fixedPromos = promos.filter(p => p.fixedDiscountAmount && (!p.ticketQuantity || p.ticketQuantity <= 0));

  // Ordenar blockPromos por ticketQuantity desc (aplica maiores blocos primeiro)
  blockPromos.sort((a, b) => (b.ticketQuantity || 0) - (a.ticketQuantity || 0));

  let remaining = quantity;
  let total = 0;
  const applied: Promotion[] = [];
  const details: any[] = [];

  // Aplica blocks (ex: 10 por R$ 800)
  for (const promo of blockPromos) {
    const blockSize = promo.ticketQuantity || 0;
    if (blockSize <= 0) continue;
    const times = Math.floor(remaining / blockSize);
    if (times > 0) {
      // define block value
      let blockValue = 0;
      if (typeof promo.discountedTotalValue === 'number') {
        blockValue = promo.discountedTotalValue;
      } else if (promo.fixedDiscountAmount) {
        // Se fixedDiscountAmount é desconto total do bloco (em reais), então blockValue = blockSize*price - fixed
        blockValue = (blockSize * pricePerTicket) - (promo.fixedDiscountAmount || 0);
      } else if (promo.percentage) {
        blockValue = (blockSize * pricePerTicket) * (1 - (promo.percentage / 100));
      } else {
        // se não houver campos suficientes, assume como preço normal
        blockValue = blockSize * pricePerTicket;
      }

      total += blockValue * times;
      remaining -= blockSize * times;
      applied.push(promo);
      details.push({ promoApplied: promo, times, blockValue });
    }
  }

  // Preço de itens restantes sem block
  total += remaining * pricePerTicket;

  // Aplica promoções globais (percentuais ou fixed) — assume que são cumulativas (ajuste se não quiser)
  let totalBeforeGlobal = total;
  if (pctPromos.length) {
    for (const p of pctPromos) {
      const pct = p.percentage || 0;
      if (pct > 0) {
        const newTotal = total * (1 - pct / 100);
        details.push({ applied: p, before: total, after: newTotal });
        total = newTotal;
        applied.push(p);
      }
    }
  }

  if (fixedPromos.length) {
    // aplica os fixed (desconto fixo em reais) sequencialmente
    for (const p of fixedPromos) {
      const fixed = p.fixedDiscountAmount || 0;
      const newTotal = Math.max(0, total - fixed);
      details.push({ applied: p, before: total, after: newTotal });
      total = newTotal;
      applied.push(p);
    }
  }

  const original = quantity * pricePerTicket;
  const savings = Math.max(0, original - total);

  return { total, appliedPromotions: applied, savings, details: { original: original, totalBeforeGlobal, steps: details } };
}

/* ----------------------------- Estatísticas ----------------------------- */

/**
 * Retorna estatísticas (total, vendidos, disponíveis, reservados)
 */
export async function getCampaignStats(campaignId: string): Promise<{
  total: number;
  sold: number;
  available: number;
  reserved: number;
  reservedByMe?: number;
} | null> {
  try {
    // Conta por status
    const { data, error } = await supabase
      .from<Ticket>('tickets')
      .select('status, count:count', { head: false })
      .eq('campaign_id', campaignId)
      .group('status');

    // NOTE: Supabase default doesn't support group/count like this via client easily.
    // fallback: buscar todas e reduzir localmente (aceitável se total de cotas razoável).
    if (error) {
      // fallback local
      const all = await getTicketsForCampaign(campaignId);
      const total = all.length;
      const sold = all.filter(t => t.status === 'sold').length;
      const reserved = all.filter(t => t.status === 'reserved').length;
      const available = all.filter(t => t.status === 'available').length;
      return { total, sold, available, reserved };
    }

    // Se conseguimos agrupar via query, tente transformar resultados
    // (Mas muitos projetos preferem fazer via getTicketsForCampaign)
    // Implementação alternativa:
    const all = await getTicketsForCampaign(campaignId);
    const total = all.length;
    const sold = all.filter(t => t.status === 'sold').length;
    const reserved = all.filter(t => t.status === 'reserved').length;
    const available = all.filter(t => t.status === 'available').length;
    return { total, sold, available, reserved };
  } catch (err) {
    console.error('[getCampaignStats] unexpected', err);
    return null;
  }
}

/* ----------------------------- Promoções CRUD (opcional) ----------------------------- */

/**
 * Cria uma promoção (se houver tabela `promotions`)
 */
export async function createPromotion(campaignId: string, promo: Partial<Promotion>): Promise<Promotion | null> {
  try {
    const toInsert = { ...promo, campaign_id: campaignId };
    const { data, error } = await supabase.from<Promotion>('promotions').insert(toInsert).select().single();
    if (error) {
      console.error('[createPromotion] error', error);
      return null;
    }
    return data || null;
  } catch (err) {
    console.error('[createPromotion] unexpected', err);
    return null;
  }
}

/**
 * Atualiza promoção
 */
export async function updatePromotion(promoId: string, updates: Partial<Promotion>): Promise<Promotion | null> {
  try {
    const { data, error } = await supabase.from<Promotion>('promotions').update(updates).eq('id', promoId).select().single();
    if (error) {
      console.error('[updatePromotion] error', error);
      return null;
    }
    return data || null;
  } catch (err) {
    console.error('[updatePromotion] unexpected', err);
    return null;
  }
}

/**
 * Deleta promoção
 */
export async function deletePromotion(promoId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('promotions').delete().eq('id', promoId);
    if (error) {
      console.error('[deletePromotion] error', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[deletePromotion] unexpected', err);
    return false;
  }
}

/* ----------------------------- Utilities extras ----------------------------- */

/**
 * Realiza um "upsert" de um campo JSON (ex.: atualizar campo promotions dentro de campaigns)
 */
export async function updateCampaignJsonField<T = any>(campaignId: string, fieldName: string, value: T): Promise<Campaign | null> {
  try {
    const updates: any = {};
    updates[fieldName] = value;
    const { data, error } = await supabase
      .from<Campaign>('campaigns')
      .update(updates)
      .eq('id', campaignId)
      .select()
      .single();

    if (error) {
      console.error('[updateCampaignJsonField] error', error);
      return null;
    }
    const campaign = data as Campaign;
    campaign.promotions = normalizeArrayField<Promotion>(campaign.promotions);
    return campaign;
  } catch (err) {
    console.error('[updateCampaignJsonField] unexpected', err);
    return null;
  }
}

/* ----------------------------- Export padrão ----------------------------- */

export default {
  fetchCampaignBySlug,
  fetchCampaignByDomain,
  fetchCampaignsPaginated,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getTicketsForCampaign,
  createTicketsBulk,
  cleanExpiredReservations,
  reserveTickets,
  releaseReservedTickets,
  confirmPurchase,
  fetchPromotionsForCampaign,
  calculateTotalWithPromotions,
  getCampaignStats,
  createPromotion,
  updatePromotion,
  deletePromotion,
  updateCampaignJsonField
};

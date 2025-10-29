// src/lib/api/tickets.ts
import { supabase } from '../supabase';
import pLimit from 'p-limit';

/**
 * Tipos exportados
 */
export interface Ticket {
  id: string;
  campaign_id: string;
  quota_number: number;
  user_id: string | null;
  status: 'disponível' | 'reservado' | 'comprado';
  reserved_at: string | null;
  bought_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface TicketStatusInfo {
  quota_number: number;
  status: string;
  user_id: string | null;
  is_mine: boolean;
  reserved_at: string | null;
  bought_at: string | null;
}

export interface ReservationResult {
  quota_number: number;
  status: string;
  message: string;
}

export interface AvailableQuota {
  quota_number: number;
}

export interface CustomerRecord {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  created_at?: string | null;
}

// ✅ NOVO: Interface para CustomerTicket
export interface CustomerTicket {
  id: string;
  campaign_id: string;
  quota_number: number;
  status: string;
  reserved_at: string | null;
  bought_at: string | null;
  campaign?: {
    id: string;
    title: string;
    prize_image_urls: string[] | null;
    ticket_price: number;
    status: string;
  };
}

// ✅ NOVO: Interface para Order (pedido)
export interface Order {
  id: string;
  campaign_id: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  total_amount: number;
  status: string;
  payment_method: string | null;
  payment_status: string;
  created_at: string;
  updated_at: string | null;
  campaign?: {
    id: string;
    title: string;
    prize_image_urls: string[] | null;
    ticket_price: number;
    status: string;
  };
  tickets?: CustomerTicket[];
}

/**
 * Constantes
 */
const RESERVATION_BATCH_SIZE = 500;
const PAGE_SIZE = 1000;

/**
 * formatPhoneNumber
 * - a função canônica para normalizar números de telefone no app
 * - remove caracteres não-numéricos, garante prefixo do país (55) quando apropriado
 */
export function formatPhoneNumber(input: string): string {
  if (!input) return '';
  // remove tudo que não for dígito
  let cleaned = input.replace(/\D/g, '');

  // ✅ CORREÇÃO APRIMORADA: detecção mais robusta de duplicação
  // Se começar com "5555" e tiver mais de 12 dígitos, provavelmente duplicou
  if (cleaned.startsWith('5555') && cleaned.length > 12) {
    cleaned = cleaned.slice(2); // remove os dois "55" iniciais redundantes
  }

  // se não começar com 55, presume Brasil e prefixa 55
  if (!cleaned.startsWith('55')) {
    cleaned = '55' + cleaned;
  }

  return '+' + cleaned;
}

/**
 * cleanQuotaNumbers
 * - transforma elementos variados em um array de inteiros válidos
 */
export const cleanQuotaNumbers = (quotaNumbers: any[]): number[] => {
  if (!Array.isArray(quotaNumbers)) return [];
  return quotaNumbers
    .map((item) => {
      if (item === null || item === undefined) return NaN;
      if (typeof item === 'object') {
        // aceitamos { quota_number: number } ou { quotaNumber: number }
        if ('quota_number' in item) return parseInt(String((item as any).quota_number), 10);
        if ('quotaNumber' in item) return parseInt(String((item as any).quotaNumber), 10);
        // se o objeto for apenas um número serializado: try JSON value
        return parseInt(String(Object.values(item)[0] ?? NaN), 10);
      }
      return parseInt(String(item), 10);
    })
    .filter((n) => !isNaN(n));
};

/**
 * TicketsAPI - conjunto de wrappers para interagir com tickets/cotas via Supabase
 */
export class TicketsAPI {
  /**
   * getCampaignTicketsStatus
   * - coleta o status de todas as cotas de uma campanha usando RPC paginado
   * - faz chamadas concorrentes com limite (p-limit)
   */
  static async getCampaignTicketsStatus(
    campaignId: string,
    userId?: string
  ): Promise<{ data: TicketStatusInfo[] | null; error: any }> {
    try {
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('total_tickets')
        .eq('id', campaignId)
        .single();

      if (campaignError) throw campaignError;
      if (!campaign?.total_tickets) {
        throw new Error('Campanha não encontrada ou sem total_tickets definido.');
      }

      const totalTickets = campaign.total_tickets as number;
      const totalPages = Math.ceil(totalTickets / PAGE_SIZE);

      const limit = pLimit(5);
      const tasks: Promise<any>[] = [];

      for (let i = 0; i < totalPages; i++) {
        const offset = i * PAGE_SIZE;
        tasks.push(
          limit(() =>
            supabase.rpc('get_campaign_tickets_status', {
              p_campaign_id: campaignId,
              p_offset: offset,
              p_limit: PAGE_SIZE,
              p_user_id: userId || null
            })
          )
        );
      }

      const results = await Promise.all(tasks);

      // checar erros nas respostas
      const errRes = results.find((r) => r?.error);
      if (errRes?.error) throw errRes.error;

      const all = results.flatMap((r) => r?.data || []);
      return { data: all as TicketStatusInfo[], error: null };
    } catch (error: any) {
      console.error('TicketsAPI.getCampaignTicketsStatus error:', error);
      return { data: null, error };
    }
  }

  /**
   * getAvailableQuotas
   * - RPC helper para buscar cotas disponíveis (retorna array de números ou objetos)
   * - recebe p_limit opcional
   */
  static async getAvailableQuotas(campaignId: string, limitCount: number = 50): Promise<{ data: number[] | null; error: any }> {
    try {
      const { data, error } = await supabase.rpc('get_available_quotas', {
        p_campaign_id: campaignId,
        p_limit: limitCount
      });

      if (error) throw error;

      // a RPC pode retornar array de números ou array de { quota_number: number }
      const cleaned = (data || []).map((item: any) => {
        if (typeof item === 'object' && item !== null) {
          if ('quota_number' in item) return parseInt(String(item.quota_number), 10);
          // fallback
          return parseInt(String(Object.values(item)[0]), 10);
        }
        return parseInt(String(item), 10);
      }).filter((n: number) => !isNaN(n));

      return { data: cleaned, error: null };
    } catch (error: any) {
      console.error('TicketsAPI.getAvailableQuotas error:', error);
      return { data: null, error };
    }
  }

  /**
   * reserveTickets
   * - recebe quotaNumbers em formatos variados, limpa, faz em batches e chama RPC reserve_tickets
   * - retorna array de ReservationResult
   */
  static async reserveTickets(
    campaignId: string,
    userId: string | null,
    quotaNumbers: any[],
    customerName?: string | null,
    customerEmail?: string | null,
    customerPhone?: string | null
  ): Promise<{ data: ReservationResult[] | null; error: any }> {
    try {
      const cleaned = cleanQuotaNumbers(quotaNumbers);
      
      console.log('=== DEBUG reserveTickets ===');
      console.log('campaignId:', campaignId);
      console.log('userId:', userId);
      console.log('quotaNumbers (original):', quotaNumbers);
      console.log('cleaned:', cleaned);
      console.log('customerPhone (raw):', customerPhone);
      
      if (cleaned.length === 0) {
        console.error('❌ Nenhuma cota válida após limpeza');
        return { data: null, error: new Error('Nenhuma cota válida para reservar') };
      }

      const allResults: ReservationResult[] = [];

      for (let i = 0; i < cleaned.length; i += RESERVATION_BATCH_SIZE) {
        const batch = cleaned.slice(i, i + RESERVATION_BATCH_SIZE);

        // normalizar telefone antes de enviar pro RPC
        const normalizedPhone = customerPhone ? formatPhoneNumber(customerPhone) : null;
        
        console.log('Batch:', batch);
        console.log('normalizedPhone:', normalizedPhone);

        const { data, error } = await supabase.rpc('reserve_tickets', {
          p_campaign_id: campaignId,
          p_user_id: userId,
          p_quota_numbers: batch,
          p_customer_name: customerName || null,
          p_customer_email: customerEmail || null,
          p_customer_phone: normalizedPhone
        });

        if (error) {
          console.error('❌ reserve_tickets RPC error:', error);
          throw error;
        }

        console.log('✅ RPC response:', data);

        if (Array.isArray(data) && data.length > 0) {
          allResults.push(...data);
        }
      }

      console.log('=== FIM DEBUG reserveTickets ===');
      return { data: allResults, error: null };
    } catch (error: any) {
      console.error('TicketsAPI.reserveTickets error:', error);
      return { data: null, error };
    }
  }

  /**
   * releaseTickets
   * - libera lotes de tickets pelo RPC release_tickets
   */
  static async releaseTickets(campaignId: string, ticketNumbers: number[]): Promise<{ data: any; error: any }> {
    try {
      const cleaned = ticketNumbers.map((n) => parseInt(String(n), 10)).filter((n) => !isNaN(n));
      if (cleaned.length === 0) return { data: null, error: new Error('Nenhuma cota válida para liberar') };

      const { data, error } = await supabase.rpc('release_tickets', {
        p_campaign_id: campaignId,
        p_ticket_numbers: cleaned
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error('TicketsAPI.releaseTickets error:', error);
      return { data: null, error };
    }
  }

  /**
   * getTicketsByPhone
   * - busca tickets / pedidos relacionados a um telefone
   * - normaliza o telefone antes de chamar a RPC get_tickets_by_phone
   */
  static async getTicketsByPhone(phoneRaw: string): Promise<{ data: CustomerTicket[] | null; error: any }> {
    try {
      const normalized = formatPhoneNumber(phoneRaw);

      console.log('🔍 getTicketsByPhone - normalized:', normalized);

      // A RPC get_tickets_by_phone deve aceitar o phone normalizado
      const { data, error } = await supabase.rpc('get_tickets_by_phone', {
        p_phone_number: normalized
      });

      if (error) throw error;
      
      console.log('✅ getTicketsByPhone - tickets found:', data?.length || 0);
      return { data: data || [], error: null };
    } catch (error: any) {
      console.error('TicketsAPI.getTicketsByPhone error:', error);
      return { data: null, error };
    }
  }

  /**
   * ✅ CORREÇÃO: getOrdersByPhoneNumber
   * - busca pedidos (orders) pelo número de telefone do cliente
   * - SEM usar relacionamento com campaigns (apenas busca os IDs)
   */
  static async getOrdersByPhoneNumber(phoneRaw: string): Promise<{ data: Order[] | null; error: any }> {
    try {
      const normalized = formatPhoneNumber(phoneRaw);

      console.log('🔍 getOrdersByPhoneNumber - phone:', phoneRaw);
      console.log('🔍 getOrdersByPhoneNumber - normalized:', normalized);

      // ✅ Busca APENAS na tabela orders (sem join com campaigns)
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_phone', normalized)
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('❌ Erro ao buscar pedidos:', ordersError);
        throw ordersError;
      }

      console.log('✅ Pedidos encontrados:', ordersData?.length || 0);
      
      if (!ordersData || ordersData.length === 0) {
        return { data: [], error: null };
      }

      // ✅ Para cada pedido, buscar campanha e tickets separadamente
      const ordersWithDetails = await Promise.all(
        ordersData.map(async (order) => {
          // Buscar detalhes da campanha
          const { data: campaign } = await supabase
            .from('campaigns')
            .select('id, title, prize_image_urls, ticket_price, status')
            .eq('id', order.campaign_id)
            .maybeSingle();

          // Buscar tickets deste pedido através do customer_phone
          const { data: tickets } = await supabase
            .from('tickets')
            .select('*')
            .eq('campaign_id', order.campaign_id)
            .eq('user_id', order.customer_phone) // Tickets vinculados ao telefone
            .in('status', ['reservado', 'comprado']);

          return {
            ...order,
            campaign: campaign || undefined,
            tickets: tickets || []
          };
        })
      );

      return {
        data: ordersWithDetails as Order[],
        error: null
      };
    } catch (error: any) {
      console.error('❌ TicketsAPI.getOrdersByPhoneNumber error:', error);
      return { data: null, error };
    }
  }

  /**
   * ✅ NOVO: Alias para compatibilidade
   */
  static async getTicketsByPhoneNumber(phoneRaw: string): Promise<{ data: CustomerTicket[] | null; error: any }> {
    // Redireciona para getTicketsByPhone
    return TicketsAPI.getTicketsByPhone(phoneRaw);
  }

  /**
   * checkCustomerByPhone
   * - busca cliente existente pelo telefone
   * - normaliza antes de consultar
   */
  static async checkCustomerByPhone(phoneRaw: string): Promise<{ data: CustomerRecord | null; error: any }> {
    try {
      const normalized = formatPhoneNumber(phoneRaw);

      console.log('🔍 checkCustomerByPhone - normalized:', normalized);

      // se tiver uma view/custom RPC para buscar cliente por telefone, usar aqui
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, email, phone, created_at')
        .eq('phone', normalized)
        .maybeSingle();

      if (error) {
        // fallback para RPC se necessário
        console.warn('Direct customers lookup error, trying RPC fallback:', error);
        const rpc = await supabase.rpc('get_customer_by_phone', { p_phone_number: normalized });
        if (rpc.error) throw rpc.error;
        return { data: rpc.data || null, error: null };
      }

      console.log('✅ checkCustomerByPhone - customer found:', !!data);
      return { data: data || null, error: null };
    } catch (error: any) {
      console.error('TicketsAPI.checkCustomerByPhone error:', error);
      return { data: null, error };
    }
  }
}

/**
 * Observações importantes:
 * - Importe e utilize sempre a função formatPhoneNumber deste arquivo em todo o app.
 * - Verifique se as RPCs existam no seu schema do Supabase com os nomes usados aqui:
 *    - get_campaign_tickets_status
 *    - get_available_quotas
 *    - reserve_tickets
 *    - release_tickets
 *    - get_tickets_by_phone
 *    - get_customer_by_phone (opcional)
 * - Se alguma RPC retornar objetos em vez de números puros, as funções aqui tentam normalizar.
 * - ✅ NOVO: Adicionado método getOrdersByPhoneNumber para buscar pedidos por telefone
 */

export default TicketsAPI;
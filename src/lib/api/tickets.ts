import { supabase } from '../supabase';
import pLimit from 'p-limit';

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

export interface CustomerTicket {
  ticket_id: string;
  campaign_id: string;
  campaign_title: string;
  campaign_public_id: string | null;
  prize_image_urls: string[] | null;
  quota_number: number;
  status: string;
  bought_at: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
}

export interface CustomerOrder {
  order_id: string;
  campaign_id: string;
  campaign_title: string;
  campaign_public_id: string | null;
  prize_image_urls: string[] | null;
  ticket_count: number;
  total_value: number;
  status: 'reserved' | 'purchased' | 'expired';
  created_at: string;
  reserved_at: string | null;
  bought_at: string | null;
  reservation_expires_at: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  ticket_numbers: number[];
}

// Constante para tamanho do lote de reservas
const RESERVATION_BATCH_SIZE = 500;

export class TicketsAPI {
  /**
   * Busca o status de todos os tickets de uma campanha (otimizado para frontend)
   * Implementa paginação concorrente com limite de requisições simultâneas
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

      const totalTickets = campaign.total_tickets;
      const PAGE_SIZE = 1000;
      const totalPages = Math.ceil(totalTickets / PAGE_SIZE);

      const limit = pLimit(5);
      const promises: Promise<any>[] = [];

      for (let i = 0; i < totalPages; i++) {
        const offset = i * PAGE_SIZE;
        promises.push(
          limit(() =>
            supabase.rpc('get_campaign_tickets_status', {
              p_campaign_id: campaignId,
              p_offset: offset,
              p_limit: PAGE_SIZE,
              p_user_id: userId || null,
            })
          )
        );
      }

      const results = await Promise.all(promises);
      const errorResult = results.find((r) => r.error);
      if (errorResult?.error) throw errorResult.error;

      const allTickets = results.flatMap((r) => r.data || []);
      return { data: allTickets, error: null };
    } catch (error: any) {
      console.error('Erro ao buscar status dos tickets:', error);
      return { data: null, error };
    }
  }

  /**
   * Reserva múltiplos tickets em lotes (com limpeza de dados)
   */
  static async reserveTickets(
    campaignId: string,
    userId: string,
    quotaNumbers: any[]
  ): Promise<{ data: ReservationResult[] | null; error: any }> {
    try {
      // 🔹 Limpa e normaliza o array antes de enviar
      const cleanedQuotaNumbers = quotaNumbers
        .map((q) => {
          if (typeof q === 'object' && q?.quota_number !== undefined) {
            return parseInt(q.quota_number);
          }
          return parseInt(q);
        })
        .filter((n) => !isNaN(n));

      const results: ReservationResult[] = [];

      for (let i = 0; i < cleanedQuotaNumbers.length; i += RESERVATION_BATCH_SIZE) {
        const batch = cleanedQuotaNumbers.slice(i, i + RESERVATION_BATCH_SIZE);

        const { data, error } = await supabase.rpc('reserve_tickets', {
          p_campaign_id: campaignId,
          p_user_id: userId,
          p_ticket_numbers: batch,
        });

        if (error) throw error;
        if (data) results.push(...data);
      }

      return { data: results, error: null };
    } catch (error: any) {
      console.error('Erro ao reservar tickets:', error);
      return { data: null, error };
    }
  }

  /**
   * Libera tickets reservados (por expiração, cancelamento, etc)
   */
  static async releaseTickets(
    campaignId: string,
    ticketNumbers: number[]
  ): Promise<{ data: any; error: any }> {
    try {
      const { data, error } = await supabase.rpc('release_tickets', {
        p_campaign_id: campaignId,
        p_ticket_numbers: ticketNumbers,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error('Erro ao liberar tickets:', error);
      return { data: null, error };
    }
  }
}

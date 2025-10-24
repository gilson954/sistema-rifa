import { supabase } from '../supabase';

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

export class TicketsAPI {
  /**
   * Busca o status de todos os tickets de uma campanha (otimizado para frontend)
   * Implementa paginação automática para campanhas com mais de 10000 tickets
   */
  static async getCampaignTicketsStatus(
    campaignId: string,
    userId?: string
  ): Promise<{ data: TicketStatusInfo[] | null; error: any }> {
    try {
      // Get campaign to check total_tickets first
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('total_tickets')
        .eq('id', campaignId)
        .maybeSingle();

      if (!campaign) {
        return { data: null, error: new Error('Campaign not found') };
      }

      const totalTickets = campaign.total_tickets;
      const pageSize = 10000; // Tamanho de cada página
      const allTickets: TicketStatusInfo[] = [];

      // Se a campanha tem menos de 10000 tickets, faz uma única requisição
      if (totalTickets <= pageSize) {
        const { data, error } = await supabase
          .rpc('get_campaign_tickets_status', {
            p_campaign_id: campaignId,
            p_user_id: userId || null,
            p_offset: 0,
            p_limit: pageSize
          });

        return { data, error };
      }

      // Para campanhas grandes, implementa paginação automática
      const totalPages = Math.ceil(totalTickets / pageSize);
      console.log(`Loading ${totalTickets} tickets in ${totalPages} pages...`);

      for (let page = 0; page < totalPages; page++) {
        const offset = page * pageSize;
        console.log(`Loading page ${page + 1}/${totalPages} (offset: ${offset})...`);

        const { data, error } = await supabase
          .rpc('get_campaign_tickets_status', {
            p_campaign_id: campaignId,
            p_user_id: userId || null,
            p_offset: offset,
            p_limit: pageSize
          });

        if (error) {
          console.error(`Error loading page ${page + 1}:`, error);
          return { data: null, error };
        }

        if (data && data.length > 0) {
          allTickets.push(...data);
        }

        // Se a página retornou menos tickets que o esperado, não há mais páginas
        if (!data || data.length < pageSize) {
          break;
        }
      }

      console.log(`Successfully loaded ${allTickets.length} tickets`);
      return { data: allTickets, error: null };
    } catch (error) {
      console.error('Error fetching campaign tickets status:', error);
      return { data: null, error };
    }
  }

  /**
   * Busca todos os tickets de uma campanha específica (dados completos)
   */
  static async getCampaignTickets(campaignId: string): Promise<{ data: Ticket[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('quota_number', { ascending: true });

      return { data, error };
    } catch (error) {
      console.error('Error fetching campaign tickets:', error);
      return { data: null, error };
    }
  }

  /**
   * Reserva um conjunto de tickets para um usuário
   */
  static async reserveTickets(
    campaignId: string,
    quotaNumbers: number[],
    userId: string | null,
    customerName: string,
    customerEmail: string,
    customerPhone: string
  ): Promise<{ data: ReservationResult[] | null; error: any }> {
    try {
      const { data, error } = await supabase.rpc('reserve_tickets', {
        p_campaign_id: campaignId,
        p_quota_numbers: quotaNumbers,
        p_user_id: userId,
        p_customer_name: customerName,
        p_customer_email: customerEmail,
        p_customer_phone: customerPhone,
      });

      return { data, error };
    } catch (error) {
      console.error('Error reserving tickets:', error);
      return { data: null, error };
    }
  }

  /**
   * Finaliza a compra de um conjunto de tickets
   */
  static async finalizePurchase(
    campaignId: string,
    quotaNumbers: number[],
    userId: string
  ): Promise<{ data: ReservationResult[] | null; error: any }> {
    try {
      const { data, error } = await supabase.rpc('finalize_purchase', {
        p_campaign_id: campaignId,
        p_quota_numbers: quotaNumbers,
        p_user_id: userId,
      });

      return { data, error };
    } catch (error) {
      console.error('Error finalizing purchase:', error);
      return { data: null, error };
    }
  }

  /**
   * Libera reservas expiradas (função administrativa)
   */
  static async releaseExpiredReservations(): Promise<{ data: any[] | null; error: any }> {
    try {
      const { data, error } = await supabase.rpc('release_expired_reservations');
      return { data, error };
    } catch (error) {
      console.error('Error releasing expired reservations:', error);
      return { data: null, error };
    }
  }

  /**
   * Busca tickets de um usuário específico em uma campanha
   */
  static async getUserTicketsInCampaign(
    campaignId: string,
    userId: string
  ): Promise<{ data: Ticket[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('user_id', userId)
        .order('quota_number', { ascending: true });

      return { data, error };
    } catch (error) {
      console.error('Error fetching user tickets:', error);
      return { data: null, error };
    }
  }

  /**
   * Busca tickets por número de telefone (para clientes não logados)
   */
  static async getTicketsByPhoneNumber(phoneNumber: string): Promise<{ data: CustomerTicket[] | null; error: any }> {
    try {
      const { data, error } = await supabase.rpc('get_tickets_by_phone', {
        p_phone_number: phoneNumber
      });

      return { data, error };
    } catch (error) {
      console.error('Error fetching tickets by phone:', error);
      return { data: null, error };
    }
  }

  /**
   * Busca pedidos (orders) por número de telefone
   * Retorna pedidos agrupados em vez de tickets individuais
   */
  static async getOrdersByPhoneNumber(phoneNumber: string): Promise<{ data: CustomerOrder[] | null; error: any }> {
    try {
      const { data, error } = await supabase.rpc('get_orders_by_phone', {
        p_phone_number: phoneNumber
      });

      return { data, error };
    } catch (error) {
      console.error('Error fetching orders by phone:', error);
      return { data: null, error };
    }
  }
}
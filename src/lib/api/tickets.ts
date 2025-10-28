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

// Constante para tamanho do lote de reservas
const RESERVATION_BATCH_SIZE = 500;

/**
 * Função helper para limpar e garantir que o array contenha apenas números inteiros
 */
const cleanQuotaNumbers = (quotaNumbers: any[]): number[] => {
  return quotaNumbers
    .map(item => {
      // Se o item é um objeto com propriedade quota_number, extraia o valor
      if (typeof item === 'object' && item !== null && 'quota_number' in item) {
        return parseInt(item.quota_number, 10);
      }
      // Caso contrário, tente converter diretamente para número inteiro
      return parseInt(item, 10);
    })
    .filter(num => !isNaN(num)); // Filtra valores inválidos (NaN)
};

/**
 * Função helper para normalizar o número de telefone para o formato padronizado
 * Retorna apenas dígitos incluindo o código do país (+XX seguido dos dígitos)
 * Se o número não tiver código do país, adiciona +55 (Brasil) como padrão
 */
const formatPhoneNumber = (phoneNumber: string): string => {
  if (!phoneNumber) return phoneNumber;
  
  // Remove todos os caracteres não numéricos
  const numbersOnly = phoneNumber.replace(/\D/g, '');
  
  // Se o número original começava com '+', preserva isso
  const hasPlus = phoneNumber.trim().startsWith('+');
  
  // Se já tem '+' no original e tem dígitos, retorna com '+'
  if (hasPlus && numbersOnly.length > 0) {
    return `+${numbersOnly}`;
  }
  
  // Se não tem '+', adiciona +55 (código do Brasil) por padrão
  if (numbersOnly.length > 0) {
    return `+55${numbersOnly}`;
  }
  
  return phoneNumber;
};

export class TicketsAPI {
  /**
   * Busca o status de todos os tickets de uma campanha (otimizado para frontend)
   * Implementa paginação PARALELA para campanhas com mais de 1000 tickets
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
      const pageSize = 1000; // Tamanho de cada página (limitado pelo Supabase RPC)

      // Se a campanha tem menos de 1000 tickets, faz uma única requisição
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

      // Para campanhas grandes, implementa paginação PARALELA
      const totalPages = Math.ceil(totalTickets / pageSize);
      console.log(`Loading ${totalTickets} tickets in ${totalPages} pages (parallel)...`);

      // Cria um array de promessas para buscar todas as páginas em paralelo
      const pagePromises: Promise<{ data: TicketStatusInfo[] | null; error: any }>[] = [];

      for (let page = 0; page < totalPages; page++) {
        const offset = page * pageSize;
        
        // Adiciona a promessa ao array (não aguarda aqui)
        const promise = supabase
          .rpc('get_campaign_tickets_status', {
            p_campaign_id: campaignId,
            p_user_id: userId || null,
            p_offset: offset,
            p_limit: pageSize
          })
          .then(result => {
            console.log(`Page ${page + 1}/${totalPages} loaded (offset: ${offset})`);
            return result;
          });

        pagePromises.push(promise);
      }

      // Executa todas as requisições em paralelo
      const results = await Promise.all(pagePromises);

      // Verifica se houve algum erro
      const errorResult = results.find(result => result.error);
      if (errorResult) {
        console.error('Error loading tickets:', errorResult.error);
        return { data: null, error: errorResult.error };
      }

      // Combina todos os resultados em um único array
      const allTickets: TicketStatusInfo[] = [];
      for (const result of results) {
        if (result.data && result.data.length > 0) {
          allTickets.push(...result.data);
        }
      }

      console.log(`Successfully loaded ${allTickets.length} tickets in parallel`);
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
   * Implementa processamento em lote para grandes quantidades
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
      // ✅ LIMPA E GARANTE QUE TODOS OS ELEMENTOS SEJAM NÚMEROS INTEIROS
      const cleanedQuotaNumbers = cleanQuotaNumbers(quotaNumbers);

      if (cleanedQuotaNumbers.length === 0) {
        return { 
          data: null, 
          error: new Error('Nenhum número de cota válido foi fornecido') 
        };
      }

      // ✅ NORMALIZA O NÚMERO DE TELEFONE PARA O FORMATO PADRONIZADO (apenas dígitos com código do país)
      const formattedPhone = formatPhoneNumber(customerPhone);

      console.log(`Original quota numbers:`, quotaNumbers);
      console.log(`Cleaned quota numbers:`, cleanedQuotaNumbers);
      console.log(`Original phone:`, customerPhone);
      console.log(`Formatted phone:`, formattedPhone);

      // Se a quantidade de tickets é menor ou igual ao tamanho do lote, faz uma única requisição
      if (cleanedQuotaNumbers.length <= RESERVATION_BATCH_SIZE) {
        const { data, error } = await supabase.rpc('reserve_tickets', {
          p_campaign_id: campaignId,
          p_quota_numbers: cleanedQuotaNumbers,
          p_user_id: userId,
          p_customer_name: customerName,
          p_customer_email: customerEmail,
          p_customer_phone: formattedPhone,
        });

        return { data, error };
      }

      // Para grandes quantidades, processa em lotes
      const allResults: ReservationResult[] = [];
      const totalBatches = Math.ceil(cleanedQuotaNumbers.length / RESERVATION_BATCH_SIZE);
      console.log(`Reserving ${cleanedQuotaNumbers.length} tickets in ${totalBatches} batches...`);

      for (let i = 0; i < totalBatches; i++) {
        const start = i * RESERVATION_BATCH_SIZE;
        const end = Math.min(start + RESERVATION_BATCH_SIZE, cleanedQuotaNumbers.length);
        const batch = cleanedQuotaNumbers.slice(start, end);

        console.log(`Processing batch ${i + 1}/${totalBatches} (${batch.length} tickets)...`);

        const { data, error } = await supabase.rpc('reserve_tickets', {
          p_campaign_id: campaignId,
          p_quota_numbers: batch,
          p_user_id: userId,
          p_customer_name: customerName,
          p_customer_email: customerEmail,
          p_customer_phone: formattedPhone,
        });

        if (error) {
          console.error(`Error processing batch ${i + 1}:`, error);
          return { data: null, error };
        }

        if (data && data.length > 0) {
          allResults.push(...data);
        }
      }

      console.log(`Successfully reserved ${allResults.length} tickets`);
      return { data: allResults, error: null };
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
      // ✅ LIMPA E GARANTE QUE TODOS OS ELEMENTOS SEJAM NÚMEROS INTEIROS
      const cleanedQuotaNumbers = cleanQuotaNumbers(quotaNumbers);

      if (cleanedQuotaNumbers.length === 0) {
        return { 
          data: null, 
          error: new Error('Nenhum número de cota válido foi fornecido') 
        };
      }

      const { data, error } = await supabase.rpc('finalize_purchase', {
        p_campaign_id: campaignId,
        p_quota_numbers: cleanedQuotaNumbers,
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
   * Implementa busca dupla para compatibilidade com números antigos:
   * 1. Busca com o número normalizado completo (incluindo código do país)
   * 2. Se não encontrar e o número começar com 55 (Brasil), busca sem o código do país
   */
  static async getTicketsByPhoneNumber(phoneNumber: string): Promise<{ data: CustomerTicket[] | null; error: any }> {
    try {
      // Normaliza o número de telefone para conter apenas dígitos
      const normalizedPhone = phoneNumber.replace(/\D/g, '');
      
      console.log(`Original phone:`, phoneNumber);
      console.log(`Normalized phone:`, normalizedPhone);

      // Primeira tentativa: busca com o número normalizado completo
      const { data: firstAttemptData, error: firstAttemptError } = await supabase.rpc('get_tickets_by_phone', {
        p_phone_number: normalizedPhone
      });

      if (firstAttemptError) {
        console.error('Error on first attempt:', firstAttemptError);
        return { data: null, error: firstAttemptError };
      }

      // Se encontrou resultados na primeira tentativa, retorna
      if (firstAttemptData && firstAttemptData.length > 0) {
        console.log(`Found ${firstAttemptData.length} tickets with full number`);
        return { data: firstAttemptData, error: null };
      }

      // Se não encontrou resultados e o número começa com 55 (Brasil), faz segunda tentativa
      if (normalizedPhone.startsWith('55')) {
        const phoneWithoutCountryCode = normalizedPhone.substring(2);
        console.log(`No results found. Trying without country code: ${phoneWithoutCountryCode}`);

        const { data: secondAttemptData, error: secondAttemptError } = await supabase.rpc('get_tickets_by_phone', {
          p_phone_number: phoneWithoutCountryCode
        });

        if (secondAttemptError) {
          console.error('Error on second attempt:', secondAttemptError);
          return { data: null, error: secondAttemptError };
        }

        if (secondAttemptData && secondAttemptData.length > 0) {
          console.log(`Found ${secondAttemptData.length} tickets without country code`);
        }

        return { data: secondAttemptData, error: null };
      }

      // Se não encontrou resultados em nenhuma tentativa
      console.log('No tickets found for this phone number');
      return { data: [], error: null };
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
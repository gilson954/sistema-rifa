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

export interface PaginatedTicketsResponse {
  data: TicketStatusInfo[] | null;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  error: any;
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
 * ⚠️ FUNÇÃO DESATIVADA - NÃO USAR MAIS!
 * 
 * Esta função causava o bug de duplicação +5555 porque era chamada múltiplas vezes.
 * A normalização agora deve ser feita APENAS UMA VEZ nos componentes de UI:
 * - ReservationStep1Modal.tsx
 * - ReservationModal.tsx
 * 
 * Formato esperado em TODOS os lugares: +5562999999999
 * 
 * IMPORTANTE: Esta função foi mantida apenas para referência e compatibilidade
 * com imports existentes, mas NÃO deve ser usada. Todos os números de telefone
 * já devem chegar normalizados no formato correto.
 * 
 * @deprecated Use a normalização direta nos componentes de UI
 */
export const formatPhoneNumber = (phoneNumber: string): string => {
  console.warn('⚠️ formatPhoneNumber() foi chamada - ISTO NÃO DEVERIA ACONTECER!');
  console.warn('⚠️ Números de telefone devem ser normalizados APENAS nos componentes de UI');
  console.trace('Stack trace da chamada indevida:');
  
  // Retorna o número exatamente como recebido, sem processar
  return phoneNumber;
};

export class TicketsAPI {
  /**
   * ✨ FUNÇÃO PRINCIPAL COM PAGINAÇÃO (CORRIGIDA)
   * 
   * Busca o status dos tickets de uma campanha com paginação.
   * Esta função é otimizada para buscar blocos específicos de tickets,
   * respeitando o limite de 1000 linhas do PostgREST.
   * 
   * ✅ CORREÇÃO APLICADA: Agora utiliza corretamente p_offset e p_limit
   * para garantir que a paginação funcione conforme esperado.
   * 
   * IMPORTANTE: Para campanhas com mais de 1000 tickets, esta função deve
   * ser chamada múltiplas vezes com diferentes valores de page.
   * O hook useTickets.ts implementa essa lógica multi-páginas automaticamente.
   * 
   * @param campaignId - ID da campanha
   * @param userId - ID do usuário (opcional)
   * @param page - Número da página (começa em 1)
   * @param pageSize - Tamanho da página (padrão: 1000, máximo recomendado devido ao PostgREST)
   * @returns Objeto com dados paginados e metadados de paginação
   * 
   * @example
   * // Buscar primeira página (tickets 1-1000)
   * const result1 = await getCampaignTicketsStatus('campaign-id', 'user-id', 1, 1000);
   * 
   * // Buscar segunda página (tickets 1001-2000)
   * const result2 = await getCampaignTicketsStatus('campaign-id', 'user-id', 2, 1000);
   */
  static async getCampaignTicketsStatus(
    campaignId: string,
    userId?: string,
    page: number = 1,
    pageSize: number = 1000
  ): Promise<PaginatedTicketsResponse> {
    try {
      // Busca informações da campanha para obter o total de tickets
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('total_tickets')
        .eq('id', campaignId)
        .maybeSingle();

      if (campaignError) {
        console.error('❌ TicketsAPI.getCampaignTicketsStatus - Error fetching campaign info:', campaignError);
        return {
          data: null,
          total: 0,
          page,
          pageSize,
          totalPages: 0,
          error: campaignError
        };
      }

      if (!campaign) {
        console.warn(`⚠️ TicketsAPI.getCampaignTicketsStatus - Campaign not found: ${campaignId}`);
        return {
          data: null,
          total: 0,
          page,
          pageSize,
          totalPages: 0,
          error: new Error('Campaign not found')
        };
      }

      const totalTickets = campaign.total_tickets;
      const totalPages = Math.ceil(totalTickets / pageSize);
      
      // Valida o número da página
      const validPage = Math.max(1, Math.min(page, totalPages || 1));
      
      // ✅ CORREÇÃO CRÍTICA: Calcular offset corretamente
      // offset = (página - 1) × tamanho_da_página
      // Exemplo: página 1 → offset 0, página 2 → offset 1000, página 3 → offset 2000
      const offset = (validPage - 1) * pageSize;

      console.log(`📄 TicketsAPI.getCampaignTicketsStatus - Loading page ${validPage}/${totalPages}`);
      console.log(`   Campaign ID: ${campaignId}`);
      console.log(`   User ID: ${userId || 'null'}`);
      console.log(`   Total tickets: ${totalTickets}`);
      console.log(`   Page size: ${pageSize}`);
      console.log(`   Offset (p_offset): ${offset}`);
      console.log(`   Limit (p_limit): ${pageSize}`);

      // Se não há tickets, retorna array vazio
      if (totalTickets === 0) {
        console.log('ℹ️ TicketsAPI.getCampaignTicketsStatus - Campaign has no tickets');
        return {
          data: [],
          total: 0,
          page: validPage,
          pageSize,
          totalPages: 0,
          error: null
        };
      }

      // ✅ CORREÇÃO APLICADA: Usar p_offset e p_limit corretamente na chamada RPC
      // A função RPC get_campaign_tickets_status deve receber:
      // - p_offset: número de tickets a pular (0 para primeira página, 1000 para segunda, etc)
      // - p_limit: quantidade máxima de tickets a retornar
      const { data, error } = await supabase
        .rpc('get_campaign_tickets_status', {
          p_campaign_id: campaignId,
          p_user_id: userId || null,
          p_offset: offset,
          p_limit: pageSize
        });

      if (error) {
        console.error('❌ TicketsAPI.getCampaignTicketsStatus - Error loading tickets page:', error);
        console.error('   RPC params:', {
          p_campaign_id: campaignId,
          p_user_id: userId || null,
          p_offset: offset,
          p_limit: pageSize
        });
        return {
          data: null,
          total: totalTickets,
          page: validPage,
          pageSize,
          totalPages,
          error
        };
      }

      const ticketsReceived = data?.length || 0;
      console.log(`✅ TicketsAPI.getCampaignTicketsStatus - Successfully loaded page ${validPage}/${totalPages}`);
      console.log(`   Tickets received: ${ticketsReceived}`);
      
      // Calcular quantos tickets esperamos nesta página
      const expectedTickets = Math.min(pageSize, totalTickets - offset);
      console.log(`   Expected: ${expectedTickets}`);

      // Validação de sanidade: verificar se recebemos a quantidade esperada
      if (ticketsReceived < expectedTickets && ticketsReceived < totalTickets) {
        console.warn(`⚠️ TicketsAPI.getCampaignTicketsStatus - Warning: Expected ${expectedTickets} tickets but received ${ticketsReceived}`);
        console.warn('   This might indicate an issue with the RPC function or database state');
      }

      return {
        data: data || [],
        total: totalTickets,
        page: validPage,
        pageSize,
        totalPages,
        error: null
      };
    } catch (error) {
      console.error('❌ TicketsAPI.getCampaignTicketsStatus - Unexpected error:', error);
      return {
        data: null,
        total: 0,
        page,
        pageSize,
        totalPages: 0,
        error
      };
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
      console.error('❌ TicketsAPI.getCampaignTickets - Error:', error);
      return { data: null, error };
    }
  }

  /**
   * Reserva um conjunto de tickets para um usuário
   * Implementa processamento em lote para grandes quantidades
   * 
   * @param customerPhone - Número de telefone JÁ NORMALIZADO (formato: +5562999999999)
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
      const cleanedQuotaNumbers = cleanQuotaNumbers(quotaNumbers);

      if (cleanedQuotaNumbers.length === 0) {
        return { 
          data: null, 
          error: new Error('Nenhum número de cota válido foi fornecido') 
        };
      }

      // ✅ LOGS DE DEBUG CONFORME O PLANO
      console.log(`🔵 TicketsAPI.reserveTickets - Campaign ID: ${campaignId}`);
      console.log(`🔵 TicketsAPI.reserveTickets - Quota Numbers:`, cleanedQuotaNumbers);
      console.log(`🔵 TicketsAPI.reserveTickets - User ID: ${userId}`);
      console.log(`🔵 TicketsAPI.reserveTickets - Customer Name: ${customerName}`);
      console.log(`🔵 TicketsAPI.reserveTickets - Customer Email: ${customerEmail}`);
      console.log(`🔵 TicketsAPI.reserveTickets - Customer Phone (sent to RPC): ${customerPhone}`);

      // Se a quantidade de tickets é menor ou igual ao tamanho do lote, faz uma única requisição
      if (cleanedQuotaNumbers.length <= RESERVATION_BATCH_SIZE) {
        const { data, error } = await supabase.rpc('reserve_tickets', {
          p_campaign_id: campaignId,
          p_quota_numbers: cleanedQuotaNumbers,
          p_user_id: userId,
          p_customer_name: customerName,
          p_customer_email: customerEmail,
          p_customer_phone: customerPhone,
        });

        if (error) {
          console.error('❌ TicketsAPI.reserveTickets - Error in reserve_tickets RPC:', error);
        } else {
          console.log(`✅ TicketsAPI.reserveTickets - Successfully reserved ${data?.length || 0} tickets`);
        }

        return { data, error };
      }

      // Para grandes quantidades, processa em lotes
      const allResults: ReservationResult[] = [];
      const totalBatches = Math.ceil(cleanedQuotaNumbers.length / RESERVATION_BATCH_SIZE);
      console.log(`🔵 TicketsAPI.reserveTickets - Reserving ${cleanedQuotaNumbers.length} tickets in ${totalBatches} batches...`);

      for (let i = 0; i < totalBatches; i++) {
        const start = i * RESERVATION_BATCH_SIZE;
        const end = Math.min(start + RESERVATION_BATCH_SIZE, cleanedQuotaNumbers.length);
        const batch = cleanedQuotaNumbers.slice(start, end);

        console.log(`🔵 TicketsAPI.reserveTickets - Processing batch ${i + 1}/${totalBatches} (${batch.length} tickets)...`);

        const { data, error } = await supabase.rpc('reserve_tickets', {
          p_campaign_id: campaignId,
          p_quota_numbers: batch,
          p_user_id: userId,
          p_customer_name: customerName,
          p_customer_email: customerEmail,
          p_customer_phone: customerPhone,
        });

        if (error) {
          console.error(`❌ TicketsAPI.reserveTickets - Error processing batch ${i + 1}:`, error);
          return { data: null, error };
        }

        if (data && data.length > 0) {
          allResults.push(...data);
        }
      }

      console.log(`✅ TicketsAPI.reserveTickets - Successfully reserved ${allResults.length} tickets in ${totalBatches} batches`);
      return { data: allResults, error: null };
    } catch (error) {
      console.error('❌ TicketsAPI.reserveTickets - Unexpected error:', error);
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
      console.error('❌ TicketsAPI.finalizePurchase - Error:', error);
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
      console.error('❌ TicketsAPI.releaseExpiredReservations - Error:', error);
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
      console.error('❌ TicketsAPI.getUserTicketsInCampaign - Error:', error);
      return { data: null, error };
    }
  }

  /**
   * Busca tickets por número de telefone (para clientes não logados)
   *
   * O banco de dados agora faz matching flexível automaticamente, suportando:
   * - Números com código do país: +5562999999999
   * - Números sem código do país: 62999999999
   * - Números com formatação: +55 (62) 99999-9999
   *
   * @param phoneNumber - Número de telefone (qualquer formato)
   * @param retryOnEmpty - Se true, tenta novamente após 1s se não encontrar tickets (útil para timing issues)
   */
  static async getTicketsByPhoneNumber(
    phoneNumber: string,
    retryOnEmpty: boolean = true
  ): Promise<{ data: CustomerTicket[] | null; error: any }> {
    try {
      console.log(`🔵 TicketsAPI.getTicketsByPhoneNumber - Searching with phone:`, phoneNumber);

      // Primeira tentativa via RPC
      const { data, error } = await supabase.rpc('get_tickets_by_phone', {
        p_phone_number: phoneNumber
      });

      if (error) {
        console.error('❌ TicketsAPI.getTicketsByPhoneNumber - Error:', error);
        return { data: null, error };
      }

      // Se encontrou tickets, retorna imediatamente
      if (data && data.length > 0) {
        console.log(`✅ TicketsAPI.getTicketsByPhoneNumber - Found ${data.length} tickets`);
        return { data, error: null };
      }

      // Se não encontrou e retry está habilitado, tenta query direta para debug
      if (retryOnEmpty) {
        console.log('⚠️ TicketsAPI.getTicketsByPhoneNumber - No tickets found via RPC. Trying direct query...');

        // Query direta para verificar se os dados existem
        const { data: directData, error: directError } = await supabase
          .from('tickets')
          .select(`
            id,
            campaign_id,
            quota_number,
            status,
            bought_at,
            reserved_at,
            customer_name,
            customer_email,
            customer_phone,
            campaigns (
              title,
              public_id,
              prize_image_urls
            )
          `)
          .eq('customer_phone', phoneNumber);

        console.log('🔍 Direct query result:', {
          found: directData?.length || 0,
          error: directError
        });

        // Se a query direta encontrou dados, há um problema na função RPC
        if (directData && directData.length > 0) {
          console.log('⚠️ WARNING: Direct query found tickets but RPC did not!');
          console.log('This indicates an issue with the get_tickets_by_phone function.');

          // Transformar os dados da query direta para o formato esperado
          const transformedData: CustomerTicket[] = directData.map((ticket: any) => ({
            ticket_id: ticket.id,
            campaign_id: ticket.campaign_id,
            campaign_title: ticket.campaigns?.title || '',
            campaign_public_id: ticket.campaigns?.public_id || null,
            prize_image_urls: ticket.campaigns?.prize_image_urls || null,
            quota_number: ticket.quota_number,
            status: ticket.status,
            bought_at: ticket.bought_at,
            customer_name: ticket.customer_name,
            customer_email: ticket.customer_email,
            customer_phone: ticket.customer_phone
          }));

          return { data: transformedData, error: null };
        }

        // Se nem a query direta encontrou, espera 1 segundo e tenta RPC novamente
        console.log('⏳ No tickets found. Waiting 1s and retrying RPC...');
        await new Promise(resolve => setTimeout(resolve, 1000));

        const { data: retryData, error: retryError } = await supabase.rpc('get_tickets_by_phone', {
          p_phone_number: phoneNumber
        });

        if (retryError) {
          console.error('❌ Retry failed:', retryError);
          return { data: null, error: retryError };
        }

        if (retryData && retryData.length > 0) {
          console.log(`✅ Retry successful! Found ${retryData.length} tickets`);
          return { data: retryData, error: null };
        }

        console.log('ℹ️ No tickets found after all attempts');
        return { data: [], error: null };
      }

      console.log('ℹ️ No tickets found');
      return { data: [], error: null };
    } catch (error) {
      console.error('❌ TicketsAPI.getTicketsByPhoneNumber - Unexpected error:', error);
      return { data: null, error };
    }
  }

  /**
   * Busca pedidos (orders) por número de telefone
   * Retorna pedidos agrupados em vez de tickets individuais
   *
   * O banco de dados faz matching flexível automaticamente.
   *
   * @param phoneNumber - Número de telefone (qualquer formato)
   */
  static async getOrdersByPhoneNumber(phoneNumber: string): Promise<{ data: CustomerOrder[] | null; error: any }> {
    try {
      console.log(`🔵 TicketsAPI.getOrdersByPhoneNumber - Searching with phone:`, phoneNumber);

      const { data, error } = await supabase.rpc('get_orders_by_phone', {
        p_phone_number: phoneNumber
      });

      if (error) {
        console.error('❌ TicketsAPI.getOrdersByPhoneNumber - Error:', error);
        return { data: null, error };
      }

      console.log(`✅ TicketsAPI.getOrdersByPhoneNumber - Found ${data?.length || 0} orders`);
      return { data, error };
    } catch (error) {
      console.error('❌ TicketsAPI.getOrdersByPhoneNumber - Unexpected error:', error);
      return { data: null, error };
    }
  }
}
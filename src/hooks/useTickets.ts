// src/hooks/useTickets.ts
import { useState, useEffect, useCallback } from 'react';
import { TicketsAPI, TicketStatusInfo, ReservationResult } from '../lib/api/tickets';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface CustomerData {
  name: string;
  email: string;
  phoneNumber: string;
  countryCode: string;
  acceptTerms: boolean;
}

/**
 * Tamanho do bloco para busca multi-páginas
 * Define quantos tickets são buscados por vez para respeitar o limite de 1000 do PostgREST
 */
const CHUNK_SIZE = 1000;

/**
 * Hook personalizado para gerenciar tickets
 * 
 * ✅ IMPLEMENTAÇÃO OTIMIZADA: Carrega tickets APENAS após reserva bem-sucedida
 * Usa busca multi-páginas em blocos de 1000 para contornar o limite do PostgREST
 */
export const useTickets = (campaignId: string) => {
  const { user } = useAuth();
  
  // Estado dos tickets (somente carregados após reserva)
  const [tickets, setTickets] = useState<TicketStatusInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reserving, setReserving] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  /**
   * ✅ FUNÇÃO COM BUSCA MULTI-PÁGINAS
   * 
   * Busca TODOS os tickets da campanha em blocos de 1000 (CHUNK_SIZE)
   * para contornar o limite de 1000 linhas do PostgREST.
   * 
   * ⚠️ IMPORTANTE: Esta função só é chamada APÓS reserva bem-sucedida
   * 
   * Fluxo:
   * 1. Busca informações da campanha para obter total_tickets
   * 2. Calcula quantas páginas são necessárias (total_tickets / CHUNK_SIZE)
   * 3. Faz requisições sequenciais para cada página
   * 4. Combina todos os resultados em um único array
   * 5. Atualiza o estado com todos os tickets
   */
  const fetchTicketsStatus = useCallback(async () => {
    if (!campaignId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    console.log(`📄 useTickets - Starting multi-page fetch for campaign ${campaignId}...`);

    try {
      // Passo 1: Buscar informações da campanha para obter total_tickets
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('total_tickets')
        .eq('id', campaignId)
        .maybeSingle();

      if (campaignError) {
        console.error('❌ useTickets - Error fetching campaign info:', campaignError);
        setError('Erro ao carregar informações da campanha');
        setTickets([]);
        setLoading(false);
        return;
      }

      if (!campaign) {
        console.warn(`⚠️ useTickets - Campaign not found: ${campaignId}`);
        setError('Campanha não encontrada');
        setTickets([]);
        setLoading(false);
        return;
      }

      const totalTickets = campaign.total_tickets;
      
      // Passo 2: Calcular quantas páginas são necessárias
      const totalPages = Math.ceil(totalTickets / CHUNK_SIZE);
      
      console.log(`📊 useTickets - Campaign has ${totalTickets} tickets`);
      console.log(`📊 useTickets - Will fetch ${totalPages} pages of ${CHUNK_SIZE} tickets each`);

      // Se não há tickets, retorna array vazio
      if (totalTickets === 0) {
        console.log('ℹ️ useTickets - Campaign has no tickets');
        setTickets([]);
        setLoading(false);
        return;
      }

      // Passo 3: Fazer requisições sequenciais para cada página
      const allTickets: TicketStatusInfo[] = [];
      
      for (let page = 1; page <= totalPages; page++) {
        console.log(`📄 useTickets - Fetching page ${page}/${totalPages}...`);
        
        const result = await TicketsAPI.getCampaignTicketsStatus(
          campaignId,
          user?.id,
          page,
          CHUNK_SIZE
        );

        if (result.error) {
          console.error(`❌ useTickets - Error fetching page ${page}:`, result.error);
          setError(`Erro ao carregar página ${page} das cotas`);
          // Em caso de erro, retorna o que foi coletado até agora
          break;
        }

        if (result.data && result.data.length > 0) {
          allTickets.push(...result.data);
          console.log(`✅ useTickets - Page ${page}/${totalPages} loaded (${result.data.length} tickets)`);
          console.log(`   Total accumulated: ${allTickets.length}/${totalTickets}`);
        } else {
          console.warn(`⚠️ useTickets - Page ${page} returned no data`);
        }
      }

      // Passo 4: Atualizar o estado com todos os tickets coletados
      console.log(`✅ useTickets - Multi-page fetch complete!`);
      console.log(`   Total tickets loaded: ${allTickets.length}/${totalTickets}`);
      
      if (allTickets.length < totalTickets) {
        console.warn(`⚠️ useTickets - Warning: Expected ${totalTickets} tickets but got ${allTickets.length}`);
      }

      setTickets(allTickets);
      
    } catch (error) {
      console.error('❌ useTickets - Exception in fetchTicketsStatus:', error);
      setError('Erro inesperado ao carregar cotas');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [campaignId, user?.id]);

  /**
   * Reserva cotas para o usuário atual
   * 
   * ✅ CORREÇÃO APLICADA: Carrega todos os tickets APÓS reserva bem-sucedida
   *
   * @param customerData - Dados do cliente (nome, email, telefone)
   * @param totalQuantity - Quantidade total de tickets a reservar
   * @param orderId - ID do pedido gerado no frontend
   * @param reservationTimestamp - Timestamp consistente para o pedido
   * @returns {Promise<{ reservationId: string; results: ReservationResult[] } | null>} Resultado da reserva ou null
   * @throws {Error} Lança erro com mensagem apropriada se a reserva falhar
   */
  const reserveTickets = async (
    customerData: CustomerData,
    totalQuantity: number,
    orderId: string,
    reservationTimestamp: Date
  ): Promise<{ reservationId: string; results: ReservationResult[] } | null> => {
    if (!campaignId || totalQuantity === 0) {
      const error = new Error('Dados inválidos para reserva');
      console.error('❌ useTickets.reserveTickets - Invalid data:', { campaignId, totalQuantity });
      throw error;
    }

    setReserving(true);
    setError(null);

    console.log('🔵 useTickets.reserveTickets - Starting reservation...');
    console.log('🔵 Campaign ID:', campaignId);
    console.log('🔵 Total Quantity:', totalQuantity);
    console.log('🔵 User ID:', user?.id || null);
    console.log('🔵 Customer Name:', customerData.name);
    console.log('🔵 Customer Email:', customerData.email);
    console.log('🔵 Customer Phone:', customerData.phoneNumber);
    console.log('🔵 Order ID:', orderId);
    console.log('🔵 Reservation Timestamp:', reservationTimestamp.toISOString());

    try {
      // Chamar o RPC reserve_tickets_by_quantity
      const { data, error: apiError } = await supabase.rpc('reserve_tickets_by_quantity', {
        p_campaign_id: campaignId,
        p_quantity_to_reserve: totalQuantity,
        p_user_id: user?.id || null,
        p_customer_name: customerData.name,
        p_customer_email: customerData.email,
        p_customer_phone: customerData.phoneNumber,
        p_reservation_timestamp: reservationTimestamp.toISOString(),
        p_order_id: orderId
      });

      if (apiError) {
        console.error('❌ useTickets.reserveTickets - API Error:', apiError);
        
        let errorMessage = 'Erro ao reservar cotas';
        
        if (typeof apiError === 'object' && apiError !== null) {
          if ('message' in apiError && apiError.message) {
            errorMessage = apiError.message as string;
          } else if ('error' in apiError && apiError.error) {
            errorMessage = apiError.error as string;
          } else if ('hint' in apiError && apiError.hint) {
            errorMessage = apiError.hint as string;
          }
        } else if (typeof apiError === 'string') {
          errorMessage = apiError;
        }
        
        setError(errorMessage);
        
        const error = new Error(errorMessage);
        throw error;
      }

      // data agora será um objeto jsonb (que é um array de resultados)
      // O Supabase retorna o JSONB como um array JavaScript diretamente
      const reservedResults: ReservationResult[] = data as ReservationResult[];

      if (!reservedResults || reservedResults.length === 0) {
        console.warn('⚠️ useTickets.reserveTickets - No data returned from API');
        const error = new Error('Nenhuma cota foi reservada. Tente novamente.');
        setError(error.message);
        throw error;
      }

      console.log(`✅ useTickets.reserveTickets - Successfully reserved ${reservedResults.length} tickets for Order ID: ${orderId}`);

      // ✅ CRÍTICO: Carrega TODOS os tickets APÓS reserva bem-sucedida
      console.log('🔄 useTickets.reserveTickets - Loading all tickets after successful reservation...');
      await fetchTicketsStatus();

      return { reservationId: orderId, results: reservedResults };
    } catch (error) {
      console.error('❌ useTickets.reserveTickets - Exception caught:', error);
      
      if (error instanceof Error) {
        throw error;
      } else {
        const genericError = new Error('Erro inesperado ao reservar cotas. Tente novamente.');
        setError(genericError.message);
        throw genericError;
      }
    } finally {
      setReserving(false);
    }
  };

  /**
   * Finaliza a compra das cotas reservadas
   * 
   * ✅ CORREÇÃO APLICADA: Lança erros apropriadamente
   */
  const finalizePurchase = async (quotaNumbers: number[]): Promise<ReservationResult[] | null> => {
    if (!user || !campaignId || quotaNumbers.length === 0) {
      const error = new Error('Usuário não autenticado ou dados inválidos');
      console.error('❌ useTickets.finalizePurchase - Invalid data');
      throw error;
    }

    setPurchasing(true);
    setError(null);

    console.log('🔵 useTickets.finalizePurchase - Starting purchase finalization...');

    try {
      const { data, error: apiError } = await TicketsAPI.finalizePurchase(
        campaignId,
        quotaNumbers,
        user.id
      );

      if (apiError) {
        console.error('❌ useTickets.finalizePurchase - API Error:', apiError);
        
        let errorMessage = 'Erro ao finalizar compra';
        
        if (typeof apiError === 'object' && apiError !== null) {
          if ('message' in apiError && apiError.message) {
            errorMessage = apiError.message as string;
          }
        } else if (typeof apiError === 'string') {
          errorMessage = apiError;
        }
        
        setError(errorMessage);
        const error = new Error(errorMessage);
        throw error;
      }

      console.log('✅ useTickets.finalizePurchase - Purchase finalized successfully');

      // Atualiza o status local após compra bem-sucedida
      await fetchTicketsStatus();

      return data;
    } catch (error) {
      console.error('❌ useTickets.finalizePurchase - Exception caught:', error);
      
      if (error instanceof Error) {
        throw error;
      } else {
        const genericError = new Error('Erro inesperado ao finalizar compra. Tente novamente.');
        setError(genericError.message);
        throw genericError;
      }
    } finally {
      setPurchasing(false);
    }
  };

  /**
   * ✅ FUNÇÕES DE FILTRO: Operam sobre os tickets carregados (após reserva)
   */

  /**
   * Obtém cotas por status
   */
  const getTicketsByStatus = useCallback((status: string) => {
    return tickets.filter(ticket => ticket.status === status);
  }, [tickets]);

  /**
   * Obtém cotas do usuário atual
   */
  const getMyTickets = useCallback(() => {
    return tickets.filter(ticket => ticket.is_mine);
  }, [tickets]);

  /**
   * Obtém cotas disponíveis
   */
  const getAvailableTickets = useCallback(() => {
    return tickets.filter(ticket => ticket.status === 'disponível');
  }, [tickets]);

  /**
   * Obtém cotas reservadas
   */
  const getReservedTickets = useCallback(() => {
    return tickets.filter(ticket => ticket.status === 'reservado');
  }, [tickets]);

  /**
   * Obtém cotas compradas
   */
  const getPurchasedTickets = useCallback(() => {
    return tickets.filter(ticket => ticket.status === 'comprado');
  }, [tickets]);

  /**
   * Verifica se uma cota específica está disponível
   */
  const isTicketAvailable = useCallback((quotaNumber: number) => {
    const ticket = tickets.find(t => t.quota_number === quotaNumber);
    return ticket?.status === 'disponível';
  }, [tickets]);

  /**
   * Verifica se uma cota específica pertence ao usuário atual
   */
  const isMyTicket = useCallback((quotaNumber: number) => {
    const ticket = tickets.find(t => t.quota_number === quotaNumber);
    return ticket?.is_mine || false;
  }, [tickets]);

  // ✅ REMOVIDO: useEffect que carregava tickets automaticamente ao entrar na página
  // Os tickets agora são carregados APENAS após reserva bem-sucedida

  // Configurar escuta em tempo real para mudanças nos tickets
  useEffect(() => {
    if (!campaignId) return;

    const channel = supabase
      .channel(`tickets_${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
          filter: `campaign_id=eq.${campaignId}`
        },
        (payload) => {
          console.log('🔔 Ticket change detected:', payload);
          // Recarrega todos os tickets quando há mudanças (via multi-páginas)
          // Só recarrega se já temos tickets carregados
          if (tickets.length > 0) {
            fetchTicketsStatus();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId, fetchTicketsStatus, tickets.length]);

  return {
    // Estado dos tickets
    tickets,
    loading,
    error,
    reserving,
    purchasing,

    // Funções de operação
    fetchTicketsStatus,
    reserveTickets,
    finalizePurchase,

    // Funções de filtro (operam sobre os tickets carregados após reserva)
    getTicketsByStatus,
    getMyTickets,
    getAvailableTickets,
    getReservedTickets,
    getPurchasedTickets,
    isTicketAvailable,
    isMyTicket
  };
};
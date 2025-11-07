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
 * Hook personalizado para gerenciar tickets com suporte a PAGINAÇÃO
 * 
 * ✨ ATUALIZAÇÃO: Agora suporta paginação para melhor performance
 * em campanhas com muitas cotas (ex: 100.000 cotas)
 */
export const useTickets = (campaignId: string, initialPageSize: number = 1000) => {
  const { user } = useAuth();
  
  // Estado dos tickets (apenas da página atual)
  const [tickets, setTickets] = useState<TicketStatusInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reserving, setReserving] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  // Estado de paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [totalTickets, setTotalTickets] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  /**
   * ✨ FUNÇÃO ATUALIZADA: Busca o status dos tickets com paginação
   * Agora usa getCampaignTicketsStatus que retorna PaginatedTicketsResponse
   * 
   * @param page - Número da página (default: página atual)
   * @param size - Tamanho da página (default: pageSize atual)
   */
  const fetchTicketsStatus = useCallback(async (
    page: number = currentPage,
    size: number = pageSize
  ) => {
    if (!campaignId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    console.log(`📄 useTickets - Fetching page ${page} with size ${size}...`);

    // ✅ CORREÇÃO: Usar getCampaignTicketsStatus que agora retorna PaginatedTicketsResponse
    const result = await TicketsAPI.getCampaignTicketsStatus(
      campaignId,
      user?.id,
      page,
      size
    );

    if (result.error) {
      setError('Erro ao carregar status das cotas');
      console.error('❌ Error fetching tickets status:', result.error);
      setTickets([]);
    } else {
      setTickets(result.data || []);
      setTotalTickets(result.total);
      setTotalPages(result.totalPages);
      setCurrentPage(result.page);
      
      console.log(`✅ useTickets - Loaded page ${result.page}/${result.totalPages} (${result.data?.length || 0} tickets)`);
    }

    setLoading(false);
  }, [campaignId, user?.id, currentPage, pageSize]);

  /**
   * ✨ NOVA FUNÇÃO: Navega para uma página específica
   */
  const goToPage = useCallback(async (page: number) => {
    if (page < 1 || page > totalPages) {
      console.warn(`⚠️ Invalid page number: ${page} (valid range: 1-${totalPages})`);
      return;
    }

    await fetchTicketsStatus(page, pageSize);
  }, [totalPages, pageSize, fetchTicketsStatus]);

  /**
   * ✨ NOVA FUNÇÃO: Vai para a próxima página
   */
  const nextPage = useCallback(async () => {
    if (currentPage < totalPages) {
      await goToPage(currentPage + 1);
    }
  }, [currentPage, totalPages, goToPage]);

  /**
   * ✨ NOVA FUNÇÃO: Vai para a página anterior
   */
  const previousPage = useCallback(async () => {
    if (currentPage > 1) {
      await goToPage(currentPage - 1);
    }
  }, [currentPage, goToPage]);

  /**
   * ✨ NOVA FUNÇÃO: Vai para a primeira página
   */
  const firstPage = useCallback(async () => {
    await goToPage(1);
  }, [goToPage]);

  /**
   * ✨ NOVA FUNÇÃO: Vai para a última página
   */
  const lastPage = useCallback(async () => {
    await goToPage(totalPages);
  }, [totalPages, goToPage]);

  /**
   * ✨ NOVA FUNÇÃO: Altera o tamanho da página
   */
  const changePageSize = useCallback(async (newSize: number) => {
    setPageSize(newSize);
    // Ao mudar o tamanho da página, volta para a primeira página
    await fetchTicketsStatus(1, newSize);
  }, [fetchTicketsStatus]);

  /**
   * Reserva cotas para o usuário atual
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
      // CRITICAL FIX: Chamar o novo RPC reserve_tickets_by_quantity
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

      // CRITICAL CHANGE: data agora será um objeto jsonb (que é um array de resultados)
      // O Supabase retorna o JSONB como um array JavaScript diretamente
      const reservedResults: ReservationResult[] = data as ReservationResult[];

      if (!reservedResults || reservedResults.length === 0) {
        console.warn('⚠️ useTickets.reserveTickets - No data returned from API');
        const error = new Error('Nenhuma cota foi reservada. Tente novamente.');
        setError(error.message);
        throw error;
      }

      console.log(`✅ useTickets.reserveTickets - Successfully reserved ${reservedResults.length} tickets for Order ID: ${orderId}`);

      // Atualiza o status local após reserva bem-sucedida
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
   * ⚠️ OBSERVAÇÃO: As funções abaixo operam apenas sobre os tickets da PÁGINA ATUAL
   * Para buscar por todos os tickets, seria necessário carregar todas as páginas
   * (o que voltaria ao problema original de lentidão)
   */

  /**
   * Obtém cotas por status (apenas da página atual)
   */
  const getTicketsByStatus = useCallback((status: string) => {
    return tickets.filter(ticket => ticket.status === status);
  }, [tickets]);

  /**
   * Obtém cotas do usuário atual (apenas da página atual)
   */
  const getMyTickets = useCallback(() => {
    return tickets.filter(ticket => ticket.is_mine);
  }, [tickets]);

  /**
   * Obtém cotas disponíveis (apenas da página atual)
   */
  const getAvailableTickets = useCallback(() => {
    return tickets.filter(ticket => ticket.status === 'disponível');
  }, [tickets]);

  /**
   * Obtém cotas reservadas (apenas da página atual)
   */
  const getReservedTickets = useCallback(() => {
    return tickets.filter(ticket => ticket.status === 'reservado');
  }, [tickets]);

  /**
   * Obtém cotas compradas (apenas da página atual)
   */
  const getPurchasedTickets = useCallback(() => {
    return tickets.filter(ticket => ticket.status === 'comprado');
  }, [tickets]);

  /**
   * Verifica se uma cota específica está disponível (apenas da página atual)
   */
  const isTicketAvailable = useCallback((quotaNumber: number) => {
    const ticket = tickets.find(t => t.quota_number === quotaNumber);
    return ticket?.status === 'disponível';
  }, [tickets]);

  /**
   * Verifica se uma cota específica pertence ao usuário atual (apenas da página atual)
   */
  const isMyTicket = useCallback((quotaNumber: number) => {
    const ticket = tickets.find(t => t.quota_number === quotaNumber);
    return ticket?.is_mine || false;
  }, [tickets]);

  // Busca inicial dos tickets (primeira página)
  useEffect(() => {
    fetchTicketsStatus(1, pageSize);
  }, [campaignId, user?.id]); // Removido fetchTicketsStatus das dependências para evitar loop

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
          // Recarrega apenas a página atual quando há mudanças
          fetchTicketsStatus(currentPage, pageSize);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId, currentPage, pageSize]); // Dependências corretas para realtime

  return {
    // Estado dos tickets
    tickets,
    loading,
    error,
    reserving,
    purchasing,

    // Estado de paginação
    currentPage,
    pageSize,
    totalTickets,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,

    // Funções de paginação
    goToPage,
    nextPage,
    previousPage,
    firstPage,
    lastPage,
    changePageSize,

    // Funções de operação
    fetchTicketsStatus,
    reserveTickets,
    finalizePurchase,

    // Funções de filtro (operam na página atual)
    getTicketsByStatus,
    getMyTickets,
    getAvailableTickets,
    getReservedTickets,
    getPurchasedTickets,
    isTicketAvailable,
    isMyTicket
  };
};
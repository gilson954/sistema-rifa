// src/hooks/useTickets.ts
import { useState, useCallback, useEffect } from 'react';
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
 * ✅ IMPLEMENTAÇÃO SOB DEMANDA: Não carrega tickets automaticamente
 * ✅ IMPLEMENTAÇÃO MULTI-PÁGINAS: Busca todos os tickets em blocos de 1000 quando solicitado
 * ✅ ATUALIZAÇÃO INTELIGENTE: Atualiza estado local após operações sem recarregar tudo
 * 
 * O componente pai (CampaignPage.tsx) decide quando chamar refetchTickets()
 */
export const useTickets = (campaignId: string) => {
  const { user } = useAuth();
  
  // Estado dos tickets (inicialmente vazio, carregado sob demanda)
  const [tickets, setTickets] = useState<TicketStatusInfo[]>([]);
  const [loading, setLoading] = useState(false); // ✅ Começa como false (sem carregamento automático)
  const [error, setError] = useState<string | null>(null);
  const [reserving, setReserving] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  /**
   * ✅ FUNÇÃO AUXILIAR: Atualiza tickets localmente com base nos resultados de uma operação
   * 
   * Esta função "mescla" os resultados de uma reserva ou compra no estado atual dos tickets,
   * evitando a necessidade de recarregar todos os 100.000 tickets.
   * 
   * @param results - Array de ReservationResult da RPC
   * @param newStatus - Novo status dos tickets ('reservado' ou 'comprado')
   */
  const updateTicketsLocally = useCallback((results: ReservationResult[], newStatus: 'reservado' | 'comprado') => {
    if (!results || results.length === 0) {
      console.warn('⚠️ updateTicketsLocally - No results to update');
      return;
    }

    console.log(`🔄 updateTicketsLocally - Updating ${results.length} tickets to status '${newStatus}'`);

    setTickets(prevTickets => {
      // Se não há tickets carregados, não há nada para atualizar
      if (prevTickets.length === 0) {
        console.log('ℹ️ updateTicketsLocally - No tickets loaded, skipping local update');
        return prevTickets;
      }

      // Criar um Set com os quota_numbers afetados para busca rápida
      const affectedQuotaNumbers = new Set(results.map(r => r.quota_number));

      // Atualizar os tickets afetados
      const updatedTickets = prevTickets.map(ticket => {
        if (affectedQuotaNumbers.has(ticket.quota_number)) {
          console.log(`   Updating ticket ${ticket.quota_number}: ${ticket.status} -> ${newStatus}`);
          return {
            ...ticket,
            status: newStatus,
            is_mine: newStatus === 'reservado' || newStatus === 'comprado' ? true : ticket.is_mine
          };
        }
        return ticket;
      });

      console.log(`✅ updateTicketsLocally - Successfully updated ${results.length} tickets locally`);
      return updatedTickets;
    });
  }, []);

  /**
   * ✅ FUNÇÃO COM BUSCA MULTI-PÁGINAS (SOB DEMANDA)
   * 
   * Busca TODOS os tickets da campanha em blocos de 1000 (CHUNK_SIZE)
   * para contornar o limite de 1000 linhas do PostgREST.
   * 
   * Esta função NÃO é chamada automaticamente na montagem do componente.
   * O componente pai deve chamá-la explicitamente quando precisar dos dados.
   * 
   * Fluxo:
   * 1. Busca informações da campanha para obter total_tickets
   * 2. Calcula quantas páginas são necessárias (total_tickets / CHUNK_SIZE)
   * 3. Faz requisições sequenciais para cada página
   * 4. Combina todos os resultados em um único array
   * 5. Atualiza o estado com todos os tickets
   */
  const refetchTickets = useCallback(async () => {
    if (!campaignId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    console.log(`📄 useTickets.refetchTickets - Starting multi-page fetch for campaign ${campaignId}...`);

    try {
      // Passo 1: Buscar informações da campanha para obter total_tickets
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('total_tickets')
        .eq('id', campaignId)
        .maybeSingle();

      if (campaignError) {
        console.error('❌ useTickets.refetchTickets - Error fetching campaign info:', campaignError);
        setError('Erro ao carregar informações da campanha');
        setTickets([]);
        setLoading(false);
        return;
      }

      if (!campaign) {
        console.warn(`⚠️ useTickets.refetchTickets - Campaign not found: ${campaignId}`);
        setError('Campanha não encontrada');
        setTickets([]);
        setLoading(false);
        return;
      }

      const totalTickets = campaign.total_tickets;
      
      // Passo 2: Calcular quantas páginas são necessárias
      const totalPages = Math.ceil(totalTickets / CHUNK_SIZE);
      
      console.log(`📊 useTickets.refetchTickets - Campaign has ${totalTickets} tickets`);
      console.log(`📊 useTickets.refetchTickets - Will fetch ${totalPages} pages of ${CHUNK_SIZE} tickets each`);

      // Se não há tickets, retorna array vazio
      if (totalTickets === 0) {
        console.log('ℹ️ useTickets.refetchTickets - Campaign has no tickets');
        setTickets([]);
        setLoading(false);
        return;
      }

      // Passo 3: Fazer requisições sequenciais para cada página
      const allTickets: TicketStatusInfo[] = [];
      
      for (let page = 1; page <= totalPages; page++) {
        console.log(`📄 useTickets.refetchTickets - Fetching page ${page}/${totalPages}...`);
        
        const result = await TicketsAPI.getCampaignTicketsStatus(
          campaignId,
          user?.id,
          page,
          CHUNK_SIZE
        );

        if (result.error) {
          console.error(`❌ useTickets.refetchTickets - Error fetching page ${page}:`, result.error);
          setError(`Erro ao carregar página ${page} das cotas`);
          // Em caso de erro, retorna o que foi coletado até agora
          break;
        }

        if (result.data && result.data.length > 0) {
          allTickets.push(...result.data);
          console.log(`✅ useTickets.refetchTickets - Page ${page}/${totalPages} loaded (${result.data.length} tickets)`);
          console.log(`   Total accumulated: ${allTickets.length}/${totalTickets}`);
        } else {
          console.warn(`⚠️ useTickets.refetchTickets - Page ${page} returned no data`);
        }
      }

      // Passo 4: Atualizar o estado com todos os tickets coletados
      console.log(`✅ useTickets.refetchTickets - Multi-page fetch complete!`);
      console.log(`   Total tickets loaded: ${allTickets.length}/${totalTickets}`);
      
      if (allTickets.length < totalTickets) {
        console.warn(`⚠️ useTickets.refetchTickets - Warning: Expected ${totalTickets} tickets but got ${allTickets.length}`);
      }

      setTickets(allTickets);
      
    } catch (error) {
      console.error('❌ useTickets.refetchTickets - Exception in refetchTickets:', error);
      setError('Erro inesperado ao carregar cotas');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [campaignId, user?.id]);

  /**
   * Reserva cotas para o usuário atual
   *
   * ✅ ATUALIZAÇÃO INTELIGENTE: Atualiza o estado local sem recarregar todos os tickets
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

      // O Supabase retorna o JSONB como um array JavaScript diretamente
      const reservedResults: ReservationResult[] = data as ReservationResult[];

      if (!reservedResults || reservedResults.length === 0) {
        console.warn('⚠️ useTickets.reserveTickets - No data returned from API');
        const error = new Error('Nenhuma cota foi reservada. Tente novamente.');
        setError(error.message);
        throw error;
      }

      console.log(`✅ useTickets.reserveTickets - Successfully reserved ${reservedResults.length} tickets for Order ID: ${orderId}`);

      // ✅ ATUALIZAÇÃO INTELIGENTE: Atualiza apenas os tickets afetados localmente
      // Em vez de recarregar todos os 100.000 tickets, mescla os resultados no estado atual
      updateTicketsLocally(reservedResults, 'reservado');

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
   * ✅ ATUALIZAÇÃO INTELIGENTE: Atualiza o estado local sem recarregar todos os tickets
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

      // ✅ ATUALIZAÇÃO INTELIGENTE: Atualiza apenas os tickets afetados localmente
      // Em vez de recarregar todos os 100.000 tickets, mescla os resultados no estado atual
      if (data && data.length > 0) {
        updateTicketsLocally(data, 'comprado');
      }

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
   * ✅ FUNÇÕES DE FILTRO: Operam sobre os tickets carregados
   * (que só existem se refetchTickets() foi chamado explicitamente)
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

  /**
   * ✅ MUDANÇA CRÍTICA: useEffect de real-time agora só recarrega se tickets já foram carregados
   * Isso evita um carregamento completo desnecessário ao entrar na página
   */
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
          // ✅ Só recarrega se já houver tickets carregados (evita recarregar se nunca foi carregado)
          if (tickets.length > 0) {
            console.log('🔄 Reloading tickets due to real-time change...');
            refetchTickets();
          } else {
            console.log('ℹ️ Real-time change detected, but tickets not loaded yet. Skipping reload.');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId, refetchTickets, tickets.length]);

  return {
    // Estado dos tickets
    tickets,
    loading,
    error,
    reserving,
    purchasing,

    // ✅ FUNÇÃO EXPOSTA: Permite ao componente pai controlar o carregamento
    refetchTickets,

    // Funções de operação
    reserveTickets,
    finalizePurchase,

    // Funções de filtro (operam sobre os tickets carregados)
    getTicketsByStatus,
    getMyTickets,
    getAvailableTickets,
    getReservedTickets,
    getPurchasedTickets,
    isTicketAvailable,
    isMyTicket
  };
};
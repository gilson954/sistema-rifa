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
 * Tamanho do lote para reservas
 * Define quantos tickets são reservados por vez para evitar timeout do banco de dados
 * ✅ OTIMIZAÇÃO: Evita que uma única chamada RPC exceda o timeout do Supabase
 */
const RESERVATION_BATCH_SIZE = 1000;

/**
 * Hook personalizado para gerenciar tickets
 * 
 * ✅ OTIMIZAÇÃO RADICAL: Nunca carrega todos os tickets automaticamente
 * ✅ ATUALIZAÇÃO GRANULAR: Apenas tickets afetados por operações são adicionados/atualizados
 * ✅ REAL-TIME INTELIGENTE: Mudanças externas são aplicadas granularmente
 * 
 * O estado 'tickets' contém apenas os tickets que foram explicitamente carregados
 * ou que foram afetados por operações (reserva/compra)
 */
export const useTickets = (campaignId: string) => {
  const { user } = useAuth();
  
  // Estado dos tickets (inicialmente vazio, populado apenas sob demanda)
  const [tickets, setTickets] = useState<TicketStatusInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reserving, setReserving] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  /**
   * ✅ FUNÇÃO AUXILIAR: Atualiza tickets localmente com base nos resultados de uma operação
   * 
   * Esta função é a PRINCIPAL responsável por gerenciar o estado 'tickets'.
   * Ela adiciona novos tickets ou atualiza existentes de forma granular.
   * 
   * ✅ INTELIGENTE: Se o estado estiver vazio, cria novos objetos TicketStatusInfo
   * ✅ EFICIENTE: Se o estado estiver populado, apenas atualiza os tickets afetados
   * 
   * @param results - Array de ReservationResult da RPC
   * @param newStatus - Novo status dos tickets ('reservado' ou 'comprado')
   */
  const updateTicketsLocally = useCallback((results: ReservationResult[], newStatus: 'reservado' | 'comprado') => {
    if (!results || results.length === 0) {
      console.warn('⚠️ updateTicketsLocally - No results to update');
      return;
    }

    console.log(`🔄 updateTicketsLocally - Processing ${results.length} tickets with status '${newStatus}'`);

    setTickets(prevTickets => {
      // Criar um Map dos tickets existentes para busca rápida por quota_number
      const existingTicketsMap = new Map(
        prevTickets.map(ticket => [ticket.quota_number, ticket])
      );

      // Array para novos tickets (que não existem no estado atual)
      const newTickets: TicketStatusInfo[] = [];

      // Processar cada resultado
      results.forEach(result => {
        const existingTicket = existingTicketsMap.get(result.quota_number);

        if (!existingTicket) {
          // ✅ Ticket não existe no estado → Criar novo objeto TicketStatusInfo
          console.log(`   Creating new ticket ${result.quota_number} with status '${newStatus}'`);
          newTickets.push({
            quota_number: result.quota_number,
            status: newStatus,
            is_mine: true,
            campaign_id: campaignId, // Adicionar campaign_id
            user_id: user?.id || null, // Adicionar user_id
            customer_name: result.customer_name || null,
            customer_email: result.customer_email || null,
            customer_phone: result.customer_phone || null,
            reserved_at: result.reserved_at || null,
            bought_at: newStatus === 'comprado' ? new Date().toISOString() : null // Usar bought_at
          });
        } else {
          // ✅ Ticket existe → Atualizar no Map
          console.log(`   Updating existing ticket ${result.quota_number}: ${existingTicket.status} -> ${newStatus}`);
          existingTicketsMap.set(result.quota_number, {
            ...existingTicket,
            status: newStatus,
            is_mine: true,
            bought_at: newStatus === 'comprado' ? new Date().toISOString() : existingTicket.bought_at
          });
        }
      });

      // Combinar tickets existentes (atualizados) + novos tickets
      const updatedTickets = [
        ...Array.from(existingTicketsMap.values()),
        ...newTickets
      ];

      console.log(`✅ updateTicketsLocally - Complete!`);
      console.log(`   Tickets existentes atualizados: ${prevTickets.length - newTickets.length}`);
      console.log(`   Novos tickets criados: ${newTickets.length}`);
      console.log(`   Total de tickets no estado: ${updatedTickets.length}`);

      return updatedTickets;
    });
  }, [campaignId, user?.id]);

  /**
   * ✅ FUNÇÃO INTERNA: Busca multi-páginas de todos os tickets (USO LIMITADO)
   * 
   * Esta função NÃO é exposta para o componente pai.
   * Ela só deve ser usada em casos muito específicos onde é necessário
   * carregar todos os tickets da campanha (ex: exibir grid completo).
   * 
   * IMPORTANTE: Esta função NÃO é chamada automaticamente em nenhum momento.
   */
  const fetchVisibleTickets = useCallback(async (page: number, pageSize: number) => {
    if (!campaignId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    console.log(`📄 useTickets.fetchVisibleTickets - Starting multi-page fetch for campaign ${campaignId}...`);

    try {
      // Passo 1: Buscar informações da campanha para obter total_tickets
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('total_tickets')
        .eq('id', campaignId)
        .maybeSingle();

      if (campaignError) {
        console.error('❌ useTickets.fetchVisibleTickets - Error fetching campaign info:', campaignError);
        setError('Erro ao carregar informações da campanha');
        setTickets([]);
        setLoading(false);
        return;
      }

      if (!campaign) {
        console.warn(`⚠️ useTickets.fetchVisibleTickets - Campaign not found: ${campaignId}`);
        setError('Campanha não encontrada');
        setTickets([]);
        setLoading(false);
        return;
      }

      const totalTickets = campaign.total_tickets;
      const totalPages = Math.ceil(totalTickets / pageSize); // Usar pageSize para calcular totalPages
      
      console.log(`📊 useTickets.fetchVisibleTickets - Campaign has ${totalTickets} tickets`);
      console.log(`📊 useTickets.fetchVisibleTickets - Will fetch page ${page}/${totalPages} of ${pageSize} tickets each`);

      if (totalTickets === 0) {
        console.log('ℹ️ useTickets.fetchVisibleTickets - Campaign has no tickets');
        setTickets([]);
        setLoading(false);
        return;
      }

      // Passo 2: Fazer requisição para a página específica
      const result = await TicketsAPI.getCampaignTicketsStatus(
        campaignId,
        user?.id,
        page,
        pageSize
      );

      if (result.error) {
        console.error(`❌ useTickets.fetchVisibleTickets - Error fetching page ${page}:`, result.error);
        setError(`Erro ao carregar página ${page} das cotas`);
        setLoading(false);
        return;
      }

      if (result.data && result.data.length > 0) {
        setTickets(prev => {
          const existingQuotaNumbers = new Set(prev.map(t => t.quota_number));
          const newTickets = result.data.filter(t => !existingQuotaNumbers.has(t.quota_number));
          return [...prev, ...newTickets];
        });
        console.log(`✅ useTickets.fetchVisibleTickets - Page ${page}/${totalPages} loaded (${result.data.length} tickets)`);
      } else {
        console.log(`ℹ️ useTickets.fetchVisibleTickets - Page ${page}/${totalPages} returned no new tickets`);
      }
      
    } catch (error) {
      console.error('❌ useTickets.fetchVisibleTickets - Exception:', error);
      setError('Erro inesperado ao carregar cotas');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [campaignId, user?.id]);

  /**
   * Reserva cotas para o usuário atual
   *
   * ✅ ATUALIZAÇÃO GRANULAR: Apenas os tickets reservados são adicionados/atualizados no estado
   * ✅ BATCHING: Divide reservas grandes em lotes para evitar timeout do banco de dados
   * 
   * @param customerData - Dados do cliente (nome, email, telefone)
   * @param totalQuantity - Quantidade total de tickets a reservar
   * @param orderId - ID do pedido gerado no frontend
   * @param reservationTimestamp - Timestamp consistente para o pedido
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

    console.log('🔵 useTickets.reserveTickets - Starting reservation with batching...');
    console.log('🔵 Campaign ID:', campaignId);
    console.log('🔵 Total Quantity:', totalQuantity);
    console.log('🔵 Order ID:', orderId);

    try {
      // ✅ BATCHING: Calcular quantos lotes são necessários
      const totalBatches = Math.ceil(totalQuantity / RESERVATION_BATCH_SIZE);
      const allReservedResults: ReservationResult[] = [];

      console.log(`📊 Reservation will be processed in ${totalBatches} batch(es) of max ${RESERVATION_BATCH_SIZE} tickets each`);

      // ✅ PROCESSAR EM LOTES
      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        // Calcular quantos tickets reservar neste lote
        const remainingTickets = totalQuantity - (batchIndex * RESERVATION_BATCH_SIZE);
        const batchQuantity = Math.min(RESERVATION_BATCH_SIZE, remainingTickets);

        console.log(`📦 Processing batch ${batchIndex + 1}/${totalBatches}: ${batchQuantity} tickets`);

        // Chamar RPC para este lote
        const { data, error: apiError } = await supabase.rpc('reserve_tickets_by_quantity', {
          p_campaign_id: campaignId,
          p_quantity_to_reserve: batchQuantity, // Passar a quantidade do lote
          p_user_id: user?.id || null,
          p_customer_name: customerData.name,
          p_customer_email: customerData.email,
          p_customer_phone: customerData.phoneNumber,
          p_reservation_timestamp: reservationTimestamp.toISOString(),
          p_order_id: orderId
        });

        if (apiError) {
          console.error(`❌ useTickets.reserveTickets - API Error in batch ${batchIndex + 1}:`, apiError);
          
          let errorMessage = `Erro ao reservar cotas (lote ${batchIndex + 1}/${totalBatches})`;
          
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
          
          // Se já reservamos alguns tickets, atualizar o estado com o que conseguimos
          if (allReservedResults.length > 0) {
            console.warn(`⚠️ Partial reservation: ${allReservedResults.length} tickets reserved before error`);
            updateTicketsLocally(allReservedResults, 'reservado');
          }
          
          throw new Error(errorMessage);
        }

        const batchResults: ReservationResult[] = data as ReservationResult[];

        if (!batchResults || batchResults.length === 0) {
          console.warn(`⚠️ useTickets.reserveTickets - Batch ${batchIndex + 1} returned no data`);
          
          // Se já reservamos alguns tickets, continuar
          if (allReservedResults.length > 0) {
            console.warn(`⚠️ Partial reservation: ${allReservedResults.length} tickets reserved`);
            break;
          }
          
          const error = new Error('Nenhuma cota foi reservada. Tente novamente.');
          setError(error.message);
          throw error;
        }

        // Adicionar resultados deste lote ao array total
        allReservedResults.push(...batchResults);
        console.log(`✅ Batch ${batchIndex + 1}/${totalBatches} complete: ${batchResults.length} tickets reserved`);
        console.log(`   Total reserved so far: ${allReservedResults.length}/${totalQuantity}`);

        // ✅ ATUALIZAÇÃO GRANULAR INCREMENTAL: Atualiza o estado após cada lote
        // Isso melhora a UX mostrando progresso em tempo real
        updateTicketsLocally(batchResults, 'reservado');
      }

      console.log(`✅ useTickets.reserveTickets - All batches complete! Total reserved: ${allReservedResults.length} tickets`);

      return { reservationId: orderId, results: allReservedResults };
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
   * ✅ ATUALIZAÇÃO GRANULAR: Apenas os tickets comprados são atualizados no estado
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
        throw new Error(errorMessage);
      }

      console.log('✅ useTickets.finalizePurchase - Purchase finalized successfully');

      // ✅ ATUALIZAÇÃO GRANULAR: Atualiza apenas os tickets comprados
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
   * ✅ FUNÇÕES DE FILTRO: Operam sobre os tickets carregados no estado
   */

  const getTicketsByStatus = useCallback((status: string) => {
    return tickets.filter(ticket => ticket.status === status);
  }, [tickets]);

  const getMyTickets = useCallback(() => {
    return tickets.filter(ticket => ticket.is_mine);
  }, [tickets]);

  const getAvailableTickets = useCallback(() => {
    return tickets.filter(ticket => ticket.status === 'disponível');
  }, [tickets]);

  const getReservedTickets = useCallback(() => {
    return tickets.filter(ticket => ticket.status === 'reservado');
  }, [tickets]);

  const getPurchasedTickets = useCallback(() => {
    return tickets.filter(ticket => ticket.status === 'comprado');
  }, [tickets]);

  const isTicketAvailable = useCallback((quotaNumber: number) => {
    const ticket = tickets.find(t => t.quota_number === quotaNumber);
    return ticket?.status === 'disponível';
  }, [tickets]);

  const isMyTicket = useCallback((quotaNumber: number) => {
    const ticket = tickets.find(t => t.quota_number === quotaNumber);
    return ticket?.is_mine || false;
  }, [tickets]);

  /**
   * ✅ REAL-TIME INTELIGENTE: Atualiza apenas o ticket que mudou
   * 
   * Em vez de recarregar todos os tickets, aplica a mudança granularmente
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
          console.log('🔔 Real-time ticket change detected:', payload);
          
          // ✅ Aplicar mudança granularmente usando o payload.new
          if (payload.new && typeof payload.new === 'object') {
            const changedTicket = payload.new as any;
            
            // Criar um ReservationResult a partir do payload
            const result: ReservationResult = {
              quota_number: changedTicket.quota_number,
              customer_name: changedTicket.customer_name,
              customer_email: changedTicket.customer_email,
              customer_phone: changedTicket.customer_phone,
              reserved_at: changedTicket.reserved_at
            };

            // Determinar o novo status
            const newStatus = changedTicket.status as 'reservado' | 'comprado';
            
            console.log(`🔄 Applying real-time update for ticket ${result.quota_number} -> ${newStatus}`);
            updateTicketsLocally([result], newStatus);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId, updateTicketsLocally]);

  return {
    // Estado dos tickets (contém apenas tickets explicitamente carregados ou afetados por operações)
    tickets,
    loading,
    error,
    reserving,
    purchasing,

    // ✅ refetchTickets NÃO é exposto - carregamento completo deve ser evitado
    // Se necessário para casos específicos (como QuotaGrid completo), pode ser adicionado aqui
    fetchVisibleTickets, // EXPOR A FUNÇÃO AQUI

    // Funções de operação
    reserveTickets,
    finalizePurchase,

    // Funções de filtro
    getTicketsByStatus,
    getMyTickets,
    getAvailableTickets,
    getReservedTickets,
    getPurchasedTickets,
    isTicketAvailable,
    isMyTicket
  };
};

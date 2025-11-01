import { useState, useEffect, useCallback } from 'react';
import { TicketsAPI, TicketStatusInfo, ReservationResult } from '../lib/api/tickets';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export const useTickets = (campaignId: string) => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<TicketStatusInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reserving, setReserving] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  /**
   * Busca o status dos tickets da campanha
   */
  const fetchTicketsStatus = useCallback(async () => {
    if (!campaignId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: apiError } = await TicketsAPI.getCampaignTicketsStatus(
      campaignId,
      user?.id
    );

    if (apiError) {
      setError('Erro ao carregar status das cotas');
      console.error('Error fetching tickets status:', apiError);
    } else {
      setTickets(data || []);
    }

    setLoading(false);
  }, [campaignId, user?.id]);

  /**
   * Reserva cotas para o usuário atual
   * 
   * ✅ CORREÇÃO APLICADA: Agora lança erros corretamente para serem capturados pelo ReservationModal
   * 
   * @throws {Error} Lança erro com mensagem apropriada se a reserva falhar
   * @returns {Promise<ReservationResult[] | null>} Resultado da reserva ou null
   */
  const reserveTickets = async (
    quotaNumbers: number[],
    userId: string | null = null,
    customerName: string = '',
    customerEmail: string = '',
    customerPhone: string = ''
  ): Promise<ReservationResult[] | null> => {
    if (!campaignId || quotaNumbers.length === 0) {
      const error = new Error('Dados inválidos para reserva');
      console.error('❌ useTickets.reserveTickets - Invalid data:', { campaignId, quotaNumbers });
      throw error; // ✅ CRITICAL FIX: Lançar erro
    }

    setReserving(true);
    setError(null);

    console.log('🔵 useTickets.reserveTickets - Starting reservation...');
    console.log('🔵 Campaign ID:', campaignId);
    console.log('🔵 Quota Numbers:', quotaNumbers);
    console.log('🔵 User ID:', userId || user?.id || null);
    console.log('🔵 Customer Name:', customerName);
    console.log('🔵 Customer Email:', customerEmail);
    console.log('🔵 Customer Phone:', customerPhone);

    try {
      const { data, error: apiError } = await TicketsAPI.reserveTickets(
        campaignId,
        quotaNumbers,
        userId || user?.id || null,
        customerName,
        customerEmail,
        customerPhone
      );

      if (apiError) {
        console.error('❌ useTickets.reserveTickets - API Error:', apiError);
        
        // ✅ CRITICAL FIX: Criar mensagem de erro mais informativa
        let errorMessage = 'Erro ao reservar cotas';
        
        // Verificar se há uma mensagem de erro específica da API
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
        
        // ✅ CRITICAL FIX: Lançar o erro com a mensagem apropriada
        const error = new Error(errorMessage);
        throw error;
      }

      if (!data || data.length === 0) {
        console.warn('⚠️ useTickets.reserveTickets - No data returned from API');
        const error = new Error('Nenhuma cota foi reservada. Tente novamente.');
        setError(error.message);
        throw error;
      }

      console.log(`✅ useTickets.reserveTickets - Successfully reserved ${data.length} tickets`);

      // Atualiza o status local após reserva bem-sucedida
      await fetchTicketsStatus();

      return data;
    } catch (error) {
      console.error('❌ useTickets.reserveTickets - Exception caught:', error);
      
      // ✅ CRITICAL FIX: Se o erro já foi tratado acima, apenas relançar
      // Se for um erro inesperado, criar uma mensagem genérica
      if (error instanceof Error) {
        throw error; // Relançar o erro que já tem mensagem
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

  // Busca inicial dos tickets
  useEffect(() => {
    fetchTicketsStatus();
  }, [fetchTicketsStatus]);

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
          console.log('Ticket change detected:', payload);
          // Recarrega o status dos tickets quando há mudanças
          fetchTicketsStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId, fetchTicketsStatus]);

  return {
    tickets,
    loading,
    error,
    reserving,
    purchasing,
    fetchTicketsStatus,
    reserveTickets,
    finalizePurchase,
    getTicketsByStatus,
    getMyTickets,
    getAvailableTickets,
    getReservedTickets,
    getPurchasedTickets,
    isTicketAvailable,
    isMyTicket
  };
};
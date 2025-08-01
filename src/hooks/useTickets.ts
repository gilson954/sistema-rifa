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
   */
  const reserveTickets = async (quotaNumbers: number[]): Promise<ReservationResult[] | null> => {
    if (!user || !campaignId || quotaNumbers.length === 0) {
      throw new Error('Usuário não autenticado ou dados inválidos');
    }

    setReserving(true);
    setError(null);

    try {
      const { data, error: apiError } = await TicketsAPI.reserveTickets(
        campaignId,
        quotaNumbers,
        user.id
      );

      if (apiError) {
        setError('Erro ao reservar cotas');
        throw apiError;
      }

      // Atualiza o status local após reserva bem-sucedida
      await fetchTicketsStatus();

      return data;
    } catch (error) {
      console.error('Error reserving tickets:', error);
      throw error;
    } finally {
      setReserving(false);
    }
  };

  /**
   * Finaliza a compra das cotas reservadas
   */
  const finalizePurchase = async (quotaNumbers: number[]): Promise<ReservationResult[] | null> => {
    if (!user || !campaignId || quotaNumbers.length === 0) {
      throw new Error('Usuário não autenticado ou dados inválidos');
    }

    setPurchasing(true);
    setError(null);

    try {
      const { data, error: apiError } = await TicketsAPI.finalizePurchase(
        campaignId,
        quotaNumbers,
        user.id
      );

      if (apiError) {
        setError('Erro ao finalizar compra');
        throw apiError;
      }

      // Atualiza o status local após compra bem-sucedida
      await fetchTicketsStatus();

      return data;
    } catch (error) {
      console.error('Error finalizing purchase:', error);
      throw error;
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
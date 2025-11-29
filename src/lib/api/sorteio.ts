import { supabase } from '../supabase';

export interface Winner {
  id: string;
  campaign_id: string;
  prize_id: string;
  prize_name: string;
  ticket_number: number;
  ticket_id: string | null;
  winner_name: string;
  winner_phone: string | null;
  winner_email: string | null;
  payment_method: string | null;
  total_paid: number;
  tickets_purchased: number;
  purchase_date: string | null;
  drawn_at: string;
  created_at: string;
  updated_at: string;
}

export interface WinnerTicket {
  id: string;
  quota_number: number;
  status: string;
  bought_at: string;
}

export interface TicketValidationResult {
  isValid: boolean;
  isSold: boolean;
  ticket: {
    id: string;
    quota_number: number;
    customer_name: string | null;
    customer_phone: string | null;
    customer_email: string | null;
    status: string;
  } | null;
  message: string;
}

export interface DrawRequest {
  campaignId: string;
  prizes: {
    prizeId: string;
    prizeName: string;
    ticketNumber: number;
  }[];
}

export interface DrawResult {
  success: boolean;
  winners: Winner[];
  message: string;
}

export const SorteioAPI = {
  async validateTicket(campaignId: string, ticketNumber: number): Promise<TicketValidationResult> {
    try {
      const { data: ticket, error } = await supabase
        .from('tickets')
        .select('id, quota_number, customer_name, customer_phone, customer_email, status')
        .eq('campaign_id', campaignId)
        .eq('quota_number', ticketNumber)
        .maybeSingle();

      if (error) {
        console.error('Error validating ticket:', error);
        return {
          isValid: false,
          isSold: false,
          ticket: null,
          message: 'Erro ao validar título'
        };
      }

      if (!ticket) {
        return {
          isValid: false,
          isSold: false,
          ticket: null,
          message: `Título ${ticketNumber} não existe`
        };
      }

      if (ticket.status !== 'comprado') {
        return {
          isValid: false,
          isSold: false,
          ticket,
          message: `Título ${ticketNumber} não foi vendido`
        };
      }

      return {
        isValid: true,
        isSold: true,
        ticket,
        message: `Título ${ticketNumber} adquirido por: ${ticket.customer_name || 'Nome não informado'}`
      };
    } catch (error) {
      console.error('Exception validating ticket:', error);
      return {
        isValid: false,
        isSold: false,
        ticket: null,
        message: 'Erro ao validar título'
      };
    }
  },

  async performDraw(request: DrawRequest): Promise<DrawResult> {
    try {
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('id, user_id, status, drawn_at')
        .eq('id', request.campaignId)
        .maybeSingle();

      if (campaignError || !campaign) {
        return {
          success: false,
          winners: [],
          message: 'Campanha não encontrada'
        };
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.id !== campaign.user_id) {
        return {
          success: false,
          winners: [],
          message: 'Você não tem permissão para realizar este sorteio'
        };
      }

      if (campaign.drawn_at) {
        return {
          success: false,
          winners: [],
          message: 'Sorteio já foi realizado para esta campanha'
        };
      }

      const ticketNumbers = request.prizes.map(p => p.ticketNumber);
      const uniqueNumbers = new Set(ticketNumbers);
      if (uniqueNumbers.size !== ticketNumbers.length) {
        return {
          success: false,
          winners: [],
          message: 'Números de títulos duplicados não são permitidos'
        };
      }

      const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select('*')
        .eq('campaign_id', request.campaignId)
        .in('quota_number', ticketNumbers);

      if (ticketsError || !tickets || tickets.length !== request.prizes.length) {
        return {
          success: false,
          winners: [],
          message: 'Alguns títulos não foram encontrados'
        };
      }

      for (const ticket of tickets) {
        if (ticket.status !== 'comprado') {
          return {
            success: false,
            winners: [],
            message: `Título ${ticket.quota_number} não foi vendido`
          };
        }
      }

      const ticketsWithPurchaseInfo = await Promise.all(
        tickets.map(async (ticket) => {
          const { data: allTickets } = await supabase
            .from('tickets')
            .select('id, quota_number')
            .eq('campaign_id', request.campaignId)
            .eq('customer_phone', ticket.customer_phone)
            .eq('status', 'comprado');

          // Removed unused query

          return {
            ...ticket,
            tickets_purchased: allTickets?.length || 1,
            all_ticket_numbers: allTickets?.map(t => t.quota_number) || []
          };
        })
      );

      const winnersToInsert = request.prizes.map((prize) => {
        const ticket = ticketsWithPurchaseInfo.find(t => t.quota_number === prize.ticketNumber);
        if (!ticket) throw new Error(`Ticket ${prize.ticketNumber} not found`);

        return {
          campaign_id: request.campaignId,
          prize_id: prize.prizeId,
          prize_name: prize.prizeName,
          ticket_number: prize.ticketNumber,
          ticket_id: ticket.id,
          winner_name: ticket.customer_name || 'Nome não informado',
          winner_phone: ticket.customer_phone,
          winner_email: ticket.customer_email,
          payment_method: 'Não informado',
          total_paid: 0,
          tickets_purchased: ticket.tickets_purchased,
          purchase_date: ticket.bought_at,
          drawn_at: new Date().toISOString()
        };
      });

      const { data: insertedWinners, error: insertError } = await supabase
        .from('campaign_winners')
        .insert(winnersToInsert)
        .select();

      if (insertError) {
        console.error('Error inserting winners:', insertError);
        return {
          success: false,
          winners: [],
          message: 'Erro ao registrar ganhadores: ' + insertError.message
        };
      }

      const { error: updateError } = await supabase
        .from('campaigns')
        .update({
          status: 'completed',
          drawn_at: new Date().toISOString(),
          drawn_by_user_id: user.id
        })
        .eq('id', request.campaignId);

      if (updateError) {
        console.error('Error updating campaign:', updateError);
        return {
          success: false,
          winners: [],
          message: 'Erro ao atualizar campanha'
        };
      }

      return {
        success: true,
        winners: insertedWinners || [],
        message: 'Sorteio realizado com sucesso!'
      };
    } catch (error) {
      console.error('Exception performing draw:', error);
      return {
        success: false,
        winners: [],
        message: 'Erro ao realizar sorteio: ' + (error as Error).message
      };
    }
  },

  async getWinners(campaignId: string): Promise<{ data: Winner[] | null; error: unknown }> {
    try {
      const { data, error } = await supabase
        .from('campaign_winners')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: true });

      return { data, error };
    } catch (error) {
      console.error('Exception getting winners:', error);
      return { data: null, error };
    }
  },

  async getWinnerById(winnerId: string): Promise<{ data: Winner | null; error: unknown }> {
    try {
      const { data, error } = await supabase
        .from('campaign_winners')
        .select('*')
        .eq('id', winnerId)
        .maybeSingle();

      return { data, error };
    } catch (error) {
      console.error('Exception getting winner:', error);
      return { data: null, error };
    }
  },

  async getWinnerTickets(campaignId: string, winnerPhone: string): Promise<{ data: WinnerTicket[] | null; error: unknown }> {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('id, quota_number, status, bought_at')
        .eq('campaign_id', campaignId)
        .eq('customer_phone', winnerPhone)
        .eq('status', 'comprado')
        .order('quota_number', { ascending: true });

      return { data, error };
    } catch (error) {
      console.error('Exception getting winner tickets:', error);
      return { data: null, error };
    }
  },

  async checkIfDrawnAlready(campaignId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('drawn_at')
        .eq('id', campaignId)
        .maybeSingle();

      if (error || !data) return false;
      return !!data.drawn_at;
    } catch (error) {
      console.error('Exception checking draw status:', error);
      return false;
    }
  }
};

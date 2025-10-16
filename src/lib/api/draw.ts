import { supabase } from '../supabase';

export interface TicketValidation {
  ticket_number: number;
  is_sold: boolean;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
}

export interface DrawWinnerInput {
  prizeId: string;
  prizeName: string;
  prizePosition: number;
  ticketNumber: number;
}

export interface Winner {
  id: string;
  prize_id: string;
  prize_name: string;
  prize_position: number;
  ticket_number: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  drawn_at: string;
}

export interface WinnerDetails {
  winner: {
    id: string;
    prizeName: string;
    prizePosition: number;
    ticketNumber: number;
    customerName: string;
    customerPhone: string;
    customerEmail: string | null;
    drawnAt: string;
  };
  allTickets: Array<{
    ticketNumber: number;
    isWinning: boolean;
    status: string;
    boughtAt: string;
  }>;
  paymentInfo: {
    paymentMethod?: string;
    totalAmount?: number;
    paidAt?: string;
  };
}

export class DrawAPI {
  static async validateTickets(
    campaignId: string,
    ticketNumbers: number[]
  ): Promise<{ data: TicketValidation[] | null; error: any }> {
    try {
      const { data, error } = await supabase.rpc('validate_draw_tickets', {
        p_campaign_id: campaignId,
        p_ticket_numbers: ticketNumbers,
      });

      if (error) {
        console.error('Error validating tickets:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error validating tickets:', error);
      return { data: null, error };
    }
  }

  static async performDraw(
    campaignId: string,
    userId: string,
    winners: DrawWinnerInput[]
  ): Promise<{ data: any; error: any }> {
    try {
      const { data, error } = await supabase.rpc('perform_campaign_draw', {
        p_campaign_id: campaignId,
        p_user_id: userId,
        p_winners: JSON.stringify(winners),
      });

      if (error) {
        console.error('Error performing draw:', error);
        return { data: null, error };
      }

      if (data && !data.success) {
        return { data: null, error: new Error(data.error) };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error performing draw:', error);
      return { data: null, error };
    }
  }

  static async getCampaignWinners(
    campaignId: string
  ): Promise<{ data: Winner[] | null; error: any }> {
    try {
      const { data, error } = await supabase.rpc('get_campaign_winners', {
        p_campaign_id: campaignId,
      });

      if (error) {
        console.error('Error fetching winners:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching winners:', error);
      return { data: null, error };
    }
  }

  static async getWinnerDetails(
    winnerId: string
  ): Promise<{ data: WinnerDetails | null; error: any }> {
    try {
      const { data, error } = await supabase.rpc('get_winner_details', {
        p_winner_id: winnerId,
      });

      if (error) {
        console.error('Error fetching winner details:', error);
        return { data: null, error };
      }

      if (data && !data.success) {
        return { data: null, error: new Error(data.error) };
      }

      return { data: data as WinnerDetails, error: null };
    } catch (error) {
      console.error('Error fetching winner details:', error);
      return { data: null, error };
    }
  }

  static async checkIfDrawCompleted(
    campaignId: string
  ): Promise<{ data: boolean; error: any }> {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('draw_completed_at')
        .eq('id', campaignId)
        .single();

      if (error) {
        console.error('Error checking draw status:', error);
        return { data: false, error };
      }

      return { data: !!data.draw_completed_at, error: null };
    } catch (error) {
      console.error('Error checking draw status:', error);
      return { data: false, error };
    }
  }
}

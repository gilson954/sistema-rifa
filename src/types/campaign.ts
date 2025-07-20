export interface Campaign {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  prize_description: string;
  prize_image_url: string | null;
  ticket_price: number;
  total_tickets: number;
  sold_tickets: number;
  start_date: string;
  end_date: string;
  status: CampaignStatus;
  winner_ticket_number: number | null;
  winner_user_id: string | null;
  draw_method: string | null;
  phone_number: string | null;
  draw_date: string | null;
  payment_deadline_hours: number;
  require_email: boolean;
  show_ranking: boolean;
  min_tickets_per_purchase: number;
  max_tickets_per_purchase: number;
  initial_filter: 'all' | 'available';
  campaign_model: 'manual' | 'automatic';
  created_at: string;
  updated_at: string;
}

export type CampaignStatus = 'draft' | 'active' | 'completed' | 'cancelled';

export interface CreateCampaignData {
  title: string;
  description?: string;
  prize_description: string;
  prize_image_url?: string;
  ticket_price: number;
  total_tickets: number;
  start_date: string;
  end_date: string;
  draw_method: string;
  phone_number: string;
  draw_date?: string;
  payment_deadline_hours?: number;
  require_email?: boolean;
  show_ranking?: boolean;
  min_tickets_per_purchase?: number;
  max_tickets_per_purchase?: number;
  initial_filter?: 'all' | 'available';
  campaign_model?: 'manual' | 'automatic';
}

export interface UpdateCampaignData extends Partial<CreateCampaignData> {
  id: string;
}

export interface CampaignFormData {
  title: string;
  ticketQuantity: number;
  ticketPrice: string;
  drawMethod: string;
  phoneNumber: string;
  description: string;
  prizeDescription: string;
  drawDate: string | null;
  paymentDeadlineHours: number;
  requireEmail: boolean;
  showRanking: boolean;
  minTicketsPerPurchase: number;
  maxTicketsPerPurchase: number;
  initialFilter: 'all' | 'available';
  campaignModel: 'manual' | 'automatic';
}
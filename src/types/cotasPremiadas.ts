export type CotaPremiadaStatus = 'disponivel' | 'comprada' | 'encontrada';

export interface CotaPremiada {
  id: string;
  campaign_id: string;
  numero_cota: number;
  premio: string;
  status: CotaPremiadaStatus;
  winner_name: string | null;
  winner_phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCotaPremiadaData {
  campaign_id: string;
  numero_cota: number;
  premio: string;
}

export interface UpdateCotaPremiadaData {
  id: string;
  premio?: string;
  status?: CotaPremiadaStatus;
  winner_name?: string | null;
  winner_phone?: string | null;
}

export interface CotaPremiadaWithCampaign extends CotaPremiada {
  campaign_title?: string;
  campaign_total_tickets?: number;
}

/**
 * Interface for promotion data
 */
export interface Promotion {
  id: string;
  ticketQuantity: number;
  totalValue: number;
  originalPricePerTicket: number;
  promotionalPricePerTicket: number;
  createdAt: Date;
}

/**
 * Interface for promotion form data
 */
export interface PromotionFormData {
  ticketQuantity: string;
  totalValue: string;
}
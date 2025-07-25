/**
 * Interface for promotion data structure
 */
export interface Promotion {
  id: string;
  ticketQuantity: number;
  totalValue: number;
  originalTotalValue: number; // Total value at original price
  promotionalPricePerTicket: number; // Price per ticket in promotion
}
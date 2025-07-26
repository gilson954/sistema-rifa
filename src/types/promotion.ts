export interface Promotion {
  id: string;
  ticketQuantity: number;
  totalValue: number;
  originalTotalValue: number; // Valor total se comprado pelo preço original
  promotionalPricePerTicket: number; // Preço por bilhete na promoção
}

export interface Prize {
  id: string;
  name: string;
}
export interface Promotion {
  id: string;
  ticketQuantity: number;
  discountedTotalValue: number; // Valor final do pacote após desconto
  fixedDiscountAmount: number; // Valor absoluto do desconto
}

export interface Prize {
  id: string;
  name: string;
}
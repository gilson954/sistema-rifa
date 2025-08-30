/**
 * Utility functions for Brazilian currency formatting and parsing
 */

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const parseCurrency = (value: string): number => {
  // Remove "R$", pontos de milhar e substitui vírgula por ponto para parse
  const cleanedValue = value.replace(/[R$\s.]/g, '').replace(',', '.');
  return parseFloat(cleanedValue || '0');
};

export const formatInputCurrency = (value: string): string => {
  // Remove tudo que não for dígito
  const numericValue = value.replace(/\D/g, '');

  if (!numericValue) {
    return '';
  }

  // Converte para centavos
  const cents = parseInt(numericValue, 10);

/**
 * Calcula o valor total com promoções aplicadas em blocos
 * Aplica promoções em ordem decrescente e cobra preço normal para cotas excedentes
 */
export const calculateTotalWithPromotions = (
  quantity: number,
  ticketPrice: number,
  promotions: any[] = []
): { total: number; appliedPromotions: any[]; breakdown: any[] } => {
  if (quantity <= 0 || ticketPrice <= 0) {
    return { total: 0, appliedPromotions: [], breakdown: [] };
  }

  // Se não há promoções, retorna cálculo normal
  if (!promotions || promotions.length === 0) {
    return {
      total: quantity * ticketPrice,
      appliedPromotions: [],
      breakdown: [{ type: 'normal', quantity, unitPrice: ticketPrice, total: quantity * ticketPrice }]
    };
  }

  // Ordena promoções por quantidade em ordem decrescente (maior para menor)
  const sortedPromotions = [...promotions].sort((a, b) => b.ticketQuantity - a.ticketQuantity);

  let remainingQuantity = quantity;
  let totalValue = 0;
  const appliedPromotions: any[] = [];
  const breakdown: any[] = [];

  // Aplica promoções em ordem decrescente
  for (const promotion of sortedPromotions) {
    if (remainingQuantity >= promotion.ticketQuantity) {
      // Calcula quantas vezes esta promoção pode ser aplicada
      const timesApplicable = Math.floor(remainingQuantity / promotion.ticketQuantity);
      
      // Aplica a promoção
      const promotionTotal = timesApplicable * promotion.discountedTotalValue;
      const quotasUsed = timesApplicable * promotion.ticketQuantity;
      
      totalValue += promotionTotal;
      remainingQuantity -= quotasUsed;
      
      appliedPromotions.push({
        ...promotion,
        timesApplied: timesApplicable,
        totalDiscount: timesApplicable * promotion.fixedDiscountAmount
      });
      
      breakdown.push({
        type: 'promotion',
        promotion: promotion,
        timesApplied: timesApplicable,
        quantity: quotasUsed,
        unitPrice: promotion.discountedTotalValue / promotion.ticketQuantity,
        total: promotionTotal
      });
    }
  }

  // Cobra preço normal para cotas restantes
  if (remainingQuantity > 0) {
    const normalTotal = remainingQuantity * ticketPrice;
    totalValue += normalTotal;
    
    breakdown.push({
      type: 'normal',
      quantity: remainingQuantity,
      unitPrice: ticketPrice,
      total: normalTotal
    });
  }

  return {
    total: totalValue,
    appliedPromotions,
    breakdown
  };
};
  
  // Converte centavos para reais
  const reais = cents / 100;
  
  // Formata como moeda brasileira sem o símbolo R$
  return reais.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};
};
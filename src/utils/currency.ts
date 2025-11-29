/**
 * Utility functions for Brazilian currency formatting and parsing
 */
import type { Promotion } from '../types/promotion';

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

  // Converte centavos para reais
  const reais = cents / 100;
  
  // Formata como moeda brasileira sem o símbolo R$
  return reais.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

/**
 * Calcula o valor total com promoções aplicadas em blocos
 * Aplica a melhor promoção disponível uma vez e cobra preço normal para cotas excedentes
 */
export const calculateTotalWithPromotions = (
  quantity: number,
  ticketPrice: number,
  promotions: Promotion[] = []
): {
  total: number;
  appliedPromotions: Promotion[];
  breakdown: Array<{
    type: 'promotion' | 'normal';
    quantity: number;
    unitPrice: number;
    total: number;
    promotion?: Promotion;
    timesApplied?: number;
  }>;
} => {
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

  // Encontra a melhor promoção aplicável (maior quantidade que seja <= quantity)
  const applicablePromotions = promotions.filter((promo) => promo.ticketQuantity <= quantity);
  
  if (applicablePromotions.length === 0) {
    // Nenhuma promoção aplicável, cobra preço normal
    return {
      total: quantity * ticketPrice,
      appliedPromotions: [],
      breakdown: [{ type: 'normal', quantity, unitPrice: ticketPrice, total: quantity * ticketPrice }]
    };
  }
  
  // Ordena promoções aplicáveis por quantidade em ordem decrescente
  const sortedApplicablePromotions = applicablePromotions.sort((a, b) => b.ticketQuantity - a.ticketQuantity);
  
  // Pega a melhor promoção (maior quantidade aplicável)
  const bestPromotion = sortedApplicablePromotions[0];

  // Aplica a melhor promoção uma vez
  const promotionQuantity = bestPromotion.ticketQuantity;
  const promotionTotal = bestPromotion.discountedTotalValue;
  
  // Calcula cotas restantes (se houver)
  const remainingQuantity = quantity - promotionQuantity;
  let totalValue = 0;
  const appliedPromotions: Promotion[] = [bestPromotion];
  const breakdown: Array<{
    type: 'promotion' | 'normal';
    quantity: number;
    unitPrice: number;
    total: number;
    promotion?: Promotion;
    timesApplied?: number;
  }> = [];

  // Adiciona o valor da promoção
  totalValue += promotionTotal;
  
  breakdown.push({
    type: 'promotion',
    promotion: bestPromotion,
    timesApplied: 1,
    quantity: promotionQuantity,
    unitPrice: bestPromotion.discountedTotalValue / bestPromotion.ticketQuantity,
    total: promotionTotal
  });

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

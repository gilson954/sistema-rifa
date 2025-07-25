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
  
  // Converte centavos para reais
  const reais = cents / 100;
  
  // Formata como moeda brasileira sem o símbolo R$
  return reais.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};
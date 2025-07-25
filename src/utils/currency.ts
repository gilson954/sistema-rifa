/**
 * Utility functions for Brazilian currency formatting and parsing
 */

/**
 * Formats a number as Brazilian currency (R$ X.XXX,XX)
 * @param value - The numeric value to format
 * @returns Formatted currency string
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

/**
 * Formats a number as Brazilian currency without the R$ symbol
 * @param value - The numeric value to format
 * @returns Formatted currency string without symbol
 */
export const formatCurrencyWithoutSymbol = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

/**
 * Parses a Brazilian currency string to a number
 * @param currencyString - String in format "R$ X.XXX,XX" or "X.XXX,XX"
 * @returns Numeric value
 */
export const parseCurrency = (currencyString: string): number => {
  // Remove R$, spaces, and convert comma to dot
  const cleanString = currencyString
    .replace(/R\$\s?/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  
  return parseFloat(cleanString) || 0;
};

/**
 * Formats currency input as user types (Brazilian format)
 * Treats input as cents and converts to reais format
 * @param rawValue - Raw input string
 * @returns Formatted currency string
 */
export const formatCurrencyInput = (rawValue: string): string => {
  // Remove all non-numeric characters
  const numericValue = rawValue.replace(/\D/g, '');
  
  // Handle empty input
  if (!numericValue) return 'R$ 0,00';
  
  // Convert to number (treating as cents)
  const cents = parseInt(numericValue, 10);
  
  // Convert cents to reais
  const reais = cents / 100;
  
  // Format as Brazilian currency
  return formatCurrency(reais);
};

/**
 * Gets the numeric value from a formatted currency input
 * @param formattedValue - Formatted currency string
 * @returns Numeric value in reais
 */
export const getCurrencyValue = (formattedValue: string): number => {
  return parseCurrency(formattedValue);
};
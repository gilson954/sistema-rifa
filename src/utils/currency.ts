/**
 * Utility functions for currency formatting and parsing in Brazilian Real (BRL)
 */

/**
 * Formats a number as Brazilian currency (R$)
 * @param value - The numeric value to format
 * @returns Formatted currency string (e.g., "R$ 1.234,56")
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

/**
 * Parses a Brazilian currency string to a number
 * @param value - The currency string to parse (e.g., "R$ 1.234,56")
 * @returns The numeric value
 */
export const parseCurrency = (value: string): number => {
  // Remove "R$", spaces, and thousand separators, then replace comma with dot
  const cleanedValue = value.replace(/[R$\s.]/g, '').replace(',', '.');
  return parseFloat(cleanedValue || '0');
};

/**
 * Formats input value as Brazilian currency while typing
 * @param value - The input string value
 * @returns Formatted currency string for input display
 */
export const formatInputCurrency = (value: string): string => {
  // Remove all non-numeric characters
  const numericValue = value.replace(/\D/g, '');

  if (!numericValue) {
    return '';
  }

  // Ensure at least 3 digits for proper formatting (e.g., "001" -> "0,01")
  const paddedValue = numericValue.padStart(3, '0');

  // Split into integer and decimal parts
  const integerPart = paddedValue.slice(0, -2);
  const decimalPart = paddedValue.slice(-2);

  // Add thousand separators to integer part
  const formattedIntegerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return `${formattedIntegerPart},${decimalPart}`;
};
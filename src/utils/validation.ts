/**
 * Utility functions for form validation
 */

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string, countryCode: string = 'BR'): boolean => {
  const numbers = phone.replace(/\D/g, '');
  
  switch (countryCode) {
    case 'BR':
      return numbers.length === 11;
    case 'US':
    case 'CA':
      return numbers.length === 10;
    default:
      return numbers.length >= 7 && numbers.length <= 15;
  }
};

export const validateCPF = (cpf: string): boolean => {
  const numbers = cpf.replace(/\D/g, '');
  
  if (numbers.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(numbers)) return false;
  
  // Validate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(numbers[9])) return false;
  
  // Validate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(numbers[10])) return false;
  
  return true;
};

export const validateCNPJ = (cnpj: string): boolean => {
  const numbers = cnpj.replace(/\D/g, '');
  
  if (numbers.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(numbers)) return false;
  
  // Validate first check digit
  let sum = 0;
  let weight = 2;
  for (let i = 11; i >= 0; i--) {
    sum += parseInt(numbers[i]) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  let remainder = sum % 11;
  const firstDigit = remainder < 2 ? 0 : 11 - remainder;
  if (firstDigit !== parseInt(numbers[12])) return false;
  
  // Validate second check digit
  sum = 0;
  weight = 2;
  for (let i = 12; i >= 0; i--) {
    sum += parseInt(numbers[i]) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  remainder = sum % 11;
  const secondDigit = remainder < 2 ? 0 : 11 - remainder;
  if (secondDigit !== parseInt(numbers[13])) return false;
  
  return true;
};

export const validatePassword = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (password.length < 6) {
    errors.push('A senha deve ter pelo menos 6 caracteres');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('A senha deve conter pelo menos uma letra maiúscula');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('A senha deve conter pelo menos uma letra minúscula');
  }
  
  if (!/\d/.test(password)) {
    errors.push('A senha deve conter pelo menos um número');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateURL = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};
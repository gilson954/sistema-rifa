import { z } from 'zod';

// Schema para a Etapa 1 - Dados Básicos
const step1Schema = z.object({
  nome: z
    .string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(50, 'Nome muito longo')
    .trim(),
  email: z
    .string()
    .email('Email inválido')
    .max(100, 'Email muito longo'),
  telefone: z
    .string()
    .regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, 'Formato de telefone inválido (ex: (11) 99999-9999)')
    .min(14, 'Telefone deve ter pelo menos 14 caracteres'),
});

// Schema para a Etapa 2 - Endereço e Preferências
const step2Schema = z.object({
  endereco: z
    .string()
    .min(10, 'Endereço deve ter pelo menos 10 caracteres')
    .max(200, 'Endereço muito longo')
    .trim(),
  cep: z
    .string()
    .regex(/^\d{5}-\d{3}$/, 'CEP inválido (formato: 12345-678)')
    .length(9, 'CEP deve ter 9 caracteres'),
  cidade: z
    .string()
    .min(2, 'Cidade deve ter pelo menos 2 caracteres')
    .max(50, 'Nome da cidade muito longo')
    .trim(),
  estado: z
    .string()
    .length(2, 'Estado deve ter 2 caracteres (ex: SP)')
    .regex(/^[A-Z]{2}$/, 'Estado deve conter apenas letras maiúsculas'),
  receberNotificacoes: z.boolean(),
  tipoContato: z.enum(['email', 'sms', 'whatsapp'], {
    errorMap: () => ({ message: 'Selecione um tipo de contato válido' })
  }),
});

// Schema para a Etapa 3 - Confirmação e Termos
const step3Schema = z.object({
  aceitarTermos: z
    .boolean()
    .refine(val => val === true, 'Você deve aceitar os termos de uso'),
  aceitarPrivacidade: z
    .boolean()
    .refine(val => val === true, 'Você deve aceitar a política de privacidade'),
  observacoes: z
    .string()
    .max(500, 'Observações devem ter no máximo 500 caracteres')
    .optional(),
});

// Schema completo do formulário (para validação final)
const _fullFormSchema = z.object({
  step1: step1Schema,
  step2: step2Schema,
  step3: step3Schema,
});

// Tipos TypeScript inferidos dos schemas
export type Step1Data = z.infer<typeof step1Schema>;
export type Step2Data = z.infer<typeof step2Schema>;
export type Step3Data = z.infer<typeof step3Schema>;
export type FullFormData = z.infer<typeof _fullFormSchema>;

// Mapeamento de schemas por nome de etapa
export const schemas = {
  step1: step1Schema,
  step2: step2Schema,
  step3: step3Schema,
} as const;

// Dados iniciais do formulário
export const initialFormData: FullFormData = {
  step1: {
    nome: '',
    email: '',
    telefone: '',
  },
  step2: {
    endereco: '',
    cep: '',
    cidade: '',
    estado: '',
    receberNotificacoes: true,
    tipoContato: 'email',
  },
  step3: {
    aceitarTermos: false,
    aceitarPrivacidade: false,
    observacoes: '',
  },
};

// Função utilitária para formatar telefone brasileiro
export const formatPhoneNumber = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  const limitedNumbers = numbers.slice(0, 11);
  
  if (limitedNumbers.length <= 2) {
    return limitedNumbers;
  } else if (limitedNumbers.length <= 7) {
    return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2)}`;
  } else {
    return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2, 7)}-${limitedNumbers.slice(7)}`;
  }
};

// Função utilitária para formatar CEP
export const formatCEP = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  const limitedNumbers = numbers.slice(0, 8);
  
  if (limitedNumbers.length <= 5) {
    return limitedNumbers;
  } else {
    return `${limitedNumbers.slice(0, 5)}-${limitedNumbers.slice(5)}`;
  }
};

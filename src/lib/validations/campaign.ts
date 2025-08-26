import { z } from 'zod';

// Schema para validação de criação de campanha
export const createCampaignSchema = z.object({
  title: z
    .string()
    .min(3, 'O título deve ter pelo menos 3 caracteres')
    .max(100, 'O título deve ter no máximo 100 caracteres')
    .trim(),
  
  slug: z
    .string()
    .min(3, 'O slug deve ter pelo menos 3 caracteres')
    .max(50, 'O slug deve ter no máximo 50 caracteres')
    .regex(/^[a-z0-9-]+$/, 'O slug deve conter apenas letras minúsculas, números e hífens')
    .refine(slug => !slug.startsWith('-') && !slug.endsWith('-'), 'O slug não pode começar ou terminar com hífen')
    .refine(slug => !slug.includes('--'), 'O slug não pode conter hífens consecutivos')
    .optional(),
  
  description: z
    .string()
    .max(2000, 'A descrição deve ter no máximo 2000 caracteres')
    .optional(),
  
  ticket_price: z
    .number()
    .min(0.01, 'O valor da cota deve ser maior que R$ 0,00')
    .max(10000, 'O valor da cota deve ser menor que R$ 10.000,00'),
  
  total_tickets: z
    .number()
    .int('A quantidade de cotas deve ser um número inteiro')
    .min(1, 'Deve haver pelo menos 1 cota')
    .max(10000000, 'Máximo de 10 milhões de cotas'),
  
  draw_method: z
    .enum(['Loteria Federal', 'Sorteador.com.br', 'Live no Instagram', 'Live no Youtube', 'Live no TikTok', 'Outros'], {
      errorMap: () => ({ message: 'Selecione um método de sorteio válido' })
    })
    .transform(val => val.trim()),
  
  phone_number: z
    .string()
    .min(10, 'Número de telefone inválido')
    .max(20, 'Número de telefone muito longo')
    .regex(/^[\d\s\-\(\)\+]+$/, 'Formato de telefone inválido')
    .transform(val => val.trim())
    .optional()
    .nullable(),
  
  draw_date: z
    .string()
    .datetime()
    .optional()
    .nullable(),
  
  payment_deadline_hours: z
    .number()
    .int()
    .min(1, 'Prazo mínimo de 1 hora')
    .max(168, 'Prazo máximo de 7 dias (168 horas)')
    .default(24),
  
  require_email: z
    .boolean()
    .default(true),
  
  show_ranking: z
    .boolean()
    .default(false),
  
  min_tickets_per_purchase: z
    .number()
    .int()
    .min(1, 'Mínimo deve ser pelo menos 1')
    .default(1),
  
  max_tickets_per_purchase: z
    .number()
    .int()
    .min(1, 'Máximo deve ser pelo menos 1')
    .default(1000),
  
  initial_filter: z
    .enum(['all', 'available'])
    .default('all'),
  
  campaign_model: z
    .enum(['manual', 'automatic'])
    .default('automatic'),
  
  promotions: z
    .array(z.any())
    .optional()
    .nullable()
    .default([]),
  
  prizes: z
    .array(z.any())
    .optional()
    .nullable()
    .default([]),
  
  reservation_timeout_minutes: z
    .number()
    .int()
    .min(1, 'Timeout deve ser pelo menos 1 minuto')
    .max(10080, 'Timeout máximo de 7 dias (10080 minutos)')
    .default(15),
  
  prize_image_urls: z
    .array(z.string())
    .optional()
    .nullable()
    .default([]),
  
  show_draw_date: z
    .boolean()
    .default(false)
}).refine(
  (data) => data.min_tickets_per_purchase <= data.max_tickets_per_purchase,
  {
    message: 'A quantidade mínima deve ser menor ou igual à máxima',
    path: ['min_tickets_per_purchase']
  }
).refine(
  (data) => data.max_tickets_per_purchase <= data.total_tickets,
  {
    message: 'A quantidade máxima por compra não pode ser maior que o total de cotas',
    path: ['max_tickets_per_purchase']
  }
);

// Schema para validação de atualização de campanha
export const updateCampaignSchema = createCampaignSchema.partial().extend({
  id: z.string().uuid('ID da campanha inválido')
}).refine(
  (data) => !data.min_tickets_per_purchase || !data.max_tickets_per_purchase || data.min_tickets_per_purchase <= data.max_tickets_per_purchase,
  {
    message: 'A quantidade mínima deve ser menor ou igual à máxima',
    path: ['min_tickets_per_purchase']
  }
).refine(
  (data) => !data.max_tickets_per_purchase || !data.total_tickets || data.max_tickets_per_purchase <= data.total_tickets,
  {
    message: 'A quantidade máxima por compra não pode ser maior que o total de cotas',
    path: ['max_tickets_per_purchase']
  }
).refine(
  (data) => !(data.total_tickets && data.campaign_model && data.total_tickets > 10000 && data.campaign_model === 'manual'),
  {
    message: 'O modelo manual não é permitido para campanhas com mais de 10.000 cotas',
    path: ['campaign_model']
  }
);

// Schema para validação do formulário (frontend)
export const campaignFormSchema = z.object({
  title: z
    .string()
    .min(3, 'O título deve ter pelo menos 3 caracteres')
    .max(100, 'O título deve ter no máximo 100 caracteres'),
  
  ticketQuantity: z
    .number()
    .int()
    .min(1, 'Deve haver pelo menos 1 cota')
    .max(10000000, 'Máximo de 10 milhões de cotas'),
  
  ticketPrice: z
    .string()
    .regex(/^\d+,\d{2}$/, 'Formato de preço inválido (ex: 1,50)')
    .refine((value) => {
      const numericValue = parseFloat(value.replace(',', '.'));
      return numericValue >= 0.01;
    }, 'O valor da cota deve ser maior que R$ 0,00')
    .refine((value) => {
      const numericValue = parseFloat(value.replace(',', '.'));
      return numericValue <= 10000;
    }, 'O valor da cota deve ser menor que R$ 10.000,00'),
  
  drawMethod: z
    .string()
    .min(1, 'Selecione um método de sorteio'),
  
  phoneNumber: z
    .string()
    .min(10, 'Número de telefone inválido'),
  
  drawDate: z
    .string()
    .nullable()
    .optional(),
  
  paymentDeadlineHours: z
    .number()
    .int()
    .min(1)
    .max(168),
  
  requireEmail: z.boolean(),
  showRanking: z.boolean(),
  
  minTicketsPerPurchase: z
    .number()
    .int()
    .min(1),
  
  maxTicketsPerPurchase: z
    .number()
    .int()
    .min(1),
  
  initialFilter: z.enum(['all', 'available']),
  campaignModel: z.enum(['manual', 'automatic'])
}).refine(
  (data) => !(data.ticketQuantity > 10000 && data.campaignModel === 'manual'),
  {
    message: 'O modelo manual não é permitido para campanhas com mais de 10.000 cotas',
    path: ['campaignModel']
  }
);

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;
export type CampaignFormInput = z.infer<typeof campaignFormSchema>;
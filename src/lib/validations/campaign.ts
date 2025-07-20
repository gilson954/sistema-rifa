import { z } from 'zod';

// Schema para validação de criação de campanha
export const createCampaignSchema = z.object({
  title: z
    .string()
    .min(3, 'O título deve ter pelo menos 3 caracteres')
    .max(100, 'O título deve ter no máximo 100 caracteres')
    .trim(),
  
  description: z
    .string()
    .max(2000, 'A descrição deve ter no máximo 2000 caracteres')
    .optional(),
  
  prize_description: z
    .string()
    .min(3, 'A descrição do prêmio deve ter pelo menos 3 caracteres')
    .max(500, 'A descrição do prêmio deve ter no máximo 500 caracteres')
    .trim(),
  
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
    }),
  
  phone_number: z
    .string()
    .min(10, 'Número de telefone inválido')
    .max(20, 'Número de telefone muito longo')
    .regex(/^[\d\s\-\(\)\+]+$/, 'Formato de telefone inválido'),
  
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
    .default('manual')
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
});

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
    .regex(/^\d+,\d{2}$/, 'Formato de preço inválido (ex: 1,50)'),
  
  drawMethod: z
    .string()
    .min(1, 'Selecione um método de sorteio'),
  
  phoneNumber: z
    .string()
    .min(10, 'Número de telefone inválido'),
  
  description: z
    .string()
    .max(2000, 'A descrição deve ter no máximo 2000 caracteres')
    .optional(),
  
  prizeDescription: z
    .string()
    .min(3, 'A descrição do prêmio é obrigatória')
    .max(500, 'A descrição do prêmio deve ter no máximo 500 caracteres'),
  
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
});

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;
export type CampaignFormInput = z.infer<typeof campaignFormSchema>;
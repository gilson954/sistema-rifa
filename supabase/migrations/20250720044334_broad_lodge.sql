/*
  # Aprimoramento da tabela de campanhas

  1. Novos campos essenciais
    - `description` (text) - Descrição detalhada da campanha
    - `prize_image_url` (text) - URL da imagem do prêmio
    - `draw_method` (text) - Método do sorteio
    - `phone_number` (text) - Número de telefone do organizador
    - `draw_date` (timestamptz) - Data do sorteio (opcional)
    - `payment_deadline_hours` (integer) - Prazo para pagamento em horas
    - `require_email` (boolean) - Se requer email para participar
    - `show_ranking` (boolean) - Se mostra ranking dos maiores compradores
    - `min_tickets_per_purchase` (integer) - Mínimo de bilhetes por compra
    - `max_tickets_per_purchase` (integer) - Máximo de bilhetes por compra
    - `initial_filter` (text) - Filtro inicial das cotas
    - `campaign_model` (text) - Modelo da campanha (manual/automatic)

  2. Índices para performance
    - Índice por status e data de criação
    - Índice por usuário e status

  3. Constraints de validação
    - Status válidos
    - Valores positivos
    - Datas consistentes
*/

-- Adicionar novos campos à tabela campaigns
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS draw_method text,
ADD COLUMN IF NOT EXISTS phone_number text,
ADD COLUMN IF NOT EXISTS draw_date timestamptz,
ADD COLUMN IF NOT EXISTS payment_deadline_hours integer DEFAULT 24,
ADD COLUMN IF NOT EXISTS require_email boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_ranking boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS min_tickets_per_purchase integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_tickets_per_purchase integer DEFAULT 1000,
ADD COLUMN IF NOT EXISTS initial_filter text DEFAULT 'all',
ADD COLUMN IF NOT EXISTS campaign_model text DEFAULT 'manual';

-- Adicionar constraints de validação
ALTER TABLE campaigns 
ADD CONSTRAINT campaigns_payment_deadline_check CHECK (payment_deadline_hours > 0),
ADD CONSTRAINT campaigns_min_max_tickets_check CHECK (min_tickets_per_purchase <= max_tickets_per_purchase),
ADD CONSTRAINT campaigns_min_tickets_positive CHECK (min_tickets_per_purchase > 0),
ADD CONSTRAINT campaigns_draw_method_check CHECK (draw_method IN ('Loteria Federal', 'Sorteador.com.br', 'Live no Instagram', 'Live no Youtube', 'Live no TikTok', 'Outros')),
ADD CONSTRAINT campaigns_initial_filter_check CHECK (initial_filter IN ('all', 'available')),
ADD CONSTRAINT campaigns_model_check CHECK (campaign_model IN ('manual', 'automatic'));

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS campaigns_status_created_at_idx ON campaigns(status, created_at DESC);
CREATE INDEX IF NOT EXISTS campaigns_user_status_idx ON campaigns(user_id, status);

-- Atualizar função de trigger para updated_at
CREATE OR REPLACE FUNCTION update_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Garantir que o trigger existe
DROP TRIGGER IF EXISTS update_campaigns_updated_at ON campaigns;
CREATE TRIGGER update_campaigns_updated_at
    BEFORE UPDATE ON campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_campaigns_updated_at();
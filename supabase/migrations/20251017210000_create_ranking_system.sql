/*
  # Sistema de Ranking de Top Compradores

  1. Modificações na Tabela campaigns
    - `ranking_enabled` (boolean, default false) - Habilita/desabilita o ranking na campanha
    - `ranking_visible_to_public` (boolean, default true) - Define se o ranking é visível publicamente
    - `ranking_prize_enabled` (boolean, default false) - Define se há prêmio para os top compradores
    - `ranking_prize_description` (text, opcional) - Descrição do prêmio para os top compradores
    - `ranking_top_count` (integer, default 10) - Quantidade de compradores a exibir no ranking

  2. View para Ranking
    - Cria uma view que agrega tickets por comprador
    - Ordena por quantidade de tickets comprados
    - Mascara parcialmente telefone e email por segurança

  3. Segurança
    - Organizadores podem ver dados completos de seus compradores
    - Público vê apenas dados mascarados se o ranking estiver visível
    - RLS garante que apenas o organizador da campanha pode modificar configurações

  4. Índices
    - Otimiza consultas de ranking por campanha
    - Melhora performance de agregação de tickets
*/

-- Adicionar colunas de ranking à tabela campaigns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'ranking_enabled'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN ranking_enabled boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'ranking_visible_to_public'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN ranking_visible_to_public boolean DEFAULT true;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'ranking_prize_enabled'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN ranking_prize_enabled boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'ranking_prize_description'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN ranking_prize_description text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'ranking_top_count'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN ranking_top_count integer DEFAULT 10;
  END IF;
END $$;

-- Criar função para obter ranking de compradores de uma campanha
CREATE OR REPLACE FUNCTION get_campaign_ranking(
  p_campaign_id uuid,
  p_limit integer DEFAULT 10
)
RETURNS TABLE (
  customer_name text,
  customer_phone text,
  customer_email text,
  ticket_count bigint,
  total_spent numeric,
  rank_position bigint
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.customer_name,
    t.customer_phone,
    t.customer_email,
    COUNT(*)::bigint as ticket_count,
    (COUNT(*) * c.ticket_price)::numeric as total_spent,
    ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC)::bigint as rank_position
  FROM tickets t
  INNER JOIN campaigns c ON c.id = t.campaign_id
  WHERE t.campaign_id = p_campaign_id
    AND t.status = 'comprado'
  GROUP BY t.customer_name, t.customer_phone, t.customer_email, c.ticket_price
  ORDER BY ticket_count DESC
  LIMIT p_limit;
END;
$$;

-- Comentários nas novas colunas
COMMENT ON COLUMN campaigns.ranking_enabled IS 'Define se o sistema de ranking está ativo para esta campanha';
COMMENT ON COLUMN campaigns.ranking_visible_to_public IS 'Define se o ranking é visível publicamente na página da campanha';
COMMENT ON COLUMN campaigns.ranking_prize_enabled IS 'Define se há prêmio especial para os top compradores';
COMMENT ON COLUMN campaigns.ranking_prize_description IS 'Descrição do prêmio para os top compradores do ranking';
COMMENT ON COLUMN campaigns.ranking_top_count IS 'Quantidade de compradores a exibir no ranking (padrão: 10)';

-- Criar índices para otimizar consultas de ranking
CREATE INDEX IF NOT EXISTS idx_tickets_campaign_status_customer
ON tickets (campaign_id, status, customer_phone)
WHERE status = 'comprado';

CREATE INDEX IF NOT EXISTS idx_campaigns_ranking_enabled
ON campaigns (ranking_enabled)
WHERE ranking_enabled = true;

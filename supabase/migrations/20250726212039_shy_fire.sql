/*
  # Adicionar campo de prêmios às campanhas

  1. Nova Coluna
    - `prizes` (jsonb) - Array de objetos contendo os prêmios da campanha
  
  2. Índice
    - Índice GIN para melhor performance em consultas de prêmios
  
  3. Estrutura dos Dados
    - Cada prêmio terá: { id: string, name: string }
*/

-- Adicionar coluna prizes se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'prizes'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN prizes jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_campaigns_prizes ON campaigns USING gin (prizes);

-- Comentário explicativo
COMMENT ON COLUMN campaigns.prizes IS 'Array de prêmios da campanha em formato JSON';
/*
  # Adicionar coluna show_percentage à tabela campaigns

  1. Modificações na Tabela
    - Adicionar coluna `show_percentage` (boolean) à tabela `campaigns`
    - Valor padrão: `false`
    - Não nula

  2. Descrição
    - Esta coluna controla se a porcentagem de progresso da campanha deve ser exibida na página pública
    - Quando `true`: mostra "X% concluído" baseado em cotas vendidas vs total
    - Quando `false`: não exibe informações de progresso
*/

-- Adicionar coluna show_percentage à tabela campaigns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'show_percentage'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN show_percentage boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- Criar índice para otimizar consultas que filtram por show_percentage
CREATE INDEX IF NOT EXISTS idx_campaigns_show_percentage 
ON campaigns (show_percentage) 
WHERE show_percentage = true;
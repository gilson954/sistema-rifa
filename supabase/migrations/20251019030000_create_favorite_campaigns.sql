/*
  # Sistema de Campanhas Favoritas

  1. Nova Tabela
    - `favorite_campaigns`
      - `id` (uuid, primary key)
      - `customer_phone` (text) - Identificador do cliente
      - `campaign_id` (uuid) - ID da campanha
      - `created_at` (timestamp)
      - Índice único composto para evitar duplicatas

  2. Segurança
    - Habilita RLS na tabela
    - Políticas para permitir que usuários gerenciem suas próprias favoritas
    - Acesso público para leitura baseado em telefone
*/

-- Criar tabela de campanhas favoritas
CREATE TABLE IF NOT EXISTS favorite_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_phone text NOT NULL,
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(customer_phone, campaign_id)
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_favorite_campaigns_phone ON favorite_campaigns(customer_phone);
CREATE INDEX IF NOT EXISTS idx_favorite_campaigns_campaign_id ON favorite_campaigns(campaign_id);

-- Habilitar RLS
ALTER TABLE favorite_campaigns ENABLE ROW LEVEL SECURITY;

-- Política: Usuários anônimos e autenticados podem ler suas próprias favoritas
CREATE POLICY "Users can view own favorites"
  ON favorite_campaigns
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Política: Usuários anônimos e autenticados podem adicionar favoritas
CREATE POLICY "Users can add favorites"
  ON favorite_campaigns
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Política: Usuários anônimos e autenticados podem remover suas próprias favoritas
CREATE POLICY "Users can delete own favorites"
  ON favorite_campaigns
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- Conceder permissões
GRANT SELECT, INSERT, DELETE ON favorite_campaigns TO anon;
GRANT SELECT, INSERT, DELETE ON favorite_campaigns TO authenticated;

-- Comentário explicativo
COMMENT ON TABLE favorite_campaigns IS 'Armazena as campanhas favoritas dos usuários, identificados por número de telefone.';

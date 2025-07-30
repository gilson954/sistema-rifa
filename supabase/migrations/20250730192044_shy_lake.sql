/*
  # Criar tabela custom_domains

  1. Nova Tabela
    - `custom_domains` para mapear domínios personalizados a campanhas
    - Vincula domínios a usuários e campanhas específicas
    - Controla status de verificação DNS

  2. Colunas
    - `id` (UUID, chave primária)
    - `domain_name` (TEXT, único) - o domínio personalizado do cliente
    - `campaign_id` (UUID, FK) - campanha associada ao domínio
    - `user_id` (UUID, FK) - usuário proprietário do domínio
    - `is_verified` (BOOLEAN) - status da verificação DNS
    - `ssl_status` (TEXT) - status do certificado SSL
    - `created_at` e `updated_at` (TIMESTAMP)

  3. Segurança
    - Habilita RLS
    - Políticas para usuários gerenciarem apenas seus próprios domínios
*/

-- Criar tabela custom_domains
CREATE TABLE custom_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_name text UNIQUE NOT NULL,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  is_verified boolean DEFAULT false,
  ssl_status text DEFAULT 'pending' CHECK (ssl_status IN ('pending', 'active', 'failed')),
  dns_instructions jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Adicionar comentários
COMMENT ON TABLE custom_domains IS 'Stores custom domains configured by users for their campaigns';
COMMENT ON COLUMN custom_domains.domain_name IS 'The custom domain name (e.g., rifaminhaloja.com)';
COMMENT ON COLUMN custom_domains.campaign_id IS 'Campaign associated with this custom domain';
COMMENT ON COLUMN custom_domains.user_id IS 'User who owns this custom domain';
COMMENT ON COLUMN custom_domains.is_verified IS 'Whether DNS pointing has been verified';
COMMENT ON COLUMN custom_domains.ssl_status IS 'SSL certificate status for this domain';
COMMENT ON COLUMN custom_domains.dns_instructions IS 'DNS configuration instructions for the user';

-- Criar índices para performance
CREATE INDEX custom_domains_domain_name_idx ON custom_domains (domain_name);
CREATE INDEX custom_domains_campaign_id_idx ON custom_domains (campaign_id);
CREATE INDEX custom_domains_user_id_idx ON custom_domains (user_id);
CREATE INDEX custom_domains_verified_idx ON custom_domains (is_verified) WHERE is_verified = true;

-- Habilitar Row Level Security
ALTER TABLE custom_domains ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ler seus próprios domínios
CREATE POLICY "Users can read own custom domains"
  ON custom_domains
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Política: Usuários podem inserir domínios para si mesmos
CREATE POLICY "Users can insert own custom domains"
  ON custom_domains
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem atualizar seus próprios domínios
CREATE POLICY "Users can update own custom domains"
  ON custom_domains
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem deletar seus próprios domínios
CREATE POLICY "Users can delete own custom domains"
  ON custom_domains
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Política: Acesso público para leitura de domínios verificados (necessário para roteamento)
CREATE POLICY "Public read access for verified domains"
  ON custom_domains
  FOR SELECT
  TO anon, authenticated
  USING (is_verified = true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_custom_domains_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_custom_domains_updated_at
  BEFORE UPDATE ON custom_domains
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_domains_updated_at();
/*
  # Adicionar Colunas Faltantes na Tabela profiles

  1. Novas Colunas
    - `social_media_links` (jsonb) - Links das redes sociais do organizador
      - Formato: {"facebook": "url", "instagram": "url", ...}
      - DEFAULT: '{}'

    - `payment_integrations_config` (jsonb) - Configurações de integrações de pagamento
      - Formato: {"fluxsis": {...}, "pay2m": {...}, ...}
      - DEFAULT: '{}'

  2. Segurança
    - Todas as colunas são adicionadas com verificação IF NOT EXISTS
    - Valores default garantem compatibilidade com código existente
    - Dados sensíveis não são expostos publicamente

  3. Observações
    - Estas colunas são necessárias para funcionalidades de:
      - Redes Sociais (SocialMediaPage)
      - Métodos de Pagamento (PaymentIntegrationsPage)
    - A view public_profiles_view já referencia estas colunas
*/

-- Adicionar coluna social_media_links à tabela profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'social_media_links'
  ) THEN
    ALTER TABLE profiles ADD COLUMN social_media_links jsonb DEFAULT '{}';
  END IF;
END $$;

-- Adicionar coluna payment_integrations_config à tabela profiles (caso não exista)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'payment_integrations_config'
  ) THEN
    ALTER TABLE profiles ADD COLUMN payment_integrations_config jsonb DEFAULT '{}';
  END IF;
END $$;

-- Criar índice para otimizar consultas em social_media_links
CREATE INDEX IF NOT EXISTS idx_profiles_social_media_links
ON profiles USING GIN (social_media_links)
WHERE social_media_links IS NOT NULL AND social_media_links != '{}';

-- Criar índice para otimizar consultas em payment_integrations_config
CREATE INDEX IF NOT EXISTS idx_profiles_payment_config
ON profiles USING GIN (payment_integrations_config)
WHERE payment_integrations_config IS NOT NULL AND payment_integrations_config != '{}';

-- Comentários descritivos nas colunas
COMMENT ON COLUMN profiles.social_media_links IS 'Links das redes sociais do organizador (Facebook, Instagram, Twitter, etc.) em formato JSON';
COMMENT ON COLUMN profiles.payment_integrations_config IS 'Configurações das integrações de pagamento (Fluxsis, Pay2m, Paggue, Efi Bank) em formato JSON';

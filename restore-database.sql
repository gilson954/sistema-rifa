-- ==========================================
-- SCRIPT DE RESTAURAÇÃO DO BANCO DE DADOS
-- Execute este SQL no Supabase SQL Editor
-- ==========================================

-- 1. RECRIAR BUCKET DE LOGOS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'logos',
  'logos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[];

-- 2. REMOVER POLICIES ANTIGAS DO STORAGE
DROP POLICY IF EXISTS "Users can upload logos to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own logos" ON storage.objects;

-- 3. CRIAR POLICIES DO STORAGE
CREATE POLICY "Users can upload logos to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'logos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Public read access for logos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'logos');

CREATE POLICY "Users can update own logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'logos' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'logos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'logos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. GARANTIR QUE AS COLUNAS EXISTEM NA TABELA PROFILES
DO $$
BEGIN
  -- social_media_links
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'social_media_links'
  ) THEN
    ALTER TABLE profiles ADD COLUMN social_media_links jsonb DEFAULT '{}';
  END IF;

  -- payment_integrations_config
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'payment_integrations_config'
  ) THEN
    ALTER TABLE profiles ADD COLUMN payment_integrations_config jsonb DEFAULT '{}';
  END IF;

  -- primary_color
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'primary_color'
  ) THEN
    ALTER TABLE profiles ADD COLUMN primary_color text DEFAULT '#3B82F6';
  END IF;

  -- theme
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'theme'
  ) THEN
    ALTER TABLE profiles ADD COLUMN theme text DEFAULT 'claro';
  END IF;

  -- logo_url
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'logo_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN logo_url text;
  END IF;

  -- color_mode
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'color_mode'
  ) THEN
    ALTER TABLE profiles ADD COLUMN color_mode text DEFAULT 'solid';
  END IF;

  -- gradient_classes
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'gradient_classes'
  ) THEN
    ALTER TABLE profiles ADD COLUMN gradient_classes text;
  END IF;

  -- custom_gradient_colors
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'custom_gradient_colors'
  ) THEN
    ALTER TABLE profiles ADD COLUMN custom_gradient_colors text;
  END IF;
END $$;

-- 5. CRIAR ÍNDICES (se não existirem)
CREATE INDEX IF NOT EXISTS idx_profiles_social_media_links
ON profiles USING GIN (social_media_links)
WHERE social_media_links IS NOT NULL AND social_media_links != '{}';

CREATE INDEX IF NOT EXISTS idx_profiles_payment_config
ON profiles USING GIN (payment_integrations_config)
WHERE payment_integrations_config IS NOT NULL AND payment_integrations_config != '{}';

CREATE INDEX IF NOT EXISTS idx_profiles_color_mode
ON profiles (color_mode)
WHERE color_mode IS NOT NULL;

-- 6. ADICIONAR CONSTRAINTS DE VALIDAÇÃO
DO $$
BEGIN
  -- Validar color_mode
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'profiles' AND constraint_name = 'profiles_color_mode_check'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_color_mode_check
    CHECK (color_mode IS NULL OR color_mode IN ('solid', 'gradient'));
  END IF;

  -- Validar theme
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'profiles_theme_check'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_theme_check
    CHECK (theme IN ('claro', 'escuro', 'escuro-preto'));
  END IF;
END $$;

-- 7. ADICIONAR COMENTÁRIOS
COMMENT ON COLUMN profiles.social_media_links IS 'Links das redes sociais do organizador (Facebook, Instagram, Twitter, etc.) em formato JSON';
COMMENT ON COLUMN profiles.payment_integrations_config IS 'Configurações das integrações de pagamento (Fluxsis, Pay2m, Paggue, Efi Bank) em formato JSON';
COMMENT ON COLUMN profiles.primary_color IS 'Cor principal utilizada na personalização das campanhas';
COMMENT ON COLUMN profiles.theme IS 'Tema visual escolhido pelo usuário (claro, escuro, escuro-preto)';
COMMENT ON COLUMN profiles.logo_url IS 'URL da logo do organizador armazenada no Supabase Storage';
COMMENT ON COLUMN profiles.color_mode IS 'Modo de visualização de cor: solid (cor sólida) ou gradient (gradiente animado)';
COMMENT ON COLUMN profiles.gradient_classes IS 'Classes CSS Tailwind do gradiente predefinido ou "custom" para gradiente personalizado';
COMMENT ON COLUMN profiles.custom_gradient_colors IS 'Array JSON de cores hexadecimais para gradientes personalizados (2-3 cores)';

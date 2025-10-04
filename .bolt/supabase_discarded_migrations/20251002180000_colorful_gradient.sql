/*
  # Adicionar Sistema de Personalização de Cores e Gradientes

  1. Modificações na Tabela profiles
    - `color_mode` (text, opcional) - Modo de cor: 'solid' ou 'gradient'
      - DEFAULT: 'solid'
      - Determina se o usuário usa cor sólida ou gradiente animado

    - `gradient_classes` (text, opcional) - Classes CSS do gradiente
      - Armazena classes Tailwind para gradientes predefinidos
      - Valor 'custom' indica que está usando gradiente personalizado
      - Exemplos: 'from-purple-600 via-pink-500 to-blue-600'

    - `custom_gradient_colors` (text, opcional) - Cores personalizadas do gradiente
      - Armazena array JSON de cores hexadecimais
      - Formato: '["#9333EA", "#EC4899", "#3B82F6"]'
      - Suporta 2 a 3 cores

  2. Índices
    - Adicionar índice para color_mode para otimizar consultas de personalização
    - Índices parciais para otimizar busca por usuários com customização

  3. Constraints
    - Validar que color_mode é 'solid' ou 'gradient'
    - Validar formato JSON de custom_gradient_colors quando preenchido

  4. Observações
    - Campos são opcionais para não quebrar dados existentes
    - Valores default garantem funcionalidade mesmo sem configuração
    - Sistema retrocompatível com dados existentes
*/

-- Adicionar coluna color_mode à tabela profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'color_mode'
  ) THEN
    ALTER TABLE profiles ADD COLUMN color_mode text DEFAULT 'solid';
  END IF;
END $$;

-- Adicionar coluna gradient_classes à tabela profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'gradient_classes'
  ) THEN
    ALTER TABLE profiles ADD COLUMN gradient_classes text;
  END IF;
END $$;

-- Adicionar coluna custom_gradient_colors à tabela profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'custom_gradient_colors'
  ) THEN
    ALTER TABLE profiles ADD COLUMN custom_gradient_colors text;
  END IF;
END $$;

-- Criar índice para color_mode (otimiza consultas por modo de cor)
CREATE INDEX IF NOT EXISTS idx_profiles_color_mode
ON profiles (color_mode)
WHERE color_mode IS NOT NULL;

-- Criar índice parcial para usuários com gradientes customizados
CREATE INDEX IF NOT EXISTS idx_profiles_custom_gradients
ON profiles (id)
WHERE custom_gradient_colors IS NOT NULL AND custom_gradient_colors != '';

-- Adicionar constraint para validar color_mode
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'profiles' AND constraint_name = 'profiles_color_mode_check'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_color_mode_check
    CHECK (color_mode IS NULL OR color_mode IN ('solid', 'gradient'));
  END IF;
END $$;

-- Adicionar constraint para validar formato JSON básico de custom_gradient_colors
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'profiles' AND constraint_name = 'profiles_custom_gradient_json_check'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_custom_gradient_json_check
    CHECK (
      custom_gradient_colors IS NULL OR
      custom_gradient_colors = '' OR
      (custom_gradient_colors LIKE '[%]' AND custom_gradient_colors::jsonb IS NOT NULL)
    );
  END IF;
END $$;

-- Comentários descritivos nas colunas
COMMENT ON COLUMN profiles.color_mode IS 'Modo de visualização de cor: solid (cor sólida) ou gradient (gradiente animado)';
COMMENT ON COLUMN profiles.gradient_classes IS 'Classes CSS Tailwind do gradiente predefinido ou "custom" para gradiente personalizado';
COMMENT ON COLUMN profiles.custom_gradient_colors IS 'Array JSON de cores hexadecimais para gradientes personalizados (2-3 cores)';

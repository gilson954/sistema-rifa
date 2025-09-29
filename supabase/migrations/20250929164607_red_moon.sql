/*
  # Adicionar campos CPF e telefone ao perfil

  1. Modificações na Tabela
    - `profiles`
      - `cpf` (text, opcional) - CPF do usuário
      - `phone_number` (text, opcional) - Número de telefone completo com código do país

  2. Índices
    - Adicionar índice para busca por CPF (quando preenchido)
    - Adicionar índice para busca por telefone (quando preenchido)

  3. Observações
    - Campos são opcionais para não quebrar dados existentes
    - CPF será armazenado apenas com números
    - Telefone será armazenado com código do país (ex: +55 11999999999)
*/

-- Adicionar coluna CPF à tabela profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'cpf'
  ) THEN
    ALTER TABLE profiles ADD COLUMN cpf text;
  END IF;
END $$;

-- Adicionar coluna phone_number à tabela profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone_number text;
  END IF;
END $$;

-- Criar índice para CPF (apenas quando preenchido)
CREATE INDEX IF NOT EXISTS idx_profiles_cpf 
ON profiles (cpf) 
WHERE cpf IS NOT NULL AND cpf != '';

-- Criar índice para telefone (apenas quando preenchido)
CREATE INDEX IF NOT EXISTS idx_profiles_phone_number 
ON profiles (phone_number) 
WHERE phone_number IS NOT NULL AND phone_number != '';

-- Adicionar constraint para validar formato do CPF (apenas números, 11 dígitos)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'profiles' AND constraint_name = 'profiles_cpf_format_check'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_cpf_format_check 
    CHECK (cpf IS NULL OR cpf = '' OR (cpf ~ '^[0-9]{11}$'));
  END IF;
END $$;

-- Adicionar constraint para validar formato básico do telefone
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'profiles' AND constraint_name = 'profiles_phone_format_check'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_phone_format_check 
    CHECK (phone_number IS NULL OR phone_number = '' OR length(phone_number) >= 10);
  END IF;
END $$;
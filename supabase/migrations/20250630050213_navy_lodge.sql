/*
  # Adicionar coluna is_admin à tabela profiles

  1. Alterações na tabela
    - Adiciona coluna `is_admin` (boolean, padrão false) à tabela `profiles`
    - Cria índice para melhor performance em consultas de administradores
  
  2. Segurança
    - Mantém as políticas RLS existentes
    - Adiciona política para que apenas administradores possam ver outros administradores
*/

-- Adicionar coluna is_admin à tabela profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_admin boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- Criar índice para consultas de administradores
CREATE INDEX IF NOT EXISTS profiles_is_admin_idx ON profiles(is_admin) WHERE is_admin = true;

-- Adicionar política RLS para que administradores possam ver outros administradores
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname = 'Admins can view all profiles'
  ) THEN
    CREATE POLICY "Admins can view all profiles"
      ON profiles
      FOR SELECT
      TO authenticated
      USING (
        auth.uid() = id OR 
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() AND is_admin = true
        )
      );
  END IF;
END $$;

-- Adicionar política para que administradores possam atualizar outros perfis
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname = 'Admins can update all profiles'
  ) THEN
    CREATE POLICY "Admins can update all profiles"
      ON profiles
      FOR UPDATE
      TO authenticated
      USING (
        auth.uid() = id OR 
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() AND is_admin = true
        )
      )
      WITH CHECK (
        auth.uid() = id OR 
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() AND is_admin = true
        )
      );
  END IF;
END $$;
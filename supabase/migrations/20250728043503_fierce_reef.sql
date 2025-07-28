/*
  # Adicionar coluna primary_color à tabela profiles

  1. Nova Coluna
    - `primary_color` (text) - Cor principal do usuário em formato hexadecimal
    - Valor padrão: '#3B82F6' (azul padrão)
    - Permite NULL para compatibilidade com perfis existentes

  2. Segurança
    - Nenhuma alteração nas políticas RLS existentes
    - A coluna herda as permissões da tabela profiles

  3. Validação
    - Verifica se a coluna já existe antes de criar
    - Operação segura e idempotente
*/

-- Adicionar coluna primary_color à tabela profiles se ela não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'primary_color'
  ) THEN
    ALTER TABLE profiles ADD COLUMN primary_color text DEFAULT '#3B82F6';
  END IF;
END $$;

-- Comentário para documentar a coluna
COMMENT ON COLUMN profiles.primary_color IS 'Cor principal do usuário em formato hexadecimal (ex: #3B82F6)';
/*
  # Sistema de Sugestões

  1. Nova Tabela
    - `suggestions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key para auth.users)
      - `user_name` (text, nome do usuário)
      - `user_email` (text, email do usuário)
      - `subject` (text, assunto da sugestão)
      - `type` (text, tipo de feedback)
      - `priority` (text, nível de urgência)
      - `message` (text, detalhes da sugestão)
      - `status` (text, status da sugestão)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Segurança
    - Enable RLS na tabela `suggestions`
    - Políticas para usuários enviarem suas próprias sugestões
    - Políticas para administradores gerenciarem todas as sugestões

  3. Índices
    - Índices para melhor performance em consultas
*/

-- Criar tabela de sugestões
CREATE TABLE IF NOT EXISTS suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name text NOT NULL,
  user_email text NOT NULL,
  subject text NOT NULL,
  type text NOT NULL CHECK (type IN ('bug_report', 'feature_request', 'improvement', 'other')),
  priority text NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can insert their own suggestions"
  ON suggestions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own suggestions"
  ON suggestions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all suggestions"
  ON suggestions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can update all suggestions"
  ON suggestions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can delete all suggestions"
  ON suggestions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_suggestions_user_id ON suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON suggestions(status);
CREATE INDEX IF NOT EXISTS idx_suggestions_priority ON suggestions(priority);
CREATE INDEX IF NOT EXISTS idx_suggestions_type ON suggestions(type);
CREATE INDEX IF NOT EXISTS idx_suggestions_created_at ON suggestions(created_at DESC);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_suggestions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_suggestions_updated_at
  BEFORE UPDATE ON suggestions
  FOR EACH ROW
  EXECUTE FUNCTION update_suggestions_updated_at();
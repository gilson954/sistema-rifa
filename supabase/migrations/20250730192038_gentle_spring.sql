/*
  # Adicionar coluna slug à tabela campaigns

  1. Mudanças na Tabela
    - Adiciona coluna `slug` do tipo TEXT com restrição UNIQUE
    - Permite valores NULL inicialmente para campanhas existentes
    - Adiciona comentário explicativo sobre o propósito da coluna

  2. Índices
    - Cria índice `campaigns_slug_idx` para otimizar buscas por slug
    - Melhora performance das consultas de campanhas públicas

  3. Segurança
    - Mantém as políticas RLS existentes
    - A coluna slug será visível publicamente (necessário para campanhas públicas)
*/

-- Adicionar coluna slug à tabela campaigns
ALTER TABLE campaigns 
ADD COLUMN slug TEXT UNIQUE;

-- Adicionar comentário explicativo
COMMENT ON COLUMN campaigns.slug IS 'URL-friendly identifier for public campaign access (e.g., /c/minha-rifa-de-natal)';

-- Criar índice para otimizar buscas por slug
CREATE INDEX campaigns_slug_idx ON campaigns (slug) WHERE slug IS NOT NULL;

-- Criar índice composto para buscas de campanhas ativas por slug
CREATE INDEX campaigns_slug_status_idx ON campaigns (slug, status) WHERE slug IS NOT NULL AND status = 'active';
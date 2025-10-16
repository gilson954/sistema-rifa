# 🔧 Instruções para Aplicar a Migração `is_featured`

## ⚠️ Problema Identificado

A coluna `is_featured` não existe na tabela `campaigns` do banco de dados. Esta coluna é necessária para destacar campanhas no banner principal.

## ✅ Solução: Aplicar a Migração

### Opção 1: Usando o Supabase Dashboard (Recomendado)

1. **Acesse o Supabase Dashboard:**
   - Vá para: https://supabase.com/dashboard
   - Faça login na sua conta
   - Selecione o projeto: `byymchepurnfawqlrcxh`

2. **Navegue até o SQL Editor:**
   - No menu lateral, clique em **"SQL Editor"**
   - Ou acesse diretamente: https://supabase.com/dashboard/project/byymchepurnfawqlrcxh/sql

3. **Execute a Migração:**
   - Clique no botão **"New Query"**
   - Copie e cole o seguinte SQL:

```sql
-- Add is_featured column to campaigns table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'is_featured'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN is_featured boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- Create index for efficient featured campaign lookups
CREATE INDEX IF NOT EXISTS campaigns_user_featured_idx ON campaigns(user_id, is_featured) WHERE is_featured = true;

-- Create function to ensure only one featured campaign per user
CREATE OR REPLACE FUNCTION ensure_single_featured_campaign()
RETURNS TRIGGER AS $$
BEGIN
  -- If the new/updated campaign is being marked as featured
  IF NEW.is_featured = true THEN
    -- Unfeature all other campaigns by the same user
    UPDATE campaigns
    SET is_featured = false
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_featured = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to maintain single featured campaign constraint
DROP TRIGGER IF EXISTS ensure_single_featured_campaign_trigger ON campaigns;
CREATE TRIGGER ensure_single_featured_campaign_trigger
  BEFORE INSERT OR UPDATE OF is_featured ON campaigns
  FOR EACH ROW
  WHEN (NEW.is_featured = true)
  EXECUTE FUNCTION ensure_single_featured_campaign();

-- Add helpful comment
COMMENT ON COLUMN campaigns.is_featured IS 'Indicates if this campaign is featured on the organizer''s home page. Only one campaign per user can be featured at a time.';
```

4. **Execute o Script:**
   - Clique no botão **"Run"** ou pressione `Ctrl+Enter` (Windows/Linux) ou `Cmd+Enter` (Mac)
   - Aguarde a confirmação: **"Success. No rows returned"**

### Opção 2: Usando o Supabase CLI

Se você tem o Supabase CLI instalado localmente:

```bash
# Aplicar todas as migrações pendentes
npx supabase db push

# Ou aplicar apenas esta migração específica
npx supabase db push --file supabase/migrations/20251016160000_add_featured_campaign_support.sql
```

## 🎯 O que esta migração faz?

1. **Adiciona a coluna `is_featured`** à tabela `campaigns`
   - Tipo: `boolean`
   - Valor padrão: `false`
   - Obrigatório (NOT NULL)

2. **Cria um índice** para melhorar a performance das consultas de campanhas destacadas

3. **Cria uma função e trigger** para garantir que:
   - Apenas UMA campanha por organizador pode ser destacada por vez
   - Quando uma nova campanha é destacada, a anterior é automaticamente removida do destaque

## ✨ Após Aplicar a Migração

Depois de executar a migração com sucesso:

1. ✅ A coluna `is_featured` estará disponível na tabela `campaigns`
2. ✅ Você poderá clicar no botão **"Destacar"** nas suas campanhas ativas ou concluídas
3. ✅ A campanha destacada aparecerá no banner principal da sua página de organizador
4. ✅ Toast notifications informarão sobre o sucesso ou erro da operação

## 🔍 Verificação

Para verificar se a migração foi aplicada com sucesso, execute no SQL Editor:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'campaigns' AND column_name = 'is_featured';
```

Você deve ver:
- `column_name`: `is_featured`
- `data_type`: `boolean`
- `is_nullable`: `NO`
- `column_default`: `false`

---

## 📞 Precisa de Ajuda?

Se encontrar algum problema ao aplicar a migração, verifique:

1. Se você tem permissões de administrador no projeto Supabase
2. Se o SQL Editor está respondendo (às vezes pode haver latência)
3. Se há alguma mensagem de erro específica (copie e cole para análise)

**Importante:** Esta migração é **idempotente**, ou seja, pode ser executada múltiplas vezes sem causar problemas. Se a coluna já existir, ela não será recriada.

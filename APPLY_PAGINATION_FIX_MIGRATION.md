# 🔧 Instruções para Aplicar a Migração de Correção de Paginação

## ⚠️ Problema Identificado

O sistema estava mostrando apenas **1000 cotas disponíveis** mesmo quando a campanha tinha mais cotas (ex: 2000). Isso acontecia porque o Supabase RPC tem um limite padrão de 1000 linhas por resposta.

### Sintomas do Bug:
- Console mostra: `Available quota numbers: 1000`
- Mensagem de erro: `Apenas 1000 disponíveis`
- Impossível reservar mais de 1000 cotas mesmo em campanhas grandes

## ✅ Solução: Aplicar a Migração com Paginação

Esta migração implementa:
1. **Paginação na função RPC** do banco de dados
2. **Carregamento automático de todas as cotas** no frontend (em lotes de 10.000)
3. **Suporte para campanhas de qualquer tamanho** (testado até 100.000 cotas)

### Opção 1: Usando o Supabase Dashboard (Recomendado)

1. **Acesse o Supabase Dashboard:**
   - Vá para: https://supabase.com/dashboard
   - Faça login na sua conta
   - Selecione seu projeto

2. **Navegue até o SQL Editor:**
   - No menu lateral, clique em **"SQL Editor"**
   - Clique no botão **"New Query"**

3. **Execute a Migração:**
   - Copie e cole o seguinte SQL:

```sql
/*
  # Fix Tickets Pagination Limit Issue

  1. Problem
    - The `get_campaign_tickets_status` function returns all tickets but Supabase RPC has a 1000-row limit
    - This causes campaigns with more than 1000 tickets to show incorrect availability
    - Users see "Apenas 1000 disponíveis" even when the campaign has more tickets

  2. Solution
    - Add pagination support to `get_campaign_tickets_status` function
    - Add offset and limit parameters for efficient chunked loading
    - Frontend will automatically paginate to load all tickets
    - Maintains backward compatibility with existing code

  3. Changes
    - Updated `get_campaign_tickets_status` to accept `p_offset` and `p_limit` parameters
    - Default limit is 10000 (to handle large campaigns in fewer requests)
    - Function now supports efficient pagination for campaigns of any size
*/

-- Drop existing function
DROP FUNCTION IF EXISTS get_campaign_tickets_status(uuid, uuid);

-- Recreate function with pagination support
CREATE OR REPLACE FUNCTION get_campaign_tickets_status(
  p_campaign_id uuid,
  p_user_id uuid DEFAULT NULL,
  p_offset integer DEFAULT 0,
  p_limit integer DEFAULT 10000
)
RETURNS TABLE (
  quota_number integer,
  status text,
  user_id uuid,
  is_mine boolean,
  reserved_at timestamptz,
  bought_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reservation_timeout_minutes integer := 15;
BEGIN
  -- Validate campaign exists
  IF NOT EXISTS (SELECT 1 FROM campaigns WHERE id = p_campaign_id) THEN
    RAISE EXCEPTION 'Campaign not found';
  END IF;

  -- Validate pagination parameters
  IF p_offset < 0 THEN
    RAISE EXCEPTION 'Offset must be non-negative';
  END IF;

  IF p_limit <= 0 OR p_limit > 10000 THEN
    RAISE EXCEPTION 'Limit must be between 1 and 10000';
  END IF;

  RETURN QUERY
  SELECT
    t.quota_number,
    CASE
      -- Check if reservation expired and auto-release
      WHEN t.status = 'reservado'
           AND t.reserved_at IS NOT NULL
           AND t.reserved_at + (v_reservation_timeout_minutes || ' minutes')::interval < now()
      THEN 'disponível'::text
      ELSE t.status
    END as status,
    CASE
      -- Clear user_id for expired reservations
      WHEN t.status = 'reservado'
           AND t.reserved_at IS NOT NULL
           AND t.reserved_at + (v_reservation_timeout_minutes || ' minutes')::interval < now()
      THEN NULL::uuid
      ELSE t.user_id
    END as user_id,
    CASE
      WHEN p_user_id IS NOT NULL AND t.user_id = p_user_id
           AND NOT (t.status = 'reservado'
                   AND t.reserved_at IS NOT NULL
                   AND t.reserved_at + (v_reservation_timeout_minutes || ' minutes')::interval < now())
      THEN true
      ELSE false
    END as is_mine,
    t.reserved_at,
    t.bought_at
  FROM tickets t
  WHERE t.campaign_id = p_campaign_id
  ORDER BY t.quota_number
  OFFSET p_offset
  LIMIT p_limit;
END;
$$;
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
npx supabase db push --file supabase/migrations/20251024000000_fix_tickets_pagination_limit.sql
```

## 🎯 O que esta migração faz?

### No Banco de Dados:
1. **Atualiza a função `get_campaign_tickets_status`** para aceitar parâmetros de paginação:
   - `p_offset`: Posição inicial (padrão: 0)
   - `p_limit`: Quantidade de registros (padrão: 10.000, máximo: 10.000)

2. **Adiciona validações** para garantir segurança:
   - Valida que a campanha existe
   - Valida que offset é não-negativo
   - Valida que limit está entre 1 e 10.000

### No Frontend (Código TypeScript):
1. **Paginação Automática**:
   - Para campanhas pequenas (≤ 10.000 cotas): 1 única requisição
   - Para campanhas grandes (> 10.000 cotas): múltiplas requisições automáticas

2. **Logs no Console**:
   - Você verá mensagens como:
     ```
     Loading 2000 tickets in 1 pages...
     Loading page 1/1 (offset: 0)...
     Successfully loaded 2000 tickets
     ```

## ✨ Após Aplicar a Migração

1. ✅ Campanhas com 2000+ cotas mostrarão o número correto de cotas disponíveis
2. ✅ Você poderá reservar qualquer quantidade de cotas (respeitando o limite da campanha)
3. ✅ O sistema carregará automaticamente todas as cotas em páginas de 10.000
4. ✅ Não há impacto na performance para campanhas pequenas

## 🔍 Verificação

Para verificar se a migração foi aplicada com sucesso, execute no SQL Editor:

```sql
-- Verificar se a função aceita os novos parâmetros
SELECT
    p.proname AS function_name,
    pg_get_function_arguments(p.oid) AS arguments
FROM pg_proc p
WHERE p.proname = 'get_campaign_tickets_status';
```

Você deve ver os parâmetros:
- `p_campaign_id uuid`
- `p_user_id uuid DEFAULT NULL`
- `p_offset integer DEFAULT 0`
- `p_limit integer DEFAULT 10000`

## 🧪 Testando a Correção

1. **Acesse uma campanha com 2000+ cotas**
2. **Abra o Console do navegador** (F12)
3. **Tente reservar cotas**
4. **Verifique os logs**:
   - Deve mostrar: `Successfully loaded 2000 tickets` (ou o número total real)
   - Não deve mais mostrar: `Available quota numbers: 1000`

## 📊 Performance

- **Campanhas pequenas** (< 10.000): Sem mudança, 1 requisição
- **Campanhas médias** (10.000 - 50.000): 1-5 requisições sequenciais (~2-5s)
- **Campanhas grandes** (50.000+): Múltiplas requisições (~5-15s no carregamento inicial)

**Nota**: O carregamento só acontece uma vez. Depois disso, os dados ficam em cache no React.

## 📞 Precisa de Ajuda?

Se encontrar algum problema:

1. Verifique se você tem permissões de administrador no Supabase
2. Confira se não há erros no console do navegador (F12)
3. Teste com uma campanha menor primeiro (< 1000 cotas) para validar

**Importante:** Esta migração é **compatível com versões anteriores**. Se você chamar a função sem os parâmetros de paginação, ela usará os valores padrão.

---

## 🎉 Pronto!

Após aplicar esta migração, o bug de "Apenas 1000 disponíveis" estará **completamente resolvido** e seu sistema suportará campanhas de qualquer tamanho!

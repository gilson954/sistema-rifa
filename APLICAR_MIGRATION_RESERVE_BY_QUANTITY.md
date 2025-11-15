# Como Aplicar a Migration: reserve_tickets_by_quantity

## 🎯 Objetivo

Esta migration cria a função `reserve_tickets_by_quantity` no banco de dados Supabase, que é essencial para o funcionamento da reserva automática de cotas.

## 📋 Pré-requisitos

- Acesso ao Supabase Dashboard
- Projeto Supabase: `byymchepurnfawqlrcxh`
- URL: https://byymchepurnfawqlrcxh.supabase.co

## 🚀 Passo a Passo

### Opção 1: Via Supabase Dashboard (Recomendado)

1. **Acesse o Supabase Dashboard**
   - Vá para: https://supabase.com/dashboard/project/byymchepurnfawqlrcxh
   - Faça login se necessário

2. **Abra o SQL Editor**
   - No menu lateral esquerdo, clique em **SQL Editor**
   - Ou acesse diretamente: https://supabase.com/dashboard/project/byymchepurnfawqlrcxh/sql

3. **Crie uma Nova Query**
   - Clique em **New query** (botão no canto superior direito)

4. **Cole o SQL da Migration**
   - Abra o arquivo: `supabase/migrations/20251115000000_create_reserve_tickets_by_quantity.sql`
   - Copie TODO o conteúdo do arquivo
   - Cole no SQL Editor

5. **Execute a Query**
   - Clique no botão **Run** (ou pressione Ctrl+Enter / Cmd+Enter)
   - Aguarde a confirmação de sucesso

6. **Verifique a Criação**
   - Execute esta query para confirmar que a função foi criada:
   ```sql
   SELECT routine_name, routine_type
   FROM information_schema.routines
   WHERE routine_schema = 'public'
   AND routine_name = 'reserve_tickets_by_quantity';
   ```
   - Você deve ver 1 resultado retornado

### Opção 2: Via Ferramenta MCP do Supabase (Se disponível)

Se você tem acesso à ferramenta MCP do Supabase no seu ambiente:

```bash
# Use a ferramenta MCP apropriada para aplicar a migration
# Exemplo (ajuste conforme sua configuração):
mcp supabase apply-migration supabase/migrations/20251115000000_create_reserve_tickets_by_quantity.sql
```

## ✅ Verificação Pós-Migration

Após aplicar a migration, execute estas queries para confirmar que tudo está funcionando:

### 1. Verificar se a função existe

```sql
SELECT
  routine_name,
  routine_type,
  data_type,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'reserve_tickets_by_quantity';
```

### 2. Verificar os parâmetros da função

```sql
SELECT
  parameter_name,
  data_type,
  parameter_mode
FROM information_schema.parameters
WHERE specific_schema = 'public'
AND specific_name = 'reserve_tickets_by_quantity'
ORDER BY ordinal_position;
```

### 3. Testar a função (Opcional - apenas se houver dados de teste)

```sql
-- ATENÇÃO: Só execute se você tem uma campanha de teste
-- Substitua os valores pelos seus dados reais de teste

SELECT * FROM reserve_tickets_by_quantity(
  'SEU_CAMPAIGN_ID'::uuid,  -- ID da campanha
  5,                          -- Quantidade de cotas
  NULL,                       -- User ID (NULL para anônimo)
  'João Teste',               -- Nome do cliente
  'joao@teste.com',          -- Email do cliente
  '+5562999999999',          -- Telefone do cliente
  now(),                      -- Timestamp da reserva
  'test-order-id'            -- ID do pedido
);
```

## 🔍 O Que a Migration Faz?

A função `reserve_tickets_by_quantity` realiza as seguintes operações:

1. **Valida a quantidade solicitada** (máximo 20.000 cotas por chamada)
2. **Busca o timeout de reserva** da campanha específica
3. **Encontra automaticamente cotas disponíveis**, incluindo:
   - Cotas com status 'disponível'
   - Cotas com reserva expirada
4. **Reserva as cotas sequencialmente** com lock (FOR UPDATE SKIP LOCKED)
5. **Retorna informações detalhadas** de cada cota reservada:
   - Número da cota
   - Status
   - Mensagem de confirmação
   - Dados do cliente
   - Timestamp da reserva

## 🎉 Próximos Passos

Após aplicar a migration com sucesso:

1. **Teste a aplicação**
   - Tente fazer uma reserva de cotas
   - Verifique se não há erros no console do navegador
   - Confirme que as cotas são reservadas corretamente

2. **Teste com diferentes quantidades**
   - Pequenas quantidades (1-10 cotas)
   - Quantidades médias (100-500 cotas)
   - Grandes quantidades (1000+ cotas para testar batching)

3. **Verifique os dados do cliente**
   - Confirme que nome, email e telefone são salvos
   - Verifique o formato do telefone (E.164: +5562999999999)
   - Valide que order_id está consistente

## 🆘 Problemas Comuns

### Erro: "function does not exist"
- **Solução**: A migration não foi aplicada. Siga os passos acima.

### Erro: "permission denied"
- **Solução**: Verifique se você tem permissões de administrador no projeto Supabase.

### Erro: "already exists"
- **Solução**: A função já existe. Não é necessário aplicar novamente.

### Erro durante a execução da query
- **Solução**: Copie TODA a migration, incluindo comentários. O SQL precisa ser executado completo.

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do Supabase no Dashboard
2. Confira se todas as outras migrations foram aplicadas
3. Revise a documentação do Supabase sobre Functions

---

**Data de criação**: 2025-11-15
**Arquivo de migration**: `supabase/migrations/20251115000000_create_reserve_tickets_by_quantity.sql`

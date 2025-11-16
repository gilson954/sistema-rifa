# 🚀 Guia Rápido: Aplicar Correção do Bug order_id

## 📋 Resumo da Correção

**Problema:** Reutilização de order_id causando agrupamento incorreto de pedidos independentes.

**Solução:** Adição de coluna física `order_id` na tabela `tickets` com persistência em todas as operações.

---

## ✅ Passo a Passo

### 1️⃣ Verificar Migrations Criadas

As seguintes migrations foram criadas e estão prontas para aplicação:

```
supabase/migrations/
├── 20251116000000_add_order_id_column_to_tickets.sql
├── 20251116000001_update_reserve_tickets_by_quantity_with_order_id.sql
├── 20251116000002_update_get_orders_by_phone_with_physical_order_id.sql
└── 20251116000003_backfill_order_id_for_existing_tickets.sql
```

### 2️⃣ Aplicação Automática (Supabase Dashboard)

As migrations serão aplicadas **automaticamente** pelo Supabase na ordem correta quando você fizer deploy ou commit ao repositório.

**Não é necessário fazer nada manualmente!**

### 3️⃣ Verificação Pós-Aplicação

Após as migrations serem aplicadas, execute no Supabase SQL Editor:

```sql
-- 1. Verificar que a coluna order_id existe
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tickets'
AND column_name = 'order_id';

-- ✅ Resultado esperado:
-- column_name | data_type | is_nullable
-- order_id    | text      | YES


-- 2. Verificar estatísticas de backfill
SELECT * FROM order_id_stats;

-- ✅ Resultado esperado:
-- total_unique_orders | total_tickets | tickets_without_order_id | tickets_with_order_id | percentage_with_order_id
-- 150                 | 450           | 0                        | 450                   | 100.00


-- 3. Verificar que a função foi atualizada
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('reserve_tickets_by_quantity', 'get_orders_by_phone');

-- ✅ Resultado esperado:
-- routine_name                    | routine_type
-- reserve_tickets_by_quantity     | FUNCTION
-- get_orders_by_phone             | FUNCTION
```

---

## 🧪 Testes de Validação

### Teste 1: Nova Reserva

1. Acesse uma campanha ativa
2. Selecione algumas cotas e reserve
3. Vá para "Meus Pedidos"
4. ✅ Verifique que aparece 1 card com as cotas reservadas

### Teste 2: Múltiplas Reservas

1. Repita o teste acima mais 2 vezes (3 reservas totais)
2. Vá para "Meus Pedidos"
3. ✅ Verifique que aparecem 3 cards separados, um para cada reserva

### Teste 3: Verificar order_id no Banco

```sql
-- Buscar últimas reservas de um telefone
SELECT
  order_id,
  COUNT(*) as ticket_count,
  MAX(reserved_at) as reservation_time,
  status
FROM tickets
WHERE customer_phone = '+5562999999999'  -- Use um telefone de teste real
AND order_id IS NOT NULL
GROUP BY order_id, status
ORDER BY MAX(reserved_at) DESC
LIMIT 5;

-- ✅ Resultado esperado:
-- order_id                              | ticket_count | reservation_time        | status
-- 550e8400-e29b-41d4-a716-446655440003  | 3            | 2025-11-16 12:30:00+00 | reservado
-- 550e8400-e29b-41d4-a716-446655440002  | 5            | 2025-11-16 12:20:00+00 | reservado
-- 550e8400-e29b-41d4-a716-446655440001  | 8            | 2025-11-16 12:10:00+00 | comprado
```

### Teste 4: Testar Agrupamento Correto

```sql
-- Ver pedidos agrupados de um usuário
SELECT * FROM get_orders_by_phone('+5562999999999');

-- ✅ Verificar:
-- - Cada linha representa um pedido único
-- - order_id é diferente para cada pedido
-- - ticket_numbers contém os números corretos
-- - ticket_count corresponde ao array de números
```

---

## 🔍 Troubleshooting

### Problema: Coluna order_id não existe

**Sintoma:**
```
ERROR: column "order_id" does not exist
```

**Solução:**
```sql
-- Verificar se a migration foi aplicada
SELECT version, name
FROM supabase_migrations.schema_migrations
WHERE name LIKE '%order_id%'
ORDER BY version DESC;

-- Se não aparecer, aplicar manualmente:
-- Copie e cole o conteúdo de cada migration no SQL Editor
```

### Problema: Tickets sem order_id

**Sintoma:**
```sql
SELECT COUNT(*) FROM tickets WHERE order_id IS NULL;
-- Retorna > 0
```

**Solução:**
```sql
-- Executar manualmente o backfill
-- (Copie o código da migration 20251116000003)
```

### Problema: Pedidos ainda agrupados incorretamente

**Sintoma:** MyTicketsPage mostra múltiplas reservas como um único pedido

**Causa Provável:** Reservas feitas ANTES da correção ser aplicada

**Solução:**
1. Fazer uma nova reserva de teste
2. Verificar que a nova reserva aparece corretamente
3. Se sim, o sistema está funcionando. Pedidos antigos podem estar agrupados por terem sido criados antes da correção.

---

## 📊 Monitoramento

### Query para Monitorar Saúde do Sistema

```sql
-- View geral de estatísticas
SELECT
  COUNT(DISTINCT order_id) as total_orders,
  COUNT(*) as total_tickets,
  COUNT(DISTINCT campaign_id) as total_campaigns,
  COUNT(*) FILTER (WHERE order_id IS NULL) as tickets_without_order_id,
  ROUND(100.0 * COUNT(*) FILTER (WHERE order_id IS NOT NULL) / COUNT(*), 2) as coverage_percentage
FROM tickets;

-- Pedidos recentes
SELECT
  order_id,
  campaign_id,
  COUNT(*) as ticket_count,
  MAX(reserved_at) as latest_reservation,
  MAX(status) as status
FROM tickets
WHERE reserved_at > NOW() - INTERVAL '7 days'
AND order_id IS NOT NULL
GROUP BY order_id, campaign_id
ORDER BY MAX(reserved_at) DESC
LIMIT 20;
```

---

## 📝 Checklist Final

- [ ] Migrations aplicadas no Supabase
- [ ] Coluna `order_id` existe na tabela `tickets`
- [ ] View `order_id_stats` acessível
- [ ] Função `reserve_tickets_by_quantity` atualizada
- [ ] Função `get_orders_by_phone` atualizada
- [ ] Backfill executado (0 tickets sem order_id)
- [ ] Teste de nova reserva realizado
- [ ] Teste de múltiplas reservas realizado
- [ ] MyTicketsPage exibindo pedidos corretamente
- [ ] Build do projeto executado com sucesso

---

## 🎉 Conclusão

Após seguir este guia:

✅ **Bug RESOLVIDO:** Reutilização de order_id eliminada
✅ **UX MELHORADA:** Pedidos aparecem separados corretamente
✅ **SISTEMA ESTÁVEL:** Todas as funcionalidades mantidas
✅ **BACKWARD COMPATIBLE:** Dados antigos preservados

---

## 📞 Precisa de Ajuda?

Se encontrar problemas:

1. Verifique os logs do Supabase Dashboard
2. Execute as queries de troubleshooting acima
3. Revise o arquivo `CORRECAO_BUG_ORDER_ID_RESUMO.md` para detalhes técnicos completos

---

**Data:** 16/11/2025
**Status:** ✅ Pronto para Produção

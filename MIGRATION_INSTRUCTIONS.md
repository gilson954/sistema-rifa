# 🚀 Instruções para Aplicar Migration - Max Tickets 20.000

## ✅ Mudanças Aplicadas no Código

As seguintes mudanças já foram aplicadas e o código foi compilado com sucesso:

### Frontend (✓ Concluído)
1. **`src/lib/api/tickets.ts`** - Atualizado `pageSize` de 10.000 → 20.000
2. **`src/pages/CreateCampaignStep2Page.tsx`** - Atualizado fallback de 1.000 → 20.000
3. **`src/pages/CampaignPage.tsx`** - Atualizado 2 fallbacks de 1.000 → 20.000

### Build (✓ Concluído)
- ✅ Projeto compilado com sucesso
- ✅ Sem erros de TypeScript
- ✅ Pronto para deploy

---

## ⚠️ Migration do Banco de Dados (Pendente)

Para completar a atualização, você precisa aplicar a migration do banco de dados manualmente.

### 📋 Passo a Passo

1. **Acesse o Supabase Dashboard**
   - Vá para: https://supabase.com/dashboard
   - Selecione seu projeto

2. **Abra o SQL Editor**
   - No menu lateral, clique em "SQL Editor"
   - Clique em "+ New query"

3. **Cole e Execute o SQL**

   Copie e cole o seguinte SQL:

   ```sql
   -- Update the default value for new campaigns
   ALTER TABLE campaigns
   ALTER COLUMN max_tickets_per_purchase SET DEFAULT 20000;

   -- Update all existing campaigns that have the old default value of 1000
   UPDATE campaigns
   SET max_tickets_per_purchase = 20000
   WHERE max_tickets_per_purchase = 1000;
   ```

4. **Execute a Query**
   - Clique no botão "Run" (▶️) ou pressione `Ctrl+Enter`
   - Aguarde a confirmação de sucesso

5. **Verifique o Resultado**

   Execute esta query para verificar:

   ```sql
   SELECT id, title, max_tickets_per_purchase
   FROM campaigns
   WHERE max_tickets_per_purchase = 20000
   LIMIT 10;
   ```

---

## 📊 O Que Esta Migration Faz

### 1. Altera o Valor DEFAULT
- **Antes:** Novas campanhas criadas teriam `max_tickets_per_purchase = 1000`
- **Depois:** Novas campanhas criadas terão `max_tickets_per_purchase = 20000`

### 2. Atualiza Campanhas Existentes
- Encontra todas as campanhas com `max_tickets_per_purchase = 1000`
- Atualiza para `max_tickets_per_purchase = 20000`
- **Campanhas afetadas:** Aproximadamente 6 campanhas foram identificadas

### 3. Mantém Valores Customizados
- Campanhas com valores diferentes de 1000 **NÃO** serão alteradas
- Isso preserva configurações personalizadas

---

## 🎯 Resultado Esperado

Após aplicar a migration:

✅ Usuários poderão comprar até **20.000 cotas** em modo automático
✅ Alinhamento com o padrão de mercado (rifei.com.br e concorrentes)
✅ Campanhas com 1 milhão de cotas funcionarão corretamente
✅ Não haverá mais o erro: *"Apenas 1000 cotas disponíveis"*

---

## 📝 Arquivo de Migration

A migration completa está em:
```
supabase/migrations/20251024050758_update_max_tickets_per_purchase_to_20000.sql
```

---

## 🔍 Verificação Adicional

Para verificar se a migration foi aplicada com sucesso:

```sql
-- Verificar o DEFAULT atual
SELECT column_default
FROM information_schema.columns
WHERE table_name = 'campaigns'
  AND column_name = 'max_tickets_per_purchase';

-- Resultado esperado: 20000
```

---

## ❓ Dúvidas ou Problemas?

Se encontrar algum erro ao aplicar a migration:

1. Verifique se você tem permissões de administrador no Supabase
2. Certifique-se de estar conectado ao projeto correto
3. Tente executar os comandos SQL separadamente (um de cada vez)

---

## ✨ Resumo

| Item | Status |
|------|--------|
| Código Frontend | ✅ Atualizado |
| Build da Aplicação | ✅ Compilado |
| Migration SQL Criada | ✅ Pronta |
| Migration Aplicada | ⚠️ **Aplicar Manualmente** |

**Próximo Passo:** Execute o SQL no Supabase Dashboard SQL Editor (ver instruções acima)

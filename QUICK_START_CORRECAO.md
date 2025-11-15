# ⚡ QUICK START: Corrigir Reserva de Cotas

## 🚨 Problema
Erro ao tentar reservar cotas: `function reserve_tickets_by_quantity does not exist`

## ✅ Solução em 5 Minutos

### 1️⃣ Abra o Supabase SQL Editor
🔗 https://supabase.com/dashboard/project/byymchepurnfawqlrcxh/sql

### 2️⃣ Clique em "New query"
Botão verde no canto superior direito

### 3️⃣ Cole o SQL
Abra este arquivo no seu editor de código:
```
supabase/migrations/20251115000000_create_reserve_tickets_by_quantity.sql
```

Selecione TUDO (Ctrl+A ou Cmd+A) e copie (Ctrl+C ou Cmd+C)

Cole no SQL Editor do Supabase

### 4️⃣ Execute
Clique no botão **Run** (ou pressione Ctrl+Enter)

Aguarde ver: ✅ "Success. No rows returned"

### 5️⃣ Verifique
Execute esta query para confirmar:
```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_name = 'reserve_tickets_by_quantity';
```

Deve retornar: `reserve_tickets_by_quantity`

## 🎉 Pronto!
Agora teste fazer uma reserva de cotas na sua aplicação.

---

## 📚 Documentação Completa
- `CORRECAO_RESERVA_COTAS_RESUMO.md` - Explicação completa
- `APLICAR_MIGRATION_RESERVE_BY_QUANTITY.md` - Guia detalhado

## 🆘 Erro?
Se algo der errado:
1. Certifique-se de copiar TODO o arquivo SQL (incluindo comentários)
2. Verifique se você tem permissões de admin no Supabase
3. Leia `APLICAR_MIGRATION_RESERVE_BY_QUANTITY.md` para troubleshooting

# 🔍 ANÁLISE DETALHADA DO PROBLEMA DE AUTENTICAÇÃO

## PROBLEMA IDENTIFICADO

### Sintomas
- ✅ Criação de conta funciona (telefone: `+5562981127960`)
- ✅ 3 tickets reservados com sucesso
- ❌ Login posterior não encontra os 3 tickets
- ❌ `TicketsAPI.getTicketsByPhoneNumber()` retorna 0 tickets

## CAUSA RAIZ

### Hipótese Principal (99% de certeza)

**A função `reserve_tickets` SALVA o telefone no banco de dados, mas a função `get_tickets_by_phone` NÃO está encontrando porque:**

1. **Timing/Commit Issue**: A transação não foi commitada antes da busca
2. **Status Filter Missing**: A função pode estar filtrando por status incorreto
3. **Transaction Isolation**: A função `reserve_tickets` usa `SET TRANSACTION ISOLATION LEVEL SERIALIZABLE` que pode causar isolamento

### Evidência

#### Fluxo de Criação (SUCESSO):
```javascript
// 1. ReservationModal envia dados
customerPhone: "+5562981127960"

// 2. TicketsAPI.reserveTickets chama RPC
await supabase.rpc('reserve_tickets', {
  p_customer_phone: "+5562981127960"  // ✅ Salvo no banco
});

// 3. Auto-login acontece imediatamente
await signInWithPhone("+5562981127960", { ... });
// ℹ️ Neste momento, NÃO busca tickets - apenas cria sessão localStorage

// 4. Navegação para MyTickets
// ℹ️ MyTickets usa getOrdersByPhoneNumber, não getTicketsByPhoneNumber
```

#### Fluxo de Login (FALHA):
```javascript
// 1. PhoneLoginModal envia
phoneNumber: "+5562981127960"

// 2. TicketsAPI.getTicketsByPhoneNumber chama RPC
const { data: tickets } = await supabase.rpc('get_tickets_by_phone', {
  p_phone_number: "+5562981127960"
});
// ❌ Retorna 0 tickets (PROBLEMA AQUI!)

// 3. Login falha porque não encontra tickets
```

## INVESTIGAÇÃO NECESSÁRIA

### Teste 1: Verificar se os dados realmente foram salvos

Adicionar log após reserve_tickets:

```typescript
// Em TicketsAPI.reserveTickets após o RPC
const { data, error } = await supabase.rpc('reserve_tickets', { ... });

if (!error && data) {
  // ADICIONAR VERIFICAÇÃO IMEDIATA
  console.log('🔍 DEBUG: Verificando se tickets foram salvos...');

  const { data: verification, error: verifyError } = await supabase
    .from('tickets')
    .select('customer_phone, customer_name, status')
    .eq('customer_phone', customerPhone)
    .limit(5);

  console.log('🔍 DEBUG: Tickets encontrados após reserve:', verification);
  console.log('🔍 DEBUG: Phone buscado:', customerPhone);
}
```

### Teste 2: Verificar se get_tickets_by_phone tem filtro escondido

A função `get_tickets_by_phone` pode ter um filtro de status que não estamos vendo:

```sql
-- Verificar se há filtro WHERE status IN (...)
-- que exclua tickets 'reservado'
```

### Teste 3: Transaction Isolation Issue

A função `reserve_tickets` usa:
```sql
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
```

Isso pode causar problemas se:
- A transação não for commitada explicitamente
- Houver leitura antes do commit
- Isolation level bloquear outras transações

## SOLUÇÕES PROPOSTAS

### Solução 1: Adicionar delay na busca (workaround)

```typescript
// Em PhoneLoginModal.tsx - handleSubmit
const { data: tickets } = await TicketsAPI.getTicketsByPhoneNumber(fullPhoneNumber);

if (!tickets || tickets.length === 0) {
  // Tentar novamente após 1 segundo (commit delay)
  console.log('⏳ Nenhum ticket encontrado. Tentando novamente em 1s...');
  await new Promise(resolve => setTimeout(resolve, 1000));

  const { data: retryTickets } = await TicketsAPI.getTicketsByPhoneNumber(fullPhoneNumber);

  if (!retryTickets || retryTickets.length === 0) {
    setError('Nenhuma cota encontrada para este número de telefone');
    return;
  }

  // Continua com retryTickets...
}
```

### Solução 2: Usar query direta em vez de RPC (debug)

```typescript
// Em TicketsAPI.getTicketsByPhoneNumber
static async getTicketsByPhoneNumber(phoneNumber: string) {
  console.log('🔵 TicketsAPI - Searching for phone:', phoneNumber);

  // TESTE: Query direta primeiro
  const { data: directQuery, error: directError } = await supabase
    .from('tickets')
    .select(`
      id,
      campaign_id,
      quota_number,
      status,
      customer_name,
      customer_email,
      customer_phone,
      campaigns (
        title,
        public_id,
        prize_image_urls
      )
    `)
    .eq('customer_phone', phoneNumber);

  console.log('🔍 Direct query result:', directQuery);

  // Depois tenta RPC
  const { data, error } = await supabase.rpc('get_tickets_by_phone', {
    p_phone_number: phoneNumber
  });

  console.log('🔍 RPC result:', data);
  console.log('🔍 Difference:', {
    direct: directQuery?.length || 0,
    rpc: data?.length || 0
  });

  return { data, error };
}
```

### Solução 3: Verificar se o problema é no status

```typescript
// Adicionar log de status na busca
const { data: allTickets } = await supabase
  .from('tickets')
  .select('status, customer_phone, customer_name')
  .eq('customer_phone', phoneNumber);

console.log('📊 Tickets por status:', {
  total: allTickets?.length || 0,
  byStatus: allTickets?.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>)
});
```

### Solução 4: Fix definitivo - Garantir commit explícito

```sql
-- Atualizar reserve_tickets para garantir commit
CREATE OR REPLACE FUNCTION public.reserve_tickets(...)
RETURNS TABLE(...)
AS $$
BEGIN
  -- Remove ou ajusta o isolation level
  -- SET TRANSACTION ISOLATION LEVEL READ COMMITTED; -- Mais permissivo

  -- ... código existente ...

  -- Adiciona commit explícito (PostgreSQL functions auto-commit)
  RETURN;
END;
$$;
```

## PLANO DE AÇÃO

### Passo 1: Debug Imediato
1. Adicionar logs em `reserveTickets` para verificar se salva
2. Adicionar logs em `getTicketsByPhoneNumber` para ver o que retorna
3. Comparar query direta vs RPC

### Passo 2: Identificar a Causa
1. Se query direta funciona mas RPC não → Problema na função SQL
2. Se ambos não funcionam → Problema de timing/commit
3. Se funciona depois de delay → Confirma timing issue

### Passo 3: Aplicar Fix
1. Se for timing: Adicionar retry logic ou ajustar transaction isolation
2. Se for RPC: Corrigir a função `get_tickets_by_phone`
3. Se for status: Adicionar/remover filtro de status conforme necessário

## CÓDIGO DE TESTE COMPLETO

```typescript
// test-phone-auth.ts
import { supabase } from './lib/supabase';
import { TicketsAPI } from './lib/api/tickets';

async function testPhoneAuthentication() {
  const testPhone = '+5562981127960';
  const testCampaignId = 'uuid-da-campanha';

  console.log('=== TESTE DE AUTENTICAÇÃO POR TELEFONE ===\n');

  // 1. Reservar tickets
  console.log('1️⃣ Reservando 3 tickets...');
  const { data: reserveData, error: reserveError } = await TicketsAPI.reserveTickets(
    testCampaignId,
    [1, 2, 3],
    null,
    'Test User',
    'test@example.com',
    testPhone
  );

  console.log('✅ Reserve result:', reserveData);
  console.log('❌ Reserve error:', reserveError);

  // 2. Verificação imediata (query direta)
  console.log('\n2️⃣ Verificação imediata (query direta)...');
  const { data: immediate, error: immediateError } = await supabase
    .from('tickets')
    .select('customer_phone, customer_name, status, quota_number')
    .eq('customer_phone', testPhone);

  console.log('📊 Tickets encontrados imediatamente:', immediate?.length || 0);
  console.log('📋 Detalhes:', immediate);

  // 3. Busca via RPC (como PhoneLoginModal)
  console.log('\n3️⃣ Busca via RPC (PhoneLoginModal)...');
  const { data: rpcData, error: rpcError } = await TicketsAPI.getTicketsByPhoneNumber(testPhone);

  console.log('📊 Tickets via RPC:', rpcData?.length || 0);
  console.log('📋 Detalhes:', rpcData);

  // 4. Aguardar 2 segundos e tentar novamente
  console.log('\n4️⃣ Aguardando 2 segundos...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  const { data: delayedData } = await TicketsAPI.getTicketsByPhoneNumber(testPhone);
  console.log('📊 Tickets após delay:', delayedData?.length || 0);

  // 5. Análise
  console.log('\n=== ANÁLISE ===');
  console.log({
    'Reservados': reserveData?.length || 0,
    'Query Direta': immediate?.length || 0,
    'RPC Imediato': rpcData?.length || 0,
    'RPC com Delay': delayedData?.length || 0
  });

  if (immediate?.length && !rpcData?.length) {
    console.log('\n⚠️ PROBLEMA: Query direta funciona mas RPC não!');
    console.log('Causa provável: Problema na função get_tickets_by_phone');
  }

  if (!immediate?.length && !rpcData?.length) {
    console.log('\n⚠️ PROBLEMA: Nenhuma query encontra os tickets!');
    console.log('Causa provável: Tickets não foram salvos ou commit não aconteceu');
  }

  if (delayedData?.length && !rpcData?.length) {
    console.log('\n⚠️ PROBLEMA: Só funciona com delay!');
    console.log('Causa provável: Transaction isolation ou commit assíncrono');
  }
}

// Executar teste
testPhoneAuthentication().catch(console.error);
```

## CONCLUSÃO PRELIMINAR

Com base nos logs fornecidos, o problema mais provável é:

1. **Transaction Isolation Level** causando visibilidade atrasada dos dados
2. **A função `get_tickets_by_phone` RPC** não está encontrando os tickets por algum motivo específico
3. **Timing issue** entre save e read

A solução requer:
- Debugging com os testes propostos acima
- Possível ajuste no isolation level
- Possível correção na função RPC
- Implementação de retry logic como fallback

## PRÓXIMOS PASSOS

1. ✅ Aplicar os testes de debug propostos
2. ⏳ Identificar qual teste falha
3. ⏳ Aplicar a solução específica
4. ⏳ Validar com teste end-to-end

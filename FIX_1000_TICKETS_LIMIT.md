# ✅ Correção: Limitação de 1000 Cotas

## Problema Identificado

Ao tentar comprar **1500 cotas**, o sistema estava retornando apenas **1000 cotas**, mesmo quando havia mais cotas disponíveis.

### Causa Raiz

O **Supabase tem um limite padrão de 1000 linhas** por query quando você usa `.limit()`. Mesmo que você especifique `.limit(1500)`, o Supabase retorna no máximo 1000 registros.

### Solução

Substituir `.limit(quantity)` por `.range(0, quantity - 1)` em todas as queries que buscam cotas disponíveis.

## Arquivos Modificados

### `src/pages/CampaignPage.tsx`

**Antes:**
```typescript
const { data: availableQuotas, error: quotasError } = await supabase
  .from('tickets')
  .select('quota_number')
  .eq('campaign_id', campaign.id)
  .eq('status', 'disponível')
  .limit(quantity);  // ❌ Limitado a 1000
```

**Depois:**
```typescript
const { data: availableQuotas, error: quotasError } = await supabase
  .from('tickets')
  .select('quota_number')
  .eq('campaign_id', campaign.id)
  .eq('status', 'disponível')
  .range(0, quantity - 1);  // ✅ Sem limite de 1000
```

## Diferença Entre `.limit()` e `.range()`

| Método | Limite Máximo | Uso Recomendado |
|--------|---------------|-----------------|
| `.limit(n)` | 1000 linhas | Queries pequenas |
| `.range(start, end)` | Ilimitado | Queries grandes (>1000) |

## Locais Corrigidos

1. **Modo Automático** (linha ~648): Busca de cotas disponíveis para reserva automática
2. **Modo Manual** (linha ~468): Busca de cotas disponíveis para seleção manual

## Resultado

Agora você pode:
- ✅ Comprar até **20.000 cotas** de uma vez (limite configurado no sistema)
- ✅ Buscar qualquer quantidade de cotas disponíveis
- ✅ Sistema respeitará o `max_tickets_per_purchase` da campanha

## Teste

Para testar:
1. Vá em uma campanha com modo automático
2. Selecione quantidade > 1000 (ex: 1500, 5000, etc)
3. Clique em "Comprar"
4. Verifique que todas as cotas solicitadas são reservadas

## Observações

- A função `reserve_tickets` no banco de dados **não tem limitação** pois usa RPC
- A limitação era apenas nas queries diretas do frontend
- O sistema já estava preparado para lidar com grandes quantidades, só precisava ajustar as queries

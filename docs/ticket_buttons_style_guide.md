# Botões dos Bilhetes — Guia de Estilo e Interações

## Objetivo
Fornecer um padrão visual e comportamental consistente para a seção de personalização dos botões de seleção de cotas, assegurando performance, acessibilidade e coerência com o restante do aplicativo.

## Paleta e Tipografia
- Cores: usa esquema existente (Tailwind) com gradientes `from-purple-600 via-pink-500 to-blue-600` ou `custom` do organizador.
- Texto: fonte padrão do app; pesos `font-bold` para números, `font-semibold` para rótulos.
- Contraste: texto sempre em `text-white` sobre gradiente; badges usam `bg-amber-500` e `text-white`.

## Layout
- Grid: `grid grid-cols-2 sm:grid-cols-4 gap-3`.
- Limite: máximo de 8 botões; card “+” aparece apenas quando `< 8`.
- Hierarquia: rótulo “Selecionar” acima, valor `+N` centralizado e destacado.

## Estados
- Hover: escala 1.03 e sombra suave.
- Active (tap): escala 0.98.
- Popular: `ring-2 ring-amber-400` + badge “Mais popular”.
- Desabilitado: opacidade reduzida quando bloqueado por regras.

## Interações
- Clique em botão: abre modal de edição com input `number` e toggle “Mais popular”.
- Card “+”: abre modal de criação; valida limite `<= 20.000` e máximo de 8 itens.
- Salvar: persiste em Supabase e notifica sucesso/erro.

## Acessibilidade
- Botões com `role=button` implícito; foco visível pelos estilos padrão.
- Inputs com `min`, `max` e mensagens de erro claras.

## Animações (Framer Motion)
- Botões: `whileHover`, `whileTap` para feedback imediato.
- Modal: `AnimatePresence` com `initial/animate/exit` e curvas suaves.
- Transições entre abas: animação de `opacity/x` consistente.

## Performance
- Renderiza no máximo 8 botões.
- Usa condicionais simples e sem loops pesados.
- Evita re-renderizações desnecessárias mantendo estados coesos.

## Persistência
- Colunas Supabase:
  - `profiles.quota_selector_buttons` (jsonb: number[])
  - `profiles.quota_selector_popular_index` (integer | null)
- View: `public_profiles_view` inclui ambas para leitura unificada.

## Integração
- `CustomizationPage`: edita e salva; mostra contagem `n/8`.
- `CampaignPage`: assina mudanças e repassa para `QuotaSelector`.
- `QuotaSelector`: aplica destaque e limita exibição a 8.

## Testes de Usabilidade (recomendado)
- Mobile: interação com dedo, tap repetido, foco em inputs numéricos.
- Limite: tentar adicionar o nono botão e valores acima de 20.000.
- Popular: alternar entre botões e validar destaque.


# Botões dos Bilhetes — Hand-off de Design (Figma)

## Estrutura de Frames
- Seção principal: `Personalização / Botões dos bilhetes`
- Grid: 2 colunas (mobile) e 4 colunas (desktop)
- Cartão do botão: 120–140px de altura, bordas `rounded-xl`

## Estilos
- Gradiente padrão: `from-purple-600 via-pink-500 to-blue-600`
- Badge "Mais popular": `bg-amber-500`, `rounded-full`, ícone `Star`.
- Tipografia: título `font-bold`, rótulo `font-semibold`, número `font-bold`.

## Componentes
- Card-Button
  - Rótulo superior: “Selecionar” (10–12px)
  - Valor: “+N” (14–18px)
  - Badge (opcional): “Mais popular” posicionado acima à esquerda
- Card-Adicionar
  - Borda tracejada, ícone `Plus`

## Interações
- Hover: escala para 1.03, sombra suave
- Tap: escala para 0.98
- Modal: fade + scale (0.95→1)

## Variantes
- Popular vs Normal
- Habilitado vs Desabilitado

## Especificações
- Espaçamentos: `gap-3`, padding interno `px-4 py-3`
- Limites: exibidos `n/8` no rodapé da seção

## Observações
- Respeitar paleta e temas do app (gradiente custom quando aplicável)
- Não copiar estilos de concorrentes; manter consistência visual


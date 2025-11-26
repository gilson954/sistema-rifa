# Botões dos Bilhetes — Documentação de Animações

## Framer Motion
- Botões dos bilhetes
  - `whileHover={{ scale: 1.03 }}`
  - `whileTap={{ scale: 0.98 }}`
- Modal
  - `AnimatePresence` com container usando `initial={{ opacity: 0, scale: 0.95 }}`
  - `animate={{ opacity: 1, scale: 1 }}`
  - `exit={{ opacity: 0, scale: 0.95 }}`
- Conteúdo da aba
  - Transições `initial={{ opacity: 0, x: 20 }}`
  - `animate={{ opacity: 1, x: 0 }}`
  - `exit={{ opacity: 0, x: -20 }}`

## Feedback Visual
- Hover: leve aumento de escala e sombra.
- Tap: leve redução de escala para resposta imediata.
- Popular: `ring-2 ring-amber-400` com badge `Mais popular`.

## Performance
- Evitar `layoutId` entre muitos elementos; manter animações simples.
- Limitar itens a 8 para renderização eficiente.


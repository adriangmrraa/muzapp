# SDD Propose: Detección de Humor/Chiste/Exageración — no tomar literal

## Intent

Cuando un cliente dice "me vendés 100 hamburguesas?" o "una promo de 50 pancakes?" está claramente jodiendo, pero el agente responde literalmente "Dale, te agrego 100". Queremos que Karen detecte exageraciones y responda en el mismo tono chistoso, sin ejecutar herramientas de venta.

## Scope

### In Scope

1. Nueva sección `[HUMOR]` en el system prompt con patrones de detección
2. Patrones de exageración: cantidades > 20 cuando el cliente nunca pidió tanto en historial, preguntas absurdas (productos que no existen en el menú), emojis de risa combinados con pedidos
3. Opcional: tool `detectExaggeration` que verifique cantidades contra el histórico del cliente

### Out of Scope

- NLP complejo de humor
- Detección de sarcasmo sutil
- Machine learning models

## Approach

1. Agregar sección `[HUMOR]` al DEFAULT_SYSTEM_PROMPT que:
   - Detecte cantidades irrealistas (> 20 items cuando el cliente nunca pidió más de 3-4)
   - Detecte productos que claramente no existen en el menú (pancakes, pizza, empanadas, etc.)
   - Detecte emojis de risa combinados con números grandes
2. Cuando se detecte humor:
   - Responder en el mismo tono: "Jajaja dale, 100 te hago pero las pagás vos"
   - NO ejecutar addOrderItem, NO ejecutar createOrder
   - Después del chiste, preguntar en serio: "¿Hablando en serio, cuántas querés?"
3. Opcional: crear tool `detectExaggeration` que:
   - Reciba el producto y la cantidad
   - Consulte el historial del cliente
   - Devuelva si la cantidad es sospechosa

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/whatsapp/prompt-builder.ts` | Modify | Agregar sección `[HUMOR]` al DEFAULT_SYSTEM_PROMPT |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Falso positivo: cliente NEW pide 25 hamburguesas para un evento real | Low | La detección usa historial — si no tiene historial, asumir realista |
| Falso negativo: cliente jodiendo sutilmente no detectado | Medium | Mejor falso negativo que falso positivo — que ejecute la venta ante la duda |
| El LLM responde el chiste pero después igual ejecuta la tool | Medium | Instrucción explícita de NO ejecutar tools cuando hay humor detectado |

## Success Criteria

- [ ] "Me vendés 100 hamburguesas?" → "Jajaja dale, 100 te hago pero las pagás vos. ¿Hablando en serio, cuántas querés?"
- [ ] "Quiero una promo de 50 pancakes" → "Tengo hamburguesas nomás amigo, ¿querés una?"
- [ ] Número realista (2 hamburguesas) → comportamiento normal de venta

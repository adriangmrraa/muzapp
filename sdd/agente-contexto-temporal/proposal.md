# SDD Propose: Contexto Temporal — Detectar "ahora" vs "después" en mensajes

## Intent

Cuando un cliente pregunta "mañana trabajan?", "están el sábado?", "la semana que viene?" el agente responde con el flujo de venta actual como si fuera hoy. Queremos que Karen detecte referencias temporales (mañana, hoy, esta noche, el lunes, la semana que viene, etc.) y NO arranque flujo de venta si el cliente pregunta por un momento futuro. En ese caso, debe responder con los horarios de ese día y preguntar si quiere dejar algo pedido para esa fecha.

## Scope

### In Scope

1. Nueva sección `[CONTEXTO TEMPORAL]` en el system prompt de `prompt-builder.ts`
2. Instrucciones para detectar palabras clave temporales: mañana, hoy, esta noche, el lunes, la semana que viene, el sábado, el domingo, etc.
3. Lógica de respuesta diferenciada: si es futuro → horarios + preguntar si quiere dejar pedido; si es hoy → flujo normal

### Out of Scope

- Sistema de pedidos programados para fecha futura
- Tools nuevas o lógica backend
- Parseo de fechas complejas tipo "15 de enero"
- Recordatorios automáticos

## Approach

Agregar una sección `[CONTEXTO TEMPORAL]` en el DEFAULT_SYSTEM_PROMPT de `prompt-builder.ts` que instruya a Karen:

1. Detectar palabras clave temporales en el mensaje del cliente
2. Si la referencia es a un momento futuro (mañana, el lunes, la semana que viene, el sábado):
   - Consultar `getBusinessHours` para ese día
   - Responder con los horarios correspondientes
   - Preguntar "¿Querés dejar algo pedido para esa fecha?"
   - NO arrancar flujo de venta, NO preguntar delivery, NO preguntar dirección
3. Si la referencia es a hoy / ahora / esta tarde:
   - Comportamiento normal, flujo de venta estándar
4. Si el día está cerrado (ej: domingo):
   - "Los domingos cerramos, disculpá"
   - Preguntar si quiere pedir para otro día

Solo cambios de prompt. No necesita tools nuevas ni lógica backend.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/whatsapp/prompt-builder.ts` | Modify | Agregar sección `[CONTEXTO TEMPORAL]` al DEFAULT_SYSTEM_PROMPT |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| El LLM no detecta correctamente la referencia temporal | Medium | Las instrucciones son explícitas con ejemplos de palabras clave |
| El LLM confunde "hoy" con "mañana" en contexto ambiguo | Low | Casos borde cubiertos en las instrucciones |
| Cliente dice "el lunes" pero es el lunes actual vs próximo | Low | Dar los horarios del próximo lunes abierto, es lo que el cliente quiere saber |

## Success Criteria

- [ ] "Mañana trabajan?" → "Sii, mañana estamos de 18 a 23hs. ¿Querés dejar algo pedido para mañana?"
- [ ] "El domingo están?" → "Los domingos cerramos, disculpá"
- [ ] "Hoy a la tarde están?" → "Sii, estamos hasta las 23hs. Decime" (comportamiento normal)
- [ ] "La semana que viene voy a pedir" → "Dale, avisá nomás cuando quieras"

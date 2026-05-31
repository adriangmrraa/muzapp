# Proposal: Rediseño Completo del Bot de Ventas WhatsApp (Karen V6)

## Intent

El bot de ventas (Karen) tiene 18 bugs críticos/altos identificados en un audit con 6 sub-agentes. Los clientes reales experimentan: pedidos inventados, pérdida de contexto, 24h sin respuesta por echo handler defectuoso, notas ignoradas, precios incorrectos. El problema raíz es arquitectónico: el bot carece de máquina de estados, contexto inyectado como `user` en vez de `system`, tool chaining inexistente, y un echo handler que desactiva el AI tras cada respuesta.

## Scope

### In Scope
- Fix CRITICAL: Echo handler ya no setea 24h human override (Bug #5 del audit)
- Fix CRITICAL: Contradicción PASO 1 vs tool description eliminada (Bug #3)
- Fix CRITICAL: resolveItems() ahora IGNORA precios del LLM, usa siempre DB (Bug #4)
- Fix CRITICAL: Contexto inyectado como `system`, no como `user` (Bug #1)
- Fix HIGH: Conversation state machine (4 estados: greeting, ordering, confirming, done)
- Fix HIGH: Tool chaining: addOrderItem → confirmOrder → createOrder como flujo único
- Fix HIGH: 30 tools consolidadas a ~18 (eliminar duplicación)
- Fix HIGH: Eliminar orderContextItems como fuente de verdad (usar solo orders con draft status)
- Fix HIGH: Notes ahora tienen instrucciones explícitas en el prompt
- Fix MEDIUM: Content dedup por hash de 50 chars mejorado
- Fix MEDIUM: Echo dedup por platformMessageId (no por comparación de strings)
- Fix MEDIUM: prompt-security sin falsos positivos con backticks

### Out of Scope
- Rediseño del UI de admin para el bot (otro change)
- Telegram bot (cambio aparte)
- Analytics/reporting de ventas

## Approach

**Arquitectura**: Eliminar `orderContextItems` como tabla separada. Usar `orders` con status `draft` para pedidos en curso. Simplificar el flujo a 3 tools de órdenes (addItem, createOrder, getStatus) + máquina de estados en `conversations.step`. El prompt builder se reduce a solo instrucciones (sin datos embebidos — los tools los obtienen en tiempo real). El echo handler filtra por wamid, no por contenido. Consolidación de tools duplicadas.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/api/whatsapp/webhook/route.ts` | Modified | Echo handler fix, context injection fix, dedup fix |
| `src/lib/whatsapp/agent.ts` | Modified | State machine, tool consolidation, context como system |
| `src/lib/whatsapp/prompt-builder.ts` | Major rework | Sin datos embebidos, solo instrucciones + state awareness |
| `src/lib/whatsapp/tools/` | Major rework | Consolidar 30 tools → ~18, crear flujo de órdenes unificado |
| `src/lib/whatsapp/conversation.ts` | Removed | Legacy dead code |
| `src/lib/order-context.ts` | Refactored | Eliminar como fuente de verdad |
| `src/lib/order-utils.ts` | Modified | resolveItems() force DB prices |
| `src/lib/whatsapp/tools/prompt-security.ts` | Modified | Fix backtick false positives |
| `src/lib/buffer/manager.ts` | Modified | Content dedup mejorado |
| `src/db/schema.ts` | Modified | Agregar conversations.step + orders.draft status |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Regresión en flujo existente | Medium | Tests manuales con los 14 escenarios del explore original |
| Pedidos existentes con status draft chocan con nuevo schema | High | Migración: reasignar drafts viejos a "abandoned" |
| LLM se confunde con menos tools | Low | Las tools consolidadas tienen nombres + descripciones más claras |
| state machine muy rígida para conversaciones reales | Medium | Los estados tienen "fallo a flexible": el LLM puede overridear con transferToHuman |

## Rollback Plan

Por cambio individual (no monolítico):
1. Cada fix tiene su propio commit
2. Si un fix falla: revertir ese commit específico
3. Para el change completo: `git revert HEAD~N` donde N = cantidad de commits

## Dependencies

- DB migrations (schema changes para conversations.step)
- Ninguna externa

## Success Criteria

- [ ] Echo handler NO desactiva AI después de responder (verificado con logs)
- [ ] resolveItems() siempre usa precio de DB, ignora LLM (verificado con test)
- [ ] Contexto inyectado como `system`, no `user`
- [ ] Bot mantiene estado: no pregunta dos veces lo mismo
- [ ] 30 tools → ~18, sin duplicación funcional
- [ ] Pedidos no se pierden: flujo addItem → confirm → createOrder es atómico
- [ ] Notes del admin son visibles y accionables por el bot

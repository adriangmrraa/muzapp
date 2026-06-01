# SDD Propose: Sin Stock de Hamburguesas — Toggle + Comportamiento Inteligente

## Intent

Agregar un toggle en el Admin Panel (`/admin/agent`) que permita al dueño indicar que **no hay stock de hamburguesas (B2C)** pero que **el negocio sigue operativo para pan mayorista (B2B)**. Cuando el toggle está activado, el agente de WhatsApp debe rechazar consultas y pedidos de hamburguesas, pero aceptar y procesar pedidos de pan mayorista con total normalidad.

Este toggle es **independiente** del `isCooking` existente:
- `isCooking = false` → TODO cerrado (nada se vende)
- `hamburguesasSinStock = true` → solo hamburguesas bloqueadas, pan mayorista sigue

## Scope

### In Scope

1. **Schema**: Agregar columna `hamburguesas_sin_stock` (boolean, default false) en `agent_config`
2. **Admin UI**: Switch nuevo en sección "Estado del Local" del form de agente
3. **Admin Actions**: Validación + persistencia del nuevo campo
4. **Prompt Builder WhatsApp**: Inyectar estado de stock en `getOperationalData()`
5. **System Prompt**: Modificar secciones críticas que hoy OFRECEN hamburguesas:
   - `[NO TENEMOS ESO]` — no ofrecer hamburguesas si sin stock
   - `[INSISTENCIA]` — no insistir con carta de hamburguesas
   - `[RECOMENDACION]` — no recomendar hamburguesas
   - `[MENU COMO IMAGEN]` — no mandar menú de hamburguesas
   - `[SIN STOCK]` — responder específico "sin stock de hamburguesas"
   - `[HERRAMIENTAS]` — mencionar `checkHamburguesasStock`
6. **Tool `checkHamburguesasStockTool`**: Nueva tool para consultar estado
7. **Tool `createOrderTool`**: Guard para rechazar pedidos tipo hamburguesas si sin stock
8. **Tool `createAddOrderItemTool`**: Guard para no permitir agregar hamburguesas al carrito
9. **Tool `suggestProductsTool`**: Filtrar sugerencias si sin stock
10. **Tool `createSendMenuImageTool`**: No enviar menú de hamburguesas si sin stock
11. **Tool `getMenuTool` y `listAvailableProductsTool`**: Ocultar hamburguesas del menú textual
12. **Agent `agent.ts`**: Registrar el nuevo tool `checkHamburguesasStock`
13. **Tool export `index.ts`**: Exportar `checkHamburguesasStockTool`
14. **Telegram prompt builder**: Mostrar estado de hamburguesas sin stock
15. **Telegram tool `updateAgentConfigTool`**: Permitir toggle desde Telegram
16. **Telegram tool `getBusinessSummaryTool`**: Mostrar estado en resumen
17. **Telegram system prompt**: Mencionar el campo en la documentación del schema

### Out of Scope
- Cambios en la disponibilidad de productos en DB (no se toca `products.available`)
- Sincronización automática con proveedores
- Notificaciones al dueño cuando se activa/desactiva
- Historial de cambios de stock

## Approach

1. **Patrón existente**: Seguir EXACTAMENTE el mismo patrón que `isCooking`:
   - Columna boolean en `agent_config`
   - Switch en UI en la misma sección
   - Inyección en `getOperationalData()` del prompt builder
   - Tool de consulta en `kitchen-tools.ts`
   - Validación en `createOrderTool`
   - Telegram tools para gestionar desde el bot

2. **Prompt-first**: La estrategia principal es inyectar la restricción en el system prompt. El LLM es el que decide las respuestas — si el prompt le dice claramente "no hay hamburguesas", va a actuar en consecuencia. Las tools son el respaldo (defense in depth).

3. **Defense in depth**: 3 capas:
   - **Capa 1 (Prompt)**: Inyectar estado en `getOperationalData()` y modificar secciones del system prompt
   - **Capa 2 (Tools)**: Validar en `createOrderTool`, `addOrderItemTool`, `suggestProductsTool`, `sendMenuImageTool`
   - **Capa 3 (Menú)**: Ocultar hamburguesas del menú textual cuando sin stock

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/db/schema.ts` | Modify | Agregar `hamburguesasSinStock` a `agentConfig` |
| `src/app/(admin)/admin/agent/agent-config-form.tsx` | Modify | Switch en sección Estado del Local |
| `src/app/(admin)/admin/agent/actions.ts` | Modify | Zod schema + formData parse + DB values |
| `src/app/(admin)/admin/agent/page.tsx` | Modify | Default + DB mapping |
| `src/lib/whatsapp/prompt-builder.ts` | Modify | `getOperationalData()` + system prompt sections |
| `src/lib/whatsapp/tools/kitchen-tools.ts` | Modify | Nueva tool `checkHamburguesasStockTool` |
| `src/lib/whatsapp/tools/index.ts` | Modify | Exportar nueva tool |
| `src/lib/whatsapp/agent.ts` | Modify | Import + registrar tool |
| `src/lib/whatsapp/tools/create-order.ts` | Modify | Guard en `createOrderTool` |
| `src/lib/whatsapp/tools/order-context-tools.ts` | Modify | Guard en `createAddOrderItemTool` |
| `src/lib/whatsapp/tools/client-tools.ts` | Modify | Filtrar `suggestProductsTool` |
| `src/lib/whatsapp/tools/sticker-tools.ts` | Modify | No enviar menú hamburguesas si sin stock |
| `src/lib/whatsapp/tools/get-menu.ts` | Modify | Ocultar hamburguesas si sin stock |
| `src/lib/whatsapp/tools/extended-tools.ts` | Modify | `listAvailableProductsTool` ocultar hamburguesas |
| `src/lib/telegram/prompt-builder.ts` | Modify | Mostrar estado de hamburguesas sin stock |
| `src/lib/telegram/toolsManagement.ts` | Modify | `updateAgentConfigTool` + `getBusinessSummaryTool` |
| `src/lib/telegram/system-prompt.ts` | Modify | Mencionar campo en schema docs |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| El LLM ignora la instrucción y ofrece hamburguesas igual | Medium | 3 capas de defensa (prompt + tools + menú) |
| Confusión entre `isCooking` y `hamburguesasSinStock` | Medium | Labels claros en UI + tool descriptions diferenciadas |
| Cliente B2B confundido si antes le vendían hamburguesas | Low | El prompt diferencia B2B de B2C por `orderType` |
| El LLM no ejecuta `checkHamburguesasStock` antes de responder | Low | La inyección en operational data le da contexto ANTES de que el LLM decida |

## Dependencies

- Schema de `agent_config` ya existe (solo agregar columna)
- Drizzle kit para generar migración (o push directo)

## Success Criteria

- [ ] Admin puede activar/desactivar "Hamburguesas sin stock" desde la UI
- [ ] Admin puede activar/desactivar desde Telegram
- [ ] Con toggle ON, agente rechaza pedidos de hamburguesas
- [ ] Con toggle ON, agente sigue vendiendo pan mayorista normalmente
- [ ] `checkKitchenStatus` refleja el estado de hamburguesas
- [ ] `createOrder` rechaza orders tipo "hamburguesas" si toggle ON
- [ ] `addOrderItem` no permite agregar hamburguesas al carrito si toggle ON
- [ ] `getMenu` no muestra hamburguesas si toggle ON
- [ ] `sendMenuImage('hamburguesas')` no envía menú si toggle ON
- [ ] `getClientHistory` y `suggestProducts` no sugieren hamburguesas si toggle ON
- [ ] Con toggle OFF, todo funciona exactamente como antes
- [ ] Con `isCooking=false`, el toggle es irrelevante (todo cerrado)

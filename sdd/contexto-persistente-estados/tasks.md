# Tasks: Persistencia de Contexto en Estados + Fix Echo Humano

## Phase 1: sendText() captura wamid

- [x] 1.1 `src/lib/ycloud.ts` — Modificar `SendTextResult` para incluir `wamid?: string`. En `sendText()`, parsear response JSON y extraer `id` de YCloud
- [x] 1.2 Verificar todos los callers de `sendText()` para asegurar compatibilidad con el nuevo tipo

## Phase 2: Status messages con order ID + role system

- [x] 2.1 `src/app/(admin)/admin/orders/actions.ts` — Modificar `buildWhatsAppMessage()` para incluir `Pedido #${order.id}` en el texto
- [x] 2.2 `src/app/(admin)/admin/orders/actions.ts` — En `updateOrderStatus()`, pasar wamid a `insertMessage()` y cambiar role a `"system"`
- [x] 2.3 `src/app/(admin)/admin/orders/actions.ts` — En `notifyCustomer()`, pasar wamid a `insertMessage()` y cambiar role a `"system"`
- [x] 2.4 `src/app/api/cron/followup/route.ts` — En el followup, pasar wamid a `insertMessage()` y cambiar role a `"system"`

## Phase 3: Echo handler preciso

- [x] 3.1 `src/app/api/whatsapp/webhook/route.ts` — En `handleEcho()`, tratar `role: "system"` como echo propio (`isOwnEcho = true`)
- [x] 3.2 Agregar log structured con payload del echo cuando falla extracción, para diagnóstico futuro

## Phase 4: Buffer abort por actividad humana

- [x] 4.1 `src/lib/channels/router.ts` — Agregar función `checkRecentHumanActivity(conversationId, withinSeconds)` que busca mensajes `human` en últimos N segundos
- [x] 4.2 `src/app/api/whatsapp/webhook/route.ts` — En callback del buffer, después de `checkHumanOverride`, agregar chequeo `checkRecentHumanActivity()` y abortar si hay actividad humana reciente

## Phase 5: System messages en contexto del AI

- [x] 5.1 `src/app/api/whatsapp/webhook/route.ts` — En el filtro de historial, agregar `role: "system"` al filter. Mapear como "system" en el array de aiMessages
- [x] 5.2 `src/lib/whatsapp/agent.ts` — Actualizar tipo `RunAgentParams.messages` para aceptar `role: "system"`

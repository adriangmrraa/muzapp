# Sales Tasks System — Tareas diferidas WhatsApp → Telegram

## Fecha
2026-05-24 — Discusión conceptual, pre-SDD.

## Visión

El agente de WhatsApp (Karen) programa **tareas diferidas** durante la venta para que el agente de Telegram las ejecute automáticamente dentro de la ventana de 24hs de Meta WhatsApp Business API.

## Restricciones clave (Meta WABA)

- **0-24hs** desde el último mensaje del cliente → free-form messaging (sin costo, sin plantillas).
- **24hs+** → solo plantillas HSM pre-aprobadas por Meta (con costo).
- El sistema de tareas opera SIEMPRE dentro de la ventana de 24hs.
- **Delivery**: es número interno de operación, NO tiene restricción de ventana de cliente.

## El ciclo

```
Día 1 - 19:00
Cliente: "hola, dame una Génesis"
Karen vende → crea pedido → programa tareas
       │
       ├── Tarea A (20:00): notify_delivery — datos del pedido al delivery
       ├── Tarea B (21:30): send_to_client — "sale en 10 min"
       ├── Tarea C (22:00): follow_up — "¿llegó todo bien?"
       │
Día 2 - 18:00  (23hs después del último mensaje del cliente)
       │
       ├── Tarea D: offer_alternative — "che ¿probaste la Toro Asado?"
       │    └── Si responde → NUEVA ventana de 24hs → Karen retoma
       │    └── Si no responde → tarea muere, no pasa nada
       │
       └── Telegram ejecuta TODO automáticamente
```

## Tabla propuesta: `sales_tasks`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | serial PK | |
| created_by | enum('whatsapp','telegram') | Quién creó la tarea |
| task_type | enum | notify_delivery, send_to_client, offer_alternative, follow_up |
| execute_at | timestamp | Cuándo ejecutarla |
| params | jsonb | to, text, orderId, etc |
| context | jsonb | conversationId, customerPhone, orderId, reason |
| status | enum('scheduled','completed','cancelled','failed') | Estado actual |
| result | text | Output de la ejecución |
| created_at | timestamp | |
| completed_at | timestamp | nullable |

## Task types identificados

| Tipo | Descripción | Destino |
|------|-------------|---------|
| `notify_delivery` | Mandar datos del pedido al delivery | Delivery (número interno) |
| `send_to_client` | Mensaje directo al cliente (seguimiento) | Cliente (con ventana 24hs) |
| `offer_alternative` | Upsell: ofrecer producto diferente al pedido anterior | Cliente (con ventana 24hs) |
| `follow_up` | Preguntar satisfacción post-entrega | Cliente (con ventana 24hs) |

## Tools necesarias

### En WhatsApp (Karen)
- `scheduleTask(type, params, executeAt, context)` — programa una tarea

### En Telegram (Admin Worker)
- `getPendingTasks()` — lista tareas pendientes
- `executeTask(taskId)` — ejecuta y marca como completed
- Opcional: worker automático que ejecuta tareas sin intervención del admin

## Próximos pasos

Pendiente de implementación. Este doc queda como referencia de diseño conceptual para cuando se decida avanzar.

## Relación con otras features

- Usa `sendText` de `@/lib/ycloud` (ya existe)
- Usa `insertMessage` de `@/lib/channels/router` (ya existe)
- Complementa `setHumanOverride` + `sendMessageAsOperator` (ya implementados)
- Karen necesita tool nueva `scheduleTask` en `src/lib/whatsapp/tools/`
- Telegram necesita tools nuevas en `toolsManagement.ts`

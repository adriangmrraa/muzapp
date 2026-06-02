# Specs: Persistencia de Contexto en Estados + Fix Echo Humano

## ADDED Requirements

### Req 1: Echo de humano MUST persistir como `human` en chat_messages

El sistema DEBE garantizar que todo mensaje enviado desde WhatsApp Business App por un humano sea capturado como echo e insertado en `chat_messages` con `role: "human"`, excepto cuando sea echo de una respuesta generada por el AI.

#### Scenario 1.1: Humano responde desde el celular mientras el AI está activo

- GIVEN una conversación activa con `humanOverrideUntil` expirado
- WHEN el dueño responde desde WhatsApp Business App al cliente
- THEN el echo DEBE insertarse como `role: "human"` en `chat_messages`
- AND `humanOverrideUntil` DEBE setearse a 24h en el futuro

#### Scenario 1.2: Echo de humano NO debe ser filtrado por dedup temporal

- GIVEN un echo entrante con contenido idéntico a un mensaje `assistant` reciente (< 30s)
- WHEN el mensaje original NO tiene `platformMessageId` o no se encuentra en DB
- THEN el mensaje DEBE insertarse como `human` de todas formas
- AND el handler NO debe asumir que es echo propio basado solo en contenido similar

### Req 2: Status messages MUST incluir ID de pedido y guardarse como `system`

Los mensajes automáticos de cambio de estado DEBEN incluir el número de pedido en el texto visible y guardarse en `chat_messages` con `role: "system"` para diferenciarlos de respuestas del AI.

#### Scenario 2.1: Admin marca pedido como ready

- GIVEN un pedido de pan mayorista con ID 123
- WHEN el admin ejecuta `updateOrderStatus(orderId=123, "ready")`
- THEN el mensaje enviado DEBE ser: `"🍞 Pedido #123 — Ya esta tu pedido de pan, retiralo por Neuquen 1245."`
- AND el mensaje DEBE guardarse en `chat_messages` con `role: "system"`

#### Scenario 2.2: Admin marca pedido como delivered

- GIVEN un pedido de hamburguesas con ID 456
- WHEN el admin ejecuta `updateOrderStatus(orderId=456, "delivered")`
- THEN el mensaje enviado DEBE incluir el ID: `"🍔 Pedido #456 — Gracias por elegirnos! ..."`
- AND DEBE guardarse como `role: "system"`

### Req 3: `sendText()` MUST devolver el wamid del mensaje enviado

La función `sendText()` DEBE capturar y devolver el `id` (wamid) de la respuesta de YCloud para que los callers puedan persistirlo como `platformMessageId`.

#### Scenario 3.1: sendText exitoso devuelve wamid

- GIVEN un texto a enviar por WhatsApp
- WHEN `sendText()` se ejecuta exitosamente
- THEN DEBE devolver `{ ok: true, wamid: "ycloud_message_id" }`

#### Scenario 3.2: `updateOrderStatus` persiste el wamid

- GIVEN `sendText()` devuelve un wamid
- WHEN `updateOrderStatus()` guarda el mensaje en `chat_messages`
- THEN DEBE pasar el wamid como `platformMessageId` a `insertMessage()`

### Req 4: AI MUST NO responder si el humano respondió en los últimos 60s

El buffer callback DEBE verificar si hay mensajes con `role: "human"` en los últimos 60 segundos antes de ejecutar el AI. Si los hay, DEBE abortar el procesamiento.

#### Scenario 4.1: Humano respondió durante el buffer debounce

- GIVEN un mensaje entrante de cliente que inicia buffer de 3s
- WHEN durante esos 3s el humano responde desde WhatsApp Business App
- THEN el buffer callback DEBE detectar el mensaje `human` y abortar
- AND el AI NO DEBE generar respuesta

#### Scenario 4.2: No hay actividad humana, AI responde normal

- GIVEN un mensaje entrante de cliente
- WHEN no hay mensajes `human` en los últimos 60 segundos
- THEN el buffer callback DEBE ejecutar el AI normalmente

### Req 5: Mensajes `system` MUST ser incluidos en el contexto del AI

Los mensajes con `role: "system"` en `chat_messages` DEBEN ser incluidos en el historial que se pasa al AI, formateados como contexto de notificación.

#### Scenario 5.1: AI ve mensaje system como contexto

- GIVEN un mensaje `system` en `chat_messages`: "🍞 Pedido #123 — Ya esta tu pedido..."
- WHEN se construye el historial de mensajes para el AI
- THEN el mensaje DEBE incluirse como `role: "system"` en el array de mensajes
- AND el AI DEBE poder referenciar esa notificación en su respuesta

---

## MODIFIED Requirements

### Req 6: handleEcho dedup — solo para mensajes assistant

El dedup temporal de 30s en `handleEcho()` DEBE aplicarse SOLO cuando se confirma que el echo corresponde a un mensaje `assistant`. Para mensajes sin `platformMessageId` en DB, NO debe asumir que son echo propio.

#### Scenario 6.1: Echo sin platformMessageId en DB se guarda como human

- GIVEN un echo entrante cuyo contenido coincide con un mensaje assistant reciente
- WHEN el mensaje assistant no tiene `platformMessageId` (no se puede verificar)
- THEN el echo DEBE insertarse como `human` (no filtrarse por dedup)
- AND `humanOverrideUntil` DEBE setearse

### Req 7: mensajes system en el mapeo de historial

En el buffer callback, el filtro de historial DEBE incluir `role: "system"` además de `user`, `assistant` y `human`.

#### Scenario 7.1: System messages aparecen en el historial del AI

- GIVEN `conversationId` con mensajes `system` en `chat_messages`
- WHEN se ejecuta `getConversationMessages()` para armar `aiMessages`
- THEN los mensajes `system` DEBEN estar en el array
- AND su role DEBE mantenerse como `"system"` (no mapearse a assistant)

---

## REMOVED Requirements

(No requirements removed — todos son agregados o modificaciones)

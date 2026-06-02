# SPEC — regla-de-oro-createorder

> Change: Unificar el flujo de creación de pedidos para que el agente **nunca** tenga que pasar items manualmente desde la memoria conversacional.

---

## R1 (ADDED) — Inyectar `orderContextItems` en `customerContext` en CADA turno

**MUST**. El `runWhatsAppAgent` en `agent.ts` DEBE consultar `orderContextItems` activos del `conversationId` e inyectarlos en `customerContext` como `currentCart` antes de llamar a `buildSystemPrompt`.

**Given** una conversación activa con items en `orderContextItems` (status=active, sin expirar)
**When** `runWhatsAppAgent` construye `customerContext`
**Then** `customerContext` DEBE incluir `currentCart: { items: Array<{name, quantity, unitPrice, variant, notes}>, total: number }`

**Given** una conversación SIN items activos en `orderContextItems`
**When** el agente procesa el turno
**Then** `customerContext` DEBE incluir `currentCart: null`

## R2 (ADDED) — `createOrderTool` lee `orderContextItems` automáticamente si recibe `conversationId`

**MUST**. El input schema de `createOrderTool` DEBE aceptar `conversationId: number` como campo OPCIONAL. Si se provee, la herramienta DEBE leer `orderContextItems` activos de esa conversación y fusionarlos con (o sobreescribir) los `items` pasados manualmente.

**Given** `createOrderTool.execute()` recibe `conversationId: 42` y NO recibe `items`
**When** la herramienta se ejecuta
**Then** DEBE leer `orderContextItems` activos de conversationId=42 y usarlos como `items` del pedido

**Given** `createOrderTool.execute()` recibe tanto `conversationId: 42` como `items` explícitos
**When** la herramienta se ejecuta
**Then** DEBE usar `items` explícitos como base y agregar items de `orderContextItems` que NO estén duplicados (merge por nombre+variante)

**Given** `createOrderTool.execute()` NO recibe `conversationId` ni `items`
**When** la herramienta se ejecuta
**Then** DEBE retornar error: "No hay items para crear el pedido"

## R3 (MODIFIED) — `confirmOrder` ejecuta `createOrder` internamente

**MUST**. `confirmOrder` DEJA de solo marcar items como "ordered". Ahora DEBE leer `orderContextItems` activos, ejecutar `createOrder` internamente (con los datos disponibles del contexto), y retornar el resultado de `createOrder`.

**Given** `confirmOrder` se ejecuta con items activos en `orderContextItems`
**When** se llama a `confirmOrder`
**Then** DEBE: (1) construir el payload de `createOrder` con `customerName`/`items`/`customerPhone`/`orderType` del contexto del agente, (2) ejecutar `createOrder.execute()` internamente, (3) retornar el mensaje de `createOrder` al agente

**Given** `confirmOrder` se ejecuta SIN items activos en `orderContextItems`
**When** se llama a `confirmOrder`
**Then** DEBE retornar "No hay items en el carrito para confirmar"

## R4 (MODIFIED) — Reforzar prompt: sección [CUANDO SE CREA EL PEDIDO] más explícita

**MUST**. La sección `[CUANDO SE CREA EL PEDIDO]` en `DEFAULT_SYSTEM_PROMPT` DEBE ser reemplazada por una versión que:

1. Especifique que `createOrder` ahora acepta `conversationId` y NO necesita items manuales
2. Indique que el flujo correcto es: `addOrderItem` → esperar delivery/retiro → `createOrder({ conversationId })` (sin pasar items)
3. Aclare que `confirmOrder` es equivalente a `createOrder` (hace lo mismo)
4. Indique que si el agente necesita crear el pedido rápido, use `createOrder({ conversationId })` directamente

**Given** el prompt se usa en producción
**When** un agente LLM recibe el prompt
**Then** DEBE entender que NO debe pasar `items` manualmente a `createOrder` si ya usó `addOrderItem`

---

## Arquitectura afectada

| Archivo | Cambio |
|---------|--------|
| `src/lib/whatsapp/agent.ts` | R1: query `orderContextItems` + inyectar en customerContext |
| `src/lib/whatsapp/tools/create-order.ts` | R2: inputSchema acepta `conversationId` opcional + auto-read de items |
| `src/lib/whatsapp/tools/order-context-tools.ts` | R3: `confirmOrder` llama a `createOrder.execute()` internamente |
| `src/lib/whatsapp/prompt-builder.ts` | R4: reemplazar sección [CUANDO SE CREA EL PEDIDO] |
| `src/lib/whatsapp/prompt-builder.ts` | R1: inyectar `currentCart` en el contexto renderizado |

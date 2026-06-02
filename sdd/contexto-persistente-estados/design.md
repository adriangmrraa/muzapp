# Design: Persistencia de Contexto en Estados + Fix Echo Humano

## Technical Approach

4 cambios independientes pero complementarios:

1. **sendText() captura wamid**: Modificar `SendTextResult` para incluir `wamid?: string` opcional. En el response.ok, parsear JSON de YCloud y extraer `id`.

2. **buildWhatsAppMessage() con order ID + role "system"**: Incluir `#ID` en el texto visible. Guardar como `role: "system"` en lugar de `"assistant"` para que el AI sepa que es notificación automática.

3. **handleEcho() dedup más preciso**: Solo skip por contenido si el mensaje original tiene `platformMessageId` y es `assistant`. Si no tiene `platformMessageId`, no asumir que es echo propio.

4. **Buffer callback abort por human activity**: Además de `checkHumanOverride()`, verificar si hay mensajes `human` en los últimos 60s.

## Architecture Decisions

### Decision: role "system" vs "assistant" para status messages

| Opción | Tradeoff | Decisión |
|--------|----------|----------|
| `role: "assistant"` | El AI ve el mensaje como respuesta propia, puede contradecirse | ❌ |
| `role: "system"` | Se puede filtrar o formatear como notificación en el historial del AI | ✅ |

**Rationale**: Los status messages NO son respuestas del AI. Son notificaciones del sistema. Usar `"assistant"` contamina el historial y el AI puede interpretarlos como propios. Con `"system"` podemos pasarlos como contexto adicional en el prompt sin mezclarlos con la línea temporal del chat.

### Decision: wamid en sendText vs wrapper separado

| Opción | Tradeoff | Decisión |
|--------|----------|----------|
| Modificar `sendText()` para devolver wamid | Cambia firma, hay que auditar callers | ✅ |
| Crear `sendTextWithWamid()` aparte | Duplica lógica, más mantenimiento | ❌ |

**Rationale**: `SendTextResult` actual devuelve `{ ok: true }`. Agregar `wamid?: string` es backward-compatible. Todos los callers existentes siguen funcionando porque solo checkean `result.ok`.

### Decision: Dedup 30s solo si hay platformMessageId

| Opción | Tradeoff | Decisión |
|--------|----------|----------|
| Eliminar dedup 30s por completo | Pueden llegar duplicates de YCloud | ❌ |
| Solo dedup si hay platformMessageId + es assistant | Más preciso, no filtra humanos sin wamid | ✅ |

**Rationale**: El dedup por contenido existe porque `sendText()` no guarda `platformMessageId`. Una vez que `sendText()` guarde wamid, ese dedup ya no será necesario. Pero como medida transitoria, solo aplicarlo cuando podemos CONFIRMAR que el mensaje original existe y es assistant.

## Data Flow

```
Admin marca "ready"
  │
  ├── buildWhatsAppMessage("ready", order)
  │     └── "🍞 Pedido #123 — Ya esta tu pedido de pan..."
  │
  ├── sendText(phone, message)
  │     └── YCloud responde { id: "wamid_abc123", ... }
  │     └── sendText() devuelve { ok: true, wamid: "wamid_abc123" }
  │
  ├── insertMessage(convId, "system", message, undefined, wamid)
  │     └── chat_messages: { role: "system", content: "...", platformMessageId: "wamid_abc123" }
  │
  └── Echo llega → handleEcho()
        └── Busca platformMessageId → encuentra role: "system" → NO es assistant → es echo humano? No, es system
        └── Como role NO es "assistant", isOwnEcho = false → pero NO debería setear override...
        
Wait — esto es un problema. Si guardamos como "system", el echo handler va a ver que NO es "assistant" y va a setear humanOverride y guardar como "human".

Fix adicional: Si el echo tiene platformMessageId y el mensaje original tiene role "system", tratarlo como echo propio (no override).
```

Wait, let me reconsider. The echo handler already has this logic:

```typescript
let isOwnEcho = false;
if (echoMsgId) {
  const [original] = await db.select({ role: cmTable.role }).from(cmTable).where(eq(cmTable.platformMessageId, echoMsgId)).limit(1);
  isOwnEcho = original?.role === "assistant";
}
```

If we save the status message with `platformMessageId` (because sendText now returns wamid), then when the echo arrives:
- It matches on `platformMessageId`
- `original?.role` will be `"system"`
- `isOwnEcho` = `"system" === "assistant"` → false!
- So it will set humanOverride AND save as "human"

That's wrong. We need to also treat `"system"` as an own echo. Let me update the design.

## Arch Decision Update

### Decision: role "system" también es echo propio

En `handleEcho()`, si el mensaje original tiene role `"system"` o `"assistant"`, tratarlo como echo propio.

| Opción | Tradeoff | Decisión |
|--------|----------|----------|
| `isOwnEcho = original?.role === "assistant" \|\| original?.role === "system"` | Simple, cubre ambos casos | ✅ |
| Agregar columna `is_system_generated` a chat_messages | Más semántico pero requiere migración | ❌ |

```
Admin marca "ready"
  │
  ├── sendText() → { ok: true, wamid: "wamid_abc" }
  ├── insertMessage(convId, "system", msg, undefined, "wamid_abc")
  │
  └── Echo llega → handleEcho()
        ├── echoMsgId = "wamid_abc"
        ├── Busca en DB por platformMessageId
        ├── original.role = "system"
        ├── isOwnEcho = true (system o assistant)
        └── NO setea humanOverride, NO guarda duplicado
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/lib/ycloud.ts` | Modify | `sendText()` parsea response JSON y devuelve `{ ok, wamid }` |
| `src/app/(admin)/admin/orders/actions.ts` | Modify | `buildWhatsAppMessage()` incluye `Pedido #ID`; `updateOrderStatus()` y `notifyCustomer()` pasan wamid y role "system" |
| `src/app/api/whatsapp/webhook/route.ts` | Modify | `handleEcho()` incluye role "system" como echo propio |
| `src/lib/buffer/processor.ts` | Modify | Agregar chequeo de mensajes "human" recientes antes de ejecutar callback |

## Interfaces

```typescript
// src/lib/ycloud.ts — backward compatible
export type SendTextResult =
  | { ok: true; wamid?: string }  // ← wamid opcional
  | { ok: false; error: string };
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `buildWhatsAppMessage()` | Verificar que incluye order ID en todos los casos (pan, delivery, hamburguesas) |
| Unit | `sendText()` wamid capture | Mock YCloud response, verificar que wamid se extrae |
| Integration | Echo handler con role "system" | Simular echo con platformMessageId que apunta a mensaje system, verificar que no setea override |
| Integration | Buffer abort por human activity | Insertar mensaje human en DB, ejecutar buffer callback, verificar que aborta |

## Migration

No requiere migración de datos. Los mensajes existentes en `chat_messages` con `role: "assistant"` de status messages siguen siendo funcionales (no se rompen), pero no tendrán el contexto de order ID.

## Open Questions

- [ ] Ninguna — todos los detalles fueron resueltos en el análisis del código

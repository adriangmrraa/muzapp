# Specs Fase F: Verificación Final de Entry Points

## Archivos a Verificar

### Entry points del delegado que NO se cubren en fases anteriores:

1. **`src/app/api/whatsapp/webhook/route.ts`** — Webhook WhatsApp principal
   - Línea 287: `customerPhone = message.from`
   - Línea 329-334: `findOrCreateConversation` con customerPhone
   - Línea 344: `captureLeadIfNew(customerPhone, ...)` — ya se cubre en Fase D (la función normalize internamente)
   - **Pero:** el `customerPhone` se usa en MUCHOS lugares antes de llegar a `captureLeadIfNew`

2. **`src/app/api/meta/webhook/route.ts`** — Webhook Meta Ads
   - Línea 33: `msg.from` como teléfono
   - Línea 38-43: `findOrCreateConversation` con ese teléfono

3. **`src/app/(admin)/admin/orders/create-order-action.ts`** — Server action de creación manual de pedidos
   - Línea 14: `customerPhone`
   - Línea 39: `eq(leads.phone, data.customerPhone)`
   - Línea 60: `phoneNumber: data.customerPhone`

4. **`src/components/orders/create-order-modal.tsx`** — Modal de creación de pedido
   - Línea 250-252: input libre de teléfono

## Decisión

**NO modificar estos archivos en esta iteración.** Razones:

1. Modificar el webhook de WhatsApp (`whatsapp/webhook/route.ts`, 600+ líneas) es riesgoso — es el corazón del sistema de mensajería. Si normalizamos el `customerPhone` ahí, puede romper la comunicación con YCloud (que espera el número en formato original para enviar respuestas).

2. El modal de creación de pedido (`create-order-modal.tsx`) permite al admin escribir cualquier formato. El server action `create-order-action.ts` debería normalizar, pero es un punto ciego controlado (solo admins).

3. Meta webhook solo almacena en `conversations.customerPhone`, no en `leads.phone` — menos crítico.

**Crear ISSUES para seguimiento futuro:**
- `[FASE F-SIG-01]` Normalizar teléfono en webhook WhatsApp principal
- `[FASE F-SIG-02]` Normalizar teléfono en creación manual de pedidos
- `[FASE F-SIG-03]` Normalizar teléfono en webhook Meta

## Cobertura Actual por Fase

| Entry Point | Fase | Status |
|-------------|------|--------|
| Telegram tools: createOrder, createDeliveredOrder | Fase C | ✅ (ya usaban cleanPhone) |
| Telegram tools: createClient, updateClient, getClientByPhone | Fase C | ✅ |
| Telegram tools: searchClient, getClientDetail, getCustomerFullProfile | Fase C | ✅ |
| Telegram tools: injectCustomerNote, setClientAlias, getClientHistory | Fase C | ✅ |
| WhatsApp lead-capture.ts | Fase D | ✅ |
| API POST /api/leads | Fase D | ✅ |
| API lead update | Fase D | ✅ |
| WhatsApp agent create-order tool | Fase D | ✅ |
| channels/router.ts | Fase D | ✅ |
| Frontend actions.ts (updateClient, deleteLead) | Fase E | ✅ |
| Frontend client-edit-form.tsx, [id]/page.tsx | Fase E | ✅ |
| **WhatsApp webhook principal** | **Pendiente** | ⏳ Fase F-SIG-01 |
| **Meta webhook** | **Pendiente** | ⏳ Fase F-SIG-03 |
| **create-order-action + modal** | **Pendiente** | ⏳ Fase F-SIG-02 |

## Criterios de Aceptación de la Verificación

- ✅ No hay inserts a `leads.phone` sin normalizePhone
- ✅ La UNIQUE constraint en le ads.phone es el safety net final
- ✅ Issues creados para entry points no cubiertos en esta iteración

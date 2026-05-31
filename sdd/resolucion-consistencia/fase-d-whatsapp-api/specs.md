# Specs Fase D: Normalización en WhatsApp + API REST

## Archivos a Modificar

1. `src/lib/whatsapp/lead-capture.ts`
2. `src/app/api/leads/route.ts`
3. `src/app/api/leads/update/route.ts`
4. `src/lib/whatsapp/tools/create-order.ts`
5. `src/lib/channels/router.ts`

## Archivos a NO Tocar (no reciben teléfonos de clientes)

- `src/app/api/meta/callback/route.ts` — solo guarda config, no teléfonos de clientes

## Cambios Específicos

### 1. `src/lib/whatsapp/lead-capture.ts`

```typescript
import { normalizePhone } from "@/lib/phone-utils";

export async function captureLeadIfNew(
  phone: string,
  name: string | null,
  firstMessage: string
): Promise<{ isNew: boolean; leadId?: number }> {
  // ← AGREGAR: normalizar teléfono ANTES de cualquier operación
  phone = normalizePhone(phone);

  const existing = await db
    .select({ id: leads.id })
    .from(leads)
    .where(eq(leads.phone, phone))
    .limit(1);

  if (existing.length > 0) {
    return { isNew: false };
  }

  const refCode = extractRefCode(firstMessage);

  const [created] = await db
    .insert(leads)
    .values({
      phone,  // ← ahora phone está normalizado
      name,
      firstMessage,
      refCode,
      status: "new",
      platform: "whatsapp",
      tags: ["nuevo", "whatsapp"],
    })
    .returning({ id: leads.id });

  return { isNew: true, leadId: created.id };
}
```

### 2. `src/app/api/leads/route.ts` (POST /api/leads)

Después del `parsed` de Zod, ANTES del insert:

```typescript
import { normalizePhone } from "@/lib/phone-utils";

// En POST handler, después de parsed:
const data = parsed.data;
// ← AGREGAR: normalizar teléfono
data.phone = normalizePhone(data.phone);

// En el insert:
.values({
  phone: data.phone,  // ← ahora normalizado
  // ...
})
```

### 3. `src/app/api/leads/update/route.ts`

Leer el archivo completo primero para ver la estructura exacta, pero el cambio es:

```typescript
import { normalizePhone } from "@/lib/phone-utils";

// En handler:
const { id, name, phone, email, address, notes, type, tags } = body;
// ← AGREGAR: normalizar teléfono
const normalizedPhone = phone ? normalizePhone(phone) : undefined;

// Usar normalizedPhone en lugar de phone
```

### 4. `src/lib/whatsapp/tools/create-order.ts`

```typescript
import { normalizePhone } from "@/lib/phone-utils";

// En createOrderTool execute:
execute: async ({ customerName, customerPhone, ... }) => {
  // ← AGREGAR:
  customerPhone = normalizePhone(customerPhone);
  // ...resto igual
}
```

### 5. `src/lib/channels/router.ts`

En `findOrCreateConversation()` y `autoLinkLeadToConversation()`:

```typescript
import { normalizePhone } from "@/lib/phone-utils";

// Donde se guarda customerPhone:
customerPhone: customerPhone ? normalizePhone(customerPhone) : externalUserId,
```

## Criterios de Aceptación

- ✅ `captureLeadIfNew` normaliza phone antes de buscar/insertar
- ✅ `POST /api/leads` normaliza phone antes de insertar
- ✅ `lead update API` normaliza phone antes de actualizar
- ✅ El tool `createOrder` del agente WhatsApp normaliza phone
- ✅ `channels/router.ts` normaliza phone en `customerPhone`
- ✅ Ningún insert a `leads.phone` pasa sin normalizar

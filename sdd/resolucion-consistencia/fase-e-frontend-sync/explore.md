# Explore Fase E: Sincronización del Frontend al Editar Clientes

## Objetivo

Resolver la desincronización del nombre del cliente en el frontend: cuando se edita un cliente, los cambios deben reflejarse en TODAS las pantallas (lista, detalle, dashboard, órdenes).

## Contexto Actual

### El flujo de edición

1. Usuario edita en `client-edit-form.tsx` (página dedicada `[id]/page.tsx`)
2. Llama a `updateClient(phone, data)` (server action en `actions.ts`)
3. `updateClient` hace:
   ```typescript
   await db.update(leads).set(updateData).where(eq(leads.phone, phone));
   revalidatePath("/admin/clients");
   revalidatePath("/admin/clients/[id]", "page");
   revalidatePath("/admin/leads");
   revalidatePath("/admin/orders");
   revalidatePath("/admin/conversations");
   revalidatePath("/admin");
   ```
4. `fetchClients()` (en la lista) hace:
   - Query a `orders` agrupado por `phoneNumber`
   - Query a `leads` agrupado por `phone`
   - Merge por teléfono en un `Map<string, ClientSummary>`
   - **Solo muestra leads que TIENEN pedidos**

### Problemas Reales

1. **Phone como URL param:** `[id]/page.tsx` recibe `params.id` que viene de la URL. Si el teléfono se guardó con `+`, `encodeURIComponent` lo escapa, pero **Next.js deserializa `+` como espacio** en el server component. Entonces `eq(leads.phone, phone)` NO encuentra el registro.

2. **Phone editable:** `client-edit-form.tsx` permite editar el teléfono. Si el usuario cambia el teléfono, el `updateClient` va a intentar actualizar la DB con `eq(leads.phone, phoneViejo)` y el nuevo teléfono... pero las órdenes y demás tablas siguen referenciando el teléfono viejo.

3. **Dos edit forms:** El inline modal en `clients-view.tsx` tiene phone deshabilitado. El modal en `client-edit-form.tsx` tiene phone habilitado. Son inconsistentes.

4. **revalidatePath no siempre funciona:** En Next.js App Router, si el usuario está en la misma página y no navega, el server component no se re-renderiza automáticamente. `router.refresh()` ayuda pero no es garantía.

## Archivos A Modificar

- `src/app/(admin)/admin/clients/actions.ts` — `updateClient()`: normalizar phone, mejorar revalidation
- `src/app/(admin)/admin/clients/[id]/client-edit-form.tsx` — phone disabled
- `src/app/(admin)/admin/clients/[id]/page.tsx` — normalizar `params.id`
- `src/app/(admin)/admin/clients/clients-view.tsx` — confirmar que el inline modal está bien

## Dependencias

- Depende de la Fase A (`phone-utils.ts`)
- Depende de la Fase B (UNIQUE) — para que `eq(leads.phone, phone)` sea determinístico
- Depende de la Fase C (Telegram tools) — porque los tools de Telegram también crean/modifican leads

## Estrategia

1. `updateClient()`: normalizar `phone` antes de usarlo como WHERE
2. `client-edit-form.tsx`: hacer el campo phone `disabled` y sacarlo del objeto data
3. `[id]/page.tsx`: normalizar `params.id` con `normalizePhone()` ANTES de cualquier query
4. NO meter estado global (React Context/zustand) — `revalidatePath` + server components deberían ser suficientes si el identificador (teléfono) es consistente

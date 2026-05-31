# Specs Fase E: Sincronización del Frontend al Editar Clientes

## Archivos a Modificar

1. `src/app/(admin)/admin/clients/actions.ts`
2. `src/app/(admin)/admin/clients/[id]/client-edit-form.tsx`
3. `src/app/(admin)/admin/clients/[id]/page.tsx`

## Cambios Específicos

### 1. `src/app/(admin)/admin/clients/actions.ts`

**`updateClient()`:**

```typescript
import { normalizePhone } from "@/lib/phone-utils";

export async function updateClient(
  phone: string,
  data: { name?: string; email?: string; address?: string; type?: "b2c" | "b2b" | null; notes?: string; tags?: string[] }
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session) return { success: false, error: "No autorizado" };

  try {
    // ← AGREGAR: normalizar teléfono
    const normalizedPhone = normalizePhone(phone);

    // Buscar por teléfono normalizado (único gracias a UNIQUE constraint)
    const [lead] = await db
      .select({ id: leads.id, phone: leads.phone })
      .from(leads)
      .where(eq(leads.phone, normalizedPhone))
      .limit(1);

    if (!lead) {
      return { success: false, error: "Cliente no encontrado" };
    }

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.tags !== undefined) updateData.tags = data.tags;

    // Actualizar por ID (más seguro que por teléfono)
    await db.update(leads).set(updateData).where(eq(leads.id, lead.id));

    // Revalidar TODAS las páginas
    revalidatePath("/admin/clients");
    revalidatePath("/admin/clients/[id]", "page");
    revalidatePath("/admin/leads");
    revalidatePath("/admin/orders");
    revalidatePath("/admin/conversations");
    revalidatePath("/admin");

    return { success: true };
  } catch (e) {
    return { success: false, error: "Error al actualizar" };
  }
}
```

**Cambio clave:** Ahora busca por `id` en lugar de por `phone` para el UPDATE. El teléfono se usa solo para identificar el lead inicialmente.

### 2. `src/app/(admin)/admin/clients/[id]/client-edit-form.tsx`

**Campo phone: hacerlo DISABLED (read-only)**

```typescript
// Línea 94-96: cambiar input de teléfono a disabled
<div>
  <label className="text-[10px] text-neutral-500 uppercase font-semibold">Teléfono</label>
  <input value={phone} disabled className={fieldClass + " opacity-50 cursor-not-allowed"} />
</div>
```

**En `handleSave()`:**
```typescript
const handleSave = async () => {
  setSaving(true);
  try {
    const tags = tagsStr.split(",").map((t) => t.trim()).filter(Boolean);

    const result = await updateClient(lead.phone, {  // ← usar lead.phone (el original, no el del estado)
      name,
      email: email || undefined,
      address: address || undefined,
      notes: notes || undefined,
      type: (type === "b2c" || type === "b2b") ? type : null,
      tags: tags.length > 0 ? tags : undefined,
    });

    if (!result.success) {
      console.error("Error al guardar:", result.error);
      return;
    }

    setOpen(false);
    router.refresh();
  } catch (err) {
    console.error(err);
  }
  setSaving(false);
};
```

**Cambio clave:** Se usa `lead.phone` (prop) en lugar de `phone` (state) para `updateClient`. Y se elimina el `phone` del objeto `data` porque phone no debe ser actualizable.

### 3. `src/app/(admin)/admin/clients/[id]/page.tsx`

**Normalizar `params.id`:**

```typescript
import { normalizePhone } from "@/lib/phone-utils";

export default async function ClientDetailPage({ params }: Props) {
  const { id: rawPhone } = await params;
  const phone = normalizePhone(rawPhone);  // ← AGREGAR

  const [lead] = await db.select().from(leads).where(eq(leads.phone, phone)).limit(1);
  const clientOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.phoneNumber, phone))
    .orderBy(desc(orders.createdAt))
    .limit(50);
  // ...resto igual
```

**Cambio clave:** `params.id` puede venir con `+` escapado como `%2B` o como espacio. `normalizePhone()` lo limpia a dígitos puros, y la query funciona.

## Criterios de Aceptación

- ✅ Editar un cliente desde la página dedicada actualiza en TODAS las pantallas
- ✅ El teléfono NO es editable desde el frontend
- ✅ `updateClient` normaliza el teléfono antes de buscar
- ✅ `updateClient` usa `lead.id` para actualizar (no phone)
- ✅ `[id]/page.tsx` normaliza `params.id` antes de consultar
- ✅ La navegación desde la lista al detalle funciona aunque el teléfono tenga `+`

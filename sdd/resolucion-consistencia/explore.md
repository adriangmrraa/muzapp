# Explore: Resolución de Consistencia — Mrs Muzzarella

## Objetivo

Investigar a fondo el código base para entender:

1. **Problema A:** Desincronización del nombre del cliente en el frontend al editar
2. **Problema B:** Duplicación de leads por teléfono desde el bot de Telegram
3. **Problema C:** El signo `+` en teléfonos rompe URLs del frontend y genera inconsistencias

## Metodología

- Lectura completa del repomix (40k+ líneas)
- Lectura directa de archivos críticos
- Búsqueda de patrones: `telefono`, `phone`, `teléfono`, `cleanPhone`, `normalizar`, `encodeURIComponent`
- Rastreo de cada entry point donde ingresan teléfonos

## Hallazgos Clave

### 1. NO existe un estado global de clientes en el frontend

El frontend usa **Server Components + Server Actions + `revalidatePath()`**. No hay zustand, Redux, ni React Context para clientes.

- `fetchClients()` devuelve datos serializados como props
- `updateClient()` hace `revalidatePath()` sobre varias rutas — en teoría debería funcionar
- El problema REAL es que **el teléfono se usa como identificador en la URL** y si el formato no matchea exactamente, el server component no encuentra el registro

### 2. NO hay UNIQUE constraint en `leads.phone`

En `src/db/schema.ts` línea 181:
```typescript
phone: varchar("phone", { length: 50 }).notNull(),
```
Sin `.unique()`. Esto permite duplicados.

### 3. `cleanPhone()` existe pero nadie la usa (excepto Telegram tools)

En `src/lib/order-utils.ts` líneas 14-16:
```typescript
export function cleanPhone(phone: string): string {
  return phone.replace(/[+\s\-]/g, "");
}
```
Esta función SOLO es llamada desde `toolsOrder.ts`. El resto del sistema (captura WhatsApp, API REST, admin UI) NO sanitiza.

### 4. Entry points que NO sanitizan teléfonos

| Entry Point | Archivo | Sanitiza? |
|-------------|---------|-----------|
| Telegram createOrder | `toolsOrder.ts` | ✅ (cleanPhone) |
| Telegram createDeliveredOrder | `toolsOrder.ts` | ✅ (cleanPhone) |
| Telegram createClient | `toolsClient.ts` | ❌ |
| Telegram updateClient | `toolsClient.ts` | ❌ |
| Telegram getClientByPhone | `toolsClient.ts` | ❌ |
| WhatsApp lead capture | `lead-capture.ts` | ❌ |
| API POST /api/leads | `routes.ts` | ❌ |
| Admin UI updateClient | `actions.ts` | ❌ |
| Admin UI deleteLead | `actions.ts` | ❌ |

### 5. Inconsistencia en edit forms

- `clients-view.tsx` (lista): modal inline con phone **disabled** ✅
- `client-edit-form.tsx` (detalle): modal con phone **editable** ❌

### 6. El bot de Telegram ya tiene lógica parcial

- `createOrder`: busca lead por teléfono, si no existe → **rechaza** (correcto)
- `createDeliveredOrder`: busca lead, si no existe → **lo crea** (correcto para backfill, pero le falta sanitizar bien)

## Entry Points Pendientes de Verificar

(Delegado en curso para webhooks de Meta, WhatsApp agent tools, etc.)

## Conclusión

El problema raíz es UNO solo: **falta una función de normalización de teléfono que se aplique en TODOS los entry points**, combinado con la falta de UNIQUE constraint en la DB. La mayoría de los síntomas (desincronización, duplicados, URLs rotas) se resuelven atacando esa causa raíz.

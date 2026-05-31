# Design Fase C: Normalización en Telegram Tools

## Estrategia

En cada tool de Telegram que recibe un teléfono, llamar `normalizePhone()` AL INICIO del `execute`, antes de cualquier operación (búsqueda, inserción, actualización).

## Principios

1. **No cambiar firma del tool**: los schemas de Zod siguen igual, el LLM manda el formato que quiera
2. **Sanitizar interno**: el `execute` normaliza antes de tocar la DB
3. **Importar desde phone-utils**: no desde order-utils (para que quede explícito)

## Archivos A Modificar

1. `src/lib/telegram/toolsClient.ts` — 6 tools que reciben phone
2. `src/lib/telegram/toolsManagement.ts` — 4 tools que reciben phone (searchClient, getClientDetail, getCustomerFullProfile, injectCustomerNote)
3. `src/lib/telegram/toolsOrder.ts` — refactor: importar normalizePhone, cambiar cleanPhone() por normalizePhone()

## Cambios Específicos

### toolsClient.ts
Agregar import, luego en cada execute:
```typescript
phone = normalizePhone(phone);
```

### toolsManagement.ts
- En `getClientDetailTool` y `searchClientTool`: detectar si `query` parece teléfono y normalizar
- En `getCustomerFullProfileTool`: misma lógica
- En `injectCustomerNoteTool`: `phone = normalizePhone(phone)`

### toolsOrder.ts
```typescript
// ANTES: import { cleanPhone, isValidPhone } from "@/lib/order-utils";
// DESPUÉS: import { normalizePhone, isValidPhone } from "@/lib/phone-utils";
// cleanPhone → normalizePhone (mismo resultado)
```

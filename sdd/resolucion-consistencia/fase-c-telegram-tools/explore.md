# Explore Fase C: Normalización en Telegram Tools

## Objetivo

Aplicar `normalizePhone()` en TODOS los tools del bot de Telegram que manejan teléfonos.

## Contexto Actual

**Tools que YA sanitizan:**
- `toolsOrder.ts`:
  - `createOrder` (línea 39): llama a `cleanPhone()` ✅
  - `createDeliveredOrder` (línea 475): llama a `cleanPhone()` ✅

**Tools que NO sanitizan:**
- `toolsClient.ts`:
  - `createClient` (línea 58): recibe `phone` y lo manda directo a DB ❌
  - `updateClient` (línea 101): recibe `phone` y `newPhone` sin sanitizar ❌
  - `getClientByPhone` (línea 16): busca sin sanitizar ❌
- `toolsManagement.ts`:
  - `getClientDetailTool` (línea 50): busca sin sanitizar ❌
  - `searchClientTool` (línea 132): busca sin sanitizar ❌
  - `getCustomerFullProfileTool` (línea 707): busca sin sanitizar ❌
  - `injectCustomerNoteTool` (línea 988): busca sin sanitizar ❌
- `toolsOrder.ts`:
  - `getClientHistory` (línea 136): busca sin sanitizar ❌
  - `suggestProducts` (línea 189): busca sin sanitizar ❌
  - `setClientAlias` (línea 248): busca sin sanitizar ❌

## Archivos A Modificar

- `src/lib/telegram/toolsClient.ts`
- `src/lib/telegram/toolsManagement.ts`
- `src/lib/telegram/toolsOrder.ts` (solo refactor cleanPhone → normalizePhone)

## Dependencias

- Depende de la Fase A (`phone-utils.ts`)
- NO depende de la Fase B (puede funcionar sin UNIQUE constraint)

## Estrategia

En cada tool, al recibir un teléfono:
1. Llamar `normalizePhone()` inmediatamente
2. Usar el teléfono normalizado para TODAS las operaciones (búsqueda, inserción, actualización)
3. En búsquedas con `ilike`, normalizar también

## Decisión Tomada

- Refactor: NO tocar la firma de los tools (siguen recibiendo string)
- Cambio INTERNO: sanitizar al inicio de cada `execute`
- `createOrder` y `createDeliveredOrder`: refactor `cleanPhone()` → `normalizePhone()`

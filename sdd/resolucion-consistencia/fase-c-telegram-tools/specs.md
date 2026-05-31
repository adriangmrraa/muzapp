# Specs Fase C: Normalización en Telegram Tools

## Archivos a Modificar

1. `src/lib/telegram/toolsClient.ts`
2. `src/lib/telegram/toolsManagement.ts`
3. `src/lib/telegram/toolsOrder.ts`

## Cambios Específicos

### 1. `toolsClient.ts`

**`createClient` (línea 58):**
```typescript
execute: async ({ name, phone, email }) => {
    phone = normalizePhone(phone);  // ← AGREGAR
    // ...resto igual
```

**`updateClient` (línea 101):**
```typescript
execute: async ({ phone, newPhone, name, email, notes, alias }) => {
    phone = normalizePhone(phone);    // ← AGREGAR
    if (newPhone) newPhone = normalizePhone(newPhone);  // ← AGREGAR
    // ...resto igual
```

**`getClientByPhone` (línea 16):**
```typescript
execute: async ({ phone }) => {
    phone = normalizePhone(phone);  // ← AGREGAR
    // ...resto igual
```

**`getClientHistory` (línea 136):**
```typescript
execute: async ({ phone, limit = 10 }) => {
    phone = normalizePhone(phone);  // ← AGREGAR
    // ...resto igual
```

**`suggestProducts` (línea 189):**
```typescript
execute: async ({ phone }) => {
    phone = normalizePhone(phone);  // ← AGREGAR
    // ...resto igual
```

**`setClientAlias` (línea 248):**
```typescript
execute: async ({ phone, alias }) => {
    phone = normalizePhone(phone);  // ← AGREGAR
    // ...resto igual
```

### 2. `toolsManagement.ts`

**`getClientDetailTool` (línea 50):**
```typescript
execute: async ({ query }) => {
    // Si query es numérico (potencial teléfono), normalizarlo
    const normalizedQuery = /^\d+$/.test(query) ? query : normalizePhone(query);
    // Usar normalizedQuery en lugar de query para eq(leads.phone, ...)
```

**`searchClientTool` (línea 132):**
```typescript
execute: async ({ query }) => {
    // Si query tiene formato de teléfono (+54, números largos), normalizar
    // Pero mantener el original para búsqueda por nombre
    const phoneQuery = /^\+?\d[\d\s\-()]*$/.test(query) ? normalizePhone(query) : query;
```

**`getCustomerFullProfileTool` (línea 707):**
```typescript
execute: async ({ query }) => {
    // Misma lógica: detectar si es teléfono y normalizar
```

**`injectCustomerNoteTool` (línea 988):**
```typescript
execute: async ({ phone, note }) => {
    phone = normalizePhone(phone);  // ← AGREGAR
```

### 3. `toolsOrder.ts`

**`cleanPhone()` ya se usa en createOrder y createDeliveredOrder.**
- Refactor: cambiar `cleanPhone(phone)` por `normalizePhone(phone)`
- La función `cleanPhone` todavía existe y delega, así que el código actual SEGUIRÁ funcionando

## Dependencia de Importación

En todos los archivos:
```typescript
import { normalizePhone, isValidPhone } from "@/lib/phone-utils";
```

`isValidPhone` ya se importa en `toolsOrder.ts` desde `order-utils.ts` — cambiar esa importación también.

## Criterios de Aceptación

- ✅ Cada tool que recibe un teléfono lo normaliza ANTES de cualquier operación
- ✅ `cleanPhone()` sigue funcionando (delega en `normalizePhone()`)
- ✅ No se rompen imports ni tipos existentes
- ✅ Las búsquedas por nombre siguen funcionando sin cambios

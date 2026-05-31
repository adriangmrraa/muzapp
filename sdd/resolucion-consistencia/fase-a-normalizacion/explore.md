# Explore Fase A: Función Central de Normalización de Teléfonos

## Objetivo

Crear una función utilitaria `normalizePhone()` que sea la ÚNICA fuente de verdad para limpiar y validar números de teléfono en TODO el sistema.

## Contexto Actual

Actualmente hay UNA función `cleanPhone()` en `src/lib/order-utils.ts` (líneas 14-16):
```typescript
export function cleanPhone(phone: string): string {
  return phone.replace(/[+\s\-]/g, "");
}
```

Y una función `isValidPhone()` en el mismo archivo (líneas 9-11):
```typescript
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/[+\s\-]/g, "");
  return /^549\d{7,11}$/.test(cleaned);
}
```

**Problemas:**
1. Están en `order-utils.ts` — un archivo de utilidades de pedidos, no de teléfonos
2. Nadie las importa excepto `toolsOrder.ts`
3. `cleanPhone()` es DEMASIADO básica — solo saca `+`, espacios y guiones, no cubre paréntesis ni otros caracteres
4. No hay una función única y canónica que TODOS los entry points llamen

## Archivos Relevantes

- `src/lib/order-utils.ts` — contiene `cleanPhone()` y `isValidPhone()` actuales
- `src/lib/phone-utils.ts` — archivo a CREAR con la función centralizada

## Dependencias

- Esta fase NO depende de ninguna otra (es la base)
- Todas las demás fases DEPENDEN de esta

## Riesgos

- Ninguno — es una función pura, sin efectos secundarios
- Mantener retrocompatibilidad: `cleanPhone()` debe seguir funcionando igual

## Decisión Tomada

Crear `src/lib/phone-utils.ts` con:
- `normalizePhone(phone: string): string`
- `isValidPhone(phone: string): boolean` (mover desde order-utils)
- `cleanPhone()` será refactorizada para delegar en `normalizePhone()`

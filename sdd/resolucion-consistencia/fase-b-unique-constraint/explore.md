# Explore Fase B: UNIQUE Constraint en `leads.phone`

## Objetivo

Agregar una restricción UNIQUE en la columna `phone` de la tabla `leads` para prevenir duplicados a nivel base de datos.

## Contexto Actual

En `src/db/schema.ts` línea 181:
```typescript
phone: varchar("phone", { length: 50 }).notNull(),
```

Sin `.unique()`. Esto significa que PostgreSQL PERMITE múltiples registros con el mismo teléfono.

**Consecuencias actuales:**
- El bot de Telegram puede crear leads duplicados
- `searchClient` con `ilike` parcial puede devolver múltiples registros para el mismo número
- `updateClient(phone, data)` actualiza SOLO el primer match (por `eq` + `limit(1)`)
- No hay manera confiable de identificar un cliente unívocamente

## Archivos Relevantes

- `src/db/schema.ts` — definición de la tabla `leads`
- `drizzle/` — archivos de migración existentes
  - `drizzle/0000_peaceful_chamber.sql` — migración inicial
  - `drizzle/0001_snapshot.json` — snapshot actual

## Dependencias

- Depende de la Fase A (normalización) porque primero hay que limpiar duplicados existentes
- Es requisito para todas las fases posteriores (no tendría sentido sanitizar si la DB permite duplicados)

## Riesgos

1. **Duplicados existentes:** Puede haber registros con el mismo teléfono en producción. La migración debe:
   - Encontrar duplicados
   - Resolverlos (quedarse con el registro más reciente)
   - Reasignar `orders.leadId` si es necesario
   - Recién AGREGAR el UNIQUE

2. **Rollback:** Si la migración falla, no debe dejar la DB en estado inconsistente

## Decisión Tomada

Crear migración Drizzle (`0002_unique_phone.sql`) con:
1. DELETE de duplicados (keep latest)
2. UPDATE de `orders.leadId` que apunten a registros eliminados
3. ALTER TABLE ADD CONSTRAINT UNIQUE

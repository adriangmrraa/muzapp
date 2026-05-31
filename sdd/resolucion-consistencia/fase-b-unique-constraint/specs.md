# Specs Fase B: UNIQUE Constraint en `leads.phone`

## Archivo a Modificar

`src/db/schema.ts`

## Cambio en Schema

Línea 181: agregar `.unique()`:
```typescript
phone: varchar("phone", { length: 50 }).notNull().unique(),
```

## Migración SQL

No tenemos Drizzle Kit corriendo como CLI configurado (no hay `drizzle.config.ts` visible), así que hacemos la migración manual.

**Archivo a crear:** `drizzle/0002_unique_phone.sql`

```sql
-- PASO 1: Identificar y eliminar leads duplicados (quedarse con el más reciente)
-- Esto asegura que no falle ALTER TABLE ADD CONSTRAINT
DELETE FROM leads a USING (
  SELECT MIN(id) as id, phone
  FROM leads
  GROUP BY phone
  HAVING COUNT(*) > 1
) b
WHERE a.phone = b.phone AND a.id != b.id;

-- PASO 2: Reasignar órdenes que apuntan a leads eliminados
-- (por si algún lead duplicado tenía órdenes asociadas)
UPDATE orders o
SET lead_id = (
  SELECT l.id FROM leads l
  WHERE l.phone = (
    SELECT l2.phone FROM leads l2 WHERE l2.id = o.lead_id
  )
  ORDER BY l.created_at DESC
  LIMIT 1
)
WHERE o.lead_id IN (
  SELECT id FROM leads
  WHERE phone IN (
    SELECT phone FROM leads GROUP BY phone HAVING COUNT(*) > 1
  )
);

-- PASO 3: Agregar UNIQUE constraint
ALTER TABLE leads ADD CONSTRAINT leads_phone_unique UNIQUE (phone);
```

## Snapshot de Drizzle

Actualizar `drizzle/meta/0001_snapshot.json` con el nuevo estado (opcional si no se usa Drizzle Kit).

## Criterios de Aceptación

- ✅ `leads.phone` tiene restricción UNIQUE en PostgreSQL
- ✅ Migración ejecutable sin errores en base vacía o con datos
- ✅ Si hay duplicados, la migración los resuelve (keep latest)
- ✅ Las órdenes no quedan huérfanas tras la limpieza

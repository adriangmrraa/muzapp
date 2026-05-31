-- ─────────────────────────────────────────────────────────────────────────────
-- Fase B: UNIQUE Constraint en leads.phone
-- ─────────────────────────────────────────────────────────────────────────────
-- PRECAUCION: Esta migración ELIMINA leads duplicados (conserva el más reciente
-- por cada teléfono). Ejecutar EN VACÍO si hay dudas sobre qué datos perder.

-- PASO 1: Eliminar leads duplicados, quedarse con el registro más reciente
DELETE FROM leads a
USING (
  SELECT MIN(id) AS id, phone
  FROM leads
  GROUP BY phone
  HAVING COUNT(*) > 1
) b
WHERE a.phone = b.phone AND a.id != b.id;

-- PASO 2: Reasignar órdenes que apuntaban a leads eliminados
UPDATE orders o
SET lead_id = (
  SELECT l.id FROM leads l
  WHERE l.phone = (SELECT l2.phone FROM leads l2 WHERE l2.id = o.lead_id)
  ORDER BY l.created_at DESC
  LIMIT 1
)
WHERE o.lead_id IS NOT NULL
  AND o.lead_id NOT IN (SELECT id FROM leads);

-- PASO 3: Agregar UNIQUE constraint
ALTER TABLE leads ADD CONSTRAINT leads_phone_unique UNIQUE (phone);

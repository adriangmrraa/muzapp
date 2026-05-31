# Design Fase B: UNIQUE Constraint en `leads.phone`

## Decisión Arquitectónica

| Aspecto | Decisión | Alternativa | Por qué |
|---------|----------|-------------|---------|
| Tipo de constraint | `UNIQUE` simple (no composite) | Unique index | Constraint es declarativo, Drizzle lo soporta nativamente |
| Limpieza previa | DELETE duplicados (keep latest) | Migración manual | La DB no acepta UNIQUE si hay duplicados |
| Reasignación de órdenes | UPDATE `orders.lead_id` | Dejar huérfano | Integridad referencial |
| Migración Drizzle | SQL manual (no Drizzle Kit) | Drizzle Kit push | No hay `drizzle.config.ts` configurado |

## Estrategia de Migración

```
1. DELETE duplicados en leads (keep más reciente)
2. REASIGNAR orders.lead_id que apunten a leads borrados
3. ALTER TABLE ADD CONSTRAINT leads_phone_unique UNIQUE (phone)
```

## Rollback

```sql
ALTER TABLE leads DROP CONSTRAINT leads_phone_unique;
```

## Riesgos

- Si hay MUCHOS duplicados, la limpieza puede perder datos. Por eso se queda con el más reciente (que probablemente tenga los datos más actualizados).

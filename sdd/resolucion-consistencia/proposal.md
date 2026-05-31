# Proposal: Resolución de Consistencia — Mrs Muzzarella

## Intent

Resolver TRES problemas críticos de desincronización y consistencia en el sistema de gestión Mrs Muzzarella:

1. **Desincronización del nombre del cliente en el frontend** al editar desde la página dedicada
2. **Duplicación de leads por teléfono** desde el bot de Telegram
3. **El signo `+` en los teléfonos** rompe URLs y genera inconsistencias

## Scope

### Incluye

| Fase | Descripción | Archivos Afectados |
|------|-------------|-------------------|
| **Fase A** | Crear `src/lib/phone-utils.ts` — función central `normalizePhone()` | 1 archivo nuevo |
| **Fase B** | Agregar UNIQUE constraint en `leads.phone` + migración | `schema.ts`, 1 migración |
| **Fase C** | Aplicar `normalizePhone()` en Telegram tools | `toolsClient.ts`, `toolsManagement.ts`, `toolsOrder.ts` |
| **Fase D** | Aplicar `normalizePhone()` en WhatsApp + API | `lead-capture.ts`, `routes.ts` |
| **Fase E** | Corregir frontend: edit form, actions, sincronización | `client-edit-form.tsx`, `page.tsx`, `actions.ts` |
| **Fase F** | Verificar entry points restantes (webhooks, agent tools) | Por determinar |

### No incluye

- ❌ Migración de datos históricos (solo limpieza de duplicados para UNIQUE)
- ❌ Refactor mayor de la arquitectura de estado del frontend (React Context, zustand)
- ❌ Cambios en el schema de `orders.phoneNumber` (no tiene FK a leads, y cambiarlo sería enorme)
- ❌ Sistema de migraciones Drizzle (ya existe, solo agregamos una migración)

## Approach

### Arquitectura General

```
[Fase A] normalizePhone() ─┬─ [Fase B] UNIQUE constraint en DB
                            │
                            ├─ [Fase C] Telegram tools
                            ├─ [Fase D] WhatsApp + API REST
                            ├─ [Fase E] Frontend (actions + forms)
                            └─ [Fase F] Verificación
```

### Principios

1. **Una sola función de normalización** para todo el sistema
2. **Sanitizar en el entry point**, no en cada consumer
3. **La DB es el último vallado** — UNIQUE constraint como safety net
4. **No romper APIs existentes** — cambiar implementación interna, no interfaces

### Orden de Implementación

Estricto: A → B → C → D → E → F

Cada fase produce un artifact verificable independientemente.

## Trade-offs

| Decisión | Alternativa | Por qué esta |
|----------|-------------|--------------|
| Normalizar en entry points vs en DB layer | En DB layer con trigger | Entry points es más explícito y fácil de debuggear |
| `normalizePhone()` como función pura vs middleware | Middleware | Función pura es testeable, no tiene side effects |
| No migrar datos históricos | Migrar TODOS los teléfonos | Arriesgado sin rollback; mejor sanitizar desde ahora |
| Phone como identificador vs agregar UUID | UUID nuevo | Cambiaría TODO el sistema: URLs, queries, relaciones. Fuera de scope |

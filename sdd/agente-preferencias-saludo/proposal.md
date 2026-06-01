# SDD Propose: Preferencias del Cliente en el Saludo — personalizar primer mensaje

## Intent

Un cliente habitual que siempre pide "bookbinder con cheddar" recibe el mismo saludo genérico "Holaa, si decime" como si fuera nuevo. Queremos que cuando un cliente CONOCIDO (con preferencias registradas) escriba, el saludo sea personalizado: "Holaa de nuevo, ¿querés lo de siempre?" para ahorrar pasos y sentirse más humano.

## Scope

### In Scope

1. Modificar la sección `[SALUDO]` del system prompt para que cuando el cliente tenga `preferences`, el saludo sea personalizado
2. Mantener el comportamiento actual para clientes sin historial

### Out of Scope

- No tocar `agent.ts` (ya inyecta `preferences` correctamente)
- No modificar la lógica de cálculo de preferencias
- No UI changes

## Approach

En la sección `[SALUDO]` del DEFAULT_SYSTEM_PROMPT, agregar una condición al inicio:

1. Si el cliente tiene PREFERENCIAS (productos que suele pedir) Y es su PRIMER mensaje:
   - Saludar personalizado: "Holaa de nuevo! ¿Lo de siempre? (Bookbinder, Crispy Pollo)"
   - Listar hasta 2 productos de sus preferencias
2. Si el cliente tiene preferencias PERO el mensaje ya especifica un producto:
   - Ignorar las preferencias, procesar lo que pide
3. Si el cliente NO tiene preferencias o no es conocido:
   - Saludo normal: "Holaa, si decime"

Esto ya se puede implementar con los datos que `customerContext.preferences` provee actualmente. Solo es cuestión de cambiar el prompt.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/whatsapp/prompt-builder.ts` | Modify | Modificar sección `[SALUDO]` en DEFAULT_SYSTEM_PROMPT |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Cliente con preferencias pero quiere algo diferente hoy | Medium | La instrucción dice que si el cliente pide algo específico, ignorar preferencias |
| Preferencias desactualizadas (cliente ya no pide eso) | Low | Se actualizan con cada pedido nuevo |
| Cliente se siente espiado por "lo sé todo de vos" | Low | El tono es amigable: "¿lo de siempre?" — no invasivo |

## Success Criteria

- [ ] Cliente con preferencias ["Bookbinder", "Crispy Pollo"] escribe "hola" → "Holaa de nuevo! ¿Lo de siempre? (Bookbinder y Crispy Pollo)"
- [ ] Cliente sin historial escribe "hola" → "Holaa, si decime" (normal)
- [ ] Cliente con preferencias pero escribe "quiero una toro" → ignorar preferencias, procesar toro

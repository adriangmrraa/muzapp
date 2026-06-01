# SDD Propose: Contexto por Hora del Día — ajustar respuestas según horario

## Intent

A las 2 AM alguien pregunta "están?" y el agente responde con menú normal como si estuviera todo abierto. Queremos que Karen sepa qué hora es y ajuste su respuesta: si está fuera del horario de atención, debe avisar y preguntar si quieren dejar pedido para cuando abran.

## Scope

### In Scope

1. Inyectar hora actual en `customerContext` desde `agent.ts`
2. Nueva sección `[CONTEXTO HORARIO]` en el system prompt que procese la hora actual contra los horarios de atención
3. Usar `getBusinessHours` data ya disponible en DB

### Out of Scope

- No crear tools nuevas
- No modificar `getBusinessHours` (ya funciona)
- No sistema de pedidos programados

## Approach

1. En `agent.ts`, agregar al `customerContext` un campo `currentTime` con la hora actual en formato ISO string
2. En `buildSystemPrompt` de `prompt-builder.ts`, inyectar la hora actual en el contexto: `🕐 HORA ACTUAL: {hora}`
3. Agregar sección `[CONTEXTO HORARIO]` en el DEFAULT_SYSTEM_PROMPT que:
   - Compare la hora actual con los horarios de atención
   - Si está fuera de horario: "Ahora estamos cerrados. Abrimos a las [hora]. ¿Querés dejar algo pedido?"
   - Si el día está cerrado (domingo): "[Día] cerramos, pero mañana desde las [hora] estamos. ¿Querés dejar algo pedido?"
   - Si está en horario: comportamiento normal

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/whatsapp/agent.ts` | Modify | Agregar `currentTime` al customerContext |
| `src/lib/whatsapp/prompt-builder.ts` | Modify | Inyectar hora actual en contexto + agregar sección `[CONTEXTO HORARIO]` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Hora del servidor no coincide con zona horaria de Formosa | Medium | Usar `Intl.DateTimeFormat` con timezone "America/Argentina/Cordoba" |
| El LLM ignora la hora actual | Low | La sección es explícita y está EARLY en el prompt |

## Success Criteria

- [ ] 2 AM, local cerrado, cliente "hola?" → "Ahora estamos cerrados, volvemos a las 9. ¿Querés dejar algo pedido para mañana?"
- [ ] 8 PM, local abierto, cliente "hola" → "Holaa, si decime" (normal)
- [ ] Domingo (cerrado), cliente "están?" → "Hoy cerramos, pero mañana desde las 9 estamos. ¿Querés dejar algo pedido?"

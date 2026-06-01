# SDD Propose: Memoria entre Conversaciones — Inyectar Último Mensaje de Sesión Anterior

## Intent

Un cliente preguntó precio y se fue. Vuelve 2 días después. El agente arranca de cero, no recuerda que ya había mostrado interés. Queremos que cuando un cliente conocido vuelve, el agente tenga contexto de la conversación anterior — al menos el último mensaje relevante — para dar continuidad sin necesidad de pasar historial completo.

## Scope

### In Scope

1. En `agent.ts`, al cargar `customerContext`, buscar el último mensaje de la conversación más reciente (sesión anterior)
2. Pasar ese mensaje como parte del contexto
3. En `prompt-builder.ts`, inyectar ese mensaje en el prompt como "📝 CONTEXTO ANTERIOR"

### Out of Scope

- No pasar historial completo de conversaciones
- No tocar tabla de mensajes (schema)
- No modificar la lógica de almacenamiento de conversaciones
- No análisis sentimental del historial

## Approach

### En `agent.ts`:

Al momento de construir el `customerContext`, agregar una consulta a la tabla de mensajes:

```typescript
// Buscar último mensaje de la conversación anterior (no de esta sesión)
const lastMessage = await db.query.messages.findFirst({
  where: and(
    eq(messages.phone, phone),
    lt(messages.sessionId, currentSessionId) // sesión anterior
  ),
  orderBy: [desc(messages.createdAt)],
  columns: { content: true, createdAt: true }
});
```

Si existe, agregarlo al `customerContext` como `previousContext`.

### En `prompt-builder.ts`:

Si `customerContext.previousContext` existe, inyectar al inicio del prompt:

```
📝 CONTEXTO ANTERIOR (sesión pasada):
El cliente preguntó: "[último mensaje]"

💡 Usá esto para dar continuidad. Si el cliente vuelve a saludar, referenciá su interés anterior.
```

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/whatsapp/agent.ts` | Modify | Agregar consulta de último mensaje de sesión anterior y pasarlo en customerContext |
| `src/lib/whatsapp/prompt-builder.ts` | Modify | Inyectar `previousContext` en el prompt cuando exista |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Cliente vuelve después de mucho tiempo y el contexto está obsoleto | Medium | Solo pasar el último mensaje, no todo el historial. Si pasaron semanas, el contexto se siente naturalmente lejano |
| Cliente preguntó algo negativo ("no me gustó") y al volver se lo recordamos | Low | No hay análisis sentimental — pero al ser solo el último mensaje, si era negativo el cliente probablemente no vuelve. Si vuelve, el tono del agente sigue siendo positivo |
| Performance: query extra por cada cliente conocido | Low | Es una query con filtro exacto por phone + sessionId, indexada, sin joins pesados |

## Success Criteria

- [ ] Cliente preguntó "a cómo está la bookbinder?" y se fue. Vuelve y dice "hola" → "Holaa de nuevo! La última vez preguntaste por la Bookbinder ($7000). ¿Te animás?"
- [ ] Cliente que nunca habló → normal, sin contexto anterior
- [ ] Cliente que dejó un pedido a medias → "Tenías un pedido en proceso, ¿querés retomarlo?"

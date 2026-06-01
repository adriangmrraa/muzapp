# SDD Specs: Memoria entre Conversaciones — Inyectar Último Mensaje de Sesión Anterior

## 1. Modificaciones a `agent.ts`

### 1.1 Consultar último mensaje de sesión anterior

Dentro de la función que construye `customerContext`, agregar:

```typescript
// Obtener último mensaje de la conversación anterior (si existe)
let previousContext: string | undefined;

const lastSessionMessage = await db.query.messages.findFirst({
  where: and(
    eq(messages.phone, phone),
    ne(messages.sessionId, sessionId)  // NO de la sesión actual
  ),
  orderBy: [desc(messages.createdAt)],
  columns: { content: true, createdAt: true }
});

if (lastSessionMessage) {
  previousContext = lastSessionMessage.content;
}
```

### 1.2 Incluir en customerContext

Agregar `previousContext` al objeto retornado:

```typescript
return {
  ...customerContext,
  previousContext  // string | undefined
};
```

### 1.3 Filtro de tiempo opcional

Considerar si es útil limitar a conversaciones de los últimos N días (ej: 30 días). Si el último mensaje tiene más de 30 días, omitir el contexto para no dar información obsoleta.

```typescript
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
if (lastSessionMessage && (Date.now() - lastSessionMessage.createdAt.getTime()) < THIRTY_DAYS_MS) {
  previousContext = lastSessionMessage.content;
}
```

## 2. Modificaciones a `prompt-builder.ts`

### 2.1 Inyectar contexto anterior

Al inicio del prompt (después del saludo, antes de `[SALUDO]`), si `customerContext.previousContext` existe:

```
📝 CONTEXTO ANTERIOR (sesión pasada):
El cliente preguntó: "[previousContext]"

💡 Usá esto para dar continuidad sin ser repetitivo.
```

### 2.2 Reglas para el agente

Agregar en `[NO HACÉS]`:

```
- Si hay CONTEXTO ANTERIOR, NO lo menciones si pasaron más de 2 interacciones en esta sesión
- NO inventes información del contexto anterior que no esté ahí
- Si el cliente vuelve a preguntar algo que ya preguntó antes, respondé normal sin decir "ya preguntaste eso"
```

## 3. Escenarios de prueba

### Escenario 1: Cliente preguntó precio y vuelve
**Setup**: Cliente tiene mensaje anterior: "a cómo está la bookbinder?" de hace 2 días. Vuelve y dice "hola".
**Esperado**: `previousContext = "a cómo está la bookbinder?"`. Agente responde: "Holaa de nuevo! La última vez preguntaste por la Bookbinder ($7000). ¿Te animás?" ✅

### Escenario 2: Cliente nunca habló antes
**Setup**: Sin mensajes anteriores para este phone.
**Esperado**: `previousContext = undefined`. No se inyecta contexto. Saludo normal ✅

### Escenario 3: Cliente dejó pedido a medias
**Setup**: Último mensaje de sesión anterior: "dale, poneme una bookbinder" (pero no completó el pedido).
**Esperado**: Agente: "Holaa de nuevo! Tenías un pedido en proceso, ¿querés retomarlo?" ✅

### Escenario 4: Último mensaje tiene más de 30 días
**Setup**: Último mensaje de hace 45 días.
**Esperado**: `previousContext = undefined` por filtro temporal. Saludo normal sin referencia ✅

### Escenario 5: Cliente interactuó 3 veces en esta sesión, contexto ya no es útil
**Setup**: Cliente volvió, ya hubo 3 intercambios en la sesión actual.
**Esperado**: El contexto anterior ya no se referencia (regla de `[NO HACÉS]` aplica) ✅

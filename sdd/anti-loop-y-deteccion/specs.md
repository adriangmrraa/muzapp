# SDD Specs: Anti-Loop y Detección de Confusión

## MODIFICATIONS

### MOD-01 — Schema: agregar `conversationMetadata` en `conversations`

La tabla `conversations` DEBE incluir una columna `conversationMetadata` de tipo `jsonb` con la siguiente estructura:

```typescript
type ConversationMetadata = {
  loopCount: number;          // número de ciclos repetitivos detectados
  strategy: string;           // estrategia actual para romper el loop
  confusionCount: number;     // cantidad de veces que el cliente expresó confusión
  lastStrategyUsed: string;   // timestamp o nombre de última estrategia aplicada
};
```

### MOD-02 — Nuevo archivo `src/lib/whatsapp/anti-loop.ts`

Se DEBE crear `anti-loop.ts` con dos funciones exportadas:

**`analyzeConversationState(messages: Message[], metadata: ConversationMetadata): AnalysisResult`**

El resultado DEBE contener:
- `isLooping: boolean` — true si se detecta un ciclo repetitivo
- `isConfused: boolean` — true si el cliente expresa confusión
- `loopCount: number` — conteo actualizado
- `recommendedStrategy: 'repeat' | 'simplify' | 'offer_alternatives' | 'transfer'`

La detección de confusión DEBE usar los siguientes patrones regex:
- `/\bEh\?\b/i`
- `/\bno entend[ií]\b/i`
- `/\bno (te )?entiendo\b/i`
- `/^\s*\?\s*$/`
- `/\b(no|mal) entend[ií]ste?\b/i`
- `/\b(a ver|explic(a|ame)) de nuevo\b/i`

**`buildAntiLoopDirective(analysis: AnalysisResult): string`**

DEBE retornar un fragmento de instrucción en lenguaje natural para inyectar en el prompt del agente. DEBE distinguir cuatro estrategias:

| Estrategia | Directiva |
|---|---|
| `repeat` | "El cliente parece no haber entendido tu respuesta anterior. REPETÍ la información clave usando las MISMAS PALABRAS pero más BREVE." |
| `simplify` | "El cliente está confundido. Simplificá tu respuesta: una oración, sin opciones, preguntá si quiere eso." |
| `offer_alternatives` | "El cliente no está conforme con lo que ofrecés. Ofrecele UNA alternativa concreta o preguntale QUÉ le gustaría." |
| `transfer` | "Derivá al humano de forma amable: 'Dejame consultar con el encargado y te confirmo enseguida.'" |

### MOD-03 — Modificar `src/lib/whatsapp/agent.ts`

Antes de cada llamada a `generateText`, el sistema DEBE:
1. Llamar a `analyzeConversationState()` con los mensajes recientes (últimos 10) y el `conversationMetadata` actual
2. Si `analysis.isLooping` es true, llamar a `buildAntiLoopDirective()` y PREPENDer el resultado al prompt del agente
3. Si `analysis.loopCount >= 3`, DEBE activar `transferToHuman` automáticamente
4. Actualizar `conversationMetadata` en la base de datos después de cada análisis
5. Si `analysis.isConfused` es true, incrementar `confusionCount` en el metadata

### MOD-04 — Migración Drizzle

Se DEBE agregar una migración Drizzle que agregue la columna `conversationMetadata` a la tabla `conversations`:

```sql
ALTER TABLE conversations ADD COLUMN conversationMetadata jsonb DEFAULT '{}'::jsonb;
```

## REQUERIMIENTOS

### REQ-01: Detección de loop conversacional

El sistema DEBE identificar un loop cuando el cliente envía 3 o más mensajes consecutivos sobre el mismo tema sin que el agente logre avanzar la conversación hacia una resolución (pedido, respuesta afirmativa, negativa, o despedida).

Given un cliente que preguntó "cuánto sale la bookbinder" 3 veces seguidas
When el agente responde 3 veces el precio
Then `analyzeConversationState` DEBE retornar `isLooping: true` con `loopCount: 3`.

### REQ-02: Auto-derivación a humano

El sistema DEBE transferir la conversación a un humano cuando `loopCount >= 3` en un mismo ciclo.

Given un cliente con `loopCount = 3` tras respuestas repetitivas
When el sistema prepara la siguiente respuesta del agente
Then DEBE activar `transferToHuman` en lugar de `generateText`, y el agente DEBE decir "Dejame consultar con el encargado y te confirmo enseguida."

### REQ-03: Detección de confusión léxica

El sistema DEBE detectar expresiones de confusión del cliente mediante los patrones regex definidos en MOD-02.

Given un cliente que responde "Eh?" a la respuesta del agente
When el sistema analiza el mensaje
Then `analysis.isConfused` DEBE ser `true` y `confusionCount` DEBE incrementarse en 1.

### REQ-04: Inyección de directiva anti-loop

El sistema DEBE inyectar la directiva de `buildAntiLoopDirective()` como prefijo del prompt antes de `generateText` cuando se detecte un loop.

Given un cliente en estado de loop (`isLooping: true`)
When el sistema construye el prompt para `generateText`
Then el prompt DEBE comenzar con la directiva correspondiente según `analysis.recommendedStrategy`.

### REQ-05: Persistencia del estado de loop

El sistema DEBE persistir `loopCount`, `confusionCount`, y `strategy` en `conversationMetadata` después de cada análisis.

Given un análisis que detecta un loop con `loopCount = 2`
When el sistema finaliza el análisis
Then `conversationMetadata.loopCount` DEBE actualizarse a `2` en la base de datos.

### REQ-06: Límite de mensajes analizados

El sistema DEBE analizar como máximo los últimos 10 mensajes de la conversación para determinar el estado de loop.

Given una conversación con 50 mensajes
When el sistema llama a `analyzeConversationState`
Then DEBE considerar solo los últimos 10 mensajes para el análisis de repetición.

## ESCENARIOS DE PRUEBA

### Escenario 1: Loop por precio

**Setup**: Cliente: "cuánto sale?" → Agente responde precio → Cliente: "cuánto sale?" → Agente responde precio → Cliente: "cuánto sale?".

**Esperado**: `loopCount = 3`, `isLooping = true`, estrategia `transfer`. El agente deriva a humano. ✅

### Escenario 2: Confusión inmediata

**Setup**: Cliente: "no entendí" tras la primera respuesta del agente.

**Esperado**: `isConfused = true`, `confusionCount = 1`, estrategia `simplify`. Directiva de simplificación inyectada. ✅

### Escenario 3: Sin loop

**Setup**: Cliente: "hola" → Agente: saluda → Cliente: "cuánto sale la bookbinder" → Agente responde → Cliente: "dale poneme una".

**Esperado**: Loop no detectado. Sin directiva inyectada. `loopCount = 0`. ✅

### Escenario 4: Confusión en medio de loop

**Setup**: Cliente pregunta precio 2 veces, luego dice "Eh?".

**Esperado**: `loopCount = 2`, `confusionCount = 1`, estrategia `simplify` (confusión tiene prioridad sobre repetición). ✅

### Escenario 5: Sin metadata previa

**Setup**: Conversación nueva sin `conversationMetadata`.

**Esperado**: Sistema inicializa metadata con `loopCount: 0`, `confusionCount: 0`, `strategy: ''`. No se detecta loop. ✅

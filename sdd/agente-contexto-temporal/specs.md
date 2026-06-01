# SDD Specs: Contexto Temporal — Detectar "ahora" vs "después" en mensajes

## 1. Modificaciones al System Prompt

### 1.1 Nueva sección `[CONTEXTO TEMPORAL]`

Agregar en DEFAULT_SYSTEM_PROMPT de `prompt-builder.ts`, antes de `[FLUJO]`:

```
[CONTEXTO TEMPORAL]
- Detectá si el mensaje del cliente se refiere al presente (hoy, ahora, esta tarde/noche) o al futuro (mañana, el lunes, el sábado, la semana que viene, el finde)
- Palabras clave FUTURO: mañana, pasado, el lunes, el martes, el miércoles, el jueves, el viernes, el sábado, el domingo, la semana que viene, el finde, el fin de semana, la próxima semana
- Palabras clave PRESENTE: hoy, ahora, esta tarde, esta noche, en un rato, al ratito, al rato, más tarde

SI ES FUTURO:
- Ejecutá getBusinessHours para ver los horarios de ese día
- Respondé: "Sii, [día] estamos de [hora apertura] a [hora cierre]. ¿Querés dejar algo pedido para esa fecha?"
- Si el día está cerrado (ej: domingo): "[Día] cerramos, disculpá. ¿Querés pedir para otro día?"
- NO arranques flujo de venta. NO preguntes delivery. NO preguntes dirección. NO preguntes qué quiere.

SI ES PRESENTE / HOY:
- Comportamiento normal. Seguí el flujo de venta estándar.

SI ES AMBIGUO (ej: "están?") sin referencia temporal clara:
- Asumí presente. Comportamiento normal.
```

### 1.2 Ubicación exacta

Insertar entre `[ESTILO]` y `[SALUDO]` (después de la línea de voseo natural, antes del primer mensaje de saludo).

## 2. Escenarios de prueba

### Escenario 1: Mañana (día abierto)
**Input**: "Mañana trabajan?"
**Esperado**: El agente detecta "mañana" → getBusinessHours → "Sii, mañana estamos de 18 a 23hs. ¿Querés dejar algo pedido para mañana?" — NO pregunta delivery, NO pregunta qué quiere ✅

### Escenario 2: Domingo (día cerrado)
**Input**: "El domingo están?"
**Esperado**: getBusinessHours → "Los domingos cerramos, disculpá" — NO arranca flujo de venta ✅

### Escenario 3: Hoy / presente
**Input**: "Hoy a la tarde están?"
**Esperado**: Detecta presente → comportamiento normal → "Sii, estamos hasta las 23hs. Decime" ✅

### Escenario 4: Semana que viene
**Input**: "La semana que viene voy a pedir"
**Esperado**: Detecta futuro → "Dale, avisá nomás cuando quieras" ✅

### Escenario 5: Sábado (día abierto)
**Input**: "El sábado están?"
**Esperado**: getBusinessHours → "Sii, el sábado estamos de 18 a 23hs. ¿Querés dejar algo pedido?" ✅

### Escenario 6: Sin referencia temporal (ambiguo)
**Input**: "Holaa"
**Esperado**: Sin detectar futuro → comportamiento normal de saludo ✅

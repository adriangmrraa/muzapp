# SDD Specs: Contexto por Hora del Día — ajustar respuestas según horario

## 1. Modificaciones en `agent.ts`

### 1.1 Agregar `currentTime` al `customerContext`

Después de la línea que setea `lastOrder` (línea 141 aprox), agregar:

```typescript
// 🕐 Hora actual del servidor en timezone Formosa
const now = new Date();
const formosaTime = now.toLocaleTimeString("es-AR", {
  timeZone: "America/Argentina/Cordoba",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
const formosaDay = now.toLocaleDateString("es-AR", {
  timeZone: "America/Argentina/Cordoba",
  weekday: "long",
});
customerContext.currentTime = `${formosaDay}, ${formosaTime}`;
```

### 1.2 Actualizar la interfaz de `customerContext`

Agregar `currentTime?: string` al type del parámetro de `buildSystemPrompt`.

## 2. Modificaciones en `prompt-builder.ts`

### 2.1 Inyectar hora actual en el contexto

En `buildSystemPrompt`, dentro del bloque `if (customerContext)`, después de las preferencias o al inicio:

```typescript
if (customerContext.currentTime) {
  context += `\n🕐 HORA ACTUAL: ${customerContext.currentTime}`;
}
```

### 2.2 Nueva sección `[CONTEXTO HORARIO]` en DEFAULT_SYSTEM_PROMPT

Agregar después de `[ESTILO]`:

```
[CONTEXTO HORARIO]
- 🕐 HORA ACTUAL se inyecta al inicio de cada conversación con el formato "lunes, 14:30"
- Usá getBusinessHours para obtener los horarios del negocio

SI EL LOCAL ESTÁ CERRADO (hora actual fuera de horario O día cerrado):
- "Ahora estamos cerrados, volvemos a las [hora de apertura]. ¿Querés dejar algo pedido para más tarde?"
- Si hoy es domingo (cerrado): "Hoy cerramos, pero mañana desde las [hora] estamos. ¿Querés dejar algo pedido?"
- NO arranques flujo de venta. NO preguntes qué quiere. NO preguntes delivery.

SI EL LOCAL ESTÁ ABIERTO:
- Comportamiento normal. Seguí el flujo de venta estándar.
```

## 3. Escenarios de prueba

### Escenario 1: Madrugada — local cerrado
**Setup**: Hora actual 02:30 AM, horario Lun-Sáb 9:00-23:00
**Input**: "hola?"
**Esperado**: "Ahora estamos cerrados, volvemos a las 9. ¿Querés dejar algo pedido para mañana?" — NO arranca venta ✅

### Escenario 2: Horario hábil — local abierto
**Setup**: Hora actual 20:00, horario Lun-Sáb 9:00-23:00
**Input**: "hola"
**Esperado**: "Holaa, si decime" — comportamiento normal ✅

### Escenario 3: Domingo todo el día
**Setup**: Hora actual 15:00, domingo (cerrado)
**Input**: "están?"
**Esperado**: "Hoy cerramos, pero mañana desde las 9 estamos. ¿Querés dejar algo pedido?" ✅

### Escenario 4: Cierre nocturno
**Setup**: Hora actual 23:30, horario Lun-Sáb 9:00-23:00
**Input**: "Holaa, quería una bookbinder"
**Esperado**: "Ahora estamos cerrados, volvemos mañana a las 9. ¿Querés dejar algo pedido?" ✅

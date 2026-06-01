# SDD Specs: Sin Stock de Hamburguesas — Toggle + Comportamiento Inteligente

## 1. Schema

### 1.1 Nuevo campo en `agent_config`

```sql
hamburguesasSinStock: boolean("hamburguesas_sin_stock").notNull().default(false)
```

Ubicación: después de `isCooking` (línea 123), antes de `stockPanDocenas` (línea 124).

### 1.2 Comportamiento con `isCooking`

| isCooking | hamburguesasSinStock | Resultado |
|-----------|---------------------|-----------|
| false | false | TODO cerrado. ("Hoy no :/") |
| false | true | TODO cerrado. ("Hoy no :/") |
| true | false | Normal. Todo disponible. |
| true | true | Solo pan mayorista (B2B). Hamburguesas bloqueadas. |

## 2. Prompt Builder — `getOperationalData()`

### 2.1 Nueva sección inyectada

Cuando `hamburguesasSinStock === true`, agregar:
```
⚠️ HAMBURGUESAS SIN STOCK: No tenemos insumos para hamburguesas.
NO vendas hamburguesas, NO tomes pedidos B2C.
Si el cliente pregunta por hamburguesas -> "Estamos sin stock, disculpa!"
Si el cliente pregunta por el menú o qué tienen -> mandá el menú de PAN (sendMenuImage('pan'))
NO ofrezcas hamburguesas bajo ningún concepto.
El pan mayorista (B2B) SÍ está disponible, vendé normal.
```

Cuando `hamburguesasSinStock === false`, no inyectar nada adicional (comportamiento actual).

### 2.2 Modificaciones al system prompt

#### `[SIN STOCK]` — reemplazar sección
```
[SIN STOCK — HAMBURGUESAS]
- Si hamburguesasSinStock=true y el cliente pide hamburguesas -> "Estamos sin stock, disculpa!"
- Si el cliente insiste -> "No tenemos, disculpá. Estamos vendiendo solo pan mayorista hoy"
- Si el cliente pregunta por un producto específico que no está disponible -> "Nop" + "¿querés la hamburguesa igual?"
```

#### `[NO TENEMOS ESO]` — agregar condición
```
- Si hamburguesasSinStock=true y el cliente pide algo que no tenemos -> "Nop, no tenemos. Hoy solo estamos vendiendo pan mayorista" + sendMenuImage('pan')
- Si hamburguesasSinStock=false -> comportamiento actual: "Nop, no tenemos, pero tenemos hamburguesas" + sendMenuImage
```

#### `[INSISTENCIA]` — agregar condición
```
- Si hamburguesasSinStock=true y el cliente insiste -> "No tenemos, disculpá. Solo tenemos pan mayorista disponible hoy"
- Si hamburguesasSinStock=false -> comportamiento actual
```

#### `[RECOMENDACION]` — agregar condición
```
- Si hamburguesasSinStock=true -> NO ejecutes suggestProducts (puede sugerir hamburguesas)
- En cambio, ofrecé el menú de pan: "Hoy solo tenemos pan mayorista, ¿querés ver el menú?"
```

#### `[MENU COMO IMAGEN]` — agregar condición
```
- Si hamburguesasSinStock=true y el cliente pide menú -> sendMenuImage('pan')
- NO mandes el menú de hamburguesas
```

#### `[HERRAMIENTAS]` — agregar al listado
```
checkHamburguesasStock -> para verificar si hay stock de hamburguesas
```

## 3. Tools

### 3.1 `checkHamburguesasStockTool` (nuevo)

```typescript
// kitchen-tools.ts
// ─── checkHamburguesasStock ──────────────────────────────────────────
export const checkHamburguesasStockTool = tool({
  description:
    "Verifica si hay stock de hamburguesas disponible para la venta. Si hamburguesasSinStock=true, NO se pueden vender hamburguesas.",
  inputSchema: z.object({}),
  execute: async () => {
    try {
      const rows = await db
        .select({ sinStock: agentConfig.hamburguesasSinStock })
        .from(agentConfig)
        .where(eq(agentConfig.id, 1))
        .limit(1);
      return { hamburguesasSinStock: rows[0]?.sinStock ?? false };
    } catch {
      return { hamburguesasSinStock: false };
    }
  },
});
```

### 3.2 `createOrderTool` — Guard crítico

Agregar al inicio de `execute`, después de normalizar teléfono:

```
// ─── Verificar si hay stock de hamburguesas ──────────────────────
if (orderType === "hamburguesas") {
  const [cfg] = await db
    .select({ sinStock: agentConfig.hamburguesasSinStock })
    .from(agentConfig)
    .where(eq(agentConfig.id, 1))
    .limit(1);
  if (cfg?.sinStock) {
    return "Hoy no estamos vendiendo hamburguesas. Solo tenemos pan mayorista disponible. Disculpá las molestias.";
  }
}
```

### 3.3 `createAddOrderItemTool` — Guard de carrito

Agregar al inicio de `execute`:

```
// ─── Verificar si hay stock de hamburguesas ──────────────────────
const [cfg] = await db
  .select({ sinStock: agentConfig.hamburguesasSinStock })
  .from(agentConfig)
  .where(eq(agentConfig.id, 1))
  .limit(1);
if (cfg?.sinStock && productName.toLowerCase().includes("hamburguesa")) {
  return "No estamos vendiendo hamburguesas hoy. Solo tenemos pan mayorista. Disculpá.";
}
```

> Nota: `productName` puede no contener "hamburguesa" literalmente (ej: "Bookbinder"). La validación fuerte está en `createOrderTool`. El guard de `addOrderItem` es defensivo adicional.

### 3.4 `suggestProductsTool` — Filtrar sugerencias

Modificar `execute` para que si `hamburguesasSinStock=true`, devuelva:
```
"Hoy solo estamos vendiendo pan mayorista. ¿Querés ver el menú de pan?"
```

Sin consultar historial.

### 3.5 `createSendMenuImageTool` — No enviar menú de hamburguesas

Modificar `execute` para que antes de enviar, verifique:
```
if (tipo === "hamburguesas") {
  const rows = await db.select({ sinStock: agentConfig.hamburguesasSinStock }).from(agentConfig).limit(1);
  if (rows[0]?.sinStock) {
    // Redirigir a menú de pan SILENCIOSAMENTE (sin avisar al LLM)
    tipo = "pan";
  }
}
```

### 3.6 `getMenuTool` y `listAvailableProductsTool` — Ocultar hamburguesas

Modificar `getMenuTool.execute` para que si `hamburguesasSinStock=true` y se pide categoría `"hamburguesa"`:
```
const [cfg] = await db.select({ sinStock: agentConfig.hamburguesasSinStock }).from(agentConfig).limit(1);
if (category === "hamburguesa" && cfg?.sinStock) {
  return "Hoy no tenemos hamburguesas disponibles.";
}
```

Similar para `listAvailableProductsTool` si se filtra por línea `"pollo"` o `"carne"`.

## 4. Admin UI

### 4.1 Nuevo Switch en sección "Estado del Local"

Ubicación: después del switch de "Cocina operativa", antes de "Stock pan al por mayor".

```
┌─────────────────────────────────────────────────┐
│ 🍔 Hamburguesas sin stock                       │
│                                                 │
│ [Switch] [Sin stock / Con stock]                │
│                                                 │
│ Si está activado, el agente NO vende            │
│ hamburguesas (B2C) pero sigue vendiendo         │
│ pan mayorista (B2B)                             │
└─────────────────────────────────────────────────┘
```

### 4.2 Estados visuales
- OFF (default): label verde "Con stock"
- ON: label rojo "Sin stock"
- Al activar: tooltip o texto explicativo

## 5. Telegram

### 5.1 `updateAgentConfigTool`

Agregar campo opcional:
```
hamburguesasSinStock: z.boolean().optional().describe("true = sin stock de hamburguesas, false = hay stock")
```

En execute:
```
if (args.hamburguesasSinStock !== undefined) {
  updates.hamburguesasSinStock = args.hamburguesasSinStock;
  changed.push(`hamburguesas sin stock: ${args.hamburguesasSinStock ? "si" : "no"}`);
}
```

### 5.2 `getBusinessSummaryTool`

Agregar línea al resumen:
```
🍔 Hamburguesas: ${config?.hamburguesasSinStock ? "❌ Sin stock" : "✅ Con stock"}
```

### 5.3 Telegram prompt builder

Después de la línea de `ESTADO COCINA`, agregar:
```
if (config.hamburguesasSinStock === true) {
  infoLines.push("HAMBURGUESAS SIN STOCK: No se están vendiendo hamburguesas. Solo pan mayorista.");
}
```

## 6. Escenarios de prueba

### Escenario 1: Toggle OFF (default)
**Setup**: `hamburguesasSinStock = false`, `isCooking = true`
**Input**: "Holaa, quería dos bookbinder"
**Esperado**: "Dale" + addOrderItem → flujo normal → createOrder → pedido creado ✅

### Escenario 2: Toggle ON — hamburguesas
**Setup**: `hamburguesasSinStock = true`, `isCooking = true`
**Input**: "Holaa, quería dos bookbinder"
**Esperado**: "Estamos sin stock, disculpa!" — NO se crea pedido, NO se agrega al carrito ✅

### Escenario 3: Toggle ON — pan mayorista
**Setup**: `hamburguesasSinStock = true`, `isCooking = true`
**Input**: "Hola, necesito 5 docenas de pan de lomito"
**Esperado**: "Dale" + addOrderItem → flujo normal → createOrder → pedido creado ✅

### Escenario 4: Toggle ON — cliente pide menú
**Setup**: `hamburguesasSinStock = true`, `isCooking = true`
**Input**: "Qué tienen?"
**Esperado**: sendMenuImage('pan') — foto del menú de pan, NO de hamburguesas ✅

### Escenario 5: Toggle ON — cliente pregunta por hamburguesas específicas
**Setup**: `hamburguesasSinStock = true`, `isCooking = true`
**Input**: "A cómo está la genesis?"
**Esperado**: "Estamos sin stock de hamburguesas, disculpa!" ✅

### Escenario 6: Toggle ON + isCooking OFF
**Setup**: `hamburguesasSinStock = true`, `isCooking = false`
**Input**: "Hola, necesito pan"
**Esperado**: "Hoy no :/" — todo cerrado ✅

### Escenario 7: Toggle ON — sugiere productos
**Setup**: `hamburguesasSinStock = true`, `isCooking = true`
**Input**: "Qué me recomendás?"
**Esperado**: "Hoy solo tenemos pan mayorista, ¿querés ver el menú?" — NO sugiere hamburguesas ✅

### Escenario 8: Toggle ON → OFF (vuelta a la normalidad)
**Setup**: Se desactiva el toggle
**Input**: "Holaa, quería dos bookbinder"
**Esperado**: Vuelve a funcionar normal. "Dale" + addOrderItem ✅

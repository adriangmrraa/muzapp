# SDD Design: Sin Stock de Hamburguesas — Toggle + Comportamiento Inteligente

## Arquitectura

### Estrategia de 3 Capas (Defense in Depth)

```
┌──────────────────────────────────────────────────────────────────┐
│                     CAPA 1: PROMPT                             │
│           (prevención por sistema — la más importante)          │
│                                                                 │
│  getOperationalData() inyecta:                                  │
│  "⚠️ HAMBURGUESAS SIN STOCK: ..."                              │
│                                                                 │
│  Modifica secciones del system prompt:                          │
│  [SIN STOCK] [NO TENEMOS ESO] [INSISTENCIA] [RECOMENDACION]    │
│  [MENU COMO IMAGEN] [HERRAMIENTAS]                              │
└──────────────────────────┬───────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                     CAPA 2: TOOLS                              │
│          (prevención por código — defense in depth)             │
│                                                                 │
│  • checkHamburguesasStockTool (nuevo, consulta)                │
│  • createOrderTool (rechaza si orderType=hamburguesas)          │
│  • createAddOrderItemTool (rechaza si producto es burger)       │
│  • suggestProductsTool (no sugiere hamburguesas)                │
│  • createSendMenuImageTool (redirige a menú pan)               │
└──────────────────────────┬───────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                     CAPA 3: MENÚ                               │
│          (prevención por datos — ocultar productos)             │
│                                                                 │
│  • getMenuTool (no devuelve hamburguesas)                       │
│  • listAvailableProductsTool (no lista hamburguesas)           │
│  • getMenuData() en prompt-builder (no inyecta hamburguesas)   │
└──────────────────────────────────────────────────────────────────┘
```

### Diagrama de flujo: mensaje entrante → respuesta

```
📩 Mensaje entrante
    │
    ▼
┌──────────────────────┐
│ 1. detectInjection() │ ← sin cambios (solo jailbreak)
└──────────┬───────────┘
           │
           ▼
┌────────────────────────────────┐
│ 2. buildSystemPrompt()         │
│    ├── getCorePrompt()         │
│    ├── getMenuData()           │ ← Capa 3: oculta hamburguesas si sinStock
│    ├── getBusinessHours()      │
│    └── getOperationalData()    │ ← Capa 1: inyecta "sin stock" si aplica
└──────────┬─────────────────────┘
           │ system prompt + customer context
           ▼
┌────────────────────────────────┐
│ 3. generateText({              │
│      system, messages, tools,  │
│      toolChoice: "auto"        │
│    })                          │
│                                │
│    El LLM decide QUÉ tool      │
│    usar según el prompt        │
└──────────┬─────────────────────┘
           │
     ┌─────┴─────┬──────────┐
     ▼           ▼          ▼
┌─────────┐ ┌─────────┐ ┌──────────┐
│ Si pide  │ │ Si pide │ │ Si pide │
│ hambur-  │ │ menú    │ │ pan     │
│ guesas   │ │         │ │ mayoris │
│          │ │         │ │ ta      │
│ Capa 1:  │ │ Capa 3: │ │         │
│ prompt   │ │ getMenu │ │ Normal  │
│ dice no  │ │ no mues │ │         │
│          │ │ tra bur │ │         │
│ Capa 2:  │ │ gers    │ │         │
│ createO- │ │         │ │         │
│ rderTool │ │ Capa 2: │ │         │
│ rechaza  │ │ sendMen │ │         │
│          │ │ uImage  │ │         │
│          │ │ rediri- │ │         │
│          │ │ ge a pan│ │         │
└──────────┘ └─────────┘ └──────────┘
```

## Decisiones Técnicas

### Decisión 1: Por qué NO modificar `products.available`
En lugar de marcar cada hamburguesa como `available=false` en DB (que rompería tools existentes que filtran por available), usamos una flag independiente en `agent_config`. Esto:
- No toca el catálogo de productos
- Permite toggle rápido desde UI
- No afecta queries existentes
- El prompt builder y tools hacen el filtrado condicional

### Decisión 2: Prompt primero, tools después
El LLM con `toolChoice: "auto"` decide qué tool llamar según el system prompt. Si el prompt le dice explícitamente "no hay hamburguesas", el LLM naturalmente no va a llamar tools relacionadas con hamburguesas. Las validaciones en tools son safety net.

### Decisión 3: `createOrderTool` es el guard crítico
Aunque el LLM intente crear un pedido de hamburguesas (por error o inconsistencia), el guard en `createOrderTool` lo rechaza. Este es el punto final de validación.

### Decisión 4: `sendMenuImage` redirige silenciosamente
Si el LLM intenta mandar `sendMenuImage('hamburguesas')` estando sin stock, la tool internamente redirige a menú de pan. El LLM no necesita saber del redireccionamiento — recibe el resultado como "menú enviado".

## Archivos y Cambios Específicos

### 1. `src/db/schema.ts` (línea ~124)
```typescript
// Antes de stockPanDocenas
hamburguesasSinStock: boolean("hamburguesas_sin_stock").notNull().default(false),
```

### 2. `src/lib/whatsapp/prompt-builder.ts`

#### `getOperationalData()` — después de bloque isCooking (línea ~174):
```typescript
// Hamburguesas sin stock (independiente de isCooking)
if (config.hamburguesasSinStock === true) {
  sections.push(`⚠️ HAMBURGUESAS SIN STOCK: No tenemos insumos para hamburguesas.
NO vendas hamburguesas, NO tomes pedidos B2C.
Si el cliente pregunta por hamburguesas -> "Estamos sin stock, disculpa!"
Si el cliente pregunta por el menú o qué tienen -> mandá el menú de PAN (sendMenuImage('pan'))
NO ofrezcas hamburguesas bajo ningún concepto.
El pan mayorista (B2B) SÍ está disponible, vendé normal.`);
}
```

#### System prompt — modificar secciones:
Ver specs.md sección 2.2 para los cambios textuales exactos en cada sección.

### 3. `src/lib/whatsapp/tools/kitchen-tools.ts`
Agregar `checkHamburguesasStockTool` siguiendo el patrón exacto de `checkKitchenStatusTool`.

### 4. `src/lib/whatsapp/tools/index.ts`
Agregar export:
```typescript
export { checkKitchenStatusTool, checkPanStockTool, checkHamburguesasStockTool, getPaymentAliasTool } from "./kitchen-tools";
```

### 5. `src/lib/whatsapp/agent.ts`
Agregar import (línea ~37) y registro en tools object (línea ~200).

### 6. `src/lib/whatsapp/tools/create-order.ts`
Agregar guard después de `normalizePhone` (línea ~77):
Ver specs.md sección 3.2.

### 7. `src/lib/whatsapp/tools/order-context-tools.ts`
Agregar guard en `createAddOrderItemTool.execute` (línea ~16):
Ver specs.md sección 3.3.

### 8. `src/lib/whatsapp/tools/client-tools.ts`
Modificar `suggestProductsTool.execute` (línea ~40):
Ver specs.md sección 3.4.

### 9. `src/lib/whatsapp/tools/sticker-tools.ts`
Modificar `createSendMenuImageTool.execute` (línea ~82):
Ver specs.md sección 3.5.

### 10. `src/lib/whatsapp/tools/get-menu.ts`
Modificar `getMenuTool.execute` (línea ~13):
Ver specs.md sección 3.6.

### 11. `src/app/(admin)/admin/agent/`
Tres archivos: `page.tsx`, `actions.ts`, `agent-config-form.tsx`
Ver specs.md sección 4 para detalles de UI.

### 12. `src/lib/telegram/prompt-builder.ts`
Agregar línea después de `ESTADO COCINA` (línea ~24):
Ver specs.md sección 5.3.

### 13. `src/lib/telegram/toolsManagement.ts`
Modificar `updateAgentConfigTool` (línea ~482) y `getBusinessSummaryTool` (línea ~617):
Ver specs.md sección 5.1 y 5.2.

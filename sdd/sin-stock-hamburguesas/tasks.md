# SDD Tasks: Sin Stock de Hamburguesas — Toggle + Comportamiento Inteligente

## Task 1: Schema — Agregar columna a `agent_config`
**Archivo**: `src/db/schema.ts`
**Changes**:
- Agregar `hamburguesasSinStock: boolean("hamburguesas_sin_stock").notNull().default(false)` después de `isCooking`

## Task 2: Admin Page — Default + DB mapping
**Archivo**: `src/app/(admin)/admin/agent/page.tsx`
**Changes**:
- Agregar `hamburguesasSinStock: false` en `DEFAULT_CONFIG`
- Agregar `hamburguesasSinStock: (row.hamburguesasSinStock as boolean) ?? false` en el mapping

## Task 3: Admin Actions — Zod schema + formData + DB values
**Archivo**: `src/app/(admin)/admin/agent/actions.ts`
**Changes**:
- Agregar `hamburguesasSinStock: z.boolean()` al Zod schema
- Agregar `hamburguesasSinStock: formData.get("hamburguesasSinStock") === "true"` en el parse
- Agregar `hamburguesasSinStock: parsed.data.hamburguesasSinStock` en el values object

## Task 4: Admin UI — Switch en sección Estado del Local
**Archivo**: `src/app/(admin)/admin/agent/agent-config-form.tsx`
**Changes**:
- Agregar `hamburguesasSinStock: boolean;` al type `AgentConfigFormData`
- Agregar `const [hamburguesasSinStock, setHamburguesasSinStock] = useState(config.hamburguesasSinStock ?? false);`
- Agregar Switch JSX después del bloque de `isCooking` (después de línea 754)

## Task 5: Prompt Builder — Inyectar estado en `getOperationalData()`
**Archivo**: `src/lib/whatsapp/prompt-builder.ts`
**Changes**:
- En `getOperationalData()`, después del bloque `isCooking`, agregar bloque para `hamburguesasSinStock`
- Modificar secciones del system prompt:
  - `[SIN STOCK]` (línea 349)
  - `[NO TENEMOS ESO]` (línea 369)
  - `[INSISTENCIA]` (línea 413)
  - `[RECOMENDACION]` (línea 381)
  - `[MENU COMO IMAGEN]` (línea 493)
  - `[HERRAMIENTAS]` (línea 459, agregar `checkHamburguesasStock`)

## Task 6: Tool — `checkHamburguesasStockTool`
**Archivo**: `src/lib/whatsapp/tools/kitchen-tools.ts`
**Changes**:
- Agregar nueva tool `checkHamburguesasStockTool` siguiendo el patrón de `checkKitchenStatusTool`

## Task 7: Tool Export — Index
**Archivo**: `src/lib/whatsapp/tools/index.ts`
**Changes**:
- Exportar `checkHamburguesasStockTool` desde `kitchen-tools`

## Task 8: Agent — Registrar nuevo tool
**Archivo**: `src/lib/whatsapp/agent.ts`
**Changes**:
- Importar `checkHamburguesasStockTool`
- Registrar en el objeto `tools` como `checkHamburguesasStock`

## Task 9: Tool — Guard en `createOrderTool`
**Archivo**: `src/lib/whatsapp/tools/create-order.ts`
**Changes**:
- Agregar guard al inicio de `execute` que verifique `agentConfig.hamburguesasSinStock` si `orderType === "hamburguesas"`

## Task 10: Tool — Guard en `createAddOrderItemTool`
**Archivo**: `src/lib/whatsapp/tools/order-context-tools.ts`
**Changes**:
- Agregar consulta a `agentConfig.hamburguesasSinStock` y si es true y el producto es hamburguesa, rechazar

## Task 11: Tool — Filtrar `suggestProductsTool`
**Archivo**: `src/lib/whatsapp/tools/client-tools.ts`
**Changes**:
- Modificar `suggestProductsTool.execute` para que si `hamburguesasSinStock=true`, devuelva mensaje ofreciendo solo pan

## Task 12: Tool — `createSendMenuImageTool` redirigir a pan
**Archivo**: `src/lib/whatsapp/tools/sticker-tools.ts`
**Changes**:
- Modificar `createSendMenuImageTool.execute` para que verifique `hamburguesasSinStock` y redirija a `tipo="pan"` si aplica

## Task 13: Tool — `getMenuTool` ocultar hamburguesas
**Archivo**: `src/lib/whatsapp/tools/get-menu.ts`
**Changes**:
- Modificar `execute` para que si `category === "hamburguesa"` y `hamburguesasSinStock=true`, devuelva mensaje de no disponible

## Task 14: Telegram — Prompt builder
**Archivo**: `src/lib/telegram/prompt-builder.ts`
**Changes**:
- Agregar línea de estado de hamburguesas sin stock después de `ESTADO COCINA`

## Task 15: Telegram — `updateAgentConfigTool`
**Archivo**: `src/lib/telegram/toolsManagement.ts`
**Changes**:
- Agregar `hamburguesasSinStock` a inputSchema y execute handler

## Task 16: Telegram — `getBusinessSummaryTool`
**Archivo**: `src/lib/telegram/toolsManagement.ts`
**Changes**:
- Agregar línea `🍔 Hamburguesas: ${config?.hamburguesasSinStock ? "❌ Sin stock" : "✅ Con stock"}`

## Task 17: Telegram — system prompt docs
**Archivo**: `src/lib/telegram/system-prompt.ts`
**Changes**:
- Agregar `hamburguesasSinStock` al listado de campos de `agent_config`

## Orden de implementación sugerido

```
1. Schema (Task 1)
2. Admin Page (Task 2)
3. Admin Actions (Task 3)
4. Admin UI (Task 4)
5. Prompt Builder (Task 5)
6. Kitchen Tools (Task 6)
7. Tool Index (Task 7)
8. Agent (Task 8)
9. Create Order guard (Task 9)
10. Add Order Item guard (Task 10)
11. Suggest Products (Task 11)
12. Send Menu Image (Task 12)
13. Get Menu (Task 13)
14. Telegram prompt builder (Task 14)
15. Telegram updateAgentConfig (Task 15)
16. Telegram business summary (Task 16)
17. Telegram system prompt docs (Task 17)
```

# SDD Tasks: Stock por Producto — Reemplazar stockPanDocenas + hamburguesasSinStock

## Phase 1: DB / Migración

- **Task 1.1**: Agregar `stock: integer("stock")` nullable a `products` en `src/db/schema.ts` (después de `promoPrice`)
- **Task 1.2**: Correr migración con `drizzle-kit generate` + `drizzle-kit migrate`, commitear SQL generado en `drizzle/`

## Phase 2: Tools

- **Task 2.1**: Crear `checkProductStock(name: string)` en `src/lib/whatsapp/tools/kitchen-tools.ts` — busca el producto por nombre (ILIKE), devuelve nombre + stock + si hay stock > 0
- **Task 2.2**: Registrar `checkProductStockTool` en `src/lib/whatsapp/tools/index.ts`
- **Task 2.3**: Registrar en `src/lib/whatsapp/agent.ts` import + tools object
- **Task 2.4**: Agregar guard de stock en `createOrderTool` (`src/lib/whatsapp/tools/create-order.ts`) — verificar stock de cada línea de pedido, rechazar si algún producto tiene `stock = 0` (no null)
- **Task 2.5**: Agregar guard similar en `createAddOrderItemTool` (`src/lib/whatsapp/tools/order-context-tools.ts`)

## Phase 3: Prompt

- **Task 3.1**: En `src/lib/whatsapp/prompt-builder.ts`, reemplazar bloque `stockPanDocenas` por inyección de stock real de productos: consultar `products` y devolver lista de productos con stock bajo (stock > 0 y stock < umbral o stock = 0)
- **Task 3.2**: Agregar `checkProductStock` al listado de herramientas en sección `[HERRAMIENTAS]`
- **Task 3.3**: Reemplazar `stockPanDocenas` por `checkProductStock` en `src/lib/telegram/prompt-builder.ts`
- **Task 3.4**: Actualizar `src/lib/telegram/system-prompt.ts` — reemplazar `stockPanDocenas` por `checkProductStock` en la documentación de campos

## Phase 4: UI Productos

- **Task 4.1**: Agregar columna `stock` en `src/app/(admin)/admin/productos/table.tsx` con display numérico (verde si > 0, rojo si 0, gris si null)
- **Task 4.2**: Agregar input editable `stock` en `src/app/(admin)/admin/productos/product-form.tsx` — number input, nullable con placeholder "Sin control"

## Phase 5: Cleanup — Eliminar stockPanDocenas + hamburguesasSinStock

- **Task 5.1**: Eliminar `stockPanDocenas` de `src/db/schema.ts` y correr migración
- **Task 5.2**: Eliminar referencias a `stockPanDocenas` en `src/lib/whatsapp/prompt-builder.ts`, `src/lib/whatsapp/seller-prompt.ts`, `src/lib/telegram/prompt-builder.ts`, `src/lib/telegram/system-prompt.ts`, `src/lib/telegram/toolsManagement.ts`
- **Task 5.3**: Eliminar `stockPanDocenas` de admin page (`page.tsx`, `actions.ts`, `agent-config-form.tsx` en `src/app/(admin)/admin/agent/`)
- **Task 5.4**: Eliminar `hamburguesasSinStock` columna de `agentConfig` en `src/db/schema.ts` y correr migración
- **Task 5.5**: Eliminar `checkHamburguesasStockTool` de `kitchen-tools.ts`, `tools/index.ts`, `agent.ts`
- **Task 5.6**: Eliminar guards de `hamburguesasSinStock` en `create-order.ts`, `order-context-tools.ts`, `get-menu.ts`, `sticker-tools.ts`, `client-tools.ts`
- **Task 5.7**: Eliminar bloque `hamburguesasSinStock` de `prompt-builder.ts` (whatsapp + telegram), `seller-prompt.ts`, `system-prompt.ts` (telegram)
- **Task 5.8**: Eliminar `hamburguesasSinStock` de admin page (`page.tsx`, `actions.ts`, `agent-config-form.tsx`)
- **Task 5.9**: Eliminar `hamburguesasSinStock` de `toolsManagement.ts` (telegram)

## Orden de implementación

```
Phase 1 (DB) → Phase 2 (Tools) → Phase 3 (Prompt) → Phase 4 (UI) → Phase 5 (Cleanup)
Tasks dentro de cada fase en orden numérico.
Phase 5 requiere haber migrado y verificado que todo funciona con stock por producto.
```

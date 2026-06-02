# Proposal: Bug Fixes Varios

## Intent
Resolver bugs menores no cubiertos por otros cambios que afectan la calidad del agente.

## Scope
1. **Productos sin stock**: `getProductDetailsTool` debe verificar `available` y `stock > 0` antes de mostrar datos
2. **Menú hamburguesas con sinStock**: `sendMenuImageTool` debe rechazar 'hamburguesas' si hamburguesasSinStock=true
3. **Sinónimos**: searchProductsTool con matching por substring + mostrar alternativas cuando no hay match exacto
4. **Prompt cleanup**: reforzar que la hora actual debe usarse siempre

## Approach
- product-tools.ts: agregar guard de stock/available en getProductDetailsTool y getProductPriceTool
- sticker-tools.ts: en createSendMenuImageTool, verificar hamburguesasSinStock si es 'hamburguesas'
- client-tools.ts: searchProductsTool con LIKE matching
- prompt-builder.ts: reforzar [HORA DEL DIA] y [SIN STOCK]

## Non-goals
- No arreglar buffer duplicados por ahora (necesita investigación más profunda)

## Affected Areas
- product-tools.ts, sticker-tools.ts, client-tools.ts, prompt-builder.ts

## Risks
- Muy bajo — solo agrega guards en herramientas existentes

## Rollback
- Revertir commits individuales

## Success Criteria
- Producto con `available=false` no se muestra como disponible
- sendMenuImage('hamburguesas') bloqueado si hamburguesasSinStock
- "pancitos chips" encuentra productos con nombre similar

# Tasks: Bug Fixes Varios

## T-10.1: Harden getProductDetailsTool con available + stock check
- [ ] Leer product-tools.ts
- [ ] Agregar verificación: if (!product.available || product.stock === 0) → "No disponible"
- [ ] Si stock es null → disponible (ilimitado)
- [ ] Si stock > 0 → disponible

## T-10.2: Harden getProductPriceTool
- [ ] Misma lógica que T-10.1

## T-10.3: Bloquear sendMenuImage('hamburguesas') si hamburguesasSinStock
- [ ] Leer sticker-tools.ts
- [ ] En createSendMenuImageTool, verificar agentConfig.hamburguesasSinStock
- [ ] Si true y tipo 'hamburguesas' → retornar "Hoy solo tenemos pan mayorista, ¿querés ver el menú de pan?"

## T-10.4: searchProductsTool mejorado con matching parcial
- [ ] Misma lógica que T-09.2 (pueden ser el mismo cambio)

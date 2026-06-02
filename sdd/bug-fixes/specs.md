# Specs: Bug Fixes Varios

## Requerimientos

### R1: getProductDetailsTool verifica disponibilidad
- Antes de retornar datos, verificar `products.available === true` y `products.stock !== 0`
- Si no disponible, retornar "Ese producto no está disponible actualmente"

### R2: getProductPriceTool verifica disponibilidad
- Ídem, verificar available + stock > 0

### R3: sendMenuImage bloqueado para hamburguesas sin stock
- Si `hamburguesasSinStock === true` y tipo es 'hamburguesas', retornar error explícito

### R4: searchProductsTool con matching parcial
- Buscar por coincidencia de substring en el nombre
- Retornar hasta 5 resultados ordenados por relevancia

## Escenarios

### E1: Producto no disponible
- Input: getProductDetails("Bookbinder") con available=false
- Output: "Ese producto no está disponible actualmente"

### E2: Menú hamburguesas bloqueado
- Input: sendMenuImage('hamburguesas') con hamburguesasSinStock=true
- Output: "Hoy solo tenemos pan mayorista, ¿querés ver el menú de pan?"

### E3: Búsqueda parcial
- Input: searchProducts("pancitos")
- Output: ["Pan de Lomito x 4 u", "Pan de Lomito x12 Parmesano", etc.]

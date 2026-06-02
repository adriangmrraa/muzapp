# Specs: Productos por Unidad

## Requerimientos

### R1: Sección [UNIDADES] en prompt V6
- Explicar que productos con "x 4 u", "x 12 u", "x Docena" en el nombre son UN SOLO PRODUCTO que contiene múltiples unidades
- Ej: "Pan de Lomito x 4 u" = 1 producto, addOrderItem("Pan de Lomito x 4 u", qty=1)
- Si el cliente pide "1 pan de lomito" → NO inventar "Pan de Lomito" sin x4, usar el producto real

### R2: searchProductsTool mejorado
- Agregar parámetro `query` para búsqueda por substring
- Retornar lista de productos que coincidan parcialmente con el nombre
- Si no hay match exacto, mostrar alternativas con nombres similares

## Escenarios

### E1: Cliente pide 1 pan de lomito
- Input: "1 pan de lomito"
- Output: addOrderItem("Pan de Lomito x 4 u", qty=1)

### E2: Cliente pide 20 docenas de prepizza
- Input: "20 docenas de prepizza"
- Output: addOrderItem("Prepizza x Docena", qty=20)

### E3: Búsqueda por nombre parcial
- Input: searchProductsTool("pancitos chips")
- Output: lista de productos cuyo nombre contenga "pancito", "chip" o similar

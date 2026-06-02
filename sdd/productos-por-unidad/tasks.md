# Tasks: Productos por Unidad

## T-09.1: Agregar sección [UNIDADES] en prompt V6
- [ ] Explicar que "x 4 u", "x 12 u", "x Docena" es UN producto que contiene múltiples unidades
- [ ] Ejemplo: cliente pide "1 pan de lomito" → addOrderItem("Pan de Lomito x 4 u", qty=1)
- [ ] NO multiplicar la cantidad — el producto ya incluye las unidades

## T-09.2: Mejorar searchProductsTool con matching parcial
- [ ] Agregar parámetro `query` opcional
- [ ] Si hay query, buscar productos cuyo nombre contenga el query (case insensitive)
- [ ] Retornar hasta 5 resultados con nombre y precio
- [ ] Si no hay match, retornar "No encontré 'X'. ¿Querés ver el menú completo?"

# Explore: Productos por Unidad

## Problema

Algunos productos de panadería se venden en paquetes múltiples:
- "Pan de Lomito x 4 u" = 1 unidad = 4 panes individuales
- "Pan de Lomito x 12 u (Sésamo)" = 1 unidad = 12 panes
- "Prepizza x Docena" = 1 unidad = 12 prepizzas

Cuando un cliente pide "1 pan de lomito", el sistema debe interpretar:
- **Correcto**: 1 unidad de "Pan de Lomito x 4 u" (que contiene 4 panes)
- **Incorrecto**: 1 pan individual (no existe como producto)

El LLM a veces se confunde y multiplica cantidades o usa el producto equivocado.

## Evidencia

No hay un bug concreto reportado por el owner para esto, pero el CHAT 2 muestra que la confusión existe:
- Cliente pide "pancitos chips"
- Bot responde con opciones de "Pan de Lomito x12"
- No hace matching semántico del nombre del producto

## Estado Actual

Ya existe en el prompt V6:
- `[DOCENAS - IMPORTANTE]` — instrucciones para manejar docenas
- `resolveItems()` en order-utils que mapea productos contra DB

Lo que NO existe:
- Lógica clara de "x4 u = 1 unidad" en el prompt
- Manejo de sinónimos/búsqueda difusa de nombres de productos
- Prevención de multiplicación incorrecta

## Solución propuesta

1. Agregar sección en prompt para productos envasados en múltiples unidades
2. Mejorar la búsqueda de productos por coincidencia parcial de nombre
3. Agregar tool auxiliar que el LLM pueda consultar para resolver ambigüedades

## Archivos afectados

- `src/lib/whatsapp/prompt-builder.ts` — sección [UNIDADES] en prompt V6
- `src/lib/whatsapp/tools/client-tools.ts` — searchProductsTool mejorado
- `src/lib/order-utils.ts` — resolveItems con mejor matching

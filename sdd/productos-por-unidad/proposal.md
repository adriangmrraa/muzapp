# Proposal: Productos por Unidad

## Intent
Que el LLM entienda correctamente las cantidades cuando los productos se venden en paquetes (x4 u, x12, x docena) y no multiplique ni confunda cantidades.

## Scope
1. Agregar sección [UNIDADES] al prompt V6 explicando cómo funcionan los paquetes múltiples
2. Mejorar `searchProductsTool` para que haga matching por sinónimos/coincidencia parcial
3. Agregar tabla de sinónimos de productos (opcional, solo si es necesario)

## Approach
- La sección [UNIDADES] explica: "Pan de Lomito x 4 u" = 1 unidad que contiene 4 panes. Si el cliente pide "1 pan de lomito" → addOrderItem("Pan de Lomito x 4 u", qty=1).
- searchProductsTool: agregar búsqueda por coincidencia parcial (LIKE) y mostrar alternativas
- No crear tabla de sinónimos por ahora — el matching parcial + prompt basta

## Non-goals
- No cambiar el modelo de datos de productos
- No crear tabla de sinónimos separada

## Affected Areas
- prompt-builder.ts: sección [UNIDADES]
- client-tools.ts: searchProductsTool mejorado

## Risks
- Bajo: solo agrega contexto al prompt y mejora una tool

## Rollback
- Revertir cambios en prompt y tool

## Success Criteria
- Cliente pide "1 pan de lomito" → addOrderItem("Pan de Lomito x 4 u", 1)
- Cliente pide "20 docenas de prepizza" → addOrderItem("Prepizza x Docena", 20)
- Cliente pide "pancitos chips" → searchProductsTool encuentra productos similares

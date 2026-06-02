# Explore: Bug Fixes Varios

## Problemas detectados no cubiertos por otros cambios

### 1. Productos sin stock se muestran como disponibles
- Cuando un producto tiene `available=false` o `stock=0`, el LLM a veces igual lo ofrece
- Falta verificación en `getProductDetailsTool` y `getProductPriceTool`

### 2. Menú de hamburguesas enviado cuando hay hamburguesasSinStock
- El prompt dice que no ofrezca hamburguesas si sinStock, pero a veces el LLM envía `sendMenuImage('hamburguesas')` igual
- Reforzar en prompt + hardenear la tool

### 3. Mensajes duplicados del bot
- A veces el bot envía 2 mensajes iguales o muy similares
- Ej: "Dale, te espero mañana al mediodía en Neuquen 1245" (2 veces en CHAT 5)
- Verificar si es problema de buffer o de generación

### 4. Sinónimos de productos no resueltos
- "pancitos chips" ≠ "Pan de Lomito x4" — el LLM no sabe qué producto es
- Agregar tabla de sinónimos en DB o mejorar el matching

### 5. La hora en el contexto no se usa consistentemente
- El LLM recibe `🕐 HORA ACTUAL: XX:00hs` pero no siempre chequea horarios antes de arrancar
- Reforzar en prompt

## Priorización

| Bug | Severidad | Ya cubierto? |
|-----|-----------|--------------|
| Productos sin stock ofrecidos | Media | Parcial (stock tool agregado) |
| Menú hamburguesas con sinStock | Media | Prompt lo dice, tool no lo bloquea |
| Mensajes duplicados | Media | Buffer issue |
| Sinónimos no resueltos | Alta | No |
| Hora no usada | Baja | CHANGE-08 ayuda |

## Archivos afectados

- `src/lib/whatsapp/prompt-builder.ts` — reforzar secciones
- `src/lib/whatsapp/tools/product-tools.ts` — filtrar por available + stock
- `src/lib/whatsapp/tools/sticker-tools.ts` — sendMenuImage con guard
- `src/lib/buffer/manager.ts` — posible fix de duplicados

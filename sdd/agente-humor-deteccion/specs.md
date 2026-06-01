# SDD Specs: Detección de Humor/Chiste/Exageración — no tomar literal

## 1. Modificaciones al System Prompt

### 1.1 Nueva sección `[HUMOR]`

Agregar en DEFAULT_SYSTEM_PROMPT de `prompt-builder.ts`, después de `[ESTILO]`:

```
[HUMOR — DETECCIÓN DE CHISTES]
- Algunos clientes van a hacer pedidos en joda para ver cómo respondés
- Detectá estas señales de que es un chiste:
  1. Cantidades irrealistas: > 20 items cuando el cliente nunca pidió más de 5 (usá getClientHistory para verificarlo si tenés dudas)
  2. Productos que NO existen en el menú: pancakes, pizza, empanadas, milanesa, sushi, pasta, etc.
  3. Emojis de risa combinados con números grandes: "100 hamburguesas 😂", "jajaja 50"
  4. Preguntas absurdas: "me vendés todo el local?", "quiero una de cada una x 10"

SI DETECTÁS HUMOR:
- Respondé en el mismo tono: "Jajaja dale, [cantidad] te hago pero las pagás vos 😂"
- NO ejecutes addOrderItem. NO ejecutes createOrder. NO ejecutes getProductPrice.
- Después del chiste, preguntá en serio: "¿Hablando en serio, cuántas querés?" o "Hablando en serio, ¿qué te preparamos?"
- Si el producto ni siquiera existe (pancakes, pizza): "Tengo hamburguesas nomás amigo, ¿querés una?"

SI NO ESTÁS SEGURO (cantidad medio grande pero posible):
- NO asumas que es humor. Tratá como pedido real.
- Mejor vender de más que ofender a un cliente que hace un pedido real grande.
```

### 1.2 Agregar referencia a `[FLUJO]`

Al inicio del paso 1 de `[FLUJO]`:
```
1. Antes de addOrderItem, verificá si la cantidad es un chiste (sección [HUMOR])
```

## 2. Escenarios de prueba

### Escenario 1: Cantidad exagerada
**Input**: "Me vendés 100 hamburguesas?"
**Esperado**: "Jajaja dale, 100 te hago pero las pagás vos 😂. ¿Hablando en serio, cuántas querés?" — NO ejecuta addOrderItem ✅

### Escenario 2: Producto que no existe
**Input**: "Quiero una promo de 50 pancakes"
**Esperado**: "Tengo hamburguesas nomás amigo, ¿querés una?" — NO ejecuta addOrderItem ✅

### Escenario 3: Cantidad realista
**Input**: "Quiero 2 bookbinder"
**Esperado**: "Dale" + addOrderItem("Bookbinder", 2) — comportamiento normal ✅

### Escenario 4: Emoji de risa con cantidad
**Input**: "Dame 30 hamburguesas 😂"
**Esperado**: "Jajaja, 30 te hago pero las pagás vos. ¿Hablando en serio, cuántas querés?" ✅

### Escenario 5: Cliente nuevo con cantidad grande pero posible (20 unidades)
**Input**: "Necesito 20 panes de lomito para un evento"
**Esperado**: Como no tiene historial y 20 es posible para pan mayorista → "Dale" + addOrderItem — trata como real ✅

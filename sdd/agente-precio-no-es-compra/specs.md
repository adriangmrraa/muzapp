# SDD Specs: Precio ≠ Intención de Compra — no asumir venta cuando preguntan precio

## 1. Modificaciones al System Prompt

### 1.1 Reemplazar sección de precio en `[SALUDO]`

La línea actual:
```
- Si preguntan precio ("a cómo está?", "cuánto vale?", "qué precio tiene?", "cuánto cuesta?") -> ejecutá getProductPrice y decí el número nomas: "7000"
```

Reemplazar por:

```
[PRECIO — REGLA CRÍTICA]
- Si el cliente pregunta SOLO el precio de un producto ("a cómo está?", "cuánto vale?", "qué precio tiene?", "cuánto cuesta?", "precio de la X?") -> ejecutá getProductPrice y respondé SOLO el número: "7000"
- IMPORTANTE: después de dar el precio, NO digas nada más. NO preguntes "¿delivery o buscás?". NO preguntes "¿querés una?". NO preguntes dirección. NO arranques el flujo de venta.
- Esperá a que el cliente responda. Si después dice "dale poneme una", recién ahí arrancá el flujo.
- Si el cliente pregunta precio junto con otra cosa ("a cómo está la bookbinder y quería una"), ahí sí es intención de compra -> flujo normal.
```

### 1.2 Agregar a `[NO HACÉS]`

```
- NO preguntes delivery después de dar un precio
- NO preguntes "¿querés?" después de dar un precio
```

### 1.3 Ubicación exacta

La sección `[PRECIO — REGLA CRÍTICA]` va como sección independiente entre `[SALUDO]` y `[FLUJO]`.
La referencia en `[FLUJO]` paso 3 ("Precio: solo si preguntan. El total nomás.") se mantiene igual — es para el precio del total del pedido.

## 2. Escenarios de prueba

### Escenario 1: Solo precio, sin intención
**Input**: "A cómo está la bookbinder?"
**Esperado**: getProductPrice → "7000" — SILENCIO. No pregunta delivery, no pregunta nada ✅

### Escenario 2: Solo precio, otra variación
**Input**: "Cuánto vale la deli?"
**Esperado**: getProductPrice → "8000" — SILENCIO ✅

### Escenario 3: Precio + después sí quiere
**Input 1**: "Precio de la toro?"
**Esperado 1**: getProductPrice → "7500"
**Input 2**: "dale poneme una"
**Esperado 2**: "Dale" + addOrderItem("Toro") → flujo normal ✅

### Escenario 4: Solo precio, otra variación
**Input**: "Cuánto cuesta la genesis?"
**Esperado**: getProductPrice → "8500" — SILENCIO ✅

### Escenario 5: Precio + compra en el mismo mensaje
**Input**: "A cómo está la bookbinder y quería una"
**Esperado**: getProductPrice → da precio + "d dale" + addOrderItem — flujo de venta normal ✅

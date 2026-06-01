# SDD Specs: Productos Genéricos — Preguntar Variante Antes de Agregar

## 1. Modificaciones al System Prompt

### 1.1 Modificar sección `[FLUJO]`

Agregar al final de la sección:

```
- ANTES de ejecutar addOrderItem, verificar que el producto esté bien especificado:
  * Si el cliente pide genéricamente "hamburguesa", "hamburguesas", "burger", "una hamburguesa", "2 hamburguesas" SIN especificar variedad:
    -> NO ejecutes addOrderItem todavía
    -> Preguntá: "¿Cuál querés? Tengo Bookbinder (carne), Crispy Pollo (pollo), Classic Carne (carne), Deli Deli (carne con verduras), Toro (carne)"
  * Si el cliente YA especificó la variedad (ej: "bookbinder", "2 bookbinder", "crispy pollo"):
    -> Ejecutá addOrderItem normal
```

### 1.2 Modificar sección `[PEDIDOS]`

Agregar:

```
- Variantes de hamburguesa disponibles (para referencia al preguntar):
  * Bookbinder: carne, cheddar, cebolla caramelizada, salsa bbq
  * Crispy Pollo: pollo crispy, lechuga, tomate, mayonesa
  * Classic Carne: carne, lechuga, tomate, huevo, panceta
  * Deli Deli: carne, rúcula, parmesano, tomates confitados
  * Toro: carne, cheddar, cebolla, pepinillos, salsa especial
- Si el cliente no especifica cantidad, asumir 1
- Si el cliente no especifica variedad, preguntar ANTES de agregar
```

### 1.3 Agregar a `[NO HACÉS]`

```
- NO asumas que "hamburguesa" significa una variedad en particular
- NO ejecutes addOrderItem con un nombre genérico como "hamburguesa"
```

## 2. Escenarios de prueba

### Escenario 1: Pedido genérico de hamburguesa
**Input**: "Quiero una hamburguesa"
**Esperado**: No se ejecuta `addOrderItem`. Agente responde: "¿Cuál querés? Tengo Bookbinder (carne), Crispy Pollo (pollo), Classic Carne (carne), Deli Deli (carne con verduras), Toro (carne)" ✅

### Escenario 2: Pedido específico de variedad
**Input**: "Dame 2 bookbinder"
**Esperado**: `addOrderItem("Bookbinder", 2)` ejecutado directo. Agente responde "Dale" ✅

### Escenario 3: "Hamburguesas" en plural sin especificar
**Input**: "Quiero hamburguesas"
**Esperado**: No se ejecuta `addOrderItem`. Agente pregunta variante ✅

### Escenario 4: Variedad con cantidad implícita
**Input**: "Una bookbinder"
**Esperado**: `addOrderItem("Bookbinder", 1)` ejecutado directo ✅

### Escenario 5: Variedad con nombre parcialmente escrito
**Input**: "Dame una crispy"
**Esperado**: `addOrderItem("Crispy Pollo", 1)` — el agente interpreta "crispy" como "Crispy Pollo" porque es única coincidencia ✅

### Escenario 6: Pedido de otro producto (no hamburguesa)
**Input**: "Quiero una coca"
**Esperado**: Flujo normal — no aplica la regla de hamburguesas genéricas. `addOrderItem("Coca", 1)` ✅

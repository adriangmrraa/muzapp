# SDD Specs: Preferencias del Cliente en el Saludo — personalizar primer mensaje

## 1. Modificaciones al System Prompt

### 1.1 Modificar sección `[SALUDO]`

La sección actual:
```
[SALUDO]
- PRIMER mensaje del cliente -> saludá: "Holaa", "Hola buenas"
- Segundo/tercer mensaje -> ya no saludar, respondé directo
```

Reemplazar por:

```
[SALUDO]
- PRIMER mensaje del cliente:
  * Si el cliente tiene ⭐ PREFERENCIAS (productos que suele pedir): "Holaa de nuevo! ¿Lo de siempre? ([preferencia 1] y [preferencia 2])"
  * Si el cliente NO tiene preferencias (es nuevo o sin historial): "Holaa, si decime"
  * Si el cliente no está identificado: "Holaa"
- Segundo/tercer mensaje -> ya no saludar, respondé directo
- EXCEPCIÓN: si el primer mensaje del cliente YA contiene un producto específico (ej: "quiero una toro"), NO uses el saludo personalizado. Procesá el pedido directamente.
```

### 1.2 Referencia cruzada con `[PREFERENCIAS]`

El bloque de contexto ya inyecta:
```
⭐ PREFERENCIAS DEL CLIENTE (productos que suele pedir): Bookbinder, Crispy Pollo
💡 Si el cliente no sabe qué pedir, podés sugerirle estos productos.
```

Mantener esa línea. La sección `[SALUDO]` ahora la usa para personalizar el saludo, y la línea existente `💡` queda como respaldo para cuando el cliente no sabe qué pedir.

### 1.3 Agregar a `[NO HACÉS]`

```
- NO uses el saludo personalizado si el cliente ya pidió algo específico en su primer mensaje
```

## 2. Escenarios de prueba

### Escenario 1: Cliente conocido con preferencias — saludo genérico
**Setup**: `preferences = ["Bookbinder", "Crispy Pollo"]`
**Input**: "hola"
**Esperado**: "Holaa de nuevo! ¿Lo de siempre? (Bookbinder y Crispy Pollo)" ✅

### Escenario 2: Cliente nuevo sin historial
**Setup**: `preferences = undefined`, sin pedidos anteriores
**Input**: "hola"
**Esperado**: "Holaa, si decime" — saludo normal ✅

### Escenario 3: Cliente conocido pero pide específico
**Setup**: `preferences = ["Bookbinder", "Crispy Pollo"]`
**Input**: "quiero una toro"
**Esperado**: Ignora preferencias → "Dale" + addOrderItem("Toro") — procesa toro directo ✅

### Escenario 4: Cliente conocido con preferencias — segundo mensaje
**Setup**: `preferences = ["Bookbinder"]`, ya hubo un primer mensaje
**Input**: cualquier cosa
**Esperado**: Ya no saluda, responde directo — comportamiento normal de segundo/tercer mensaje ✅

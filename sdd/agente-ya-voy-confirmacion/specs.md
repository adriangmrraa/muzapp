# SDD Specs: "Ya voy" como Confirmación de Retiro

## 1. Modificaciones al System Prompt

### 1.1 Agregar sección `[CONFIRMACION RETIRO]`

Insertar como nueva sección en `DEFAULT_SYSTEM_PROMPT` (orden sugerido: después de `[FLUJO]`):

```
[CONFIRMACION RETIRO]
- Frases del cliente que indican que YA ESTÁ YENDO al local (NO preguntar más):
  * "ya voy", "ya voy yendo", "ya voy para allá"
  * "ahora paso", "ahora caigo", "ahora paso por el local"
  * "ya salgo", "ya salgo para allá", "ya estoy saliendo"
  * "allá voy", "allá voy yendo"
- Si el cliente dice esto Y TIENE items en orderContextItems:
  -> Ejecutá createOrder(retiroInmediato=true) con horario = ahora + 10 min
  -> Respondé: "Dale, te espero. Pasá por [dirección del local]"
  -> NO preguntes nada más — ni topping, ni horario, ni nada
- Si el cliente dice esto Y NO TIENE items en orderContextItems:
  -> NO ejecutes createOrder
  -> Respondé: "Dale, cuando quieras. Estamos en [dirección del local]"
  -> NO preguntes "¿qué querés?" ni "¿qué te llevás?"
- EXCEPCIÓN: si el cliente ya acordó delivery (tiene dirección de envío cargada en la conversación), NO interpretes "ya voy" como retiro. Seguí el flujo de delivery normal.
```

### 1.2 Agregar a `[NO HACÉS]`

```
- NO le preguntes al cliente si ya está confirmando retiro — si dice "ya voy", asumilo
- NO interpretes "ya voy" como confirmación de retiro si ya hay delivery acordado
```

## 2. Escenarios de prueba

### Escenario 1: Cliente con items cargados, dice "ya voy"
**Setup**: `orderContextItems = [{name:"Bookbinder", qty:2}]`, sin delivery
**Input**: "ya voy para allá"
**Esperado**: `createOrder(retiroInmediato=true)` ejecutado. Agente responde: "Dale, te espero. Pasá por [dirección del local]" ✅

### Escenario 2: Cliente sin items, dice "ahora paso"
**Setup**: `orderContextItems = []`, sin nada en la conversación
**Input**: "ahora paso"
**Esperado**: No se ejecuta `createOrder`. Agente responde: "Dale, cuando quieras. Estamos en [dirección del local]" — sin preguntar qué quiere ✅

### Escenario 3: Cliente con delivery acordado, dice "ya salgo"
**Setup**: Cliente ya cargó dirección de envío y está en flujo de delivery
**Input**: "ya salgo"
**Esperado**: No se activa confirmación de retiro. Sigue el flujo de delivery normal — "Dale, te esperamos" como respuesta natural, no crear orden como retiro ✅

### Escenario 4: Cliente dice "ya voy yendo" con items
**Setup**: `orderContextItems = [{name:"Crispy Pollo", qty:1}]`
**Input**: "ya voy yendo"
**Esperado**: `createOrder(retiroInmediato=true)` ejecutado. Respuesta directa sin preguntas extra ✅

### Escenario 5: Cliente dice "allá voy" sin items
**Setup**: `orderContextItems = []`
**Input**: "allá voy"
**Esperado**: No se ejecuta nada. "Dale, cuando quieras" ✅

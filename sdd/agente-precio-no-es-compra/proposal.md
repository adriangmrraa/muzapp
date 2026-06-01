# SDD Propose: Precio ≠ Intención de Compra — no asumir venta cuando preguntan precio

## Intent

Cuando un cliente pregunta "a cómo está la bookbinder?" el agente responde "7000" y automáticamente arranca el flujo "¿delivery o buscás?". Preguntar precio NO significa querer comprar. Queremos que Karen responda solo el número y se calle, esperando a que el cliente diga algo más antes de continuar.

## Scope

### In Scope

1. Reforzar la sección `[SALUDO]` existente donde ya dice "Si preguntan precio -> ejecutá getProductPrice y decí el número nomas"
2. Agregar instrucción explícita: después del precio, CALLARSE. No preguntar delivery, no preguntar dirección, no preguntar nada
3. Ejemplos concretos en el prompt para cubrir variaciones: "a cómo está?", "cuánto vale?", "qué precio tiene?", "cuánto cuesta?"

### Out of Scope

- Tools de precio ya existen y funcionan bien (`getProductPrice`)
- Nuevas validaciones backend
- UI changes

## Approach

Modificar la sección `[SALUDO]` del DEFAULT_SYSTEM_PROMPT para dejar explícito:

1. Cuando el cliente pregunte precio de un producto:
   - Ejecutar `getProductPrice`
   - Responder SOLO el número: "7000"
   - NO preguntar "¿delivery o buscás?"
   - NO preguntar dirección
   - NO preguntar si quiere comprar
   - Esperar a que el cliente diga algo más
2. Ejemplos de preguntas de precio: "a cómo está?", "cuánto vale?", "qué precio tiene?", "cuánto cuesta?", "precio de la X?"

Solo cambios de prompt. Las tools de precio ya funcionan bien.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/whatsapp/prompt-builder.ts` | Modify | Reforzar sección `[SALUDO]` con instrucción de no continuar flujo después del precio |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| El LLM igual pregunta delivery por inercia | Medium | Instrucción explícita con "NO" + casos de ejemplo en el prompt |
| El cliente dice "a cómo está?" y el agente no da precio por sobregeneralizar | Low | Los ejemplos cubren todas las variaciones comunes de preguntar precio |

## Success Criteria

- [ ] "A cómo está la bookbinder?" → "7000" (silencio, esperar)
- [ ] "Cuánto vale la deli?" → "8000"
- [ ] "Precio de la toro?" → "7500" + cliente dice "dale poneme una" → recién ahí "Dale" + addOrderItem
- [ ] "Cuánto cuesta la genesis?" → "8500"

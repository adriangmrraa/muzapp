# SDD Propose: "Ya voy" como Confirmación de Retiro

## Intent

Cuando un cliente dice "ya voy para allá", "ahora paso", "ya salgo" o cualquier variante, el agente no interpreta esto como una confirmación de retiro. Sigue preguntando cosas, no finaliza el flujo, y el cliente termina yendo al local sin que se haya registrado el pedido. Queremos que esas frases actúen como confirmación de retiro automática: si ya tiene items, se crea la orden; si no, se responde sin más vueltas.

## Scope

### In Scope

1. Agregar sección `[CONFIRMACION RETIRO]` en el system prompt
2. Tratar variantes de "ya voy", "ahora paso", "ya salgo", "ya voy yendo", "allá voy", "ahora caigo" como confirmación de retiro
3. Si el cliente ya tiene `orderContextItems`, ejecutar `createOrder` directo
4. Si el cliente no tiene items, responder "Dale, te espero" sin más preguntas

### Out of Scope

- No necesita tools nuevas
- No modificar `agent.ts`
- No tocar lógica de delivery — si el cliente ya acordó delivery, no confundir

## Approach

Agregar al `DEFAULT_SYSTEM_PROMPT` en `prompt-builder.ts` una nueva sección:

```
[CONFIRMACION RETIRO]
- Frases del cliente que indican que YA ESTÁ YENDO al local (NO preguntar más):
  * "ya voy", "ya voy yendo", "ya voy para allá"
  * "ahora paso", "ahora caigo"
  * "ya salgo", "ya salgo para allá"
  * "allá voy", "allá voy yendo"
- Si el cliente dice esto Y TIENE items en orderContextItems:
  -> createOrder(retiroInmediato=true) con horario actual + 10min
  -> Responder: "Dale, te espero. Pasá por [dirección del local]"
  -> NO preguntar nada más
- Si el cliente dice esto Y NO TIENE items en orderContextItems:
  -> No crear orden
  -> Responder: "Dale, cuando quieras. Estamos en [dirección del local]"
  -> NO preguntar "¿qué querés?" ni "¿qué te llevás?"
- EXCEPCIÓN: si el cliente ya acordó delivery en esta misma conversación (tiene dirección de envío cargada), NO interpretar "ya voy" como retiro
```

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/whatsapp/prompt-builder.ts` | Modify | Agregar sección `[CONFIRMACION RETIRO]` en DEFAULT_SYSTEM_PROMPT |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Cliente dice "ya voy" como expresión suelta sin intención de ir ya | Low | El contexto de la conversación ya indica si está comprando; es raro que alguien en medio de un pedido diga "ya voy" sin querer ir |
| Confundir con delivery — cliente acordó delivery pero dice "ya voy" | Low | La excepción explícita en el prompt lo cubre: si ya hay dirección de envío, no interpretar como retiro |
| Cliente sin items dice "ahora paso" y el agente no ofrece nada | Medium | Es intencional: si no pidió nada, no hay que inventar. El cliente pasa a comprar presencial |

## Success Criteria

- [ ] Cliente con items en carrito dice "ya voy" → `createOrder` + "Dale, te espero"
- [ ] Cliente sin items dice "ahora paso" → "Dale, cuando quieras. Estamos en ..."
- [ ] Cliente con delivery acordado dice "ya salgo" → no confundir con retiro, mantener flujo de delivery

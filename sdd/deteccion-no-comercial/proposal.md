# Proposal: Detección No-Comercial

## Intent
Que el bot detecte CUANDO (primer mensaje o durante la conversación) el cliente NO está interesado en comprar y actúe en consecuencia sin romper la experiencia.

## Scope
1. Clasificar el primer mensaje de cada conversación como comercial, no-comercial o ambiguo
2. Responder según clasificación
3. Si después de 2 intercambios no hay intención comercial → transferir a humano
4. Agregar sección [NO COMERCIAL] al prompt V6

## Approach
- En `anti-loop.ts`, extender `classifyMessageType` con categoría `non_commercial`
- En `agent.ts`, agregar bloque de detección PRE-FLIGHT antes del customer context
- En `prompt-builder.ts`, agregar sección [NO COMERCIAL] con instrucciones explícitas

## Non-goals
- No crear state machine compleja
- No agregar ML classification

## Affected Areas
- agent.ts: bloque de clasificación pre-flight
- prompt-builder.ts: sección [NO COMERCIAL] en V6
- anti-loop.ts: extender classifyMessageType

## Risks
- Falsos positivos: clasificar "Hola" de un cliente nuevo como no-comercial
  - Mitigación: "ambiguo" trata como comercial hasta que se demuestre lo contrario

## Rollback
- Solo modifica prompts y una función de clasificación — fácil revertir

## Success Criteria
- Chat 6: "Que ondaaa cumpa" → responde "Holaa amigo como estas?" NO "No encontré ningún pedido"
- Chat 1: Cliente jodiendo → NO hace flujo de venta, responde acorde
- Cliente nuevo dice "Holaa" → flujo normal (no falso positivo)

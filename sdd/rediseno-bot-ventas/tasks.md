# Tasks: Rediseño Bot de Ventas WhatsApp (Karen V6)

Basado en análisis de 1378 mensajes reales de 57 clientes. Prioridad: bugs CRITICAL que afectan clientes ahora.

## Fase 1: Hotfixes CRITICAL (Problemas que rompen el bot HOY)

- [x] 1.1 Fix echo handler: handleEcho NO setea humanOverride para echos del bot. Busca el mensaje original por platformMessageId. Si era role=assistant → echo propio → no override. (route.ts)
- [x] 1.2 Fix resolveItems(): IGNORA item.price e item.unitPrice del LLM. Siempre usa precio de DB. (order-utils.ts)
- [x] 1.3 Fix backtick false positives: eliminados patrones de backticks. Solo jailbreak explícito. (prompt-security.ts)

## Fase 2: Fix Context Injection (Contaminación del prompt)

- [x] 2.1 Eliminar inyección de contexto como `role: "user"` en route.ts (order context, addresses, client type). El customer context ya se carga en runWhatsAppAgent.
- [x] 2.2 Eliminar archivo legacy `src/lib/whatsapp/conversation.ts`. Confirmado: nadie lo importa.
- [x] 2.3 fix formatAddressesForPrompt: instrucción de comportamiento movida al system prompt. Solo devuelve DATA.

## Fase 3: Prompt V6 (Estilo Dueño Real)

- [x] 3.1 DEFAULT_SYSTEM_PROMPT reescrito a V6. Basado en docs/aprendizaje-chats-dueno.md. Sin PASOS, sin confirmación. Estilo dueño real.
- [x] 3.2 Eliminados detectEmotionalTrigger() y getEmotionalResponse() de agent.ts.
- [x] 3.3 Eliminado dead-end recovery de agent.ts (~70 líneas eliminadas).
- [x] 3.4 Eliminada capa 2 (menu data) de buildSystemPrompt. El menú se envía como imagen.
- [x] 3.5 buildSystemPrompt simplificado: solo instrucciones. Datos vía tools.

## Fase 4: Ajustes de UX

- [x] 4.1 Buffer debounce reducido de 20s a 10s (buffer/config.ts).
- [ ] 4.2 Verificar que sendMenuImage funcione correctamente (queda pendiente - verificación manual).
- [ ] 4.3 Agregar tool description consistente en español (queda pendiente - diferido).

## Fase 5: Verificación

- [x] 5.1 TypeScript compila sin errores (tsc --noEmit ✅).
- [x] 5.2 resolveItems() verificado: ignora precios del LLM (código revisado).
- [x] 5.3 Prompt V6 verificado: no tiene PASOS ni confirmación explícita.
- [x] 5.4 Contexto no se inyecta como role="user" (código revisado).
- [ ] 5.5 Probar en producción con los 14 escenarios del explore original (pendiente - deploy).

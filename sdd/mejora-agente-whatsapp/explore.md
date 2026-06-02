# Explore: Mejora Agente WhatsApp Mrs Muzzarella

## Resumen de Hallazgos

### Problemas Críticos Detectados (30 issues)
- 4 criticos, 4 altos, 9 medios, 13 bajos

### Lo que ClinicForge hace mejor

1. **Sistema de Buffer Multi-Canal**: ClinicForge tiene buffer TTL diferenciado (text 12s, media 20s), lock atomico, dead-end recovery con nudge, y supresion de fallbacks al paciente. MuzApp tiene buffer fijo de 8s sin recovery real.

2. **State Machine de Conversacion**: ClinicForge tiene 6 estados (IDLE, OFFERED_SLOTS, SLOT_LOCKED, BOOKED, PAYMENT_PENDING, PAYMENT_VERIFIED) con TTL diferenciado. MuzApp no tiene estado de conversacion.

3. **Dead-End Recovery**: ClinicForge detecta frases de stall y re-invoca al agente con nudge. MuzApp no tiene esto.

4. **System Prompt Dinamico**: ClinicForge inyecta ~40 parametros de DB (menu, horarios, bancarios, FAQs, coberturas, etc). MuzApp solo inyecta menu via prompt-builder.ts.

5. **Human Override Robusto**: Doble check en DB (chat_conversations + patients). MuzApp tiene check simple.

6. **Mapeo de Sinonimos**: ClinicForge tiene diccionario "coloquial → canonico" para tratamientos. MuzApp tiene resolveItems() solo para productos.

7. **Flujos Emocionales F1-F9**: ClinicForge maneja 9 escenarios emocionales del cliente. MuzApp no tiene esto.

8. **Idempotencia a nivel DB**: ClinicForge usa UNIQUE constraints y ON CONFLICT DO NOTHING. MuzApp tiene idempotencia in-memory.

# Proposal 1: Buffer, State Machine y Recovery

## Problemas a resolver
- Buffer fijo de 8s sin distincion texto/media
- Sin state machine de conversacion
- Sin dead-end recovery
- Human override debil
- Idempotencia debil

## Solucion propuesta
1. Buffer con TTL diferenciado (texto 12s, media 20s) como ClinicForge
2. State machine con estados: IDLE → ORDERING → CONFIRMED → PAID
3. Dead-end recovery con nudge y max 3 retry
4. Human override con doble check
5. Idempotencia SQL con UNIQUE(provider, provider_message_id)

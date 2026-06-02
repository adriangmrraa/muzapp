# Design: Buffer, State Machine y Recovery

## Cambios
1. State machine en webhook (estados IDLE → ORDERING → CONFIRMED)
2. Dead-end recovery en agent.ts (detectar frases de stall + re-invocar)
3. Idempotencia SQL en webhook (UNIQUE provider + provider_message_id)

## Archivos
- `src/app/api/whatsapp/webhook/route.ts` — state machine + idempotencia
- `src/lib/whatsapp/agent.ts` — dead-end recovery

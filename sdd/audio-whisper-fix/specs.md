# Specs: Audio Whisper Pipeline Fix

## R1: BufferManager fallback in-memory

Cuando Redis no está configurado, BufferManager debe usar un Map en memoria como fallback, no fallar silenciosamente.

### Acceptance Criteria
- AC1.1: Sin Redis, enqueue() guarda en Map<string, BufferedMessage[]>
- AC1.2: Sin Redis, fetchAndClear() devuelve los mensajes del Map
- AC1.3: Sin Redis, acquireLock() siempre true
- AC1.4: Sin Redis, isTimerExpired() chequea timestamp en memoria
- AC1.5: Sin Redis, hasNewMessages() chequea el Map
- AC1.6: Mensajes en memoria expiran después de 10 minutos

### Files
- `src/lib/buffer/manager.ts` — agregar fallbackMap
- `src/lib/buffer/redis.ts` — exportar flag hasRedis

## R2: Transcription con mimeType real + logging + retry

### Acceptance Criteria
- AC2.1: Usa el mimeType real del archivo en vez de hardcode "audio/ogg"
- AC2.2: Loggea el body completo del error cuando Whisper falla
- AC2.3: Reintenta 1 vez si la primera llamada falla (con 2s de espera)
- AC2.4: Si después del retry sigue fallando, devuelve texto amigable

### Files
- `src/lib/media/transcription.ts` — 3 fixes

## R3: OPENAI_API_KEY verificada

### Acceptance Criteria
- AC3.1: La variable OPENAI_API_KEY debe tener una key real en Render (no el placeholder)
- AC3.2: El agente debe usar la misma conexión OpenAI que `@ai-sdk/openai` si es posible

### Files
- `.env` (local) + Render dashboard (producción)

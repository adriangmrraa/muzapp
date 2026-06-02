# Technical Design: Audio Whisper Pipeline Fix

## Architecture Decision 1: BufferManager in-memory fallback

**Problema**: `BufferManager` usa Upstash Redis. Sin Redis, todos los métodos (`enqueue`, `fetchAndClear`, `acquireLock`, etc.) retornan valores por defecto que rompen el flujo — el agente nunca recibe los mensajes.

**Solución**: Cuando `redis` es null, usar un `Map<string, { messages: BufferedMessage[], timers: Map<string, number> }>` como backend.

```
BufferManager
├── Redis (primario) ── cuando hasRedis = true
└── InMemoryMap (fallback) ── cuando hasRedis = false
    ├── buffers: Map<channel:userId, BufferedMessage[]>
    ├── timers: Map<channel:userId, timestamp>
    └── locks: Map<channel:userId, boolean>
```

Cada método chequea `redis ?? fallbackMap`:
- `enqueue` → push al array + set timer
- `fetchAndClear` → pop todo + clear timer
- `acquireLock` / `releaseLock` → set/del en locks Map
- `isTimerExpired` → compara timestamp actual vs stored
- `hasNewMessages` → check length > 0
- Cleanup: `setInterval` cada 5 min limpia entradas viejas (>10 min)

## Architecture Decision 2: Transcription con mimeType real + retry

**Problema**: `new Blob([buffer], { type: "audio/ogg" })` hardcodea ogg. Whisper acepta cualquier formato pero el MIME correcto ayuda. Sin retry, fallas transitorias pierden el audio.

**Solución**:
1. Aceptar `mimeType` como parámetro opcional
2. Usar el mimeType real en el Blob
3. Retry 1 vez con 2s de delay si la primera falla
4. Loggear el body completo del error de Whisper

```typescript
async function transcribeAudio(buffer: Buffer, filename: string, mimeType?: string): Promise<string> {
  const blobType = mimeType || "audio/ogg";
  // ... retry logic ...
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(...);
      if (response.ok) return result.text;
      const errorBody = await response.text();
      console.error(`[transcription] Whisper error (attempt ${attempt + 1}):`, response.status, errorBody);
      if (attempt === 0) await sleep(2000);
    } catch (e) {
      console.error(`[transcription] Network error (attempt ${attempt + 1}):`, e);
      if (attempt === 0) await sleep(2000);
    }
  }
  return "[Audio sin transcripción]";
}
```

## Architecture Decision 3: No cambiar el webhook

El webhook actual ya maneja el audio correctamente:
1. Descarga → OK
2. Transcribe → llama a transcribeAudio (mejorado)
3. Encola en buffer → BufferManager (ahora con fallback)
4. Buffer procesa → agent recibe `[Audio]: texto` o `[audio]`

El prompt V3 ya maneja ambos casos. No tocar.

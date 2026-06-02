# Exploration: Audio Transcription Pipeline (Whisper)

## Current State

El pipeline de audio tiene 3 etapas:

```
Webhook (YCloud) → downloadYCloudMedia → transcribeAudio → BufferManager → Agent
```

### Stage 1: Download
- `downloadYCloudMedia()` llama a YCloud API para obtener URL del media, luego descarga el binario
- Timeout: 10s metadata + 30s download
- Formato: YCloud devuelve mime_type (ogg, mp3, opus) + filename

### Stage 2: Transcription
- `transcribeAudio(buffer, filename)` envía a OpenAI Whisper API
- **BUG**: Hardcodea `type: "audio/ogg"` en el Blob, IGNORA el mimeType real
- **BUG**: No loggea el error DETALLADO (solo status code)
- **BUG**: OPENAI_API_KEY en .env es placeholder `sk-tu-openai-api-key`
- Timeout: 30s
- Fallback: devuelve `"[Audio sin transcripción]"`

### Stage 3: Buffer
- `BufferManager` requiere Upstash Redis. Sin Redis: SILENTLY FAILS (no processCallback)
- `scheduleBufferProcessing` con Redis null → `fetchAndClear` = [] → **NUNCA llama al agente**
- Text messages USAN el mismo buffer → si Redis no está configurado, TODO falla

## Root Causes Identified

### 🔴 CRITICAL 1: Whisper API key probablemente no configurada
`.env` tiene `OPENAI_API_KEY=sk-tu-openai-api-key` (placeholder)
Si en Render no hay una key real, Whisper devuelve 401 → `"[Audio sin transcripción]"`

### 🔴 CRITICAL 2: BufferManager requiere Redis y falla silenciosamente
Sin Upstash Redis:
- `enqueue()` → no hace nada
- `acquireLock()` → siempre true (bug: devuelve `true` cuando Redis null)
- `fetchAndClear()` → [] 
- `hasNewMessages()` → false
- `isTimerExpired()` → true
- Resultado: el buffer procesa mensajes vacíos y NUNCA ejecuta el agente

### 🟡 MEDIUM 3: MIME type hardcodeado
`new Blob([buffer], { type: "audio/ogg" })` siempre usa ogg, pero YCloud puede mandar mp3, opus, etc.

### 🟡 MEDIUM 4: Sin logging de error real
`console.error("[transcription] Whisper API error:", response.status)` — solo status, no body

### 🟢 LOW 5: Sin respuesta amigable cuando falla
La transcription devuelve "[Audio sin transcripción]" y eso llega al agente como texto

## Affected Files

| File | Problema |
|------|----------|
| `src/lib/media/transcription.ts` | MIME hardcodeado, sin log detallado, sin retry |
| `src/lib/buffer/manager.ts` | Redis obligatorio, falla silenciosa |
| `src/lib/buffer/redis.ts` | Sin fallback a in-memory |
| `src/app/api/whatsapp/webhook/route.ts` | Depende del buffer que puede no funcionar |
| `.env` | OPENAI_API_KEY placeholder |

## Approaches

### Approach 1: Fix MIME + Retry + Logging (mínimo)
- Usar mimeType real desde YCloud
- Agregar retry 1 vez si falla
- Loggear body del error
- **Pros**: Simple, bajo riesgo
- **Cons**: No soluciona el problema de API key faltante
- **Effort**: Bajo

### Approach 2: Fallback a OpenAI SDK en vez de fetch directo
- Usar `@ai-sdk/openai` (ya instalado) para transcribir
- Mejor manejo de errores, retry nativo
- **Pros**: Usa la misma config que el agente, más robusto
- **Cons**: Depende de versión del SDK
- **Effort**: Bajo

### Approach 3: Fix Buffer para que funcione SIN Redis (RECOMENDADO)
- Agregar fallback in-memory en BufferManager (como el old buffer)
- Cuando Redis null, usar Map en memoria
- Así el buffer siempre funciona
- **Pros**: Soluciona el problema de raíz (sin Redis = sin agente)
- **Cons**: Más changes, no escala horizontalmente (pero local/dev funciona)
- **Effort**: Medio

### Approach 4: Bypass buffer para audios (híbrido)
- Los audios transcritos se mandan DIRECTO al agente sin pasar por buffer
- El buffer solo agrupa mensajes de texto rápidos
- **Pros**: Los audios siempre se procesan
- **Cons**: Lógica extra, puede romper orden de mensajes
- **Effort**: Medio

## Recommendation

**Approach 3 + Approach 1 + Approach 2 combinados:**

1. **Fix BufferManager** con fallback in-memory cuando Redis no está disponible
2. **Fix transcription.ts** con mimeType real + logging + retry
3. **Verificar OPENAI_API_KEY** en Render (o cambiar a @ai-sdk/openai)
4. **Actualizar prompt V3** ya maneja `[audio]` correctamente ✅

## Risks
- El buffer in-memory no sobrevive restarts (aceptable para desarrollo)
- Sin API key real de OpenAI, Whisper no funciona sin importar el fix
- Los audios largos (>20MB) pueden timeoutear

## Ready for Proposal
Sí — tengo claro qué hay que hacer

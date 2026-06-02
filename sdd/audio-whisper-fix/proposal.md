# Proposal: Audio Whisper Pipeline Fix

## Intent
Que el agente escuche y transcriba audios de WhatsApp correctamente usando Whisper, sin depender de Redis/Upstash para el buffer.

## Problemas Detectados
1. **BufferManager requiere Redis** — Sin Upstash Redis, enqueue no hace nada, fetchAndClear devuelve [], el agente nunca recibe el mensaje
2. **transcribe.ts hardcodea MIME** — Siempre usa `audio/ogg`, ignora el formato real
3. **Sin logging detallado** — Solo status code, no se sabe por qué falla
4. **OPENAI_API_KEY placeholder** — `.env` tiene `sk-tu-openai-api-key`

## Scope

### In Scope
- Fix BufferManager con fallback in-memory cuando Redis no está disponible
- Fix transcription.ts: usar mimeType real, logging detallado, retry 1 vez
- Verificar que la key de OpenAI esté configurada en Render

### Out of Scope
- Reemplazar Whisper por otro motor de transcripción
- Transcripción en tiempo real (streaming)
- Audio chunks largos (>20MB)

## Approach
**3 fixes en paralelo:**
1. BufferManager: cuando Redis null, usar Map en memoria (como el old buffer en `src/lib/agent/buffer.ts`)
2. transcription.ts: mimeType dinámico + log del body del error + retry
3. Verificar OPENAI_API_KEY en Render

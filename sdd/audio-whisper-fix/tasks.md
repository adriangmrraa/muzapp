# Tasks: Audio Whisper Pipeline Fix

## T1: BufferManager — fallback in-memory

### Files
- `src/lib/buffer/manager.ts`
- `src/lib/buffer/redis.ts`

### Subtasks
- [ ] T1.1: Exportar `hasRedis` desde redis.ts
- [ ] T1.2: Agregar clase `InMemoryBuffer` con Map privado
- [ ] T1.3: Modificar `enqueue()`: si !redis, usar fallbackMap
- [ ] T1.4: Modificar `fetchAndClear()`: si !redis, leer y limpiar fallbackMap
- [ ] T1.5: Modificar `acquireLock()` / `releaseLock()`: si !redis, usar locks Map
- [ ] T1.6: Modificar `isTimerExpired()`: si !redis, comparar timestamps
- [ ] T1.7: Modificar `hasNewMessages()`: si !redis, check length
- [ ] T1.8: Agregar cleanup cada 5 min para entradas > 10 min

## T2: Transcription — mimeType real + retry + logging

### Files
- `src/lib/media/transcription.ts`
- `src/app/api/whatsapp/webhook/route.ts`

### Subtasks
- [ ] T2.1: Agregar parámetro `mimeType?: string` a transcribeAudio()
- [ ] T2.2: Usar mimeType real (o fallback "audio/ogg") en el Blob
- [ ] T2.3: Agregar retry loop (2 intentos, 2s de espera)
- [ ] T2.4: Loggear body completo del error de Whisper
- [ ] T2.5: Actualizar caller en webhook para pasar mimeType

## T3: Verificar OPENAI_API_KEY

### Files
- `.env`
- Render dashboard

### Subtasks
- [ ] T3.1: Verificar que `OPENAI_API_KEY` en .env NO sea placeholder
- [ ] T3.2: Verificar que en Render esté configurada como variable de entorno

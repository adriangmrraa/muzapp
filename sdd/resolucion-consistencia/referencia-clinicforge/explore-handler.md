# Referencia: ClinicForge Telegram Bot Handler

> Documento de exploracion para resolver inconsistencias entre el handler actual de MuzApp y la arquitectura probada de ClinicForge.

---

## 1. ClinicForge Handler Architecture

**File:** `orchestrator_service/services/telegram_bot.py` (1418 lines)
**Modelo:** Polling (python-telegram-bot `Application` background task)
**Ciclo de vida:** Arranca con el orchestrator via `start_telegram_bots()`, detiene con `stop_telegram_bots()`.

### Estructura general

```
start_telegram_bots()
  └─ por cada tenant: asyncio.create_task(_start_bot_polling())
       └─ Application.builder().token(token).build()
            ├─ MessageHandler(VOICE | AUDIO)  → _handle_voice
            ├─ MessageHandler(PHOTO)          → _handle_photo
            ├─ MessageHandler(Document.ALL)   → _handle_document
            ├─ CommandHandler("/start")       → _handle_start
            ├─ CommandHandler("/help")        → _handle_help
            ├─ CallbackQueryHandler           → _handle_callback
            └─ MessageHandler(TEXT)           → _handle_text
```

### Flujo de texto

```
_handle_text → rate limit → auth → _enqueue_to_buffer → Redis RPUSH + timer + lock
                                                              └─ asyncio.create_task(_telegram_buffer_consumer)
                                                                    └─ wait TTL expiry → LRANGE + DEL → _process_and_respond
                                                                          └─ _verify_user (cache 5min)
                                                                          └─ asyncio.create_task(_typing_loop)
                                                                          └─ _process_with_nova
                                                                          └─ cancel typing
                                                                          └─ send PDF attachments (markers)
                                                                          └─ _safe_html + chunk_message → send_message
```

### Flujo de audio/voice

```
_handle_voice → auth → download → Whisper (AsyncOpenAI) → enriched = `[AUDIO (Xs): "transcripción"]` → _enqueue_to_buffer(is_media=True)
```

### Flujo de foto

```
_handle_photo → auth → download largest photo → GPT-4o vision → classify (is_payment, is_medical) → enriched = `[IMAGEN: "desc"]` → _enqueue_to_buffer(is_media=True)
```

### Flujo de documento

```
_handle_document → auth → validate mime (PDF/image only) → validate size (5MB max) → download → analyze (vision) → enriched → _enqueue_to_buffer(is_media=True)
```

---

## 2. The Buffer / Sliding-Window System (ClinicForge)

Esta es LA pieza clave. ClinicForge implementa un buffer en Redis con sliding window.

### Constantes

```python
BUFFER_TTL_TEXT  = 12   # segundos — mensajes de texto
BUFFER_TTL_MEDIA = 20   # segundos — audio/foto/documento
MIN_REMAINING_TTL = 4   # si al timer le queda menos que esto, lo extiende
```

### Keys en Redis

| Key | Purpose |
|-----|---------|
| `tg_buffer:{tenant}:{chat}` | Redis List — mensajes acumulados (RPUSH / LRANGE) |
| `tg_timer:{tenant}:{chat}` | Redis String con TTL — sliding window timer |
| `tg_lock:{tenant}:{chat}` | Redis String con NX — exclusion mutua de consumers |

### Como funciona

1. **Enqueue** (`_enqueue_to_buffer`):
   - Hace `RPUSH` al buffer list con el contenido
   - Mira el `TTL` del timer key actual. Si es menor a `MIN_REMAINING_TTL` (4s) o menor al TTL que deberia tener, hace `SETEX` con el TTL completo. Esto es el **sliding window**: cada nuevo mensaje "empuja" la ventana hacia adelante.
   - Intenta un `SET NX` en el lock key. Si lo consigue (no habia otro consumer), crea un `asyncio.create_task(_telegram_buffer_consumer)`.

2. **Consumer** (`_telegram_buffer_consumer`):
   - Espera en loop hasta que el TTL del timer llegue a 0 (silencio detectado)
   - Hace `LRANGE + DEL` para drenar el buffer
   - Concatena todos los mensajes con `"\n".join(...)` 
   - Llama a `_process_and_respond` con el texto combinado
   - En `finally`: borra el lock key con `DEL`

3. **Por que sliding window:**
   - Si el usuario manda "Hola" y a los 3 segundos "como estas?", en lugar de dos requests separados al LLM, se combinan en uno solo con `"Hola\ncomo estas?"` 
   - Evita procesar mensajes incompletos (el usuario esta tipeando)
   - Reduce costos de LLM al batch-multiple mensajes en una sola llamada
   - Mejora la coherencia: el asistente ve el mensaje completo

### Diferencia text vs media TTL

- **Texto**: 12s de ventana — los usuarios tipean rapido
- **Media**: 20s de ventana — las descargas y transcripciones toman mas tiempo

### Fallback sin Redis

Si Redis no esta disponible, procesa directamente sin buffer: llama a `_process_and_respond` inmediatamente.

---

## 3. The Nova Processing Loop (ClinicForge)

### Parametros

```python
MAX_TOOL_ROUNDS = 10     # max iterations del tool loop
TELEGRAM_MAX_LEN = 4096  # max chars per Telegram message
HISTORY_TTL = 1800       # 30 min de memoria conversacional en Redis
MAX_HISTORY_MESSAGES = 40 # ultimos 40 mensajes (20 exchanges)
```

### Tool loop

```python
for _round in range(MAX_TOOL_ROUNDS):
    response = await client.chat.completions.create(
        model=model_name,   # desde system_config OPENAI_MODEL
        messages=messages,  # system + history + user
        tools=cc_tools,     # filtrados por page="telegram"
        tool_choice="auto",
        temperature=0.3,
    )

    if not choice.message.tool_calls:
        # → respuesta final, guardar history, return
        return (response_text, tools_called)

    # → continuar loop: append tool calls + results
    for tc in choice.message.tool_calls:
        tool_result = await execute_nova_tool(name, args, tenant_id, ...)
        messages.append({"role": "tool", ...})

# Si llega a MAX_TOOL_ROUNDS, hace un ultimo call sin tools para obtener respuesta final
```

### Caracteristicas clave

1. **Tool filtering**: `nova_tools_for_page("telegram")` filtra tools que no tienen sentido en Telegram (ej: navegacion UI)
2. **Engram memories**: Inyecta las ultimas 20 `nova_memories` de la DB en el system prompt
3. **Notification context**: Si el CEO llega justo despues de una notificacion, inyecta contexto sobre ese paciente
4. **PDF markers**: Los resultados de tools pueden contener markers `[PDF_ATTACHMENT:path|filename]` que se extraen antes de mandar al LLM y se envian como documentos adjuntos
5. **History trimming**: Solo guarda mensajes user/assistant (no tool calls — bloat)
6. **Token tracking**: Fire-and-forget async task para registrar consumo por tenant

---

## 4. Error Handling (ClinicForge)

### Rate limiting

```python
RATE_LIMIT_SECONDS = 2
_rate_limiter: Dict[int, float] = {}  # chat_id → last_message_time

if now - _rate_limiter.get(chat_id, 0) < RATE_LIMIT_SECONDS:
    await update.message.reply_text("⏳ Esperá unos segundos...")
    return
```

In-memory, sin Redis. Simple y efectivo para polling.

### RetryAfter (Telegram rate limit)

```python
except RetryAfter as e:
    await asyncio.sleep(e.retry_after)
    # retry send
```

### Fallbacks

- **Redis no disponible**: procesa directamente sin buffer
- **HTML parse error**: fallback a texto plano
- **Transcripcion fallida**: mensaje de error al usuario
- **Vision/PDF fallida**: mensaje de error al usuario
- **Tool call exception**: capturada por tool, resultado vacio
- **Cualquier excepcion en _process_with_nova**: captura general que devuelve `(f"Error: {str(e)[:200]}", [])`

### Auditoria

```python
await db_pool.execute(
    "INSERT INTO automation_logs (tenant_id, log_type, details, created_at) ..."
)
```

Se loggean tanto las interacciones de texto como las multimedia.

---

## 5. Multimedia Processing (ClinicForge)

### Audio/Voice

- **Source**: `message.voice` o `message.audio`
- **Download**: `source.get_file()` → `download_as_bytearray()`
- **Transcripcion**: `AsyncOpenAI.audio.transcriptions.create(model="whisper-1")`
- **Enriched content**: `[AUDIO (12s): "texto transcrito"]`
- **TTL buffer**: 20s (media)

### Photo

- **Source**: `message.photo[-1]` (la de mayor resolucion)
- **Download**: mismo patron que audio
- **Vision**: `GPT-4o` con prompt especifico de clinica dental
- **Clasificacion**: `image_classifier.classify_message()` → `is_payment` / `is_medical`
- **Enriched content**: `[IMAGEN: "descripcion"]` + flag de pago si corresponde
- **TTL buffer**: 20s

### Document (PDF/image only)

- **Source**: `message.document`
- **Validacion**: mime type debe empezar con `application/pdf` o `image/`
- **Size limit**: 5MB
- **Si es imagen**: mismo procesamiento que photo
- **Si es PDF**: `GPT-4o` con base64 inline (`data:application/pdf;base64,...`)
- **Clasificacion**: misma que photo
- **Enriched content**: `[DOCUMENTO (filename): "descripcion"]` + flag de pago

---

## 6. MuzApp Handler Architecture (Current)

**Route:** `src/app/api/telegram/webhook/[token]/route.ts`
**Modelo:** Webhook (Next.js API Route)
**Ciclo de vida:** Sin estado — cada request es autonoma

### Ruta del webhook

```
POST /api/telegram/webhook/{token}
  ├─ Validar token contra DB
  ├─ Rate limiting por IP
  ├─ Parsear update → procesar multimedia
  │   ├─ Voice/Audio → Whisper transcription
  │   ├─ Photo → Vision analysis
  │   └─ Document/Video → Vision si es imagen, texto si no
  ├─ Check idempotencia (in-memory map)
  ├─ Check autorizacion (chat IDs permitidos)
  ├─ Deduplicacion en DB (message_id)
  ├─ findOrCreateConversation → insertMessage
  ├─ BufferManager.enqueue → scheduleBufferProcessing (fire-and-forget)
  │     └─ callback:
  │           ├─ combinar mensajes buffer
  │           ├─ cargar historial (6 mensajes)
  │           ├─ generateText(model, system, messages, tools, stepCountIs(10))
  │           └─ sendTelegramBubbles
  └─ Return 200 OK
```

### Handler legacy

**File:** `src/lib/telegram/handler.ts` — codigo anterior, SIN buffer, SIN idempotencia, SIN duplicacion.

Se usaba antes de que existiera el buffer. Ahora el route.ts lo bypasso completamente. Mantenido por referencia pero no se ejecuta en produccion.

### Buffer en MuzApp

**File:** `src/lib/buffer/manager.ts` + `src/lib/buffer/processor.ts`

Misma idea que ClinicForge pero con implementacion diferente:

```typescript
BUFFER_CONFIG = {
  telegram: {
    debounceMs: 8_000,   // 8 segundos (vs 12s de ClinicForge)
    lockTtlMs: 300_000,  // 5 min safety
    maxBufferSize: 20,
  }
}
```

Logica de timer:

- **No es sliding window puro**: usa `redis.set(tKey, Date.now().toString(), { ex: debounceSeconds })`. Cada enqueue SOBREESCRIBE el timer con el TTL completo hacia adelante. Esto efectivamente es un sliding window, pero el chequeo en `isTimerExpired()` solo mira si la key existe.
- **Lock**: `SET NX` con TTL de 5 min
- **Consumer**: `scheduleBufferProcessing` → adquiere lock → espera que expire el timer (check cada 1s) → `fetchAndClear` → callback → si hay mensajes nuevos, recursiona hasta `MAX_REPROCESS_DEPTH=3`

La diferencia clave con ClinicForge: MuzApp usa el buffer DENTRO del webhook (fire-and-forget), mientras que ClinicForge usa polling con el buffer como parte del loop principal.

---

## 7. Key Differences

| Aspecto | ClinicForge | MuzApp |
|---------|-------------|--------|
| **Modelo** | Polling (background task) | Webhook (serverless) |
| **Stack** | python-telegram-bot + OpenAI SDK | ai-sdk + Vercel AI |
| **Buffer medio** | Redis List + TTL + min_remaining_ttl check | Redis List + TTL + isTimerExpired |
| **Sliding window** | Si, con `MIN_REMAINING_TTL` y comparacion | Si, pero mas simple (SETEX always) |
| **Timer logic** | Extiende solo si queda poco TTL | Siempre setea TTL completo |
| **TTL texto** | 12s | 8s |
| **TTL media** | 20s | 8s (mismo que texto) |
| **Lock** | SET NX con TTL 60s | SET NX con TTL 300s |
| **Max tool rounds** | 10 | 10 (via `stepCountIs(10)`) |
| **Modelo** | Configurable via DB (gpt-4o-mini default) | Hardcoded gpt-5-mini |
| **History en buffer** | Si, carga historial antes del tool loop | Si, carga 6 mensajes previos |
| **History persistence** | Redis key TTL 30min, filtrado user/assistant | DB relacional (conversations + messages) |
| **Tool filtering** | `nova_tools_for_page("telegram")` | No hay filtro — usa todas las tools |
| **Engram/memories** | Si, inyecta `nova_memories` en system prompt | No |
| **PDF attachments** | Si, via markers en tool results | No |
| **Typing indicator** | asyncio loop cada 4s durante procesamiento | Si, via API call entre bubbles |
| **Token tracking** | Si, por tenant en DB | No |
| **HTML sanitization** | Si, `_safe_html()` con tags permitidos | No (usa texto plano) |
| **Message chunking** | Si, `chunk_message()` con split inteligente | No (usa bubbles ≤250 chars) |
| **Rate limiting** | In-memory simple (2s cooldown) | Por IP via rate-limit middleware |
| **RetryAfter handling** | Si, `asyncio.sleep(retry_after)` | No |
| **Audit log** | Si, `automation_logs` en DB | No |
| **Idempotencia** | No necesaria (polling garantiza 1 vez) | Si, por message.chat.id + message.date |
| **Deduplicacion DB** | No necesario | Si, por message_id |
| **Callbacks inline** | Si, QuickActions con keyboard markup | No |
| **Fallo Redis** | Fallback a procesamiento directo | Fallback a in-memory Map |
| **Cobertura multimedia** | Voice, Audio, Photo, Document (PDF/image) | Voice, Audio, Photo, Document, Video |
| **Size validation** | 5MB max para documentos | No |

---

## 8. What to Adopt from ClinicForge

### Alta prioridad (impacto inmediato)

1. **TTL diferenciado text vs media**: MuzApp usa 8s para todo. ClinicForge usa 12s text / 20s media. Las descargas y transcripciones toman tiempo, asi que media deberia tener un TTL mas largo. Si el usuario manda un audio, la transcripcion tarda 3-5s, y el timer ya esta corriendo. Con 8s puede expirar antes de que termine el procesamiento multimedia.

2. **`min_remaining_ttl` check**: En lugar de siempre setear el TTL completo (que es lo que hace MuzApp), ClinicForge solo extiende si queda menos de `MIN_REMAINING_TTL`. Esto evita que mensajes muy espaciados extiendan la ventana infinitamente. Ejemplo: usuario manda mensaje, espera 10s, manda otro → el timer se extiende solo 4s mas en vez de 12s completos.

3. **History filtering (solo user/assistant)**: ClinicForge filtra tool calls del history guardado porque son ruido. MuzApp guarda todo.

4. **HTML sanitization**: ClinicForge convierte markdown a HTML valido de Telegram y escapa tags invalidos. MuzApp manda texto plano. Con `sendTelegramBubbles` se pierde formato.

5. **Message chunking inteligente**: ClinicForge usa `rfind("\n\n")` → `rfind("\n")` → `rfind(" ")` para partir mensajes largos en chunks naturales. MuzApp usa `splitIntoBubbles` que es mas agresivo (250 chars) y no soporta HTML.

6. **RetryAfter handling**: Telegram devuelve `RetryAfter` cuando se excede el rate limit. ClinicForge lo maneja con `asyncio.sleep(e.retry_after)` + retry.

### Media prioridad (importante pero no critico)

7. **Error fallback en HTML parse**: ClinicForge captura excepciones de `send_message` con HTML y re-intenta sin HTML (texto plano). MuzApp no tiene fallback.

8. **Audit log**: ClinicForge registra todas las interacciones en `automation_logs`. MuzApp solo loggea con `console.warn`.

### Baja prioridad (nice to have)

9. **Token tracking por tenant**: ClinicForge registra consumo de tokens para facturacion/analisis.

10. **Tool filtering por canal**: ClinicForge filtra tools no relevantes para Telegram (ej: navegacion UI).

11. **Engram/memories**: ClinicForge inyecta `nova_memories` en el system prompt.

12. **PDF attachment markers**: ClinicForge permite que tools devuelvan PDFs que se envian como documentos adjuntos.

---

## 9. The Buffer System Explanation

### Problema que resuelve

Cuando un usuario escribe en Telegram, no manda "oraciones completas" — manda fragmentos. Ejemplo tipico:

```
User:   "Hola"
        (3s pause)
User:   "tenemos hamburguesas?"
        (2s pause)
User:   "con cheddar"
```

Sin buffer, esto genera 3 llamadas al LLM. La segunda y tercera no tienen sentido sin el contexto completo. Ademas, cada llamada cuesta dinero y tiempo.

### Solucion: Sliding Window Buffer

El buffer acumula mensajes y espera a que el usuario "termine de escribir" antes de procesar. La "ventana" es sliding: cada mensaje nuevo empuja el timer hacia adelante.

```
t=0s:   User manda "Hola"          → buffer=["Hola"], timer=12s
t=3s:   User manda "tenemos hamburguesas?"
        → buffer=["Hola", "tenemos hamburguesas?"], timer=12s (SE REINICIA)
t=5s:   User manda "con cheddar"
        → buffer=["Hola", "tenemos hamburguesas?", "con cheddar"], timer=12s (SE REINICIA)
t=17s:  Timer expira → consumer despierta
        → combina: "Hola\ntenemos hamburguesas?\ncon cheddar"
        → procesa con LLM
        → responde
```

### Anatomia de un buffer entry (Redis)

```
Key:       buffer:telegram:{chatId}     → Redis List
Key:       timer:telegram:{chatId}      → Redis String con TTL
Key:       lock:telegram:{chatId}       → Redis String con NX

Enqueue:
  RPUSH buffer:telegram:12345 '{"content":"Hola","messageId":"42","timestamp":...}'
  SETEX timer:telegram:12345 8 "1"     (T TL de 8s)

Consumer:
  while TTL > 0 → sleep(1s)
  LRANGE buffer:telegram:12345 0 -1
  DEL buffer:telegram:12345
  → process combined text
  DEL lock:telegram:12345
```

### Por que sliding y no fixed window?

Fixed window (esperar siempre N segundos desde el primer mensaje) es problematico:
- Si el usuario escribe lento, el timer expira antes de que termine
- Si el usuario escribe rapido, espera innecesariamente

Sliding window resuelve ambos: el timer se reinicia CADA VEZ que llega un mensaje nuevo. Solo se procesa cuando hay silencio real.

### Locking

El lock evita que dos consumers procesen el mismo buffer simultaneamente. Especialmente importante en webhooks donde pueden llegar requests concurrentes (Telegram a veces re-envia webhooks).

```
Request 1: enqueue "Hola" → adquiere lock → espera timer
Request 2: enqueue "como estas?" → NO adquiere lock (ya existe) → solo hace RPUSH
Request 1: timer expira → drena buffer ["Hola", "como estas?"] → procesa → libera lock
```

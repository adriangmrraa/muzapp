# Matriz de hallazgos D1-D12 — Auditoría WhatsApp read-only 2026-09-22

Complemento del informe principal `auditoria-whatsapp-readonly-2026-09-22.md`.
Ventana: 2026-07-24T14:34Z → 2026-09-22T14:33Z. Sin PII, ejemplos anonimizados.

Formato por fila: **Evidencia → Código → Consecuencia → Propuesta → Riesgo → Prueba**.

---

## D1 — Bot apagado, ingesta viva, cero `assistant` (prioridad: alta)

- **Evidencia:** `agent_config.id=1`: `enabled=false`, `telegram_enabled=false`, `auto_reply_24h=false`, `meta_connected=false`, `updated` 2026-06-16T05:05Z. Último `assistant` 2026-06-16T02:04Z. En ventana: `assistant` 0 / `system` 0 sobre 21.579 mensajes.
- **Código:** flags en `agent_config` (`enabled`, `auto_reply_24h`); enum `message_role` (`user`/`assistant`/`system`/`human`); ingesta escribe `user`+`human` aunque el bot esté off.
- **Consecuencia:** toda la atención recae en humanos; el p90 de 50,6 min y las 171 colas son el costo directo.
- **Propuesta:** no encender nada ahora; primero tableros de cola (solo lectura) y luego piloto de borradores asistidos con rol `human`.
- **Riesgo:** encender sin dueño ni guiones repite errores automáticos con clientes reales.
- **Prueba:** verificar `enabled=false` sigue vigente; contar roles por semana (debe seguir dando `assistant`=0 hasta decisión del dueño).

## D2 — Cero pedidos en ventana, cero leads convertidos (prioridad: alta)

- **Evidencia:** `orders` en ventana: 0. Histórico: 158 (pan 82 / hamburguesas 76). `leads`: 198 nuevos, 0 convertidos.
- **Código:** `orders` (`order_type`, `status`, `followup_sent`), `leads.status` (`new`/`contacted`/`converted`/`lost`), `order_context_items.status` (`active`/`ordered`).
- **Consecuencia:** la venta ocurre fuera del sistema (verbal, por otro canal) o no ocurre: facturación invisible, sin trazabilidad.
- **Propuesta:** registrar pedido mínimo desde el tablero humano (2 clics) antes de automatizar; reactivar `order_context_items` en 1 línea como piloto.
- **Riesgo:** forzar registro pesado frena al vendedor en hora pico.
- **Prueba:** % de conversaciones con pedido vinculado antes/después del piloto; meta inicial modesta y medible.

## D3 — Audios entrantes sin transcripción (prioridad: alta)

- **Evidencia:** 368 audios user en ventana (3,6% de 10.191); histórico 723/723 sin transcripción (100%).
- **Código:** `chat_messages.content_attributes` admite `transcription?` (array con `type: "audio"`); campo existe y siempre vacío.
- **Consecuencia:** 3,6% del input del cliente es ciego para búsqueda, tableros y cualquier automatismo.
- **Propuesta:** piloto de transcripción solo en audios nuevos, escribiendo `transcription` (columna ya prevista, sin migraciones).
- **Riesgo:** costo por minuto y errores de transcripción con ruido ambiente; audios larguísimos.
- **Prueba:** 50 audios piloto: % OK, latencia media, costo total. Decisión con números.

## D4 — Echoes vacíos e imágenes sin descargar (prioridad: alta)

- **Evidencia:** 1651 echoes vacíos Business (14,5% de 11.388 `human`); 1300+263 imágenes echo sin descargar; 479 `[image]` vacíos de `user` (4,7%); 136 adjuntos de imagen entrante sí registrados.
- **Código:** ingesta WhatsApp Business (echo), `attachments` (solo 136 materializados), marcador `[image]` como contenido sin payload.
- **Consecuencia:** ~1 de cada 5 mensajes del tablero es ruido; las métricas de "respuesta humana" están infladas.
- **Propuesta:** filtro de lectura (no borrado) en vistas: ocultar echoes vacíos y marcar imágenes pendientes. Revisar código de descarga en paralelo.
- **Riesgo:** filtrar de más y ocultar un mensaje real con contenido atípico.
- **Prueba:** recontar métricas con y sin filtro; auditar muestra de 100 filtrados para confirmar que ninguno tenía contenido.

## D5 — Leads sin tipificar, sin conversión (prioridad: alta)

- **Evidencia:** 198 nuevos, 0 convertidos; ~90% sin `type`. B2C 27% / B2B 14% solo por keywords (correlación).
- **Código:** `leads.type` varchar(10), `status`, `conversation_id` FK; `client_type` enum (`b2c`/`b2b`) existe pero no se usa para tipificar.
- **Consecuencia:** no se puede operar diferenciado (precio, horario, stock de pan) porque el dato no existe.
- **Propuesta:** backfill con keywords + revisión humana; tipificar al crear desde el tablero.
- **Riesgo:** keyword mal puesta etiqueta mal al cliente (ver caso R3).
- **Prueba:** % tipificado y acuerdo entre keyword y revisión humana en muestra de 100.

## D6 — Follow-up sin enviar 128/158 (prioridad: media)

- **Evidencia:** `followup_sent=false` en 128 de 158 pedidos históricos.
- **Código:** `orders.followup_sent` (default false); no hay evidencia de job que lo procese en ventana.
- **Consecuencia:** venta dormida: clientes que ya compraron no reciben reactivación.
- **Propuesta:** tanda piloto de 20 con guion del dueño; medir reactivación antes de automatizar.
- **Riesgo:** spamear clientes si se envía masivo sin segmentar ni guion.
- **Prueba:** tasa de respuesta y de pedido de la tanda piloto vs. grupo control sin mensaje.

## D7 — Cola sin dueña: 171 conversaciones con último mensaje `user` (prioridad: media)

- **Evidencia:** 171/383 (44,6%) terminan en `user`; p90 50,6 min (n=5072).
- **Código:** `conversations.last_message_at` / `last_message_preview`; sin asignación visible de responsable.
- **Consecuencia:** casi la mitad del tablero espera o se perdió; el p90 es la medida del descuido.
- **Propuesta:** vista de cola ordenada por antigüedad (solo lectura); definir turnos y SLA con el dueño.
- **Riesgo:** SLA irreal (ej. 5 min) que nadie cumple y se abandona.
- **Prueba:** p50/p90 semanal después del tablero; n° de colas >24h.

## D8 — Ubicaciones solo-coordenadas (prioridad: media)

- **Evidencia:** 136 ubicaciones, 96% solo coords sin dirección asociada.
- **Código:** `addresses` (`phone`, `address`, `latitude`, `longitude`, `maps_link`, `label`).
- **Consecuencia:** el delivery opera con un pin sin dirección confirmada: fricción y errores de reparto.
- **Propuesta:** sugerencia de dirección a partir de coords + confirmación humana; guardar `label` ("Casa"/"Trabajo").
- **Riesgo:** geocodificación errada que manda el pedido a otra cuadra.
- **Prueba:** % de ubicaciones con dirección confirmada tras el piloto; reclamos de reparto.

## D9 — `order_context_items` sin uso (prioridad: media)

- **Evidencia:** sin uso efectivo en ventana, coherente con 0 pedidos.
- **Código:** `order_context_items` con `status` (`active`/`ordered`) y `expires_at`.
- **Consecuencia:** no hay carrito intermedio: o el vendedor acuerda todo de palabra o no hay registro.
- **Propuesta:** reactivar en 1 línea con expiración corta; medir items→pedidos.
- **Riesgo:** items huérfanos que ensucian si nadie los cierra.
- **Prueba:** items activos vs. convertidos a `ordered`; tiempo medio de vida.

## D10 — Índices faltantes / deuda de consulta (prioridad: media)

- **Evidencia:** búsquedas operativas (por teléfono, fecha, rol, estado) sin soporte dedicado salvo `idx_chat_messages_platform_id` (que sí cumple: 0 duplicados).
- **Código:** `schema.ts` define un solo índice dedicado (`platformMsgUq`); `conversations.whatsapp_id` unique ayuda, pero faltan índices compuestos de trabajo diario.
- **Consecuencia:** tableros y reportes cada vez más lentos a medida que crece `chat_messages`.
- **Propuesta:** agregar índices compuestos (`conversation_id`+`created_at`, `role`+`created_at`, `last_message_at`) en ventana de mantenimiento, con medición antes/después.
- **Riesgo:** tocar producción sin ventana acordada; calificar como cambio productivo (fuera de este entregable).
- **Prueba:** `EXPLAIN` de las consultas del tablero antes/después; tiempos p95.

## D11 — Override humano en 21 conversaciones sin protocolo visible (prioridad: baja)

- **Evidencia:** 21 convs con `human_override_until` activo.
- **Código:** `conversations.human_override_until`; no hay registro visible de quién/motivo/duración estándar.
- **Consecuencia:** funciona pero frágil: overrides eternos o pisados entre vendedores.
- **Propuesta:** protocolo mínimo (motivo + duración por defecto + responsable) documentado, sin cambiar código aún.
- **Riesgo:** burocratizar una herramienta que hoy resuelve.
- **Prueba:** % de overrides con motivo registrado y duración acotada tras el protocolo.

## D12 — Telegram testimonial (prioridad: baja)

- **Evidencia:** 1 conversación Telegram sobre 595; `telegram_enabled=false`.
- **Código:** campos `telegram_*` en `agent_config`; enum `channel` incluye `telegram`.
- **Consecuencia:** canal mantenido a costo (código, tokens, superficie) sin volumen.
- **Propuesta:** decisión del dueño: operar (piloto con objetivo) o declarar fuera de soporte y simplificar.
- **Riesgo:** mantener a medias da peor imagen que cerrar explícitamente.
- **Prueba:** volumen y conversión a 30 días si se opera; si no, acta de cierre.

---

*Criterio de prioridad: alta = plata o clientes en riesgo hoy; media = eficiencia y deuda; baja = orden y decisiones pendientes.*

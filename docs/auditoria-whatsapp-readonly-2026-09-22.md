# Auditoría WhatsApp read-only — Mrs Muzzarella (muzapp)

**Fecha de informe:** 2026-09-22
**Ventana auditada:** 2026-07-24T14:34Z → 2026-09-22T14:33Z (60 días, cortes ART UTC-3)
**Consulta ejecutada:** 2026-09-22T14:33Z
**Modo:** read-only. Solo lectura local en `docs/`. No se tocó producción, no se encendió el bot, no se hicieron envíos ni deploys, no se mezcló con Jev.
**Base:** `neondb`, schema `public`, PostgreSQL 17.11, región sudamericana de Neon. Conexión por variable `DATABASE_URL` (valor no expuesto en este informe).
**Tablas alcanzadas:** `addresses`, `agent_config`, `attachments`, `chat_messages`, `conversations`, `leads`, `order_context_items`, `orders`, `products`, `promotions`, `users`.

> Regla de privacidad de este entregable: sin PII. Nada de teléfonos completos, direcciones, nombres completos, tokens, URLs de conexión ni datos de pago. Ejemplos anonimizados y recortados; referencias por IDs/hashes no reversibles si hace falta. No se vuelca la base ni transcripciones masivas.

---

## 1. Rango, metodología y limitaciones

### 1.1 Rango

| Dato | Valor |
|---|---|
| Inicio de ventana | 2026-07-24T14:34Z |
| Fin de ventana | 2026-09-22T14:33Z |
| Duración | 60 días corridos |
| Zona de corte | ART (UTC-3) |
| Momento de consulta | 2026-09-22T14:33Z |

### 1.2 Metodología

- Lectura directa sobre las 11 tablas listadas arriba, sin escrituras.
- La ventana WhatsApp se delimita por `chat_messages.created_at` y `conversations` con actividad en el rango.
- Los roles de mensaje usados son los del enum real: `user`, `assistant`, `system`, `human`.
- Las frecuencias de primer mensaje, keywords B2C/B2B y latencias se calculan sobre los denominadores que se declaran en cada tabla de la sección 3. Si el denominador cambia, se avisa.
- No se reconsultó la DB para este informe: se vuelca fielmente la auditoría recibida, sin inventar datos nuevos.

### 1.3 Limitaciones: qué quedó probado con datos vs. hipótesis

**Probado con datos (hechos):**

- El bot está apagado desde el 16/06 (`agent_config.id=1`: `enabled=false`, último `assistant` 2026-06-16T02:04Z) pero la ingesta sigue viva todos los días de la ventana.
- En la ventana hay 0 mensajes `assistant` y 0 `system`: todo lo que responde es rol `human`.
- Latencia user→human medida sobre pares reales (n=5072): p50 1,8 min / p90 50,6 min.
- 0 pedidos en ventana vs. 158 históricos; 198 leads nuevos con 0 convertidos.
- 368 audios entrantes sin transcripción; 1651 echoes vacíos; 0 duplicados de `platformMessageId`.
- 21 conversaciones con override humano activo; 128/158 follow-ups sin enviar.

**Hipótesis (no probadas, requieren decisión del dueño o pruebas):**

- La correlación B2C 27% / B2B 14% por keywords es una aproximación léxica, no una clasificación real de clientes (ver §4.9 y caso R3).
- Que los 1300+263 echoes de imagen "sin descargar" sean recuperables o no depende del código de ingesta y de la retención del proveedor; no se probó.
- Las propuestas de la sección 6 marcadas "con pruebas" o "decisión del dueño" no están validadas: son caminos, no afirmaciones.
- Cualquier causa atribuida a "por qué" el cliente escribe de cierta forma es interpretación operativa, no dato.

---

## 2. Esquema real observado vs. `src/db/schema.ts`

Se contrastó la auditoría contra `src/db/schema.ts` (revisión local read-only del 2026-09-22). Conclusión: **el esquema observado coincide con el declarado**. No se detectaron tablas ni columnas fuera del schema. Las observaciones son de *uso*, no de deriva estructural.

| Tabla | Estado en schema.ts | Observación de uso en ventana |
|---|---|---|
| `agent_config` | `pgTable("agent_config", …)` con ~40 columnas incl. flags, Telegram, WhatsApp, Meta OAuth, stock | Fila `id=1` leída: `enabled=false`, `telegram_enabled=false`, `is_cooking=true`, `delivery_enabled=true`, `auto_reply_24h=false`, `meta_connected=false`, `stock_pan_docenas=35`, `updated_at` 2026-06-16T05:05Z |
| `conversations` | Incluye `whatsapp_id` unique, `channel` (`whatsapp`/`telegram`), `human_override_until`, `conversation_metadata` (jsonb), `messages` (jsonb legacy) | 595 totales (594 whatsapp + 1 telegram); 383 activas en ventana; 207 creadas en ventana; `human_override_until` activo en 21 |
| `chat_messages` | `role` enum (`user`/`assistant`/`system`/`human`), `content_attributes` (jsonb array con `transcription?`, `description?`), `platform_message_id` con índice único `idx_chat_messages_platform_id` | 21.579 en ventana whatsapp; `transcription` siempre ausente en audios; índice cumple (0 duplicados) |
| `leads` | `status` enum (`new`/`contacted`/`converted`/`lost`), `type` varchar(10), `conversation_id` FK | 198 nuevos, 0 convertidos; 90% sin `type` |
| `orders` | `order_type` (`hamburguesas`/`pan_mayorista`), `status`, `followup_sent` default false | 0 en ventana; 158 históricos (pan 82 / hamburguesas 76); `followup_sent=false` en 128/158 |
| `order_context_items` | `status` enum (`active`/`ordered`), expiración `expires_at` | Sin uso efectivo en ventana (coherente con 0 pedidos) |
| `attachments` | FK a lead/conversation/message, `type`, `url` | 136 de imagen entrante; echoes de imagen no materializados como descarga |
| `addresses` | `phone`, `address`, lat/long, `maps_link` | 136 ubicaciones; 96% solo coordenadas |
| `products` / `promotions` / `users` | Catálogo, promos, usuarios admin/viewer | Sin hallazgos de auditoría en ventana (tablas de soporte, no transaccionales del período) |

**Brecha relevante (código vs. datos):** el schema *permite* `transcription`, `description`, `type` de lead y `followup_sent=true`, pero los datos muestran esos campos sistemáticamente vacíos o sin transición. No es un problema de esquema: es de flujo (ver matriz D1-D12).

---

## 3. Cobertura con métricas y denominadores

Ventana WhatsApp (denominador base: **21.579 mensajes** en **383 conversaciones activas**).

### 3.1 Volumen y roles

| Métrica | Valor | Denominador |
|---|---|---|
| Mensajes totales ventana | 21.579 | — (base) |
| Rol `user` | 10.191 (47,2%) | 21.579 |
| Rol `human` | 11.388 (52,8%) | 21.579 |
| Rol `assistant` | 0 | 21.579 |
| Rol `system` | 0 | 21.579 |
| Conversaciones activas | 383 | 595 totales (594 whatsapp + 1 telegram) |
| Creadas en ventana | 207 | 595 |
| Ritmo medio | ~360 mensajes/día | 21.579 / 60 |
| Conversaciones/día | 10–46 | conteo diario |
| Días sin ingesta | 0 | 60/60 con actividad |
| Pico | 05/09 ~957 mensajes | día máximo |

### 3.2 Latencia y cierre

| Métrica | Valor | Denominador |
|---|---|---|
| Latencia user→human p50 | 1,8 min | n=5072 pares |
| Latencia user→human p90 | 50,6 min | n=5072 pares |
| Último rol `user` (esperando respuesta) | 171 convs (44,6%) | 383 |
| Último rol `human` (respondido) | 212 convs (55,4%) | 383 |
| Retomas tras >24h de silencio | 175/383 (45,7%) | 383 |

### 3.3 Concentración y primer mensaje

| Métrica | Valor | Denominador |
|---|---|---|
| Conversaciones con 100+ mensajes | 43 → 13.538 msgs (62,7%) | 21.579 |
| Top 3 conversaciones | 1217 / 1077 / 797 mensajes | — |
| Primer mensaje: saludo | 44% | n=373 |
| Primer mensaje: pedido directo | 8% | n=373 |
| Primer mensaje: precio | 5% | n=373 |
| Primer mensaje: menú | 0% | n=373 |
| Clasificación por keywords B2C | 27% (correlación) | 383 |
| Clasificación por keywords B2B | 14% (correlación) | 383 |

### 3.4 Comercial y multimedia

| Métrica | Valor | Denominador |
|---|---|---|
| Leads nuevos | 198 | ventana |
| Leads convertidos | 0 | 198 |
| Leads sin `type` | ~90% | 198 |
| Pedidos en ventana | 0 | ventana |
| Pedidos históricos | 158 (pan 82 / hamburguesas 76) | fuera de ventana |
| Audios entrantes sin transcripción | 368 (3,6% de user) | 10.191 user |
| Audios históricos sin transcripción | 723/723 (100%) | histórico |
| Echoes vacíos Business | 1651 (14,5% de human) | 11.388 human |
| Echoes de imagen sin descargar | 1300+263 | human con marcador |
| Marcador `[image]` vacío de user | 479 (4,7%) | 10.191 user |
| Adjuntos imagen entrante | 136 | ventana |
| Ubicaciones | 136 (96% solo coords) | ventana |
| Duplicados `platformMessageId` | 0 | ventana |
| Override humano activo | 21 convs | 383 |
| Follow-up sin enviar | 128/158 | históricos |

---

## 4. Forma real de vender y atender (9 puntos)

### 4.1 El bot está apagado pero el negocio sigue entrando

`agent_config.id=1` con `enabled=false` desde el 16/06 y último `assistant` 2026-06-16T02:04Z. Sin embargo: 60/60 días con ingesta, ~360 mensajes/día, pico de ~957 el 05/09. **La demanda no depende del bot; la atención sí depende de humanos.**

### 4.2 La atención es 100% humana y razonablemente rápida en la mediana

21.579 mensajes sin un solo `assistant`. p50 de 1,8 min es operativo; p90 de 50,6 min marca la cola que se escapa (n=5072). El 44,6% de las conversaciones queda con último mensaje `user`: casi la mitad del tablero está esperando o abandonada.

### 4.3 La mitad de las conversaciones son relaciones, no tickets

175/383 (45,7%) retoman tras >24h de silencio. El cliente vuelve al mismo hilo días después. Esto explica la concentración: 43 conversaciones acumulan el 62,7% del tráfico y el top llega a 1217 mensajes. **Diseñar para "ticket que se cierra" rompería el uso real.**

### 4.4 El cliente saluda, no pide

Primer mensaje (n=373): saludo 44%, pedido 8%, precio 5%, menú 0%. El menú nunca es la puerta de entrada. Quien proponga "mostrar el menú primero" va contra el dato.

### 4.5 Semanas contrastadas: el volumen no predice venta

El pico del 05/09 (~957 mensajes) convive con **0 pedidos registrados en toda la ventana**. El histórico (158 pedidos: 82 pan, 76 hamburguesas) prueba que el negocio vende, pero en esta ventana la conversación no se convierte en `orders`. Volumen ≠ conversión.

### 4.6 Contraejemplo: mega-conversaciones sin pedido

Conversaciones de 1217, 1077 y 797 mensajes sin pedido asociado. Son el contraejemplo central: el hilo más activo del negocio no deja rastro en `orders`, `leads` convertidos ni `order_context_items`. Si la medición fuera "mensajes", el negocio estaría bárbaro; medida en "pedidos", la ventana es cero.

### 4.7 El audio entra y se pierde

368 audios entrantes (3,6% de lo que escribe el cliente) y 723/723 históricos sin transcripción. El campo `transcription` existe en el schema y está siempre vacío. Cada audio es atención a ciegas para cualquier automatismo futuro y carga cognitiva para el humano.

### 4.8 Los echoes ensucian la lectura

1651 mensajes `human` vacíos tipo echo de Business (14,5% de la respuesta humana), más 1300+263 imágenes echo sin descargar y 479 `[image]` vacíos de `user`. Casi 1 de cada 5 mensajes del tablero es ruido de protocolo, no contenido.

### 4.9 B2C/B2B por keywords: señal débil, útil como correlación

27% B2C / 14% B2B por keywords. Es correlación léxica, no tipificación: el 90% de los leads no tiene `type`. Sirve para orientar (hay dos líneas reales: hamburguesa nocturna y pan mayorista), no para afirmar "este cliente es B2B". Ver caso R3.

---

## 5. Matriz D1-D12 priorizada

Ver archivo complementario `auditoria-whatsapp-matriz-D1-D12-2026-09-22.md`. Resumen de prioridad:

| ID | Hallazgo | Prioridad |
|---|---|---|
| D1 | Bot apagado + ingesta viva sin `assistant` | Alta — define todo lo demás |
| D2 | 0 pedidos en ventana / 0 leads convertidos | Alta — facturación invisible |
| D3 | Audios sin transcripción (368 + 723/723) | Alta — 3,6% ciego |
| D4 | Echoes vacíos + imágenes sin descargar | Alta — ~1/5 del tablero es ruido |
| D5 | Leads 90% sin `type`, 0 conversión | Alta — B2C/B2B sin tipificar |
| D6 | Follow-up sin enviar 128/158 | Media — venta dormida |
| D7 | 44,6% de convs con último mensaje `user` | Media — cola sin dueña |
| D8 | Ubicaciones 96% solo coords, sin dirección | Media — delivery friccionado |
| D9 | `order_context_items` sin uso en ventana | Media — carrito muerto |
| D10 | Índices faltantes (búsquedas sin soporte) | Media — deuda técnica |
| D11 | Override humano en 21 convs sin protocolo visible | Baja — funciona pero frágil |
| D12 | 1 conversación Telegram testimonial | Baja — canal sin volumen |

Cada fila lleva evidencia → código → consecuencia → propuesta → riesgo → prueba en el archivo de la matriz.

---

## 6. Propuesta customer / seller / Telegram

### 6.1 Seguros (hacer sin pedir permiso, sin riesgo)

- **Limpieza de lectura:** filtrar echoes vacíos e imágenes no descargadas en las vistas/tableros (solo lectura, no borra datos). Baja el ruido ~20%.
- **Tipificar leads con lo que ya hay:** backfill de `leads.type` con las keywords auditadas + revisión humana de los dudosos. No cambia flujos.
- **Tablero de cola:** vista de las 171 conversaciones con último mensaje `user` ordenadas por antigüedad. Solo lectura.
- **Normalizar ubicaciones:** job de lectura que sugiera dirección a partir de coords ya guardadas; el humano confirma. No toca producción sin revisión.

### 6.2 Con pruebas (piloto acotado, medible, reversible)

- **Transcripción de audios entrantes:** piloto sobre audios nuevos, guardando en `content_attributes.transcription` (campo ya existente). Prueba: % transcritos OK sobre 50 audios, costo por minuto, latencia.
- **Respuestas seller asistidas (no automáticas):** borrador sugerido al humano, que edita y envía. El rol sigue siendo `human`; el bot sigue apagado. Prueba: A/B en 2 vendedores, latencia p90 y conversión.
- **Follow-up de los 128 pendientes:** tanda piloto de 20 con guion aprobado por el dueño, midiendo respuesta y pedido. Prueba: tasa de reactivación.
- **Carrito `order_context_items`:** reactivar en 1 línea (hamburguesas) con expiración corta. Prueba: items activos → pedidos.

### 6.3 Decisiones del dueño (no se avanza sin su "sí")

1. **¿Se vuelve a encender el bot?** (`enabled`, `auto_reply_24h`, horarios, líneas). Implica tono, responsabilidad por errores y quién apaga en crisis.
2. **¿Telegram se opera o se cierra?** Hoy: 1 conversación, `telegram_enabled=false`. O se invierte o se declara fuera de soporte.
3. **¿Quién es dueño de la cola de 171?** Roles, turnos y qué hacer con el p90 de 50,6 min.
4. **¿Se tocan precios/stock (`stock_pan_docenas=35`, `is_cooking`, aliases)?** Datos sensibles del negocio; solo el dueño.
5. **¿Meta Business se conecta?** (`meta_connected=false`). Implica OAuth, tokens y costos.

---

## 7. Casos de evaluación anonimizados (E1-E3, R1-R3, A1-A2)

Ver archivo complementario `auditoria-whatsapp-casos-evaluacion-2026-09-22.md`. Resumen:

- **E1 — Saludo que tarda en ser pedido:** hilo típico saludo→precio→pedido verbal sin `orders`. Evalúa conversión conversación→pedido.
- **E2 — Audio sin transcripción:** cliente manda audio con el pedido; queda ciego para el sistema. Evalúa transcripción.
- **E3 — Retoma >24h:** cliente vuelve a los 3 días al mismo hilo. Evalúa continuidad de contexto.
- **R1 — Mega-conversación sin pedido:** 1000+ mensajes, 0 pedido. Evalúa detección de hilo improductivo.
- **R2 — Pico 05/09:** ~957 mensajes en un día. Evalúa comportamiento bajo carga.
- **R3 — B2B disfrazado de B2C:** pide "docenas" con lenguaje minorista. Evalúa tipificación más allá de keywords.
- **A1 — Echo vacío:** mensaje `human` vacío que no debe contarse como respuesta. Evalúa filtrado de ruido.
- **A2 — Ubicación solo-coords:** 96% de los casos. Evalúa normalización a dirección.

Todos anonimizados: sin teléfonos, nombres, direcciones ni texto literal. Solo patrones, frecuencias y criterios de aceptación.

---

## 8. Comandos y consultas ejecutadas y no realizables

### 8.1 Ejecutadas (alcance de la auditoría recibida)

Sobre `neondb.public`, PG 17.11, vía `DATABASE_URL`:

- Lectura de `agent_config` fila `id=1` (flags, stock, `updated_at` 2026-06-16T05:05Z).
- Conteo de `chat_messages` por rol en ventana (`user`/`human`/`assistant`/`system`).
- Conteo y creación de `conversations` por canal y fecha (595 totales, 207 en ventana, 383 activas).
- Distribución diaria (rango 10–46 convs/día, pico 05/09, 0 días vacíos).
- Pares user→human para latencia (n=5072, p50/p90).
- Último rol por conversación (171 user / 212 human).
- Retomas >24h (175/383).
- Concentración por conversación (top 1217/1077/797; 43 con 100+).
- Primer mensaje por patrón (n=373: saludo/pedido/precio/menú).
- Keywords B2C/B2B (27%/14%).
- `leads` nuevos/convertidos/sin type (198/0/90%).
- `orders` en ventana (0) e históricos (158: 82/76).
- Audios sin transcripción (368 ventana, 723/723 histórico).
- Echoes vacíos, imágenes echo, `[image]` user, adjuntos (1651 / 1300+263 / 479 / 136).
- Ubicaciones (136, 96% coords).
- Duplicados `platform_message_id` (0).
- Overrides activos (21) y follow-ups pendientes (128/158).

### 8.2 No realizables (explicitadas como límite, no como falla)

- **Reconectar causas con contenido literal:** no se vuelcan transcripciones ni textos completos (regla de privacidad del entregable).
- **Re-consulta a la DB para este informe:** 달성 por consigna; se vuelca la auditoría recibida sin nuevos datos.
- **Encender el bot / enviar mensajes / deploys:** fuera del modo read-only por consigna.
- **Mezclar con Jev:** excluido por consigna.
- **Validar recuperabilidad de imágenes echo:** requiere pruebas contra código de ingesta y retención del proveedor; queda como prueba propuesta (D4).
- **Atribuir intención del cliente más allá de keywords:** sería inferencia, no dato (hipótesis §1.3).
- **Auditar `users`/`products`/`promotions` transaccionalmente:** sin movimiento en ventana; solo contraste de esquema (§2).

---

*Fin del informe principal. Complementarios: matriz D1-D12 y casos de evaluación, misma fecha.*

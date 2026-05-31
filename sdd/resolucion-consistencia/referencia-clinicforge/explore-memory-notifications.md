# Referencia ClinicForge — Sistema de Notificaciones y Memoria

## 1. ClinicForge — Sistema de Notificaciones (Telegram)

### 1.1 Arquitectura general

- **Orquestador centralizado** (`telegram_notifier.py`): recibe eventos WebSocket del sistema y decide si notificar.
- **Fire-and-forget**: `fire_telegram_notification()` programa `notify_telegram` como task asíncrona, nunca bloquea.
- **Por tenant**: cada clínica tiene su propio bot de Telegram. Los bots se registran en un dict `_bots[tenant_id]`.

### 1.2 Eventos que disparan notificaciones

Están definidos en `EVENT_FORMATS` y filtrados por `ALLOWED_EVENTS` (whitelist estricta):

| Evento | Emoji | Qué notifica |
|--------|-------|-------------|
| `NEW_APPOINTMENT` | 📅 | Nuevo turno agendado (incluye fuente: IA vs manual) |
| `APPOINTMENT_UPDATED` | 🔄 | Turno modificado |
| `APPOINTMENT_DELETED` | ❌ | Cancelación |
| `PAYMENT_CONFIRMED` | 💰 | Pago verificado |
| `HUMAN_HANDOFF` | 🤝 | Derivación a humano |
| `NEW_PATIENT` | 👤 | Nuevo paciente registrado |
| `URGENCY_DETECTED` | 🚨 | Urgencia por triage |
| `PLAYBOOK_ALERT` | ⚠️ | Alerta de automatización |
| `LEAD_RECOVERY_TOUCH1/2/3` | 🎯📌👋 | Secuencia de recuperación de leads (touch 1, 2, 3) |
| `LEAD_RECOVERY_CONVERSION` | ✅ | Lead convertido en paciente |
| `LEAD_RECOVERY_NOT_INTERESTED` | 🚫 | Lead descartado |

### 1.3 Mecanismos clave

- **Whitelist estricta**: si el evento no está en `ALLOWED_EVENTS`, se descarta silenciosamente. Sin genérico.
- **Formateo por evento**: cada evento tiene su propio template con emoji, título y campos. Los campos se construyen con lambdas que reciben el payload.
- **Timezone por tenant**: `tz_resolver` obtiene la zona horaria del tenant, se pasa a las lambdas de formateo para mostrar horas locales.
- **Mensajes proactivos**: `send_proactive_message()` permite enviar mensajes no asociados a un evento (morning briefing, alertas smart), bypassing la whitelist.
- **Destinatarios autorizados**: se leen de `telegram_authorized_users` en DB, con `chat_id` encriptado.

### 1.4 Notificación context en Redis

Cada notificación guarda contexto en Redis con TTL de 30 minutos:
```python
key = f"last_tg_notification:{tenant_id}:{chat_id}"
redis.setex(key, 1800, json.dumps(context))
```

Esto permite que el agente (Nova) responda preguntas como "¿de qué paciente era ese turno?" después de recibir una notificación. El contexto incluye: event, tenant_id, patient_name, patient_id, phone, appointment_id, etc.

### 1.5 Formato de mensaje

```html
📅 <b>Nuevo turno</b>

▸ Paciente: Juan Pérez
▸ Fecha: Mié 20/04 18:30
▸ Tipo: Consulta
▸ Profesional: Dra. Laura Delgado
▸ Creado por: AI
▸ Fuente: 🤖 Bot IA
```

Soporta HTML parse mode (bold, etc.).

---

## 2. ClinicForge — Sistema de Memoria (Engram)

### 2.1 Propósito

ClinicForge **no usa Engram** como sistema de memoria para el agente — usa Redis context (transitorio, 30 min TTL) para recordar la última notificación. No hay memoria persistente de conversaciones entre sesiones del agente.

Lo que **sí** tiene como "memoria":

| Mecanismo | Persistencia | Propósito |
|-----------|-------------|-----------|
| Redis notification context | 30 min TTL | Recordar último evento notificado para follow-ups |
| Notification context retrieval | 30 min TTL | `get_notification_context()` para que Nova responda preguntas |
| `save_patient_anamnesis` | DB permanente | Guardar ficha médica del paciente |
| `patients.medical_history` | DB permanente | JSONB con historial |

### 2.2 Lo que NO tiene (vs. lo que necesitamos)

- No hay memoria de conversaciones previas del mismo cliente.
- No hay embeddings ni búsqueda semántica.
- No hay persistencia de decisiones del agente (ej. "ya le ofrecí descuento").
- No hay vector store.
- No hay historial de interacciones por cliente accesible desde el prompt.

ClinicForge resuelve esto de forma **transaccional**: cada interacción es atómica, el estado está en la DB (turnos, pacientes, pagos) y el context está en Redis.

---

## 3. MuzApp — Estado Actual

### 3.1 Notificaciones (src/lib/telegram/notifier.ts)

MUY básico vs ClinicForge:

| Aspecto | ClinicForge | MuzApp |
|---------|-------------|--------|
| Eventos soportados | 13 eventos tipados | 1 función: `notifyNewOrder` |
| Whitelist | Sí, explícita | No, solo existe un evento |
| Formateo | Template por evento con lambdas | Hardcodeado inline |
| Multipropietario | Multi-tenant con bots separados | Chat IDs de entorno |
| Mensajes proactivos | `send_proactive_message()` | No existe |
| Contexto en Redis | 30 min TTL para follow-ups | No existe |
| Notificación a Lichas específica | — | Sí, hardcodeada para pan mayorista |
| Manejo de errores | Fire-and-forget, nunca crashea | Await directo, puede fallar |

**Evento único**: solo notifica `NEW_ORDER`. No hay notificaciones para:
- Cancelaciones de pedido
- Pagos confirmados
- Urgencias del chat WhatsApp
- Handoff a humano
- Nuevos clientes registrados
- Alertas de stock/producto
- Recovery de leads

### 3.2 Memoria / Engram

**NO EXISTE.** MuzApp no tiene:
- Sistema de memoria persistente para el agente Telegram.
- Sistema de memoria para el agente WhatsApp.
- Contexto de notificaciones en Redis/DB.
- Historial de decisiones del agente.
- Embeddings ni búsqueda semántica.
- Almacenamiento de preferencias del cliente entre sesiones.
- Capacidad de recordar conversaciones previas (más allá del contexto inmediato de LangChain).

### 3.3 Sistema actual relevante

- **In-memory idempotency** (`src/lib/idempotency.ts`): solo para dedup de requests.
- **In-memory buffer dedup** (`src/lib/buffer/manager.ts`): solo para agrupar mensajes.
- **Redis buffer** (`src/lib/buffer/redis.ts`): existe pero solo para el buffer de mensajes, no para memoria.
- **Agente WhatsApp** (`src/lib/whatsapp/agent.ts`): tiene `order context` (memoria del pedido actual) inyectado en el prompt, pero es transaccional (solo vive en el mensaje actual).

---

## 4. Qué Implementar para MuzApp

### 4.1 Sistema de Notificaciones (ref: ClinicForge)

Basado en `notifier.ts`, expandir a:

1. **Eventos tipados**: Definir `ALLOWED_EVENTS` y `EVENT_FORMATS` como en ClinicForge.
2. **Nuevos eventos**:
   - `ORDER_CANCELLED` ❌
   - `PAYMENT_CONFIRMED` 💰
   - `WHATSAPP_URGENCY` 🚨
   - `HUMAN_HANDOFF` 🤝
   - `NEW_CUSTOMER` 👤
   - `LOW_STOCK_ALERT` ⚠️ (para pan mayorista)
   - `WHATSAPP_LEAD_RECOVERY` 🎯
3. **Templates por evento**: lambda functions que formatean el payload específico.
4. **Fire-and-forget pattern**: `notifyTelegram` como task asíncrona sin await en el caller.
5. **Multi-destinatario**: leer de DB los chat_ids autorizados en vez de env vars.
6. **Notificación a Lichas**: migrar de hardcode a un evento `PAN_MAYORISTA_ORDER` con template específico.
7. **Redis notification context**: guardar contexto de cada notificación con TTL para follow-ups.

### 4.2 Sistema de Memoria (nuevo)

1. **Notification context**: Redis key `last_notification:{business_id}:{chat_id}` con TTL 30 min.
2. **Customer memory**: tabla SQL `customer_memory` con JSONB:
   - `customer_id`, `business_id`, `last_interaction`, `conversation_summary`, `preferences`, `order_history`.
3. **Agent memory injection**: inyectar contexto de memoria en el system prompt del agente (Telegram y WhatsApp) con los últimos N resúmenes de conversación.
4. **Decision persistence**: el agente puede guardar decisiones vía tool (`save_decision` → DB) para recordar entre sesiones.
5. **Vector store** (futuro): embeddings de conversaciones para búsqueda semántica.

### 4.3 Prioridades

| Prioridad | Feature | Impacto | Esfuerzo |
|-----------|---------|---------|----------|
| P0 | Expandir eventos de notificación | Alto (operaciones diarias) | Bajo |
| P0 | Template system por evento | Alto (consistencia) | Bajo |
| P0 | Fire-and-forget pattern | Medio (resiliencia) | Mínimo |
| P1 | Notification context en Redis | Alto (follow-ups del agente) | Medio |
| P1 | Customer memory table | Alto (personalización) | Medio |
| P1 | Inyección de memoria en prompt | Alto (mejora agente) | Medio |
| P2 | Decision persistence via tool | Medio (consistencia) | Alto |
| P3 | Vector store / semantic search | Bajo (mejora) | Alto |

### 4.4 Diferencias clave con ClinicForge

| Aspecto | ClinicForge | MuzApp (target) |
|---------|-------------|-----------------|
| Modelo de negocio | Consultas dentales (citas) | Rotisería (pedidos) |
| Eventos principales | Turnos, pagos, leads, urgencias | Pedidos, cancelaciones, stock, leads WhatsApp |
| Multi-tenancy | Clínicas independientes | Misma marca, canales separados |
| Memoria | No existe (solo notif context) | Customer memory + notif context |
| Agente | Clínico (triaje, sintomas) | Comercial (ventas, productos) |
| Lead recovery | Secuencia 3-touch con conversión | Secuencia similar para WhatsApp |
| Urgencia | Triage clínico (dolor, sangrado) | Urgencia operativa (stock, reclamos) |

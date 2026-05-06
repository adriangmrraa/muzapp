# Specs: Canales Unificados — Adaptado de ClinicForge

## Patrones Extraídos de ClinicForge

### 1. Arquitectura de Mensajería
- **Tabla `chat_conversations`** separada de mensajes (no JSONB monolítico)
- **Tabla `chat_messages`** individual por mensaje (BigSerial, no JSONB array)
- **Router de canales**: cada canal (whatsapp, telegram, instagram) unificado por `channel` + `provider`
- **Deduplicación**: tabla `inbound_messages` con `(provider, provider_message_id)` UNIQUE
- **Human override**: campo `human_override_until` para intervención manual con TTL
- **Last message preview**: campo `last_message_preview` para sidebar rápido sin join

### 2. Media Handling
- **content_attributes JSONB** en cada mensaje: `[{type, url, file_name, file_size, mime_type, transcription}]`
- **Media proxy** con URLs firmadas (HMAC + expiry) para seguridad
- **Storage local** en `/uploads/{tenant}/{uuid}.{ext}` con fallback a URL original
- **Audio transcription** via OpenAI Whisper
- **Allowed domains** whitelist para SSRF protection al descargar

### 3. Patient/Lead Documents
- **Tabla `patient_documents`** separada: file_name, file_path, mime_type, document_type, source, source_details
- **Auto-attach**: cuando llega media de un contacto conocido → se guarda en su ficha
- **LLM summary**: Vision API analiza imagen → GPT-4o-mini genera resumen → guarda en `clinical_record_summaries`
- **DocumentGallery** component: drag&drop upload, grid display, preview modal

### 4. Real-time
- **Socket.IO** con rooms por tenant
- **Eventos**: NEW_MESSAGE, HUMAN_OVERRIDE_CHANGED, CHAT_UPDATED
- **Frontend polling** como fallback + WebSocket como primary

### 5. Meta OAuth
- **Popup flow**: FB.login() → code → backend /connect → exchange token → encrypt → store
- **Wizard steps**: Select clinic → Select portfolio → Select ad account → Connect
- **Disconnect**: cleanup completo (webhooks, conversations, credentials)
- **Status endpoint**: muestra assets conectados (pages, instagram, whatsapp WABAs)

### 6. Prompt Engineering
- **JARVIS Principle**: ejecutar inmediato, no decir "dejame revisar"
- **Inferencia inteligente**: deducir parámetros faltantes del contexto
- **Page-based modes**: prompt varía según dónde está el usuario
- **Emotional flows** (F1-F9): detección de keywords → respuesta empática específica
- **24h window rules**: mensajes libres dentro de 24h, templates fuera
- **CTA routes**: keywords específicos → pitch + URL específico

---

## ADAPTACIÓN A MRS MUZZARELLA

### Diferencias clave con ClinicForge:
| ClinicForge | Mrs Muzzarella |
|-------------|----------------|
| Python FastAPI + React SPA | Next.js 16 fullstack (server components) |
| PostgreSQL + Alembic | PostgreSQL (Neon) + Drizzle ORM |
| UUID primary keys | Serial integers |
| Multi-tenant (tenants table) | Single-tenant |
| Chatwoot integration | Directo YCloud + Telegram |
| Redis para state | Sin Redis (state en DB o memory) |
| Socket.IO real-time | Polling + revalidate (Next.js) |
| 24+ agent tools | 7 WhatsApp + 4 Telegram tools |

### Decisiones de adaptación:
1. **NO Socket.IO** → usar Next.js `revalidatePath` + polling con `setInterval` (cada 3s en chat activo)
2. **NO Redis** → conversation state en DB directamente
3. **NO multi-tenant** → eliminar tenant_id de todo
4. **Media storage** → `/public/uploads/` local (Render persistent disk o migrar a Cloudinary)
5. **Mantener**: estructura de tablas separadas (conversations + messages), media proxy, content_attributes pattern, human override, deduplication

---

## Fase 1: Mensajes Unificados

### 1.1 Schema Migration

**Nuevo enum y campos en `src/db/schema.ts`**:

```typescript
export const channelEnum = pgEnum("channel", ["whatsapp", "telegram"]);
export const messageRoleEnum = pgEnum("message_role", ["user", "assistant", "system", "human"]);

// NUEVA tabla: chat_messages (reemplaza JSONB array)
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id),
  role: messageRoleEnum("role").notNull(),
  content: text("content").notNull(),
  contentAttributes: jsonb("content_attributes").default([]),  // media attachments
  platformMessageId: varchar("platform_message_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// MODIFICAR conversations: agregar channel, quitar messages JSONB
// Agregar a conversations:
//   channel: channelEnum("channel").notNull().default("whatsapp"),
//   lastMessageAt: timestamp("last_message_at"),
//   lastMessagePreview: varchar("last_message_preview", { length: 255 }),
//   humanOverrideUntil: timestamp("human_override_until"),
//   externalUserId: varchar("external_user_id", { length: 255 }), // chatId para TG, phone para WA
```

**Migración**: mantener `messages` JSONB temporalmente para backward compat, migrar datos, luego eliminar.

### 1.2 Message Router

**Nuevo archivo: `src/lib/channels/router.ts`**

```typescript
export type Channel = "whatsapp" | "telegram";

export interface IncomingMessage {
  channel: Channel;
  externalUserId: string;  // phone para WA, chatId para TG
  senderName: string;
  content: string;
  messageId: string;  // para deduplicación
  contentAttributes?: MediaAttachment[];
}

export interface MediaAttachment {
  type: "image" | "audio" | "document" | "video";
  url: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  caption?: string;
  transcription?: string;
}

export async function routeIncomingMessage(msg: IncomingMessage): Promise<void> {
  // 1. Deduplicación por messageId
  // 2. Find or create conversation (channel + externalUserId)
  // 3. Insert chat_message
  // 4. Update conversation lastMessageAt + lastMessagePreview
  // 5. Capture lead if new
  // 6. Process with agent (if not human_override)
  // 7. Insert assistant response as chat_message
  // 8. Send response via correct channel
}

export async function sendOutboundMessage(
  conversationId: number,
  content: string,
  attachments?: MediaAttachment[]
): Promise<void> {
  // 1. Read conversation to get channel + externalUserId
  // 2. Switch on channel:
  //    - whatsapp → YCloud API
  //    - telegram → Telegram Bot API
  // 3. Insert chat_message with role "human" or "assistant"
  // 4. Update conversation lastMessageAt
}
```

### 1.3 Telegram Conversation Persistence

**Modificar `src/app/api/telegram/webhook/[token]/route.ts`**:
- Construir `IncomingMessage` con channel: "telegram"
- Llamar a `routeIncomingMessage()` en vez de handler directo
- El router persiste y procesa

**Modificar `src/app/api/whatsapp/webhook/route.ts`**:
- Construir `IncomingMessage` con channel: "whatsapp"
- Llamar a `routeIncomingMessage()`
- Eliminar lógica duplicada de findOrCreate/appendMessage

### 1.4 UI — Inbox Split-Panel

**Componentes** (adaptados del ChatsView de ClinicForge):

#### `src/app/(admin)/admin/conversations/page.tsx` (server)
```typescript
// Fetch initial conversations (últimas 50, ordered by lastMessageAt DESC)
// Pass to client component
// revalidatePath on POST actions
```

#### `src/app/(admin)/admin/conversations/conversations-inbox.tsx` (client)
```typescript
// State: selectedId, filter (channel, status), searchQuery
// Layout: flex con sidebar (w-80) + chat panel (flex-1)
// Polling: cada 3s fetch nuevas conversaciones si page está activa
// Mobile: conditional render sidebar/chat con back button
```

#### `src/components/messages/conversation-sidebar.tsx`
```typescript
// Props: conversations[], selectedId, onSelect, onSearch, onFilter
// Search input con debounce 300ms
// Filter pills: Todos | WhatsApp | Telegram | Activos | Cerrados
// List: ConversationItem[] con virtualización si >100
// Selected: border-left gold, bg slightly lighter
```

#### `src/components/messages/conversation-item.tsx`
```typescript
// Props: conversation, isSelected, onClick
// Layout: avatar (inicial) | name + preview | time + badge
// ChannelBadge: WA (green bg) o TG (blue bg)
// Time: relative (hace X min/horas/días) via date-fns
// Unread dot: gold circle si hay mensajes sin leer
```

#### `src/components/messages/chat-panel.tsx`
```typescript
// Props: conversationId
// Fetch messages on mount + polling cada 3s
// Auto-scroll al fondo en nuevos mensajes
// Header: nombre, teléfono, channel badge, status, botón human override
// Messages: lista con date separators
// Footer: ReplyInput
```

#### `src/components/messages/message-bubble.tsx`
```typescript
// Props: message (ChatMessage type)
// Alineación: user=left, assistant/human=right
// Contenido: text + MediaRenderer si tiene contentAttributes
// Timestamp: HH:mm en esquina inferior
// Colores: user=white/5, assistant=gold/10, human=blue/10
```

#### `src/components/messages/reply-input.tsx`
```typescript
// State: text, attachments[], sending
// Textarea auto-resize (1-4 líneas)
// Enter=enviar, Shift+Enter=newline
// Botón adjuntar (📎) → file picker
// Preview de attachments antes de enviar
// Botón enviar (dorado, disabled si vacío)
// Indicador: "Enviando por WhatsApp..." / "Enviando por Telegram..."
```

#### `src/app/(admin)/admin/conversations/actions.ts`
```typescript
"use server"

export async function sendReply(conversationId: number, content: string)
// Usa sendOutboundMessage del router

export async function getMessages(conversationId: number, limit?: number, offset?: number)
// Query chat_messages table, ordered by createdAt ASC

export async function updateStatus(conversationId: number, status: string)
// Update conversation status

export async function toggleHumanOverride(conversationId: number, enabled: boolean)
// Set humanOverrideUntil = now + 24h (o null)

export async function searchConversations(query: string, channel?: string, status?: string)
// ILIKE search en customerName, customerPhone, lastMessagePreview
```

### 1.5 Estilos y UX

- Dark theme: `bg-[#0a0a0a]`
- Sidebar: `bg-[#0f0f0f]` con border-right `rgba(212,160,23,0.1)`
- Selected conversation: `border-l-2 border-[#D4A017] bg-[rgba(212,160,23,0.05)]`
- Message bubbles: rounded-xl, padding-3
- User bubble: `bg-white/5 text-white`
- Assistant bubble: `bg-[rgba(212,160,23,0.1)] text-white`
- Human bubble: `bg-blue-500/10 text-white` con badge "Manual"
- Input area: glassmorphism `bg-white/5 backdrop-blur-sm border border-white/10`
- Send button: `bg-gradient-to-r from-[#D4A017] to-[#F5A623]`
- Animations: Framer Motion — stagger en lista, fade en mensajes nuevos

---

## Fase 2: Media Handling

### 2.1 Recepción de Media (WhatsApp)

**Modificar webhook para NO ignorar media**:
- Aceptar: `text`, `image`, `audio`, `document`, `video`
- Para media: extraer `mediaId` del payload YCloud
- Descargar: `GET https://api.ycloud.com/v2/whatsapp/media/{mediaId}` con API key

**Nuevo: `src/lib/media/downloader.ts`**
```typescript
const ALLOWED_DOMAINS = ["api.ycloud.com", "cdn.ycloud.com"];

export async function downloadMedia(url: string, apiKey: string): Promise<Buffer>
// Validate URL domain (SSRF protection)
// Download with timeout 30s
// Return buffer

export async function saveMediaLocally(
  buffer: Buffer,
  conversationId: number,
  originalFilename: string,
  mimeType: string
): Promise<string>
// Path: /public/uploads/{conversationId}/{timestamp}-{sanitized-filename}
// Ensure dir exists
// Write buffer
// Return relative URL: /uploads/{conversationId}/{filename}
```

### 2.2 Content Attributes Pattern

Cada mensaje con media tiene `contentAttributes` JSONB:
```json
[
  {
    "type": "image",
    "url": "/uploads/42/1715000000-foto.jpg",
    "fileName": "foto.jpg",
    "fileSize": 245000,
    "mimeType": "image/jpeg",
    "caption": "Mira este pan"
  }
]
```

### 2.3 Audio Transcription

**Nuevo: `src/lib/media/transcription.ts`**
```typescript
export async function transcribeAudio(audioUrl: string): Promise<string>
// Download audio
// Send to OpenAI Whisper API
// Return transcription text
// Fallback: return "[Audio sin transcripción]"
```

Cuando llega audio → transcribir → guardar transcription en contentAttributes → pasar texto al agente como contexto.

### 2.4 Media Proxy API

**Nuevo: `src/app/api/media/[...path]/route.ts`**
```typescript
export async function GET(req, { params }) {
  // Serve files from /public/uploads/
  // Set correct Content-Type
  // Cache-Control: private, max-age=3600
  // Validate path (no directory traversal)
}
```

### 2.5 UI Media Renderers

**Nuevo: `src/components/messages/media-renderer.tsx`**
```typescript
// Adaptado de ClinicForge MessageMedia.tsx
// Switch por type:
// - image: <img> clickeable con lightbox (dialog)
// - audio: <audio controls> + transcription text si existe
// - document: card con icono + nombre + size + botón download
// - video: <video controls>
// URL proxying: prepend host si es path relativo
```

### 2.6 Upload desde Admin (Reply con media)

**Modificar reply-input**:
- File picker acepta: image/*, audio/*, .pdf, .doc, .docx
- Max size: 16MB (límite WhatsApp)
- Preview: thumbnail para imágenes, nombre+size para docs
- Server action: `sendMediaReply(conversationId, formData)`

---

## Fase 3: Attachments en Leads

### 3.1 Tabla attachments

```typescript
export const attachments = pgTable("attachments", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").references(() => leads.id),
  conversationId: integer("conversation_id").references(() => conversations.id),
  messageId: integer("message_id").references(() => chatMessages.id),
  type: varchar("type", { length: 20 }).notNull(),
  url: varchar("url", { length: 500 }).notNull(),
  fileName: varchar("file_name", { length: 255 }),
  mimeType: varchar("mime_type", { length: 100 }),
  fileSize: integer("file_size"),
  caption: varchar("caption", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow(),
});
```

### 3.2 Auto-attach en Router

En `routeIncomingMessage()`, después de guardar media:
1. Buscar lead por externalUserId (phone/chatId)
2. Si existe → crear row en `attachments` con `leadId`
3. Si no existe → crear solo con `conversationId` (se linkea cuando se capture el lead)

### 3.3 UI Attachment Gallery

**Nuevo: `src/components/attachments/attachment-gallery.tsx`**
```typescript
// Props: leadId
// Fetch: server action getAttachmentsByLead(leadId)
// Display:
//   - Images: grid 3 cols con thumbnails clickeables
//   - Audio: lista con player inline
//   - Documents: lista con icono + nombre + download button
// Empty state: "Sin archivos adjuntos"
```

**Integrar en lead detail** (leads-table.tsx modal):
- Nueva sección debajo de info del lead
- Tab o accordion "Archivos (N)"
- Contador en badge de la tabla principal

---

## Fase 4: Meta Business Connect

### 4.1 OAuth Flow (adaptado del MetaConnectionWizard)

**Simplificado para single-tenant**:
1. Admin clickea "Conectar con Meta"
2. Popup abre: `https://www.facebook.com/v22.0/dialog/oauth?client_id={META_APP_ID}&redirect_uri={host}/api/meta/callback&scope=whatsapp_business_management,whatsapp_business_messaging&state={csrf_token}`
3. Usuario autoriza en Meta
4. Meta redirige a callback con `?code=XXX&state=YYY`
5. Backend: exchange code → long-lived token → encrypt → save en agentConfig
6. Popup se cierra, página refresh muestra "Conectado"

### 4.2 Archivos

**`src/lib/meta/oauth.ts`**:
```typescript
export function buildMetaOAuthUrl(state: string): string
export async function exchangeCodeForToken(code: string, redirectUri: string): Promise<string>
export async function getConnectedAssets(accessToken: string): Promise<MetaAssets>
```

**`src/app/api/meta/callback/route.ts`**:
```typescript
// GET handler
// 1. Validate state (CSRF)
// 2. Exchange code for token
// 3. Encrypt token
// 4. Save in agentConfig (metaAccessToken, metaConnected, metaBusinessName)
// 5. Return HTML that calls window.opener.postMessage + window.close()
```

**`src/components/meta/meta-connect-button.tsx`**:
```typescript
// Si no conectado: botón dorado "Conectar con Meta Business"
//   → window.open(oauthUrl, popup)
//   → listen message event para close
// Si conectado: card verde con nombre de negocio + botón "Desconectar"
```

### 4.3 Meta Webhook Subscription

Después de conectar:
1. Suscribir webhook: `POST https://graph.facebook.com/v22.0/{app_id}/subscriptions`
2. Objeto: `whatsapp_business_account`
3. Fields: `messages`
4. Callback URL: `{host}/api/meta/webhook`
5. Verify token: generado y guardado encriptado

**`src/app/api/meta/webhook/route.ts`**:
```typescript
// GET: verification challenge (hub.mode, hub.verify_token, hub.challenge)
// POST: incoming messages from Meta Direct API
//   → Parse → routeIncomingMessage({ channel: "whatsapp", provider: "meta_direct" })
```

---

## Fase 5: Telegram Tools + Prompt Proactivo

### 5.1 Nuevos Tools Telegram (6 adicionales)

```typescript
// src/lib/telegram/tools.ts — AGREGAR:

const getClientsTool = tool({
  description: "Lista los últimos 20 clientes/leads",
  parameters: z.object({}),
  execute: async () => {
    // Query leads ORDER BY createdAt DESC LIMIT 20
    // Return: name, phone, status, tags, lastOrder date
  }
});

const getClientDetailTool = tool({
  description: "Detalle completo de un cliente",
  parameters: z.object({ query: z.string() }), // phone o nombre
  execute: async ({ query }) => {
    // Search leads by phone or name (ILIKE)
    // Include: últimos 3 pedidos, conversación activa, tags, attachments count
  }
});

const searchClientTool = tool({
  description: "Buscar clientes por nombre o teléfono",
  parameters: z.object({ query: z.string() }),
  execute: async ({ query }) => {
    // ILIKE search en name, phone, email
    // Return top 5 matches
  }
});

const updateOrderStatusTool = tool({
  description: "Cambiar estado de un pedido",
  parameters: z.object({
    orderId: z.number(),
    status: z.enum(["preparing", "ready", "delivered", "cancelled"]),
  }),
  execute: async ({ orderId, status }) => {
    // Update orders SET status WHERE id
    // Return confirmation
  }
});

const getAnalyticsTool = tool({
  description: "Métricas de ventas y pedidos",
  parameters: z.object({ period: z.enum(["today", "week", "month"]).default("today") }),
  execute: async ({ period }) => {
    // Count orders by period
    // Sum revenue
    // Count new leads
    // Top products
  }
});

const getBusinessHoursTool = tool({
  description: "Horarios de atención configurados",
  parameters: z.object({}),
  execute: async () => {
    // Read agentConfig.businessHours
    // Return formatted schedule + "abierto/cerrado ahora"
  }
});
```

### 5.2 Prompt Proactivo WhatsApp (~150 líneas)

**Estructura del nuevo `DEFAULT_SYSTEM_PROMPT`** en `src/lib/whatsapp/prompt-builder.ts`:

```
# IDENTIDAD
Sos el asistente virtual de Mrs Muzzarella, rotisería premium en Formosa.
Tono: rioplatense informal, amigable, directo. Como un amigo que labura ahí.
Nombre: no te presentás con nombre propio, sos "Mrs Muzzarella".

# PRINCIPIO JARVIS (de ClinicForge)
Ejecutás inmediatamente. No decís "dejame ver" ni "un momento".
Si tenés la info → respondés. Si necesitás buscar → usás el tool y respondés.

# KEYWORDS DE INTENCIÓN
- Saludo (hola, buenas, buen día) → Saludá + mostrá las categorías disponibles
- Pedido (quiero, dame, necesito, pedido, pedir) → Confirmá qué quiere, cantidad, delivery/retiro
- Precio (cuánto, sale, precio, cuesta) → Usá getMenu y mostrá precios actuales
- Delivery (traen, envían, delivery, llega, zona) → Usá checkDelivery con la zona
- Horario (horario, abierto, cerrado, atienden, hasta qué hora) → Usá getBusinessHours
- Disponibilidad (tienen, hay, queda) → Usá checkAvailability
- Humano (persona, humano, hablar con alguien, encargado) → Usá transferToHuman
- Menú (menú, carta, qué tienen, opciones) → Usá getMenu sin filtro

# FLUJO DE CONVERSACIÓN
1. SALUDO: "¡Buenas! 🙌 ¿Qué te puedo ayudar? Tenemos hamburguesas de pollo y carne, o pan al por mayor."
2. INTERÉS: Detectar qué quiere → mostrar opciones relevantes
3. PEDIDO: Confirmar items + cantidades + delivery/retiro
4. CONFIRMACIÓN: Resumen completo antes de crear → "¿Confirmo este pedido?"
5. CIERRE: Dar tiempo estimado + agradecer → "¡Listo! En 30-40 min lo tenés. Gracias!"

# USO DE TOOLS — REGLAS
- getMenu: SIEMPRE que pregunten precios o qué hay. NUNCA inventar precios.
- checkAvailability: cuando preguntan por un producto específico.
- createOrder: SOLO después de confirmación EXPLÍCITA del cliente ("sí", "dale", "confirmado").
- getBusinessHours: ante CUALQUIER consulta de horarios.
- checkDelivery: cuando mencionan una zona o preguntan si llegan.
- transferToHuman: cuando no podés resolver O el cliente lo pide O detectás frustración.
- listAvailableProducts: cuando quieren ver todo lo disponible ahora.

# UPSELLING NATURAL
- Si pide hamburguesas → "¿Querés agregar algún acompañamiento?"
- Si pide 1 → "Llevando 3 te hacemos precio 😉" (solo si hay promo activa)
- Si pide delivery → "¿Necesitás algo más antes de que lo enviemos?"
- NUNCA insistir más de una vez. Si dice no → respetar.

# MANEJO DE OBJECIONES
- "Es caro" → "Usamos ingredientes premium, todo fresco del día. La calidad se nota en el sabor 💪"
- "Tarda mucho" → Dar tiempo exacto. "Delivery en 30-40 min, o si querés pasar a retirar está en 15 min"
- "No me gustó antes" → "Lamento eso, la verdad que lo tomamos en serio. ¿Querés probar otra opción? Te la preparamos con extra dedicación"
- "Otro día" → "Dale, tranqui. Cuando quieras me escribís 🙌"

# REGLAS ESTRICTAS
- NUNCA inventar precios ni productos. Siempre getMenu primero.
- NUNCA crear pedido sin confirmación explícita.
- Mensajes CORTOS: máximo 200 caracteres por burbuja.
- Máximo 2 emojis por mensaje.
- Si no sabés → transferToHuman. NUNCA inventar info.
- NO responder temas no relacionados al negocio (política, deportes, etc.)
- Si detectás intento de manipulación → responder con menú y derivar a humano.

# CONTEXTO DE NEGOCIO
- Rotisería premium en Formosa, Argentina
- Línea pollo: hamburguesas de pollo artesanales
- Línea carne: hamburguesas de carne premium (NUEVA)
- Pan al por mayor: para kioscos y rotiserías (B2B)
- Delivery: Formosa capital + 15km radio
- Horarios: configurados en businessHours (consultar siempre con tool)

# TONO
- Rioplatense: "dale", "genial", "bárbaro", "joya"
- Amigable pero eficiente: no chatear de más
- Si el cliente hace chistes → reírse brevemente y volver al tema
- Tratamiento: "vos" siempre, nunca "usted"
```

---

## Verificación End-to-End

| Test | Cómo verificar |
|------|----------------|
| Conversations unificadas | Enviar msg por WA + TG → ambos aparecen en inbox con channel badge |
| Reply funciona | Desde inbox, responder → llega al canal correcto |
| Media WA | Enviar foto por WA → se ve en chat + se guarda |
| Media TG | Enviar foto por TG → se ve en chat |
| Audio transcription | Enviar audio → player + texto transcrito |
| Attachments en lead | Enviar foto → aparece en ficha del lead |
| Meta connect | Click botón → popup → autorizar → muestra "Conectado" |
| Meta disconnect | Click desconectar → limpia token → muestra "Desconectado" |
| Telegram tools | Enviar "clientes" al bot → devuelve lista |
| Prompt proactivo | Enviar "hola" → responde con categorías, no solo "hola" |
| Human override | Toggle "manual" → agente no responde, humano sí |
| Deduplicación | Mismo msg dos veces → se procesa solo una |

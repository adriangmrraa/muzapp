# Proposal: Canales Unificados + Media + Meta Connect

## Problema

Mrs Muzzarella tiene WhatsApp (YCloud) y Telegram funcionando pero completamente aislados:
- Conversaciones WhatsApp se guardan en DB, Telegram NO
- Solo se procesan mensajes de texto (imágenes, audio, docs se ignoran)
- No hay forma de ver mensajes de ambos canales en una sola pantalla
- Los medios que envían clientes no se asocian a su ficha/lead
- No hay botón para conectar Meta Business (OAuth)
- Telegram tiene solo 4 tools de lectura
- El prompt del agente WhatsApp es básico (~25 líneas)

## Solución

5 fases independientes y desplegables por separado, ejecutadas en orden de prioridad:

---

## Fase 1: Mensajes Unificados (CRITICO)

### Objetivo
Página estilo ClinicForge con inbox split-panel que muestre conversaciones de WhatsApp Y Telegram en un solo lugar.

### Cambios de Schema
1. Agregar campo `channel` (enum: `whatsapp` | `telegram`) a tabla `conversations`
2. Extender estructura de mensajes JSONB para soportar `channel` origin por mensaje

### Cambios de Backend
1. **Telegram handler** → guardar conversaciones en DB (hoy solo procesa y responde, no persiste)
2. Crear `src/lib/telegram/conversation.ts` — findOrCreate + appendMessage para Telegram
3. Agregar campo `channel` al crear conversaciones desde WhatsApp webhook

### Cambios de UI
1. **Rebuild `/admin/conversations`** → inbox split-panel:
   - Sidebar izquierdo: lista de conversaciones con avatar, nombre, preview último mensaje, timestamp, badge de canal (WA/TG)
   - Panel derecho: thread completo con burbujas de chat
   - Input de respuesta que envía por el canal correcto (YCloud o Telegram API)
   - Filtros: todos, WhatsApp, Telegram, estado
2. Componentes nuevos:
   - `ConversationSidebar` — lista con search + filters
   - `ChatPanel` — thread + input
   - `MessageBubble` — burbuja individual con metadata
   - `ChannelBadge` — icono WA/TG

### Archivos a modificar
- `src/db/schema.ts` — channel enum + campo
- `src/app/api/whatsapp/webhook/route.ts` — pasar channel al crear
- `src/app/api/telegram/webhook/[token]/route.ts` — persistir conversaciones
- `src/lib/telegram/handler.ts` — conversation storage
- `src/app/(admin)/admin/conversations/page.tsx` — rebuild completo
- `src/app/(admin)/admin/conversations/[id]/page.tsx` — rebuild completo
- `src/app/(admin)/admin/conversations/conversations-table.tsx` — reemplazar por sidebar

### Archivos nuevos
- `src/lib/telegram/conversation.ts`
- `src/components/messages/conversation-sidebar.tsx`
- `src/components/messages/chat-panel.tsx`
- `src/components/messages/message-bubble.tsx`
- `src/components/messages/channel-badge.tsx`
- `src/app/(admin)/admin/conversations/actions.ts` — server actions para reply

---

## Fase 2: Media Handling

### Objetivo
Recibir, almacenar y mostrar imágenes, audio y documentos en el chat.

### Cambios de Schema
1. Extender mensaje JSONB:
```typescript
{
  id?: string
  role: "user" | "assistant"
  content: string
  timestamp?: string
  // NUEVO
  type: "text" | "image" | "audio" | "document" | "video"
  mediaUrl?: string
  mimeType?: string
  filename?: string
  caption?: string
}
```

### Cambios de Backend
1. **WhatsApp webhook** → dejar de ignorar mensajes no-text
2. Implementar descarga de media desde YCloud API (`GET /v2/whatsapp/media/{mediaId}`)
3. Guardar media en storage (local `/public/uploads/` o S3 si escala)
4. Pasar contexto de media al agente (descripción: "El cliente envió una imagen")

### Cambios de UI
1. `MessageBubble` → renderizar según `type`:
   - `image` → `<img>` con lightbox
   - `audio` → `<audio>` player nativo
   - `document` → link de descarga con icono + filename
   - `video` → `<video>` player
2. Input de chat → botón para adjuntar media (enviar vía YCloud/Telegram)

### Archivos a modificar
- `src/app/api/whatsapp/webhook/route.ts` — procesar media types
- `src/lib/whatsapp/conversation.ts` — extended message type
- `src/components/messages/message-bubble.tsx` — media renderers

### Archivos nuevos
- `src/lib/whatsapp/media.ts` — download + store media from YCloud
- `src/lib/media/storage.ts` — abstracción de storage (local/S3)
- `src/components/messages/media-renderer.tsx` — image/audio/doc/video renderers
- `src/app/api/media/[id]/route.ts` — serve media files

---

## Fase 3: Media → Leads/Attachments

### Objetivo
Asociar automáticamente los medios recibidos a la ficha del lead/cliente.

### Cambios de Schema
1. Nueva tabla `attachments`:
```sql
CREATE TABLE attachments (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES leads(id),
  conversation_id INTEGER REFERENCES conversations(id),
  type VARCHAR NOT NULL, -- image | audio | document | video
  url VARCHAR NOT NULL,
  mime_type VARCHAR,
  filename VARCHAR,
  caption VARCHAR,
  size INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Cambios de Backend
1. Al recibir media en webhook → crear attachment asociado al lead
2. Lookup: phone → lead → attach

### Cambios de UI
1. **Lead detail** → sección "Archivos adjuntos" con gallery
   - Grid de thumbnails para imágenes
   - Lista para audio/docs
   - Click para ver/descargar
2. **Client detail** → misma sección

### Archivos a modificar
- `src/db/schema.ts` — tabla attachments
- `src/app/api/whatsapp/webhook/route.ts` — crear attachment
- `src/app/(admin)/admin/leads/leads-table.tsx` — mostrar attachments en detail
- `src/app/(admin)/admin/clients/[id]/page.tsx` — mostrar attachments

### Archivos nuevos
- `src/components/attachments/attachment-gallery.tsx`
- `src/components/attachments/attachment-list.tsx`

---

## Fase 4: Meta Business Connect

### Objetivo
Botón OAuth para conectar cuenta de Meta Business y obtener access token para WhatsApp Business API.

### Flujo OAuth
1. Admin clickea "Conectar con Meta" → popup abre URL de Meta OAuth
2. Usuario autoriza permisos (whatsapp_business_management, whatsapp_business_messaging)
3. Meta redirige a callback con code
4. Backend intercambia code por access token
5. Token se encripta (AES-256-GCM) y guarda en DB
6. UI muestra estado "Conectado" con nombre de cuenta

### Archivos nuevos
- `src/lib/meta/oauth.ts` — OAuth flow helpers
- `src/app/api/meta/callback/route.ts` — OAuth callback endpoint
- `src/components/meta/connect-button.tsx` — botón con popup logic

### Archivos a modificar
- `src/db/schema.ts` — campos para Meta token en agentConfig
- `src/app/(admin)/admin/meta/page.tsx` — agregar botón conectar
- `src/app/(admin)/admin/meta/actions.ts` — save/check token

---

## Fase 5: Telegram Tools + Prompt Proactivo

### Objetivo
Ampliar capacidades del agente Telegram y mejorar el prompt del agente WhatsApp.

### Nuevos Tools Telegram
1. `getClients` — listar clientes recientes
2. `getClientDetail` — detalle de un cliente por ID/teléfono
3. `searchClient` — buscar por nombre/teléfono
4. `updateOrderStatus` — cambiar estado de pedido
5. `getAnalytics` — métricas de ventas (día/semana/mes)
6. `getBusinessHours` — horarios configurados

### Prompt Proactivo WhatsApp (~150 líneas)
1. Keywords de intención: "quiero", "pedir", "hola", "cuánto", "delivery"
2. Comportamiento proactivo: sugerir productos, upselling
3. Instrucciones detalladas de cuándo y cómo usar cada tool
4. Manejo de objeciones y dudas
5. Flujo de conversación paso a paso
6. Reglas de tono y personalidad expandidas

### Archivos a modificar
- `src/lib/telegram/tools.ts` — 6 nuevos tools
- `src/lib/telegram/system-prompt.ts` — expandir prompt
- `src/lib/whatsapp/prompt-builder.ts` — prompt proactivo ~150 líneas
- `src/lib/agent/system-prompt.ts` — sync con prompt-builder

---

## Dependencias entre Fases

```
Fase 1 (Mensajes Unificados) ──→ Fase 2 (Media Handling) ──→ Fase 3 (Attachments)

Fase 4 (Meta Connect)         ← independiente
Fase 5 (Tools + Prompt)       ← independiente
```

Fases 4 y 5 pueden ejecutarse en paralelo con cualquier otra fase.

## Decisiones Técnicas

| Decisión | Elección | Razón |
|----------|----------|-------|
| Storage de media | Local `/public/uploads/` primero, S3 después | MVP rápido, migrar cuando escale |
| Channel unification | Campo `channel` en conversations | Mínimo cambio de schema, máximo impacto |
| Telegram conversations | Reusar tabla conversations | No duplicar estructura, mismo inbox |
| Meta OAuth | Popup window | Patrón estándar, no pierde contexto del admin |
| Reply desde inbox | Server action → YCloud/Telegram API | Consistente con patrones existentes |

## Riesgos

1. **YCloud media API** — verificar que el plan actual soporte descarga de media
2. **Meta OAuth scopes** — depende de que la Meta App esté verificada
3. **Telegram conversation storage** — puede generar muchas rows si el bot es público
4. **Media storage** — `/public/uploads/` no persiste en Render (necesita S3 o Cloudinary eventualmente)

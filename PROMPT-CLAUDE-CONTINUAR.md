# 🤖 Prompt para Claude: Mrs Muzzarella - Completo

## Contexto del Proyecto

**Nombre**: Mrs Muzzarella
**Tipo**: E-commerce de hamburguesas premium en Formosa, Argentina
**Stack**: Next.js 16, Tailwind CSS, Drizzle ORM, PostgreSQL (Neon), YCloud WhatsApp API, Telegram Bot API, Vercel AI SDK v6
**Repo**: `adriangmrraa/muzapp` (deployado en Render)
**Engram**: Memoria persistente activa

---

## Lo Que Ya Está Implementado ✅

### 1. Telegram Bot Configurable
- Token se guarda en DB encriptado (AES-256-GCM)
- Leer desde `/admin/telegram`
- El webhook lee de DB primero, fallback a env
- **YA PUEDES PROBAR**:Anda a `/admin/telegram`, ingresa tu Bot Token, guardalo, y usalo desde Telegram

### 2. Encriptación Multi-Tenant
- `src/lib/encryption.ts` - funciones encrypt/decrypt
- Patrón listo para aplicar a otras APIs (YCloud, etc.)

### 3. WhatsApp Agent
- Sistema de conversación con herramientas: getMenu, checkHours, checkDelivery, captureOrder
- Prompts configurables desde admin
- Business hours configurable

### 4. Tipos de Productos
- Hamburguesas (pollo/carne)
- Pan Mayorista

---

## Lo Que FALTA Implementar ❌

### A. Botón "Conectar Meta" en Admin
- En `/admin/agent` falta botón para conectar Meta Business (Facebook)
- Similar al de ClinicForge: abrir popup de OAuth Meta

### B. Página de Mensajes Unificada (CRÍTICO)
- Debe mostrar conversaciones de **ambos canales**: WhatsApp (YCloud) + Telegram
- Ubicación: `/admin/conversations` o crear `/admin/messages`
- **Estilo ClinicForge**:
  - Sidebar con lista de conversaciones (avatar, nombre, preview, tiempo)
  - Panel derecho con mensajes completos
  - Input para responder
  - Indicador de canal (WA icon / Telegram icon)

### C. Manejo de Medios
- **Imágenes**: mostrar en el chat, guardar referencia en lead
- **Audio**: reproducir en el chat, guardar en lead
- **Documentos/Archivos**: descargar, guardar link en lead

### D. Adjuntar Medios a Leads/Fichas
- Cuando llega imagen/audio/doc de cliente → asociar al lead
- Guardar en DB: tabla attachments o en campo json del lead
- **Ver en**: `/admin/leads` y en ficha individual del lead

### E. Herramientas del Agente Telegram
- Agregar más tools (hoy son solo 4):
  - getClients
  - getClientDetail  
  - searchClient
  - updateOrderStatus
  - getAnalytics
  - getBusinessHours

### F. Prompt Proactivo para Agente
- Crear prompt de ~150 líneas (hoy tiene 25)
- Keywords para entender usuario ("quiero", "pedir", "hola")
- Comportamiento proactivo
- Cómo usar tools

---

## Estructura de Archivos Clave

```
src/
├── app/
│   ├── (admin)/admin/
│   │   ├── telegram/       ← Página configurable (ACABA DE QUEDAR)
│   │   ├── conversations/    ← Página de mensajes (HAY QUE HACER)
│   │   ├── leads/          ← Fichas de leads (parcial)
│   │   └── agent/           ← Config WhatsApp
│   └── api/
│       ├── telegram/webhook/
│       └── whatsapp/webhook/
├── components/
│   ├── products/           ← ProductCard, ProductGrid
│   ├── clients/           ← ClientTable, ClientDetail
│   └── messages/            ← (POR CREAR) ChatUI
├── lib/
│   ├── encryption.ts       ← encrypt/decrypt (LISTO)
│   ├── telegram/
│   │   ├── bot.ts          ← Config leer de DB
│   │   ├── handler.ts      ← Procesa mensajes
│   │   └── tools.ts        ← Solo 4 tools (AMPLIAR)
│   ├── whatsapp/
│   │   └── tools/
│   └── brain/              ← (POR CREAR) Lógica de negocio
└── db/
    └── schema.ts           ← agentConfig, leads, orders
```

---

## SDDs Existentes

```
sdd/
├── mrs-muzzarella-marketplace/  ← EXPLORAR ESTE
│   ├── explore.md
│   ├── proposal.md
│   ├── specs.md
│   └── tasks.md
└── telegram-bot-configurable/
    └── proposal.md            ← Lo que hice ahora
```

---

## Cómo Proceder

### Paso 1: Testear Telegram
1. Esperar deploy окончательный
2. Ir a `/admin/telegram`
3. Ingresar Bot Token + Chat ID + Guardar
4. Enviar "/start" al bot desde Telegram

### Paso 2: Planificar lo Demás
Una vez verificado que Telegram funciona, planificar con SDD:
- Crear SDD para "mensajes-unificados"
- Crear SDD para "media-handling"
- Crear SDD para "agente-telegram-proactivo"

### Paso 3: Ejecutar por Fases
Como en ClinicForge: una fase a la vez, con specs, tasks, verify, archive

---

## Commands Útiles

```bash
# Ver errores TypeScript
npx tsc --noEmit

# Build local
npm run build

# Deploy (automatico en push a main)
git push origin main
```

---

## Preguntar a Engram Antes de Codear

Antes de hacer cambios grandes, siempre:
```typescript
// Buscar en Engram
mem_search query="nombre del feature"
// o
mem_context project="muzapp"
```

---

## Notas para Claude (no opencode)

- Este proyecto usa **Engram** para memoria persistente (no es Claude Code)
- Trabajar en este repo: `C:\Users\Asus\Documents\estabilizacion\Mrs Muzzarella\muzapp`
- Usar mismo flujo SDD (Explore → Spec → Design → Tasks → Apply → Verify → Archive)
- Si algo no compile: `npx tsc --noEmit` inmediatamente

---

**El usuario necesita**: 
1. ✅ Probar Telegram Bot (ya configurado desde UI)
2. ⏳ Botón Meta en admin
3. ⏳ Página de mensajes estilo ClinicForge
4. ⏳ Manejo de medios (imágenes, audio, docs)
5. ⏳ Adjuntar medios a leads
# Prompt para Agent 2: Mrs Muzzarella Marketplace + UI Upgrade

## Contexto del Proyecto

**Proyecto**: Mrs Muzzarella (muzapp) — E-commerce de hamburguesas premium en Formosa, Argentina
**Stack**: Next.js 16, Tailwind CSS, Drizzle ORM, PostgreSQL (Neon), WhatsApp (YCloud), Telegram Bot
**Repo**: `adriangmrraa/muzapp` (deployado en Render)

---

## Objetivo General

Transformar el marketplace actual en una experiencia premium estilo **Citronela** (cards) + **ClinicForge** (dashboard dark), con flujo de pedidos automatizado via WhatsApp.

### Referencias Visuales
- **Citronela**: Cards con glassmorphism, gold accents, Playfair Display, imágenes premium, botón "Pedir por WhatsApp"
- **ClinicForge**: Dashboard dark (#0a0a0a), gold #D4A017, sidebar navigation, stats cards con glass effect, animaciones framer-motion

---

## Estado Actual (PROBLEMAS)

### 1. Build Falla en Render
El deploy no pasa por errores de TypeScript. Archivos con problemas:

```
ERRORES CRÍTICOS A ARREGLAR:

1. src/app/(admin)/admin/agent/page.tsx (línea 43)
   - Faltan autoReply24h, autoReply24hMessage, trainBotContext en el map

2. src/lib/client-utils.ts (línea 1)
   - Cannot find module './client' or its corresponding type declarations

3. src/lib/idempotency.ts (export)
   - createIdempotency → rename a createIdempotencyKey

4. src/app/api/telegram/webhook/[token]/route.ts (línea 10, 63)
   - Missing export 'createIdempotency', 'checkIdempotency'

5. src/components/products/product-detail.tsx (múltiples)
   - Faltan propiedades en ProductFromAPI: emoji, discountPercentage, ingredients, originalPrice, hasFreeShipping, soldCount

6. src/lib/logger.ts (línea 14)
   - pino default import type mismatch

7. src/lib/telegram/handler.ts y tools.ts
   - Type errors con CallSettings, tools
```

### 2. Features Faltantes
- No hay botón WhatsApp en ProductCard
- No hay order detection en agente
- No hay customer creation tags
- No hay UI premium

---

## SDD Guardado en Engram

Todo el contexto está guardado en Engram (topic_key: `architecture/mrs-muzzarella-marketplace`):

| Archivo | Contenido |
|--------|----------|
| `sdd/mrs-muzzarella-marketplace/explore.md` | Current state, problems, references |
| `sdd/mrs-muzzarella-marketplace/proposal.md` | Intent, scope (3 fases), approach |
| `sdd/mrs-muzzarella-marketplace/specs.md` | Requisitos detallados de las 3 fases |
| `sdd/mrs-muzzarella-marketplace/tasks.md` | 14 tareas con dependencias |

** Lekete en Engram primero**: `mem_search query="marketplace"` para ver explore + proposal + specs.

---

## Plan de Trabajo (3 Fases)

### Fase 1: Arreglar Build + WhatsApp Button (CRÍTICO)
**Objetivo**: Deploy funcional + botón WhatsApp en ProductCard

**Tareas**:
1. **Arreglar TODOS los errores TypeScript** (~20 errores)
   - client-utils.ts, idempotency.ts, product-detail.tsx, logger.ts, telegram tools
   - VERIFICAR: `npx tsc --noEmit` debe pasar SIN errores

2. **WhatsApp Button Component**
   - Crear componente `<WhatsAppButton product={...} />`
   - Incluir en ProductCard
   - Template mensaje: "Hola! Quiero pedir:\n- {product.name}\n- Precio: {price}"

3. **Actualizar Product Grid**
   - Responsive (1/2/3-4 columnas)

### Fase 2: Order Flow Automatizado
**Objetivo**: Agente procesa pedidos automáticamente

**Tareas**:
1. **Order Detection Tool**
   - Keywords: "quiero", "pedir", "me llevo", "dame", "una"
   - Pattern: `{cantidad} {product_name}`
   - Tool: `extractOrderFromMessage(text)`

2. **Customer Creation**
   - Si phone existe → update + tag "cliente"
   - Si nuevo → create + tag "lead"
   - Schema: leads, orders tables

3. **Telegram Notification (Lichas)**
   - Trigger: order_type = "pan_mayorista"
   - Env: TELEGRAM_LICHAS_CHAT_ID
   - Message format con cliente, items, total

4. **Orders Dashboard**
   - Vista /admin/orders
   - Tabla con estados, filtros

### Fase 3: UI Premium Upgrade
**Objetivo**: Dashboard estilo ClinicForge

**Tareas**:
1. **Theme & Tailwind Config**
   - Colors: dark-bg, gold #D4A017, orange #E8712A
   - Glassmorphism utilities

2. **Dashboard Cards**
   - Stats cards con glass effect
   - Animaciones stagger (framer-motion)

3. **Navigation Sidebar**
   - Componente sidebar
   - Collapse/expand
   - Mobile drawer

4. **Orders Table**
   - Columns: ID, Cliente, Items, Total, Estado, Fecha
   - Status badges
   - Actions dropdown

5. **Clients Cards**
   - Grid layout
   - Detail view
   - Tags management

---

## Referencias Técnicas

### Tech Stack
- Next.js 16 (App Router)
- Tailwind CSS
- Framer Motion (animaciones)
- Drizzle ORM (PostgreSQL Neon)
- YCloud WhatsApp API
- Telegram Bot API

### Estructura de Componentes
```
src/
├── app/
│   ├── (admin)/admin/
│   │   ├── page.tsx (dashboard)
│   │   ├── orders/page.tsx
│   │   └── clients/page.tsx
├── components/
│   ├── products/
│   │   ├── product-card.tsx
│   │   └── product-grid.tsx
│   ├── ui/ (shared components)
│   └── dashboard/ (stats cards, sidebar)
├── lib/
│   ├── whatsapp/ (order detection, message builder)
│   └── telegram/ (bot, tools)
└── db/
    └── schema.ts
```

### Estilos (Tailwind)
```css
/* Glassmorphism */
.glass {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(212, 160, 23, 0.15);
}

/* Gold accent */
.text-gold { color: #D4A017; }
.bg-gold { background: #D4A017; }

/* Dark premium */
.bg-dark { background: #0a0a0a; }
```

---

## Instrucciones para Agent 2

1. **Primero**: Busca en Engram el SDD → `mem_search query="marketplace"`
2. **Segundo**: Arregla TODOS los errores TypeScript → `npx tsc --noEmit`
3. **Tercero**: Commit "fix: TypeScript errors blocking build"
4. **Cuarto**: Implementa Fase 1 (WhatsApp button)
5. **Quinto**: Commit "feat: add WhatsApp button to ProductCard"
6. **Sexto**: Continúa con Fases 2 y 3

### Commits Esperados
- fix: TypeScript errors blocking build
- feat: add WhatsApp button to ProductCard
- feat: add order detection to agent
- feat: add customer creation with tags
- feat: add Telegram notification for pan mayorista
- feat: implement UI premium upgrade (dashboard)
- feat: add glassmorphism and animations
- fix: responsive product grid

---

## Success Criteria

- [ ] `npx tsc --noEmit` pasa sin errores
- [ ] Deploy en Render exitoso
- [ ] ProductCard tiene botón "Pedir por WhatsApp"
- [ ] Click botón → WhatsApp con mensaje precargado
- [ ] Agente detecta "quiero 2 genesis"
- [ ] Cliente se crea/actualiza con tags
- [ ] Pan mayorista → notificación Telegram a Lichas
- [ ] Dashboard estilo ClinicForge (dark + gold)
- [ ] Animaciones framer-motion funcionando
- [ ] Responsive en mobile/tablet/desktop

---

## Preguntas o Bloqueos

Si te bloquiás en algo, documentalo en Engram con `mem_save` y continuá con lo siguiente.
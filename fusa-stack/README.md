# Fusa Stack - Metodologías Aplicables a Mrs Muzzarella (Render)

> Adaptado de FUSA LABS para deploy en **Render** (no Vercel). Todo lo que no rompe, aplica.

---

## ✅ Lo Que Aplicamos

### 1. Arquitectura Modular (Component-Based)
```
src/components/
├── ui/         # Botones, inputs, cards (estilo shadcn/ui)
├── products/   # ProductCard, ProductGrid
├── clients/    # ClientTable, ClientDetail
├── cart/       # CartDrawer
└── [feature]/ # Por feature
```

### 2. SDD Workflow (Spec-Driven Development)
```
sdd/[nombre-del-change]/
├── explore.md   # Investigar opciones, trade-offs
├── proposal.md # Intent, scope, approach
├── specs.md    # Requisitos completos
├── design.md   # Decisiones архитектурные
├── tasks.md    # Tareas priorizadas
└── archive/    # Historial
```

**Flujo:** Explore → Propose → Spec → Design → Tasks → Apply → Verify → Archive

### 3. Drizzle ORM + Neon (PostgreSQL)
- Schema typesafe
- Migraciones controladas
- Queries tipo-seguros

### 4. AI SDK v6 (para agentes)
- Herramientas con `inputSchema`
- `.optional()` para tools sin input
- `execute: async (options) => {}`

### 5. Engram (Memoria Persistente)
- Guardar decisiones clave
- Session summaries al cerrar
- Buscar decisiones previas

### 6. Git Flow + Conventional Commits
```
feat:     # Nueva feature
fix:     # Bug fix
refactor:# Cambios que no suman features
docs:    # Documentación
test:    # Tests
chore:   # Config, deps
```

---

## ⚙️ Configuración Render

### Environment Variables
```env
# DB (Neon)
DATABASE_URL=postgresql://...

# Auth
AUTH_SECRET=...
FACEBOOK_CLIENT_ID=...
FACEBOOK_CLIENT_SECRET=...

# APIs
OPENAI_API_KEY=sk-...
YOUTUBE_API_KEY=...

# WhatsApp (YCloud)
YCLOUD_API_KEY=...
WHATSAPP_BOT_NUMBER=...

# Telegram
TELEGRAM_BOT_TOKEN=...
TELEGRAM_WEBHOOK_TOKEN=...
```

### Build Command
```bash
npm install && npm run build
```

### Start Command
```bash
npm start
```

---

## 🔧 Herramientas Integradas (ya en el proyecto)

| Herramienta | Estado | Uso |
|------------|--------|------|
| Next.js 16 | ✅ | App Router |
| Tailwind CSS | ✅ | Estilos |
| Framer Motion | ✅ | Animaciones |
| Drizzle ORM | ✅ | DB |
| Neon PostgreSQL | ✅ | Database |
| NextAuth.js | ✅ | Auth (Facebook) |
| AI SDK v6 | ✅ | Agentes IA |
| YCloud | ✅ | WhatsApp |
| Telegram Bot | ✅ | Notificaciones |

---

## 📋 Convenciones Aplicadas

### Naming
- Archivos: `kebab-case.tsx`
- Componentes: `PascalCase`
- Funciones: `camelCase()`
- Constantes: `UPPER_CASE`

### Patrones
- **Container-Presentational**: lógica en lib/, UI en components/
- **Feature-Based**: components/products/, lib/whatsapp/tools/
- **Data Access Layer**: lib/brain/, lib/agents/

---

## 🛡️ Errores a Evitar

1. ❌ Código sin entender fundamentos
2. ❌ " vibecoding" (sin arquitectura)
3. ❌ commits sin conventional commits
4. ❌ Build sin verificar `npx tsc --noEmit`
5. ❌ features sin SDD specs

---

## 📚 Recursos

- [AI SDK v6](https://v6.ai-sdk.dev)
- [Drizzle ORM](https://orm.drizzle.team)
- [Neon Docs](https://neon.tech/docs)
- [Next.js](https://nextjs.org)
- [Render Docs](https://render.com/docs)
# Muzapp

**Open-source commerce + AI-agent platform for local businesses.**

Storefront, WhatsApp ordering with an AI sales agent, admin dashboard, Telegram internal bot, Meta Ads attribution, and analytics — all configurable from the UI, all credentials stored in the database. Deploy it, add your business data, start selling.

Originally built for a real food business in Formosa, Argentina. Released by **[formosa.dev.ar](https://formosa.dev.ar)** (Fusa Labs) as a free resource — use it for personal projects or commercially.

```
Storefront (Next.js)  ─┐
WhatsApp (YCloud)     ─┼─►  Agent layer (OpenAI-compatible)  ─►  PostgreSQL
Telegram internal bot ─┘        ▲ tools: orders, catalog, customers, analytics
Admin panel (/admin)            └── business config lives in DB, editable from UI
```

## Features

- **Storefront** — animated product pages, cart, checkout that hands off to WhatsApp, attribution-aware CTAs.
- **WhatsApp AI agent** — answers customers, takes orders, sends catalog images, escalates to humans. OpenAI-compatible providers only (OpenAI, OpenRouter, DeepSeek, Groq, Together, Ollama).
- **Admin panel** — products CRUD, order/kitchen board, conversations inbox with human override, leads with UTM attribution, analytics, and **full business/agent configuration**.
- **Telegram internal bot** — manage orders, clients and metrics from Telegram (allowlist-gated).
- **Meta Ads integration** — pixel + Conversions API + signed attribution links (`ref:` codes).
- **Infra** — rate limiting, message buffer, Redis queue with DLQ (Upstash), circuit breaker, idempotent webhooks, HMAC signature checks.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4 · Framer Motion · Drizzle ORM · PostgreSQL · NextAuth v5 · Vercel AI SDK · Zod · Cloudinary (uploads) · Upstash Redis (optional) · Render-ready.

## Quick start (local)

```bash
git clone https://github.com/adriangmrraa/muzapp.git
cd muzapp
npm install
cp .env.example .env.local   # fill in DATABASE_URL + AUTH_SECRET at minimum

npm run db:push              # create schema
npm run dev                  # http://localhost:3000
```

**First access:** open `/setup` — it creates the first admin account. The page only works while the `users` table is empty, then locks itself permanently. `/login` redirects to `/setup` automatically on a fresh database.

Then `/admin/agent` covers everything else: business identity, WhatsApp number, YCloud key, AI provider key/models, integration secrets, hours, delivery zones, prompts.

> Alternative for scripted setups: `ADMIN_EMAIL=you@example.com ADMIN_PASSWORD="strong-password" npm run db:seed`. The seed **never creates default credentials**. Add `SEED_DEMO=1` for the demo catalog.

## Deploy to Render

### 1. Services

| Service | Type | Notes |
|---|---|---|
| Web service | Node | `buildCommand: npm install && npm run build`, `startCommand: npm start` |
| PostgreSQL | Neon / Render PG / any Postgres | connection string → `DATABASE_URL` |
| Upstash Redis | optional | buffer/DLQ/rate-limit persistence |

### 2. Required env vars

| Var | Why |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `AUTH_SECRET` | Sessions, credential encryption, attribution signing — `openssl rand -base64 32` |
| `AUTH_URL` | `https://your-app.onrender.com` — auth callbacks + origin checks |
| `NEXT_PUBLIC_APP_URL` | Same public URL — checkout origin allowlist, generated links |

### 3. Bootstrap the first admin

No shell needed — after the deploy is live, open **`https://your-app.onrender.com/setup`** and create your admin account. The page exists only while the `users` table is empty (race-safe via an advisory lock), then it redirects to `/login` forever.

> Scripted alternative: `npm run db:push` then `ADMIN_EMAIL=you@example.com ADMIN_PASSWORD="..." npm run db:seed` from a Render shell.

### 4. Configure everything from the UI

Log in at `/login`, then `/admin/agent` covers: business identity (name, tagline, address, phone, Instagram, website, description), YCloud API key + webhook secret, bot number, prompts, hours, delivery zones, payment aliases, **AI provider credentials** (API key, base URL, main/fast/vision models), and the **Integraciones** card (Cloudinary, Meta app creds, Telegram notify chat, cron secret, escalation email).

Secrets are write-only: fields show whether a key is configured, an empty submit keeps the stored value, and `CLEAR` removes it. Values never return to the browser and are stored **AES-256-GCM encrypted** (key derived from `AUTH_SECRET`) — a database dump alone doesn't leak credentials.

### 5. Optional integrations (env or UI)

Everything below can be set in `/admin/agent` → Integraciones — env vars are only a bootstrap fallback (DB wins). `NEXT_PUBLIC_*` vars are the exception: they're compiled into the client bundle at build time and must be env vars.

| Integration | Vars | UI-configurable |
|---|---|---|
| YCloud / WhatsApp | `YCLOUD_API_KEY`, `YCLOUD_WEBHOOK_SECRET`, `WHATSAPP_PHONE_NUMBER` | ✅ all |
| AI provider | `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `AI_MODEL`, `AI_MODEL_FAST`, `AI_MODEL_VISION` | ✅ all |
| Cloudinary | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — needed for admin image uploads | ✅ all |
| Telegram | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ALLOWED_CHAT_IDS` (also via `/admin/telegram`), `TELEGRAM_LICHAS_CHAT_ID` → "Chat ID de avisos" | ✅ all |
| Meta | `META_APP_ID`, `META_APP_SECRET`, `META_WEBHOOK_VERIFY_TOKEN` | ✅ all |
| Meta pixel | `NEXT_PUBLIC_META_PIXEL_ID` | ❌ build-time only |
| Redis | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | ❌ infra — env only |
| Cron | `CRON_SECRET` for `/api/cron/followup` | ✅ yes |
| Escalations | `ESCALATION_EMAIL` | ✅ yes |

### 6. Webhooks

| Provider | URL |
|---|---|
| YCloud | `https://your-app.onrender.com/api/whatsapp/webhook` (also accepts legacy `/api/webhook/whatsapp`) |
| Telegram | `https://your-app.onrender.com/api/telegram/webhook/<token>` — the token is auto-generated and shown in `/admin/telegram` (or set `TELEGRAM_WEBHOOK_TOKEN`) |
| Meta | `https://your-app.onrender.com/api/meta/webhook` (verify token = `META_WEBHOOK_VERIFY_TOKEN`) |

### 7. Custom domain

Point your domain in Render → Custom Domains, then update `AUTH_URL` and `NEXT_PUBLIC_APP_URL` to match. Works with any subdomain, e.g. `formosa.dev.ar` deployments.

## Project layout

```
src/
├── app/(storefront)/   # public pages (animated, SEO metadata from DB)
├── app/(admin)/admin/  # dashboard, agent config, orders, leads, analytics
├── app/api/            # webhooks + public endpoints (leads, products, business)
├── lib/whatsapp|telegram|agent/   # AI agents + tools
├── lib/business.ts     # business identity: DB row 1 → env → fallback
├── lib/ai/config.ts    # AI provider: DB → env (key, base URL, models)
├── lib/auth/require-admin.ts      # role-based guard for mutations
└── db/schema.ts        # agent_config holds all business/credential fields
```

## Security notes

- Admin mutations require `role = "admin"`; viewers are read-only.
- Stored secrets (YCloud key, AI key, Telegram token) are never sent to the client.
- Webhooks verify signatures/tokens; login is rate-limited; uploads validate magic bytes.
- Attribution links are HMAC-signed server-side.
- Don't commit `.env*` files — they're gitignored; keep it that way.

## License

MIT — free for personal and commercial use. See [LICENSE](LICENSE).

Built and maintained by [Fusa Labs](https://formosa.dev.ar) in Formosa, Argentina.

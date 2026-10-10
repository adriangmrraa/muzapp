# DESIGN.MD — Muzapp (Mrs Muzzarella)

> Design system oficial del proyecto. Refleja el estado REAL del código en `src/`
> (snapshot de `main`, 2026-10-09). Generado con el mismo criterio que los
> DESIGN.MD de dentalogic y demobondisok: cuando el código difiere de la
> intención, este doc dice qué hace el código.
>
> Reglas adicionales del repo: `AGENTS.md` (Next.js nuevo + inter-agent Engram),
> `skills/` (skills de producto locales).

---

## Overview

Muzapp es la app de **Mrs Muzzarella** (rotisería premium, Formosa AR) con dos
líneas de negocio y dos sub-sistemas visuales:

1. **Storefront B2C** (`src/app/(storefront)/`) — carta digital editorial
   premium: hamburguesas, pan mayorista, promos, tragos VIP + checkout por
   WhatsApp. Estética "dark luxury editorial".
2. **Admin operativo** (`src/app/(admin)/admin/`) — panel dark-chrome:
   pedidos/cocina, conversaciones, leads, analytics, clientes, productos,
   promos, Meta, Telegram, agente IA.

Regla central: **dark permanente**. `<html class="dark">` está hardcodeado en
`src/app/layout.tsx:47` — `:root` YA ES el tema dark; el bloque `.dark` es una
copia casi idéntica. No existe light theme ni toggle.

- **Chrome oscuro** `#0a0a0a` + hairlines dorados `rgba(212,160,23,0.2)`.
- **El oro es la única saturación**: `#D4A017` primary + gradientes
  `#D4A017 → #F5A623 → #E8712A` para brand y acentos.
- **Playfair Display** (serif editorial) para display/headings; **Poppins**
  para body/UI; **Inter** para el sistema `.digital-menu`.

---

## Tokens (`src/app/globals.css`)

Tailwind v4 + `tw-animate-css` + `shadcn/tailwind.css`. `@custom-variant dark`
mapeado a `.dark *` (línea 5). Tokens en `:root` (líneas 54-87) → `@theme
inline` como `--color-*`/`--radius-*`/`--font-*`.

### Paleta (dark único)

| Token CSS | Valor | Uso |
|---|---|---|
| `--background` | `#0a0a0a` | Fondo de app y admin |
| `--foreground` | `#f5f5f5` | Texto principal |
| `--card` / `--popover` | `#111111` | Superficies de card/popover |
| `--primary` | `#D4A017` | Oro de marca: CTAs, activos, ring |
| `--primary-foreground` | `#0a0a0a` | Texto sobre oro |
| `--secondary` / `--muted` | `#1a1a1a` | Fills elevados |
| `--muted-foreground` | `#888888` | Texto secundario |
| `--accent` | `#D4A017` | Hover = oro |
| `--destructive` | `oklch(0.577 0.245 27.325)` | Destructivo (más claro en `.dark`) |
| `--border` | `rgba(212,160,23,0.2)` | **Hairline dorado** — la firma visual |
| `--input` | `#1a1a1a` | Fill de inputs |
| `--ring` | `#D4A017` | Focus ring = oro |
| `--radius` | `0.625rem` | Base; escala `radius-sm`→`radius-4xl` |

Oro extendido: `--color-gold #D4A017` / `gold-light #E8B84B` /
`gold-dark #B8860B`; charts escala oro `chart-1…chart-5`
(`#D4A017,#E8B84B,#B8860B,#8B6914,#5C4209`).

### Sidebar tokens

`--sidebar #0a0a0a` · `--sidebar-foreground #f5f5f5` · `--sidebar-primary
#D4A017` · `--sidebar-accent #1a1a1a` · `--sidebar-border rgba(212,160,23,0.2)`
· `--sidebar-ring #D4A017`.

### Reglas de tokens

- Bordes NUNCA `border-border` genérico de otro color: la firma es el hairline
  dorado (`border` ya es dorado). Sidebar/topbar/navbar usan `border-border` /
  `border-sidebar-border` directamente.
- Tints de oro: `bg-primary/10`, `border-primary/30`, etc.

---

## Typography

Cargadas en `src/app/layout.tsx` vía `next/font/google` (todas weights 300-900
o 400-900):

| Variable | Fuente | Uso |
|---|---|---|
| `--font-poppins` → `--font-sans` | Poppins | Body/UI global (`html { font-sans }`) |
| `--font-playfair` → `--font-heading` | Playfair Display | Display editorial, h1/h2, brand |
| `--font-inter` | Inter | Sistema `.digital-menu` (carta pública) |
| `--font-geist-mono` → `--font-mono` | Geist Mono | Cargada en `layout.tsx`; mono/UI técnico |

### Escala en uso real

| Contexto | Patrón |
|---|---|
| Page title admin | `text-2xl font-bold tracking-tight text-gold-gradient` + `text-sm text-muted-foreground` |
| Hero storefront | `font-family: var(--font-playfair)` + `clamp(3.2rem,6.6vw,6.5rem)`, `letter-spacing:-.065em` |
| Eyebrow | `font-size:.62rem letter-spacing:.2em uppercase color:#c8b899` |
| Item/menu title | Playfair `1.35–1.4rem`, `letter-spacing:-.02..-.05em` |
| Precios/números | `font-variant-numeric: tabular-nums` |
| Metadata/caption | `.65–.78rem`, color `#aaa497`/`#c8b899` |

---

## Layout

### AdminShell (`(admin)/layout.tsx` + `components/admin/`)

```
┌──────────────────────────────────────────────┐
│ Sidebar w-64 (md+) │ Topbar h-14             │
│ #0a0a0a + hairline ├─────────────────────────│
│ oro 0.2            │ <PageTransition>        │
│                    │   contenido             │
└──────────────────────────────────────────────┘
```

- Root: `flex h-screen overflow-hidden bg-background` — **scroll isolation**
  (misma regla que clinicforge/dentalogic: nada fuga del viewport).
- Sidebar `w-64`, `hidden md:flex`, `border-sidebar-border`; brand = wordmark
  `text-gold-gradient`; nav animado con `staggerContainer`/`fadeUpSmall`
  (framer-motion). Contenido extraído a `sidebar-content.tsx` —
  `AdminSidebarContent` se reusa en sidebar y sheet mobile.
- Topbar `h-14 shrink-0`, `bg-background` + hairline; sheet mobile con
  `AdminSidebarContent`.
- `PageTransition` envuelve cada página admin.
- Toasts: `<Toaster richColors position="top-right" />` en el layout admin.
- Auth: layout es server component; `auth()` → `redirect("/login")` si no hay
  sesión.

### Storefront editorial (`globals.css` líneas 271-391)

Sistema bespoke `.digital-menu` + `.menu-*` + `.catalog-*` (~140 líneas de CSS
propio). NO es Tailwind — es el sistema de diseño de la carta pública:

- `.digital-menu` — scope: `#151513` bg, `#f2eee5` text, `--menu-gold:#d7c198`
  (oro crema, más suave que el `#D4A017` de marca), `--menu-muted:#aaa497`.
- Header 6rem grid `1fr auto 1fr`, `menu-brand` Playfair + small caps Inter.
- Hero `clamp` typography, foto `border-radius:2px 2px 80px 2px` + gradient veil.
- `menu-category-nav` sticky `backdrop-filter:blur(18px)` + indicador oro 2px.
- Grid 3col (`menu-grid`), item card con preview hover zoom + flecha reveal.
- `menu-floating-cart` fixed `bottom:max(1.5rem,env(safe-area-inset-bottom))`
  — safe-area respetado.
- `catalog-dialog` full-viewport con `catalog-dialog-veil` blur + panel
  `max-height:calc(100svh - 3rem)`.
- `checkout-form` grid 2col, inputs `min-height:46px`, botón WhatsApp 52px.
- Touch targets ≥ 44px en controles del menú (`min-height:44px`).
- Breakpoints del sistema: `1024px` y `760px` (media queries propias).

### Superficies y utilidades custom (`globals.css`)

| Utility | Qué hace |
|---|---|
| `.glass-card` | `rgba(0,0,0,.5)` + `blur(12px)` + borde oro .3 |
| `.glass-surface` | `rgba(0,0,0,.45)` + `blur(16px)` + borde oro .15 + shadow |
| `.text-gold-gradient` | gradiente oro→naranja clip-text (estático) |
| `.text-gold-shimmer` | mismo gradiente animado 6s |
| `.btn-gold` | gradiente oro, `border-radius:25px`, hover `scale(1.05) translateY(-2px)` + glow |
| `.card-gold-glow` | hover: borde oro .5 + glow 30px + `translateY(-2px)` |
| `.gold-shimmer` | skeleton dorado 1.5s |
| `.whatsapp-pulse` | ping verde WhatsApp 2s (FAB) |
| `.border-animated` | hairline oro↔vino `#8B0000` rotando 4s |
| `.orb-glow`/`.orb-1`/`.orb-2` | orbes de glow flotantes (ocultos <480px) |
| `.shine-sweep` | sweep de luz en hover |
| `.marquee-track` | marquee infinito 30s, pausa en hover |
| `.catalog-image` | frame editorial: fade+zoom on ready, shimmer loading |

### Marketing storefront — dos sub-sistemas

- **Páginas marketing** (`/`, `/hamburguesas`, `/pan-mayorista`, `/promo/*`):
  sistema de MARCA = tokens oro admin (`bg-background`, `bg-card`,
  `border-border`, `text-primary`, `text-foreground`, `glass-card`,
  `text-gold-gradient`, `font-heading`). Product cards usan
  `bg-card` + `border` + `border-border` (antes `.public-product-card`).
- **Páginas editoriales** (`/carta-digital`, `/tragos-vip`, `hamburguesas/[id]`,
  `pan-mayorista/[id]`): sistema `.digital-menu`/`--menu-*` con oro crema
  `#d7c198`. `.public-product-card` sobrevive SOLO en tragos-vip.
- **Chrome perimetral** (navbar, footer, CartDrawer): oro de marca `#D4A017`
  vía tokens — el oro crema editorial NO se usa en chrome.
- Límite verificado: cero `text-gold`/`#D4A017`/`primary` en scopes editoriales.

### Home/storefront components clave

`HeroSection`, `FeaturedProductsSection`, `Marquee`, `AnimatedStatCard`,
`GlassPanel`, `ClientGallery`, `BreadShowcase`, `EmpanadasShowcase`,
`DeliveryCTA`, `ParallaxDivider`, `whatsapp-fab` (FAB con pulse),
`navbar`/`footer`/`page-hero` en `components/layout`.

---

## Iconography & feedback

- Solo `lucide-react`.
- `sonner` para toasts (`richColors`, top-center en root, top-right en admin).
- `framer-motion` (nota: el paquete es `framer-motion` v12, no `motion`) —
  variants centralizadas en `src/lib/animation-variants.ts` (`fadeUp`,
  `fadeUpSmall`, `staggerContainer`).

## Motion

- Transiciones UI ≤ 300ms; hovers con `cubic-bezier(0.4,0,0.2,1)`.
- Entradas suaves: `fadeUp`/`staggerContainer` en nav y cards.
- Ambiente: orbs 20-25s, marquee 30s, shimmer 1.5-6s, pulse 2s, border-rotate 4s.
- **Reduced motion respetado**: bloque `prefers-reduced-motion` apaga marquee,
  orbs, pulses, shimmer, shine-sweep (globals.css:391,450-463).

## Accesibilidad

- `aria-pressed` en nav de categorías; `aria-current`/labels en controles.
- Focus visible: `outline:2px solid #d7c198; outline-offset:4px` en
  `.digital-menu`, `.catalog-dialog`, `.checkout-form`.
- Touch targets ≥ 44px en storefront.
- Contraste: `#f5f5f5` sobre `#0a0a0a` ≈ 18:1; `#888888` muted ≈ 3.5:1 (solo
  secundario); `#aaa497`/`#c8b899` del sistema menú ≈ AA para captions.

## Vistas (mapa real de rutas, `src/app`)

`(admin)/admin/`: `agent` · `analytics` (+`link-generator`) · `clients`
(+`[id]`) · `conversations` (+`[id]`) · `leads` · `meta` · `orders` ·
`products` · `promos` · `telegram`

`(storefront)`: `/` (home editorial) · `hamburguesas` (+`[id]`) ·
`pan-mayorista` (+`[id]`) · `promo` (+`[slug]`) · `tragos-vip` · checkout
(cart drawer + form WhatsApp)

`api/`: admin, agent, auth, business, checkout, cron, health, meta, orders,
uploads, webhooks…

---

## Brechas conocidas

1. ~~Hexes hardcodeados en chrome admin~~ — **resuelto** (ui-elevation S1):
   `(admin)/layout.tsx` usa `bg-background`; sidebar/topbar usan
   `bg-sidebar`/`border-sidebar-border`/`text-gold-gradient`; nav/links de
   marketing usan tokens.
2. ~~`--font-geist-mono` colgante~~ — **resuelto** (S1): `Geist_Mono` cargada
   en `layout.tsx`.
3. **`.dark` duplica `:root`**: intencional (tema único dark forzado en
   `<html class="dark">`), documentado — no es bug, es decisión.
4. **Dos oros** — **deliberado y ya acotado** (S3): `#D4A017`/`primary` en
   marca+admin+chrome perimetral; `#d7c198`/`--menu-gold` SOLO dentro de
   scopes `.digital-menu` (carta-digital, tragos-vip, detalles de producto).
   Regla: no mezclar `primary`/`text-gold` dentro de `.digital-menu`.
5. **Sin i18n**: UI en español hardcodeado (`lang="es"`), a diferencia de
   dentalogic. Strings de storefront son marketing — OK hardcode; admin sería
   candidato a i18n solo si se pide.
6. **Mezcla de unidades**: el sistema editorial usa rem/px propios fuera del
   token radius — aceptable porque es bespoke, mantener consistencia dentro
   de `.digital-menu`.

### Excepciones documentadas (color hardcodeado legítimo)

- `#25D366` (WhatsApp brand) en `whatsapp-fab` y `text-[#25D366]` de agente.
- `#8B0000` vino solo en `.border-animated` (rotación oro↔vino).
- `rgba(212,160,23,*)`/`#D4A017` inline donde una clase no aplica: gradientes
  de framer (`whileHover` boxShadow/borderColor), `wordStyle` de `TextReveal`
  (clip por palabra), orbes radiales, gradientes de sección anclados a
  `var(--background)`, `bgColor` de navbar por scroll.
- `bg-[#050505]` en footer — más oscuro que `--background`, sin token.
- Colores semánticos de estado (emerald/red/purple/amber/blue) y de
  origen en charts (facebook/instagram/whatsapp/organic/direct).

---

## Do's and Don'ts

### Do

- Page title admin: `text-2xl font-bold tracking-tight text-gold-gradient`.
- Cards/surfaces: `bg-card`/`bg-popover` + `border-border` (oro) +
  `.glass-*`/`.card-gold-glow` donde aplique.
- Scroll isolation: `h-screen overflow-hidden` + `overflow-y-auto` interno.
- `tabular-nums` en precios/contadores.
- `useBusiness()` para nombre/tagline del negocio (datos vienen de DB).
- Variants de `lib/animation-variants.ts`; respetar reduced motion.
- En storefront: quedarse DENTRO del sistema `.digital-menu`/`.menu-*`.

### Don't

- No light theme: no agregar `:root` claro ni toggles (dark forzado).
- No otros colores de marca: el oro es el único acento; el vino `#8B0000` solo
  vive en `.border-animated`.
- No blur pesado en elementos que se repintan por frame (el blur ya existe en
  veils/orbs estáticos).
- No romper el patrón hairline-oro: bordes siempre `rgba(212,160,23,*)` o
  `border-border`.
- No usar `font-heading` esperando otra serif: es Playfair.
- No Mezclar el sistema menú (crema `#d7c198`) con el sistema admin (oro
  `#D4A017`) en la misma superficie.

---

## Verificación de coherencia

1. `grep -rn "bg-\[#" src/app src/components` — hexes arbitrarios candidatos
   a `bg-background`/`bg-card` (hoy: solo `#050505` footer + `#151513`
   editorial, documentados).
2. `grep -rn "next/font" src/app/layout.tsx` — deben existir poppins,
   playfair, inter (y geist-mono si se usa `--font-mono`).
3. `grep -rn "font-playfair\|Playfair" src` — headings editoriales.
4. `grep -rn "h-screen overflow-hidden" src/app` — scroll isolation en shells.
5. `grep -rn "border-border\|rgba(212,160,23" src/components/admin` — la
   hairline dorada es la regla de bordes.

---

## Referencias

- `src/app/globals.css` — tokens + utilidades gold/glass + sistema
  `.digital-menu`/`.catalog-*` (única fuente de estilo bespoke)
- `src/app/layout.tsx` — fonts + `dark` forzado + MetaPixelProvider
- `src/app/(admin)/layout.tsx` — admin shell + auth guard + Toaster
- `src/components/admin/{sidebar,topbar,page-transition,sidebar-content}.tsx`
- `src/components/layout/{navbar,footer,whatsapp-fab,page-hero,parallax-divider}.tsx`
- `src/components/{cart,messages,hero,home,products,storefront}/`
- `src/lib/animation-variants.ts` — variants de framer-motion
- `components.json` — shadcn `base-nova`, neutral, cssVariables
- `AGENTS.md` — reglas Next.js + inter-agent Engram + skills locales

---

**Última actualización:** elevación UI aplicada en worktree `ui-elevation`
(S1 chrome admin → S2a chat → S2b orders/clients → S2c resto admin →
S3 storefront + este sync).
**Próxima revisión:** tras merge de `ui-elevation` a `main` o próximo cambio
de design tokens.

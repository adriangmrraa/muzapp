# DESIGN.MD — Muzapp (Mrs Muzzarella)

> Design system oficial del proyecto. Refleja el estado REAL del código en `src/`
> (snapshot de branch `ui-redesign` post-apply, 2026-10-10). Generado con el mismo
> criterio que los DESIGN.MD de dentalogic y demobondisok: cuando el código
> difiere de la intención, este doc dice qué hace el código.
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

### Escala de display numerals (ui-redesign R1–R2)

| Contexto | Regla |
|---|---|
| Stat cards admin | valor `text-4xl font-black tabular-nums`; unidad en `text-sm` muted separada |
| Total de OrderCard | `font-mono font-black tabular-nums text-xl` (solo si `> 0`, calculado por `computeOrderTotal`) |
| Total de cart drawer | `font-mono font-black tabular-nums text-4xl` |
| Precios `.digital-menu` | `.menu-item-action strong` `clamp(1.15rem,1.3rem)`; `.menu-detail-footer strong` `clamp(1.9rem,2.4rem)` `font-weight:900`; `.menu-cart-total strong` `clamp(1.9rem,2.3rem)` `font-weight:900`; `.menu-floating-cart strong` `font-weight:900` — todos `tabular-nums` |
| `AnimatedStatCard` | `useCountUp` solo si el valor matchea `/^\d+[%+]?$/`; strings ("Pan","♥") se imprimen literales |

### Mapa tipográfico final (ui-redesign R2)

| Fuente | Ejes | Ámbito |
|---|---|---|
| Playfair Display | roman + **itálica** (400-900) | Display editorial/brand storefront, headings `.digital-menu`, acentos `em.font-heading` en admin |
| Inter | **300-900** + normal + **itálica** | TODA la jerarquía `.digital-menu`: body light 300, fragmentos itálicos, numerales black |
| Geist Mono | normal | Numerales admin/cart-drawer (`font-mono`) — boundary mono preservado |
| Poppins | normal (300-900) | Body/UI de marketing y chrome — **nunca itálica** |

Regla dura: `<em>`/itálica SOLO donde renderiza Playfair o Inter (`.font-heading`,
`.digital-menu`, `em.font-heading`). Nunca en Poppins/Geist — Poppins no carga
cara itálica y sintetizaría faux-italic. `layout.tsx` declara
`style:["normal","italic"]` en Playfair e Inter; Inter suma `weight:300`.

### Headings mixtos roman+itálica (R2)

- `TextReveal` soporta `emLines?: number[]` — envuelve en `<em>` los word-spans
  de esas líneas; el hero pasa el índice de la última línea (nombre dinámico).
- `PromoMeta.em` define la keyword itálica por campaña en el h1 de promo.
- `.marker-gold` (wash orgánico detrás de la keyword) se combina con `<em>` en
  headings clave; variante `.digital-menu .marker-gold` recolorea a `--menu-gold`.

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
- `.menu-category-nav` es ahora **pill flotante inset** (`top:.75rem`,
  `margin-inline:max(.75rem,env(safe-area-inset-left))`, `border-radius:28px`,
  blur 18px, sombra spec `0_20px_50px_-4px_rgba(0,0,0,.55)`). Indicador de
  categoría activa = pill orb-finish (`inset:6px 4px`, `z-index:-1`,
  `isolation:isolate` en el botón) en vez de underline 2px. `aria-pressed` +
  `layoutId="category-indicator"` intactos.
- `.menu-floating-cart` es pill `border-radius:28px` con sombra spec +
  `:active{scale(.98)}`; badge de cantidad usa `.orb-chip`.
- `checkout-form` grid 2col, inputs `min-height:46px`, botón WhatsApp 52px.
- Touch targets ≥ 44px en controles del menú (`min-height:44px`).
- Breakpoints del sistema: `1024px` y `760px` (media queries propias, **no** el
  default Tailwind 768/767 — drift intencional, ver brechas).

### Superficies y utilidades custom (`globals.css`)

| Utility | Qué hace |
|---|---|
| `.glass-card` | `rgba(0,0,0,.5)` + `blur(12px)` + borde oro .3 + inset highlight `0 1px 0 rgba(255,255,255,.06)` + sombra ambiente estática |
| `.glass-surface` | `rgba(0,0,0,.45)` + `blur(16px)` + borde oro .15 + inset highlight + sombra ambiente estática |
| `.text-gold-gradient` | gradiente oro→naranja clip-text (estático) |
| `.text-gold-shimmer` | mismo gradiente animado 6s |
| `.btn-gold` | gradiente oro, `border-radius:25px`, hover `scale(1.05) translateY(-2px)` + glow |
| `.card-gold-glow` | hover: borde oro .5 + glow 30px + `translateY(-2px)` |
| `.gold-shimmer` | skeleton dorado (`Skeleton variant="shimmer"`); cadencia `--ambient-cycle / 3` |
| `.menu-shimmer` | skeleton editorial (sweep `#ffffff` sobre `#ffffff05`, keyframe `catalog-loading`); SOLO dentro de `.digital-menu` |
| `.paint-veil` | overlay fijo de primer paint (`var(--veil-bg,--background)`), fade 700ms tras mount |
| `.rise-in` | entrada por opacidad+y con stagger `--i × --stagger-step + --stagger-base` |
| `.sheet-handle` | grab-zone 44px + pill `h-1 w-10` centrada; marca el patrón bottom-sheet |
| `.whatsapp-pulse` | ping verde WhatsApp, cadencia `--ambient-cycle / 3` (FAB) |
| `.border-animated` | hairline oro↔vino `#8B0000` rotando 4s |
| `.orb-glow`/`.orb-1`/`.orb-2` | orbes de glow flotantes (ocultos <480px) |
| `.shine-sweep` | sweep de luz en hover |
| `.marquee-track` | marquee infinito 30s, pausa en hover |
| `.catalog-image` | frame editorial: fade+zoom on ready, shimmer loading |
| `.marker-gold` | highlight orgánico detrás de keyword (`box-decoration-break:clone`); variante `.digital-menu` usa `--menu-gold` |
| `.orb-finish` | acabado orb shape-agnostic: specular radial + grano feTurbulence + insets hi/lo; `--oc:#D4A017` (`.digital-menu`→`#d7c198`) |
| `.orb-chip` | esfera oro saturada circular (badges cortos/numéricos); halo respira en opacity-only |
| `.orb-float` | orbe flotante decorativo: levitate + piso + haz (opacity/transform only) |
| `.cta-card` | card CTA gradiente oro `#D4A017→#F5A623→#E8712A` + anatomy `-icon`/`-chevron`; halo/sheen en opacity/transform only; variante `.digital-menu` rampa `--menu-*` |
| `.btn-outline-gold` | pill hairline oro (contraparte outlined de `.btn-gold`) |

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
- Entradas suaves: `fadeUp`/`staggerContainer` en nav y cards; `riseIn`,
  `riseInSmall`, `popIn`, `staggerDense` en `animation-variants.ts` con paridad
  reduced-motion (`expoOut`/`overshoot` como eases compartidos).
- **Cadencia ambiental unificada**: `--ambient-cycle: 5.4s` en `:root`; todos los
  loops derivan de ella — orb-1 `×4`, orb-2 `×5`, whatsapp-pulse/gold-shimmer/
  catalog-loading `/3`, shimmer-text/border-rotate `×1`.
- **CTAs materiales**: `.btn-gold`, `.menu-add-button`, `.menu-whatsapp-button`
  tienen inset highlight + `:active { scale(.98) }`; la "respiración" es un
  pseudo-elemento animando `opacity` (`gold-breathe`), nunca `box-shadow`
  animada ni `transition: all`.
- **Reduced motion respetado**: los bloques `prefers-reduced-motion` (admin +
  editorial) cubren TODO keyframe nuevo (`gold-breathe`, `paint-veil`, `rise-in`,
  `menu-shimmer`); drag-to-dismiss es manipulación directa y se mantiene.

## Accesibilidad

- `aria-pressed` en nav de categorías; `aria-current`/labels en controles.
- Focus visible: `outline:2px solid #d7c198; outline-offset:4px` en
  `.digital-menu`, `.catalog-dialog`, `.checkout-form`.
- Touch targets ≥ 44px en storefront.
- Contraste: `#f5f5f5` sobre `#0a0a0a` ≈ 18:1; `#888888` muted ≈ 3.5:1 (solo
  secundario); `#aaa497`/`#c8b899` del sistema menú ≈ AA para captions.

## Patrones de interacción (ui-redesign R3–R5)

### Bottom-sheet pattern

El patrón se implementa una vez en `src/components/ui/sheet.tsx` (`side="bottom"`)
y se repite en los paneles móviles editoriales:

- Base UI `Dialog` conserva semántica: focus trap, Escape, backdrop, restore
  focus. El popup queda como shell transparente; el panel visual es un
  `motion.div` interior con `bg-popover border-t rounded-t-2xl` y
  `pb-[max(16px,env(safe-area-inset-bottom))]`.
- Drag vertical SOLO desde `.sheet-handle` (`dragListener={false}` +
  `dragControls` → el scroll interno nunca se bloquea).
- `dragConstraints {top:0,bottom:0}` + `dragElastic {bottom:.15}`; dismiss si
  offset `>120px` o velocity `>500px/s` → `onDragDismiss` (consumidor pasa su
  `onClose`).
- Consumidores: `CartDrawer` (`side={isMobile?"bottom":"right"}` vía
  `useMediaQuery("(max-width:767px)")`), `CatalogDialog` y `UpsellModal`
  (handle solo en mobile; desktop queda idéntico).

### `SegmentedControl` (`src/components/ui/segmented-control.tsx`)

- Track `rounded-full bg-muted/40` + `border`; segmento activo = pill `bg-card`
  animada con `motion layoutId={segmented-${id}}` — el prop `id` namespacing el
  layoutId (dos controles con el mismo id animarían el thumb entre instancias).
- Options soportan `label: ReactNode` (icons lucide inline) y `count` numérico.
- Consumidores: filtros de estado/tipo en `orders-view`; `product-toggle.tsx`
  usa el mismo lenguaje (pill `bg-card`, sin gradiente oro activo).

### Loading

- Admin: `Skeleton variant="shimmer"` (`.gold-shimmer`, oro admin).
- Editorial: `.menu-shimmer` (sweep neutro, reusa `catalog-loading`).
- `animate-pulse` solo sobrevive como `variant="default"` del componente
  `Skeleton` (sin usos actuales en `src/app`).

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
4. **Dos oros** — **deliberado y acotado** (S3 + ui-redesign R4): `#D4A017`/
   `primary` en marca+admin+chrome perimetral; `#d7c198`/`--menu-*` SOLO dentro
   de scopes `.digital-menu` — que ahora incluye `/carta-digital`, `/tragos-vip`
   y los detalles `hamburguesas/[id]` + `pan-mayorista/[id]` (sus raíces montan
   la clase `digital-menu` para que `--menu-*` resuelva). Regla: no mezclar
   `primary`/`text-gold` dentro de `.digital-menu`.
5. **Sin i18n**: UI en español hardcodeado (`lang="es"`), a diferencia de
   dentalogic. Strings de storefront son marketing — OK hardcode; admin sería
   candidato a i18n solo si se pide.
6. **Mezcla de unidades**: el sistema editorial usa rem/px propios fuera del
   token radius — aceptable porque es bespoke, mantener consistencia dentro
   de `.digital-menu`.
7. ~~Drift blanco/ámbar en storefront~~ — **resuelto** (R4): `bg-white/*`,
   `border-white/*`, `text-amber-*` migrados a `var(--menu-*)`; loading paths
   usan `.menu-shimmer`/`Skeleton variant="shimmer"`; `animate-pulse` en
   `src/app` = 0.
8. ~~Emoji como iconos de acción~~ — **resuelto en paths de orden/cliente**
   (R5): `Bell`, `X`, `Trash2`, `Pencil`, `Sandwich`, `Wheat`, `Package`,
   `ClipboardList` lucide con `aria-label` en orders/clients/products/promos/
   leads. Residual decorativo fuera de alcance: emojis en `dashboard-actions`,
   `admin/page.tsx` (acciones del día), `agent-config-form` — no son iconos de
   acción de la lista del gate; migrarlos es follow-up opcional.
9. ~~`client-tabs.tsx` muerto~~ — **resuelto** (R5): módulo eliminado junto a
   todos sus subcomponentes sin consumidores.
10. ~~Hexes en setup/hero~~ — **resuelto** (R5): estado de error de `/setup`
    usa `bg-background`/`text-muted-foreground`/`text-primary`; `wordStyle`
    del hero usa `var(--color-gold*)`.
11. **Drift de breakpoints editorial** — **intencional**: `.digital-menu` usa
    media queries propias `1024px`/`760px` (globals.css) que NO coinciden con
    el default Tailwind `768px`/`767px`. Es bespoke y autoconsistente; no
    unificar.
12. **Emoji residuales decorativos** — fuera del alcance de R5/R2:
    `upsell-modal.tsx` `CATEGORY_EMOJI` (`🍟`,`🥤`), `promo-page-client.tsx`
    `trustItems` (`🏆`,`⚡`,`❤️`) y `pan-mayorista/page.tsx` `benefits`
    (`🏆`,`📦`,`🚚`,`🤝`). No son iconos de acción de la lista del gate;
    migrarlos es follow-up opcional. Los iconos de acción admin de
    `dashboard-actions` SÍ se migraron a lucide (R2-D) — `🎯` → `Target`,
    quick-actions a estilo oro único.

### Excepciones documentadas (color hardcodeado legítimo)

- `#25D366` (WhatsApp brand) en `whatsapp-fab` y `text-[#25D366]` de agente.
- `#8B0000` vino solo en `.border-animated` (rotación oro↔vino).
- `rgba(212,160,23,*)`/`#D4A017` inline donde una clase no aplica: gradientes
  de framer (`whileHover` boxShadow/borderColor), orbes radiales, gradientes
  de sección anclados a `var(--background)`, `bgColor` de navbar por scroll.
  (`wordStyle` de `TextReveal` ya usa `var(--color-gold*)` — dejó de ser
  excepción en R5.)
- `bg-[#050505]` en footer — más oscuro que `--background`, sin token.
- Colores semánticos de estado (emerald/red/purple/amber/blue) y de
  origen en charts (facebook/instagram/whatsapp/organic/direct).
- `src/lib/whatsapp/tools/escalation-email.ts` — HTML email con estilos
  inline: los clientes de correo no soportan CSS custom properties; los hexes
  son deliberados.
- `src/app/api/meta/callback/route.ts` — devuelve un HTML string mínimo
  ("cerrar ventana") fuera del árbol React; inline styles deliberados.
- `src/components/products/upsell-modal.tsx` — sin skeleton: las sugerencias
  se cargan en background y el modal solo aparece cuando hay contenido
  (`suggestions.length === 0 → null`); skeleton deliberadamente omitido para
  no flashear un panel vacío.

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

**Última actualización:** `ui-redesign` ciclo 2 completado — R2-A foundations
(itálicas reales, pills, marker, sheet elevation) → R2-B headings mixtos +
numerales black → R2-C orbes glossy + pills flotantes → R2-D CTA cards
gradiente + quick-actions oro → R2-E motion + paridad reduced-motion → R2-F
este sync, 2026-10-10.
**Próxima revisión:** tras merge de `ui-redesign` a `main` o próximo cambio
de design tokens.

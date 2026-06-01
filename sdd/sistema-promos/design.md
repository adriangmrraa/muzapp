# SDD Design: Sistema de Promociones + Fixes de Prompt

## Architecture Decisions

### Decision: Promos como productos con flag is_promo

**Choice**: Agregar `is_promo` (boolean) y `promo_price` (numeric, nullable) a la tabla `products`. Las promos son productos que pueden tener un precio especial. La tabla `promotions` (ya existente en schema) sirve como agrupador de múltiples productos en una promo tipo combo.
**Alternatives**: Tabla separada solo para promos. Tabla promotions_items.
**Rationale**: Más simple. Un producto puede ser una promo (is_promo=true) con precio especial (promo_price). Para combos, se usa la tabla promotions que ya tiene items como JSONB.

### Decision: Imágenes de promos en Cloudinary

**Choice**: Reutilizar el endpoint `POST /api/media/upload` que ya sube a Cloudinary. Las promos tienen un campo `image_url` en la tabla `promotions`.
**Alternatives**: Subir a Cloudinary desde el frontend directo. Usar Cloudinary Upload Widget.
**Rationale**: El endpoint ya existe, está probado y funciona.

## Data Flow

```
Admin UI → Crea promo con nombre, items, precio, imagen
  → Server action inserta en promotions table
  → Imagen sube a Cloudinary via POST /api/media/upload
  → URL guardada en promotions.image_url

Cliente WhatsApp → "tienen promos?"
  → Agente ejecuta getActivePromos
  → Devuelve lista de promos activas
  → Si el cliente pregunta por una, ejecuta sendPromoImage(promoId)
  → Envía imagen + caption por WhatsApp
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/db/schema.ts` | Modify | Agregar `is_promo` y `promo_price` a products |
| `src/db/seed.ts` | Modify | Agregar productos de bebidas |
| `src/app/(admin)/admin/promos/page.tsx` | Create | Página server de promos |
| `src/app/(admin)/admin/promos/actions.ts` | Create | Server actions CRUD de promos |
| `src/app/(admin)/admin/promos/promos-table.tsx` | Create | Componente de listado |
| `src/app/(admin)/admin/promos/promo-form.tsx` | Create | Modal/form de edición |
| `src/components/admin/nav-items.ts` | Modify | Agregar item Promociones |
| `src/lib/whatsapp/tools/product-tools.ts` | Modify | Agregar getActivePromosTool |
| `src/lib/whatsapp/tools/sticker-tools.ts` | Modify | Agregar createSendPromoImageTool |
| `src/lib/whatsapp/tools/index.ts` | Modify | Exportar nuevos tools |
| `src/lib/whatsapp/agent.ts` | Modify | Registrar getActivePromos y sendPromoImage |
| `src/lib/whatsapp/prompt-builder.ts` | Modify | Secciones PROMOS, PRECIOS, YO DE NUEVO |

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | getActivePromos devuelve solo activas | Test DB query |
| Unit | sendPromoImage con/sin imagen | Test tool execution |
| E2E | Crear promo desde UI | Flujo completo |
| Verify | TypeScript compile | tsc --noEmit |

## Migration

```bash
npx drizzle-kit generate   # genera migración de promotions + is_promo + promo_price
npx drizzle-kit migrate    # aplica a DB
```

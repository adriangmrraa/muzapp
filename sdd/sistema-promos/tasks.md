# SDD Tasks: Sistema de Promociones + Fixes de Prompt

## Fase 1: DB + Migración

- [ ] 1.1 Agregar `is_promo` (boolean, default false) y `promo_price` (numeric, nullable) a products en schema.ts
- [ ] 1.2 Generar migración con drizzle-kit
- [ ] 1.3 Agregar productos de bebidas a seed.ts (Coca-Cola, Sprite, Agua, etc.)
- [ ] 1.4 Aplicar migración a DB de producción

## Fase 2: UI Admin Promos

- [ ] 2.1 Crear `src/app/(admin)/admin/promos/actions.ts` con server actions CRUD
- [ ] 2.2 Crear `src/app/(admin)/admin/promos/promos-table.tsx` con listado
- [ ] 2.3 Crear `src/app/(admin)/admin/promos/promo-form.tsx` con formulario + upload imágenes
- [ ] 2.4 Crear `src/app/(admin)/admin/promos/page.tsx` como página server
- [ ] 2.5 Agregar nav item "Promociones" en `src/components/admin/nav-items.ts`

## Fase 3: Tools del Agente

- [ ] 3.1 Agregar `getActivePromosTool` en product-tools.ts
- [ ] 3.2 Agregar `createSendPromoImageTool` en sticker-tools.ts (copiar patrón de sendMenuImage)
- [ ] 3.3 Exportar nuevos tools en index.ts
- [ ] 3.4 Registrar en agent.ts

## Fase 4: Prompt

- [ ] 4.1 Agregar sección `[PROMOS]` en prompt-builder.ts
- [ ] 4.2 Agregar sección `[PRECIOS CONFLICTIVOS]` (punto 3)
- [ ] 4.3 Agregar sección `[YO DE NUEVO]` (punto 4)
- [ ] 4.4 Agregar `sendPromoImage` y `getActivePromos` a la lista de herramientas

## Fase 5: Verify

- [ ] 5.1 TypeScript compile check
- [ ] 5.2 Commit y push

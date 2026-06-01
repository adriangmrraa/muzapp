# SDD Propose: Sistema de Promociones + Fixes de Prompt

## Intent

Construir un sistema completo de promociones: UI para cargar promos con imágenes desde el admin, tabla en DB, tools del agente, y que el agente de WhatsApp sepa consultarlas y enviarlas. Además, fixear 3 comportamientos del prompt basados en los chats reales del dueño.

## Scope

### In Scope
1. **Tabla `promotions`**: migración a DB (ya existe en schema)
2. **UI Admin**: página `/admin/promos` con listado, crear/editar/eliminar promos, subir imágenes
3. **Tool del agente**: `sendPromoImage` para enviar imágenes de promos por WhatsApp
4. **Tool del agente**: `getActivePromos` para consultar promos activas
5. **Products**: agregar `is_promo` boolean + `promo_price` nullable a products
6. **Categoría bebidas**: agregar productos de bebidas a la DB (Coca-Cola, Sprite, Agua, etc.)
7. **Prompt - Punto 3**: si el cliente confunde precios, responder "esta carta es vieja, tengo precios actualizados" + foto
8. **Prompt - Punto 4**: si el cliente dice "yo de nuevo", respuesta simple sin asumir que quiere lo mismo
9. **Nav item**: "Promociones" en la sidebar

### Out of Scope
- Sincronización de promos con Meta Ads
- Analytics de rendimiento de promos
- Traducción multi-idioma

## Approach

1. Migración de `promotions` a DB + agregar `is_promo` y `promo_price` a products
2. UI Admin con el mismo patrón que products: server actions + page + form
3. Tools del agente inspiradas en `createSendMenuImageTool`
4. Actualización del prompt con las 3 secciones nuevas
5. Subida de imágenes via Cloudinary (ya existe el endpoint)

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/db/schema.ts` | Modify | Agregar `is_promo` y `promo_price` a products |
| `drizzle/` | New | Migración de promotions + is_promo |
| `src/app/(admin)/admin/promos/` | New | Página CRUD de promos |
| `src/components/admin/nav-items.ts` | Modify | Agregar nav item Promociones |
| `src/lib/whatsapp/tools/sticker-tools.ts` | Modify | Agregar createSendPromoImageTool |
| `src/lib/whatsapp/tools/index.ts` | Modify | Exportar nuevo tool |
| `src/lib/whatsapp/tools/product-tools.ts` | Modify | Agregar getActivePromosTool |
| `src/lib/whatsapp/agent.ts` | Modify | Registrar nuevos tools |
| `src/lib/whatsapp/prompt-builder.ts` | Modify | Agregar secciones de promos, precios confundidos, yo de nuevo |
| `src/app/api/media/upload/route.ts` | Use | Ya existe, reutilizar |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Migración de tabla promotions rompe algo | Low | Ya existe en schema, solo aplicar |
| Promos sin imágenes se ven mal en WhatsApp | Medium | Tool devuelve texto si no hay imagen |
| Cliente confunde precios y el bot responde mal | Low | Prompt específico para ese caso |

## Dependencies

- Cloudinary config (ya existe)
- YCloud API (ya existe)

## Success Criteria

- [ ] Admin puede crear/editar/eliminar promos con imágenes
- [ ] Agente puede consultar promos activas y enviar imágenes
- [ ] Si el cliente confunde precios, el bot responde como el dueño
- [ ] Si el cliente dice "yo de nuevo", el bot responde simple
- [ ] Productos de bebidas cargados en DB
- [ ] TypeScript compila sin errores

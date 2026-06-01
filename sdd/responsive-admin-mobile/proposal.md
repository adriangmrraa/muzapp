# SDD Propose: Optimización Mobile — Productos, Pedidos y Clientes

## Intent

Optimizar las 3 vistas principales del admin (Productos, Pedidos, Clientes) para mobile, manteniendo la funcionalidad completa en desktop pero garantizando que en pantallas chicas (<640px) la UI sea usable, los botones tocables y las tarjetas legibles.

## Problemas Detectados

### 1. Productos (`products-table.tsx`) — VISTA EN FILA, SIN TARJETAS
- Usa `<Table>` con 7 columnas (Nombre, Categoría, Línea, Precio, Disponible, Próximamente, Acciones)
- En mobile las columnas se comprimen hasta romper el layout
- Los botones Editar/Eliminar son chicos y se pisan
- Los switches de Disponible/Próximamente no tienen label visible en mobile
- **No tiene paginación** — carga todos los productos de una

### 2. Pedidos (`orders-view.tsx`) — TARJETAS OK, BOTONES MICRO
- El grid de tarjetas funciona (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`)
- Pero los botones de acción (→ Preparando, Pagado, 🔔, ✕, 🗑️, ✏️) son **demasiado chicos**
- En mobile los botones se superponen en el footer de la card
- Los filtros de tipo y estado ocupan mucho espacio horizontal
- El modal de edición (OrderEditModal) no tiene versión mobile

### 3. Clientes (`clients-view.tsx`) — TARJETAS BIEN, BOTONES MICRO
- Las tarjetas con grid funcionan ok
- Pero los botones 👤 y ✏️ tienen `py-0.5` — difíciles de tocar en mobile
- El modal de edición usa inputs nativos pero sin optimización mobile
- Los tags clickables son muy pequeños para dedo

## Scope

### In Scope
1. **Productos**: Migrar de Table a tarjetas (card grid) responsive
2. **Productos**: Agregar paginación
3. **Productos**: Optimizar filtros y botones para mobile
4. **Pedidos**: Botones de acción más grandes y espaciados en mobile
5. **Pedidos**: Optimizar filtros responsive (wrap en mobile)
6. **Pedidos**: Modal de edición responsive
7. **Clientes**: Botones de acción más grandes en mobile
8. **Clientes**: Modal de edición responsive
9. **Clientes**: Tags clickables más grandes

### Out of Scope
- Leads page (no solicitado)
- Dashboard (no solicitado)
- Animaciones nuevas (solo mantener las existentes)
- Cambios en server actions o lógica de negocio

## Approach

1. **Productos → Tarjetas**: Reemplazar `<Table>` por un `grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3` con `<Card>` components. Las columnas pasan a ser campos dentro de cada card.
2. **Productos → Paginación**: Agregar paginación server-side con `searchParams` (mismo patrón que orders/clients).
3. **Botones → Touch targets**: Mínimo 32px de alto, 36px en mobile. Usar `size="sm"` con padding extra en mobile mediante `className="sm:px-3 px-2.5"`.
4. **Modales**: Los modales actuales ya son responsive (max-w-md), pero ajustar padding y inputs para mobile.
5. **Filtros**: Wrap con `flex-wrap` y gap adecuado.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/(admin)/admin/products/page.tsx` | Modify | Agregar paginación server-side |
| `src/app/(admin)/admin/products/products-table.tsx` | Rewrite | Migrar de Table → Tarjetas + paginación client |
| `src/app/(admin)/admin/products/actions.ts` | Modify | Agregar paginación a fetch |
| `src/app/(admin)/admin/orders/orders-view.tsx` | Modify | Botones + filtros responsive + modal mobile |
| `src/app/(admin)/admin/orders/order-edit-modal.tsx` | Modify | Optimizar para mobile |
| `src/app/(admin)/admin/clients/clients-view.tsx` | Modify | Botones + modal responsive |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Productos sin paginación rompe UX con muchos items | Medium | Agregar paginación server-side con 30/page |
| Botones más grandes rompen layout existente | Low | Usar padding extra solo en mobile via responsive classes |

## Success Criteria
- [ ] Productos se ven como tarjetas en mobile y desktop
- [ ] Productos tienen paginación (máximo 30 por página)
- [ ] Botones de acción ≥ 32px de alto en mobile
- [ ] Filtros no se rompen en mobile (< 640px)
- [ ] Modales se ven bien en mobile (sin scroll horizontal)
- [ ] TypeScript compila sin errores
- [ ] Desktop no pierde funcionalidad existente

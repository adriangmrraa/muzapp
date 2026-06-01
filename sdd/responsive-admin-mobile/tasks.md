# SDD Tasks: Optimización Mobile — Productos, Pedidos y Clientes

## Task 1: Products — Agregar paginación server-side
**Archivos**: `src/app/(admin)/admin/products/page.tsx`, `src/app/(admin)/admin/products/actions.ts`
**Changes**:
- En `actions.ts`: crear `fetchProducts(params)` con `limit/offset`, devuelve `{ products, totalPages, total }`
- En `page.tsx`: aceptar `searchParams: { page?, category?, line? }`, llamar `fetchProducts()`, pasar `totalPages` al client

## Task 2: Products — Migrar de Table a Card Grid
**Archivo**: `src/app/(admin)/admin/products/products-table.tsx`
**Changes**:
- Reemplazar `<Table>` + `<TableHeader>` + `<TableBody>` por `grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3`
- Cada producto como `<Card>` con: nombre, badges (categoría + línea), precio, switches, botones
- Agregar paginación UI (Anterior/Siguiente)
- Mantener Sheet, AlertDialog, filtros, optimistic updates

## Task 3: Orders — Botones de acción más grandes
**Archivo**: `src/app/(admin)/admin/orders/orders-view.tsx`
**Changes**:
- Todos los `<Button>` en la sección de acciones: cambiar `h-7` por `h-8 sm:h-7`
- Ajustar padding: `px-2.5 sm:px-3` para botones de texto, `w-8 sm:w-7` para icon buttons
- Botones de confirmación de delete también agrandados
- Ajustar gap entre botones: `gap-2 sm:gap-1.5`

## Task 4: Orders — Modal de edición responsive
**Archivo**: `src/app/(admin)/admin/orders/order-edit-modal.tsx`
**Changes**: (leer el archivo primero para ver qué ajustar)

## Task 5: Clients — Botones 👤 y ✏️ más grandes
**Archivo**: `src/app/(admin)/admin/clients/clients-view.tsx`
**Changes**:
- 👤 link: `px-2.5 py-1.5 sm:px-1.5 sm:py-0.5`
- ✏️ button: `px-2.5 py-1.5 sm:px-1.5 sm:py-0.5`
- Tags: `px-2 sm:px-1.5 py-1 sm:py-0`

## Task 6: Clients — Modal de edición responsive
**Archivo**: `src/app/(admin)/admin/clients/clients-view.tsx`
**Changes**: (verificar que inputs sean fluidos y no se salgan del modal en mobile)

## Orden de implementación
1. Products actions (Task 1)
2. Products page (Task 1)
3. Products table → cards (Task 2)
4. Orders buttons (Task 3)
5. Clients buttons (Task 5)
6. Modales responsive (Task 4 + 6)

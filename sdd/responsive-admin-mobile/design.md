# SDD Design: Optimización Mobile — Productos, Pedidos y Clientes

## Arquitectura de Cambios

### Products — De Table a Card Grid

```
ANTES:
┌──────────────────────────────────────────────────────────────┐
│ <Table>                                                      │
│ ┌───────┬─────────┬──────┬───────┬──────────┬──────────┬────┐│
│ │Nombre │Categoría│Línea │Precio │Disponible│Próximamente│Acc.││
│ ├───────┼─────────┼──────┼───────┼──────────┼──────────┼────┤│
│ │...    │...      │...   │...    │[switch]  │[switch]  │btn ││
│ └───────┴─────────┴──────┴───────┴──────────┴──────────┴────┘│
│ ← SIN PAGINACIÓN →                                           │
└──────────────────────────────────────────────────────────────┘

DESPUÉS:
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Producto 1   │ │ Producto 2   │ │ Producto 3   │
│ [Badge][Badge]│ │ [Badge][Badge]│ │ [Badge][Badge]│
│ $ 7.000      │ │ $ 8.500      │ │ $ 6.000      │
│ 🟢 [switch]  │ │ 🟢 [switch]  │ │ 🔴 [switch]  │
│ [✏️][🗑️]     │ │ [✏️][🗑️]     │ │ [✏️][🗑️]     │
└──────────────┘ └──────────────┘ └──────────────┘
← grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 →
               ← Paginación (30/page) →
```

### Orders — Botones más grandes

```
ANTES (mobile):
┌──────────────────────────────┐
│ ...                          │
│ [● Pendiente] [hace 5 min]   │
│ [→Preparando][✓Pag][🔔][✕][🗑️][✏️]│ ← MUY CHICO
└──────────────────────────────┘

DESPUÉS (mobile):
┌──────────────────────────────┐
│ ...                          │
│ [● Pendiente] [hace 5 min]   │
│ [→ Preparando] [✓ Pagado]   │ ← 32px+
│ [🔔] [✕] [🗑️] [✏️]          │ ← 32px+
└──────────────────────────────┘
```

### Clientes — Botones más grandes + modal responsive

```
ANTES:
┌──────────────────────┐
│ ...                  │
│ Últ. pedido: ayer    │
│ [👤][✏️] ← py-0.5    │
└──────────────────────┘

DESPUÉS:
┌──────────────────────┐
│ ...                  │
│ Últ. pedido: ayer    │
│ [👤] [✏️] ← py-1.5   │
└──────────────────────┘
```

## Decisiones Técnicas

### Decisión 1: Paginación server-side (no client-side)
Los productos no tenían paginación. Usamos el mismo patrón que orders/clients: `searchParams` en la URL, fetch con `limit/offset`. Esto es escalable y consistente con el resto del admin.

### Decisión 2: Botones con altura mínima
Usamos `h-8 sm:h-7` en todos los botones de acción. En mobile `h-8` = 32px (touch target mínimo recomendado). En desktop vuelve a `h-7` (28px, más compacto).

### Decisión 3: No tocar lógica de negocio
Todos los cambios son puramente de UI/layout. Server actions, data fetching, y tipos se mantienen igual.

## Archivos y Cambios

### 1. `src/app/(admin)/admin/products/page.tsx`
- Agregar `searchParams` para `page`, `category`, `line`
- Modificar fetch para paginación (limit/offset)
- Pasar `totalPages` al client

### 2. `src/app/(admin)/admin/products/products-table.tsx`
- Reemplazar `<Table>` por `<Card>` grid
- Agregar paginación UI
- Mantener Sheet, AlertDialog, filtros

### 3. `src/app/(admin)/admin/products/actions.ts`
- Agregar función `fetchProducts()` con paginación

### 4. `src/app/(admin)/admin/orders/orders-view.tsx`
- Aumentar altura de todos los botones de acción
- Ajustar padding en mobile

### 5. `src/app/(admin)/admin/orders/order-edit-modal.tsx`
- Ajustar padding e inputs para mobile

### 6. `src/app/(admin)/admin/clients/clients-view.tsx`
- Aumentar padding de botones 👤 y ✏️
- Aumentar padding de tags
- Asegurar modal responsive

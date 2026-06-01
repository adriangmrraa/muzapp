# SDD Specs: Optimización Mobile — Productos, Pedidos y Clientes

## 1. Productos — ProductosTable

### 1.1 Migrar de Table a Tarjetas

**Estado actual**: `<Table>` con 7 columnas en fila.

**Estado deseado**: `grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3` con cards.

Cada card debe mostrar:
```
┌──────────────────────────┐
│ [Nombre del producto]    │
│ [Badge Categoría] [Badge Línea]
│ Precio: $ X.XXX          │
│ ─────────────────────    │
│ 🟢 Disponible [switch]   │
│ 📅 Próximamente [switch] │
│ ─────────────────────    │
│ [✏️ Editar]  [🗑️ Eliminar]│
└──────────────────────────┘
```

### 1.2 Paginación

**Server-side**: 
- `page.tsx` acepta `searchParams: { page?, category?, line? }`
- `actions.ts` `fetchProducts()` devuelve `{ products, totalPages, total }`
- 30 productos por página

**Client-side**:
- Botones Anterior/Siguiente con indicador de página
- Filtros de categoría y línea actualizan URL

### 1.3 Filtros responsive
```html
<div class="flex flex-col sm:flex-row sm:items-center gap-3">
  <select> categorías </select>
  <select> líneas </select>
  <button class="whitespace-nowrap btn-gold">+ Nuevo Producto</button>
</div>
```

### 1.4 Sheet (crear/editar) sin cambios
El `<Sheet>` de shadcn ya es responsive. No tocar.

## 2. Pedidos — OrdersView

### 2.1 Botones de acción (CRÍTICO)

| Botón | Estado actual | Estado deseado mobile |
|-------|--------------|----------------------|
| → Preparando | `h-7 text-[11px] px-3` | `h-8 sm:h-7 text-xs px-2.5 sm:px-3` |
| ✓ Pagado | `h-7 text-[10px] px-2` | `h-8 sm:h-7 text-xs px-2.5 sm:px-2` |
| 🔔 | `h-7 text-[11px] px-2` | `h-8 sm:h-7 w-8 sm:w-7` |
| ✕ (cancelar) | `h-7 text-[11px] px-2` | `h-8 sm:h-7 w-8 sm:w-7` |
| 🗑️ (eliminar) | `h-7 text-[10px] px-1.5` | `h-8 sm:h-7 w-8 sm:w-7` |
| ✏️ (editar) | `h-7 text-[10px] px-1.5` | `h-8 sm:h-7 w-8 sm:w-7` |

**Confirmación de delete**: El botón de eliminar con confirmación (dos botones chicos) también debe agrandarse.

### 2.2 Filtros responsive
- Status tabs: `flex-wrap gap-1.5`
- Type buttons: `flex-wrap gap-1.5`
- Search + button: mantener `flex-col sm:flex-row`

### 2.3 Modal (OrderEditModal) responsive
- Asegurar que en mobile (<640px) el modal use todo el ancho disponible con padding adecuado
- Inputs de tamaño completo
- Botones con touch targets ≥ 36px

## 3. Clientes — ClientsView

### 3.1 Botones de acción

| Botón | Estado actual | Estado deseado mobile |
|-------|--------------|----------------------|
| 👤 (ver perfil) | `px-1.5 py-0.5` | `px-2.5 py-1.5 sm:px-1.5 sm:py-0.5` |
| ✏️ (editar) | `px-1.5 py-0.5` | `px-2.5 py-1.5 sm:px-1.5 sm:py-0.5` |

### 3.2 Tags clickables
- Aumentar padding: `px-2 sm:px-1.5 py-1 sm:py-0`

### 3.3 Modal de edición responsive
- Asegurar inputs full-width en mobile
- Botones con padding adecuado
- Scroll vertical si es necesario

## 4. Escenarios de prueba

### Escenario 1: Productos en mobile (375px)
**Input**: Abrir `/admin/products` en iPhone SE (375px)
**Esperado**: Cards apiladas verticalmente, una por fila. Filtros en columna. Botones tocables. ✅

### Escenario 2: Productos en desktop (1920px)
**Input**: Abrir `/admin/products` en 1920px
**Esperado**: 3 cards por fila. Misma funcionalidad que antes. ✅

### Escenario 3: Pedidos en mobile — botones de acción
**Input**: Abrir `/admin/orders` en 375px, tocar botón "→ Preparando"
**Esperado**: Botón de al menos 32px de alto, fácil de tocar. Acción se ejecuta. ✅

### Escenario 4: Clientes en mobile — editar y ver perfil
**Input**: Abrir `/admin/clients` en 375px, tocar ✏️ o 👤
**Esperado**: Botones de al menos 36px, fáciles de tocar. Modal de edición ocupa todo el ancho. ✅

# Specs: Media Upload System

## R1: Upload API

### Description
Endpoint POST /api/upload que acepta imágenes y devuelve la URL pública.

### Acceptance Criteria
- AC1.1: Acepta multipart/form-data con campo "file"
- AC1.2: Solo acepta imágenes (jpeg, png, webp, gif)
- AC1.3: Tamaño máximo 10MB
- AC1.4: Guarda en `public/uploads/` con nombre único (timestamp-random)
- AC1.5: Devuelve JSON `{ url: "/uploads/..." }`
- AC1.6: Autenticación requerida (admin session)
- AC1.7: Si el directorio no existe, lo crea automáticamente

### Files
- `src/app/api/media/upload/route.ts` — NUEVO

## R2: Product Image Upload en Admin

### Description
Reemplazar el input de texto imageUrl por un file picker con preview.

### Acceptance Criteria
- AC2.1: Botón "Subir foto" en el formulario de producto
- AC2.2: File picker acepta jpeg/png/webp
- AC2.3: Preview de la imagen seleccionada antes de guardar
- AC2.4: La imagen se sube al servidor via POST /api/upload
- AC2.5: La URL devuelta se guarda automáticamente en imageUrl
- AC2.6: Si el producto ya tiene imagen, se muestra preview
- AC2.7: Botón "Quitar foto" para limpiar imageUrl

### Files
- `src/app/(admin)/admin/products/products-table.tsx` — reemplazar input
- `src/app/(admin)/admin/products/actions.ts` — sin cambios (imageUrl sigue siendo string)

## R3: Menu Images en Agent Config

### Description
Agregar uploaders de imágenes de menú en la página de configuración del agente.

### Acceptance Criteria
- AC3.1: Campos `menuImageUrlHamburguesas` y `menuImageUrlPan` en agentConfig
- AC3.2: File picker con preview para cada una
- AC3.3: Las URLs se guardan en la tabla agent_config via la action existente
- AC3.4: Si no hay imagen, el tool sendMenuImage usa fallback

### Files
- `src/db/schema.ts` — agregar `menuImageUrlHamburguesas` y `menuImageUrlPan` (text)
- `src/app/(admin)/admin/agent/agent-config-form.tsx` — agregar uploaders
- `src/app/(admin)/admin/agent/actions.ts` — agregar campos al schema y save
- `src/app/(admin)/admin/agent/page.tsx` — agregar defaults

## R4: Agent Photo Behavior

### Description
El agente usa fotos de forma inteligente según el contexto del cliente.

### Acceptance Criteria
- AC4.1: Cliente sabe producto ("una deli deli") → sendProductImage(deli) + avanzar
- AC4.2: Cliente no sabe ("qué tienen?") → sendMenuImage(hamburguesas) + sendProductImage de 2 productos destacados
- AC4.3: Cliente pide menú → sendMenuImage + "ahí tenés, cual te gusta?"
- AC4.4: Cliente B2B (pan) → sendMenuImage(pan)
- AC4.5: Si un producto no tiene foto, no rompe, sigue sin foto

### Files
- `src/lib/whatsapp/prompt-builder.ts` — reglas de comportamiento con fotos
- `src/lib/whatsapp/tools/sticker-tools.ts` — sendMenuImage lee URLs de DB
- `src/lib/whatsapp/tools/product-tools.ts` — agregar imageUrl a los SELECTs faltantes

## R5: sendMenuImage desde DB

### Description
La tool sendMenuImage debe leer las URLs de las imágenes de menú desde la DB (agent_config) en vez de usar rutas hardcodeadas.

### Acceptance Criteria
- AC5.1: Consulta agent_config para obtener menuImageUrlHamburguesas y menuImageUrlPan
- AC5.2: Si la URL está configurada, la usa
- AC5.3: Si no está configurada, usa fallback a archivos estáticos
- AC5.4: Si no hay ningún fallback, tool devuelve error amigable

### Files
- `src/lib/whatsapp/tools/sticker-tools.ts` — modificar createSendMenuImageTool

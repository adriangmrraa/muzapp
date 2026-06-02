# Tasks: Media Upload System

## FASE 1: Upload API

### T1: POST /api/media/upload
**Files**: `src/app/api/media/upload/route.ts` (NUEVO)
- [ ] Validar autenticación (session admin)
- [ ] Validar tipo MIME (solo image/jpeg, image/png, image/webp, image/gif)
- [ ] Validar tamaño (< 10MB)
- [ ] Generar nombre único: `${Date.now()}-${random}.${ext}`
- [ ] Guardar en `public/uploads/` (crear dir si no existe)
- [ ] Devolver `{ url: "/uploads/filename.ext" }`
- [ ] Manejar errores: 400, 401, 413, 500

## FASE 2: Product Image Upload

### T2: Product form — file picker + preview
**Files**: `src/app/(admin)/admin/products/products-table.tsx`
- [ ] Agregar estado `uploading` y `previewUrl`
- [ ] Reemplazar `<Input type="url">` por botón "Subir foto" + file picker
- [ ] Mostrar preview de la imagen actual (o placeholder)
- [ ] Llamar a POST /api/upload cuando se selecciona archivo
- [ ] Setear el valor de imageUrl con la URL devuelta
- [ ] Botón "Quitar foto" para limpiar imageUrl
- [ ] Estado de carga mientras sube

## FASE 3: Menu Images en Agent Config

### T3.1: Schema — agregar columnas
**Files**: `src/db/schema.ts`
- [ ] Agregar `menuImageUrlHamburguesas` (text, nullable)
- [ ] Agregar `menuImageUrlPan` (text, nullable)

### T3.2: Admin form — uploaders de menú
**Files**: `src/app/(admin)/admin/agent/agent-config-form.tsx`
- [ ] Agregar sección "Imágenes de Menú"
- [ ] Uploader para menú hamburguesas con preview
- [ ] Uploader para menú pan con preview

### T3.3: Actions — guardar menu images
**Files**: `src/app/(admin)/admin/agent/actions.ts`
- [ ] Agregar `menuImageUrlHamburguesas` al schema de validación
- [ ] Agregar `menuImageUrlPan` al schema de validación
- [ ] Guardar ambos en DB

### T3.4: Page — defaults
**Files**: `src/app/(admin)/admin/agent/page.tsx`
- [ ] Agregar defaults "" a DEFAULT_CONFIG
- [ ] Cargar valores desde DB row

## FASE 4: Agent Tools + Prompt

### T4.1: sendMenuImage desde DB
**Files**: `src/lib/whatsapp/tools/sticker-tools.ts`
- [ ] Consultar agent_config para menu URLs
- [ ] Usar URL de DB si existe
- [ ] Fallback a /assets/images/menu-{tipo}.jpeg si no
- [ ] Error amigable si no hay imagen

### T4.2: Reglas de fotos en prompt
**Files**: `src/lib/whatsapp/prompt-builder.ts`
- [ ] Agregar sección "FOTOS SEGUN CONTEXTO"
- [ ] Cliente sabe producto → sendProductImage + avanzar
- [ ] Cliente navegando → sendMenuImage + 2 sendProductImage
- [ ] Cliente pide menú → sendMenuImage
- [ ] B2B → sendMenuImage("pan")
- [ ] Sin foto = seguir sin problema

### T4.3: imageUrl en SELECTs faltantes
**Files**: `src/lib/whatsapp/tools/product-tools.ts`
- [ ] Agregar `imageUrl` al SELECT de getProductDetailsTool
- [ ] Agregar `imageUrl` al SELECT de getMenuTool (en get-menu.ts)

## DEPENDENCIAS
- T1 → T2, T3 (upload API necesaria para subir imágenes)
- T3.1 → T3.2, T3.3, T3.4 (schema antes que UI)
- T4.1, T4.2, T4.3 independientes entre sí

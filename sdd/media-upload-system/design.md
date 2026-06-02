# Technical Design: Media Upload System

## Architecture Decision 1: Local File Upload API

**Problema**: No hay forma de subir imágenes desde la UI. Las URLs de imágenes se tienen que poner manualmente.

**Solución**: Endpoint `POST /api/media/upload` que:
1. Recibe multipart/form-data con `file`
2. Valida tipo MIME (solo imágenes: jpeg, png, webp, gif)
3. Valida tamaño (< 10MB)
4. Genera nombre único: `${Date.now()}-${random(4)}.${ext}`
5. Guarda en `public/uploads/`
6. Devuelve `{ url: "/uploads/nombre.ext" }`

```
POST /api/media/upload
  Headers: Authorization (session cookie)
  Body: multipart/form-data { file: File }
  Response: { url: "/uploads/1234567890-abcd.jpg" }
  Errors: 401 (no auth), 400 (invalid file), 413 (too large), 500 (server error)
```

## Architecture Decision 2: Product image upload = API call + set URL

**Problema**: El form de productos tiene un `<Input type="url">` para imageUrl.

**Solución**: Reemplazar por:
1. Botón "Subir foto" → file picker → POST /api/media/upload → obtiene URL
2. Preview de la imagen actual (o placeholder si no tiene)
3. El valor del input oculto imageUrl se setea con la URL devuelta
4. Botón "Quitar" para limpiar

La server action `updateProduct` / `createProduct` NO cambia — sigue recibiendo imageUrl como string.

```
[ProductForm]
├── [Preview Image] ── muestra imageUrl actual o "sin foto"
├── [Subir foto] ── file picker → POST /api/upload → llena imageUrl
├── [Quitar foto] ── limpia imageUrl
└── [Hidden Input] imageUrl ── se actualiza con la URL
```

## Architecture Decision 3: Menu images en agent_config

**Problema**: Las imágenes de menú están hardcodeadas en el tool `sendMenuImage`.

**Solución**: Agregar dos columnas text a `agent_config`:
- `menu_image_hamburguesas` → URL de la imagen del menú de hamburguesas
- `menu_image_pan` → URL de la imagen del menú de pan

En el admin/agent, agregar uploaders con preview igual que productos.
En el tool `sendMenuImage`, leer desde DB con fallback a hardcode.

```
sendMenuImage(tipo):
  1. Consulta agent_config.menuImageUrlHamburguesas o menuImageUrlPan
  2. Si existe → usar esa URL
  3. Si no existe → fallback a /assets/images/menu-{tipo}.jpeg
  4. Si tampoco existe → devolver error amigable
```

## Architecture Decision 4: Agent photo behavior en prompt

**Problema**: El prompt no distingue entre "cliente sabe producto" vs "cliente navegando".

**Solución**: Agregar esta regla al prompt:

```
FOTOS SEGUN CONTEXTO:
- Cliente dice producto exacto ("una genesis", "la deli deli") → sendProductImage + avanzar
- Cliente no sabe ("que tienen?", "mostrame") → sendMenuImage + sendProductImage de 2 productos
- Cliente pide menu → sendMenuImage
- Cliente B2B (pan) → sendMenuImage("pan")
- Si un producto no tiene foto, no pasa nada, segui sin foto
```

## Data Flow

```
[Admin sube foto] → POST /api/media/upload → /uploads/file.jpg
       │
       ├─→ Se guarda en product.imageUrl o agent_config.menuImageUrl
       │
[Cliente manda msg] → Agent decide qué foto mandar
       │
       ├─ "quiero genesis" → sendProductImage(genesisId) → /uploads/file.jpg
       ├─ "que tienen?" → sendMenuImage → /uploads/menu.jpg + sendProductImage(x2)
       └─ "menu" → sendMenuImage → /uploads/menu.jpg
```

## File Changes Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `src/app/api/media/upload/route.ts` | CREATE | POST upload endpoint |
| `public/uploads/` | CREATE | Directorio de uploads |
| `src/app/(admin)/admin/products/products-table.tsx` | MODIFY | File picker + preview |
| `src/db/schema.ts` | MODIFY | Agregar menuImageUrlHamburguesas, menuImageUrlPan |
| `src/app/(admin)/admin/agent/agent-config-form.tsx` | MODIFY | Uploaders de menú |
| `src/app/(admin)/admin/agent/actions.ts` | MODIFY | Schema + save de menu images |
| `src/app/(admin)/admin/agent/page.tsx` | MODIFY | Defaults de menu images |
| `src/lib/whatsapp/tools/sticker-tools.ts` | MODIFY | sendMenuImage lee de DB |
| `src/lib/whatsapp/prompt-builder.ts` | MODIFY | Reglas de fotos por contexto |

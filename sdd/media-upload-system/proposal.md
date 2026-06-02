# Proposal: Media Upload System

## Intent
Que el admin pueda subir imágenes desde la UI: fotos de productos, menú de hamburguesas, menú de pan. Y que el agente las use inteligentemente.

## Problemas Actuales
1. Productos: `imageUrl` es campo de texto, no se puede subir archivos
2. Menú hamburguesas: hardcodeado como `menu-pizzas.jpeg`
3. Menú pan: hardcodeado como `menu-pan.jpeg` (ni siquiera existe)
4. Sin API de upload
5. El agente no tiene comportamiento diferenciado: "sabe producto → foto del producto" vs "no sabe → menú + 2 fotos"

## Scope

### In Scope
- POST /api/upload — endpoint para subir imágenes
- Product admin: file picker + preview en lugar de texto URL
- Agent config: uploaders para imágenes de menú (hamburguesas + pan)
- Agent prompt: comportamiento foto según contexto del cliente
- sendMenuImage tool: leer URLs desde DB en vez de hardcode

### Out of Scope
- Galería de imágenes
- Editor de imágenes (crops, filters)
- CDN externo

## Approach
1. Crear `POST /api/upload` que guarda en `public/uploads/` y devuelve URL
2. Actualizar product form con file picker que usa la API
3. Agregar campos menuImageHamburguesas y menuImagePan a agent_config
4. Actualizar sendMenuImage tool para leer desde DB
5. Actualizar prompt con comportamiento foto diferenciado

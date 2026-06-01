# SDD Specs: Sistema de Promociones + Fixes de Prompt

## Dominio: DB Schema

### ADDED: REQ-DB-1 — Columna is_promo en products

La tabla `products` **DEBE** tener una columna `is_promo` (boolean, default false) para marcar productos que son promociones.

### ADDED: REQ-DB-2 — Columna promo_price en products

La tabla `products` **DEBE** tener una columna `promo_price` (numeric, nullable) para el precio especial de la promo.

### ADDED: REQ-DB-3 — Migración de promotions + is_promo

Se **DEBE** generar una migración que cree la tabla `promotions` (ya definida en schema) y agregue `is_promo` y `promo_price` a `products`.

### ADDED: REQ-DB-4 — Productos bebidas en DB

La DB **DEBE** tener productos de la categoría `bebidas`: Coca-Cola, Sprite, Agua, etc.

---

## Dominio: Admin UI

### ADDED: REQ-UI-1 — Página de promos

El admin **DEBE** tener una página `/admin/promos` con:
- Listado de promos con nombre, precio, activo/inactivo
- Botón para crear nueva promo
- Modal/form para editar nombre, descripción, items, precio, imágenes
- Botón para eliminar (con confirmación)
- Upload de imágenes a Cloudinary

### ADDED: REQ-UI-2 — Nav item Promociones

La sidebar **DEBE** incluir un item "Promociones" que enlace a `/admin/promos`.

---

## Dominio: Agent Tools

### ADDED: REQ-TOOL-1 — getActivePromosTool

El agente **DEBE** tener un tool `getActivePromosTool` que consulte las promos activas en DB y devuelva nombre, descripción, precio y si tiene imagen.

### ADDED: REQ-TOOL-2 — sendPromoImageTool

El agente **DEBE** tener un tool `sendPromoImageTool` que acepte un promoId y envíe la imagen de la promo por WhatsApp.

#### Scenario: Promo con imagen
- GIVEN una promo activa con imageUrl configurada
- WHEN el tool se ejecuta con el promoId
- THEN envía la imagen por WhatsApp con caption del nombre + precio

#### Scenario: Promo sin imagen  
- GIVEN una promo activa sin imageUrl
- WHEN el tool se ejecuta
- THEN devuelve texto con los datos de la promo

---

## Dominio: Prompt

### ADDED: REQ-PROMPT-1 — Promos en el prompt

El system prompt **DEBE** tener una sección `[PROMOS]` que instruya al agente a:
- Consultar `getActivePromos` cuando pregunten por promos
- Enviar imagen de promo con `sendPromoImage` si tiene
- Si no tiene imagen, describir la promo en texto

### ADDED: REQ-PROMPT-2 — Confusión de precios

El system prompt **DEBE** tener una sección para cuando el cliente dice "en el menú dice otro precio":
- Responder "esa carta es vieja, tengo los precios actualizados" + foto del menú
- No discutir, no explicar, solo actualizar

### ADDED: REQ-PROMPT-3 — "Yo de nuevo"

El system prompt **DEBE** aclarar que cuando el cliente dice "yo de nuevo" o "hola de nuevo":
- NO es "lo mismo de siempre"
- Responder simple: "Holaa. Sii, decime" como si fuera nuevo
- No asumir que quiere repetir el pedido anterior

#### Scenario: Cliente vuelve
- GIVEN un cliente que ya pidió antes dice "hola, yo de nuevo"
- WHEN el bot procesa
- THEN responde "Holaa. Sii, decime" sin mencionar el pedido anterior

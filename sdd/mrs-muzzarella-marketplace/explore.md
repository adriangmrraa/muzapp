# Exploration: Marketplace + WhatsApp Order Flow

## Current State
- Landing muestra productos de DB
- Pages de productos funcionan con API
- NO hay botón "Pedir por WhatsApp" en cards
- NO hay flujo automático de pedido en conversaciones
- NO hay derivación a cocina/Telegram

## User Vision
Mrs Muzzarella marketplace estilo "Citronela/ClinicForge":
1. Cards premium de productos con imagen, precio, "Pedir" button
2. Click → WhatsApp con mensaje precargado ("Hola, quiero 2 Genesis...")
3. Conversación recibe el mensaje → agente procesa
4. Agente: detecta pedido, extrae items, crea cliente, asigna tags
5. Si hamburguesa → deriva a "cocina" (dashboard admin)
6. Si pan mayorista → deriva a Lichas por Telegram

## Affected Files
- src/components/products/product-card.tsx (agregar WhatsApp button)
- src/app/api/whatsapp/webhook/route.ts (procesamiento de pedidos)
- src/lib/whatsapp/tools/ (nuevos tools para extraer pedidos)
- src/app/(admin)/admin/conversations/page.tsx (ver pedidos)
- src/lib/telegram/tools.ts (enviar a Lichas)

## Approaches

### Approach 1: Simple WhatsApp Redirect
- Cards tienen botón "Pedir" → wa.me con mensaje
- Ventaja: simple, ya funciona
- Contras: no hay tracking en DB, no se deriva automáticamente

### Approach 2: Full Order Flow (recommended)
1. Card botón → WhatsApp con mensaje estructurado
2. Webhook recibe → agente extrae items del mensaje
3. Agente crea/actualiza cliente con tags
4. Si pan mayorista → notifica Lichas por Telegram
5. Dashboard muestra pedidos pendientes

### Approach 3: Checkout en app → WhatsApp
- Carrito en la app
- Checkout → genera mensaje WhatsApp
- Similar al 2 pero más complejo

## Recommendation
**Approach 2** — Flujo completo con agente procesando pedidos

## Steps
1. Agregar botón WhatsApp a ProductCard
2. Mejorar sistema de extracción de pedidos (detectar "quiero X", "2 de Y")
3. Agregar tools: createOrderFromMessage, notifyKitchen, notifyLichas
4. Dashboard pedidos vs conversaciones

## Ready for Proposal
Yes — proceed to proposal
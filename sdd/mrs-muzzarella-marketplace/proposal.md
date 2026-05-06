# Proposal: Mrs Muzzarella Marketplace + Order Flow + UI Upgrade

## Intent
Transformar Mrs Muzzarella en marketplace premium estilo Citronela/ClinicForge con flujo de pedidos automatizado vía WhatsApp.

## Scope

### In Scope
1. **Product Cards con WhatsApp** — Botón "Pedir" que redirige a WhatsApp con mensaje precargado
2. **Order Detection** — Agente detecta cuando cliente quiere pedir
3. **Customer Creation** — 自动 crear cliente en DB con tags
4. **Kitchen Notification** — Derivación a dashboard cocina
5. **Lichas Telegram** — Notificación por Telegram para pedidos pan mayorista
6. **UI Premium Upgrade** — Dashboard estilo ClinicForge, animations, glassmorphism

### Out of Scope
- Carrito en la app
- Checkout flow completo
- Pagos online

## Approach
**Fases iterativas**:
1. Fase 1: Producto cards + WhatsApp button
2. Fase 2: Order flow automatizado
3. Fase 3: UI premium upgrade

## Acceptance Criteria
- [ ] Cards de productos tienen botón "Pedir por WhatsApp"
- [ ] Mensaje incluye producto seleccionado
- [ ] Agente detecta pedido y responde confirmando
- [ ] Cliente se guarda en DB con tag "pedido"
- [ ] Pedidos pan mayorista notifican a Lichas por Telegram
- [ ] UI premium estilo ClinicForge
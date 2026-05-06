# Tasks: Mrs Muzzarella Marketplace + UI Upgrade

## FASE 1: PRODUCT CARDS + WHATSAPP (Semana 1)

### Tarea 1.1: WhatsApp Button Component
- [ ] Crear componente WhatsAppButton
- [ ] Integrar en ProductCard
- [ ] Testing mobile/desktop

### Tarea 1.2: Message Builder
- [ ] Función buildOrderMessage(product)
- [ ] URL encoding correcto
- [ ] GA tracking event

### Tarea 1.3: Update ProductCard Grid
- [ ] Reemplazar grid actual
- [ ] Responsive breakpoints
- [ ] Animaciones hover

---

## FASE 2: ORDER FLOW AUTOMATIZADO (Semana 2)

### Tarea 2.1: Order Detection Tool
- [ ] Agregar tool extractOrderFromMessage
- [ ] Keywords: "quiero", "pedir", "me llevo", etc.
- [ ] Parser: cantidad + producto

### Tarea 2.2: Customer Creation
- [ ] Tool: createOrUpdateCustomer
- [ ] Tags: "cliente", "pedido"
- [ ] Associate order to customer

### Tarea 2.3: Telegram Notification
- [ ] Env var TELEGRAM_LICHAS_CHAT_ID
- [ ] Tool: notifyLichas(newOrder)
- [ ] Only for pan_mayorista

### Tarea 2.4: Orders Dashboard
- [ ] Vista /admin/orders
- [ ] Tabla con estados
- [ ] Filtros por estado

---

## FASE 3: UI PREMIUM UPGRADE (Semana 3-4)

### Tarea 3.1: Theme & Tailwind Config
- [ ] Colors: dark-bg, gold, orange
- [ ] Glassmorphism utilities
- [ ] Typography scale

### Tarea 3.2: Dashboard Cards
- [ ] Stats cards con glass effect
- [ ] Animaciones stagger
- [ ] Recent activity timeline

### Tarea 3.3: Navigation Sidebar
- [ ] Sidebar component
- [ ] Collapse/expand
- [ ] Active states
- [ ] Mobile drawer

### Tarea 3.4: Orders Table
- [ ] Columns: ID, Cliente, Items, Total, Estado, Fecha
- [ ] Status badges
- [ ] Actions dropdown
- [ ] Pagination

### Tarea 3.5: Clients Cards
- [ ] Grid layout
- [ ] Client card component
- [ ] Detail view
- [ ] Tags management

### Tarea 3.6: Polish & Animations
- [ ] Page transitions
- [ ] Micro-interactions
- [ ] Loading states
- [ ] Error states

---

## Dependencies
- fase1 → fase2 → fase3 (sequential)
- Frontend: tailwind, framer-motion
- Backend: drizzle, whatsapp-tools, telegram-tools

## Estimación
- Fase 1: 2-3 horas
- Fase 2: 4-6 horas
- Fase 3: 8-12 horas
- Total: ~20 horas
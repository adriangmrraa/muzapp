# SPECS: Agente WhatsApp Mrs Muzzarella - Nivel Venta Integral

## Overview
Agente WhatsApp optimizado para ciclo completo de ventas: pre-venta, atención, venta consultiva, post-venta, estratégico.
**Arquitectura**: Parte hardcodeada + parte editable desde UI.

---

## 1. ARQUITECTURA HÍBRIDA

### Parte Fija (Hardcodeada) - ~40%
- Identidad básica: "Soy Mrs Muzzarella"
- Personalidad: español argentino, voseo
- Flujos emocionales F1-F9 adaptados a comida
- Reglas de operación (keywords, comportamento)
- Buffer de conversación

### Parte Editable (UI) - ~60%
- System prompt completo del negocio
- Instrucciones específicas de atención
- Productos destacados
- Promociones activas
- Horario de atención
- Zonas de delivery

**UI**: Modal de edición (tipo ClinicForge) donde el admin puede editar el system prompt.

---

## 2. TOOLS DEFINITIVAS (14 tools)

### Grupo A: Menú y Productos (4 tools)

#### getMenu
- **Descripción**: Lista todos los productos disponibles
- **Preguntas**: "¿Qué tienen?", "¿Menú?", "¿Qué hamburguesas hay?"

#### getProductDetails
- **Descripción**: Ver detalles de un producto específico
- **Preguntas**: "¿Qué lleva la Classic?", "¿Qué tiene la Crispy?"

#### getProductPrice
- **Descripción**: Ver precio de un producto
- **Preguntas**: "¿Cuánto sale la Classic?", "¿Cuánto es el pan?"

#### searchProducts
- **Descripción**: Buscar productos por nombre/descripción
- **Preguntas**: "¿Tienen de pollo?", "¿Hay vegetariano?"

---

### Grupo B: Disponibilidad y Delivery (3 tools)

#### checkProductAvailability
- **Descripción**: Verificar si un producto tiene stock
- **Preguntas**: "¿Tienen stock de la Crispy?", "¿Hay para ahora?"

#### checkDeliveryZone
- **Descripción**: Verificar si llegamos a una zona
- **Preguntas**: "¿Llegan a Villa del?", "¿Llegan al centro?"

#### getDeliveryTime
- **Descripción**: Obtener tiempo estimado de delivery
- **Preguntas**: "¿Cuánto tardan?", "¿Cuánto tarda?"

---

### Grupo C: Pedidos (5 tools)

#### createOrder
- **Descripción**: Crear un nuevo pedido
- **Preguntas**: "Quiero una Classic", "Pedido: 2 Pollo"

#### getOrderStatus
- **Descripción**: Consultar estado de un pedido
- **Preguntas**: "¿Mi pedido?", "¿Ya está listo?"

#### addToOrder
- **Agregar productos a un pedido existente**

#### updateOrder
- **Modificar un pedido** (cambiar items, notas)

#### cancelOrder
- **Cancelar un pedido**

---

### Grupo D: Cliente y Venta Consultiva (2 tools)

#### getClientHistory
- **Descripción**: Ver historial de pedidos de un cliente
- **Preguntas**: "¿Qué pedí la última vez?"

#### suggestProducts
- **Descripción**: Sugerir productos según historial del cliente
- **Preguntas**: "¿Qué me recomienda?", "¿Qué le gusta a la gente?"

---

### Grupo E: Info Negocio (1 tool)

#### getBusinessInfo
- **Descripción**: Info del negocio (horario, ubicación, contacto)
- **Preguntas**: "¿Dónde están?", "¿Horario?", "¿Teléfono?"

---

## 3. UI - EDITOR DE SYSTEM PROMPT

### Ubicación
- `/admin/agente` o `/admin/whatsapp` (nueva ruta)

### Campos Editables
```
- systemPrompt: Textarea (~500 caracteres)
- instrucciones: Textarea (~300 caracteres)
- horarioAtencion: Text (ej: "Lun-Sáb: 11-14, 19-23")
-promocionesActivas: Textarea (~200 caracteres)
- zonasDelivery: JSON editable
```

### Comportamiento
- Solo admins pueden editar
- Previewen tiempo real
- Guardar en DB (agent_config)
- Fallback a valores por defecto

---

## 4. ACCEPTANCE CRITERIA

- [ ] ~60% del prompt editable desde UI
- [ ] Modal de edición funcional
- [ ] Preview del prompt en UI
- [ ] 14 tools funcionando
- [ ] Fallback a valores por defecto
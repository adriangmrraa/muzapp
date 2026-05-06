# EXPLORE: Agente WhatsApp Mrs Muzzarella - Análisis de Situaciones Reales

## Contexto
WhatsApp es el canal PRINCIPAL de ventas de Mrs Muzzarella. El agente actual tiene ~5 tools básicas, necesita cubrir TODAS las situaciones de clientes reales.

---

## Metodología
Analizar situaciones REALES de clientes típicos de una rotisería/hamburguesería en Formosa.

---

## Situaciones documentadas (14 escenarios)

### 1. CONSULTA DE PRECIO
- "¿Cuánto sale la Classic?"
- "¿El combo cuánto vale?"
- "¿Cuánto es el pan español?"

### 2. MENÚ / PRODUCTOS
- "¿Qué tienen?"
- "¿Qué hamburguesas hay?"
- "¿Qué me recomienda?"
- "¿Cuál es la más popular?"

### 3. DISPONIBILIDAD / URGENCIA
- "¿Tienen para ahora?"
- "¿Cuánto tardan?"
- "¿Hay stock de la Crispy?"
- "¿Puedo pasar a buscar en 15 min?"

### 4. DELIVERY / ZONA
- "¿Llegan a Villa del?"
- "¿Hasta qué hora deliveran?"
- "¿Cuesta delivery?"
- "¿Cuánto tarda?"

### 5. HACER PEDIDO
- "Quiero una Classic"
- "Pedido: 2 Pollo, 1 Carne"
- "Una para llevar"
- "Sin cebolla"

### 6. SEGUIMIENTO
- "¿Mi pedido está listo?"
- "¿Cuándo llega?"
- "¿Puedo cambiarlo?"

### 7. PROBLEMA / RECLAMO
- "Llegó fría"
- "Me faltó algo"
- "Quiero cancelar"

### 8. HISTORIAL / VENTA CONSULTIVA
- "¿Qué me recomienda?"
- "¿Qué pedí la última vez?"

### 9. PRIMERA VEZ
- "Primera vez, qué pido?"
- "¿Cuál es la mejor?"

### 10. NEGOCIO / INFO
- "¿Dónde están?"
- "¿Horario?"
- "¿Abierto hoy?"

---

## Mapping: Situación → Tool Necesaria

| Situación | Tool Requerida |
|-----------|---------------|
| 1. Precio | getProductPrice, getAllPrices |
| 2. Menú | getMenu, searchProducts |
| 3. Disponibilidad | checkProductAvailability, checkDeliveryTime |
| 4. Delivery | checkDeliveryZone, getDeliveryZones, getDeliveryTime |
| 5. Hacer pedido | createOrder, addToOrder |
| 6. Seguimiento | getOrderStatus, updateOrder |
| 7. Problema | cancelOrder, getOrderDetails |
| 8. Historial | getClientHistory, suggestProducts |
| 9. Primera vez | suggestProducts, getPopularProducts |
| 10. Info negocio | getBusinessHours, getLocation, getContactInfo |

---

## Conclusiones

1. **14 tools** necesarias vs las ~5 actuales
2. Distinto de Telegram (gestión interna) - WhatsApp es **venta**
3. Flujos emocionales adaptados a comida
4. Prioridad: crear pedido > consultar > info

## Próximos Pasos
- Crear specs detalladas
- Implementar tools faltantes
- Integrar con agente actual
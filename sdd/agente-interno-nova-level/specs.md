# SPECS: Agente Interno Mrs Muzzarella Nivel NOVA

## Overview
Adoptar la metodología NOVA de ClinicForge para Mrs Muzzarella (Telegram + WhatsApp).

---

## 1. SYSTEM PROMPT (~150 líneas)

### Estructura

```
## Identidad
- Mrs Muzzarella
- Rotisería premium italiana en Formosa, Argentina
- Vos: asistente de gestión y ventas

## Personalidad
- Lenguaje: español argentino informal (voseo)
- Tono: amable, directo, proactivo
- Nunca vender de más, siempre有所帮助

## Reglas de Operación

### Keywords del Sistema
| Keyword | Acción |
|---------|--------|
| "pedir" / "quiero" | Modo pedido |
| "consultar" | Modo consulta |
| "estado" | Consulta estado |
| "hola" / "buenas" | Saludo proactivo |
| "gracias" | Agradecimiento |
| "cancelar" | Cancela si es posible |

### Comportamiento Proactivo
- Recordar datos del cliente (nombre, pedidos anteriores)
- Sugerir productos basados en historial
- Confirmar antes de actuar
- OFRECER siempre algo más antes de cerrar

### Buffer de Conversación
- Mantener últimos 5 mensajes en contexto
- Entender contexto de la conversación

---

## 2. TOOLS (Arquitectura Maestra → Sub-tools)

### Tools Maestras
1. **queryOrder** - Consultas de pedidos
2. **manageClient** - Gestión de clientes
3. **manageProduct** - Consultar productos
4. **manageOrder** - Crear/gestionar pedidos

### Sub-tools por Maestra

#### queryOrder (delegante)
- getOrderById
- getOrderStatus
- getOrderHistory
- searchOrdersByDate
- getPendingOrders

#### manageClient (delegante)
- getClientByPhone
- createClient
- updateClient
- getClientHistory
- getClientPreferences

#### manageProduct (delegante)
- getProductById
- getAllProducts
- getProductsByCategory
- searchProducts
- getProductAvailability

#### manageOrder (delegante)
- createOrder
- updateOrderStatus
- addItemToOrder
- removeItemFromOrder
- cancelOrder
- calculateTotal
- confirmOrder

---

## 3. WEBHOOK AUTOMÁTICO

### Setup Automático
- Al iniciar el bot, configurar webhook automáticamente
- Usar TELEGRAM_WEBHOOK_TOKEN del entorno
- URL: https://domain.com/api/telegram/webhook

### Fallback
- Si no hay token en DB, usar env var
- Si no hay env var, mostrar en /admin/telegram

---

## 4. DATOS A RECORDAR (Proactividad)

### Por Cliente
- Nombre
- Teléfono
- Pedidos anteriores (últimos 3)
- Preferencias (qué le gusta)
- Historial de cancelaciones

### Sugerencias
- "¿Te gustaría la hamburguesa de siempre?"
- "Hoy tenemos stock de X que te gustó"

---

## 5. ACCEPTANCE CRITERIA

- [ ] Prompt de ~150 líneas con keywords
- [ ] 4 tools maestras + 12 sub-tools
- [ ] Keywords para entender pedidos
- [ ] Comportamiento proactivo
- [ ] Webhook automático con token
- [ ] Buffer de 5 mensajes
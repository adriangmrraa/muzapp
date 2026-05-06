# EXPLORE: Agente Interno Mrs Muzzarella Nivel NOVA

## Contexto
Mrs Muzzarella tiene actualmente:
- Agente WhatsApp (YCloud): ~6 tools, prompt parcial
- Agente Telegram: 4 tools, prompt básico (~25 líneas)

NOVA de ClinicForge tiene:
- ~15+ tools
- Prompt ~150 líneas
- Keywords explícitas
- Comportamiento proactivo
- Buffer de conversación
- Capacidad de modificar datos

## Análisis de Opciones

### Opción 1: Expandir solo Telegram
- Pros: MenorScope, rápido
- Cons: WhatsApp sigue básico

### Opción 2: Unificar ambos agentes
- Pros: Mismo nivel para todos los canales
- Cons: Más trabajo

### Opción 3: Arquitectura de Tools Maestras (ELEGIDA)
- Tools principales que delegan a sub-tools
- No satura el contexto
- Escalable

## Herramientas Maestras Propuestas

1. **queryOrder** → delegates to: getTodaysOrders, getOrdersByStatus, getAllOrders
2. **manageClient** → delegates to: getClients, getClientDetail, searchClient
3. **getAnalytics** → delegates to: getWeeklyStats, getMonthlyStats, getRevenue
4. **manageOrder** → delegates to: updateOrderStatus, cancelOrder

## Tech Considerations
- AI SDK v6 con inputSchema
- Tools con .optional() para params vacíos
- Buffer de mensajes en memoria (Redis opcional)

## References
- ClinicForge NOVA agent
- Vercel AI SDK docs
# Proposal 3: Correccion de Bugs y Errores

## Problemas a resolver
- whatsappId = "whatsapp" hardcodeado (TODOS los clientes comparten conversacion) - CRITICO
- createOrderTool no limpia order-context → items fantasma - CRITICO
- checkHumanOverride falla silenciosamente → AI responde sobre humano - CRITICO
- Delivery notification sin identificar cliente - CRITICO
- Descripcion de tool en japones/coreano
- addToOrder no recalcula deliveryFee
- transferToHuman busca en chatMessages donde no se guardan
- getOrderStatusTool no normaliza telefono
- sanitizeInput code muerto (se llama pero no se usa)
- stepCountIs(10) corta respuesta (deberia ser 15)
- DEFAULT_SYSTEM_PROMPT sin datos de menu

## Solucion propuesta
1. whatsappId = customerPhone (no "whatsapp" hardcodeado) 
2. Limpiar order-context despues de createOrder
3. checkHumanOverride con try/catch y fallback seguro
4. Delivery notification con orderId
5. Traducir descripcion japones a espanol
6. Recalcular deliveryFee en addToOrder
7. transferToHuman buscar en conversations.messages
8. normalizePhone en getOrderStatusTool
9. Usar sanitizedMessage en lugar de ignorarlo
10. stepCountIs(15)
11. DEFAULT_SYSTEM_PROMPT con menu basico

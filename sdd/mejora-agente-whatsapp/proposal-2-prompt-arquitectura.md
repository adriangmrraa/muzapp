# Proposal 2: Prompt Dinamico y Arquitectura de Tools

## Problemas a resolver
- System prompt estatico (solo inyecta menu)
- Sin mapeo de sinonimos para productos
- Sin flujos emocionales para el cliente
- Tools duplicadas en agent.ts (DRY violado)
- confirmOrderTool no ejecuta createOrder real
- order-context no se limpia al crear pedido
- pendingOrder no busca "preparing"

## Solucion propuesta
1. buildSystemPrompt() como ClinicForge: inyectar menu, horarios, promos, config cocina, alias MP
2. Agregar mapeo de sinonimos para que el agente entienda "dame una Gene" → Genesis
3. Flujos emocionales basicos F1-F4 (urgencia, precio, queja, duda)
4. Refactor tools a una sola lista (eliminar duplicacion)
5. Arreglar confirmOrderTool para que ejecute createOrder
6. Arreglar pendingOrder para que busque "pending" y "preparing"
7. Limpiar order-context despues de createOrder

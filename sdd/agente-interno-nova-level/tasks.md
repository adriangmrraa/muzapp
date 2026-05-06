# TASKS: Agente Interno Mrs Muzzarella Nivel NOVA

## Implementar Agente interno Mrs Muzzarella (Telegram + WhatsApp) nivel NOVA

### Task Breakdown

#### Fase 1: Expandir System Prompt
- [ ] 1.1 Expandir src/lib/telegram/system-prompt.ts de ~25 a ~150 líneas
- [ ] 1.2 Agregar identidad Mrs Muzzarella (nombre, rol, personalidad)
- [ ] 1.3 Agregar keywords del sistema (pedir, quiero, consultar, estado, hola, gracias, cancelar)
- [ ] 1.4 Agregar comportamiento proactivo
- [ ] 1.5 Agregar buffer de 5 mensajes

#### Fase 2: Herramientas (Tools)
- [ ] 2.1 Crear toolsQuery.ts - Tools maestras de consulta
- [ ] 2.2 Crear toolsClient.ts - Gestión de clientes
- [ ] 2.3 Crear toolsProduct.ts - Gestión de productos
- [ ] 2.4 Crear toolsOrder.ts - Gestión de pedidos
- [ ] 2.5 Registrar todas las tools en index.ts
- [ ] 2.6 Actualizar system-prompt.ts para usar nuevas tools

#### Fase 3: Webhook Automático
- [ ] 3.1 Modificar startup del bot para configurar webhook automáticamente
- [ ] 3.2 Agregar fallback a env si DB no tiene token
- [ ] 3.3 Agregar logging de webhook configurado

#### Fase 4: Proactividad
- [ ] 4.1 Agregar almacenamiento de historial de pedidos por cliente
- [ ] 4.2 Implementar suggestProducts() basado en historial
- [ ] 4.3 Agregar greeting proactivo

#### Fase 5: WhatsApp (mismo nivel)
- [ ] 5.1 Agregar mismas tools a WhatsApp
- [ ] 5.2 Agregar mismo system prompt a WhatsApp

---

## Dependencies
- DB con clientes, pedidos, productos (ya existe)
- Encryption lib (ya existe)
- Telegram bot infrastructure (ya existe)

## Notes
- WhatsApp usa misma DB que Telegram
- Tools son agnósticas al canal
- Proactividad requiere historial en DB
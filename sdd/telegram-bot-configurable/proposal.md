# SDD: Telegram Bot Configurable desde UI

## Explore
- UI ya tiene formulario (telegram-config.tsx)
- Actions ya existensetTelegramWebhookAction, removeTelegramWebhookAction
- PERO: No hay campo telegramBotToken en schema
- POR ESO: No se guarda nada

## Proposal
Hacer que Telegram Bot sea configurable 100% desde UI como ClinicForge.

## Specs

### 1. DB Schema
- Agregar telegramBotToken (text, encrypted with AES)
- Agregar telegramWebhookToken (varchar)
- Agregar telegramChatId para notificaciones

### 2. Encriptación
- Función encrypt/decrypt con AUTH_SECRET como clave
- AES-256-GCM

### 3. UI
- Form para input de Bot Token
- Test de conexión
- Set/Remove webhook
- Ver estado del bot

### 4. Handler
- Leer token encriptado de DB
- Usar para todas las operaciones

## Tasks
- [ ] 1. Agregar campos a schema
- [ ] 2. Crear util encryption
- [ ] 3. Guardar en actions
- [ ] 4. Leer desencriptado en handler
- [ ] 5. Probar desde UI
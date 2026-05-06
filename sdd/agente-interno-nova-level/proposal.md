# PROPOSAL: Elevar Agente Interno Mrs Muzzarella a Nivel NOVA

## Intent
Transformar el agente interno de Mrs Muzzarella (Telegram + WhatsApp) al nivel de NOVA de ClinicForge, usando arquitectura de tools maestras.

## Scope

### In Scope
1. **System Prompt** - Expandir de ~25 a ~150 líneas
2. **Tools Maestras** - Arquitectura de delegación
3. **Keywords** - Para entender al usuario
4. **Comportamiento Proactivo** - Recordar, sugerir, confirmar
5. **Buffer de Conversación** - Últimos mensajes
6. **Webhook Automático** - Si hay token en env

### Out of Scope
- Modificar ClinicForge (solo referencia)
- Multi-tenant completo
- Nuevos canales (solo optimizar existentes)

## Approach
Arquitectura de tools maestras que delegan a sub-tools para no saturar contexto.

## Acceptance Criteria
- [ ] Prompt de ~150 líneas
- [ ] 4 tools maestras + 10+ sub-tools
- [ ] Keywords para entender pedidos
- [ ] Comportamiento proactivo
- [ ] Webhook automático con token en env
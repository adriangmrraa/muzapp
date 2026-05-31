# Proposal: Reingeniería del Bot de Telegram Mrs Muzzarella

## Intent
Rediseñar el bot de Telegram de Mrs Muzzarella inspirándose en la arquitectura del bot de ClinicForge (Nova) para que:
1. **Entienda órdenes en lenguaje natural** sin perderse
2. **Encadene tools automáticamente** (buscar cliente → crear pedido → notificar)
3. **Mantenga contexto entre mensajes** sin arrastrar basura
4. **Resuelva clientes por nombre aunque estén mal escritos**
5. **Tenga memoria persistente** (recordar preferencias del admin)

## Scope

### Incluye
| Módulo | Descripción | Referencia ClinicForge |
|--------|-------------|----------------------|
| **System Prompt** | Reescribir completamente (~130 líneas) con jerarquía de decisiones, mapeo semántico, flujos de encadenamiento | `nova_prompt.py` |
| **Tools descriptions** | Mejorar descriptions de las 37 tools para que el LLM entienda cuándo usar cada una | `nova_tools.py` |
| **Handler loop** | Mejorar el tool loop: más rounds, mejor manejo de errores, filtrado de historial | `telegram_bot.py` |
| **Meta-tool** | Agregar `herramienta_avanzada` para CRUD genérico de tablas (queryData mejorado) | `herramienta_avanzada` |
| **Memoria persistente** | Agregar tools `guardar_memoria`, `buscar_memorias` (vía Engram) | Engram integration |
| **Notificaciones** | Mejorar `notifier.ts` con más eventos y templates | `telegram_notifier.py` |

### No incluye
- ❌ Cambio a polling mode (seguimos con webhook)
- ❌ Sistema de Redis buffer (ya tenemos BufferManager)
- ❌ Multi-tenant (no aplica a MuzApp)

## Approach

### Fase 1: System Prompt (el cambio más importante)
Reescribir el prompt con:
- **REGLA DE ORO**: orden explícita → ejecutar; proactividad solo si usuario no sabe
- **PRINCIPIO JARVIS**: ejecutar primero, preguntar después
- **RESOLUCIÓN INTELIGENTE**: búsqueda fonética, variaciones de nombre, ambigüedad
- **MAIPEO SEMÁNTICO**: "dame una Géne" → Genesis, "2 de pollo" → Crispy Pollo
- **FLUJOS COMPLETOS**: crear pedido, buscar cliente, cargar backfill
- **FORMATO TELEGRAM**: HTML, emojis, conciso

### Fase 2: Tools
- Mejorar descriptions de todas las tools
- Agregar meta-tool `herramienta_avanzada` para consultas SQL genéricas
- Agregar tools de memoria: `guardar_memoria`, `buscar_memorias`

### Fase 3: Handler
- Aumentar `stepCountIs` de 10 a 15
- Mejorar filtrado de historial
- Agregar manejo de errores de tools

### Orden: Fase 1 → Fase 2 → Fase 3

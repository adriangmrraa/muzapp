# Design Fase D: Normalización en WhatsApp + API REST

## Estrategia

Igual que en Fase C: llamar `normalizePhone()` AL INICIO de cada función que recibe un teléfono, ANTES de cualquier operación de DB.

## Archivos a Modificar

| Archivo | Función/Handler | Dónde Normalizar |
|---------|----------------|-----------------|
| `src/lib/whatsapp/lead-capture.ts` | `captureLeadIfNew()` | Al inicio, antes de buscar/insertar |
| `src/app/api/leads/route.ts` | `POST` handler | Después de Zod parse, antes del insert |
| `src/app/api/leads/update/route.ts` | `PATCH` handler | Después de extraer body |
| `src/lib/whatsapp/tools/create-order.ts` | `execute` del tool | Al inicio, normalizar customerPhone |
| `src/lib/channels/router.ts` | `findOrCreateConversation()` | Antes de asignar a customerPhone |

## Principios

1. **Normalizar lo más temprano posible** en el flujo
2. **No cambiar interfaces públicas** — solo implementación interna
3. **Importar desde phone-utils** (no re-implementar regex)

# Proposal: Sincronizar Productos DB <> Prompts

## Intent
Actualizar el MAPEO SEMANTICO del prompt de Telegram para cubrir TODOS los 25 productos reales de la DB, y asegurar que tanto Telegram como WhatsApp trabajen con los nombres exactos.

## Scope
- Actualizar MAPEO SEMANTICO en system-prompt.ts de Telegram
- NO tocar WhatsApp (ya usa menu dinamico)
- NO hardcodear precios (el menu dinamico los provee)

## Approach
Reemplazar el MAPEO SEMANTICO actual del prompt de Telegram con uno completo que cubra:
- Las 6 hamburguesas con sus variantes coloquiales
- Los 3 acompanamientos
- Los 10 panes con sus combinaciones (4u/12u, Sesamo/Parmesano)
- Los 5 tragos VIP con variantes
- La unica bebida

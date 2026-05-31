# Design: Sincronizar Productos

## Estrategia
Un solo cambio: reemplazar el MAPEO SEMANTICO en system-prompt.ts con la version completa de los 25 productos.

No se toca:
- WhatsApp prompt (ya usa menu dinamico)
- resolveItems() (ya funciona bien)
- Ninguna otra tool

## Archivo a modificar
src/lib/telegram/system-prompt.ts

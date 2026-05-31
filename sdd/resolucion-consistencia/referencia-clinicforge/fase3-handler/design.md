# Design Fase 3: Handler

## Cambios

| Aspecto | Actual | Nuevo | Por qué |
|---------|--------|-------|---------|
| stepCount | 10 | 15 | Permitir cadenas más largas (buscar→crear→pedido→notificar) |
| Historial | 6 msg | 6 msg (se mantiene) | Suficiente para contexto sin arrastrar basura |
| Tool error handling | Se corta | Sigue a la siguiente | Si una tool falla, el bot intenta otra |

## Archivo a modificar
`src/app/api/telegram/webhook/[token]/route.ts`

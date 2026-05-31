# Design Fase 2: Tools

## Mejora de Descriptions (37 tools)

Para CADA tool, la description debe decir:
1. QUÉ hace (en lenguaje natural)
2. CUÁNDO usarla (ejemplos de lo que dice el admin)
3. QUÉ esperar como resultado

## Meta-tool: `consulta_avanzada`

Reemplaza el `queryData` actual por uno más potente que acepte:
- `tabla`: cualquier tabla del sistema
- `accion`: "buscar" | "contar" | "agrupar"
- `filtros`: array de {columna, valor}
- `orden`: columna + dirección
- `limite`: máximo resultados

## Tools de Memoria

Usando Engram (ya disponible en el sistema):
- `guardar_memoria`: guarda un dato que el admin quiere recordar
- `buscar_memorias`: busca datos guardados previamente

## Archivos a modificar
- `src/lib/telegram/toolsManagement.ts` — mejorar descriptions + meta-tool + memoria
- `src/lib/telegram/toolsClient.ts` — mejorar descriptions
- `src/lib/telegram/toolsOrder.ts` — mejorar descriptions
- `src/lib/telegram/tools.ts` — exportar nuevas tools

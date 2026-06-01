# SDD Propose: Productos Genéricos — Preguntar Variante Antes de Agregar

## Intent

Cuando un cliente dice "quiero 2 hamburguesas", el agente a veces responde "Dale" sin preguntar qué variante. Como resultado, se agrega un producto genérico o se confunde al cliente. Queremos que si el cliente pide genéricamente "hamburguesa", "una hamburguesa", "2 hamburguesas", SIN especificar variedad (bookbinder, genesis, deli, crispy, classic), el agente pregunte ANTES de ejecutar `addOrderItem`.

## Scope

### In Scope

1. Agregar regla en `[FLUJO]` y `[PEDIDOS]` del system prompt
2. Definir qué palabras gatillan la pregunta de variante ("hamburguesa", "hamburguesas", "burger", "una hamburguesa", etc.)
3. Incluir lista de variantes disponibles para que el agente pueda listarlas

### Out of Scope

- No necesita tools nuevas
- No modificar `agent.ts`
- No tocar lógica de `addOrderItem`

## Approach

En `DEFAULT_SYSTEM_PROMPT`:

### En `[FLUJO]`:

Agregar: "Antes de ejecutar addOrderItem, verificar que el producto esté bien especificado. Si el cliente pide 'hamburguesa' genéricamente, preguntar qué variante quiere."

### En `[PEDIDOS]`:

Agregar: "Variantes de hamburguesa disponibles: Bookbinder (carne), Crispy Pollo (pollo), Classic Carne (carne), Deli Deli (carne con verduras), Toro (carne). Si el cliente pide 'hamburguesa' sin especificar, preguntá cuál de estas quiere."

### En `[NO HACÉS]`:

Agregar: "NO asumas que 'hamburguesa' significa una variedad específica. Siempre preguntá cuál."

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/whatsapp/prompt-builder.ts` | Modify | Agregar reglas de productos genéricos en `[FLUJO]`, `[PEDIDOS]` y `[NO HACÉS]` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Cliente se cansa de que le pregunten siempre | Low | Solo pregunta si no especificó. Si ya dijo "bookbinder", pasa directo |
| Cliente dice "dame lo de siempre" y el agente pregunta de nuevo | Medium | Ya cubierto por flujo de preferencias — si tiene preferencias, sugerir esas |
| La lista de variantes se desactualiza | Low | Se actualiza manualmente cuando cambien los productos |

## Success Criteria

- [ ] Cliente dice "quiero una hamburguesa" → "¿Cuál querés? Tengo Bookbinder (carne), Crispy Pollo (pollo)..."
- [ ] Cliente dice "dame 2 bookbinder" → "Dale" + `addOrderItem` (ya especificó, normal)
- [ ] Cliente dice "quiero hamburguesas" → "Dale, ¿cuáles? Tengo varias opciones..."

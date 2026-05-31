# Specs: Reingeniería del Bot de Telegram Mrs Muzzarella

## Fase 1: System Prompt

### Archivo a modificar
`src/lib/telegram/system-prompt.ts`

### Estructura del nuevo prompt (~130 líneas)

```
1. ROL (2 líneas): quién es, qué hace, quién le habla
2. REGLA DE ORO (5 líneas): orden explícita → ejecutar. Proactividad solo si usuario no sabe.
3. PRINCIPIO JARVIS (8 líneas): ejecutar, inferir, solo preguntar si imposible
4. MAPEO SEMÁNTICO (15 líneas): "dame una Géne" → Genesis, "2 de pollo" → Crispy Pollo
5. RESOLUCIÓN INTELIGENTE (10 líneas): búsqueda fonética, variaciones, ambigüedad
6. FORMATO TELEGRAM (5 líneas): HTML, emojis, max 4 líneas
7. ARSENAL (20 líneas): lista de herramientas con qué hace cada una
8. FLUJOS COMPLETOS (30 líneas): crear pedido, buscar cliente, backfill, cambiar nombre
9. TABLAS (10 líneas): leads, orders, conversations
10. REGLAS (15 líneas): no inventar, preguntar antes de eliminar, cada mensaje es nuevo
```

### Ejemplo de MAPEO SEMÁNTICO
```
"Géne" / "Genesis" / "Génesis" → "Genesis" (hamburguesa de carne, $4000)
"Deli" / "Deli Deli" / "Doble carne" → "Deli Deli" (hamburguesa de carne, $5000)
"Mami" / "Mamita" → "Mamita" (hamburguesa de carne, $6000)
"Book" / "Bookbinder" → "Bookbinder" (hamburguesa de carne, $7000)
"Toro" / "Toro Asado" → "Toro Asado" (hamburguesa de carne, $8000)
"Pollo" / "Crispy" → "Crispy Pollo" (hamburguesa de pollo)
"Papas" / "Fritas" → "Papas Fritas" ($4000)
"Pan" / "Prepizza" → productos de pan mayorista
```

### Criterios de aceptación
- ✅ Admin dice "cargá un pedido para Juan, 2 Géne" → bot crea pedido
- ✅ Admin dice "hay una que se llama dss mat, cambiale el nombre a Mat" → bot busca y cambia
- ✅ Admin dice "cuantos clientes tenemos" → bot responde 137
- ✅ Admin dice "cerrá la cocina" → bot cierra cocina
- ✅ Bot NO responde con "Si necesitás más información, decime"
- ✅ Bot NO repite información del mensaje anterior

## Fase 2: Tools

### Archivos a modificar
- `src/lib/telegram/tools.ts` — agregar meta-tool
- `src/lib/telegram/toolsManagement.ts` — mejorar descriptions, agregar herramientas de memoria
- `src/lib/telegram/toolsClient.ts` — mejorar descriptions
- `src/lib/telegram/toolsOrder.ts` — mejorar descriptions

### Meta-tool `herramienta_avanzada`
Agregar una tool que acepte:
```typescript
{
  accion: "buscar" | "crear" | "actualizar" | "eliminar" | "contar",
  tabla: "leads" | "orders" | "products" | "conversations" | "agent_config" | "addresses",
  filtros: [{columna: string, valor: string}],
  datos?: Record<string, unknown>, // para crear/actualizar
}
```

### Tools de memoria persistente
```typescript
guardar_memoria(clave: string, valor: string) // guarda en Engram
buscar_memorias(consulta: string) // busca en Engram
```

### Criterios de aceptación
- ✅ admin puede preguntar "qué aprendiste de mí" y el bot responde
- ✅ admin dice "acordate que Martínez paga después" → bot guarda
- ✅ admin dice "cómo era lo de Martínez" → bot busca memoria

## Fase 3: Handler

### Archivo a modificar
`src/app/api/telegram/webhook/[token]/route.ts`

### Cambios
1. Aumentar `stepCountIs(10)` → `stepCountIs(15)`
2. Filtrar mensajes de tool calls del historial (solo user/assistant)
3. Mejorar manejo de errores de tools (no cortar la cadena si una tool falla)
4. Agregar logger estructurado

### Criterios de aceptación
- ✅ Bot puede encadenar 5+ tools sin cortarse
- ✅ Si una tool intermedia falla, el bot intenta otra en vez de rendirse
- ✅ Historial no incluye mensajes internos de tool calling

# Design Fase 1: System Prompt

## Decisión Arquitectónica

| Aspecto | Decisión | Por qué |
|---------|----------|---------|
| Estructura | Monolítico (~130 líneas) | ClinicForge demo que funciona mejor que split |
| Idioma | Español rioplatense voseo | Misma audiencia |
| Formato respuesta | HTML con etiquetas <b>, listas ▸ | ClinicForge comprobado que funciona en Telegram |
| Proactividad | Solo si usuario no sabe qué hacer | Evita respuestas no solicitadas |
| Resolución clientes | Búsqueda fonética + variaciones | "dss mat" → "D.S Matt" |

## Estructura del Prompt

```
1. ROL + IDENTIDAD (3 lines)
2. REGLA DE ORO (5 lines) — orden → ejecutar. Proactividad solo si necesario.
3. PRINCIPIO JARVIS (8 lines) — ejecutar, inferir, preguntar solo si imposible
4. MAPEO SEMÁNTICO (15 lines) — "Géne" → Genesis, "de pollo" → Crispy Pollo
5. FORMATO (5 lines) — HTML, emojis, conciso, sin "decime" al final
6. HERRAMIENTAS (30 lines) — lista con qué hace cada una
7. FLUJOS (25 lines) — ejemplos de diálogo real
8. TABLAS (8 lines) — estructura de la DB
9. REGLAS (15 lines) — no inventar, preguntar antes de eliminar
10. MAPEO ADICIONAL (10 lines) — productos con sus variantes coloquiales
```

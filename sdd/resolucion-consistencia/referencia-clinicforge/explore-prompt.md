# Comparación de System Prompts: ClinicForge Nova vs MuzApp

## 1. ClinicForge Nova — Estructura del Prompt

**Archivo**: `orchestrator_service/services/nova_prompt.py` (210 líneas)
**Función**: `build_nova_system_prompt()` — generado dinámicamente con `clinic_name`, `page`, `user_role`, `tenant_id`, y timezone-aware timestamp.

### Secciones identificadas:

| # | Sección | Líneas | Propósito |
|---|---------|--------|-----------|
| 1 | **IDIOMA** | 20 | Declaración de idioma (única línea, imperativa) |
| 2 | **Identidad** | 22-23 | Quién es, dónde está, rol, timestamp |
| 3 | **REGLA DE ORO** | 25-32 | Prioridad máxima: órdenes explícitas > proactividad |
| 4 | **PRINCIPIO JARVIS** | 34-39 | Framework de 5 reglas para decidir cuándo ejecutar vs sugerir vs preguntar |
| 5 | **RESOLUCIÓN INTELIGENTE** | 41-47 | Estrategias para ambigüedad, fallos, búsquedas |
| 6 | **MODO POR PÁGINA** | 49-71 | 9 páginas con prioridades + proactividad específica |
| 7 | **FORMATO TELEGRAM** | 73-81 | Reglas de renderizado + ejemplo concreto |
| 8 | **MEMORIA PERSISTENTE** | 83-87 | Cuándo y cómo guardar memorias (Engram) |
| 9 | **REPORTES PDF** | 89-98 | Flujo de generación de PDFs |
| 10 | **ROL** | 100-101 | Permisos por rol (CEO/Professional/Secretary) |
| 11 | **ARSENAL** | 103-115 | Catálogo de tools agrupadas por dominio |
| 12 | **FLUJOS** | 117-200 | Flujos detallados: agenda, pacientes, mensajes, odontograma, facturación |
| 13 | **REGLAS TEMPORALES** | 121-125 | Regla con fecha de expiración (vigente hasta 2026-05-15) |
| 14 | **MAPEO DENTAL** | 170-190 | Diccionario masivo de sinónimos (niño de 6 años, léxico de paciente) |
| 15 | **ENCADENAMIENTO** | 202-207 | Patrones de multi-tool sin confirmación |
| 16 | **PROACTIVIDAD + IDs** | 209-210 | Alertas automáticas + resolución de IDs |

### Estilo:
- **Voz**: "Sos Nova, IA operativa de X. No asistente — sistema nervioso central."
- **Tono**: Imperativo, directo, sin cortesía ("PROHIBIDO", "NUNCA", "SIEMPRE", "OBLIGATORIO")
- **Longitud**: Muy extenso (~210 líneas), cubre TODOS los casos de borde
- **Estrategia clave**: **Enseña con ejemplos de diálogo real** y **mapeo de lenguaje natural a herramientas**

### Líneas destacadas (quote exacto):

> "Sos Nova, IA operativa de `{clinic_name}`. No asistente — sistema nervioso central."

> "REGLA DE ORO (POR ENCIMA DE TODO): Cuando el usuario te da una orden EXPLÍCITA, ejecutá SOLAMENTE lo que te pidió. NO sugieras, NO te adelantes, NO ofrezcas pasos siguientes, NO ejecutes tareas adicionales."

> "PRINCIPIO JARVIS: 1. TE PIDEN → EJECUTÁS inmediatamente la orden exacta. Sin 'voy a buscar' ni 'déjame verificar'. 2. VES OPORTUNIDAD Y TENÉS PERMISO → SUGERÍ (solo si no hay orden explícita del usuario). 3. FALTA DATO → INFERILO del contexto. Solo si imposible → preguntá UNA vez. 4. Solo POST-EJECUCIÓN y SOLO si no hay nueva orden → ofrecé el siguiente paso. 5. NUNCA 'no puedo'/'no tengo acceso'. TENÉS TODO. BUSCALO."

> "RESOLUCIÓN INTELIGENTE: - Parámetro no coincide → buscá el más cercano y usalo - Estado/código 'no existe' → mapeá al equivalente válido - Tool falla → intentá otros params o tool alternativa - Ambigüedad → elegí la más probable, ejecutá. Si mal → usuario corrige → guardar_memoria(feedback) - 'hacé eso'/'lo mismo'/'dale' → inferí del contexto - Búsqueda vacía → variaciones: sin acentos, solo apellido, abreviaciones"

> "ENCADENAMIENTO (TU DIFERENCIAL): 3-5 tools sin confirmación, 6+ aceptable."

> "⚠️ REGLA TEMPORAL (VIGENTE HASTA 2026-05-15): Antes de agendar, SIEMPRE preguntar: '¿Particular o con obra social?'"

> "MAPEO DENTAL (OBLIGATORIO — resolver SIEMPRE, nunca 'no existe'): ausente: sacaron/extraída/no tiene/falta/missing/cayó/edéntulo..."

---

## 2. MuzApp — Estructura Actual del Prompt

**Archivo**: `src/lib/telegram/system-prompt.ts` (56 líneas)
**Variable**: `INTERNAL_AGENT_SYSTEM_PROMPT`

### Secciones identificadas:

| # | Sección | Líneas | Propósito |
|---|---------|--------|-----------|
| 1 | **Identidad** | 2 | Quién es y quién le habla |
| 2 | **CÓMO RESPONDER** | 4-8 | 4 reglas de comportamiento |
| 3 | **EJEMPLOS DE DIÁLOGO** | 10-31 | 6 ejemplos admin→bot con tools inline |
| 4 | **ATAJO MENTAL** | 33-43 | 10 patrones "qué dice admin → qué tool usar" |
| 5 | **TABLAS** | 45-48 | Schema de base de datos |
| 6 | **REGLAS** | 50-56 | 6 reglas operativas |

### Estilo:
- **Voz**: "Sos el asistente ejecutivo de Mrs Muzzarella"
- **Tono**: Directo pero más laxo que ClinicForge
- **Longitud**: Corto (56 líneas) — muchos casos no cubiertos
- **Falta**: Estrategia de ambigüedad, resolución de fallos, proactividad, mapeo semántico, flujos completos

---

## 3. Diferencias Clave

| Aspecto | ClinicForge (210 líneas) | MuzApp (56 líneas) |
|---------|-------------------------|---------------------|
| **Identidad** | "Sistema nervioso central" — metáfora poderosa | "Asistente ejecutivo" — genérico |
| **Jerarquía de decisiones** | REGLA DE ORO + PRINCIPIO JARVIS (9 reglas con prioridad explícita) | 4 reglas sueltas sin prioridad |
| **Manejo de ambigüedad** | RESOLUCIÓN INTELIGENTE: inferir, fallback, variaciones, feedback loop | No cubierto |
| **Proactividad** | Condiciones explícitas de cuándo ser proactivo | No cubierto |
| **Flujos multi-paso** | ENCADENAMIENTO: 3-5 tools sin confirmación, ejemplos concretos | No cubierto |
| **Mapeo semántico** | MAPEO DENTAL: 40+ términos coloquiales → técnicos | No existe |
| **Manejo de errores** | Tool falla → intentá otros params o alternativa | No cubierto |
| **Reglas temporales** | Con fecha de expiración explícita | No existe |
| **Contexto dinámico** | Recibe page, role, tenant, timestamp | Estático |
| **Tools organizadas** | Agrupadas por dominio (PACIENTES, TURNOS, etc.) | Lista plana en "atajo mental" |
| **Ejemplos de diálogo** | Inline en cada flujo | Sección separada al inicio |
| **Formato de respuesta** | Especificación exacta (HTML, emojis, límite chars) | "1-3 líneas" vago |
| **Lenguaje de paciente** | Mapeo masivo de lo que DICE un paciente a lo que SIGNIFICA | No existe |

---

## 4. Qué Tomar de ClinicForge para MuzApp

### 4.1 REGLA DE ORO + PRINCIPIO JARVIS (prioridad de decisiones)

El framework más valioso de ClinicForge. MuzApp necesita una jerarquía clara:

```
REGLA DE ORO (POR ENCIMA DE TODO):
Cuando el admin te da una orden EXPLÍCITA, ejecutá SOLAMENTE lo que te pidió.
NO sugieras, NO te adelantes, NO ofrezcas pasos siguientes.

PRINCIPIO JARVIS:
1. TE PIDEN → EJECUTÁS. Sin "voy a buscar" ni "déjame verificar".
2. VES OPORTUNIDAD → SUGERÍ (solo si no hay orden en curso).
3. FALTA DATO → INFERILO. Solo si imposible → preguntá UNA vez.
4. POST-EJECUCIÓN → ofrecé siguiente paso (solo si no hay nueva orden).
5. NUNCA digas "no puedo". TENÉS TODO. BUSCALO.
```

### 4.2 RESOLUCIÓN INTELIGENTE (manejo de ambigüedad y errores)

MuzApp no tiene nada de esto. Es crítico para un negocio real:

> "Tool falla → intentá otros params o tool alternativa"
> "Búsqueda vacía → variaciones: sin acentos, solo apellido, abreviaciones"
> "Ambigüedad → elegí la más probable, ejecutá. Si mal → usuario corrige"

En MuzApp:
- searchClient falla → probá solo nombre, solo teléfono, parte del nombre
- createOrder falla → ¿el cliente existe con otro formato?
- "lo mismo" / "otro igual" / "dale" → inferí del contexto

### 4.3 ENCADENAMIENTO (multi-tool chains)

> "3-5 tools sin confirmación, 6+ aceptable."

MuzApp debería tener flujos como:
- "creá pedido para X, 2 Genesis" → searchClient (o createLead si no existe) → createOrder
- "cerrá el día" → getAnalytics → getPendingOrders → markDayClosed / sendReport
- "perfil completo de X" → searchClient → getCustomerFullProfile

### 4.4 Mapeo semántico de lenguaje coloquial

El bloque de MAPEO DENTAL de ClinicForge es el ejemplo perfecto. Para MuzApp:

```
MAPEO DE PRODUCTOS (resolver SIEMPRE, nunca "no existe"):
Génesis/Géne/Gene/Gén/Genesis burguer/Génesis burger → Genesis
Clásica/Clásica burger/Simple/Común/Normal → Clásica
Doble/Doble carne/Doble queso/Doble cheeseburger → Doble
Cheddar/Cheddar bacon/Bacon/Bacon cheddar → Cheddar Bacon
Papas/Papas fritas/Fritas/Papas con cheddar → Papas
Nuggets/Nugget/Pollito/Pollo/Piezas de pollo → Nuggets
```

### 4.5 REGLAS TEMPORALES con fecha de expiración

> "⚠️ REGLA TEMPORAL (VIGENTE HASTA 2026-05-15): ..."

MuzApp necesita: cambios de horario, feriados, promociones por tiempo limitado, etc.

### 4.6 Organización de tools por dominio

ClinicForge agrupa: PACIENTES, TURNOS, TRATAMIENTOS, FACTURACIÓN, etc.
MuzApp actualmente tiene una lista plana en "ATAJO MENTAL". Mejor agrupar:

```
PEDIDOS: createOrder, createDeliveredOrder, getPendingOrders, updateOrderStatus, getOrderDetail
CLIENTES: getClients, searchClient, createLead, updateClient, getCustomerFullProfile
VENTAS: getAnalytics, getSalesByDateRange, getSalesByDay
COMUNICACIÓN: sendWhatsAppMessage, injectCustomerNote
COCINA: updateAgentConfig(isCooking)
```

### 4.7 PROACTIVIDAD con condiciones explícitas

ClinicForge dice exactamente CUÁNDO ser proactivo:
- "3+ no-shows → alertar"
- "Facturación baja → mencionar"
- "Turno completado sin cobrar → alertar"

Para MuzApp:
- "Pedido hace 30 min sin marcar listo → ¿lo marcamos como completado?"
- "Cliente nuevo sin WhatsApp de bienvenida → ¿le mandamos?"
- "Fin de semana sin actualizar analytics → ¿cerramos el día?"

---

## 5. Recomendaciones Específicas para el Nuevo MuzApp Prompt

### 5.1 Abrir con identidad fuerte y REGLA DE ORO (like ClinicForge lines 22-32)

```
Sos el sistema operativo de Mrs Muzzarella, rotisería de Formosa.
Solo el admin te habla por Telegram. Tenés control TOTAL de la base de datos.

REGLA DE ORO (POR ENCIMA DE TODO):
Cuando el admin te da una orden EXPLÍCITA, ejecutá SOLAMENTE lo que te pidió.
NO sugieras, NO te adelantes, NO ofrezcas pasos siguientes, NO ejecutes tareas adicionales.
La proactividad aplica ÚNICAMENTE cuando:
- El admin no sabe qué hacer ("no sé", "qué necesito", "ayudame")
- El admin pide explícitamente sugerencias
- No hay una orden clara
```

### 5.2 Agregar PRINCIPIO JARVIS (5 reglas)

```
PRINCIPIO JARVIS:
1. TE PIDEN → EJECUTÁS inmediatamente la orden exacta. Sin "voy a buscar" ni "déjame verificar".
2. VES OPORTUNIDAD Y NO HAY ORDEN → SUGERÍ.
3. FALTA DATO → INFERILO del contexto. Solo si imposible → preguntá UNA vez.
4. Solo POST-EJECUCIÓN → ofrecé el siguiente paso.
5. NUNCA "no puedo"/"no tengo acceso". TENÉS TODO. BUSCALO.
```

### 5.3 Agregar RESOLUCIÓN INTELIGENTE

```
RESOLUCIÓN INTELIGENTE:
- Parámetro no coincide → buscá el más cercano y usalo
- Tool falla → intentá otros params o tool alternativa
- Ambigüedad → elegí la más probable, ejecutá. Si mal → admin corrige
- "hacé eso"/"lo mismo"/"dale" → inferí del contexto
- Búsqueda vacía → variaciones: solo nombre, solo apellido, parte del teléfono
- Producto no coincide exactamente → usá el MAPEO DE PRODUCTOS
```

### 5.4 Agregar MAPEO DE PRODUCTOS (copy-paste del patrón de MAPEO DENTAL)

```
MAPEO DE PRODUCTOS (OBLIGATORIO — resolver SIEMPRE, nunca "no existe"):
- Génesis/Géne/Gene/Gén/Genesis/Génesis burger → Genesis
- Clásica/Simple/Común/Normal/Hamburguesa sola → Clásica
- Doble/Doble carne/Doble queso/Doble cheddar/Doble cheeseburger → Doble
- Cheddar/Cheddar bacon/Bacon/Bacon cheddar → Cheddar Bacon
- Papas/Papas fritas/Fritas/Papa cheddar/Papas con cheddar → Papas
- Nuggets/Nugget/Pollito/Pollo/Piezas de pollo → Nuggets
- Bebida/Gaseosa/Coca/Pepsi/Lata → Bebida
- Pan/Pan x kg/Pan al por mayor → Pan (lead B2B)
- Facturas/Facturita/Masitas/Dulces → Facturas
```

### 5.5 Agregar ENCADENAMIENTO

```
ENCADENAMIENTO (multi-tool sin confirmación):
2-4 tools seguidas sin preguntar. 5+ aceptable si es el mismo objetivo.
- "creá pedido de X para Y" → searchClient → createOrder (crea lead si no existe)
- "perfil completo de X" → searchClient → getCustomerFullProfile
- "cerrá la cocina / abrí la cocina" → updateAgentConfig
- "mandale WhatsApp a X diciendo Y" → searchClient → sendWhatsAppMessage
- "ventas de [fecha/año]" → getSalesByDateRange (inferí fechas del contexto)
```

### 5.6 Agregar sección de REGLAS TEMPORALES

```
⚠️ REGLAS TEMPORALES:
- Cada una tiene fecha de expiración. Si venció, ignorá.
- [Ejemplo: "VIGENTE HASTA 15/06: Promoción 2x1 en Genesis los miércoles"]
```

### 5.7 Especificación exacta de formato (like ClinicForge lines 73-81)

```
FORMATO TELEGRAM:
- Respondé en 1-3 líneas. Directo, sin cortesía.
- Usá emojis: 🍔 pedidos, 👤 clientes, 💰 ventas, 📊 analytics, ⚙️ config
- NO repitas info que ya diste. NO termines con "necesitás algo más".
- Cuando ejecutes múltiples pasos, resumí en una línea.
```

### 5.8 Resumen del nuevo prompt estimado

| Sección | Líneas estimadas | Inspiración ClinicForge |
|---------|-----------------|------------------------|
| Identidad + REGLA DE ORO | 10 | Líneas 22-32 |
| PRINCIPIO JARVIS | 8 | Líneas 34-39 |
| RESOLUCIÓN INTELIGENTE | 10 | Líneas 41-47 |
| FORMATO TELEGRAM | 8 | Líneas 73-81 |
| MAPEO DE PRODUCTOS | 15 | Líneas 170-190 |
| TABLAS (schema) | 8 | Actual MuzApp |
| ATAJO MENTAL + ENCADENAMIENTO | 30 | Líneas 202-207 + actual |
| FLUJOS DETALLADOS | 30 | Líneas 117-200 |
| REGLAS TEMPORALES | 5 | Líneas 121-125 |
| PROACTIVIDAD | 8 | Línea 209 |
| **Total** | **~132 líneas** | |

De 56 → ~132 líneas. Sigue siendo la mitad que ClinicForge, pero cubre TODOS los casos de borde que hoy no existen.

---

## Conclusión

La diferencia fundamental no es solo de longitud, sino de **madurez operativa**. ClinicForge anticipa y resuelve cada caso de borde antes de que ocurra: "¿qué pasa si la tool falla?", "¿qué pasa si el usuario dice 'hacé eso'?", "¿qué pasa si no encuentra el paciente?". MuzApp hoy asume que todo va a funcionar perfecto siempre — y en un negocio real, no es así.

El patrón más valioso para移植 es el **MAPEO SEMÁNTICO** (lo que el usuario dice → lo que el sistema entiende) y el **PRINCIPIO JARVIS** (cuándo ejecutar, cuándo inferir, cuándo preguntar). Sin eso, el bot siempre va a fallar en los bordes.

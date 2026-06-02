# SDD Specs: Delivery Configurable UI

## Stack Context

Next.js 16 (app router), PostgreSQL + Drizzle ORM, Tailwind CSS. Admin ya tiene secciones configurables (Telegram, Promos, etc.).

---

## R1: DB — Columnas `deliveryEnabled` y `deliveryStartHour` en `agentConfig`

### ADDED

**R1.1** — La tabla `agentConfig` (o `config`) DEBE incluir dos nuevas columnas:

```typescript
deliveryEnabled: boolean("delivery_enabled").notNull().default(false),
deliveryStartHour: varchar("delivery_start_hour", { length: 5 }).default("09:00"),
```

**R1.2** — Se DEBE agregar una migración Drizzle (`drizzle-kit generate`) que añada estas columnas. La migración NO debe dropear tablas existentes.

### Escenarios

**Given** la tabla `agentConfig` existe con datos previos
**When** se corre la migración
**Then** todos los registros existentes obtienen `deliveryEnabled = false` y `deliveryStartHour = "09:00"`

**Given** un nuevo registro en `agentConfig`
**When** se crea sin especificar delivery
**Then** se setean por defecto `false` y `"09:00"`

---

## R2: UI — Sección 10b con Switch + Input Horario

### ADDED

**R2.1** — En la página de configuración del admin (sección de agent/WhatsApp), DEBE existir una sección "10b — Delivery Config" con:

- Switch ON/OFF rotulado "Delivery habilitado"
- Input de tipo `time` rotulado "Hora de inicio de delivery"
- Botón "Guardar configuración de delivery"

**R2.2** — El Switch DEBE persistir `deliveryEnabled` en DB vía Server Action.

**R2.3** — El input horario DEBE persistir `deliveryStartHour` en DB vía Server Action.

**R2.4** — Ambos controles DEBEN cargar su estado actual desde la DB al montar el componente.

**R2.5** — Los controles DEBEN estar deshabilitados (disabled) mientras se guarda, y mostrar feedback visual (spinner o check) al persistir.

### Escenarios

**Given** el admin está en la página de config
**When** cambia el Switch a ON y completa la hora
**Then** al hacer clic en "Guardar", se persisten ambos valores en DB y se muestra confirmación

**Given** el Switch está OFF
**When** se renderiza la sección
**Then** el input horario DEBE aparecer pero atenuado (opacity-50) y disabled, indicando que no aplica

---

## R3: Prompt — `getOperationalData()` inyecta estado de delivery según horario actual

### MODIFIED

**R3.1** — La función `getOperationalData()` (o equivalente en el system prompt builder) DEBE inyectar en el prompt del agente el estado actual del delivery:

```
DELIVERY STATUS:
- Delivery habilitado: [SÍ/NO según config]
- Horario de inicio: [HH:mm]
- Delivery disponible ahora: [SÍ si hora actual >= deliveryStartHour Y deliveryEnabled=true, NO en caso contrario]
```

**R3.2** — El agente DEBE usar esta información para informar al cliente si delivery está disponible. Si NO está disponible, DEBE ofrecer retiro en local (takeaway).

### Escenarios

**Given** `deliveryEnabled = true` y hora actual 14:30 con `deliveryStartHour = "18:00"`
**When** el cliente pregunta "hacen delivery?"
**Then** el agente responde "Delivery arranca a las 18hs. Si querés, podés pasar a retirar antes."

**Given** `deliveryEnabled = false`
**When** el cliente pregunta "entregan?"
**Then** el agente responde "No tenemos delivery en este momento. Podés pasar a retirar por el local."

---

## R4: Tools — `checkDeliveryTool` lee zonas desde DB

### MODIFIED

**R4.1** — El tool `checkDeliveryTool` (o su equivalente) DEBE leer las zonas de delivery desde la tabla `delivery_zones` en DB, NO desde datos hardcodeados.

**R4.2** — Si la tabla `delivery_zones` NO existe o está vacía, el tool DEBE retornar "No hay zonas configuradas" sin crash.

### REMOVED

**R4.3** — Se DEBE eliminar cualquier zona de delivery hardcodeada en archivos de tools, prompts, o constantes.

### Escenarios

**Given** `delivery_zones` contiene: [{name: "Centro", neighborhoods: ["Microcentro", "San Martín"]}]
**When** el tool verifica "Microcentro"
**Then** retorna "Microcentro está dentro de zona Centro. Delivery disponible"

**Given** `delivery_zones` está vacía
**When** el tool verifica cualquier dirección
**Then** retorna "No hay zonas configuradas. Contactá al local para coordinar"

---

## Archivos

| File | Action |
|------|--------|
| `src/db/schema.ts` | MODIFY — agregar columnas |
| `src/db/migrations/*` | ADD — migración Drizzle |
| `src/app/(admin)/admin/config/delivery/page.tsx` | ADD — server component |
| `src/app/(admin)/admin/config/delivery/delivery-config.tsx` | ADD — client component |
| `src/app/(admin)/admin/config/delivery/actions.ts` | ADD — server actions |
| `src/lib/agent/prompt-builder.ts` | MODIFY — getOperationalData |
| `src/lib/agent/tools/check-delivery.ts` | ADD — tool con query a DB |
| `src/lib/agent/system-prompt.ts` | MODIFY — remover hardcode delivery |

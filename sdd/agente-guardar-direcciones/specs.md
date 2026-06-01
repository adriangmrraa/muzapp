# SDD Specs: Guardar Direcciones Automáticamente

## 1. Nueva Tool: `saveAddressTool`

### 1.1 Definición

Crear en `src/lib/whatsapp/tools/kitchen-tools.ts`:

```typescript
export const saveAddressTool = {
  name: "saveAddress",
  description: "Guarda una dirección de cliente en la tabla addresses para reusarla en futuros pedidos. Ejecutar SIEMPRE que el cliente dé una dirección.",
  parameters: {
    phone: { type: "string", description: "Teléfono del cliente (con código de país, ej: 5493704123456)" },
    address: { type: "string", description: "Dirección textual exacta que escribió el cliente" },
    mapsLink: { type: "string", optional: true, description: "Link de Google Maps si el cliente lo compartió" }
  },
  execute: async ({ phone, address, mapsLink }: {
    phone: string;
    address: string;
    mapsLink?: string;
  }) => {
    // INSERT INTO addresses (phone, address, mapsLink)
    //   VALUES ($phone, $address, $mapsLink)
    //   ON CONFLICT (phone, address) DO NOTHING
    // Return { success: true, message: "Dirección guardada" }
  }
};
```

### 1.2 Schema Reference

La tabla `addresses` ya existe en `src/db/schema.ts` con al menos: `phone`, `address`, `mapsLink`. No se modifica.

### 1.3 Export

En `src/lib/whatsapp/tools/index.ts`:

```typescript
export { saveAddressTool } from "./kitchen-tools";
```

Agregar `saveAddressTool` al array de tools exportado.

### 1.4 Registro en Agent

En `src/lib/whatsapp/agent.ts`, agregar `saveAddressTool` al array de tools que se pasa a `agent.run()`.

## 2. Modificaciones al System Prompt

### 2.1 Nueva sección `[DIRECCIÓN GUARDADA]`

Agregar en `DEFAULT_SYSTEM_PROMPT`:

```
[DIRECCIÓN GUARDADA]
- SIEMPRE que el cliente escriba una dirección, ejecutá saveAddressTool con:
  * phone: el número del cliente (ya lo tenés en customerContext)
  * address: la dirección exacta que escribió
  * mapsLink: si compartió link de Maps, pasalo; si no, omití
- Si la dirección es la del propio local (ej: "Neuquen 1245" es la dirección de Mrs Muzzarella), NO la guardes
- Si la dirección ya está guardada, saveAddressTool no la duplica (ON CONFLICT DO NOTHING)
```

### 2.2 Modificar sección `[UBICACION]`

Agregar al final de la sección existente:

```
- Después de recibir una dirección, ejecutá saveAddressTool ANTES de continuar con el flujo
```

## 3. Escenarios de prueba

### Escenario 1: Cliente da dirección de entrega
**Input**: "Neuquen 1245"
**Esperado**: `saveAddressTool({phone: "5493704123456", address: "Neuquen 1245", mapsLink: undefined})` ejecutado. Agente responde: "Anotada" y continúa flujo ✅

### Escenario 2: Cliente da dirección con link de Maps
**Input**: "Mi dirección es Av. Siempre Viva 742 https://maps.app.goo.gl/abc123"
**Esperado**: `saveAddressTool({phone: "5493704123456", address: "Av. Siempre Viva 742", mapsLink: "https://maps.app.goo.gl/abc123"})` ejecutado ✅

### Escenario 3: Dueño menciona la dirección del local
**Input** (del dueño del local hablando con el agente interno): "pasá por Neuquen 1245"
**Esperado**: NO se ejecuta `saveAddressTool`. La instrucción explícita en `[DIRECCIÓN GUARDADA]` lo previene ✅

### Escenario 4: Misma dirección dos veces
**Setup**: Cliente ya tiene "Neuquen 1245" guardada
**Input**: "Neuquen 1245"
**Esperado**: `saveAddressTool` ejecutado pero `ON CONFLICT DO NOTHING` — no hay duplicado. Agente continúa normal ✅

### Escenario 5: Cliente da dirección sin contexto de pedido
**Input**: "av siempre viva 742" (en medio de preguntar precios)
**Esperado**: No se ejecuta `saveAddressTool` porque no hay contexto de entrega/ubicación — el agente no está en flujo de dirección ✅

# SDD Specs: Horario de Producción — UI + Prompt Injection

## ADDED — Campo `productionHours` en `agent_config`

1.1 MUST — Schema: agregar columna `productionHours` de tipo `text` (nullable) en `agent_config`. Posición: después de `whatsappPromociones` (línea 111), antes de `whatsappZonasDelivery` (línea 112).

```diff
  whatsappPromociones: text("whatsapp_promociones"),
+ productionHours: text("production_hours"),
  whatsappZonasDelivery: jsonb("whatsapp_zonas_delivery").$type<{
```

1.2 MUST — Migración Drizzle: generar archivo `drizzle/0003_production_hours.sql` con `ALTER TABLE agent_config ADD COLUMN production_hours text;`.

1.3 MUST — El campo es opcional (puede ser `null`).

## ADDED — TextArea en Sección 9 (Estado del Local)

2.1 MUST — En `agent-config-form.tsx`, dentro del `<CardContent>` de la card "Estado del Local" (Sección 9, línea 858), agregar un bloque `<Textarea>` con label "Horario de producción" entre el switch de `hamburguesasSinStock` (línea 899) y el input de `stockPanDocenas` (línea 901).

```tsx
{/* Horario de producción */}
<div className="flex flex-col gap-1.5">
  <Label htmlFor="productionHours">Horario de producción</Label>
  <Textarea
    id="productionHours"
    name="productionHours"
    rows={3}
    placeholder="Ej: Lunes a viernes de 8 a 18hs, sábados de 9 a 14hs. Feriados no se produce."
    defaultValue={config.productionHours ?? ""}
    className="resize-none"
  />
  <p className="text-xs text-muted-foreground">
    El agente inyecta este texto como "HORARIO DE PRODUCCIÓN:" en el prompt del sistema.
    Usalo para avisar cortes de producción, horarios de panificación, etc.
  </p>
</div>
```

2.2 MUST — Agregar `productionHours` al tipo `AgentConfigFormData`.

2.3 MUST — Agregar estado local `productionHours` inicializado desde `config.productionHours`.

2.4 MUST — El `<CardDescription>` existente se actualiza de "Control de cocina, stock de pan y alias de pago" a "Control de cocina, horario de producción, stock de pan y alias de pago":

```
Control de cocina, horario de producción, stock de pan y alias de pago — influye en las respuestas del agente
```

## ADDED — `getProductionHours()` en `prompt-builder.ts`

3.1 MUST — Crear función asíncrona `getProductionHours()` en `src/lib/whatsapp/prompt-builder.ts` que:

```
export async function getProductionHours(): Promise<string> {
  try {
    const config = await db.query.agentConfig.findFirst({
      where: (c) => eq(c.id, 1),
    });
    if (config?.productionHours && config.productionHours.trim().length > 0) {
      return `HORARIO DE PRODUCCIÓN:\n${config.productionHours.trim()}`;
    }
  } catch {
    // silent
  }
  return "";
}
```

3.2 MUST — Si `productionHours` está vacío o es null, retorna string vacío (no se inyecta nada).

3.3 SHOULD — Para el prompt de Telegram (`src/lib/telegram/prompt-builder.ts`), replicar la misma función si existe un patrón similar de `getOperationalData()` o `buildSystemPrompt()`.

## MODIFIED — `buildSystemPrompt()` orden de inyección

4.1 MUST — En `buildSystemPrompt()` en `src/lib/whatsapp/prompt-builder.ts`, ejecutar `getProductionHours()` entre la capa de horarios (`getBusinessHours()`) y la capa operacional (`getOperationalData()`):

```diff
   const layer2 = await getMenuData();
   const layer3 = await getBusinessHours();
-  const layer4 = await getOperationalData();
+  const layer3b = await getProductionHours();
+  const layer4 = await getOperationalData();
```

4.2 MUST — Concatenar `layer3b` en el output final antes de `layer4`:

```diff
  ${layer3}
+ ${layer3b ? `\n${layer3b}` : ""}
  ${layer4 ? `\n${layer4}` : ""}
```

Esto produce el siguiente orden en el prompt final:

1. Core prompt + extras
2. Menú (productos)
3. **Horarios de atención** (business hours)
4. **Horario de producción** (production hours) ← NUEVO
5. Estado operacional (cocina, stock, alias, delivery)
6. Contexto del cliente
7. Marcador de fin

## MODIFIED — Texto descriptivo de Sección 9

5.1 MUST — El `CardDescription` de la card "Estado del Local" cambia de:

```
Control de cocina, stock de pan y alias de pago — influye en las respuestas del agente
```

a:

```
Control de cocina, horario de producción, stock de pan y alias de pago — influye en las respuestas del agente
```

## Escenarios de prueba

### Escenario 1: Campo vacío — sin inyección
**Setup**: `productionHours = null`
**Input**: Se ejecuta `buildSystemPrompt()`
**Esperado**: El prompt no contiene la sección `HORARIO DE PRODUCCIÓN`. El comportamiento del agente no cambia. ✅

### Escenario 2: Campo con texto — inyección correcta
**Setup**: `productionHours = "Lunes a viernes de 8 a 18hs"`
**Input**: Se ejecuta `buildSystemPrompt()`
**Esperado**: El prompt contiene `HORARIO DE PRODUCCIÓN:\nLunes a viernes de 8 a 18hs` después de los horarios de atención y antes del estado operacional. ✅

### Escenario 3: UI — guardar y recuperar
**Setup**: Admin escribe "Feriados no se produce" en el TextArea y guarda
**Input**: Se recarga la página de configuración
**Esperado**: El TextArea muestra "Feriados no se produce" ✅

### Escenario 4: UI — campo opcional
**Setup**: Admin deja el TextArea vacío y guarda
**Input**: Se recarga la página
**Esperado**: El TextArea aparece vacío. El prompt no contiene `HORARIO DE PRODUCCIÓN`. ✅

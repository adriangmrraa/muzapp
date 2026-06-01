# SDD Propose: Guardar Direcciones Automáticamente

## Intent

Cuando un cliente manda una dirección ("Av. Siempre Viva 742", "Neuquen 1245"), el agente la usa para el pedido actual pero NO la guarda en la tabla `addresses`. El cliente termina teniendo que escribirla de nuevo en cada pedido. Queremos que cada dirección que el cliente escriba se guarde automáticamente vinculada a su teléfono, para reusarla en futuros pedidos.

## Scope

### In Scope

1. Crear nueva tool `saveAddressTool`
2. Exportarla desde `src/lib/whatsapp/tools/index.ts`
3. Registrarla en `agent.ts`
4. Modificar prompt para instruir al agente a ejecutar `saveAddressTool` siempre que reciba una dirección

### Out of Scope

- No tocar schema de DB (tabla `addresses` ya existe)
- No migraciones
- No modificar lógica de entrega existente

## Approach

### Nueva Tool: `saveAddressTool`

```typescript
saveAddressTool({
  phone: string,      // teléfono del cliente
  address: string,    // dirección textual que dió el cliente
  mapsLink?: string   // link opcional a Google Maps
}): { success: boolean, message: string }
```

La tool hace un `INSERT INTO addresses (phone, address, mapsLink) VALUES (...)`. Si ya existe esa misma dirección para ese teléfono, hace un `ON CONFLICT DO NOTHING` (no duplicar).

### Prompt Changes

En la sección `[UBICACION]` y una nueva `[DIRECCIÓN GUARDADA]`, agregar instrucción explícita: "SIEMPRE que el cliente escriba una dirección, ejecutá `saveAddressTool` con esa dirección".

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/whatsapp/tools/kitchen-tools.ts` | New | Crear `saveAddressTool` |
| `src/lib/whatsapp/tools/index.ts` | Modify | Exportar `saveAddressTool` |
| `src/lib/whatsapp/agent.ts` | Modify | Registrar `saveAddressTool` en agent.run |
| `src/lib/whatsapp/prompt-builder.ts` | Modify | Agregar `[DIRECCIÓN GUARDADA]` y modificar `[UBICACION]` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Guardar direcciones del dueño ("pasá por Neuquen 1245" refiriéndose al local) | Medium | En prompt, instruir: "Si la dirección es la del local, NO la guardes. Solo guardá direcciones del cliente." |
| Duplicados de dirección mal escrita ("NEquen 123" vs "Neuquen 123") | Medium | ON CONFLICT DO NOTHING evita duplicados exactos. La normalización de texto es out of scope |
| Guardar direcciones en medio de una conversación no comercial | Low | El agente solo recibe direcciones en contexto de entrega/retiro, que ya es comercial |

## Success Criteria

- [ ] Cliente escribe "Neuquen 1245" → `saveAddressTool("549370...", "Neuquen 1245")` → "Anotada"
- [ ] Cliente escribe "Mi dirección es Av. Siempre Viva 742" → `saveAddressTool` ejecutado
- [ ] Dueño dice "pasá por Neuquen 1245" refiriéndose al local → NO guardar dirección
- [ ] Dirección repetida → ON CONFLICT no inserta duplicado

# SDD Propose: Follow-up Automático Post-Entrega

## Intent

Después de entregar un pedido, nadie hace seguimiento. Se pierde la oportunidad de fidelizar, recibir feedback, y pedir que etiqueten en redes. Queremos que 30 minutos después de marcar un pedido como `delivered`, el cliente reciba automáticamente un mensaje de follow-up cordial.

## Scope

### In Scope

1. Modificar `markPaidAndDelivered` y `updateOrderStatus` en `orders/actions.ts` para programar follow-up cuando status = "delivered" y `followupSent = false`
2. Usar el sistema de buffer existente (Redis/Upstash) para el delay de 30 minutos
3. Crear handler que procese el follow-up (enviar mensaje por WhatsApp y marcar `followupSent = true`)
4. Validación de horario hábil (9-22hs)

### Out of Scope

- No crear sistema de CRM
- No guardar historial de follow-ups (solo el flag `followupSent`)
- No configurar campañas ni mensajes customizables por cliente

## Approach

### Flujo

1. Admin marca pedido como `delivered` (desde `markPaidAndDelivered` o `updateOrderStatus`)
2. Si `order.followupSent === false` y nuevo status === "delivered":
   - Se calcula la hora de envío: ahora + 30 min
   - Si la hora calculada está fuera de horario hábil (9-22): se agenda para las 9 AM del día siguiente
   - Se escribe un trabajo en el buffer con `{ orderId, phone, scheduledFor }`
3. El buffer procesa el trabajo después del delay
4. El handler ejecuta el envío:
   - Enviar mensaje vía WhatsApp API: "Holaa, ¿todo bien con el pedido? No te olvides de etiquetarnos en ig porfa 🙌"
   - Actualizar `orders.followupSent = true`
   - Si falla el envío, reintentar 1 vez a los 5 min

### Mecanismo de Buffer

Usar el sistema existente en `src/lib/buffer/` (Redis/Upstash queue). Si ya soporta trabajos diferidos, se usa directo. Si no, crear un endpoint `/api/followup/process` que un cron de Vercel (o el propio buffer) llame periódicamente.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/(admin)/admin/orders/actions.ts` | Modify | En `markPaidAndDelivered` y `updateOrderStatus`, agregar schedule de follow-up cuando status = "delivered" |
| `src/lib/buffer/` | Use | Usar sistema de buffer existente para trabajos diferidos |
| `src/app/api/followup/` | New | Handler que procesa envío de follow-up |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Follow-up enviado a las 3 AM | Medium | Validar horario hábil (9-22hs). Si cae fuera, agendar para las 9 AM |
| Follow-up enviado dos veces por duplicado de trabajo en buffer | Low | Check `followupSent` antes de enviar; si ya es true, skip |
| Cliente recibe follow-up después de quejarse | Low | El follow-up es genérico y positivo; no hay riesgo de escalar quejas |

## Success Criteria

- [ ] Pedido marcado como `delivered` → follow-up programado para 30 min después
- [ ] Follow-up enviado → `followupSent = true`, no re-enviar
- [ ] Pedido marcado como `delivered` a las 3 AM → follow-up agendado para las 9 AM
- [ ] Si el envío falla → reintento a los 5 min

# SDD Specs: Follow-up Automático Post-Entrega

## 1. Modificaciones a `orders/actions.ts`

### 1.1 `markPaidAndDelivered`

Después de la actualización de status, agregar:

```typescript
if (status === "delivered" && !order.followupSent) {
  await scheduleFollowup({ orderId: order.id, phone: order.phone });
}
```

### 1.2 `updateOrderStatus`

Después de actualizar status a "delivered", mismo check:

```typescript
if (newStatus === "delivered" && !existingOrder.followupSent) {
  await scheduleFollowup({ orderId: existingOrder.id, phone: existingOrder.phone });
}
```

### 1.3 Función `scheduleFollowup`

```typescript
async function scheduleFollowup({ orderId, phone }: { orderId: number, phone: string }) {
  const scheduledFor = calculateNextValidTime(new Date(Date.now() + 30 * 60 * 1000));
  // Escribir trabajo en buffer con payload: { orderId, phone }
  // y scheduledFor como tiempo de ejecución
  await buffer.enqueue("followup", { orderId, phone }, { runAt: scheduledFor });
}
```

### 1.4 `calculateNextValidTime`

```typescript
function calculateNextValidTime(date: Date): Date {
  const hour = date.getHours();
  if (hour >= 9 && hour < 22) return date; // Hábil
  // Si está fuera de horario, agendar para las 9 AM del día siguiente
  const next = new Date(date);
  next.setDate(next.getDate() + 1);
  next.setHours(9, 0, 0, 0);
  return next;
}
```

## 2. Nuevo Endpoint: `/api/followup/process`

### 2.1 Handler

```typescript
// POST /api/followup/process
// Procesa trabajos de follow-up pendientes en el buffer

async function handler(req: Request) {
  const job = await buffer.dequeue("followup");
  if (!job) return Response.json({ processed: false });

  const { orderId, phone } = job.payload;

  // Check si ya se envió (evita duplicados)
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId)
  });
  if (order.followupSent) return Response.json({ processed: true, skipped: true });

  // Enviar WhatsApp
  const sent = await sendWhatsApp(phone, "Holaa, ¿todo bien con el pedido? No te olvides de etiquetarnos en ig porfa 🙌");

  if (sent) {
    await db.update(orders).set({ followupSent: true }).where(eq(orders.id, orderId));
  } else {
    // Reintentar en 5 min
    await buffer.enqueue("followup", { orderId, phone }, { runAt: new Date(Date.now() + 5 * 60 * 1000) });
  }

  return Response.json({ processed: true, sent });
}
```

## 3. Escenarios de prueba

### Escenario 1: Pedido marcado como delivered en horario hábil
**Setup**: Pedido activo, `followupSent = false`. Admin marca como delivered a las 14:00.
**Esperado**: `scheduleFollowup` calcula 14:30 (hábil). Buffer encola trabajo. A las 14:30 se envía: "Holaa, ¿todo bien..." ✅

### Escenario 2: Follow-up ya enviado, no re-enviar
**Setup**: Pedido con `followupSent = true`. Admin marca como delivered.
**Esperado**: Check `followupSent` es true → NO se agenda follow-up ✅

### Escenario 3: Pedido marcado como delivered a las 3 AM
**Setup**: Admin marca delivered a las 03:00.
**Esperado**: `calculateNextValidTime` devuelve 09:00 del mismo día. Buffer agenda para las 09:00. Follow-up se envía a las 09:00 ✅

### Escenario 4: Falla el envío de WhatsApp
**Setup**: API de WhatsApp devuelve error.
**Esperado**: Se reintenta en 5 min. Si el reintento falla, se abandona (loggear error, no reintentar más) ✅

### Escenario 5: Pedido marcado via `updateOrderStatus`
**Setup**: Admin usa updateOrderStatus para cambiar a "delivered".
**Esperado**: Mismo comportamiento que `markPaidAndDelivered` — follow-up agendado ✅

import { tool } from "ai";
import { z } from "zod";
import { db } from "@/db";
import { orders, leads, products } from "@/db/schema";
import { eq, or, ilike, asc, sql } from "drizzle-orm";

// ─── Helper: Validar teléfono ──────────────────────────────────────────
// Los teléfonos Argentinos válidos empiezan con 549 y tienen 10-12 dígitos
function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/[+\s\-]/g, "");
  return /^549\d{7,11}$/.test(cleaned);
}

function cleanPhone(phone: string): string {
  return phone.replace(/[+\s\-]/g, "");
}

// ─── Helper: Resolver nombre de producto contra DB ──────────────────────
// El empleado dice "genesis", "2 de pollo", "hamburguesa clasica"
// Esto busca el producto REAL en la DB y devuelve su nombre + precio oficial

type ResolvedItem = { name: string; quantity: number; price: number };

async function resolveItems(items: { name: string; quantity: number; price?: number }[]): Promise<ResolvedItem[]> {
  try {
    const dbProducts = await db
      .select({ name: products.name, price: products.price })
      .from(products)
      .where(eq(products.available, true));

    return items.map(item => {
      const input = item.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      // Buscar el producto más parecido en la DB
      const match = dbProducts.find(p => {
        const pName = p.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return pName === input || pName.includes(input) || input.includes(pName);
      });
      if (match) {
        // Usar el nombre REAL del producto y su precio (o el que pasaron)
        return {
          name: match.name,
          quantity: item.quantity,
          price: item.price ?? (match.price ? Number(match.price) : 0),
        };
      }
      // Si no hay match, dejar lo que el usuario puso
      return {
        name: item.name,
        quantity: item.quantity,
        price: item.price ?? 0,
      };
    });
  } catch {
    // Si falla la consulta, devolver items originales
    return items.map(item => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price ?? 0,
    }));
  }
}

// createOrder - Crear nuevo pedido
export const createOrder = tool({
  description:
    "Crea un nuevo pedido. Acepta teléfono o nombre del cliente (si ponés nombre busca automáticamente). Preguntas: 'nuevo pedido', 'arma mi pedido', 'agregale un pedido a flor'",
  inputSchema: z.object({
    phone: z.string().optional().describe("Teléfono del cliente (alternativa al nombre)"),
    customerName: z.string().optional().describe("Nombre del cliente (si no sabés el teléfono, poné el nombre y lo busco)"),
    orderType: z
      .enum(["hamburguesas", "pan_mayorista"])
      .describe("Tipo de pedido"),
    items: z
      .array(
        z.object({
          name: z.string(),
          quantity: z.number(),
      price: z.number().optional(),
    }))
    .describe("Items del pedido"),
    deliveryFee: z.number().min(0).optional().describe("Costo de delivery (0 si no aplica)"),
    paymentStatus: z.enum(["pending", "paid"]).optional().describe("Estado de pago: pending (pendiente), paid (pagado). Default: pending"),
    paymentMethod: z.string().optional().describe("Método de pago: efectivo, alias, etc."),
    notes: z.string().optional().describe("Notas especiales"),
  }),
  execute: async ({ phone, customerName, orderType, items, deliveryFee, paymentStatus, paymentMethod, notes }) => {
    // Normalizar items contra productos reales de la DB
    const resolvedItems = await resolveItems(items);

    // REGLA: SIEMPRE se necesita un teléfono válido. Buscar lead o pedirlo.
    // Si no hay phone pero hay nombre, buscar el lead
    if (!phone && customerName) {
      const leadsEncontrados = await db
        .select({ phone: leads.phone, name: leads.name })
        .from(leads)
        .where(
          or(
            ilike(leads.name, `%${customerName}%`),
            ilike(leads.phone, `%${customerName}%`)
          )
        )
        .limit(5);

      if (leadsEncontrados.length === 1) {
        phone = leadsEncontrados[0].phone;
        customerName = leadsEncontrados[0].name ?? customerName;
      } else if (leadsEncontrados.length > 1) {
        const opciones = leadsEncontrados.map(l => `• ${l.name || "?"} (${l.phone})`).join("\n");
        return { success: false, message: `Varios clientes coinciden con "${customerName}":\n${opciones}\n\n¿Cuál es el teléfono?` };
      }
    }

    // Validar formato de teléfono
    if (!phone) {
      return { success: false, message: "Necesito el número de teléfono del cliente." };
    }
    const cleanedPhone = cleanPhone(phone);
    if (!isValidPhone(cleanedPhone)) {
      return { success: false, message: `El teléfono "${phone}" no parece válido. Los teléfonos de la zona empiezan con 549370 y tienen 10-12 dígitos. Ej: 5493705241065` };
    }
    phone = cleanedPhone;

    // Vincular o crear lead SIEMPRE por teléfono
    let leadId: number | null = null;
    let leadName = customerName;
    try {
      const [existingLead] = await db
        .select({ id: leads.id, status: leads.status, name: leads.name })
        .from(leads)
        .where(eq(leads.phone, phone))
        .limit(1);
      if (existingLead) {
        leadId = existingLead.id;
        leadName = existingLead.name ?? customerName ?? phone;
        // Si era lead sin pedidos, pasar a converted
        if (existingLead.status === "new" || existingLead.status === "contacted") {
          await db.update(leads).set({ status: "converted" }).where(eq(leads.id, existingLead.id));
        }
        // Actualizar nombre si tenemos uno mejor
        if (customerName) {
          await db.update(leads).set({ name: customerName }).where(eq(leads.id, existingLead.id));
        }
      } else {
        // Crear lead nuevo automáticamente
        const [newLead] = await db.insert(leads).values({
          name: customerName || phone,
          phone,
          status: "converted",
        }).returning({ id: leads.id });
        leadId = newLead.id;
        leadName = customerName || phone;
      }
    } catch {} // non-fatal

    // Calcular total
    let subtotal = 0;
    for (const item of resolvedItems) {
      subtotal += (item.price ?? 0) * item.quantity;
    }
    const delivery = deliveryFee || 0;
    const total = subtotal + delivery;

    const [created] = await db
      .insert(orders)
      .values({
        leadId,
        phoneNumber: phone,
        customerName,
        orderType,
        items: resolvedItems,
        deliveryFee: delivery ? String(delivery) : "0",
        paymentStatus: paymentStatus || "pending",
        paymentMethod: paymentMethod || null,
        notes,
        status: "pending",
      })
      .returning({ id: orders.id });

    // Notificar
    try {
      const { notifyNewOrder } = await import("@/lib/telegram/notifier");
      notifyNewOrder({
        id: created.id,
        customerName: customerName || phone,
        orderType,
        items: resolvedItems,
        total,
        status: "pending",
        phoneNumber: phone,
        notes: notes || null,
      });
    } catch {}

    const itemSummary = resolvedItems.map(i => `${i.quantity}x ${i.name}`).join(", ");

    return {
      success: true,
      id: created.id,
      total,
      message: `✅ Pedido #${created.id} creado para ${customerName || phone}. Total: $${total} (${itemSummary})`,
    };
  },
});

// addItemToOrder - Agregar producto al pedido
export const addItemToOrder = tool({
  description:
    "Agrega un producto a un pedido existente. Preguntas: 'agrega una hamburguesa al pedido 5'",
  inputSchema: z.object({
    orderId: z.number().describe("ID del pedido"),
    item: z.object({
      name: z.string().describe("Nombre del producto"),
      quantity: z.number().describe("Cantidad"),
      price: z.number().optional().describe("Precio unitario"),
    }),
  }),
  execute: async ({ orderId, item }) => {
    // Normalizar item contra productos reales de la DB
    const resolvedItems = await resolveItems([item]);
    const resolved = resolvedItems[0];
    if (!resolved) return { success: false, message: "Item inválido" };

    // Verificar que el pedido exista y no esté terminado
    const [existing] = await db
      .select({ id: orders.id, status: orders.status, items: orders.items })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!existing) {
      return { success: false, message: "Pedido no encontrado" };
    }

    if (existing.status === "delivered" || existing.status === "cancelled") {
      return {
        success: false,
        message: "No se puede modificar un pedido entregado o cancelado",
      };
    }

    // Agregar item
    const currentItems = (existing.items as { name: string; quantity: number }[]) ?? [];
    const newItems = [...currentItems, resolved];

    await db
      .update(orders)
      .set({ items: newItems, updatedAt: new Date() })
      .where(eq(orders.id, orderId));

    return {
      success: true,
      message: `Agregado ${resolved.quantity}x ${resolved.name} al pedido #${orderId}`,
    };
  },
});

// removeItemFromOrder - Quitar producto del pedido
export const removeItemFromOrder = tool({
  description:
    "Quita un producto de un pedido. Preguntas: 'quita la hamburguesa del pedido 5'",
  inputSchema: z.object({
    orderId: z.number().describe("ID del pedido"),
    itemName: z.string().describe("Nombre del producto a quitar"),
  }),
  execute: async ({ orderId, itemName }) => {
    const [existing] = await db
      .select({ id: orders.id, status: orders.status, items: orders.items })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!existing) {
      return { success: false, message: "Pedido no encontrado" };
    }

    if (existing.status === "delivered" || existing.status === "cancelled") {
      return {
        success: false,
        message: "No se puede modificar un pedido entregado o cancelado",
      };
    }

    const currentItems = (existing.items as { name: string; quantity: number }[]) ?? [];
    const newItems = currentItems.filter((i) => i.name !== itemName);

    if (newItems.length === currentItems.length) {
      return {
        success: false,
        message: `No se encontró ${itemName} en el pedido`,
      };
    }

    await db
      .update(orders)
      .set({ items: newItems, updatedAt: new Date() })
      .where(eq(orders.id, orderId));

    return {
      success: true,
      message: `Eliminado ${itemName} del pedido #${orderId}`,
    };
  },
});

// updateOrderStatus - Actualizar estado del pedido
export const updateOrderStatus = tool({
  description:
    "Actualiza el estado de un pedido. Preguntas: 'el pedido 5 está listo', 'entregó el pedido 3'",
  inputSchema: z.object({
    orderId: z.number().describe("ID del pedido"),
    status: z
      .enum(["pending", "preparing", "ready", "delivered", "cancelled"])
      .describe("Nuevo estado"),
  }),
  execute: async ({ orderId, status }) => {
    const [existing] = await db
      .select({ id: orders.id, status: orders.status })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!existing) {
      return { success: false, message: "Pedido no encontrado" };
    }

    await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, orderId));

    const statusLabels: Record<string, string> = {
      pending: "pendiente",
      preparing: "en preparación",
      ready: "listo para retirar",
      delivered: "entregado",
      cancelled: "cancelado",
    };

    return {
      success: true,
      message: `Pedido #${orderId} marcado como ${statusLabels[status]}`,
    };
  },
});

// cancelOrder - Cancelar pedido
export const cancelOrder = tool({
  description:
    "Cancela un pedido. Preguntas: 'cancela el pedido 5', 'cancela mi pedido'",
  inputSchema: z.object({
    orderId: z.number().describe("ID del pedido a cancelar"),
    reason: z.string().optional().describe("Razón de cancelación"),
  }),
  execute: async ({ orderId, reason }) => {
    const [existing] = await db
      .select({ id: orders.id, status: orders.status })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!existing) {
      return { success: false, message: "Pedido no encontrado" };
    }

    if (existing.status === "delivered") {
      return {
        success: false,
        message: "No se puede cancelar un pedido ya entregado",
      };
    }

    await db
      .update(orders)
      .set({
        status: "cancelled",
        notes: reason ? `Cancelado: ${reason}` : "Cancelado por el cliente",
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    return {
      success: true,
      message: `Pedido #${orderId} cancelado`,
    };
  },
});

// calculateTotal - Calcular total del pedido
export const calculateTotal = tool({
  description:
    "Calcula el total de un pedido. Preguntas: 'cuánto sale el pedido 5', 'total del pedido'",
  inputSchema: z.object({
    orderId: z.number().describe("ID del pedido"),
  }),
  execute: async ({ orderId }) => {
    const [existing] = await db
      .select({ id: orders.id, items: orders.items, status: orders.status })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!existing) {
      return { error: "Pedido no encontrado" };
    }

    const items = existing.items as { name: string; quantity: number; price?: number }[];
    let total = 0;
    const breakdown: { item: string; qty: number; price: number; subtotal: number }[] = [];

    for (const item of items ?? []) {
      const price = item.price ?? 0;
      const subtotal = price * item.quantity;
      total += subtotal;
      breakdown.push({
        item: item.name,
        qty: item.quantity,
        price,
        subtotal,
      });
    }

    return {
      orderId,
      status: existing.status,
      items: breakdown,
      total,
    };
  },
});

// confirmOrder - Confirmar pedido
export const confirmOrder = tool({
  description:
    "Confirma un pedido con el cliente. Preguntas: 'confirmar pedido 5', 'confirma el pedido'",
  inputSchema: z.object({
    orderId: z.number().describe("ID del pedido a confirmar"),
  }),
  execute: async ({ orderId }) => {
    const [existing] = await db
      .select({
        id: orders.id,
        customerName: orders.customerName,
        items: orders.items,
        status: orders.status,
      })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!existing) {
      return { success: false, message: "Pedido no encontrado" };
    }

    // Calcular total
    const items = existing.items as { name: string; quantity: number; price?: number }[];
    let total = 0;
    for (const item of items ?? []) {
      total += (item.price ?? 0) * item.quantity;
    }

    // Cambiar a preparando
    await db
      .update(orders)
      .set({ status: "preparing", updatedAt: new Date() })
      .where(eq(orders.id, orderId));

    return {
      success: true,
      message: `Pedido #${orderId} confirmado. Total: $${total}. Ahora está en preparación.`,
      customer: existing.customerName,
      items: items?.map((i) => `${i.quantity}x ${i.name}`),
      total,
    };
  },
});

// markAsPaid - Marcar pedido como pagado
export const markAsPaid = tool({
  description:
    "Marca un pedido como pagado. Preguntas: 'marcá el pedido 5 como pagado', 'ya pagó el pedido 3', 'pasá a pagado el 7'",
  inputSchema: z.object({
    orderId: z.number().describe("ID del pedido"),
  }),
  execute: async ({ orderId }) => {
    const [existing] = await db
      .select({ id: orders.id, status: orders.status, paymentStatus: orders.paymentStatus })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!existing) {
      return { success: false, message: "Pedido no encontrado" };
    }

    await db
      .update(orders)
      .set({ paymentStatus: "paid", updatedAt: new Date() })
      .where(eq(orders.id, orderId));

    return {
      success: true,
      message: `✅ Pedido #${orderId} marcado como pagado`,
    };
  },
});

// markPaymentMethod - Registrar método de pago de un pedido
export const markPaymentMethod = tool({
  description:
    "Registra el método de pago de un pedido. Preguntas: 'pagó con alias', 'registrá que pagó en efectivo', 'método de pago del pedido 5'",
  inputSchema: z.object({
    orderId: z.number().describe("ID del pedido"),
    method: z.string().describe("Método de pago: efectivo, alias, transferencia, etc."),
  }),
  execute: async ({ orderId, method }) => {
    const [existing] = await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!existing) {
      return { success: false, message: "Pedido no encontrado" };
    }

    await db
      .update(orders)
      .set({ paymentMethod: method, updatedAt: new Date() })
      .where(eq(orders.id, orderId));

    return {
      success: true,
      message: `✅ Pedido #${orderId} — método de pago registrado: ${method}`,
    };
  },
});

// createDeliveredOrder - Cargar pedido ya entregado (backfill)
export const createDeliveredOrder = tool({
  description:
    "CARGA un pedido que YA FUE ENTREGADO (backfill). Para cuando el dueño se olvidó de cargar el pedido en el momento y quiere registrarlo después. Crea el lead si no existe. SIN notificaciones, SIN WhatsApp. PREGUNTAS: 'cargá un pedido de hoy que ya entregamos', 'subí un pedido viejo', 'registrá un pedido que ya se entregó'",
  inputSchema: z.object({
    customerName: z.string().describe("Nombre del cliente"),
    customerPhone: z.string().describe("Teléfono del cliente (con código de país)"),
    orderType: z.enum(["hamburguesas", "pan_mayorista"]).describe("Tipo de pedido"),
    items: z.array(z.object({
      name: z.string(),
      quantity: z.number(),
      price: z.number().optional(),
    })).describe("Items del pedido"),
    deliveryFee: z.number().min(0).optional().describe("Costo de delivery (0 si no aplica)"),
    paymentStatus: z.enum(["pending", "paid"]).optional().describe("Default: paid (ya está pagado porque fue entregado)"),
    paymentMethod: z.string().optional().describe("Método de pago"),
    notes: z.string().optional().describe("Notas del pedido"),
    deliveredAt: z.string().optional().describe("Fecha/hora de entrega. Si no se especifica, se usa la fecha actual. Formato: DD/MM o YYYY-MM-DD HH:MM"),
  }),
  execute: async ({ customerName, customerPhone, orderType, items, deliveryFee, paymentStatus, paymentMethod, notes, deliveredAt }) => {
    // Normalizar items contra productos reales de la DB
    const resolvedItems = await resolveItems(items);

    // Validar y limpiar teléfono
    const cleanedPhone = cleanPhone(customerPhone);
    if (!isValidPhone(cleanedPhone)) {
      return { success: false, message: `El teléfono "${customerPhone}" no parece válido. Los teléfonos de la zona empiezan con 549370 y tienen 10-12 dígitos.` };
    }

    // 1. Crear o actualizar lead
    let leadId: number | null = null;
    let leadName = customerName;

    const [existingLead] = await db
      .select({ id: leads.id, status: leads.status, name: leads.name })
      .from(leads)
      .where(eq(leads.phone, cleanedPhone))
      .limit(1);

    if (existingLead) {
      leadId = existingLead.id;
      leadName = existingLead.name || customerName;
      // Actualizar a converted si era lead nuevo
      if (existingLead.status === "new" || existingLead.status === "contacted") {
        await db.update(leads).set({ status: "converted", name: customerName }).where(eq(leads.id, existingLead.id));
      } else if (customerName) {
        await db.update(leads).set({ name: customerName }).where(eq(leads.id, existingLead.id));
      }
    } else {
      // Crear lead nuevo
      const [newLead] = await db.insert(leads).values({
        name: customerName,
        phone: cleanedPhone,
        status: "converted",
      }).returning({ id: leads.id });
      leadId = newLead.id;
    }

    // 2. Parsear fecha de entrega
    let deliveredTimestamp: Date;
    if (deliveredAt) {
      // Intentar parsear la fecha
      const clean = deliveredAt.trim();
      // Formatos soportados: "DD/MM" (asume hoy), "DD/MM HH:MM", "YYYY-MM-DD HH:MM"
      const now = new Date();
      if (/^\d{1,2}\/\d{1,2}$/.test(clean)) {
        // Solo día/mes → asume este año
        const [d, m] = clean.split("/").map(Number);
        deliveredTimestamp = new Date(now.getFullYear(), m - 1, d, 12, 0);
      } else if (/^\d{1,2}\/\d{1,2}\s+\d{1,2}:\d{2}$/.test(clean)) {
        const [dm, h] = clean.split(" ");
        const [d, m] = dm.split("/").map(Number);
        const [hh, mi] = h.split(":").map(Number);
        deliveredTimestamp = new Date(now.getFullYear(), m - 1, d, hh, mi);
      } else if (/^\d{4}-\d{2}-\d{2}/.test(clean)) {
        deliveredTimestamp = new Date(clean);
      } else {
        deliveredTimestamp = now;
      }
    } else {
      deliveredTimestamp = new Date();
    }

    // 3. Calcular total
    let subtotal = 0;
    for (const item of resolvedItems) {
      subtotal += (item.price ?? 0) * item.quantity;
    }
    const delivery = deliveryFee || 0;
    const total = subtotal + delivery;

    // 4. Crear pedido como delivered SIN notificaciones
    const [created] = await db.insert(orders).values({
      leadId,
      phoneNumber: cleanedPhone,
      customerName: leadName,
      orderType,
      items: resolvedItems,
      deliveryFee: delivery ? String(delivery) : "0",
      paymentStatus: paymentStatus || "paid",
      paymentMethod: paymentMethod || null,
      notes: notes || null,
      status: "delivered",
      deliveredAt: deliveredTimestamp,
      followupSent: true, // ya se entregó, no mandar followup
    }).returning({ id: orders.id });

    const dateStr = deliveredTimestamp.toLocaleDateString("es-AR", {
      day: "2-digit", month: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });

    const itemSummary = resolvedItems.map(i => `${i.quantity}x ${i.name}`).join(", ");

    return {
      success: true,
      id: created.id,
      message: `📦 Pedido #${created.id} cargado como ENTREGADO (${dateStr}) para ${leadName}. Total: $${total}. Items: ${itemSummary}. Sin notificaciones.`,
    };
  },
});

// Export all manageOrder tools
export const manageOrderTools = {
  createOrder,
  addItemToOrder,
  removeItemFromOrder,
  updateOrderStatus,
  cancelOrder,
  calculateTotal,
  confirmOrder,
  markAsPaid,
  markPaymentMethod,
  createDeliveredOrder,
};
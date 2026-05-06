import { tool } from "ai";
import { z } from "zod";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

// ─── manageOrder: Herramientas de gestión de pedidos ──────────────────────

// createOrder - Crear nuevo pedido
export const createOrder = tool({
  description:
    "Crea un nuevo pedido. Preguntas: 'nuevo pedido', 'arma mi pedido'",
  inputSchema: z.object({
    phone: z.string().describe("Teléfono del cliente"),
    customerName: z.string().optional().describe("Nombre del cliente"),
    orderType: z
      .enum(["hamburguesas", "pan_mayorista"])
      .describe("Tipo de pedido"),
    items: z
      .array(
        z.object({
          name: z.string(),
          quantity: z.number(),
          price: z.number().optional(),
        })
      )
      .describe("Items del pedido"),
    notes: z.string().optional().describe("Notas especiales"),
  }),
  execute: async ({ phone, customerName, orderType, items, notes }) => {
    // Calcular total
    let total = 0;
    for (const item of items) {
      total += (item.price ?? 0) * item.quantity;
    }

    const [created] = await db
      .insert(orders)
      .values({
        phoneNumber: phone,
        customerName,
        orderType,
        items,
        notes,
        status: "pending",
      })
      .returning({ id: orders.id });

    return {
      success: true,
      id: created.id,
      total,
      message: `Pedido #${created.id} creado. Total: $${total}`,
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
    const newItems = [...currentItems, item];

    await db
      .update(orders)
      .set({ items: newItems, updatedAt: new Date() })
      .where(eq(orders.id, orderId));

    return {
      success: true,
      message: `Agregado ${item.quantity}x ${item.name} al pedido #${orderId}`,
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

// Export all manageOrder tools
export const manageOrderTools = {
  createOrder,
  addItemToOrder,
  removeItemFromOrder,
  updateOrderStatus,
  cancelOrder,
  calculateTotal,
  confirmOrder,
};
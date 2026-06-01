import { tool } from "ai";
import { z } from "zod";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

// ─── getOrderStatus ─────────────────────────────────────────────────────────
export const getOrderStatusTool = tool({
  description:
    "Consulta el estado de un pedido. Cuando el cliente pregunte: 'ya salió?', 'dónde está mi pedido?', 'cómo vamos?', 'ya?', 'cuánto falta?', 'mi pedido?', 'el delivery?', 'salió?'",
  inputSchema: z.object({
    orderId: z
      .number()
      .optional()
      .describe("ID del pedido (si lo tiene)"),
    customerPhone: z
      .string()
      .optional()
      .describe("Teléfono del cliente para buscar su último pedido"),
  }),
  execute: async ({ orderId, customerPhone }) => {
    let order;

    if (orderId) {
      const rows = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);
      order = rows[0];
    } else if (customerPhone) {
      const rows = await db
        .select()
        .from(orders)
        .where(eq(orders.phoneNumber, customerPhone))
        .orderBy(desc(orders.createdAt))
        .limit(1);
      order = rows[0];
    }

    if (!order) {
      return "No encontré ningún pedido. ¿Podés darme el número de pedido o tu teléfono?";
    }

    const statusLabels: Record<string, string> = {
      pending: "⏳ Pendiente",
      preparing: "👨‍🍳 Preparándose",
      ready: "✅ Listo para entregar",
      delivered: "🛵 Entregado",
      cancelled: "❌ Cancelado",
    };

    const items = order.items as { name: string; quantity: number }[];
    const itemList = Array.isArray(items)
      ? items.map((i) => `  • ${i.quantity}x ${i.name}`).join("\n")
      : "Sin detalle";

    return `📋 Pedido #${order.id}\n${statusLabels[order.status] || order.status}\n${itemList}\n👤 ${order.customerName || "Sin nombre"}`;
  },
});

// ─── addToOrder ─────────────────────────────────────────────────────────────
export const addToOrderTool = tool({
  description:
    "Agrega items a un pedido existente. Tiene 5 MINUTOS desde que se creó el pedido para agregar cosas. Después ya no se puede.",
  inputSchema: z.object({
    orderId: z.number().describe("ID del pedido"),
    newItems: z
      .array(
        z.object({
          name: z.string(),
          quantity: z.number().int().positive(),
          unitPrice: z.number().positive(),
        })
      )
      .describe("Items nuevos a agregar"),
  }),
  execute: async ({ orderId, newItems }) => {
    const rows = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    const order = rows[0];
    if (!order) {
      return "No encontré ese pedido.";
    }

    // Ventana de 5 minutos desde la creación del pedido
    const now = Date.now();
    const createdAt = order.createdAt instanceof Date 
      ? order.createdAt.getTime() 
      : new Date(order.createdAt).getTime();
    const minutosPasados = (now - createdAt) / 60000;

    if (minutosPasados > 5) {
      return `Pasaron más de 5 minutos desde que se creó el pedido #${orderId}. Derivo al equipo de Mrs Muzzarella para que lo evalúe y te confirme si se puede agregar.`;
    }

    if (order.status !== "pending") {
      return "El pedido ya no está pendiente, no puedo agregar más items.";
    }

    const currentItems = (order.items as { name: string; quantity: number; unitPrice: number }[]) || [];
    const updatedItems = [...currentItems, ...newItems];
    const total = updatedItems.reduce(
      (sum, i) => sum + i.quantity * i.unitPrice,
      0
    );

    await db
      .update(orders)
      .set({ items: updatedItems, updatedAt: new Date() })
      .where(eq(orders.id, orderId));

    const added = newItems
      .map((i) => `${i.quantity}x ${i.name}`)
      .join(", ");

    return `✅ Agregado al pedido #${orderId}: ${added}\n💰 Nuevo total: $${total.toFixed(2)}\n⏱ Tenés hasta 5 minutos desde la creación del pedido para agregar cosas.`;
  },
});

// ─── updateOrder ────────────────────────────────────────────────────────────
export const updateOrderTool = tool({
  description:
    "Modifica notas o items de un pedido pendiente. Solo funciona si está en 'pending'.",
  inputSchema: z.object({
    orderId: z.number().describe("ID del pedido"),
    notes: z.string().optional().describe("Nuevas notas"),
    items: z
      .array(
        z.object({
          name: z.string(),
          quantity: z.number().int().positive(),
          unitPrice: z.number().positive(),
        })
      )
      .optional()
      .describe("Items actualizados (reemplaza los existentes)"),
  }),
  execute: async ({ orderId, notes, items }) => {
    const rows = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.status, "pending")))
      .limit(1);

    if (!rows[0]) {
      return "No encontré un pedido pendiente con ese número. Solo puedo modificar pedidos que todavía no se están preparando.";
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (notes !== undefined) updates.notes = notes;
    if (items !== undefined) updates.items = items;

    await db.update(orders).set(updates).where(eq(orders.id, orderId));

    const parts: string[] = [`✅ Pedido #${orderId} actualizado.`];
    if (items) {
      const total = items.reduce(
        (sum, i) => sum + i.quantity * i.unitPrice,
        0
      );
      parts.push(`💰 Nuevo total: $${total.toFixed(2)}`);
    }
    if (notes) parts.push(`📝 Notas: ${notes}`);

    return parts.join("\n");
  },
});

// ─── cancelOrder ────────────────────────────────────────────────────────────
export const cancelOrderTool = tool({
  description:
    "Cancela un pedido. Solo se puede cancelar si está en 'pending' o 'preparing'. SIEMPRE confirmar con el cliente antes de cancelar.",
  inputSchema: z.object({
    orderId: z.number().describe("ID del pedido a cancelar"),
    reason: z
      .string()
      .optional()
      .describe("Motivo de cancelación"),
  }),
  execute: async ({ orderId, reason }) => {
    const rows = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    const order = rows[0];
    if (!order) {
      return "No encontré ese pedido.";
    }

    if (order.status === "delivered" || order.status === "cancelled") {
      return `No se puede cancelar — el pedido #${orderId} ya está ${order.status === "delivered" ? "entregado" : "cancelado"}.`;
    }

    await db
      .update(orders)
      .set({
        status: "cancelled",
        notes: reason
          ? `${order.notes || ""} [CANCELADO: ${reason}]`.trim()
          : order.notes,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    return `❌ Pedido #${orderId} cancelado.${reason ? ` Motivo: ${reason}` : ""}\nDisculpá las molestias. ¿Querés hacer un pedido nuevo?`;
  },
});

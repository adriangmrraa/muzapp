"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { orders, orderStatusEnum } from "@/db/schema";
import { eq, desc, and, count, ilike, or } from "drizzle-orm";
import { auth } from "@/auth";

const PAGE_SIZE = 30;

/**
 * Programa un follow-up para 30 minutos después de la entrega.
 * Usa setTimeout con un tope de 30 min reales.
 */
async function scheduleFollowUp(orderId: number, phoneNumber: string, customerName: string | null) {
  try {
    const now = new Date();
    const hour = now.getHours();
    // Solo enviar follow-up en horario hábil (9-22hs)
    if (hour < 9 || hour >= 22) {
      console.log(`[followup] Skipped for order #${orderId} — outside business hours (${hour}:00)`);
      return;
    }

    const followupText = `Holaa, ¿todo bien con el pedido? No te olvides de etiquetarnos en ig porfa 🙌`;

    // setTimeout de 30 minutos (1800000 ms) — pero no esperamos si es serverless
    // En su lugar, marcamos followupSent como false y usamos un endpoint cron.
    // Ya está en false por defecto. El envío real se hace desde un endpoint.

    // Para Render (serverless), usamos un enfoque simple:
    // Marcamos que hay un follow-up pendiente con followupSent=false
    // El endpoint GET /api/followup procesa los pendientes.
    await db.update(orders).set({ followupSent: false }).where(eq(orders.id, orderId));
    console.log(`[followup] Scheduled for order #${orderId} — will be sent via /api/followup`);
  } catch (e) {
    console.warn(`[followup] Failed to schedule for order #${orderId}:`, e);
  }
}

export type OrderStatus = "pending" | "preparing" | "ready" | "delivered" | "cancelled";
export type OrderType = "hamburguesas" | "pan_mayorista";

export interface OrderRow {
  id: number;
  phoneNumber: string;
  customerName: string | null;
  address: string | null;
  orderType: OrderType | null;
  items: unknown;
  notes: string | null;
  tags: string[] | null;
  status: string;
  leadId: number | null;
  deliveryFee: string | null;
  paymentStatus: string | null;
  paymentMethod: string | null;
  deliveredAt: Date | null;
  followupSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrdersResponse {
  rows: OrderRow[];
  total: number;
  totalPages: number;
  currentPage: number;
}

/**
 * Fetch orders with filters
 */
export async function fetchOrders(params: {
  status?: string;
  type?: string;
  search?: string;
  page?: number;
}): Promise<OrdersResponse> {
  const session = await auth();
  if (!session) return { rows: [], total: 0, totalPages: 1, currentPage: 1 };

  const page = Math.max(1, params.page ?? 1);
  const offset = (page - 1) * PAGE_SIZE;

  const conditions = [];

  if (params.status && ["pending", "preparing", "ready", "delivered", "cancelled"].includes(params.status)) {
    conditions.push(eq(orders.status, params.status as OrderStatus));
  }
  if (params.type && ["hamburguesas", "pan_mayorista"].includes(params.type)) {
    conditions.push(eq(orders.orderType, params.type as OrderType));
  }
  if (params.search) {
    const s = `%${params.search}%`;
    conditions.push(
      or(
        ilike(orders.phoneNumber, s),
        ilike(orders.customerName ?? "", s),
        ilike(orders.notes ?? "", s)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, [{ total }]] = await Promise.all([
    db
      .select()
      .from(orders)
      .where(whereClause)
      .orderBy(desc(orders.createdAt))
      .limit(PAGE_SIZE)
      .offset(offset),
    db.select({ total: count() }).from(orders).where(whereClause),
  ]);

  return {
    rows,
    total,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    currentPage: page,
  };
}

// ─── Mensajes profesionales segun estado, tipo y entrega ───────────────
function buildWhatsAppMessage(status: string, order: OrderRow): string | null {
  const isDelivery = order.address && order.address.trim().length > 0;
  const isPan = order.orderType === "pan_mayorista";

  switch (status) {
    case "ready":
      if (isPan) {
        return `🍞 Ya esta tu pedido de pan, retiralo por Neuquen 1245.`;
      }
      if (isDelivery) {
        return `🍔 Ya esta tu pedido, en breve el delivery te lo esta llevando.`;
      }
      return `🍔 Ya esta tu pedido, retiralo por Neuquen 1245.`;

    case "delivered":
      if (isPan) {
        return `🍞 Gracias por elegirnos! Si nos compartis en tus historias participas por hamburguesas todas las semanas. Nuestro IG es @mrs_muzzarella.`;
      }
      return `🍔 Gracias por elegirnos! Si nos compartis en tus historias participas por hamburguesas todas las semanas. Nuestro IG es @mrs_muzzarella.`;

    default:
      return null;
  }
}

/**
 * Update order status + send WhatsApp notification
 */
export async function updateOrderStatus(
  orderId: number,
  newStatus: OrderStatus
): Promise<{ success: boolean; message: string }> {
  const session = await auth();
  if (!session) return { success: false, message: "No autorizado" };

  try {
    // Get order details before updating
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) return { success: false, message: "Pedido no encontrado" };

    const updateFields: Record<string, unknown> = { status: newStatus, updatedAt: new Date() };

    // Si se marca como entregado, guardar timestamp y programar followup
    if (newStatus === "delivered") {
      updateFields.deliveredAt = new Date();
      await db.update(orders).set(updateFields).where(eq(orders.id, orderId));
      scheduleFollowUp(orderId, order.phoneNumber || "", order.customerName);
    } else {
      await db
        .update(orders)
        .set(updateFields)
        .where(eq(orders.id, orderId));
    }

    // Send WhatsApp notification
    const message = buildWhatsAppMessage(newStatus, order as OrderRow);
    if (message && order.phoneNumber) {
      try {
        const { sendText } = await import("@/lib/ycloud");
        await sendText(order.phoneNumber, message);
        console.log(`[orders] WhatsApp sent to ${order.phoneNumber} for order #${orderId}: ${newStatus}`);
      } catch (e) {
        console.warn(`[orders] Failed to send WhatsApp for order #${orderId}:`, e);
      }
    }

    revalidatePath("/admin/orders");
    return { success: true, message: "Estado actualizado" };
  } catch (e) {
    return { success: false, message: "Error al actualizar" };
  }
}

/**
 * Notificar al cliente sin cambiar el estado
 */
export async function notifyCustomer(
  orderId: number
): Promise<{ success: boolean; message: string }> {
  const session = await auth();
  if (!session) return { success: false, message: "No autorizado" };

  try {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) return { success: false, message: "Pedido no encontrado" };
    if (!order.phoneNumber) return { success: false, message: "Sin teléfono" };

    const msg = buildWhatsAppMessage(order.status, order as OrderRow);
    if (!msg) return { success: false, message: "No hay mensaje para este estado" };

    const { sendText } = await import("@/lib/ycloud");
    const result = await sendText(order.phoneNumber, msg);
    if (!result.ok) return { success: false, message: `Error al enviar: ${result.error}` };

    return { success: true, message: "Notificación enviada" };
  } catch (e) {
    return { success: false, message: `Error: ${e instanceof Error ? e.message : "desconocido"}` };
  }
}

/**
 * Get order summary counts
 */
export async function getOrderCounts(): Promise<Record<string, number>> {
  const session = await auth();
  if (!session) return {};

  const allStatuses = ["pending", "preparing", "ready", "delivered", "cancelled"] as const;
  const counts: Record<string, number> = {};

  for (const s of allStatuses) {
    const [result] = await db
      .select({ n: count() })
      .from(orders)
      .where(eq(orders.status, s));
    counts[s] = result.n;
  }
  counts["total"] = Object.values(counts).reduce((a, b) => a + b, 0);

  return counts;
}

/**
 * Marcar como pagado + entregado de una sola vez, sin notificar al cliente
 */
export async function markPaidAndDelivered(
  orderId: number
): Promise<{ success: boolean; message: string }> {
  const session = await auth();
  if (!session) return { success: false, message: "No autorizado" };

  try {
    const [order] = await db
      .select({ phoneNumber: orders.phoneNumber, customerName: orders.customerName })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    await db
      .update(orders)
      .set({
        paymentStatus: "paid",
        status: "delivered",
        deliveredAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    if (order) {
      scheduleFollowUp(orderId, order.phoneNumber || "", order.customerName);
    }

    revalidatePath("/admin/orders");
    return { success: true, message: "Pagado y entregado" };
  } catch (e) {
    return { success: false, message: "Error al actualizar" };
  }
}

/**
 * Delete an order permanently
 */
export async function deleteOrder(
  orderId: number
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session) return { success: false, error: "No autorizado" };

  try {
    await db.delete(orders).where(eq(orders.id, orderId));
    revalidatePath("/admin/orders");
    return { success: true };
  } catch (e) {
    return { success: false, error: "Error al eliminar" };
  }
}

/**
 * Actualiza un pedido (items, datos del cliente, etc.)
 */
export const updateOrder = async (
  orderId: number,
  data: {
    customerName?: string;
    phoneNumber?: string;
    address?: string | null;
    orderType?: "hamburguesas" | "pan_mayorista";
    items?: { name: string; quantity: number; price?: number; unitPrice?: number }[];
    deliveryFee?: number;
    notes?: string | null;
    paymentStatus?: string;
    paymentMethod?: string | null;
  }
): Promise<{ success: boolean; error?: string }> => {
  const session = await auth();
  if (!session) return { success: false, error: "No autorizado" };

  try {
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (data.customerName !== undefined) updates.customerName = data.customerName;
    if (data.phoneNumber !== undefined) updates.phoneNumber = data.phoneNumber;
    if (data.address !== undefined) updates.address = data.address;
    if (data.orderType !== undefined) updates.orderType = data.orderType;
    if (data.items !== undefined) updates.items = data.items;
    if (data.deliveryFee !== undefined) updates.deliveryFee = String(data.deliveryFee);
    if (data.notes !== undefined) updates.notes = data.notes;
    if (data.paymentStatus !== undefined) updates.paymentStatus = data.paymentStatus;
    if (data.paymentMethod !== undefined) updates.paymentMethod = data.paymentMethod;

    await db.update(orders).set(updates).where(eq(orders.id, orderId));
    revalidatePath("/admin/orders");
    revalidatePath("/admin/clients");
    revalidatePath("/admin");
    return { success: true };
  } catch (e) {
    return { success: false, error: "Error al actualizar" };
  }
};

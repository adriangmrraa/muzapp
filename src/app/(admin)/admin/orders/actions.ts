"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { orders, orderStatusEnum } from "@/db/schema";
import { eq, desc, and, count, ilike, or } from "drizzle-orm";
import { auth } from "@/auth";

const PAGE_SIZE = 30;

export type OrderStatus = "pending" | "preparing" | "ready" | "delivered" | "cancelled";
export type OrderType = "hamburguesas" | "pan_mayorista";

export interface OrderRow {
  id: number;
  phoneNumber: string;
  customerName: string | null;
  orderType: OrderType | null;
  items: unknown;
  notes: string | null;
  tags: string[] | null;
  status: string;
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

// ─── Mensajes personalizados segun estado, tipo y entrega ───────────────
function buildWhatsAppMessage(status: string, order: OrderRow): string | null {
  const name = order.customerName || "amigo";
  const isDelivery = order.notes?.toLowerCase().includes("delivery") || !order.notes?.toLowerCase().includes("retiro");
  const isPan = order.orderType === "pan_mayorista";

  switch (status) {
    case "preparing":
      return isPan
        ? `hola ${name}, ya estamos preparando tu pedido de pan 👍`
        : `hola ${name}, ya estamos preparando tu pedido 👍`;

    case "ready":
      if (isPan) return `hola ${name}, tu pedido de pan está listo para retirar en Neuquen 1245 🔥`;
      return isDelivery
        ? `hola ${name}, tu pedido está listo! te lo estamos llevando 🛵`
        : `hola ${name}, tu pedido está listo para retirar en Neuquen 1245 🔥`;

    case "delivered":
      return `gracias ${name}! esperamos que te haya gustado. etiquetanos en ig @mrs_mozzarella ❤️`;

    case "cancelled":
      return `hola ${name}, tu pedido fue cancelado. cualquier cosa nos contactamos`;

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

    await db
      .update(orders)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(orders.id, orderId));

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

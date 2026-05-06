import { tool } from "ai";
import { z } from "zod";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTodayRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

// ─── Tools ───────────────────────────────────────────────────────────────────

// Tool for getting today's orders
export const getTodaysOrdersTool = tool({
  description:
    "Obtiene la cantidad y el detalle de pedidos del día de hoy. Preguntas: 'cuántos pedidos hoy', 'qué se vendió hoy'",
  inputSchema: z.object({}).optional(),
  execute: async () => {
    const { start, end } = getTodayRange();

    const rows = await db
      .select({
        id: orders.id,
        customerName: orders.customerName,
        orderType: orders.orderType,
        status: orders.status,
        items: orders.items,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(
        and(gte(orders.createdAt, start), lte(orders.createdAt, end))
      )
      .orderBy(orders.createdAt);

    const total = rows.length;
    const byStatus: Record<string, number> = {};
    const byType: Record<string, number> = {};

    for (const row of rows) {
      const status = row.status ?? "unknown";
      const type = row.orderType ?? "unknown";
      byStatus[status] = (byStatus[status] ?? 0) + 1;
      byType[type] = (byType[type] ?? 0) + 1;
    }

    const statusLabels: Record<string, string> = {
      pending: "pendientes",
      preparing: "preparando",
      ready: "listos",
      delivered: "entregados",
      cancelled: "cancelados",
    };

    return {
      total,
      byStatus: Object.entries(byStatus).map(
        ([key, count]) => `${count} ${statusLabels[key] ?? key}`
      ),
      byType: Object.entries(byType).map(
        ([key, count]) => `${count} ${key === "hamburguesas" ? "hamburguesas" : "pan mayorista"}`
      ),
      recentOrders: rows.slice(0, 5).map((r) => ({
        id: r.id,
        customer: r.customerName ?? "Sin nombre",
        type: r.orderType ?? "?",
        status: r.status ?? "?",
      })),
    };
  },
});

// Tool for getting orders by status
export const getOrdersByStatusTool = tool({
  description:
    "Obtiene pedidos filtrados por estado. Preguntas: 'pedidos pendientes', 'pedidos en preparación', 'qué hay para entregar'",
  inputSchema: z.object({
    status: z
      .enum(["pending", "preparing", "ready", "delivered", "cancelled"])
      .describe("Estado de los pedidos a filtrar"),
  }).optional(),
  execute: async (options) => {
    const statusFilter = options?.status ?? "pending";
    
    const rows = await db
      .select({
        id: orders.id,
        customerName: orders.customerName,
        orderType: orders.orderType,
        items: orders.items,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.status, statusFilter))
      .orderBy(orders.createdAt);

    const statusLabels: Record<string, string> = {
      pending: "pendientes",
      preparing: "preparando",
      ready: "listos para entregar",
      delivered: "entregados",
      cancelled: "cancelados",
    };

    return {
      status: statusLabels[statusFilter] ?? statusFilter,
      count: rows.length,
      orders: rows.map((r) => ({
        id: r.id,
        customer: r.customerName ?? "Sin nombre",
        type: r.orderType ?? "?",
        date: r.createdAt?.toLocaleString("es-AR", {
          hour: "2-digit",
          minute: "2-digit",
        }) ?? "?",
      })),
    };
  },
});

// Tool for getting weekly stats
export const getWeeklyStatsTool = tool({
  description:
    "Obtiene estadísticas de la semana actual. Preguntas: 'qué se vendió esta semana', 'ingresos de la semana'",
  inputSchema: z.object({}).optional(),
  execute: async () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);

    const rows = await db
      .select()
      .from(orders)
      .where(gte(orders.createdAt, start));

    // Access total dynamically to avoid TS issues
    const getTotal = (row: Record<string, unknown>) => (row.total as number) ?? 0;

    const totalDeliveredOrders = rows.filter((r) => r.status === "delivered").length;
    const hamburguesasOrders = rows.filter(
      (r) => r.orderType === "hamburguesas" && r.status === "delivered"
    ).length;
    const panMayoristaOrders = rows.filter(
      (r) => r.orderType === "pan_mayorista" && r.status === "delivered"
    ).length;

    return {
      date: start.toLocaleDateString("es-AR"),
      totalDeliveredOrders,
      hamburguesasOrders,
      panMayoristaOrders,
    };
  },
});

// Tool for getting all orders
export const getAllOrdersTool = tool({
  description:
    "Obtiene todos los pedidos recientes. Preguntas: 'dame los últimos pedidos', 'qué pedidos hay'",
  inputSchema: z.object({}).optional(),
  execute: async () => {
    const rows = await db
      .select({
        id: orders.id,
        customerName: orders.customerName,
        orderType: orders.orderType,
        status: orders.status,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .orderBy(orders.createdAt)
      .limit(20);

    const statusLabels: Record<string, string> = {
      pending: "pendiente",
      preparing: "preparando",
      ready: "listo",
      delivered: "entregado",
      cancelled: "cancelado",
    };

    return {
      count: rows.length,
      orders: rows.map((r) => ({
        id: r.id,
        customer: r.customerName ?? "Sin nombre",
        type: r.orderType ?? "?",
        since: r.createdAt?.toLocaleDateString("es-AR") ?? "?",
      })),
    };
  },
});

// Export all tools as a ToolSet
export const internalAgentTools = {
  getTodaysOrdersTool,
  getOrdersByStatusTool,
  getWeeklyStatsTool,
  getAllOrdersTool,
};
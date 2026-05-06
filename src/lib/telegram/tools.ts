import { tool } from "ai";
import { z } from "zod";
import { db } from "@/db";
import { orders, orderTypeEnum, orderStatusEnum } from "@/db/schema";
import { sql, eq, and, gte, lte } from "drizzle-orm";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTodayRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

function formatARS(amount: string | number | null): string {
  if (!amount) return "$0";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return `$${num.toLocaleString("es-AR")}`;
}

// ─── Tools ───────────────────────────────────────────────────────────────────

export const getTodaysOrdersTool = tool({
  description:
    "Obtiene la cantidad y el detalle de pedidos del día de hoy. Preguntas: 'cuántos pedidos hoy', 'qué se vendió hoy'",
  parameters: z.object({}),
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

export const getOrdersByStatusTool = tool({
  description:
    "Obtiene pedidos filtrados por estado. Preguntas: 'pedidos pendientes', 'pedidos en preparación', 'qué hay para entregar'",
  parameters: z.object({
    status: z
      .enum(["pending", "preparing", "ready", "delivered", "cancelled"])
      .describe("Estado de los pedidos a filtrar"),
  }),
  execute: async ({ status }) => {
    const rows = await db
      .select({
        id: orders.id,
        customerName: orders.customerName,
        orderType: orders.orderType,
        items: orders.items,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.status, status))
      .orderBy(orders.createdAt);

    const statusLabels: Record<string, string> = {
      pending: "pendientes",
      preparing: "preparando",
      ready: "listos para entregar",
      delivered: "entregados",
      cancelled: "cancelados",
    };

    return {
      status: statusLabels[status] ?? status,
      count: rows.length,
      orders: rows.map((r) => ({
        id: r.id,
        customer: r.customerName ?? "Sin nombre",
        type: r.orderType ?? "?",
        date: r.createdAt?.toLocaleString("es-AR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      })),
    };
  },
});

export const getSalesSummaryTool = tool({
  description:
    "Obtiene un resumen de ventas. Preguntas: 'resumen de ventas', 'cuánto se vendió', 'ventas del día'",
  parameters: z.object({}),
  execute: async () => {
    const { start, end } = getTodayRange();

    const rows = await db
      .select({
        id: orders.id,
        orderType: orders.orderType,
        status: orders.status,
        items: orders.items,
      })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, start),
          lte(orders.createdAt, end),
          eq(orders.status, "delivered")
        )
      );

    const totalOrders = rows.length;
    let hamburguesasCount = 0;
    let panCount = 0;

    for (const row of rows) {
      if (row.orderType === "hamburguesas") hamburguesasCount++;
      else if (row.orderType === "pan_mayorista") panCount++;
    }

    return {
      date: new Date().toLocaleDateString("es-AR"),
      totalDeliveredOrders: totalOrders,
      hamburguesasOrders: hamburguesasCount,
      panMayoristaOrders: panCount,
    };
  },
});

export const getPendingDeliveriesTool = tool({
  description:
    "Obtiene pedidos listos para entregar (status=ready). Preguntas: 'pedidos para entregar', 'qué está listo', 'deliveries pendientes'",
  parameters: z.object({}),
  execute: async () => {
    const rows = await db
      .select({
        id: orders.id,
        customerName: orders.customerName,
        orderType: orders.orderType,
        items: orders.items,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.status, "ready"))
      .orderBy(orders.createdAt);

    return {
      count: rows.length,
      orders: rows.map((r) => ({
        id: r.id,
        customer: r.customerName ?? "Sin nombre",
        type: r.orderType ?? "?",
        since: r.createdAt?.toLocaleString("es-AR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      })),
    };
  },
});

// ─── Tool registry ───────────────────────────────────────────────────────────

export const internalAgentTools = {
  getTodaysOrders: getTodaysOrdersTool,
  getOrdersByStatus: getOrdersByStatusTool,
  getSalesSummary: getSalesSummaryTool,
  getPendingDeliveries: getPendingDeliveriesTool,
};

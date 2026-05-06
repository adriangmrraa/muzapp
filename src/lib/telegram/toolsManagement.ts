import { tool } from "ai";
import { z } from "zod";
import { db } from "@/db";
import { leads, orders, agentConfig } from "@/db/schema";
import { eq, desc, ilike, or, gte, lte, count, and } from "drizzle-orm";

// ─── manageManagement: Tools de gestión interna ──────────────────────────────

// getClientsTool - Listar últimos 20 clientes/leads
export const getClientsTool = tool({
  description:
    "Lista los últimos 20 clientes/leads registrados. Preguntas: 'mostrame los clientes', 'últimos leads', 'quiénes se registraron'",
  inputSchema: z.object({}),
  execute: async () => {
    const rows = await db
      .select({
        id: leads.id,
        name: leads.name,
        phone: leads.phone,
        status: leads.status,
        tags: leads.tags,
        createdAt: leads.createdAt,
      })
      .from(leads)
      .orderBy(desc(leads.createdAt))
      .limit(20);

    if (rows.length === 0) return "No hay clientes registrados.";

    return rows
      .map(
        (r) =>
          `• ${r.name ?? "Sin nombre"} (${r.phone}) — ${r.status}${
            (r.tags as string[])?.length
              ? ` [${(r.tags as string[]).join(", ")}]`
              : ""
          }`
      )
      .join("\n");
  },
});

// getClientDetailTool - Detalle completo por teléfono o nombre
export const getClientDetailTool = tool({
  description:
    "Detalle completo de un cliente por teléfono o nombre. Preguntas: 'detalle de fulano', 'dame todo sobre el cliente 3411111111'",
  inputSchema: z.object({
    query: z.string().describe("Teléfono o nombre del cliente"),
  }),
  execute: async ({ query }) => {
    // Buscar por teléfono exacto primero, luego por nombre parcial
    const [lead] = await db
      .select({
        id: leads.id,
        name: leads.name,
        phone: leads.phone,
        email: leads.email,
        status: leads.status,
        notes: leads.notes,
        tags: leads.tags,
        firstMessage: leads.firstMessage,
        utmSource: leads.utmSource,
        utmCampaign: leads.utmCampaign,
        createdAt: leads.createdAt,
      })
      .from(leads)
      .where(
        or(
          eq(leads.phone, query),
          ilike(leads.name, `%${query}%`)
        )
      )
      .orderBy(desc(leads.createdAt))
      .limit(1);

    if (!lead) {
      return `No encontré ningún cliente que coincida con "${query}".`;
    }

    // Últimos 3 pedidos del cliente
    const recentOrders = await db
      .select({
        id: orders.id,
        orderType: orders.orderType,
        status: orders.status,
        items: orders.items,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.phoneNumber, lead.phone))
      .orderBy(desc(orders.createdAt))
      .limit(3);

    const statusLabels: Record<string, string> = {
      pending: "pendiente",
      preparing: "preparando",
      ready: "listo",
      delivered: "entregado",
      cancelled: "cancelado",
    };

    const lines: string[] = [
      `👤 ${lead.name ?? "Sin nombre"} | ${lead.phone}`,
      `Estado: ${lead.status}`,
    ];
    if (lead.email) lines.push(`Email: ${lead.email}`);
    if ((lead.tags as string[])?.length)
      lines.push(`Tags: ${(lead.tags as string[]).join(", ")}`);
    if (lead.notes) lines.push(`Notas: ${lead.notes}`);
    if (lead.utmSource) lines.push(`Fuente: ${lead.utmSource}${lead.utmCampaign ? ` / ${lead.utmCampaign}` : ""}`);
    if (lead.firstMessage) lines.push(`Primer mensaje: "${lead.firstMessage}"`);
    lines.push(`Registrado: ${lead.createdAt?.toLocaleDateString("es-AR")}`);

    if (recentOrders.length > 0) {
      lines.push(`\nÚltimos pedidos (${recentOrders.length}):`);
      for (const o of recentOrders) {
        lines.push(
          `  #${o.id} — ${o.orderType ?? "?"} — ${statusLabels[o.status ?? "pending"] ?? o.status} — ${o.createdAt?.toLocaleDateString("es-AR")}`
        );
      }
    } else {
      lines.push("\nSin pedidos registrados.");
    }

    return lines.join("\n");
  },
});

// searchClientTool - Buscar clientes por nombre, teléfono o email
export const searchClientTool = tool({
  description:
    "Busca clientes por nombre, teléfono o email. Preguntas: 'buscá a García', 'hay algún cliente con email xxx', 'buscá el número 3411111111'",
  inputSchema: z.object({
    query: z.string().describe("Nombre, teléfono o email a buscar"),
  }),
  execute: async ({ query }) => {
    const rows = await db
      .select({
        id: leads.id,
        name: leads.name,
        phone: leads.phone,
        email: leads.email,
        status: leads.status,
        createdAt: leads.createdAt,
      })
      .from(leads)
      .where(
        or(
          ilike(leads.name, `%${query}%`),
          ilike(leads.phone, `%${query}%`),
          ilike(leads.email, `%${query}%`)
        )
      )
      .orderBy(desc(leads.createdAt))
      .limit(10);

    if (rows.length === 0) {
      return `No encontré clientes que coincidan con "${query}".`;
    }

    const lines = [`Encontré ${rows.length} cliente(s):`];
    for (const r of rows) {
      lines.push(
        `• #${r.id} ${r.name ?? "Sin nombre"} — ${r.phone}${r.email ? ` — ${r.email}` : ""} — ${r.status}`
      );
    }
    return lines.join("\n");
  },
});

// updateOrderStatusTool - Cambiar estado de un pedido (alias mejorado)
export const updateOrderStatusTool = tool({
  description:
    "Cambia el estado de un pedido. Preguntas: 'el pedido 5 está listo', 'marcá el pedido 3 como entregado', 'cancelá el pedido 7'",
  inputSchema: z.object({
    orderId: z.number().describe("ID del pedido"),
    status: z
      .enum(["preparing", "ready", "delivered", "cancelled"])
      .describe("Nuevo estado: preparing | ready | delivered | cancelled"),
  }),
  execute: async ({ orderId, status }) => {
    const [existing] = await db
      .select({ id: orders.id, status: orders.status, customerName: orders.customerName })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!existing) {
      return `No encontré el pedido #${orderId}.`;
    }

    const statusLabels: Record<string, string> = {
      pending: "pendiente",
      preparing: "en preparación",
      ready: "listo para retirar",
      delivered: "entregado",
      cancelled: "cancelado",
    };

    await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, orderId));

    return `✅ Pedido #${orderId}${existing.customerName ? ` (${existing.customerName})` : ""} marcado como *${statusLabels[status]}*.`;
  },
});

// getAnalyticsTool - Métricas de ventas por período
export const getAnalyticsTool = tool({
  description:
    "Métricas de ventas por período. Preguntas: 'cómo vamos hoy', 'ventas de esta semana', 'resumen del mes', 'estadísticas'",
  inputSchema: z.object({
    period: z
      .enum(["today", "week", "month"])
      .describe("Período: today | week | month"),
  }),
  execute: async ({ period }) => {
    const now = new Date();
    let start: Date;

    if (period === "today") {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === "week") {
      const day = now.getDay(); // 0=dom, 1=lun...
      const diff = (day === 0 ? 6 : day - 1); // lunes como inicio
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const end = new Date(now.getTime() + 1); // +1ms para incluir ahora

    // Pedidos del período
    const periodOrders = await db
      .select({
        id: orders.id,
        status: orders.status,
        orderType: orders.orderType,
        items: orders.items,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(and(gte(orders.createdAt, start), lte(orders.createdAt, end)));

    // Nuevos leads del período
    const newLeadsResult = await db
      .select({ count: count() })
      .from(leads)
      .where(and(gte(leads.createdAt, start), lte(leads.createdAt, end)));

    const newLeadsCount = newLeadsResult[0]?.count ?? 0;

    // Conteo por estado
    const byStatus: Record<string, number> = {};
    let totalItems = 0;

    for (const o of periodOrders) {
      const s = o.status ?? "unknown";
      byStatus[s] = (byStatus[s] ?? 0) + 1;

      const items = o.items as { name: string; quantity: number }[];
      if (Array.isArray(items)) {
        for (const item of items) {
          totalItems += item.quantity ?? 1;
        }
      }
    }

    const periodLabels = { today: "hoy", week: "esta semana", month: "este mes" };

    const statusLabels: Record<string, string> = {
      pending: "pendiente",
      preparing: "preparando",
      ready: "listo",
      delivered: "entregado",
      cancelled: "cancelado",
    };

    const lines = [
      `📊 Resumen ${periodLabels[period]}:`,
      `• Pedidos totales: ${periodOrders.length}`,
      `• Items despachados: ${totalItems}`,
      `• Nuevos leads: ${newLeadsCount}`,
      ``,
      `Por estado:`,
    ];

    for (const [s, c] of Object.entries(byStatus)) {
      lines.push(`  ${statusLabels[s] ?? s}: ${c}`);
    }

    if (periodOrders.length === 0) {
      lines.push("  Sin pedidos en este período.");
    }

    return lines.join("\n");
  },
});

// getBusinessHoursTool - Ver horarios de atención y si está abierto ahora
export const getBusinessHoursTool = tool({
  description:
    "Muestra los horarios de atención del negocio y si está abierto ahora. Preguntas: 'estamos abiertos?', 'cuáles son los horarios', 'a qué hora cerramos'",
  inputSchema: z.object({}),
  execute: async () => {
    const [config] = await db
      .select({ businessHours: agentConfig.businessHours })
      .from(agentConfig)
      .limit(1);

    if (!config?.businessHours) {
      return "No hay horarios configurados todavía.";
    }

    const hours = config.businessHours as {
      days?: string;
      open?: string;
      close?: string;
      enabled?: boolean;
    };

    if (!hours.enabled) {
      return "Los horarios automáticos están desactivados.";
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    const parseTime = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + (m ?? 0);
    };

    const currentMinutes = currentHour * 60 + currentMinute;
    const openMinutes = hours.open ? parseTime(hours.open) : null;
    const closeMinutes = hours.close ? parseTime(hours.close) : null;

    const isOpen =
      openMinutes !== null &&
      closeMinutes !== null &&
      currentMinutes >= openMinutes &&
      currentMinutes < closeMinutes;

    const lines = [
      `🕐 Horarios de atención:`,
      `• Días: ${hours.days ?? "No especificados"}`,
      `• Apertura: ${hours.open ?? "—"}`,
      `• Cierre: ${hours.close ?? "—"}`,
      ``,
      isOpen
        ? `✅ Ahora estamos ABIERTOS (${now.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })})`
        : `❌ Ahora estamos CERRADOS (${now.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })})`,
    ];

    return lines.join("\n");
  },
});

// ─── Export ─────────────────────────────────────────────────────────────────

export const managementTools = {
  getClients: getClientsTool,
  getClientDetail: getClientDetailTool,
  searchClient: searchClientTool,
  updateOrderStatusNew: updateOrderStatusTool,
  getAnalytics: getAnalyticsTool,
  getBusinessHours: getBusinessHoursTool,
};

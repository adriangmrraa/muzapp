import { tool } from "ai";
import { z } from "zod";
import { db } from "@/db";
import { leads, orders, agentConfig, conversations, chatMessages, products, users } from "@/db/schema";
import { eq, desc, ilike, or, gte, lte, count, and, asc, sql } from "drizzle-orm";

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

// ─── updateBusinessHoursTool ─────────────────────────────────────────────────
export const updateBusinessHoursTool = tool({
  description:
    "ACTUALIZA los horarios de atención del negocio. Usar cuando el admin pida cambiar horarios. Parámetros: enabled (true/false), days (ej: 'Lunes a Viernes'), openTime (ej: '05:00'), closeTime (ej: '23:45'). SIEMPRE actualizá con los datos que te den, no preguntes de más.",
  inputSchema: z.object({
    enabled: z.boolean().describe("true si el negocio está abierto, false si cerrado"),
    days: z.string().describe("Días de atención. Ej: 'Lunes a Viernes' o 'Lunes a Domingo'"),
    openTime: z.string().describe("Hora de apertura formato HH:MM. Ej: '05:00'"),
    closeTime: z.string().describe("Hora de cierre formato HH:MM. Ej: '23:45'"),
  }),
  execute: async ({ enabled, days, openTime, closeTime }) => {
    const [existing] = await db
      .select({ id: agentConfig.id })
      .from(agentConfig)
      .where(eq(agentConfig.id, 1))
      .limit(1);

    if (existing) {
      await db
        .update(agentConfig)
        .set({
          businessHours: { enabled, days, open: openTime, close: closeTime },
          updatedAt: new Date(),
        })
        .where(eq(agentConfig.id, 1));
    } else {
      await db.insert(agentConfig).values({
        id: 1,
        businessHours: { enabled, days, open: openTime, close: closeTime },
      });
    }

    return `✅ Horarios actualizados:
• Días: ${days}
• Apertura: ${openTime}
• Cierre: ${closeTime}
• Estado: ${enabled ? "Abierto" : "Cerrado"}`;
  },
});

// ─── getConversationsTool ────────────────────────────────────────────────────
export const getConversationsTool = tool({
  description:
    "Lista las últimas conversaciones de WhatsApp. Preguntas: 'mostrame los chats', 'conversaciones recientes', 'qué están hablando los clientes'",
  inputSchema: z.object({
    limit: z.number().optional().default(10).describe("Cantidad de conversaciones a mostrar (max 20)"),
  }),
  execute: async ({ limit }) => {
    const { conversations: convTable, chatMessages } = await import("@/db/schema");
    const rows = await db
      .select({
        id: convTable.id,
        customerName: convTable.customerName,
        customerPhone: convTable.customerPhone,
        status: convTable.status,
        lastMessageAt: convTable.lastMessageAt,
        lastMessagePreview: convTable.lastMessagePreview,
      })
      .from(convTable)
      .orderBy(desc(convTable.lastMessageAt))
      .limit(Math.min(limit, 20));

    if (rows.length === 0) return "No hay conversaciones.";

    return rows.map((r) =>
      `• #${r.id} ${r.customerName ?? "?"} (${r.customerPhone}) — ${r.status}${r.lastMessageAt ? ` — ${r.lastMessageAt.toLocaleString("es-AR")}` : ""}${r.lastMessagePreview ? `: "${r.lastMessagePreview.slice(0, 50)}"` : ""}`
    ).join("\n");
  },
});

// ─── updateAgentConfigTool ──────────────────────────────────────────────────
export const updateAgentConfigTool = tool({
  description:
    "ACTUALIZA cualquier configuración del negocio en tiempo real. Usar cuando el admin pida cambios en: cocina (isCooking), stock de pan (stockPanDocenas), alias de pago (aliasB2c/aliasB2b), tiempo de espera (tiempoEspera), o cualquier campo de configuración. Solo envía los campos que querés cambiar.",
  inputSchema: z.object({
    isCooking: z.boolean().optional().describe("true = cocina abierta, false = cocina cerrada"),
    stockPanDocenas: z.number().int().min(0).optional().describe("Stock de pan en docenas"),
    aliasB2c: z.string().optional().describe("Alias de Mercado Pago para hamburguesas (B2C)"),
    aliasB2b: z.string().optional().describe("Alias de Mercado Pago para pan mayorista (B2B)"),
    tiempoEspera: z.string().optional().describe("Tiempo de espera estimado. Ej: '30-40 min'"),
  }),
  execute: async (args) => {
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    const changed: string[] = [];

    if (args.isCooking !== undefined) { updates.isCooking = args.isCooking; changed.push(`cocina: ${args.isCooking ? "abierta" : "cerrada"}`); }
    if (args.stockPanDocenas !== undefined) { updates.stockPanDocenas = args.stockPanDocenas; changed.push(`stock pan: ${args.stockPanDocenas} doc`); }
    if (args.aliasB2c !== undefined) { updates.aliasB2c = args.aliasB2c; changed.push(`alias B2C: ${args.aliasB2c}`); }
    if (args.aliasB2b !== undefined) { updates.aliasB2b = args.aliasB2b; changed.push(`alias B2B: ${args.aliasB2b}`); }
    if (args.tiempoEspera !== undefined) { updates.tiempoEspera = args.tiempoEspera; changed.push(`tiempo espera: ${args.tiempoEspera}`); }

    if (changed.length === 0) return "No especificaste qué cambiar. Pasá al menos un parámetro.";

    const [existing] = await db
      .select({ id: agentConfig.id })
      .from(agentConfig)
      .where(eq(agentConfig.id, 1))
      .limit(1);

    if (existing) {
      await db.update(agentConfig).set(updates).where(eq(agentConfig.id, 1));
    } else {
      await db.insert(agentConfig).values({ id: 1, ...updates });
    }

    return `✅ Configuración actualizada:\n${changed.join("\n")}`;
  },
});

// ─── queryDataTool ──────────────────────────────────────────────────────────
// Tool genérica para consultar CUALQUIER tabla de la base de datos
// con filtros inteligentes. El LLM decide qué tabla, columnas y filtros usar.
export const queryDataTool = tool({
  description:
    "Consulta CUALQUIER tabla de la base de datos con filtros inteligentes. Elegí la tabla, los filtros (columna:valor), el orden y límite. Tablas disponibles: conversations (chats de WhatsApp), leads (clientes), orders (pedidos), products (productos), agent_config (config del negocio), chat_messages (mensajes individuales), users (usuarios admin), attachments (archivos adjuntos).",
  inputSchema: z.object({
    table: z.enum(["conversations", "leads", "orders", "products", "agent_config", "chat_messages", "users", "attachments"])
      .describe("Nombre de la tabla a consultar"),
    filters: z.array(z.object({
      column: z.string().describe("Nombre de la columna. Ej: 'id', 'name', 'phone', 'status', 'customerName', 'orderType'"),
      operator: z.enum(["eq", "neq", "like", "gt", "gte", "lt", "lte"]).describe("Operador: eq (igual), neq (distinto), like (contiene), gt/gte/lt/lte (mayor/menor que)"),
      value: z.string().describe("Valor a buscar. Para texto usá el texto, para números usá el número como string"),
    })).optional().describe("Filtros a aplicar. Se combinan con AND."),
    orderBy: z.string().optional().describe("Columna por la que ordenar. Por defecto: createdAt o id"),
    orderDir: z.enum(["asc", "desc"]).optional().default("desc").describe("Dirección del orden"),
    limit: z.number().int().min(1).max(50).optional().default(20).describe("Cantidad máxima de resultados"),
  }),
  execute: async ({ table, filters, orderBy, orderDir, limit }) => {
    try {
      // Map table names to actual drizzle queries
      const tableMap: Record<string, any> = {
        conversations, leads, orders, products, agentConfig, chat_messages, users,
      };

      const tbl = tableMap[table];
      if (!tbl) return `Tabla "${table}" no disponible para consulta directa.`;

      // Build WHERE conditions
      const conditions: any[] = [];
      for (const f of filters || []) {
        const col = tbl[f.column as keyof typeof tbl];
        if (!col) continue; // skip unknown columns

        if (f.operator === "eq") conditions.push(eq(col, f.value));
        else if (f.operator === "neq") conditions.push(sql`${col} != ${f.value}`);
        else if (f.operator === "like") conditions.push(ilike(col, `%${f.value}%`));
        else if (f.operator === "gt") conditions.push(sql`${col} > ${f.value}::numeric`);
        else if (f.operator === "gte") conditions.push(sql`${col} >= ${f.value}::numeric`);
        else if (f.operator === "lt") conditions.push(sql`${col} < ${f.value}::numeric`);
        else if (f.operator === "lte") conditions.push(sql`${col} <= ${f.value}::numeric`);
      }

      // Default order
      const orderCol = orderBy
        ? (tbl[orderBy as keyof typeof tbl] || desc(tbl.createdAt || tbl.id))
        : desc(tbl.createdAt || tbl.id);
      const orderFn = orderDir === "asc" ? asc : desc;
      const finalOrder = orderBy ? orderFn(tbl[orderBy as keyof typeof tbl]) : desc(tbl.createdAt || tbl.id);

      const rows = await db
        .select()
        .from(tbl)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(finalOrder)
        .limit(limit);

      if (rows.length === 0) return `No se encontraron resultados en "${table}" con esos filtros.`;

      // Format results as compact text
      const headers = Object.keys(rows[0]).slice(0, 8); // max 8 columns
      return rows.map((row: any) => {
        return headers.map((h) => {
          const val = row[h];
          if (val === null || val === undefined) return "";
          if (val instanceof Date) return val.toLocaleString("es-AR");
          if (typeof val === "object") return JSON.stringify(val).slice(0, 100);
          return String(val).slice(0, 80);
        }).filter(Boolean).join(" | ");
      }).join("\n");
    } catch (e: any) {
      return `Error al consultar: ${e.message || "desconocido"}`;
    }
  },
});

// ─── getBusinessSummary ──────────────────────────────────────────────────────
// Resumen ejecutivo del negocio en UNA sola llamada (cocina, pedidos pendientes, data rápida)
export const getBusinessSummaryTool = tool({
  description:
    "RESUMEN EJECUTIVO del negocio en UNA llamada. Devuelve: estado de cocina, pedidos pendientes, pedidos hoy, leads nuevos, stock de pan, alias configurados. PREGUNTAS: 'cómo vamos?', 'resumen del negocio', 'qué onda hoy?', 'dame el panorama general'",
  inputSchema: z.object({}),
  execute: async () => {
    const [config] = await db.select().from(agentConfig).where(eq(agentConfig.id, 1)).limit(1);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [pendingOrders] = await db
      .select({ count: count() }).from(orders)
      .where(eq(orders.status, "pending"));

    const [todayOrders] = await db
      .select({ count: count() }).from(orders)
      .where(and(gte(orders.createdAt, today), lte(orders.createdAt, new Date(today.getTime() + 86400000))));

    const [newLeads] = await db
      .select({ count: count() }).from(leads)
      .where(gte(leads.createdAt, today));

    const lines = [
      `📊 *RESUMEN DEL NEGOCIO*`,
      ``,
      `👨‍🍳 Cocina: ${config?.isCooking ? "✅ Abierta" : "❌ Cerrada"}`,
      `⏰ Horarios: ${config?.businessHours ? `${config.businessHours.days || "?"} ${config.businessHours.open || "?"}-${config.businessHours.close || "?"}` : "No configurados"}`,
      `📦 Pedidos pendientes: ${pendingOrders?.count || 0}`,
      `📅 Pedidos hoy: ${todayOrders?.count || 0}`,
      `🆕 Leads hoy: ${newLeads?.count || 0}`,
      `🍞 Stock pan: ${config?.stockPanDocenas || 0} docenas`,
      `🏷️ Alias B2C: ${config?.aliasB2c || "—"}`,
      `🏷️ Alias B2B: ${config?.aliasB2b || "—"}`,
      `⏱ Tiempo espera: ${config?.tiempoEspera || "30-40 min"}`,
    ];

    return lines.join("\n");
  },
});

// ─── getConversationMessages ─────────────────────────────────────────────────
// Ver el historial de mensajes de una conversación específica
export const getConversationMessagesTool = tool({
  description:
    "Muestra el historial COMPLETO de mensajes de una conversación de WhatsApp. PREGUNTAS: 'mostrame el chat con Hector', 'qué dijo el cliente X?', 'historial de la conversación 5'",
  inputSchema: z.object({
    conversationId: z.number().optional().describe("ID de la conversación (si se sabe)"),
    customerPhone: z.string().optional().describe("Teléfono del cliente para buscar su conversación"),
    customerName: z.string().optional().describe("Nombre del cliente para buscar"),
  }),
  execute: async ({ conversationId, customerPhone, customerName }) => {
    let convId = conversationId;

    if (!convId) {
      const conditions = [];
      if (customerPhone) conditions.push(eq(conversations.customerPhone, customerPhone));
      if (customerName) conditions.push(ilike(conversations.customerName || conversations.whatsappId, `%${customerName}%`));

      if (conditions.length === 0) return "Necesito un ID de conversación, teléfono o nombre del cliente.";

      const [conv] = await db
        .select({ id: conversations.id })
        .from(conversations)
        .where(conditions.length === 1 ? conditions[0] : or(...conditions))
        .orderBy(desc(conversations.lastMessageAt))
        .limit(1);

      if (!conv) return "No encontré esa conversación.";
      convId = conv.id;
    }

    const messages = await db
      .select({
        role: chatMessages.role,
        content: chatMessages.content,
        createdAt: chatMessages.createdAt,
        contentAttributes: chatMessages.contentAttributes,
      })
      .from(chatMessages)
      .where(eq(chatMessages.conversationId, convId))
      .orderBy(asc(chatMessages.createdAt))
      .limit(50);

    if (messages.length === 0) return `La conversación #${convId} no tiene mensajes.`;

    return messages.map((m) => {
      const time = m.createdAt ? m.createdAt.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }) : "";
      const role = m.role === "user" ? "👤 Cliente" : "🤖 Bot";
      const content = m.content?.slice(0, 200) || "";
      return `${time} ${role}: ${content}`;
    }).join("\n");
  },
});

// ─── getActivePromotions ─────────────────────────────────────────────────────
// Lee las promociones activas desde la config del WhatsApp agent
export const getActivePromotionsTool = tool({
  description:
    "Lee las PROMOCIONES ACTIVAS configuradas desde el panel admin. Esto es lo mismo que usa el agente de WhatsApp para ofrecer descuentos. PREGUNTAS: 'qué promos hay?', 'promociones activas', 'qué ofertas tenemos?'",
  inputSchema: z.object({}),
  execute: async () => {
    const [config] = await db
      .select({ promos: agentConfig.whatsappPromociones, aliasB2c: agentConfig.aliasB2c })
      .from(agentConfig)
      .where(eq(agentConfig.id, 1))
      .limit(1);

    if (!config?.promos || !config.promos.trim()) {
      return "No hay promociones activas configuradas. Agregalas desde el panel admin → Agente IA.";
    }

    return `🏷️ *PROMOCIONES ACTIVAS:*\n${config.promos}`;
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
  updateBusinessHours: updateBusinessHoursTool,
  getConversations: getConversationsTool,
  updateAgentConfig: updateAgentConfigTool,
  queryData: queryDataTool,
  getBusinessSummary: getBusinessSummaryTool,
  getConversationMessages: getConversationMessagesTool,
  getActivePromotions: getActivePromotionsTool,
};

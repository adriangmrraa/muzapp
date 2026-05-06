import { tool } from "ai";
import { z } from "zod";
import { db } from "@/db";
import { orders, leads } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

// ─── manageClient: Herramientas de gestión de clientes ──────────────────────

// getClientByPhone - Buscar cliente por teléfono
export const getClientByPhone = tool({
  description:
    "Busca un cliente por su teléfono. Preguntas: 'quién es el cliente 3411111111', 'busca a fulano'",
  inputSchema: z.object({
    phone: z.string().describe("Número de teléfono a buscar"),
  }),
  execute: async ({ phone }) => {
    // Buscar en leads (tabla principal de clientes)
    const [lead] = await db
      .select({
        id: leads.id,
        name: leads.name,
        phone: leads.phone,
        email: leads.email,
        status: leads.status,
        notes: leads.notes,
        createdAt: leads.createdAt,
      })
      .from(leads)
      .where(eq(leads.phone, phone))
      .limit(1);

    if (!lead) {
      return { found: false, message: "No encontré ese cliente" };
    }

    return {
      found: true,
      id: lead.id,
      name: lead.name ?? "Sin nombre",
      phone: lead.phone,
      email: lead.email,
      status: lead.status,
      notes: lead.notes,
      since: lead.createdAt?.toLocaleDateString("es-AR"),
    };
  },
});

// createClient - Crear nuevo cliente
export const createClient = tool({
  description:
    "Crea un nuevo cliente. Preguntas: 'registra a fulano', 'agrega cliente'",
  inputSchema: z.object({
    name: z.string().describe("Nombre del cliente"),
    phone: z.string().describe("Teléfono"),
    email: z.string().optional().describe("Email (opcional)"),
  }),
  execute: async ({ name, phone, email }) => {
    // Verificar si existe
    const [existing] = await db
      .select({ id: leads.id })
      .from(leads)
      .where(eq(leads.phone, phone))
      .limit(1);

    if (existing) {
      return { success: false, message: "Ya existe un cliente con ese teléfono" };
    }

    // Crear
    const [created] = await db
      .insert(leads)
      .values({
        name,
        phone,
        email,
        status: "new",
      })
      .returning({ id: leads.id });

    return {
      success: true,
      id: created.id,
      message: `Cliente ${name} registrado con éxito`,
    };
  },
});

// updateClient - Actualizar datos del cliente
export const updateClient = tool({
  description:
    "Actualiza datos de un cliente. Preguntas: 'cambia el email de fulano', 'actualiza cliente'",
  inputSchema: z.object({
    phone: z.string().describe("Teléfono del cliente"),
    name: z.string().optional().describe("Nuevo nombre"),
    email: z.string().optional().describe("Nuevo email"),
    notes: z.string().optional().describe("Nuevas notas"),
  }),
  execute: async ({ phone, name, email, notes }) => {
    const [existing] = await db
      .select({ id: leads.id })
      .from(leads)
      .where(eq(leads.phone, phone))
      .limit(1);

    if (!existing) {
      return { success: false, message: "No encontré ese cliente" };
    }

    const updates: Record<string, unknown> = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (notes) updates.notes = notes;

    await db
      .update(leads)
      .set(updates)
      .where(eq(leads.id, existing.id));

    return {
      success: true,
      message: "Cliente actualizado",
    };
  },
});

// getClientHistory - Ver historial de pedidos de un cliente
export const getClientHistory = tool({
  description:
    "Ver historial de pedidos de un cliente. Preguntas: 'qué pidió fulano', 'historial del cliente'",
  inputSchema: z.object({
    phone: z.string().describe("Teléfono del cliente"),
    limit: z.number().optional().describe("Límite (default 10)"),
  }),
  execute: async ({ phone, limit = 10 }) => {
    const rows = await db
      .select({
        id: orders.id,
        orderType: orders.orderType,
        items: orders.items,
        status: orders.status,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.phoneNumber, phone))
      .orderBy(desc(orders.createdAt))
      .limit(limit);

    if (rows.length === 0) {
      return { found: false, message: "No tiene pedidos aún" };
    }

    const statusLabels: Record<string, string> = {
      pending: "pendiente",
      preparing: "preparando",
      ready: "listo",
      delivered: "entregado",
      cancelled: "cancelado",
    };

    return {
      found: true,
      phone,
      totalOrders: rows.length,
      orders: rows.map((r) => ({
        id: r.id,
        type: r.orderType,
        items: r.items,
        status: statusLabels[r.status ?? "pending"] ?? r.status,
        date: r.createdAt?.toLocaleDateString("es-AR", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }),
      })),
    };
  },
});

// suggestProducts - Sugerir productos based en historial
export const suggestProducts = tool({
  description:
    "Sugiere productos basados en el historial del cliente. Preguntas: 'qué le gusta a fulano', 'qué le sugiero'",
  inputSchema: z.object({
    phone: z.string().describe("Teléfono del cliente"),
  }),
  execute: async ({ phone }) => {
    // Obtener últimos 3 pedidos
    const rows = await db
      .select({
        id: orders.id,
        items: orders.items,
        orderType: orders.orderType,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.phoneNumber, phone))
      .orderBy(desc(orders.createdAt))
      .limit(3);

    if (rows.length === 0) {
      return {
        suggestion: "Aún no tiene pedidos, podrías ofrecerle nuestras hamburguesas premium",
        products: [],
      };
    }

    // Extraer productos pedidos
    const productsOrdered: string[] = [];
    for (const row of rows) {
      const items = row.items as { name: string; quantity: number }[];
      if (Array.isArray(items)) {
        for (const item of items) {
          productsOrdered.push(item.name);
        }
      }
    }

    // Contar productos más pedidos
    const countByProduct: Record<string, number> = {};
    for (const p of productsOrdered) {
      countByProduct[p] = (countByProduct[p] ?? 0) + 1;
    }

    // Obtener los más pedidos
    const topProducts = Object.entries(countByProduct)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => name);

    return {
      suggestion: `Le gustó: ${topProducts.join(", ")}`,
      products: topProducts,
      totalOrders: rows.length,
    };
  },
});

// Export all manageClient tools
export const manageClientTools = {
  getClientByPhone,
  createClient,
  updateClient,
  getClientHistory,
  suggestProducts,
};
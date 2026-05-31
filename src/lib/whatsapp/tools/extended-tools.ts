import { tool } from "ai";
import { z } from "zod";
import { db } from "@/db";
import { products, orders as ordersTable } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

// --- CHECK DELIVERY TOOL ---
// Verifica si hacemos delivery a una zona

const DELIVERY_ZONES: Record<string, { disponible: boolean; tiempo: string; costo: number }> = {
  centro: { disponible: true, tiempo: "20-30 min", costo: 0 },
  norte: { disponible: true, tiempo: "25-35 min", costo: 0 },
  sur: { disponible: true, tiempo: "30-40 min", costo: 0 },
  este: { disponible: true, tiempo: "25-35 min", costo: 0 },
  oeste: { disponible: true, tiempo: "35-45 min", costo: 0 },
};

const zonaKeys = Object.keys(DELIVERY_ZONES) as (keyof typeof DELIVERY_ZONES)[];

export const checkDeliveryTool = tool({
  description: "Verifica si hacemos delivery a una zona特定地域へのデリバリー 가능 여부を確認",
  inputSchema: z.object({
    zona: z.string().optional().describe("Zona o barrio (ej: centro, norte, sur)"),
    direccion: z.string().optional().describe("Dirección exacta"),
  }),
  execute: async ({ zona, direccion }) => {
    // Si no specify zona, asuminos centro
    const zonaNormalizada = (zona || "centro").toLowerCase();
    
    // Buscar coincidencia parcial
    const zonaEncontrada = zonaKeys.find(z => 
      zonaNormalizada.includes(z) || z.includes(zonaNormalizada)
    ) || "centro";
    
    const info = DELIVERY_ZONES[zonaEncontrada];
    
    if (info.disponible) {
      return `✅ Sí, delivery a ${zonaEncontrada.charAt(0).toUpperCase() + zonaEncontrada.slice(1)}!
🕐 Tiempo: ${info.tiempo}
${info.costo === 0 ? "💰 Sin costo adicional" : `$${info.costo}`}`;}
    
    return `⚠️ Por el momento no llegamos a esa zona.Estamos en Formosa centro y zonas aledañas. ¿Querés pasar a buscar por el local?`;
  },
});

// --- GET DELIVERY TIME TOOL ---
// Obtiene tiempo estimado de entrega

export const getDeliveryTimeTool = tool({
  description: "Obtiene el tiempo estimado de delivery según la zona",
  inputSchema: z.object({
    zona: z.string().optional(),
  }),
  execute: async ({ zona }) => {
    const zonaNormalizada = (zona || "centro").toLowerCase();
    const zonaEncontrada = zonaKeys.find(z => 
      zonaNormalizada.includes(z) || z.includes(zonaNormalizada)
    ) || "centro";
    
    return DELIVERY_ZONES[zonaEncontrada].tiempo;
  },
});

// --- GET WAIT TIME ---
// Calcula tiempo de demora basado en pedidos pendientes
// Cada hamburguesa: 7 minutos. 1 delivery.
export const getWaitTimeTool = tool({
  description: "Calcula el tiempo de demora estimado segun la cantidad de pedidos pendientes. Cada hamburguesa tarda 7 min en hacerse. Hay 1 delivery.",
  inputSchema: z.object({}),
  execute: async () => {
    const pendingOrders = await db
      .select({ items: ordersTable.items })
      .from(ordersTable)
      .where(eq(ordersTable.status, "pending"))
      .orderBy(desc(ordersTable.createdAt));

    // Contar hamburguesas totales en pedidos pendientes
    let totalBurgers = 0;
    for (const o of pendingOrders) {
      const items = o.items as { name?: string; quantity?: number }[] | null;
      if (!items) continue;
      for (const item of items) {
        if (item.name && item.quantity) {
          totalBurgers += item.quantity;
        }
      }
    }

    const minutosCoccion = totalBurgers * 7;
    const minutosDelivery = 15; // tiempo fijo de delivery
    const totalMinutos = minutosCoccion + minutosDelivery;

    return {
      pedidosPendientes: pendingOrders.length,
      hamburguesasEnCola: totalBurgers,
      minutosEstimado: totalMinutos,
      mensaje: `Hay ${pendingOrders.length} pedido(s) antes. ${totalBurgers} hamburguesas en cola. A 7 min cada una, serían ${totalMinutos} min aproximadamente.`,
    };
  },
});

// --- LISTA DE PRODUCTOS CON STOCK ---
export const listAvailableProductsTool = tool({
  description: "Lista todos los productos disponibles actualmente",
  inputSchema: z.object({
    linea: z.enum(["pollo", "carne", "pan"]).optional().describe("Línea a filtrar"),
  }),
  execute: async ({ linea }) => {
    const conditions = [eq(products.available, true)];
    
    if (linea) {
      conditions.push(eq(products.line, linea as any));
    }
    
    const items = await db
      .select({
        name: products.name,
        price: products.price,
        description: products.description,
        category: products.category,
      })
      .from(products)
      .where(and(...conditions))
      .orderBy(products.sortOrder);
    
    if (items.length === 0) {
      return "No hay productos disponibles en este momento.";
    }
    
    return items
      .map(i => `• ${i.name} - $${Number(i.price || 0).toLocaleString("es-AR")}${i.description ? ` — ${i.description}` : ""}`)
      .join("\n");
  },
});
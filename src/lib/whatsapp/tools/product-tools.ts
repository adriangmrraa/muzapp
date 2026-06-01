import { tool } from "ai";
import { z } from "zod";
import { db } from "@/db";
import { products, promotions } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { sendImage } from "@/lib/ycloud";
import { PRODUCT_IMAGE_BY_NAME } from "@/lib/constants";

// getProductDetails - Ver detalles de un producto
export const getProductDetailsTool = tool({
  description: "Obtiene los detalles completos de un producto específico: nombre, descripción, precio, línea, categoría",
  inputSchema: z.object({
    name: z.string().describe("Nombre del producto a buscar"),
  }),
  execute: async ({ name }) => {
    const items = await db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        category: products.category,
        line: products.line,
        available: products.available,
        imageUrl: products.imageUrl,
      })
      .from(products)
      .orderBy(products.sortOrder);

    const normalizedName = name.toLowerCase();
    const found = items.find(
      (p) => p.name?.toLowerCase().includes(normalizedName)
    );

    if (!found) {
      return "No encontré ese producto. ¿Querés que te muestre el menú completo?";
    }

    if (!found.available) {
      return `${found.name} no está disponible actualmente. ¿Querés ver qué otras opciones tenemos?`;
    }

    const categoryLabel: Record<string, string> = {
      hamburguesa: "Hamburguesa",
      acompañamiento: "Acompañamiento",
      pan_mayorista: "Pan al Por Mayor",
    };

    const lineLabel: Record<string, string> = {
      pollo: "Pollo",
      carne: "Carne",
      clasica: "Clásica",
      pan: "Pan",
    };

    return `🍔 ${found.name}
${found.description || "Sin descripción"}
💰 $${found.price}
📦 Categoría: ${categoryLabel[found.category ?? ""] ?? found.category}
🐔 Línea: ${lineLabel[found.line ?? ""] ?? found.line}`;
  },
});

// getProductPrice - Ver precio de un producto
export const getProductPriceTool = tool({
  description: "Obtiene el precio de un producto específico",
  inputSchema: z.object({
    name: z.string().describe("Nombre del producto"),
  }),
  execute: async ({ name }) => {
    const items = await db
      .select({ name: products.name, price: products.price, available: products.available })
      .from(products)
      .where(eq(products.available, true));

    const normalizedName = name.toLowerCase();
    const found = items.find((p) => p.name?.toLowerCase().includes(normalizedName));

    if (!found) {
      return "No encontré ese producto en el menú.";
    }

    return `💰 ${found.name}: $${found.price}`;
  },
});

// createSendProductImageTool - Enviar foto de un producto por WhatsApp
export function createSendProductImageTool(customerPhone: string) {
  return tool({
    description: "Envía la foto de un producto al cliente por WhatsApp. Podés buscar por ID o por nombre.",
    inputSchema: z.object({
      productId: z.number().optional().describe("ID del producto (alternativa al nombre)"),
      productName: z.string().optional().describe("Nombre del producto para buscar (alternativa al ID). Ej: 'genesis', 'bookbinder', 'deli deli'"),
    }),
    execute: async ({ productId, productName }) => {
      let product;
      
      if (productId) {
        [product] = await db
          .select({
            id: products.id,
            name: products.name,
            price: products.price,
            imageUrl: products.imageUrl,
          })
          .from(products)
          .where(eq(products.id, productId))
          .limit(1);
      } else if (productName) {
        const all = await db
          .select({
            id: products.id,
            name: products.name,
            price: products.price,
            imageUrl: products.imageUrl,
          })
          .from(products)
          .orderBy(products.sortOrder);
        
        const q = productName.toLowerCase();
        product = all.find(p => p.name?.toLowerCase().includes(q));
      }

      if (!product) {
        return "No encontré ese producto.";
      }

      // Fallback: imageUrl de DB → static assets por nombre
      const baseUrl =
        process.env.RENDER_EXTERNAL_URL?.replace(/\/$/, "") ||
        "https://muzapp.onrender.com";

      let fullImageUrl: string;
      if (product.imageUrl) {
        fullImageUrl = product.imageUrl.startsWith("/")
          ? `${baseUrl}${product.imageUrl}`
          : product.imageUrl;
      } else {
        // Buscar en assets estáticos por nombre
        const staticPath = PRODUCT_IMAGE_BY_NAME[product.name.toLowerCase()];
        if (!staticPath) {
          // También buscar en bread images
          return "Este producto no tiene foto.";
        }
        fullImageUrl = `${baseUrl}${staticPath}`;
      }

      const caption = `${product.name} - $${product.price}`;
      const result = await sendImage(customerPhone, fullImageUrl, caption);

      if (!result.ok) {
        console.error("[sendProductImage] YCloud error:", result.error);
        return "No pude enviar la foto en este momento. Intentá de nuevo o pedime que te describa el producto.";
      }

      return `Te envié la foto de ${product.name} 📸`;
    },
  });
}

// searchProducts - Buscar productos
export const searchProductsTool = tool({
  description: "Busca productos por nombre o descripción",
  inputSchema: z.object({
    query: z.string().describe("Término de búsqueda"),
  }),
  execute: async ({ query }) => {
    const items = await db
      .select({
        name: products.name,
        description: products.description,
        price: products.price,
        available: products.available,
      })
      .from(products)
      .where(eq(products.available, true));

    const normalizedQuery = query.toLowerCase();
    const filtered = items.filter(
      (p) =>
        p.name?.toLowerCase().includes(normalizedQuery) ||
        p.description?.toLowerCase().includes(normalizedQuery)
    );

    if (filtered.length === 0) {
      return `No encontré productos que coincidan con "${query}". ¿Querés ver el menú completo?`;
    }

    return filtered
      .map((p) => `• ${p.name} - $${p.price}${p.description ? ` — ${p.description}` : ""}`)
      .join("\n");
  },
});

// getActivePromos - Consultar promociones activas
export const getActivePromosTool = tool({
  description: "Obtiene la lista de promociones activas. Usar cuando el cliente pregunta por promos, descuentos, combos u ofertas.",
  inputSchema: z.object({}),
  execute: async () => {
    const activePromos = await db
      .select({ id: promotions.id, name: promotions.name, description: promotions.description, customPrice: promotions.customPrice, imageUrl: promotions.imageUrl })
      .from(promotions)
      .where(eq(promotions.active, true))
      .orderBy(desc(promotions.createdAt));

    if (activePromos.length === 0) {
      return "No hay promociones activas en este momento.";
    }

    return activePromos.map((p) => {
      const price = p.customPrice ? ` — $${Number(p.customPrice).toLocaleString("es-AR")}` : "";
      const hasImg = p.imageUrl ? " 📸" : "";
      return `• ${p.name}${price}${hasImg}${p.description ? `: ${p.description}` : ""}`;
    }).join("\n");
  },
});
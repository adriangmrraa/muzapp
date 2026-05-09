import { tool } from "ai";
import { z } from "zod";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendImage } from "@/lib/ycloud";

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

      if (!product.imageUrl) {
        return "Este producto no tiene foto.";
      }

      const baseUrl =
        process.env.RENDER_EXTERNAL_URL?.replace(/\/$/, "") ||
        "https://muzapp.onrender.com";
      const fullImageUrl = product.imageUrl.startsWith("/")
        ? `${baseUrl}${product.imageUrl}`
        : product.imageUrl;

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
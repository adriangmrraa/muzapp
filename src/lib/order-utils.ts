import { db } from "@/db";
import { products, promotions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { normalizePhone, isValidPhone as normalizedIsValid } from "@/lib/phone-utils";

type InputItem = { name: string; quantity: number; price?: number; unitPrice?: number };
type ResolvedItem = { name: string; quantity: number; price: number; unitPrice: number };

/** Reject invalid or unpriced items before writing an order or modifying its cart. */
export function validateResolvedOrderItems(items: ResolvedItem[]): string | null {
  if (!items.length) return "El pedido necesita al menos un producto.";
  const invalidQuantity = items.find((item) => !Number.isSafeInteger(item.quantity) || item.quantity <= 0);
  if (invalidQuantity) return `Cantidad inválida para ${invalidQuantity.name}.`;
  const unpriced = items.find((item) => !Number.isFinite(item.unitPrice) || item.unitPrice <= 0);
  if (unpriced) return `No encontré un precio válido para ${unpriced.name}. Verificá el producto en la base de datos antes de crear el pedido.`;
  return null;
}

export function matchCatalog<T extends { name: string }>(input: string, catalog: T[]): T | undefined {
  if (!input) return undefined;
  const canonical = (name: string) => name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const exact = catalog.find((entry) => canonical(entry.name) === input);
  if (exact) return exact;
  if (input.length < 3) return undefined;
  const candidates = catalog.filter((entry) => canonical(entry.name).includes(input) || input.includes(canonical(entry.name)));
  return candidates.length === 1 ? candidates[0] : undefined;
}

// FIX CRITICAL: resolveItems() IGNORA item.price e item.unitPrice del LLM.
// Solo usa precios reales de la DB. Si no hay match en DB, unitPrice = 0.
// Ver: docs/aprendizaje-chats-dueno.md + sdd/rediseno-bot-ventas/

// ─── Validar teléfono Argentino ────────────────────────────────────────
/**
 * @deprecated Usar `normalizePhone()` de `@/lib/phone-utils` en nuevos desarrollos.
 * Esta función se mantiene por retrocompatibilidad.
 */
export function cleanPhone(phone: string): string {
  return normalizePhone(phone);
}

/**
 * @deprecated Usar `isValidPhone()` de `@/lib/phone-utils` en nuevos desarrollos.
 */
export function isValidPhone(phone: string): boolean {
  return normalizedIsValid(phone);
}

/**
 * Resuelve items contra productos reales de la DB.
 * Busca primero en PRODUCTOS, y si no encuentra, busca en PROMOCIONES.
 * Devuelve el nombre + precio REAL de la DB.
 * Si no encuentra match en ninguna tabla, devuelve unitPrice = 0.
 */
export async function resolveItems(items: InputItem[]): Promise<ResolvedItem[]> {
  try {
    const dbProducts = await db
      .select({ name: products.name, price: products.price })
      .from(products)
      .where(and(eq(products.available, true), eq(products.comingSoon, false)));

    const dbPromotions = await db
      .select({ name: promotions.name, customPrice: promotions.customPrice })
      .from(promotions)
      .where(eq(promotions.active, true));

    return items.map((item) => {
      const input = item.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
      
      // 1. Buscar en productos
      const productMatch = matchCatalog(input, dbProducts);

      if (productMatch) {
        const realPrice = Number(productMatch.price);
        return {
          name: productMatch.name,
          quantity: item.quantity,
          price: realPrice,       // ✅ SIEMPRE precio real de DB
          unitPrice: realPrice,   // ✅ IGNORA item.unitPrice del LLM
        };
      }

      // 2. Si no hay match en productos, buscar en promociones
      const promoMatch = matchCatalog(input, dbPromotions);

      if (promoMatch) {
        const promoPrice = Number(promoMatch.customPrice);
        return {
          name: promoMatch.name,
          quantity: item.quantity,
          price: promoPrice,      // Precio real de la promo
          unitPrice: promoPrice,  // Se multiplica por quantity para el total
        };
      }

      // 3. Sin match en ninguna tabla
      return {
        name: item.name,
        quantity: item.quantity,
        price: 0,                 // Sin match → 0 (admin lo corrige)
        unitPrice: 0,
      };
    });
  } catch {
    return items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price: 0,                   // DB caída → 0 (admin lo corrige)
      unitPrice: 0,
    }));
  }
}

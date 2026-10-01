import { createHash } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { db } from "@/db";
import { agentConfig, orders, products, promotions } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { type CheckoutInput, type CheckoutReceipt, type PricedItem, priceCheckout, WEB_ORDER_TAG, webOrderKey } from "./contract";

export class CheckoutError extends Error { constructor(message: string, public status = 409) { super(message); } }
export async function submitCheckout(input: CheckoutInput): Promise<CheckoutReceipt> {
  const key = webOrderKey(input.requestId);
  const fingerprint = `web-payload:${createHash("sha256").update(JSON.stringify({ ...input, items: [...input.items].sort((a, b) => `${a.type}:${a.id}`.localeCompare(`${b.type}:${b.id}`)) })).digest("hex")}`;
  const [cfg] = await db.select({ phone: agentConfig.phoneNumber, noBurgers: agentConfig.hamburguesasSinStock }).from(agentConfig).where(eq(agentConfig.id, 1)).limit(1);
  const destination = (cfg?.phone || process.env.WHATSAPP_PHONE_NUMBER || "").replace(/\D/g, "");
  if (!/^\d{10,15}$/.test(destination)) throw new CheckoutError("No podemos abrir WhatsApp en este momento. Intentá nuevamente más tarde.", 503);
  const matches = sql`${orders.tags} @> ${JSON.stringify([key])}::jsonb`;
  let [order] = await db.select().from(orders).where(matches).limit(1);
  if (!order) {
    const [catalog, offers] = await Promise.all([db.select().from(products), db.select().from(promotions)]);
    let priced: ReturnType<typeof priceCheckout>;
    try { priced = priceCheckout(input.items, catalog, offers, cfg?.noBurgers ?? false); }
    catch (error) { throw new CheckoutError(error instanceof Error ? error.message : "Revisá los productos."); }
    const tags = JSON.stringify([WEB_ORDER_TAG, key, fingerprint]);
    // Separate statements in READ COMMITTED: a concurrent retry sees the committed
    // insert after acquiring the same transaction lock. A single CTE cannot do this.
    const query = neon(process.env.DATABASE_URL!);
    await query.transaction([
      query`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))`,
      query`INSERT INTO orders (phone_number, customer_name, order_type, items, tags, notes, status, payment_status)
        SELECT ${input.phone}, ${input.customerName}, ${priced.orderType}::order_type,
          ${JSON.stringify(priced.items)}::jsonb, ${tags}::jsonb,
          'Pedido web. Coordinar entrega y pago por WhatsApp.', 'pending', 'pending'
        WHERE NOT EXISTS (SELECT 1 FROM orders WHERE tags @> ${JSON.stringify([key])}::jsonb)`,
    ], { isolationLevel: "ReadCommitted" });
    [order] = await db.select().from(orders).where(matches).limit(1);
  }
  if (!order || !order.tags?.includes(fingerprint) || order.phoneNumber !== input.phone) throw new CheckoutError("Esta confirmación ya fue usada para otro pedido. Volvé a revisar tu carrito.");
  const items = order.items as PricedItem[];
  const total = items.reduce((sum, item) => sum + Math.round(item.unitPrice * 100) * item.quantity, 0) / 100;
  const message = [
    `Hola! Soy ${order.customerName}. Confirmé el pedido #${order.id} en la carta digital.`, "",
    ...items.map(item => `• ${item.quantity}× ${item.name} — $${(item.unitPrice * item.quantity).toLocaleString("es-AR")}`), "",
    `Subtotal: $${total.toLocaleString("es-AR")}. Envío a coordinar.`,
    "Quiero coordinar entrega o retiro y pago.", `Referencia WEB:${input.requestId}`,
  ].join("\n");
  return { orderId: order.id, total, whatsappUrl: `https://wa.me/${destination}?text=${encodeURIComponent(message)}` };
}

export async function findReferencedWebOrder(reference: string, phone: string) {
  const [order] = await db.select({ id: orders.id, status: orders.status }).from(orders)
    .where(and(eq(orders.phoneNumber, phone), sql`${orders.tags} @> ${JSON.stringify([webOrderKey(reference)])}::jsonb`)).limit(1);
  if (order) await db.update(orders).set({
    tags: sql`COALESCE(${orders.tags}, '[]'::jsonb) || '["WhatsApp verificado"]'::jsonb`, updatedAt: new Date(),
  }).where(and(eq(orders.id, order.id), sql`NOT (COALESCE(${orders.tags}, '[]'::jsonb) @> '["WhatsApp verificado"]'::jsonb)`));
  return order;
}

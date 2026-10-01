import { createHash } from "node:crypto";
import { db } from "@/db";
import { agentConfig, orders, products, promotions } from "@/db/schema";
import { and, eq, like } from "drizzle-orm";
import { type CheckoutInput, type CheckoutReceipt, type PricedItem, priceCheckout, WEB_ORDER_TAG, webOrderKey } from "./contract";

export class CheckoutError extends Error { constructor(message: string, public status = 409) { super(message); } }

function webReference(requestId: string) {
  return `Referencia WEB:${requestId}`;
}

export async function submitCheckout(input: CheckoutInput): Promise<CheckoutReceipt> {
  const key = webOrderKey(input.requestId);
  const fingerprint = `web-payload:${createHash("sha256").update(JSON.stringify({ ...input, items: [...input.items].sort((a, b) => `${a.type}:${a.id}`.localeCompare(`${b.type}:${b.id}`)) })).digest("hex")}`;
  const [cfg] = await db.select({ phone: agentConfig.phoneNumber }).from(agentConfig).where(eq(agentConfig.id, 1)).limit(1);
  // Stock controls were added after the original database schema. Their absence
  // must never prevent a customer from registering a valid order.
  let noBurgers = false;
  try {
    const [stockConfig] = await db.select({ noBurgers: agentConfig.hamburguesasSinStock }).from(agentConfig).where(eq(agentConfig.id, 1)).limit(1);
    noBurgers = stockConfig?.noBurgers ?? false;
  } catch { /* older deployments do not yet have this optional column */ }
  const destination = (cfg?.phone || process.env.WHATSAPP_PHONE_NUMBER || "").replace(/\D/g, "");
  if (!/^\d{10,15}$/.test(destination)) throw new CheckoutError("No podemos abrir WhatsApp en este momento. Intentá nuevamente más tarde.", 503);
  // `notes` exists in every production version of orders. The old deployment did
  // not reliably have the later `tags` column, which made a valid checkout fail
  // before it could be stored. Keep the durable correlation reference here.
  const reference = webReference(input.requestId);
  const matchReference = and(eq(orders.phoneNumber, input.phone), like(orders.notes, `%${reference}%`));
  let [order] = await db.select({
    id: orders.id,
    phoneNumber: orders.phoneNumber,
    customerName: orders.customerName,
    items: orders.items,
    notes: orders.notes,
  }).from(orders).where(matchReference).limit(1);
  if (!order) {
    const [catalog, offers] = await Promise.all([db.select().from(products), db.select().from(promotions)]);
    let priced: ReturnType<typeof priceCheckout>;
    try { priced = priceCheckout(input.items, catalog, offers, noBurgers); }
    catch (error) { throw new CheckoutError(error instanceof Error ? error.message : "Revisá los productos."); }
    const notes = `Pedido web (${WEB_ORDER_TAG}; ${key}; ${fingerprint}). ${reference}. Coordinar entrega y pago por WhatsApp.`;
    [order] = await db.insert(orders).values({
      phoneNumber: input.phone,
      customerName: input.customerName,
      orderType: priced.orderType,
      items: priced.items,
      notes,
      status: "pending",
    }).returning({
      id: orders.id,
      phoneNumber: orders.phoneNumber,
      customerName: orders.customerName,
      items: orders.items,
      notes: orders.notes,
    });
  }
  if (!order || !order.notes?.includes(fingerprint) || order.phoneNumber !== input.phone) throw new CheckoutError("Esta confirmación ya fue usada para otro pedido. Volvé a revisar tu carrito.");
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
    .where(and(eq(orders.phoneNumber, phone), like(orders.notes, `%${webReference(reference)}%`))).limit(1);
  return order;
}

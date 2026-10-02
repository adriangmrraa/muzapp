import { appendRefToMessage } from "./attribution";

/**
 * Builds a wa.me deep link. The destination number comes from the business
 * config (agent_config.phoneNumber, exposed via GET /api/business) — never
 * hardcode a number here.
 */
export function buildWhatsAppURL(message: string, refCode: string | undefined, phone: string): string {
  const finalMessage = refCode ? appendRefToMessage(message, refCode) : message;
  const encoded = encodeURIComponent(finalMessage);
  return `https://wa.me/${phone}?text=${encoded}`;
}

/**
 * Builds a WhatsApp order message for a single product with quantity.
 * Ej: "Hola! Quiero pedir:
 * • Genesis x2 - $7,600
 * Total: $7,600
 * Pedido desde la web"
 */
export function buildProductWhatsAppURL(
  productName: string,
  productPrice: number,
  quantity: number,
  phone: string,
): string {
  const subtotal = productPrice * quantity;
  const message = [
    "Hola! Quiero pedir:",
    `• ${productName} x${quantity} — $${subtotal.toLocaleString("es-AR")}`,
    `Total: $${subtotal.toLocaleString("es-AR")}`,
    "",
    "Pedido desde la web",
  ].join("\n");
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

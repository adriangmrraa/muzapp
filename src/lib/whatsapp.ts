import { WHATSAPP_NUMBER } from "./constants";
import { appendRefToMessage } from "./attribution";

export function buildWhatsAppURL(message: string, refCode?: string): string {
  const finalMessage = refCode ? appendRefToMessage(message, refCode) : message;
  const encoded = encodeURIComponent(finalMessage);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
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
): string {
  const subtotal = productPrice * quantity;
  const message = [
    "Hola! Quiero pedir:",
    `• ${productName} x${quantity} — $${subtotal.toLocaleString("es-AR")}`,
    `Total: $${subtotal.toLocaleString("es-AR")}`,
    "",
    "Pedido desde la web",
  ].join("\n");
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

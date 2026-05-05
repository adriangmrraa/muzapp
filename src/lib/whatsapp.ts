import { WHATSAPP_NUMBER } from "./constants";

export function buildWhatsAppURL(message: string): string {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
}

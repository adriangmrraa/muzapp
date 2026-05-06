import { WHATSAPP_NUMBER } from "./constants";
import { appendRefToMessage } from "./attribution";

export function buildWhatsAppURL(message: string, refCode?: string): string {
  const finalMessage = refCode ? appendRefToMessage(message, refCode) : message;
  const encoded = encodeURIComponent(finalMessage);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
}

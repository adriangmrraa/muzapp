import { phoneInList, phoneMatches } from "@/lib/phone-utils";

export type WhatsAppActor = "customer" | "seller" | "delivery";

/** Resolve business identities before the customer lead path. */
export function resolveWhatsAppActor(phone: string, identities: {
  deliveryPhoneNumber?: string | null;
  sellerPhoneIds?: readonly { phone: string }[] | null;
}): WhatsAppActor {
  if (identities.deliveryPhoneNumber && phoneMatches(phone, identities.deliveryPhoneNumber)) return "delivery";
  if (phoneInList(phone, identities.sellerPhoneIds ?? [])) return "seller";
  return "customer";
}

export function shouldCaptureLead(actor: WhatsAppActor): boolean {
  return actor === "customer";
}

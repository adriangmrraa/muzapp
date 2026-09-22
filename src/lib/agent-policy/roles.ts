import type { Actor } from "@/lib/jev/types";
import { phoneInList } from "@/lib/phone-utils";
export function whatsappActor(phone: string, sellers: readonly { phone: string }[]): Actor {
  return phoneInList(phone, sellers) ? "seller" : "customer";
}

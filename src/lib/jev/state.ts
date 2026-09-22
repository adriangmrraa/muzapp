import { db } from "@/db";
import { orderContextItems, orders } from "@/db/schema";
import { and, desc, eq, inArray } from "drizzle-orm";
import { decisionContext } from "./context";
import type { Actor, DecisionContext } from "./types";
/** DB state is optional for observation; a read error cannot prevent the existing agent. */
export async function whatsappDecisionContext(
  actor: Actor, conversationId: number, phone: string, message: string,
  media?: DecisionContext["media"],
): Promise<DecisionContext> {
  let hasCartItems = false;
  let hasActiveOrder = false;
  let deliveryAgreed = false;
  let repliedToStatusNotification = false;
  try {
    const [cart, recent] = await Promise.all([
      db.select({ id: orderContextItems.id }).from(orderContextItems)
        .where(and(eq(orderContextItems.conversationId, conversationId), eq(orderContextItems.status, "active"))) .limit(1),
      db.select({ status: orders.status, address: orders.address }).from(orders)
        .where(and(eq(orders.phoneNumber, phone), inArray(orders.status, ["pending", "preparing", "ready"])))
        .orderBy(desc(orders.createdAt)).limit(1),
    ]);
    hasCartItems = cart.length > 0;
    hasActiveOrder = recent.length > 0;
    deliveryAgreed = !!recent[0]?.address;
    repliedToStatusNotification = hasActiveOrder && /^(sí|si|dale|ok|ya voy)/i.test(message);
  } catch { /* observation only */ }
  return decisionContext({ actor, channel: "whatsapp", message,
    conversation: { hasCartItems, hasActiveOrder, deliveryAgreed, repliedToStatusNotification }, media });
}

/** Skip state reads entirely when shadow is off; keep failures out of agent flow. */
export async function observeWhatsAppShadow(actor: Actor, conversationId: number, phone: string, message: string, media?: DecisionContext["media"]): Promise<void> {
  const { jevConfig } = await import("./config");
  if (!jevConfig(actor).enabled) return;
  try {
    const { observeJevShadow } = await import("./shadow");
    await observeJevShadow(await whatsappDecisionContext(actor, conversationId, phone, message, media));
  } catch { /* observation is strictly fail-open */ }
}

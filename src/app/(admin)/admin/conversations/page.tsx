import { getConversations } from "./actions";
import { ConversationsInbox } from "./conversations-inbox";
import { db } from "@/db";
import { agentConfig } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { ConversationSummary } from "@/types/chat";

export const metadata = { title: "Mensajes — Mrs Muzzarella Admin" };

export default async function ConversationsPage() {
  const result = await getConversations({ page: 1 });

  // Cargar lista de teléfonos de vendedores para diferenciar en UI
  const [config] = await db
    .select({ sellerPhoneIds: agentConfig.sellerPhoneIds })
    .from(agentConfig)
    .where(eq(agentConfig.id, 1))
    .limit(1);
  const sellerPhones: string[] = ((config?.sellerPhoneIds ?? []) as { name: string; phone: string }[]).map(s => s.phone);

  const initialConversations: ConversationSummary[] = result.conversations.map(
    (r) => ({
      id: r.id,
      channel: r.channel ?? "whatsapp",
      customerName: r.customerName ?? null,
      customerPhone: r.customerPhone ?? "",
      lastMessagePreview: r.lastMessagePreview ?? null,
      lastMessageAt:
        r.lastMessageAt instanceof Date
          ? r.lastMessageAt.toISOString()
          : (r.lastMessageAt ?? null),
      status: r.status ?? "active",
      humanOverrideUntil:
        r.humanOverrideUntil instanceof Date
          ? r.humanOverrideUntil.toISOString()
          : (r.humanOverrideUntil ?? null),
    })
  );

  return <ConversationsInbox initialConversations={initialConversations} sellerPhones={sellerPhones} />;
}

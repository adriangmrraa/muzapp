import { getConversations } from "./actions";
import { ConversationsInbox } from "./conversations-inbox";
import type { ConversationSummary } from "@/types/chat";

export const metadata = { title: "Mensajes — Mrs Muzzarella Admin" };

export default async function ConversationsPage() {
  const result = await getConversations({ page: 1 });

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
    })
  );

  return (
    <div className="p-4 md:p-6">
      <h1 className="mb-4 text-2xl font-bold text-white">Mensajes</h1>
      <ConversationsInbox initialConversations={initialConversations} />
    </div>
  );
}

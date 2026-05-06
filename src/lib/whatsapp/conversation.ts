import { db } from "@/db";
import { conversations } from "@/db/schema";
import { eq } from "drizzle-orm";

interface ChatMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

/**
 * Find conversation by WhatsApp ID or create a new one
 */
export async function findOrCreateConversation(
  whatsappId: string,
  customerPhone: string,
  customerName?: string
) {
  const existing = await db
    .select()
    .from(conversations)
    .where(eq(conversations.whatsappId, whatsappId))
    .limit(1);

  if (existing.length > 0) return existing[0];

  const [created] = await db
    .insert(conversations)
    .values({
      whatsappId,
      customerPhone,
      customerName: customerName || null,
      messages: [],
      status: "active",
    })
    .returning();

  return created;
}

/**
 * Append a message to the conversation JSONB array
 */
export async function appendMessage(conversationId: number, message: ChatMessage) {
  const [conv] = await db
    .select({ messages: conversations.messages })
    .from(conversations)
    .where(eq(conversations.id, conversationId));

  const currentMessages = (conv?.messages || []) as unknown as ChatMessage[];
  const updatedMessages = [...currentMessages, message] as unknown as Record<string, unknown>[];

  await db
    .update(conversations)
    .set({
      messages: updatedMessages,
      updatedAt: new Date(),
    })
    .where(eq(conversations.id, conversationId));
}

/**
 * Check if a message was already processed (deduplication)
 */
export function isMessageProcessed(messages: unknown[], messageId: string): boolean {
  return (messages as ChatMessage[]).some(m => m.id === messageId);
}

/**
 * Convert stored messages to Vercel AI SDK CoreMessage format (last 20)
 */
export function convertToAIMessages(messages: unknown[]): Array<{ role: "user" | "assistant"; content: string }> {
  const typed = messages as ChatMessage[];
  const windowed = typed.slice(-20);

  return windowed.map(m => ({
    role: m.role,
    content: m.content,
  }));
}

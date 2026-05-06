"use server";

import { db } from "@/db";
import { conversations, chatMessages } from "@/db/schema";
import { eq, desc, and, ilike, or, sql, count } from "drizzle-orm";

const PAGE_SIZE = 50;

// ─── Types ────────────────────────────────────────────────────────────────────

export type GetConversationsParams = {
  page?: number;
  channel?: string;
  status?: string;
  search?: string;
};

export type GetConversationsResult = {
  conversations: (typeof conversations.$inferSelect)[];
  total: number;
  page: number;
  pageSize: number;
};

// ─── Actions ──────────────────────────────────────────────────────────────────

/**
 * Obtiene conversaciones paginadas con filtros opcionales por canal, estado y búsqueda.
 */
export async function getConversations(
  params: GetConversationsParams
): Promise<GetConversationsResult> {
  const { page = 1, channel, status, search } = params;
  const offset = (page - 1) * PAGE_SIZE;

  const conditions = [];

  if (channel === "telegram") {
    conditions.push(eq(conversations.channel, "telegram"));
  } else if (channel && channel !== "all") {
    conditions.push(eq(conversations.channel, channel as "whatsapp" | "telegram"));
  } else {
    // By default, exclude Telegram (internal admin channel)
    conditions.push(eq(conversations.channel, "whatsapp"));
  }
  if (status && status !== "all") {
    conditions.push(
      eq(conversations.status, status as "active" | "closed" | "archived")
    );
  }
  if (search) {
    conditions.push(
      or(
        ilike(conversations.customerName, `%${search}%`),
        ilike(conversations.customerPhone, `%${search}%`)
      )
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  // COALESCE en SQL: ordena por lastMessageAt si existe, sino por updatedAt
  const orderExpr = sql`COALESCE(${conversations.lastMessageAt}, ${conversations.updatedAt}) DESC`;

  const [rows, totalResult] = await Promise.all([
    db
      .select()
      .from(conversations)
      .where(where)
      .orderBy(orderExpr)
      .limit(PAGE_SIZE)
      .offset(offset),
    db.select({ count: count() }).from(conversations).where(where),
  ]);

  return {
    conversations: rows,
    total: totalResult[0]?.count ?? 0,
    page,
    pageSize: PAGE_SIZE,
  };
}

/**
 * Obtiene los mensajes de una conversación, ordenados cronológicamente.
 */
export async function getMessages(
  conversationId: number,
  limit = 100,
  offset = 0
) {
  return db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.conversationId, conversationId))
    .orderBy(chatMessages.createdAt)
    .limit(limit)
    .offset(offset);
}

/**
 * Envía una respuesta desde el admin delegando al router de canales.
 * Usa dynamic import para no romper si el router aún no existe.
 */
export async function sendReply(
  conversationId: number,
  content: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { sendOutboundMessage } = await import("@/lib/channels/router");
    await sendOutboundMessage(conversationId, content, "human");
    return { success: true };
  } catch (error) {
    console.error("[sendReply] Error:", error);
    return { success: false, error: "Error al enviar mensaje" };
  }
}

/**
 * Actualiza el estado de una conversación (active / closed / archived).
 */
export async function updateConversationStatus(
  conversationId: number,
  status: "active" | "closed" | "archived"
): Promise<{ success: boolean }> {
  try {
    await db
      .update(conversations)
      .set({ status, updatedAt: new Date() })
      .where(eq(conversations.id, conversationId));
    return { success: true };
  } catch (error) {
    console.error("[updateConversationStatus] Error:", error);
    return { success: false };
  }
}

/**
 * Activa o desactiva el override humano con una ventana de 24 horas.
 * Cuando se desactiva, limpia la fecha.
 */
export async function toggleHumanOverride(
  conversationId: number,
  enabled: boolean
): Promise<{ success: boolean }> {
  try {
    const until = enabled
      ? new Date(Date.now() + 24 * 60 * 60 * 1000) // +24h desde ahora
      : null;

    await db
      .update(conversations)
      .set({ humanOverrideUntil: until, updatedAt: new Date() })
      .where(eq(conversations.id, conversationId));
    return { success: true };
  } catch (error) {
    console.error("[toggleHumanOverride] Error:", error);
    return { success: false };
  }
}

/**
 * Obtiene los detalles completos de una conversación por ID.
 * Retorna null si no existe.
 */
export async function getConversation(
  conversationId: number
): Promise<(typeof conversations.$inferSelect) | null> {
  const [conv] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);
  return conv ?? null;
}

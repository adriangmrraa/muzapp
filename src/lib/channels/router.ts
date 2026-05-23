import { db } from "@/db";
import { conversations, chatMessages, leads, attachments } from "@/db/schema";
import { eq, and, lt } from "drizzle-orm";

export type Channel = "whatsapp" | "telegram";

export interface MediaAttachment {
  type: "image" | "audio" | "document" | "video";
  url: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  caption?: string;
  transcription?: string;
  description?: string;
}

export interface IncomingMessage {
  channel: Channel;
  externalUserId: string; // phone for WA, chatId string for TG
  senderName: string;
  content: string;
  messageId: string; // for deduplication
  contentAttributes?: MediaAttachment[];
}

// Find or create conversation, returns { id, isNew }
export async function findOrCreateConversation(
  channel: Channel,
  externalUserId: string,
  customerName?: string,
  customerPhone?: string
): Promise<{ id: number; isNew: boolean }> {
  // Try to find existing by channel + externalUserId
  const existing = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(
      and(
        eq(conversations.channel, channel),
        eq(conversations.externalUserId, externalUserId)
      )
    )
    .limit(1);

  if (existing[0]) {
    return { id: existing[0].id, isNew: false };
  }

  // For WhatsApp, also check by whatsappId (backward compat)
  if (channel === "whatsapp") {
    const byWaId = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(eq(conversations.whatsappId, externalUserId))
      .limit(1);

    if (byWaId[0]) {
      // Update with new fields
      await db
        .update(conversations)
        .set({
          channel: "whatsapp",
          externalUserId,
        })
        .where(eq(conversations.id, byWaId[0].id));
      return { id: byWaId[0].id, isNew: false };
    }
  }

  // Create new
  const [conv] = await db
    .insert(conversations)
    .values({
      whatsappId:
        channel === "whatsapp" ? externalUserId : `tg_${externalUserId}`,
      customerName: customerName || null,
      customerPhone: customerPhone || externalUserId,
      channel,
      externalUserId,
      status: "active",
      lastMessageAt: new Date(),
      lastMessagePreview: null,
    })
    .returning({ id: conversations.id });

  return { id: conv.id, isNew: true };
}

// Insert a message into chat_messages table
export async function insertMessage(
  conversationId: number,
  role: "user" | "assistant" | "system" | "human",
  content: string,
  contentAttributes?: MediaAttachment[],
  platformMessageId?: string
): Promise<number> {
  const preview = content.slice(0, 250);

  const [msg] = await db
    .insert(chatMessages)
    .values({
      conversationId,
      role,
      content,
      contentAttributes: contentAttributes || [],
      platformMessageId: platformMessageId || null,
    })
    .returning({ id: chatMessages.id });

  // Update conversation last message
  await db
    .update(conversations)
    .set({
      lastMessageAt: new Date(),
      lastMessagePreview: preview,
      updatedAt: new Date(),
    })
    .where(eq(conversations.id, conversationId));

  // Auto-attach media to lead
  if (contentAttributes && contentAttributes.length > 0 && role === "user") {
    autoAttachToLead(conversationId, msg.id, contentAttributes).catch((err) =>
      console.error("[router] autoAttach failed:", err)
    );
  }

  return msg.id;
}

async function autoAttachToLead(
  conversationId: number,
  messageId: number,
  contentAttributes: MediaAttachment[]
): Promise<void> {
  if (!contentAttributes || contentAttributes.length === 0) return;

  try {
    // Find lead by conversation
    const [conv] = await db
      .select({ customerPhone: conversations.customerPhone })
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);

    if (!conv?.customerPhone) return;

    // Find lead by phone
    const leadRows = await db
      .select({ id: leads.id })
      .from(leads)
      .where(eq(leads.phone, conv.customerPhone))
      .limit(1);

    const leadId = leadRows[0]?.id || null;

    // Create attachment for each media item
    for (const media of contentAttributes) {
      await db.insert(attachments).values({
        leadId,
        conversationId,
        messageId,
        type: media.type,
        url: media.url,
        fileName: media.fileName || null,
        mimeType: media.mimeType || null,
        fileSize: media.fileSize || null,
        caption: media.caption || null,
      });
    }
  } catch (error) {
    console.error("[router] autoAttachToLead error:", error);
    // Non-fatal — don't break message flow
  }
}

// Check if message was already processed (deduplication)
export async function isMessageDuplicate(
  platformMessageId: string
): Promise<boolean> {
  if (!platformMessageId) return false;

  const existing = await db
    .select({ id: chatMessages.id })
    .from(chatMessages)
    .where(eq(chatMessages.platformMessageId, platformMessageId))
    .limit(1);

  return existing.length > 0;
}

// Get messages for a conversation
export async function getConversationMessages(
  conversationId: number,
  limit = 50,
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

// Send outbound message via the correct channel
export async function sendOutboundMessage(
  conversationId: number,
  content: string,
  role: "assistant" | "human" = "human"
): Promise<void> {
  // Get conversation to know channel
  const [conv] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);

  if (!conv) throw new Error(`Conversation ${conversationId} not found`);

  const channel = conv.channel || "whatsapp";

  if (channel === "whatsapp") {
    // Dynamic import to avoid circular deps
    const { sendWhatsAppMessage } = await import(
      "@/lib/whatsapp/ycloud-client"
    );
    const { agentConfig } = await import("@/db/schema");
    const config = await db.select().from(agentConfig).limit(1);
    const cfg = config[0];
    const apiKey = process.env.YCLOUD_API_KEY || cfg?.ycloudApiKey || "";
    const from = process.env.WHATSAPP_PHONE_NUMBER || cfg?.phoneNumber || "";
    if (apiKey && from) {
      await sendWhatsAppMessage({
        to: conv.customerPhone ?? conv.externalUserId ?? "",
        body: content,
        apiKey,
        from,
      });
    }
  } else if (channel === "telegram") {
    const { sendTelegramMessage, getTelegramConfigFromDB } = await import(
      "@/lib/telegram/bot"
    );
    const tgConfig = await getTelegramConfigFromDB();
    if (tgConfig?.botToken && conv.externalUserId) {
      await sendTelegramMessage(
        tgConfig.botToken,
        Number(conv.externalUserId),
        content
      );
    }
  }

  // Save the outbound message — store "human" as "assistant" for AI compatibility
  const dbRole = role === "human" ? "assistant" : role;
  await insertMessage(conversationId, dbRole, content);

  // If a human sent this from the admin panel, set humanOverrideUntil
  // para que la IA no responda automáticamente después (ClinicForge pattern)
  if (role === "human") {
    const overrideUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await db
      .update(conversations)
      .set({ humanOverrideUntil: overrideUntil, updatedAt: new Date() })
      .where(eq(conversations.id, conversationId));

    console.log(`[router] Human override set for conv ${conversationId} until ${overrideUntil.toISOString()}`);
  }
}

// ─── Delivery helpers ─────────────────────────────────────────────────────────

/**
 * Notifica al cliente que el delivery ya llegó.
 * Busca el último pedido pendiente/preparando y le manda WhatsApp.
 */
export async function notifyCustomerDeliveryArrived(
  deliveryPhone: string
): Promise<string | null> {
  try {
    const { orders, agentConfig } = await import("@/db/schema");
    const { desc, and, inArray } = await import("drizzle-orm");
    
    // Buscar el último pedido pendiente o en preparación
    const [order] = await db
      .select({
        id: orders.id,
        phoneNumber: orders.phoneNumber,
        customerName: orders.customerName,
      })
      .from(orders)
      .where(
        and(
          inArray(orders.status, ["pending", "preparing"]),
        )
      )
      .orderBy(desc(orders.createdAt))
      .limit(1);

    if (!order?.phoneNumber) {
      // No hay pedidos pendientes — avisar al delivery
      const { sendWhatsAppMessage } = await import("@/lib/whatsapp/ycloud-client");
      const [cfg] = await db.select().from(agentConfig).where(eq(agentConfig.id, 1)).limit(1);
      const apiKey = process.env.YCLOUD_API_KEY || cfg?.ycloudApiKey || "";
      const from = process.env.WHATSAPP_PHONE_NUMBER || cfg?.phoneNumber || "";
      if (apiKey && from) {
        await sendWhatsAppMessage({ to: deliveryPhone, body: "Gracias, no hay pedidos pendientes.", apiKey, from });
      }
      return null;
    }

    // Enviar WhatsApp al cliente
    const { sendWhatsAppMessage } = await import("@/lib/whatsapp/ycloud-client");
    const [cfg] = await db.select().from(agentConfig).where(eq(agentConfig.id, 1)).limit(1);
    const apiKey = process.env.YCLOUD_API_KEY || cfg?.ycloudApiKey || "";
    const from = process.env.WHATSAPP_PHONE_NUMBER || cfg?.phoneNumber || "";
    
    const customerMsg = `¡Hola ${order.customerName || ""}! El delivery ya está afuera con tu pedido. Que lo disfrutes 🍔`.trim();
    
    if (apiKey && from) {
      await sendWhatsAppMessage({
        to: order.phoneNumber,
        body: customerMsg,
        apiKey,
        from,
      });
      console.log(`[delivery] Notified customer ${order.phoneNumber} about delivery arrival`);
    }

    return order.phoneNumber;
  } catch (error) {
    console.error("[delivery] Error notifying customer:", error);
    return null;
  }
}

/**
 * Reenvía la ubicación del cliente al número de delivery.
 */
export async function forwardLocationToDelivery(
  customerName: string | null,
  customerPhone: string,
  address: string,
  lat: number,
  lng: number,
  deliveryPhone: string
): Promise<boolean> {
  try {
    const { sendWhatsAppMessage } = await import("@/lib/whatsapp/ycloud-client");
    const { agentConfig } = await import("@/db/schema");
    const [cfg] = await db.select().from(agentConfig).where(eq(agentConfig.id, 1)).limit(1);
    const apiKey = process.env.YCLOUD_API_KEY || cfg?.ycloudApiKey || "";
    const from = process.env.WHATSAPP_PHONE_NUMBER || cfg?.phoneNumber || "";

    if (!apiKey || !from || !deliveryPhone) return false;

    const mapsLink = `https://www.google.com/maps?q=${lat},${lng}`;
    const message = [
      `📍 Cliente: ${customerName || "Sin nombre"}`,
      `Dirección: ${address}`,
      `Ubicación: ${mapsLink}`,
      `Tel: ${customerPhone}`,
    ].join("\n");

    await sendWhatsAppMessage({
      to: deliveryPhone,
      body: message,
      apiKey,
      from,
    });

    console.log(`[delivery] Location forwarded to ${deliveryPhone} for customer ${customerPhone}`);
    return true;
  } catch (error) {
    console.error("[delivery] Error forwarding location:", error);
    return false;
  }
}

// ─── Post-delivery followup ─────────────────────────────────────────────────

const FOLLOWUP_DELAY_MS = 30 * 60 * 1000; // 30 minutos

/**
 * Busca pedidos entregados hace >30min sin followup y envía mensaje.
 * Se llama desde el webhook POST (piggyback en tráfico existente).
 */
export async function sendPendingFollowups(): Promise<number> {
  try {
    const thirtyMinAgo = new Date(Date.now() - FOLLOWUP_DELAY_MS);

    // Buscar pedidos: deliveredAt < 30min ago AND followupSent = false
    const pendingOrders = await db
      .select({
        id: orders.id,
        phoneNumber: orders.phoneNumber,
        customerName: orders.customerName,
      })
      .from(orders)
      .where(
        and(
          eq(orders.status, "delivered"),
          lt(orders.deliveredAt, thirtyMinAgo),
          eq(orders.followupSent, false),
        )
      )
      .limit(5);

    if (pendingOrders.length === 0) return 0;

    const [cfg] = await db.select().from(agentConfig).where(eq(agentConfig.id, 1)).limit(1);
    const apiKey = process.env.YCLOUD_API_KEY || cfg?.ycloudApiKey || "";
    const from = process.env.WHATSAPP_PHONE_NUMBER || cfg?.phoneNumber || "";

    if (!apiKey || !from) {
      console.warn("[followup] Cannot send — missing YCloud credentials");
      return 0;
    }

    const { sendWhatsAppMessage } = await import("@/lib/whatsapp/ycloud-client");
    let sentCount = 0;

    for (const order of pendingOrders) {
      const name = order.customerName || "";
      const greeting = name ? `Hola ${name}` : "Hola";
      const message = `${greeting}, quería saber si todo estuvo bien con tu pedido. Cualquier cosa, acá estoy.`;

      try {
        await sendWhatsAppMessage({ to: order.phoneNumber, body: message, apiKey, from });
        await db.update(ordersTbl).set({ followupSent: true }).where(eq(ordersTbl.id, order.id));
        sentCount++;
        console.log(`[followup] Sent to ${order.phoneNumber} (order #${order.id})`);
      } catch (err) {
        console.error(`[followup] Failed for order #${order.id}:`, err);
      }
    }

    return sentCount;
  } catch (error) {
    console.error("[followup] Error checking pending followups:", error);
    return 0;
  }
}
